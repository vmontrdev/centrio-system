import "server-only";
import { isPublishableKey } from "@/lib/auth-utils";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !isPublishableKey(key)) return null;
  return { url, key };
}

export function getAppOrigin() {
  return new URL(process.env.APP_URL || "http://127.0.0.1:3000").origin;
}
