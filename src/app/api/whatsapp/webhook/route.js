import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const messageSid = formData.get("MessageSid");
    const from = formData.get("From");
    const body = formData.get("Body");
    const status = formData.get("MessageStatus");

    // Remove 'whatsapp:' prefix from the phone number
    const phoneNumber = from.replace("whatsapp:", "");

    // Find contact by phone number
    const contact = await prisma.contact.findFirst({
      where: {
        phone: phoneNumber,
      },
    });

    if (!contact) {
      console.log("Contact not found for phone number:", phoneNumber);
      return NextResponse.json({ success: true }); // Still return success to Twilio
    }

    // Create or get thread
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
        },
      });
    }

    // Store incoming message
    await prisma.message.create({
      data: {
        threadId: thread.id,
        content: body,
        channel: "whatsapp",
        direction: "inbound",
        status: status,
        metadata: {
          messageId: messageSid,
          twilioStatus: status,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
} 