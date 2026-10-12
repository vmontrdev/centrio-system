import { cookies } from "next/headers";
import { authResponse, checkAuthRequest, readAuthBody } from "@/lib/auth-route";
import { RECOVERY_COOKIE } from "@/lib/auth-utils";
import { clearSessionCookies, createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const rejected = checkAuthRequest(request);
  if (rejected) return rejected;
  const cookieStore = await cookies();
  if (cookieStore.get(RECOVERY_COOKIE)?.value !== "1") {
    return authResponse({ message: "Solicite um novo link de recuperação de senha." }, 401);
  }
  const body = await readAuthBody(request);
  if (typeof body?.password !== "string" || body.password.length < 8 || body.password.length > 1024) {
    return authResponse({ message: "A nova senha deve ter pelo menos 8 caracteres." }, 400);
  }
  try {
    const supabase = await createClient();
    if (!supabase) return authResponse({ message: "O acesso ainda está sendo configurado." }, 503);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return authResponse({ message: "Seu link expirou. Solicite outro link de recuperação." }, 401);
    const { error } = await supabase.auth.updateUser({ password: body.password });
    if (error) return authResponse({ message: "Não foi possível alterar a senha. Use uma senha diferente com letras, números e símbolos." }, 400);
    try { await supabase.auth.signOut({ scope: "local" }); } catch { /* Local cookies are cleared below regardless. */ }
    await clearSessionCookies();
    return authResponse({ redirect: "/?senha=atualizada" });
  } catch {
    return authResponse({ message: "Não foi possível conectar. Tente novamente em instantes." }, 503);
  }
}
