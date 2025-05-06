import { sendEmail } from '@/lib/email';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { message, contactId } = await req.json();

    if (!message || !contactId) {
      return NextResponse.json(
        { error: 'Message and contact ID are required' },
        { status: 400 }
      );
    }

    // Get contact details
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    if (!contact.email) {
      return NextResponse.json(
        { error: 'Contact does not have an email address' },
        { status: 400 }
      );
    }

    // Send email
    const result = await sendEmail(
      contact.email,
      'New Message from QuickReply',
      `<div>
        <p>${message}</p>
        <p>Sent via QuickReply</p>
      </div>`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Find or create a thread for this contact
    let thread = await prisma.thread.findFirst({
      where: {
        contactId: contact.id,
      },
    });

    if (!thread) {
      // Get the user associated with this contact
      const user = await prisma.user.findFirst({
        where: {
          contacts: {
            some: {
              id: contact.id
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'No user found associated with this contact' },
          { status: 404 }
        );
      }

      thread = await prisma.thread.create({
        data: {
          contactId: contact.id,
          userId: user.id,
          label: 'General',
        },
      });
    }

    // Save the message to the database
    await prisma.message.create({
      data: {
        content: message,
        threadId: thread.id,
        channel: 'email',
        direction: 'outbound',
        status: 'sent',
      },
    });

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Error in email/send route:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 