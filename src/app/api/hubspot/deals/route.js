import axios from 'axios';
import { NextResponse } from "next/server";

export async function POST(request) {
  const { hubspotAccessToken } = await request.json();

  try {
    const response = await axios.post('https://api.hubapi.com/crm/v3/objects/deals/batch/read?archived=false',
      {
        propertiesWithHistory: ["string"],
        inputs: [
          { id: "string" }
        ],
        properties: ["string"]
      },
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('-> response', response.data);

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error reading deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 400 }
    );
  }
}