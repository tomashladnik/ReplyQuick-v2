import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { emailOrPhone, password } = await request.json();
    console.log("Login attempt for:", emailOrPhone);

    // Validate input
    if (!emailOrPhone || !password) {
      console.log("Missing fields:", { emailOrPhone: !!emailOrPhone, password: !!password });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone }
        ],
      },
    });

    console.log("User found:", !!user);
    if (user) {
      console.log("Found user email:", user.email);
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT Token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'reply');
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.fullName,
      phone: user.phone
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

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
