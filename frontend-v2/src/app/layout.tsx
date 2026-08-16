import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catalogo Viral Inteligente",
  description: "Painel de gestao de ofertas e publicacoes automaticas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
