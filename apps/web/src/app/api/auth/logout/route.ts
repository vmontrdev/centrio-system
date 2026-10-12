import { authResponse, checkAuthRequest } from "@/lib/auth-route";
import { clearSessionCookies, createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const rejected = checkAuthRequest(request);
  if (rejected) return rejected;
  try {
    const supabase = await createClient();
    await supabase?.auth.signOut({ scope: "local" });
  } catch {
    // Clear this browser's cookies even if the provider is temporarily unavailable.
  }
  await clearSessionCookies();
  return authResponse({ redirect: "/" });
}
