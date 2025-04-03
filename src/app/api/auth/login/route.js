import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { emailOrPhone, password } = await request.json();

    // Validate input
    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone.toLowerCase() }, // Case insensitive search
          { phone: emailOrPhone }
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.fullName,
        phone: user.phone
      },
      process.env.JWT_SECRET || "reply",
      { expiresIn: "24h" } // Extended to 24 hours
    );

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        phone: user.phone
      },
      message: "Login successful",
    });

    // Set token in HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
