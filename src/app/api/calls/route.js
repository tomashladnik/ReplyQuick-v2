import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Helper function to initiate a call for a single contact
const initiateCall = async (contact, callMetadataBase) => {
  try {
    // Format the phone number
    const toNumber = contact.phone.startsWith("+") ? contact.phone : `+${contact.phone}`;

    // Create call record first
    const callRecord = await prisma.call.create({
      data: {
        contactId: contact.id,
        userId: callMetadataBase.userId,
        direction: "outbound",
        status: "scheduled",
        startTime: new Date(),
        sentAt: new Date(),
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
        callSid: `call_${Math.random().toString(36).substring(2)}${Date.now()}`
      },
    });

    // Initiate call using Retell AI API
    const retellResponse = await axios.post(
      "https://api.retellai.com/v2/create-phone-call",
      {
        from_number: process.env.TWILIO_PHONE_NUMBER1,
        to_number: toNumber,
        override_agent_id: process.env.RETELL_AGENT_ID,
        metadata: {
          ...callMetadataBase,
          callId: callRecord.id,
          contactInfo: {
            name: contact.Name,
            phone: contact.phone,
            email: contact.email,
            category: contact.category,
          },
          qualificationCriteria: contact.category ? `Interested in ${contact.category}` : "General inquiry",
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update call record with Retell session ID if available
    if (retellResponse.data.session_id) {
      await prisma.call.update({
        where: { id: callRecord.id },
        data: {
          sessionId: retellResponse.data.session_id,
          callSid: retellResponse.data.call_id || callRecord.callSid
        }
      });
    }

    return { 
      success: true, 
      callId: callRecord.id,
      retellCallId: retellResponse.data.call_id,
      sessionId: retellResponse.data.session_id
    };
  } catch (error) {
    console.error(`Failed to initiate call for contact ${contact.id}:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export async function POST(req) {
  try {
    console.log("Starting call initiation");

    // Get token from cookies (Required authentication)
    const token = req.cookies.get("auth_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token and get userId
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'reply');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id;

    // Get the request body
    const { contactId } = await req.json();

    // Base metadata for Retell AI
    const callMetadataBase = {
      userId,
    };

    if (contactId) {
      // Case 1: Initiate a call for a single contact
      const contact = await prisma.contact.findFirst({
        where: { 
          id: contactId,
          userId: userId // Only allow calls to contacts owned by the user
        },
      });

      if (!contact) {
        return NextResponse.json({ error: "Contact not found or unauthorized" }, { status: 404 });
      }

      const result = await initiateCall(contact, callMetadataBase);

      if (!result.success) {
        return NextResponse.json(
          { error: "Failed to initiate call", details: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        callId: result.callId,
        retellCallId: result.retellCallId,
        sessionId: result.sessionId
      });
    } else {
      // Case 2: Initiate calls for all contacts of the user
      const contacts = await prisma.contact.findMany({
        where: {
          userId: userId // Only get contacts for the authenticated user
        }
      });

      if (contacts.length === 0) {
        return NextResponse.json({ message: "No contacts found to call" }, { status: 200 });
      }

      // Initiate a call for each contact
      const callPromises = contacts.map(contact => initiateCall(contact, callMetadataBase));
      const results = await Promise.all(callPromises);

      // Summarize the results
      const successfulCalls = results.filter(result => result.success).length;
      const failedCalls = results.length - successfulCalls;

      return NextResponse.json({
        message: `Initiated calls for ${results.length} contacts`,
        successfulCalls,
        failedCalls,
        details: results,
      });
    }
  } catch (error) {
    console.error("Call initiation failed:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to initiate calls", details: error.message },
      { status: 500 }
    );
  }
}
