"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authRequest } from "@/lib/auth-request";
import { getRecoveryNotice } from "@/lib/auth-utils";

type Errors = { email?: string; password?: string };
const RECOVERY_RETRY_KEY = "adm-pcm-recovery-retry-at";

export function LoginScreen({ initialNotice = "" }: { initialNotice?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState(initialNotice);
  const [pending, setPending] = useState<"login" | "recover" | null>(null);
  const [retryAt, setRetryAt] = useState(0);
  const [recoveryWait, setRecoveryWait] = useState(0);

  useEffect(() => {
    try {
      const stored = Number(sessionStorage.getItem(RECOVERY_RETRY_KEY));
      if (Number.isFinite(stored) && stored > Date.now() && stored <= Date.now() + 3600000) {
        setRetryAt(stored);
        setRecoveryWait(Math.ceil((stored - Date.now()) / 1000));
      }
    } catch { /* Storage may be unavailable; the provider still enforces limits. */ }
  }, []);

  useEffect(() => {
    if (!retryAt) return;
    const tick = () => setRecoveryWait(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.has("error") || hash.has("error_code")) {
      setNotice(getRecoveryNotice(hash.get("error_code") === "bad_code_verifier" ? "navegador" : "expirada"));
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const nextErrors: Errors = {};
    if (!email) nextErrors.email = "Informe seu e-mail.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Informe um e-mail válido.";
    if (!password) nextErrors.password = "Informe sua senha.";
    setErrors(nextErrors);
    setNotice("");

    const invalidField = nextErrors.email ? "email" : nextErrors.password ? "password" : null;
    if (invalidField) {
      const field = event.currentTarget.elements.namedItem(invalidField);
      if (field instanceof HTMLInputElement) field.focus();
      return;
    }
    setPending("login");
    const result = await authRequest("login", { email, password, remember: data.get("remember") === "on" });
    if (result.ok && result.redirect) window.location.assign(result.redirect);
    else { setNotice(result.message || "Não foi possível entrar. Tente novamente."); setPending(null); }
  }

  async function handleRecovery() {
    if (pending || recoveryWait > 0) return;
    const field = formRef.current?.elements.namedItem("email");
    const email = field instanceof HTMLInputElement ? field.value.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Informe seu e-mail para recuperar a senha." });
      setNotice("");
      if (field instanceof HTMLInputElement) field.focus();
      return;
    }
    setPending("recover");
    setErrors({});
    setNotice("");
    const result = await authRequest("recover", { email });
    setNotice(result.message || "Não foi possível enviar o e-mail agora.");
    if (typeof result.retryAfterSeconds === "number" && Number.isFinite(result.retryAfterSeconds) && result.retryAfterSeconds > 0) {
      const seconds = Math.min(3600, Math.ceil(result.retryAfterSeconds));
      const deadline = Date.now() + seconds * 1000;
      setRetryAt(deadline);
      setRecoveryWait(seconds);
      try { sessionStorage.setItem(RECOVERY_RETRY_KEY, String(deadline)); } catch { /* Countdown still works in memory. */ }
    }
    setPending(null);
  }

  return (
    <main className="login-layout">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-content">
          <header className="login-heading">
            <div className="login-logo-space" role="img" aria-label="Espaço reservado para a logo"><span>SUA LOGO</span></div>
            <h1 id="login-title">Acesse sua conta</h1>
            <p className="login-description">Entre com seu e-mail e senha para continuar.</p>
          </header>
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="login-form" aria-label="Login" aria-busy={Boolean(pending)}>
          <div className="field-group">
            <Label htmlFor="email">E-mail</Label>
            <div className="input-wrap">
              <Mail size={19} className="input-icon" aria-hidden="true" />
            <Input id="email" name="email" type="email" autoComplete="username" placeholder="Digite seu e-mail" disabled={Boolean(pending)} maxLength={254}
              aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined}
              onChange={() => { setErrors(prev => ({ ...prev, email: undefined })); setNotice(""); }} />
            </div>
            {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
          </div>
          <div className="field-group">
            <Label htmlFor="password">Senha</Label>
            <div className="input-wrap">
              <LockKeyhole size={19} className="input-icon" aria-hidden="true" />
            <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" className="password-input" disabled={Boolean(pending)} maxLength={1024}
              aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined}
              onChange={() => { setErrors(prev => ({ ...prev, password: undefined })); setNotice(""); }} />
              <Button type="button" variant="ghost" size="icon" className="password-toggle" disabled={Boolean(pending)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword}
                onClick={() => setShowPassword(prev => !prev)}>
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </Button>
            </div>
            {errors.password && <p id="password-error" className="field-error">{errors.password}</p>}
          </div>
          <div className="login-options">
            <label className="remember-option"><input type="checkbox" name="remember" disabled={Boolean(pending)} /><span>Manter conectado</span></label>
            <button type="button" className="recovery-button" disabled={Boolean(pending) || recoveryWait > 0} onClick={handleRecovery}>
              {pending === "recover" ? "Enviando…" : recoveryWait > 0 ? `Aguarde ${Math.floor(recoveryWait / 60).toString().padStart(2, "0")}:${(recoveryWait % 60).toString().padStart(2, "0")}` : "Esqueceu sua senha?"}
            </button>
          </div>
          <Button type="submit" className="submit-button" disabled={Boolean(pending)}>{pending === "login" ? "Entrando…" : "Entrar na conta"} <ArrowRight size={18} aria-hidden="true" /></Button>
          <div aria-live="polite" aria-atomic="true">{notice && <p className="notice">{notice}</p>}</div>
        </form>
          <footer className="login-footer"><span>Precisa de acesso? <strong>Fale com o administrador.</strong></span></footer>
        </div>
      </section>
    </main>
  );
}
