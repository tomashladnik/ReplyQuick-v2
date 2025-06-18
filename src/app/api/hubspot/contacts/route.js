import axios from 'axios';
import { NextResponse } from "next/server";

export async function POST(request) {
  const { hubspotAccessToken } = await request.json();
  
  try {
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
      },
      params: {
        properties: 'email,firstname,lastname,phone',
      }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 400 }
    );
  }
}