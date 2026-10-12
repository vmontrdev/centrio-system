export async function authRequest(path: string, body: object) {
  try {
    const response = await fetch(`/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const data = await response.json() as { message?: string; redirect?: string; retryAfterSeconds?: number };
    return { ok: response.ok, ...data };
  } catch {
    return { ok: false, message: "Não foi possível conectar. Verifique sua conexão e tente novamente." };
  }
}
