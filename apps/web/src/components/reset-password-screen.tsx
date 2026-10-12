"use client";

import { useState, type FormEvent } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignOutButton } from "@/components/sign-out-button";
import { authRequest } from "@/lib/auth-request";

export function ResetPasswordScreen() {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password.length < 8) { setNotice("Use pelo menos 8 caracteres na nova senha."); return; }
    if (password !== data.get("confirm")) { setNotice("As senhas precisam ser iguais."); return; }
    setPending(true);
    setNotice("");
    const result = await authRequest("password", { password });
    if (result.ok && result.redirect) window.location.assign(result.redirect);
    else { setNotice(result.message || "Não foi possível alterar a senha."); setPending(false); }
  }

  return (
    <main className="login-layout">
      <section className="login-card" aria-labelledby="reset-title">
        <div className="login-content">
          <header className="login-heading">
            <div className="login-logo-space" role="img" aria-label="Espaço reservado para a logo"><span>SUA LOGO</span></div>
            <h1 id="reset-title">Crie sua nova senha</h1>
            <p className="login-description">Use pelo menos 8 caracteres.</p>
          </header>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-group"><Label htmlFor="new-password">Nova senha</Label><div className="input-wrap"><LockKeyhole size={19} className="input-icon" aria-hidden="true" /><Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={1024} required disabled={pending} /></div></div>
            <div className="field-group"><Label htmlFor="confirm-password">Confirmar nova senha</Label><div className="input-wrap"><LockKeyhole size={19} className="input-icon" aria-hidden="true" /><Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={1024} required disabled={pending} /></div></div>
            <Button type="submit" className="submit-button" disabled={pending}>{pending ? "Salvando…" : "Salvar nova senha"}</Button>
            <div className="notice" aria-live="polite">{notice}</div>
          </form>
          <div className="reset-exit"><SignOutButton /></div>
        </div>
      </section>
    </main>
  );
}
