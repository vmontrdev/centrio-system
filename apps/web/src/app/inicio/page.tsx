import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { RECOVERY_COOKIE } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Visão geral | Centrio" };

export default async function WelcomePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/");
  if ((await cookies()).get(RECOVERY_COOKIE)?.value === "1") redirect("/redefinir-senha");

  const displayName = [user.user_metadata?.full_name, user.user_metadata?.name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)
    ?.trim().slice(0, 160) || "Minha conta";

  return (
    <DashboardShell email={user.email || ""} displayName={displayName}>
      <div className="dashboard-page-heading">
        <div>
          <h1 id="page-title">Visão geral</h1>
        </div>
        <span className="dashboard-page-label">Centrio</span>
      </div>
      <section className="dashboard-overview" aria-labelledby="overview-title">
        <header className="dashboard-panel-heading">
          <LayoutDashboard size={16} aria-hidden="true" />
          <h2 id="overview-title">Seu painel</h2>
        </header>
        <div className="dashboard-empty-state">
          <div className="dashboard-empty-icon"><LayoutDashboard size={26} strokeWidth={1.4} aria-hidden="true" /></div>
          <h3>Nenhum dado para exibir</h3>
        </div>
      </section>
    </DashboardShell>
  );
}
