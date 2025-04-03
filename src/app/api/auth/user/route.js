import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get the token from cookies using the cookies() helper
    const cookieStore = await cookies();
    const authCookie =  cookieStore.get("auth_token");
    
    if (!authCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const token = authCookie.value;

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "reply");

    // Return user data
    return NextResponse.json({
      user: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        phone: decoded.phone
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}