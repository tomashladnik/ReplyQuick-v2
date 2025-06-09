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

export async function GET() {
  try {
    // Get all inbound calls with contact details
    const inboundCalls = await prisma.call.findMany({
      where: {
        direction: "inbound"
      },
      include: {
        contact: true
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // Format the response
    const formattedCalls = inboundCalls.map(call => ({
      id: call.id,
      sessionId: call.sessionId,
      contactName: call.contact?.Name || 'Unknown Caller',
      phoneNumber: call.contact?.phone || 'No Phone',
      startTime: call.startTime,
      duration: call.duration,
      status: call.status,
      transcriptText: call.transcriptText,
      summary: call.summary,
      userSentiment: call.userSentiment,
      recordingUrl: call.recordingUrl,
      publicLogUrl: call.publicLogUrl,
      qualification: call.qualification,
      isNewContact: call.contact?.source === "inbound_call" && call.contact?.status === "new"
    }));

    return NextResponse.json({ calls: formattedCalls });
  } catch (error) {
    console.error("Error fetching inbound calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch inbound calls" },
      { status: 500 }
    );
  }
} 