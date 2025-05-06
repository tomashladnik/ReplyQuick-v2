import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Find the thread for this contact
    const thread = await prisma.thread.findFirst({
      where: {
        contactId: contactId,
      },
    });

    if (!thread) {
      return NextResponse.json({ messages: [] });
    }

    // Get all messages for this thread
    const messages = await prisma.message.findMany({
      where: {
        threadId: thread.id,
        channel: 'email',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error in email/messages route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 