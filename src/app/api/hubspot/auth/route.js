import { NextResponse } from "next/server";

export async function POST() {
  const {
    HUBSPOT_CLIENT_ID,
    HUBSPOT_SCOPE,
    STANDARD_PAGE,
  } = process.env;

  const HUBSPOT_REDIRECT_COMPLEMENT = '/api/hubspot/callback&scope=crm.schemas.deals.read%20oauth%20crm.objects.companies.read%20crm.objects.deals.read%20crm.schemas.contacts.read%20crm.schemas.contacts.write%20crm.objects.contacts.read%20crm.objects.contacts.write%20crm.schemas.companies.read';

  try {
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&scope=${HUBSPOT_SCOPE}&redirect_uri=${STANDARD_PAGE}${HUBSPOT_REDIRECT_COMPLEMENT}$disable_hs_ui=true&show_verification_modal=false`;

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
