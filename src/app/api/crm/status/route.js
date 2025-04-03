
import { prisma } from "@/lib/prisma";
import jwt from 'jsonwebtoken';
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';
export async function GET() {
  try {
   console.log("running")
   const cookieStore = await cookies();
   const token = cookieStore.get("auth_token")?.value;
   if (!token) {
    return NextResponse.json({ error: 'Unauthorized - No token' }, { status: 401 });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;
  console.log("userId", userId);
    const integrations = await prisma.CrmIntegration.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    return NextResponse.json({
      hubSpotConnected: integrations.some(i => i.platform === 'hubspot'),
      pipedriveConnected: integrations.some(i => i.platform === 'pipedrive'),
    });
  } catch (error) {
    console.error('Error checking CRM status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
} 