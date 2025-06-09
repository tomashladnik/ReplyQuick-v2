import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const messageSid = formData.get("MessageSid");
    const from = formData.get("From");
    const to = formData.get("To"); // Get the 'to' number which is our WhatsApp number
    const body = formData.get("Body");
    const status = formData.get("MessageStatus");

    // Remove 'whatsapp:' prefix from the phone numbers
    const fromNumber = from.replace("whatsapp:", "");
    const toNumber = to.replace("whatsapp:", "");

    // Find the user associated with the WhatsApp number
    const user = await prisma.user.findFirst({
      where: {
        phone: toNumber // Assuming user's phone number matches the WhatsApp number
      }
    });

    if (!user) {
      console.log("No user found for WhatsApp number:", toNumber);
      return NextResponse.json({ error: "No user found for this number" }, { status: 404 });
    }

    // Find contact by phone number under this user
    let contact = await prisma.contact.findFirst({
      where: {
        phone: fromNumber,
        userId: user.id
      },
    });

    if (!contact) {
      // Create new contact associated with the user
      contact = await prisma.contact.create({
        data: {
          phone: fromNumber,
          Name: `Unknown (${fromNumber})`,
          userId: user.id,
          source: "whatsapp_webhook",
          status: "pending"
        },
      });
    }

    // Find or create thread
    let thread = await prisma.thread.findFirst({
      where: {
        contactId: contact.id,
        userId: user.id
      },
    });

    if (!thread) {
      thread = await prisma.thread.create({
        data: {
          contactId: contact.id,
          userId: user.id,
          label: "WhatsApp",
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
        status: status || "received",
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