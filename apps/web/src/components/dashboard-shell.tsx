"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, Menu, UserRound, X } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

// Add each agreed module here as its protected page is implemented.
const navigation = [{ label: "Visão geral", href: "/inicio", icon: LayoutDashboard }];

export function DashboardShell({ email, displayName, children }: { email: string; displayName: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nameParts = displayName.split(/\s+/);
  const initials = (nameParts[0]?.[0] || "C") + (nameParts.length > 1 ? nameParts.at(-1)?.[0] || "" : "");
  const accountRef = useRef<HTMLDetailsElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function closeAccount(event: PointerEvent) {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) {
        accountRef.current?.removeAttribute("open");
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (accountRef.current?.open) {
        accountRef.current.removeAttribute("open");
        accountRef.current.querySelector("summary")?.focus();
      }
      if (mobileOpen) {
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", closeAccount);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", closeAccount);
      document.removeEventListener("keydown", escape);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) mobileCloseRef.current?.focus();
  }, [mobileOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 761px)");
    function resetMobile() { if (desktop.matches) setMobileOpen(false); }
    desktop.addEventListener("change", resetMobile);
    return () => desktop.removeEventListener("change", resetMobile);
  }, []);

  function closeMobile() {
    setMobileOpen(false);
    mobileTriggerRef.current?.focus();
  }

  return (
    <div className={`dashboard-shell${mobileOpen ? " is-mobile-open" : ""}`}>
      <a className="dashboard-skip-link" href="#dashboard-main">Ir para o conteúdo</a>
      <header className="dashboard-topbar">
        <Link href="/inicio" className="dashboard-brand" aria-label="Centrio, início">centrio<span aria-hidden="true">.</span></Link>
        <button ref={mobileTriggerRef} type="button" className="dashboard-icon-button dashboard-mobile-trigger" aria-label="Abrir navegação" aria-expanded={mobileOpen} aria-controls="dashboard-sidebar" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
        <details ref={accountRef} className="dashboard-account" inert={mobileOpen}>
          <summary aria-label="Abrir opções da minha conta">
            <span className="dashboard-avatar" aria-hidden="true">{initials.toUpperCase()}</span>
            <span className="dashboard-profile-name" title={displayName}>{displayName}</span>
            <ChevronDown size={13} aria-hidden="true" />
          </summary>
          <div className="dashboard-account-dropdown">
            <span className="dashboard-account-label"><UserRound size={14} aria-hidden="true" />Minha conta</span>
            <strong className="dashboard-account-name">{displayName}</strong>
            <p>{email || "Conta conectada"}</p>
            <div className="dashboard-account-actions"><SignOutButton compact /></div>
          </div>
        </details>
      </header>

      <button type="button" className="dashboard-mobile-backdrop" aria-label="Fechar navegação" onClick={closeMobile} tabIndex={-1} />
      <aside id="dashboard-sidebar" className="dashboard-sidebar" aria-label="Navegação principal">
        <div className="dashboard-sidebar-heading">
          <button ref={mobileCloseRef} type="button" className="dashboard-icon-button dashboard-mobile-close" aria-label="Fechar navegação" onClick={closeMobile}><X size={19} /></button>
        </div>
        <nav id="dashboard-navigation" className="dashboard-navigation">
          {navigation.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="dashboard-nav-item is-active" aria-label={label} aria-current="page" onClick={() => setMobileOpen(false)}>
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span className="dashboard-nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="dashboard-workspace" inert={mobileOpen}>
        <div className="dashboard-section-bar"><span>Visão geral</span></div>
        <main id="dashboard-main" className="dashboard-main" aria-labelledby="page-title" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
