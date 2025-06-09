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

    // Initiate call using Retell AI API first to get the session ID
    const retellResponse = await axios.post(
      "https://api.retellai.com/v2/create-phone-call",
      {
        from_number: process.env.TWILIO_PHONE_NUMBER1,
        to_number: toNumber,
        override_agent_id: process.env.RETELL_AGENT_ID,
        metadata: {
          ...callMetadataBase,
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

    // Create call record with the session ID from Retell
    const callRecord = await prisma.call.create({
      data: {
        contactId: contact.id,
        userId: callMetadataBase.userId,
        direction: "outbound",
        status: "scheduled",
        startTime: new Date(),
        sessionId: retellResponse.data.session_id, // Use the session ID from Retell
        callSid: retellResponse.data.call_id // Store the call ID as well
      },
    });

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
