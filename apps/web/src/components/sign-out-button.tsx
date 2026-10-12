"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authRequest } from "@/lib/auth-request";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  async function signOut() {
    if (pending) return;
    setPending(true);
    setNotice("");
    const result = await authRequest("logout", {});
    if (result.ok && result.redirect) window.location.assign(result.redirect);
    else { setNotice(result.message || "Não foi possível sair. Tente novamente."); setPending(false); }
  }
  return <><Button onClick={signOut} disabled={pending} variant={compact ? "ghost" : "default"} className={compact ? "dashboard-sign-out" : "submit-button"}>{pending ? "Saindo…" : "Sair da conta"}<LogOut size={compact ? 15 : 18} aria-hidden="true" /></Button><p className="notice" aria-live="polite">{notice}</p></>;
}
