import { cookies } from "next/headers";
import { authResponse, checkAuthRequest, readAuthBody } from "@/lib/auth-route";
import { RECOVERY_COOKIE, REMEMBER_COOKIE, REMEMBER_SECONDS, sessionCookieOptions, validateEmail } from "@/lib/auth-utils";
import { getAppOrigin } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const rejected = checkAuthRequest(request);
  if (rejected) return rejected;
  const body = await readAuthBody(request);
  const email = validateEmail(body?.email);
  const password = body?.password;
  if (!email || typeof password !== "string" || !password || password.length > 1024 || typeof body?.remember !== "boolean") {
    return authResponse({ message: "Informe um e-mail válido e sua senha." }, 400);
  }
  try {
    const persistent = body.remember;
    const supabase = await createClient({ persistent });
    if (!supabase) return authResponse({ message: "O acesso ainda está sendo configurado." }, 503);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.status === 429) return authResponse({ message: "Muitas tentativas. Aguarde um pouco e tente novamente." }, 429);
      if (error.status && error.status >= 500) return authResponse({ message: "Não foi possível entrar agora. Tente novamente." }, 503);
      return authResponse({ message: "E-mail ou senha incorretos, ou conta ainda não ativada." }, 401);
    }
    const cookieStore = await cookies();
    cookieStore.set(REMEMBER_COOKIE, persistent ? "1" : "0", sessionCookieOptions({ maxAge: REMEMBER_SECONDS }, persistent, getAppOrigin().startsWith("https:")));
    cookieStore.delete(RECOVERY_COOKIE);
    return authResponse({ redirect: "/inicio" });
  } catch {
    return authResponse({ message: "Não foi possível conectar. Tente novamente em instantes." }, 503);
  }
}
