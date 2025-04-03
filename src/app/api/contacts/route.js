import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { contacts } = await req.json();
    
    // Get the token from cookies
    const token = req.cookies.get("auth_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log("token", token);

    // Verify the token and get userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "reply");
    const userId = decoded.id;

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
    }

    // Insert into Prisma DB
    const createdContacts = await prisma.contact.createMany({
      data: contacts.map(contact => ({
        userId: userId || null,  // Add the userId from JWT token
        fullName: contact.fullName || "Unknown",
        email: contact.email || null,  // Null if missing
        phone: contact.phone,
        category: contact.category || "General",
        source: "csv_import",
        status: "pending",
      })),
      skipDuplicates: true, // Prevents duplicate email insertion errors
    });

    return NextResponse.json({ message: "Contacts added successfully", createdContacts }, { status: 201 });
  } catch (error) {
    console.error("Error adding contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
