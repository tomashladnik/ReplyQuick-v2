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
      userId: null // Will be updated later if assigned to a user
    }
  });
}

export async function POST(req) {
  try {
    const webhookData = await req.json();
    console.log("Webhook event received:", webhookData);
    
    // Extract all relevant information from webhook
    const {
      call_id,
      from_number,
      to_number,
      direction,
      call_status,
      start_timestamp,
      end_timestamp,
      duration_ms,
      transcript,
      public_log_url,
      disconnection_reason,
      call_cost,
      call_analysis,
      metadata,
      telephony_identifier
    } = webhookData;

    // Try to find existing contact by phone number (use to_number for outbound calls)
    const contactPhone = direction === "outbound" ? to_number : from_number;
    let contact = await prisma.contact.findFirst({
      where: {
        phone: contactPhone || metadata?.contactInfo?.phone
      }
    });

    // If contact doesn't exist, create a new one
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          Name: metadata?.contactInfo?.name || `Lead from ${contactPhone}`,
          phone: contactPhone || metadata?.contactInfo?.phone,
          email: metadata?.contactInfo?.email,
          source: direction === "inbound" ? "inbound_call" : "outbound_call",
          status: "new",
          category: metadata?.contactInfo?.category || "General",
          userId: metadata?.userId // Associate with user if available
        }
      });
    }

    // Try to find existing call by callSid first
    let call = await prisma.call.findFirst({
      where: {
        callSid: call_id
      }
    });

    // If call exists, update it
    if (call) {
      call = await prisma.call.update({
        where: {
          id: call.id
        },
        data: {
          callSid: call_id,
          status: call_status || "completed",
          startTime: new Date(start_timestamp),
          endTime: end_timestamp ? new Date(end_timestamp) : undefined,
          transcriptText: transcript || null,
          summary: call_analysis?.call_summary || null,
          userSentiment: call_analysis?.user_sentiment || "Unknown",
          qualification: call_analysis?.call_successful ? "qualified" : "not_qualified",
          recordingUrl: null, // Will be updated when recording is ready
          publicLogUrl: public_log_url,
          disconnectionReason: disconnection_reason,
          duration: Math.floor(duration_ms / 1000) || 0,
          cost: call_cost?.combined_cost || 0,
          userId: metadata?.userId || call.userId
        }
      });
    } else {
      // Create new call record if not found
      call = await prisma.call.create({
        data: {
          callSid: call_id,
          contactId: contact.id,
          userId: metadata?.userId,
          direction: direction || "inbound",
          status: call_status || "in-progress",
          startTime: new Date(start_timestamp),
          endTime: end_timestamp ? new Date(end_timestamp) : undefined,
          sentAt: new Date(start_timestamp),
          transcriptText: transcript || null,
          summary: call_analysis?.call_summary || null,
          userSentiment: call_analysis?.user_sentiment || "Unknown",
          qualification: call_analysis?.call_successful ? "qualified" : "not_qualified",
          publicLogUrl: public_log_url,
          disconnectionReason: disconnection_reason,
          duration: Math.floor(duration_ms / 1000) || 0,
          cost: call_cost?.combined_cost || 0
        }
      });
    }

    // Log the webhook processing
    logWebhookEvent('call_analyzed', {
      callId: call.id,
      status: call_status,
      disconnectionReason: disconnection_reason,
      duration: duration_ms,
      callCost: call_cost?.combined_cost
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