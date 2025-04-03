import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    
    if (!code || !stateParam) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // Parse the state parameter
    const state = JSON.parse(decodeURIComponent(stateParam));
    const { userId, token } = state;

    if (!token) {
      return NextResponse.json({ error: "No token in state" }, { status: 401 });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "reply");
    
    // Verify the userId matches
    if (decoded.id !== userId) {
      return NextResponse.json({ error: "Invalid user token" }, { status: 401 });
    }

    // Create or update CRM integration
    await prisma.crmIntegration.upsert({
      where: {
        userId_platform: {
          userId: userId,
          platform: 'hubspot'
        }
      },
      update: {
        accessToken: code,
        isActive: true
      },
      create: {
        userId: userId,
        platform: 'hubspot',
        accessToken: code,
        isActive: true
      }
    });

    // Redirect to settings page with success message
    return NextResponse.redirect(new URL('/settings?integration=success', request.url));
  } catch (error) {
    console.error('HubSpot integration error:', error);
    return NextResponse.redirect(new URL('/settings?integration=error', request.url));
  } finally {
    await prisma.$disconnect();
  }
}
