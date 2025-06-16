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
        status: "in-progress",
        startTime: new Date(timestamp),
        sentAt: new Date(timestamp),
        endTime: null,
        duration: null,
        recordingUrl: null,
        publicLogUrl: null,
        disconnectionReason: null,
        cost: null,
        transcriptText: null,
        summary: null,
        qualification: null,
        userSentiment: null,
        callSid: null // Will be updated when webhook receives it
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
        contacts: true
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    // Format the response
    const formattedCalls = inboundCalls.map(call => ({
      id: call.id,
      sessionId: call.sessionId,
      contactName: call.contacts?.Name || 'Unknown Caller',
      phoneNumber: call.contacts?.phone || 'No Phone',
      startTime: call.startTime,
      duration: call.duration,
      status: call.status,
      transcriptText: call.transcriptText,
      summary: call.summary,
      userSentiment: call.userSentiment,
      recordingUrl: call.recordingUrl,
      publicLogUrl: call.publicLogUrl,
      qualification: call.qualification,
      isNewContact: call.contacts?.source === "inbound_call" && call.contacts?.status === "new"
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