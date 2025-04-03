import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");
    const formData = await req.formData();

    const callStatus = formData.get("CallStatus");
    const callDuration = formData.get("CallDuration");
    const callSid = formData.get("CallSid");

    // Update call status based on Twilio callback
    const statusMap = {
      queued: "scheduled",
      ringing: "in-progress",
      in_progress: "in-progress",
      completed: "completed",
      failed: "failed",
      busy: "failed",
      no_answer: "failed"
    };

    const updateData = {
      status: statusMap[callStatus] || callStatus,
      callSid
    };

    if (callStatus === "completed") {
      updateData.endTime = new Date();
      updateData.duration = parseInt(callDuration);
    }

    await prisma.call.update({
      where: { id: callId },
      data: updateData
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Status callback error:", error);
    return NextResponse.json(
      { error: "Failed to process status update" },
      { status: 500 }
    );
  }
}