import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/app/actions/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const stateParam = searchParams.get("state");

  if (error || !code) {
    console.error("Azure OAuth Error:", error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription || error || "Failed to login with Microsoft")}`);
  }

  let roleParam = "USER";
  let redirectUri = `${origin}/api/auth/azure/callback`;

  if (stateParam) {
    try {
      const parsed = JSON.parse(Buffer.from(stateParam, "base64url").toString("utf8"));
      if (parsed.role) roleParam = parsed.role;
      if (parsed.redirectUri) redirectUri = parsed.redirectUri;
    } catch {
      // Ignore
    }
  }

  const tenantId = process.env.AZURE_TENANT_ID || "common";
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=Azure+credentials+missing+on+server`);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(tokenData.error_description || tokenData.error || "Token exchange failed")}`);
    }

    // 2. Fetch user profile from Microsoft Graph
    const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const graphData = await graphResponse.json();
    const email = (graphData.mail || graphData.userPrincipalName || "").toLowerCase().trim();
    const name = graphData.displayName || graphData.givenName || email.split("@")[0];

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=Cannot+retrieve+email+from+Microsoft+account`);
    }

    // 3. Find or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { email },
      include: { faculty: true },
    });

    if (!dbUser) {
      const fallbackFaculty = await prisma.faculty.findFirst() || await prisma.faculty.create({
        data: { nameTh: "มหาวิทยาลัยพะเยา" },
      });

      dbUser = await prisma.user.create({
        data: {
          email,
          name,
          role: "USER",
          facultyId: fallbackFaculty.id,
        },
        include: { faculty: true },
      });
    }

    // 4. Generate JWT session token
    const token = await signToken({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      facultyId: dbUser.facultyId,
      faculty: dbUser.faculty,
    });

    // 5. Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    cookieStore.set("mock_role", dbUser.role, { path: "/", maxAge: 60 * 60 * 24 });
    cookieStore.set("mock_email", dbUser.email, { path: "/", maxAge: 60 * 60 * 24 });

    // 6. Redirect to dashboard based on role
    if (dbUser.role === "SUPER_ADMIN") {
      return NextResponse.redirect(`${origin}/super-admin/dashboard`);
    } else if (dbUser.role === "FACULTY_ADMIN") {
      return NextResponse.redirect(`${origin}/faculty-admin/dashboard`);
    } else if (dbUser.role === "DRIVER") {
      return NextResponse.redirect(`${origin}/driver/dashboard`);
    } else {
      return NextResponse.redirect(`${origin}/user/calendar`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An error occurred";
    console.error("Azure callback error:", err);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }
}
