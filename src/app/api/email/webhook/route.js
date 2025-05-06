import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

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
    
    const data = await req.json();
    console.log('Raw webhook data:', JSON.stringify(data, null, 2));

    // Extract email details from the webhook data
    const { type, data: emailData } = data;
    
    // Skip if not an email event
    if (!type?.startsWith('email.')) {
      console.log('Not an email event, skipping:', type);
      return NextResponse.json({ success: true });
    }

    // Extract email details based on event type
    const from = emailData?.from || '';
    const to = emailData?.to?.[0] || '';
    const subject = emailData?.subject || '';
    const emailId = emailData?.email_id || '';

    console.log('Processed email details:', {
      type,
      from,
      to,
      subject,
      emailId
    });

    // Handle different email event types
    switch (type) {
      case 'email.sent':
        console.log('Email sent event received');
        // Update message status to 'sent' if we have the emailId
        if (emailId) {
          await prisma.message.updateMany({
            where: {
              metadata: {
                path: ['emailId'],
                equals: emailId
              }
            },
            data: {
              status: 'sent'
            }
          });
        }
        break;

      case 'email.delivered':
        console.log('Email delivered event received');
        // Update message status to 'delivered' if we have the emailId
        if (emailId) {
          await prisma.message.updateMany({
            where: {
              metadata: {
                path: ['emailId'],
                equals: emailId
              }
            },
            data: {
              status: 'delivered'
            }
          });
        }
        break;

      case 'email.received':
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
          return NextResponse.json({ success: true }); // Still return success to Resend
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

        // Store incoming message
        const message = await prisma.message.create({
          data: {
            threadId: thread.id,
            content: emailData.text || emailData.html || subject, // Use text/html content or fallback to subject
            channel: 'email',
            direction: 'inbound',
            status: 'delivered',
            metadata: {
              subject: subject,
              from: from,
              to: to,
              emailId: emailId,
              rawData: data
            },
          },
        });

        console.log('Stored new message:', message.id);
        break;

      default:
        console.log('Unhandled email event type:', type);
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