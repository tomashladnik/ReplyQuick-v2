import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Verify Mailgun webhook signature
const verifyWebhookSignature = (timestamp, token, signature) => {
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req) {
  try {
    console.log('Webhook received at:', new Date().toISOString());
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Verify webhook signature
    const timestamp = req.headers.get('x-mailgun-timestamp');
    const token = req.headers.get('x-mailgun-token');
    const signature = req.headers.get('x-mailgun-signature');

    if (!timestamp || !token || !signature) {
      console.error('Missing webhook signature headers');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    if (!verifyWebhookSignature(timestamp, token, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());
    console.log('Raw webhook data:', JSON.stringify(data, null, 2));

    // Extract email details from the webhook data
    const from = data.sender || '';
    const to = data.recipient || '';
    const subject = data.subject || '';
    const messageId = data['Message-Id'] || '';
    const text = data['body-plain'] || '';
    const html = data['body-html'] || '';
    const event = data.event || '';

    console.log('Processed email details:', {
      event,
      from,
      to,
      subject,
      messageId,
      hasText: !!text,
      hasHtml: !!html
    });

    // Handle different email event types
    switch (event) {
      case 'delivered':
        console.log('Email delivered event received');
        // Update message status to 'delivered' if we have the messageId
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
        console.log('Email opened event received');
        // Update message status to 'read' if we have the messageId
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
        console.log('Email clicked event received');
        // You can track link clicks if needed
        break;

      case 'inbound':
        console.log('Email received event - processing reply');
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
        break;

      default:
        console.log('Unhandled email event type:', event);
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