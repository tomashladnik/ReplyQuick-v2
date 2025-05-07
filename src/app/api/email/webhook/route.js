import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Verify Mailgun signature
const verifyWebhookSignature = (timestamp, token, signature) => {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    console.warn('MAILGUN_WEBHOOK_SIGNING_KEY not set, skipping signature verification');
    return true;
  }

  const hmac = crypto
    .createHmac('sha256', signingKey)
    .update(timestamp + token)
    .digest('hex');

  return hmac === signature;
};

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, x-mailgun-timestamp, x-mailgun-token, x-mailgun-signature',
    },
  });
}

// Handle POST webhook
export async function POST(req) {
  try {
    console.log('Webhook received at:', new Date().toISOString());

    const contentType = req.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      data = Object.fromEntries(new URLSearchParams(text));
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    // Signature verification
    const timestamp = req.headers.get('x-mailgun-timestamp');
    const token = req.headers.get('x-mailgun-token');
    const signature = req.headers.get('x-mailgun-signature');

    if (timestamp && token && signature) {
      if (!verifyWebhookSignature(timestamp, token, signature)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Extract fields
    const from = data.from || data.sender || '';
    const to = data.to || data.recipient || '';
    const subject = data.subject || '';
    const messageId = data['Message-Id'] || data['message-id'] || data.message_id || '';
    const text = data['body-plain'] || data.text || '';
    const html = data['body-html'] || data.html || '';
    const event = data.event || data.type || '';

    // Extract email from the from field
    const extractEmail = (fromField) => {
      const match = fromField.match(/<([^>]+)>/);
      return match ? match[1] : fromField;
    };

    // Clean email content by removing quoted/replied message history
    const cleanEmailContent = (content) => {
      if (!content) return '';
      
      // Remove common email reply patterns
      const patterns = [
        /On.*wrote:.*$/s,  // Matches "On [date] [name] wrote:" and everything after
        /Sent via QuickReply.*$/s,  // Matches "Sent via QuickReply" and everything after
        /From:.*$/s,  // Matches "From:" and everything after
        /^>.*$/gm,  // Matches lines starting with ">"
        /^On.*\n.*wrote:.*$/s,  // Matches "On [date]\n[name] wrote:" pattern
        /^>.*\n.*$/s,  // Matches quoted blocks
        /^.*\n>.*$/s,  // Matches lines followed by quoted content
        /^.*\nOn.*wrote:.*$/s,  // Matches content followed by "On ... wrote:"
      ];

      let cleanedContent = content;
      patterns.forEach(pattern => {
        cleanedContent = cleanedContent.replace(pattern, '');
      });

      // Remove multiple newlines and trim
      return cleanedContent.replace(/\n{3,}/g, '\n\n').trim();
    };

    const fromEmail = extractEmail(from);

    console.log('Parsed email:', {
      event,
      from,
      fromEmail,
      to,
      subject,
      messageId,
      hasText: !!text,
      hasHtml: !!html,
    });

    // Handle incoming email (no event but has message content)
    if (!event && (text || html)) {
      const contact = await prisma.contact.findFirst({ where: { email: fromEmail } });
      console.log('Contact:', contact);
      if (!contact) {
        console.log(`No contact found for email: ${fromEmail}`);
        return NextResponse.json({ success: true });
      }

      let thread = await prisma.thread.findFirst({ where: { contactId: contact.id } });

      if (!thread) {
        thread = await prisma.thread.create({
          data: {
            contactId: contact.id,
            userId: contact.userId || 'system',
            label: 'General',
          },
        });
        console.log('Created thread:', thread.id);
      }

      // Clean the content before storing
      const cleanedText = cleanEmailContent(text);
      const cleanedHtml = cleanEmailContent(html);
      const content = cleanedText || cleanedHtml || subject;

      const message = await prisma.message.create({
        data: {
          threadId: thread.id,
          content,
          channel: 'email',
          direction: 'inbound',
          status: 'delivered',
          metadata: {
            from,
            to,
            subject,
            messageId,
            rawData: data,
          },
        },
      });

      console.log('Stored inbound message:', message.id);
    } else {
      // Handle Mailgun events
      switch (event) {
        case 'delivered':
        case 'email.delivered':
          await prisma.message.updateMany({
            where: {
              metadata: {
                path: ['messageId'],
                equals: messageId,
              },
            },
            data: { status: 'delivered' },
          });
          break;
        case 'opened':
        case 'email.opened':
          await prisma.message.updateMany({
            where: {
              metadata: {
                path: ['messageId'],
                equals: messageId,
              },
            },
            data: { status: 'read' },
          });
          break;
        case 'clicked':
        case 'email.clicked':
          console.log('Email clicked event (optional logging)');
          break;
        default:
          console.log('Unhandled event type:', event);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
