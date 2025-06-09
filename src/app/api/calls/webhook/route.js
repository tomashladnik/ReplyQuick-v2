import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Helper function to log webhook events
function logWebhookEvent(event, data, error = null) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    event,
    sessionId: data?.session_id,
    status: error ? 'error' : 'success',
    data: data,
    error: error?.message
  };
  
  console.log('📞 Webhook Event Log:', JSON.stringify(logData, null, 2));
}

export async function POST(req) {
  try {
    const webhookData = await req.json();
    logWebhookEvent('received', webhookData);

    const {
      session_id,
      event_type,
      caller_number,
      timestamp,
      duration,
      channel_type = "phone_call",
      cost,
      session_status,
      user_sentiment,
      end_status,
      transcript,
      summary,
      recording_url,
      public_log_url
    } = webhookData;

    // Handle new inbound call
    if (event_type === "call_initiated" && caller_number) {
      logWebhookEvent('inbound_call_processing', { caller_number, session_id });
      
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
        logWebhookEvent('new_contact_created', { contactId: contact.id, phone: caller_number });
      } else {
        logWebhookEvent('existing_contact_found', { contactId: contact.id, phone: caller_number });
      }

      // Create a new call record
      const call = await prisma.call.create({
        data: {
          sessionId: session_id,
          contactId: contact.id,
          userId: contact.userId || null,
          direction: "inbound",
          channelType: channel_type,
          startTime: new Date(timestamp),
          status: "in-progress"
        }
      });

      logWebhookEvent('call_record_created', { callId: call.id, sessionId: session_id });

      return NextResponse.json({ 
        success: true, 
        event: "call_initiated",
        contact,
        call
      });
    }

    // Handle call updates (in-progress, completed, etc.)
    logWebhookEvent('call_update_processing', { 
      session_id, 
      event_type,
      status: session_status 
    });

    const call = await prisma.call.findFirst({
      where: {
        sessionId: session_id
      }
    });

    if (!call) {
      const error = new Error(`Call not found for session: ${session_id}`);
      logWebhookEvent('call_not_found', { session_id }, error);
      return NextResponse.json(
        { error: "Call not found" },
        { status: 404 }
      );
    }

    // Update call with latest information
    const updatedCall = await prisma.call.update({
      where: {
        id: call.id
      },
      data: {
        status: session_status || call.status,
        duration: duration ? Math.floor(duration) : call.duration,
        cost: cost ? parseFloat(cost) : call.cost,
        userSentiment: user_sentiment || call.userSentiment,
        disconnectionReason: end_status || call.disconnectionReason,
        transcriptText: transcript || call.transcriptText,
        summary: summary || call.summary,
        recordingUrl: recording_url || call.recordingUrl,
        publicLogUrl: public_log_url || call.publicLogUrl,
        channelType: channel_type || call.channelType,
        endedAt: session_status === "completed" ? new Date(timestamp) : call.endedAt,
        updatedAt: new Date()
      }
    });

    logWebhookEvent('call_updated', { 
      callId: updatedCall.id, 
      sessionId: session_id,
      status: updatedCall.status 
    });

    // If call completed, update contact's last contact date
    if (session_status === "completed") {
      await prisma.contact.update({
        where: {
          id: call.contactId
        },
        data: {
          lastContact: new Date(timestamp)
        }
      });
      logWebhookEvent('contact_updated', { 
        contactId: call.contactId,
        lastContact: timestamp 
      });
    }

    return NextResponse.json({ 
      success: true, 
      event: event_type,
      call: updatedCall 
    });

  } catch (error) {
    logWebhookEvent('error', { error: error.message }, error);
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
