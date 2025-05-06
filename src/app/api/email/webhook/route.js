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

    // Extract email details - Resend sends data in a different format
    const { from, to, subject, text, html, type, record } = data;
    
    // Log the extracted data
    console.log('Extracted email details:', {
      from,
      to,
      subject,
      hasText: !!text,
      hasHtml: !!html,
      type,
      record
    });

    // Handle Resend's webhook format
    const emailData = type === 'email.received' ? record : data;
    const senderEmail = emailData.from?.email || from;
    const recipientEmail = emailData.to?.[0]?.email || to;

    console.log('Processed email details:', {
      senderEmail,
      recipientEmail,
      subject: emailData.subject || subject
    });

    // Find contact by email
    const contact = await prisma.contact.findFirst({
      where: {
        email: senderEmail,
      },
    });

    console.log('Contact lookup result:', contact ? 'Found' : 'Not found');

    if (!contact) {
      console.log('Contact not found for email:', senderEmail);
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
        content: emailData.text || emailData.html || text || html, // Try all possible content fields
        channel: 'email',
        direction: 'inbound',
        status: 'delivered',
        metadata: {
          subject: emailData.subject || subject,
          from: senderEmail,
          to: recipientEmail,
          rawData: data // Store the raw data for debugging
        },
      },
    });

    console.log('Stored new message:', message.id);

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