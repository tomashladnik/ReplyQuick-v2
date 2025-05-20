import { PrismaClient } from "@prisma/client";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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

    // Fetch contacts for the current user
    const contacts = await prisma.contact.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        Name: true,
        phone: true,
        email: true,
      },
    });

    // Return the contacts as a JSON response
    return new Response(JSON.stringify(contacts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch contacts" }),
      { status: 500 }
    );
  }
}
