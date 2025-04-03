import jwt from 'jsonwebtoken';
import { cookies } from "next/headers";
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    // Get and verify token
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    console.log('Token:->>>>>>', token);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token hhh' }, { status: 401 });
    }
    // Verify JWT Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "reply");
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const state = {
      userId: decoded.id,
      token: token  // Include the token in state
    };

    if (platform === 'hubspot') {
      const clientId = process.env.HUBSPOT_CLIENT_ID;
      const redirectUri = encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI);

      // Correct scopes for free access
      const scopes = ['crm.objects.contacts.read', 'crm.objects.companies.read', 'oauth'];
      const scope = encodeURIComponent(scopes.join(' '));

      // Pass user info in state parameter
      const authUrl = `https://app.hubspot.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUri}&` +
        `scope=${scope}&` +
        `state=${encodeURIComponent(JSON.stringify(state))}&` +
        `response_type=code`;

      console.log('Redirecting to HubSpot with URL:', authUrl);
      return NextResponse.redirect(authUrl);
    }

    if (platform === 'pipedrive') {
      const clientId = process.env.PIPEDRIVE_CLIENT_ID;
      const redirectUri = encodeURIComponent(process.env.PIPEDRIVE_REDIRECT_URI);
      const state = encodeURIComponent(JSON.stringify({ userId: decoded.id }));

      const authUrl = `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
      return NextResponse.redirect(authUrl);
    }

    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  } catch (error) {
    console.error('CRM connection error:', error);
    return NextResponse.json({ error: 'Connection failed' }, { status: 500 });
  }
}
