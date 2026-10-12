import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/auth-utils";
import { getAppOrigin, getSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  if (!config) return response;

  const persistent = request.cookies.get(REMEMBER_COOKIE)?.value === "1";
  const secure = getAppOrigin().startsWith("https:");
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        const previousCookies = response.cookies.getAll();
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        previousCookies.forEach(cookie => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, sessionCookieOptions(options, persistent, secure));
        });
        Object.entries(cacheHeaders).forEach(([name, value]) => response.headers.set(name, value));
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch {
    // Protected pages verify the user independently and deny access on failure.
  }
  return response;
}

export const config = { matcher: ["/", "/inicio/:path*", "/redefinir-senha/:path*"] };
