import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "USER";

  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId = process.env.AZURE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: "AZURE_CLIENT_ID is not configured in .env" }, { status: 500 });
  }

  // Determine redirect URI based on request host
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const redirectUri = `${proto}://${host}/api/auth/azure/callback`;

  // Encode state parameter
  const state = Buffer.from(JSON.stringify({ role, redirectUri })).toString("base64url");

  const azureAuthUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  azureAuthUrl.searchParams.set("client_id", clientId);
  azureAuthUrl.searchParams.set("response_type", "code");
  azureAuthUrl.searchParams.set("redirect_uri", redirectUri);
  azureAuthUrl.searchParams.set("response_mode", "query");
  azureAuthUrl.searchParams.set("scope", "openid profile email User.Read");
  azureAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(azureAuthUrl.toString());
}
