import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    // Use provided numbers or fallback to defaults
    const from_number = body.from_number;
    // const to_number = body.to_number;

    const payload = {
      sort_order: "descending",
      filter_criteria: {
        from_number
      },
    };

    const response = await axios.post(
      "https://api.retellai.com/v2/list-calls",
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error calling RetellAI list-calls:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to call RetellAI list-calls', details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}