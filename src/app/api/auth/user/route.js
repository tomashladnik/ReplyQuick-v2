import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get the token from cookies using the cookies() helper
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("auth_token");
    
    if (!authCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const token = authCookie.value;

    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'reply');
    const { payload } = await jwtVerify(token, secret);

    // Return user data
    return NextResponse.json({
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        phone: payload.phone
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}