import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ResetPasswordScreen } from "@/components/reset-password-screen";
import { RECOVERY_COOKIE } from "@/lib/auth-utils";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Redefinir senha | ADM & PCM" };

export default async function ResetPasswordPage() {
  const user = await getAuthenticatedUser();
  if (!user || (await cookies()).get(RECOVERY_COOKIE)?.value !== "1") redirect("/?recuperacao=expirada");
  return <ResetPasswordScreen />;
}
