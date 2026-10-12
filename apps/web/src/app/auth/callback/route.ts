import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getPkceExchangeOptions, isAllowedAuthOrigin, RECOVERY_COOKIE, sessionCookieOptions } from "@/lib/auth-utils";
import { getAppOrigin } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const configuredOrigin = getAppOrigin();
  const requestOrigin = request.nextUrl.origin;
  const origin = isAllowedAuthOrigin(requestOrigin, configuredOrigin, process.env.NODE_ENV === "development") ? requestOrigin : configuredOrigin;
  const code = request.nextUrl.searchParams.get("code");
  let failureReason = "expirada";
  if (code) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const flowId = request.nextUrl.searchParams.get("sb_flow_id");
        const { error } = await supabase.auth.exchangeCodeForSession(code, getPkceExchangeOptions(flowId));
        if (!error) {
          const cookieStore = await cookies();
          cookieStore.set(RECOVERY_COOKIE, "1", { ...sessionCookieOptions({}, false, origin.startsWith("https:")), maxAge: 60 * 15 });
          const response = NextResponse.redirect(`${origin}/redefinir-senha`);
          response.headers.set("Cache-Control", "private, no-store");
          response.headers.set("Referrer-Policy", "no-referrer");
          return response;
        }
        if (error.name === "AuthPKCECodeVerifierMissingError" || error.code === "bad_code_verifier") failureReason = "navegador";
        else if (error.status && error.status >= 500) failureReason = "indisponivel";
      } else {
        failureReason = "indisponivel";
      }
    } catch {
      failureReason = "indisponivel";
    }
  }
  const response = NextResponse.redirect(`${origin}/?recuperacao=${failureReason}#`);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
