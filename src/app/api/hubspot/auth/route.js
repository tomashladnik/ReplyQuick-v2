import { NextResponse } from "next/server";

export async function POST() {
  const { HUBSPOT_CLIENT_ID, HUBSPOT_SCOPE, HUBSPOT_REDIRECT_URI } = process.env;

  try {
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&scope=${HUBSPOT_SCOPE}&redirect_uri=${HUBSPOT_REDIRECT_URI}$disable_hs_ui=true&show_verification_modal=false`;

    return NextResponse.json(
      { authUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during Hubspot login" },
      { status: 500 }
    );
  }
}
