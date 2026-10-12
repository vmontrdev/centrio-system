import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_COOKIE = "adm-pcm-remember";
export const RECOVERY_COOKIE = "adm-pcm-recovery";
export const REMEMBER_SECONDS = 60 * 60 * 24 * 30;

export function getRecoveryRateLimit(error: { status?: number; code?: string }) {
  if (error.status !== 429) return null;
  if (error.code === "over_email_send_rate_limit") {
    return {
      message: "O limite de envio de e-mails foi atingido. Aguarde antes de solicitar outro link.",
      retryAfterSeconds: 3600,
    };
  }
  return {
    message: "Foram feitas várias solicitações em pouco tempo. Aguarde antes de tentar novamente.",
    retryAfterSeconds: 60,
  };
}

export function getRecoveryNotice(reason: string) {
  if (reason === "navegador") return "Abra o link no mesmo navegador e endereço em que pediu a recuperação. Se não for possível, solicite um novo e-mail aqui.";
  if (reason === "indisponivel") return "Não foi possível validar o link agora. Tente novamente em instantes.";
  return "Este link de recuperação expirou, é inválido ou já foi usado. Solicite um novo e-mail e abra somente o link mais recente.";
}

export function getPkceExchangeOptions(flowId: string | null) {
  // An explicit invalid ID is passed through so the SDK fails closed instead of
  // borrowing a verifier from another request and consuming its single-use code.
  return flowId === null ? undefined : { flowId };
}

export function sessionCookieOptions(options: CookieOptions, persistent: boolean, secure: boolean): CookieOptions {
  return {
    ...options,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    expires: undefined,
    maxAge: options.maxAge === 0 ? 0 : persistent ? REMEMBER_SECONDS : undefined,
  };
}

export function validateEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function isSameOrigin(actual: string | null, expected: string): boolean {
  return actual !== null && actual === expected;
}

export function isAllowedAuthOrigin(actual: string | null, expected: string, development: boolean): boolean {
  if (isSameOrigin(actual, expected)) return true;
  if (!development || !actual) return false;
  try {
    const actualUrl = new URL(actual);
    const expectedUrl = new URL(expected);
    const loopbackHosts = new Set(["localhost", "127.0.0.1"]);
    return actualUrl.origin === actual
      && loopbackHosts.has(actualUrl.hostname)
      && loopbackHosts.has(expectedUrl.hostname)
      && actualUrl.protocol === expectedUrl.protocol
      && actualUrl.port === expectedUrl.port;
  } catch {
    return false;
  }
}

export function isPublishableKey(key: string): boolean {
  if (key.startsWith("sb_publishable_") && key.length > 20) return true;
  // Legacy anon keys remain supported, but privileged keys must never be used here.
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    return key.split(".").length === 3 && payload.role === "anon";
  } catch {
    return false;
  }
}
