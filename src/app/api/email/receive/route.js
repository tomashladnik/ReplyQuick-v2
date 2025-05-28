import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { 
      from,
      subject,
      body,
      receivedTime,
      messageId
    } = await req.json();

    if (!from || !body) {
      return NextResponse.json(
        { error: 'From email and body are required' },
        { status: 400 }
      );
    }

    // Check if the user exists
    let user = await prisma.user.findFirst({
      where: {
        email: from
      }
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: from,
          name: from.split('@')[0], // Basic name from email
          role: 'USER'
        }
      });

      // Create a contact for this user
      await prisma.contact.create({
        data: {
          email: from,
          name: from.split('@')[0],
          userId: user.id
        }
      });
    }

    // Create or find thread
    let thread = await prisma.thread.findFirst({
      where: {
        userId: user.id
      }
    });

    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          userId: user.id,
          label: 'Incoming',
        }
      });
    }

    // Save the incoming message
    const message = await prisma.message.create({
      data: {
        content: body,
        threadId: thread.id,
        channel: 'email',
        direction: 'inbound',
        status: 'pending_approval',
        metadata: {
          subject,
          receivedTime,
          originalMessageId: messageId
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      messageId: message.id,
      userId: user.id,
      threadId: thread.id
    });
  } catch (error) {
    console.error('Error in email/receive route:', error);
    return NextResponse.json(
      { error: 'Failed to process incoming email' },
      { status: 500 }
    );
  }
} 