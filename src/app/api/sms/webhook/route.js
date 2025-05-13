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

    console.log("Received SMS:", { from, body });

    let contact = await prisma.contact.findFirst({
      where: { phone: from },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          phone: from,
          name: `Unknown (${from})`,
        },
      });
    }

    await prisma.message.create({
      data: {
        content: body,
        direction: "INBOUND",
        status: status || "received",
        contactId: contact.id,
        messageSid: messageSid,
      },
    });

    // 🔄 Forward data to n8n for automatic reply logic
    await fetch("https://n8n-1-h79c.onrender.com/webhook/9da0bdca-824b-48c3-87aa-eb121e51ba2e/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        body,
        contactId: contact.id,
      }),
    });

    // 🟡 Optional static reply as fallback
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Thank you! We're processing your request.");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const twiml = new twilio.twiml.MessagingResponse();
    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
