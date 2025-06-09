import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import twilio from "twilio";

const prisma = new PrismaClient();

export async function POST(req) {
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const data = await req.text();
    const params = new URLSearchParams(data);
    const from = params.get("From");
    const body = params.get("Body");
    const messageSid = params.get("MessageSid");
    const status = params.get("MessageStatus");
    const to = params.get("To"); // Get the 'to' number which is our Twilio number

    console.log("Received SMS:", { from, to, body });

    // Find the user associated with the Twilio number
    const user = await prisma.user.findFirst({
      where: {
        phone: to // Assuming user's phone number matches the Twilio number
      }
    });

    if (!user) {
      console.log("No user found for Twilio number:", to);
      return NextResponse.json({ error: "No user found for this number" }, { status: 404 });
    }

    let contact = await prisma.contact.findFirst({
      where: { 
        phone: from,
        userId: user.id // Look for contact under this specific user
      },
    });

    if (!contact) {
      // Create new contact associated with the user
      contact = await prisma.contact.create({
        data: {
          phone: from,
          Name: `Unknown (${from})`,
          userId: user.id, // Associate with the user
          source: "sms_webhook",
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
          label: "SMS",
        },
      });
    }

    // Create the message in the thread
    await prisma.message.create({
      data: {
        threadId: thread.id,
        content: body,
        channel: "sms",
        direction: "inbound",
        status: status || "received",
        metadata: {
          messageId: messageSid,
          twilioStatus: status,
        },
      },
    });

    // Forward data to n8n for automatic reply logic
    await fetch("https://replyquickai.app.n8n.cloud/webhook/a10803f8-d1f7-4d14-979b-b6c12885e2f3/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        body,
        contactId: contact.id,
        userId: user.id,
      }),
    });

    // Optional static reply as fallback
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Thank you! We're processing your request.");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error processing SMS webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
