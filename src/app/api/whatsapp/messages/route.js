import { getWhatsAppHistory } from "@/lib/twilio";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");
    const channel = searchParams.get("channel") || "whatsapp";

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Get contact details
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Get thread with messages
    const thread = await prisma.thread.findFirst({
      where: {
        contactId: contact.id,
      },
      include: {
        messages: {
          where: {
            channel: channel, // Filter messages by channel
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ 
        messages: [],
        thread: null
      });
    }

    // Get WhatsApp-specific messages from Twilio if channel is whatsapp
    let externalMessages = [];
    if (channel === "whatsapp") {
      const whatsappHistory = await getWhatsAppHistory(contact.phone);
      if (whatsappHistory.success) {
        externalMessages = whatsappHistory.messages;
      }
    }

    // First, create a Map to track unique messages by their ID
    const uniqueMessages = new Map();

    // Add messages from our database
    thread.messages.forEach(msg => {
      uniqueMessages.set(msg.id, msg);
    });

    // Add messages from Twilio, but only if they're not already in our database
    externalMessages.forEach(msg => {
      if (!uniqueMessages.has(msg.id)) {
        uniqueMessages.set(msg.id, msg);
      }
    });

    // Convert back to array and sort
    const allMessages = Array.from(uniqueMessages.values())
      .sort((a, b) => new Date(a.dateCreated) - new Date(b.dateCreated));

    return NextResponse.json({
      success: true,
      thread: {
        id: thread.id,
        label: thread.label,
        createdAt: thread.createdAt,
      },
      messages: allMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 