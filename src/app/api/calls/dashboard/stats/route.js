import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// Helper function to get user ID from token
const getUserIdFromToken = (req) => {
  try {
    const token = req.cookies.get("auth_token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "reply");
    return decoded.id;
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
};

export async function GET(req) {
  try {
    // Get user ID (if required)
    const userId = getUserIdFromToken(req);

    // Fetch aggregated call statistics (conditionally using userId)
    // const whereClause = userId ? { userId } : {}; // Apply filter only if userId exists
    // console.log("whereClause", whereClause);
    const totalCalls = await prisma.call.count();
   
    const completedCalls = await prisma.call.count({
      where: {  status: "completed" },
    });
    const successRate = totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(2) : 0;

    // Fetch average call duration
    const avgDurationResult = await prisma.call.aggregate({
      _avg: { duration: true },
      where: {  duration: { not: null } },
    });
    const avgDuration = avgDurationResult._avg.duration || 0;

    // Fetch daily call trends for the last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(sevenDaysAgo);
      dayStart.setDate(sevenDaysAgo.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const dateStr = dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const totalCallsForDay = await prisma.call.count({
        where: {  startTime: { gte: dayStart, lt: dayEnd } },
      });

      const completedCallsForDay = await prisma.call.count({
        where: {  startTime: { gte: dayStart, lt: dayEnd }, status: "completed" },
      });

      const failedCallsForDay = await prisma.call.count({
        where: {  startTime: { gte: dayStart, lt: dayEnd }, status: "failed" },
      });

      const avgDurationForDayData = await prisma.call.aggregate({
        _avg: { duration: true },
        where: {  startTime: { gte: dayStart, lt: dayEnd }, duration: { not: null } },
      });
      const avgDurationForDay = avgDurationForDayData._avg.duration || 0;

      dailyTrends.push({
        date: dateStr,
        totalCalls: totalCallsForDay,
        completed: completedCallsForDay,
        failed: failedCallsForDay,
        avgDuration: avgDurationForDay,
      });
    }

    // Fetch call status distribution
    const statusCounts = await prisma.call.groupBy({
      by: ["status"],
      // where: whereClause,
      _count: { status: true },
    });

    const statusDistribution = statusCounts.map((item) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item._count.status,
    }));

    // Fetch recent calls (limited to 5 for dashboard)
    const recentCalls = await prisma.call.findMany({
      // where: whereClause,
      orderBy: { startTime: "desc" },
      take: 5,
      select: {
        callSid: true,
        status: true,
        startTime: true,
        duration: true,
        direction: true,
        qualification: true,
        recordingUrl: true,
        publicLogUrl: true,
        disconnectionReason: true,
        cost: true,
        transcriptText: true,
        contact: {
          select: { phone: true, fullName: true },
        },
      },
    });

    // Format recent calls
    const formattedRecentCalls = recentCalls.map((call) => ({
      callSid: call.callSid,
      status: call.status,
      startTime: call.startTime,
      duration: call.duration,
      direction: call.direction,
      qualification: call.qualification,
      recordingUrl: call.recordingUrl,
      publicLogUrl: call.publicLogUrl,
      disconnectionReason: call.disconnectionReason,
      cost: call.cost,
      transcriptText: call.transcriptText,
      contactPhone: call.contact?.phone || "Unknown",
      contactName: call.contact?.fullName || "Unknown",
    }));

  

    return NextResponse.json({
      totalCalls,
      successRate,
      avgDuration,
      callTrends: dailyTrends,
      statusDistribution,
      recentCalls: formattedRecentCalls,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
