import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Verify Mailgun webhook signature
const verifyWebhookSignature = (timestamp, token, signature) => {
  if (!process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
    console.warn('MAILGUN_WEBHOOK_SIGNING_KEY not set, skipping signature verification');
    return true;
  }

  const encodedToken = crypto
    .createHmac('sha256', process.env.MAILGUN_WEBHOOK_SIGNING_KEY)
    .update(timestamp.concat(token))
    .digest('hex');
  return encodedToken === signature;
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mailgun-timestamp, x-mailgun-token, x-mailgun-signature',
    },
  });
}

export async function POST(req) {
  try {
    console.log('Webhook received at:', new Date().toISOString());
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get the raw body for signature verification
    const rawBody = await req.text();
    console.log('Raw webhook body:', rawBody);
    
    let data;
    try {
      // Try parsing as JSON first
      data = JSON.parse(rawBody);
      console.log('Parsed JSON data:', data);
    } catch (jsonError) {
      console.log('Failed to parse as JSON, trying form data');
      try {
        // If JSON parsing fails, try parsing as form data
        const formData = new URLSearchParams(rawBody);
        data = Object.fromEntries(formData.entries());
        console.log('Parsed form data:', data);
      } catch (formError) {
        console.error('Failed to parse webhook body:', { jsonError, formError });
        return NextResponse.json({ error: 'Invalid webhook body format' }, { status: 400 });
      }
    }

    // Verify webhook signature if Mailgun headers are present
    const timestamp = req.headers.get('x-mailgun-timestamp');
    const token = req.headers.get('x-mailgun-token');
    const signature = req.headers.get('x-mailgun-signature');

    if (timestamp && token && signature) {
      if (!verifyWebhookSignature(timestamp, token, signature)) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    } else {
      console.log('Mailgun signature headers not present, proceeding with caution');
    }

    // Extract email details from the webhook data
    // For incoming emails, we need to handle both the sender and recipient
    const from = data.sender || data.from || data['sender'] || data['From'] || '';
    const to = data.recipient || data.to || data['recipient'] || data['To'] || '';
    const subject = data.subject || data['Subject'] || '';
    const messageId = data['Message-Id'] || data.message_id || data['message-id'] || '';
    const text = data['body-plain'] || data.text || data['body_plain'] || '';
    const html = data['body-html'] || data.html || data['body_html'] || '';
    const event = data.event || data.type || data['Event'] || '';

    console.log('Processed email details:', {
      event,
      from,
      to,
      subject,
      messageId,
      hasText: !!text,
      hasHtml: !!html,
      rawData: data
    });

    // For incoming emails, we'll treat them as 'inbound' events
    if (!event && (text || html)) {
      console.log('Processing as incoming email');
      
      // Find contact by email
      const contact = await prisma.contact.findFirst({
        where: {
          email: from,
        },
      });

      console.log('Contact lookup result:', contact ? 'Found' : 'Not found');

      if (!contact) {
        console.log('Contact not found for email:', from);
        return NextResponse.json({ success: true }); // Still return success to Mailgun
      }

      // Find or create thread
      let thread = await prisma.thread.findFirst({
        where: {
          contactId: contact.id,
        },
      });

      console.log('Thread lookup result:', thread ? 'Found' : 'Not found');

      if (!thread) {
        thread = await prisma.thread.create({
          data: {
            contactId: contact.id,
            userId: contact.userId || 'system',
            label: 'General',
          },
        });
        console.log('Created new thread:', thread.id);
      }

      // Extract the actual message content
      let messageContent = '';
      if (text) {
        messageContent = text;
      } else if (html) {
        // If only HTML is available, use it
        messageContent = html;
      } else {
        // If no content is available, use the subject
        messageContent = subject;
      }

      console.log('Message content:', messageContent);

      // Store incoming message
      const message = await prisma.message.create({
        data: {
          threadId: thread.id,
          content: messageContent,
          channel: 'email',
          direction: 'inbound',
          status: 'delivered',
          metadata: {
            subject: subject,
            from: from,
            to: to,
            messageId: messageId,
            rawData: data
          },
        },
      });

      console.log('Stored new message:', message.id);
    } else {
      // Handle other event types
      switch (event) {
        case 'delivered':
        case 'email.delivered':
          console.log('Email delivered event received');
          if (messageId) {
            await prisma.message.updateMany({
              where: {
                metadata: {
                  path: ['messageId'],
                  equals: messageId
                }
              },
              data: {
                status: 'delivered'
              }
            });
          }
          break;

        case 'opened':
        case 'email.opened':
          console.log('Email opened event received');
          if (messageId) {
            await prisma.message.updateMany({
              where: {
                metadata: {
                  path: ['messageId'],
                  equals: messageId
                }
              },
              data: {
                status: 'read'
              }
            });
          }
          break;

        case 'clicked':
        case 'email.clicked':
          console.log('Email clicked event received');
          break;

        default:
          console.log('Unhandled email event type:', event);
          console.log('Full webhook data:', data);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing email webhook:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 