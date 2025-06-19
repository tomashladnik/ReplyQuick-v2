import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Helper function to get user ID from token
const getUserIdFromToken = async (req) => {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'reply');
    const { payload } = await jwtVerify(token, secret);
    return payload.id;
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
};

export async function GET(req) {
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

    // Get total calls
    const totalCalls = await prisma.call.count({
      where: {
        userId: userId
      }
    });

    // Get completed calls for success rate
    const completedCalls = await prisma.call.count({
      where: {
        userId: userId,
        status: "completed"
      }
    });

    // Calculate success rate
    const successRate = totalCalls > 0 
      ? Math.round((completedCalls / totalCalls) * 100) 
      : 0;

    // Get average duration
    const durationResult = await prisma.call.aggregate({
      where: {
        userId: userId,
        duration: {
          not: null
        }
      },
      _avg: {
        duration: true
      }
    });
    const averageDuration = Math.round(durationResult._avg?.duration || 0);

    // Get recent calls
    const recentCalls = await prisma.call.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        startTime: "desc"
      },
      take: 5,
      include: {
        contacts: {
          select: {
            Name: true,
            phone: true
          }
        }
      }
    });

    // Format recent calls
    const formattedRecentCalls = recentCalls.map(call => ({
      id: call.id,
      sessionId: call.sessionId,
      contactName: call.contacts?.Name || 'Unknown',
      contactPhone: call.contacts?.phone || 'No Phone',
      status: call.status,
      startTime: call.startTime,
      duration: call.duration,
      direction: call.direction,
      qualification: call.qualification,
      recordingUrl: call.recordingUrl,
      publicLogUrl: call.publicLogUrl,
      disconnectionReason: call.disconnectionReason,
      cost: call.cost,
      transcriptText: call.transcriptText
    }));

    // Get status distribution
    const statusCounts = await prisma.call.groupBy({
      by: ['status'],
      where: {
        userId: userId
      },
      _count: true
    });

    const statusDistribution = statusCounts.map(status => ({
      name: status.status,
      value: status._count
    }));

    return NextResponse.json({
      totalCalls,
      successRate,
      averageDuration,
      statusDistribution,
      recentCalls: formattedRecentCalls
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
