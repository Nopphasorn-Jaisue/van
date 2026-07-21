import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoleFromClaims } from "@/Backend/services/booking-system-store";

export async function handleGetCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const role = getRoleFromClaims(claims);
  const email = typeof claims?.email === "string" ? claims.email : null;
  const fullName =
    typeof claims?.user_metadata === "object" && claims?.user_metadata && "full_name" in claims.user_metadata
      ? String((claims.user_metadata as Record<string, unknown>).full_name || "")
      : null;

  return NextResponse.json({
    role,
    email,
    fullName,
    authenticated: Boolean(claims?.sub),
  });
}
