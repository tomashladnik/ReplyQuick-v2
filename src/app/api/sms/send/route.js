import { sendSMS } from "@/lib/twilio";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { message, contactId } = await req.json();

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

    // Send SMS message
    const result = await sendSMS(contact.phone, message);

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
          { error: "No user found associated with this contact" },
          { status: 404 }
        );
      }

      thread = await prisma.thread.create({
        data: {
          contactId: contact.id,
          userId: user.id,
          label: "General",
        },
      });
    }

    // Store the message in the thread
    const storedMessage = await prisma.message.create({
      data: {
        threadId: thread.id,
        content: message,
        channel: "sms",
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
    console.error("Error sending SMS message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
} 