import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Get all messages for this contact
    const messages = await prisma.message.findMany({
      where: {
        thread: {
          contactId: contactId
        },
        channel: 'email'
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        thread: true
      }
    });

    // Transform messages to include AI response information
    const transformedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      direction: message.direction,
      status: message.status,
      createdAt: message.createdAt,
      threadId: message.threadId,
      is_ai_response: message.metadata?.isAIResponse || false,
      subject: message.metadata?.subject || 'No Subject'
    }));

    return NextResponse.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Error in email/messages route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email messages' },
      { status: 500 }
    );
  }
} 