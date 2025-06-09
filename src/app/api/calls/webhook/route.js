import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Helper function to log webhook events
function logWebhookEvent(event, data, error = null) {
  const timestamp = new Date().toISOString();
  console.log('📞 Webhook Event:', {
    timestamp,
    event,
    sessionId: data?.session_id,
    status: error ? 'error' : 'success',
    data: data,
    error: error?.message
  });
}

// Helper function to create or find contact
async function findOrCreateContact(phoneNumber, name = null, userId = null) {
  try {
    // Try to find existing contact
    let contact = await prisma.contact.findFirst({
      where: { phone: phoneNumber }
    });

    // If contact doesn't exist, create a new one
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          Name: name || `Unknown Caller (${phoneNumber})`,
          phone: phoneNumber,
          source: "inbound_call",
          status: "new",
          userId: userId // This will be null for unknown callers initially
        }
      });
      logWebhookEvent('contact_created', { phoneNumber, contactId: contact.id });
    }

    return contact;
  } catch (error) {
    logWebhookEvent('contact_error', { phoneNumber }, error);
    throw error;
  }
}

// Helper function to create a new call record
async function createCallRecord(contactId, webhookData) {
  const {
    session_id,
    call_id,
    timestamp,
    channel_type = "phone_call",
    direction = "inbound"
  } = webhookData;

  return await prisma.call.create({
    data: {
      contactId,
      sessionId: session_id,
      callSid: call_id,
      direction,
      status: "in-progress",
      startTime: new Date(timestamp),
      channelType: channel_type,
      userId: null // Will be updated later if assigned to a user
    }
  });
}

export async function POST(req) {
  try {
    const webhookData = await req.json();
    
    // Extract all relevant information from webhook
    const {
      session_id,
      call_id,
      from_number,
      to_number,
      direction,
      event_type,
      transcript_text,
      summary,
      user_sentiment,
      recording_url,
      public_log_url,
      qualification,
      duration,
      status
    } = webhookData;

    // Try to find existing contact
    let contact = await prisma.contact.findFirst({
      where: {
        phone: from_number
      }
    });

    // If contact doesn't exist, create a new one
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          Name: `Lead from ${from_number}`,
          phone: from_number,
          source: "inbound_call",
          status: "new",
          category: "Inbound Lead"
        }
      });
    }

    // Find existing call or create/update it
    let call = await prisma.call.upsert({
      where: {
        sessionId: session_id
      },
      create: {
        sessionId: session_id,
        callSid: call_id,
        contactId: contact.id,
        direction,
        status: status || "in-progress",
        startTime: new Date(),
        transcriptText: transcript_text,
        summary,
        userSentiment: user_sentiment,
        recordingUrl: recording_url,
        publicLogUrl: public_log_url,
        qualification,
        duration: duration || 0
      },
      update: {
        status: status,
        transcriptText: transcript_text,
        summary,
        userSentiment: user_sentiment,
        recordingUrl: recording_url,
        publicLogUrl: public_log_url,
        qualification,
        duration,
        endTime: status === "completed" ? new Date() : undefined
      }
    });

    return NextResponse.json({
      success: true,
      contact,
      call
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Test endpoint to verify webhook is active
export async function GET() {
  return NextResponse.json({
    status: "Webhook endpoint active",
    timestamp: new Date().toISOString(),
    message: "Ready to receive Retell.ai webhooks"
  });
}