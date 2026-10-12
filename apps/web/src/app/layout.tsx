import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entrar | Centrio",
  description: "Acesso ao sistema de gestão administrativa e planejamento e controle da manutenção.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
