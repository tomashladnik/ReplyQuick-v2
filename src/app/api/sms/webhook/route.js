import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import twilio from "twilio";

const prisma = new PrismaClient();

export async function POST(req) {
  // Initialize Twilio client INSIDE the handler
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    // Parse incoming data
    const data = await req.text();
    const params = new URLSearchParams(data);
    const from = params.get('From');
    const body = params.get('Body');
    const messageSid = params.get('MessageSid');
    const status = params.get('MessageStatus');

    console.log("Received SMS:", { from, body });

    // Database operations
    let contact;
    try {
      contact = await prisma.contact.findFirst({ where: { phone: from } });
      if (contact) {
        // ... (rest of your Prisma code remains the same)
      }
    } catch (prismaError) {
      console.error("Database error:", prismaError);
    }

    // TwiML response - THIS IS THE CRITICAL FIX
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("aagaya ha");
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