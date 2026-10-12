import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { RECOVERY_COOKIE, REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/auth-utils";
import { getAppOrigin, getSupabaseConfig } from "./config";

export async function createClient({ readOnly = false, persistent }: { readOnly?: boolean; persistent?: boolean } = {}) {
  const config = getSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  const remember = persistent ?? cookieStore.get(REMEMBER_COOKIE)?.value === "1";
  const secure = getAppOrigin().startsWith("https:");

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Proxy performs refresh writes before a Server Component is rendered.
        if (readOnly) return;
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, sessionCookieOptions(options, remember, secure));
        });
      },
    },
  });
}

export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient({ readOnly: true });
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();
  if (config) {
    const prefix = `sb-${new URL(config.url).hostname.split(".")[0]}-auth-token`;
    cookieStore.getAll().filter(cookie => cookie.name.startsWith(prefix)).forEach(cookie => cookieStore.delete(cookie.name));
  }
  cookieStore.delete(REMEMBER_COOKIE);
  cookieStore.delete(RECOVERY_COOKIE);
}
