import axios from 'axios';
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  try {
    const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        redirect_uri: `${process.env.STANDARD_PAGE}/api/hubspot/callback`,
        code,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return NextResponse.redirect(
      `${process.env.STANDARD_PAGE}/settings?` +
      `access_token=${tokenResponse.data.access_token}` +
      `&refresh_token=${tokenResponse.data.refresh_token}` +
      `&expires_in=${tokenResponse.data.expires_in}`
    );
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Failed to exchange authorization code" },
      { status: 400 }
    );
  }
}