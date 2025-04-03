import { PrismaClient } from "@prisma/client";
import axios from "axios";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Helper function to initiate a call for a single contact
const initiateCall = async (contact, callMetadataBase) => {
  try {
    // Create call record
    const callRecord = await prisma.call.create({
      data: {
        contactId: contact.id,
        direction: "outbound",
        status: "scheduled",
        startTime: new Date(),
      },
    });

    // Prepare metadata for Retell AI
    const callMetadata = {
      ...callMetadataBase,
      callId: callRecord.id,
      contactInfo: {
        name: contact.fullName,
        phone: contact.phone,
        email: contact.email,
        category: contact.category,
      },
      qualificationCriteria: contact.category ? `Interested in ${contact.category}` : "General inquiry",
    };

    // Format the phone number
    const toNumber = contact.phone.startsWith("+") ? contact.phone : `+${contact.phone}`;

    // Initiate call using Retell AI API
    const retellResponse = await axios.post(
      "https://api.retellai.com/v2/create-phone-call",
      {
        from_number: process.env.TWILIO_PHONE_NUMBER,
        to_number: toNumber,
        override_agent_id: process.env.RETELL_AGENT_ID,
        metadata: callMetadata,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update call record with Retell call ID
    await prisma.call.update({
      where: { id: callRecord.id },
      data: {
        callSid: retellResponse.data.call_id,
        status: "initiated",
      },
    });

    return { success: true, callId: callRecord.id, retellCallId: retellResponse.data.call_id };
  } catch (error) {
    console.error(`Failed to initiate call for contact ${contact.id}:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export async function POST(req) {
  try {
    console.log("Starting call initiation");

    // Get token from cookies (Optional authentication)
    const token = req.cookies.get("auth_token")?.value;
    let userId = null;

    if (token) {
      try {
        // Verify the token and get userId
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "reply");
        userId = decoded.id;
      } catch (error) {
        console.warn("Invalid or expired token");
      }
    }

    // Get the request body
    const { contactId } = await req.json();

    // Base metadata for Retell AI
    const callMetadataBase = {
      userId,
    };

    if (contactId) {
      // Case 1: Initiate a call for a single contact
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }, // No longer filtering by userId
      });

      if (!contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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
      });
    } else {
      // Case 2: Initiate calls for all contacts (without requiring userId)
      const contacts = await prisma.contact.findMany({
         // Fetch all contacts if userId is null
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
