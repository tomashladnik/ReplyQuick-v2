import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    // Get the token from cookies
    const token = req.cookies.get("auth_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the token and get userId
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'reply');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id;

    const callId = params.id;

    // Get call details with contact information
    const call = await prisma.call.findFirst({
      where: {
        id: callId,
        userId: userId // Ensure user can only access their own calls
      },
      include: {
        contacts: {
          select: {
            Name: true,
            phone: true,
            email: true,
            category: true
          }
        }
      }
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found or unauthorized" }, { status: 404 });
    }

    // Format the response
    const formattedCall = {
      id: call.id,
      contactName: call.contacts.Name,
      phoneNumber: call.contacts.phone,
      email: call.contacts.email,
      category: call.contacts.category,
      date: call.startTime.toISOString(),
      duration: call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : null,
      status: call.status,
      direction: call.direction,
      recordingUrl: call.recordingUrl,
      transcriptText: call.transcriptText,
      summary: call.summary,
      qualification: call.qualification,
      userSentiment: call.userSentiment,
      disconnectionReason: call.disconnectionReason,
      cost: call.cost,
      publicLogUrl: call.publicLogUrl
    };

    return NextResponse.json(formattedCall);
  } catch (error) {
    console.error("Error fetching call details:", error);
    return NextResponse.json(
      { error: "Failed to fetch call details" },
      { status: 500 }
    );
  }
} 