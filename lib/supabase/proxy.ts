import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

type AppRole = "USER" | "FACULTY_ADMIN" | "EXECUTIVE" | "SUPER_ADMIN" | "DRIVER";

const ROLE_RULES: Array<{ startsWith: string; allowed: AppRole[] }> = [
  { startsWith: "/faculty-admin", allowed: ["FACULTY_ADMIN", "SUPER_ADMIN"] },
  { startsWith: "/executive", allowed: ["EXECUTIVE", "SUPER_ADMIN"] },
  { startsWith: "/driver", allowed: ["DRIVER", "SUPER_ADMIN"] },
  { startsWith: "/super-admin", allowed: ["SUPER_ADMIN"] },
  { startsWith: "/reports", allowed: ["FACULTY_ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
];

function normalizeRole(value: unknown): AppRole {
  const role = String(value || "USER").toUpperCase();
  if (["USER", "FACULTY_ADMIN", "EXECUTIVE", "SUPER_ADMIN", "DRIVER"].includes(role)) {
    return role as AppRole;
  }
  return "USER";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;

  const appMeta = claims?.app_metadata && typeof claims.app_metadata === "object"
    ? claims.app_metadata as Record<string, unknown>
    : {};
  const userMeta = claims?.user_metadata && typeof claims.user_metadata === "object"
    ? claims.user_metadata as Record<string, unknown>
    : {};

  const role = normalizeRole(appMeta.role || userMeta.role || claims?.role);

  const pathname = request.nextUrl.pathname;
  const matchedRule = ROLE_RULES.find((rule) => pathname.startsWith(rule.startsWith));
  if (matchedRule && !matchedRule.allowed.includes(role)) {
    // const deniedUrl = request.nextUrl.clone();
    // deniedUrl.pathname = "/landing";
    // deniedUrl.searchParams.set("denied", "1");
    // return NextResponse.redirect(deniedUrl);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
