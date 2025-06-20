import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { hubspotAccessToken, hubspotContacts } = await request.json();
  
  try {
    const response = await axios.post("https://api.hubapi.com/crm/v3/objects/contacts/batch/create",
      {
        inputs: hubspotContacts,
      },
      {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "content-type": "application/json"
      },
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