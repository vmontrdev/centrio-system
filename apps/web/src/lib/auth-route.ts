import "server-only";
import { NextResponse } from "next/server";
import { isAllowedAuthOrigin } from "@/lib/auth-utils";
import { getAppOrigin } from "@/lib/supabase/config";

export function authResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", "Pragma": "no-cache" },
  });
}

export function checkAuthRequest(request: Request) {
  if (!isAllowedAuthOrigin(request.headers.get("origin"), getAppOrigin(), process.env.NODE_ENV === "development")) {
    return authResponse({ message: "Solicitação não permitida." }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return authResponse({ message: "Formato de solicitação inválido." }, 415);
  }
  return null;
}

export async function readAuthBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > 8192) return null;
    const body = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}
