import { LoginScreen } from "@/components/login-screen";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getRecoveryNotice } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const user = await getAuthenticatedUser();
  if (user && !query.recuperacao) redirect("/inicio");
  const initialNotice = query.senha === "atualizada"
    ? "Senha atualizada. Entre com sua nova senha."
    : typeof query.recuperacao === "string"
      ? getRecoveryNotice(query.recuperacao)
      : "";
  return <LoginScreen initialNotice={initialNotice} />;
}
