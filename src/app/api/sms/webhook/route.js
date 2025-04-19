import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { Twilio } from "twilio";

const prisma = new PrismaClient();
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req) {
  try {
    // Parse incoming data (Twilio sends x-www-form-urlencoded)
    const data = await req.text();
    const params = new URLSearchParams(data);
    const from = params.get('From');
    const body = params.get('Body');
    const messageSid = params.get('MessageSid');
    const status = params.get('MessageStatus');

    console.log("Received SMS:", { from, body });

    // Database operations (with error handling)
    let contact;
    try {
      contact = await prisma.contact.findFirst({ where: { phone: from } });
      if (contact) {
        let thread = await prisma.thread.findFirst({ where: { contactId: contact.id } });
        if (!thread) {
          thread = await prisma.thread.create({
            data: { contactId: contact.id, userId: contact.userId || "system", label: "General" },
          });
        }
        await prisma.message.create({
          data: {
            threadId: thread.id,
            content: body,
            channel: "sms",
            direction: "inbound",
            status: status,
            metadata: { messageId: messageSid, twilioStatus: status },
          },
        });
      }
    } catch (prismaError) {
      console.error("Database error:", prismaError);
    }

    // TwiML response
    const twiml = new twilioClient.twiml.MessagingResponse();
    twiml.message("Thanks for your message!"); // Auto-reply to test
    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    const twiml = new twilioClient.twiml.MessagingResponse();
    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { "Content-Type": "text/xml" },
    });
  }
}