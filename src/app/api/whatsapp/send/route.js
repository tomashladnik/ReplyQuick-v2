import { sendWhatsAppMessage } from "@/lib/twilio";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    console.log("inside send whatsapp message");
    const { message, contactId } = await req.json();
    console.log("message",message);
    console.log("contactId",contactId);
    if (!message || !contactId) {
      return NextResponse.json(
        { error: "Message and contact ID are required" },
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

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(contact.phone, message);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send message" },
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
      thread = await prisma.thread.create({
        data: {
          contactId: contact.id,
          userId: contact.userId || "system",
          label: "General", // Default label, can be updated based on context
        },
      });
    }

    // Store the message in the thread
    const storedMessage = await prisma.message.create({
      data: {
        threadId: thread.id,
        content: message,
        channel: "whatsapp",
        direction: "outbound",
        status: result.status,
        metadata: {
          messageId: result.messageId,
          twilioStatus: result.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: storedMessage,
      thread: {
        id: thread.id,
        label: thread.label,
      },
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 