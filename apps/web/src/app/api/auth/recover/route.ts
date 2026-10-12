import { authResponse, checkAuthRequest, readAuthBody } from "@/lib/auth-route";
import { getRecoveryRateLimit, validateEmail } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const rejected = checkAuthRequest(request);
  if (rejected) return rejected;
  const body = await readAuthBody(request);
  const email = validateEmail(body?.email);
  if (!email) return authResponse({ message: "Informe seu e-mail no campo acima para recuperar a senha." }, 400);
  try {
    const supabase = await createClient();
    if (!supabase) return authResponse({ message: "O acesso ainda está sendo configurado." }, 503);
    // The origin has already been validated. Preserve the host holding the PKCE cookie.
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${request.headers.get("origin")}/auth/callback` });
    if (error) {
      const rateLimit = getRecoveryRateLimit(error);
      if (rateLimit) {
        const response = authResponse(rateLimit, 429);
        response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
        return response;
      }
      return authResponse({ message: "Não foi possível enviar o e-mail agora. Tente novamente." }, 503);
    }
    return authResponse({ message: "Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Abra somente o e-mail mais recente neste mesmo navegador.", retryAfterSeconds: 60 });
  } catch {
    return authResponse({ message: "Não foi possível conectar. Tente novamente em instantes." }, 503);
  }
}
