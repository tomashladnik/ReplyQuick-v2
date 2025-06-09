import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const webhookData = await req.json();
    
    // Extract caller information from Retell webhook
    const {
      session_id,
      caller_number,
      timestamp,
      channel_type = "phone_call"
    } = webhookData;

    // Try to find existing contact by phone number
    let contact = await prisma.contact.findFirst({
      where: {
        phone: caller_number
      }
    });

    // If contact doesn't exist, create a new one
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          Name: `Unknown Caller (${caller_number})`,
          phone: caller_number,
          source: "inbound_call",
          status: "new"
        }
      });
    }

    // Create a new call record
    const call = await prisma.call.create({
      data: {
        sessionId: session_id,
        contactId: contact.id,
        userId: contact.userId || null, // If contact has an assigned user
        direction: "inbound",
        channelType: channel_type,
        startTime: new Date(timestamp),
        status: "in-progress"
      }
    });

    return NextResponse.json({ 
      success: true, 
      contact,
      call
    });

  } catch (error) {
    console.error("Inbound call processing error:", error);
    return NextResponse.json(
      { error: "Failed to process inbound call" },
      { status: 500 }
    );
  }
} 