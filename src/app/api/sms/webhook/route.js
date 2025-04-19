import { PrismaClient } from "@prisma/client";
import { Twilio } from "twilio";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const formData = await req.formData();
    const messageSid = formData.get("MessageSid");
    const from = formData.get("From");
    const body = formData.get("Body");
    const status = formData.get("MessageStatus");

    console.log("Received SMS webhook:", { messageSid, from, body, status });

    // Find contact by phone number
    const contact = await prisma.contact.findFirst({
      where: {
        phone: from,
      },
    });

    if (!contact) {
      console.log("Contact not found for phone number:", from);
    } else {
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
            label: "General",
          },
        });
      }

      // Store incoming message
      await prisma.message.create({
        data: {
          threadId: thread.id,
          content: body,
          channel: "sms",
          direction: "inbound",
          status: status,
          metadata: {
            messageId: messageSid,
            twilioStatus: status,
          },
        },
      });
    }

    // Return TwiML response
    const twiml = new Twilio.twiml.MessagingResponse();
    // Optionally, you can add a reply message:
    // twiml.message("Thanks for your message! We'll get back to you soon.");
    const response = new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });

    return response;
  } catch (error) {
    console.error("Error processing SMS webhook:", error);

    // Return TwiML even in case of error to avoid Twilio retrying
    const twiml = new Twilio.twiml.MessagingResponse();
    const response = new NextResponse(twiml.toString(), {
      status: 500,
      headers: { "Content-Type": "text/xml" },
    });

    return response;
  }
}