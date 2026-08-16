"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  Sparkles,
  Store,
  MessageCircle,
  Bot,
  Send,
  Settings,
  Flame,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/ofertas", label: "Ofertas", icon: Tag },
  { href: "/catalogo-viral", label: "Catálogo Viral", icon: Sparkles },
  { href: "/marketplaces", label: "Marketplaces", icon: Store },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/ia", label: "IA", icon: Bot },
  { href: "/publicacoes", label: "Publicações", icon: Send },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col">
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground leading-tight">
            Catálogo Viral
          </h1>
          <p className="text-xs text-sidebar-foreground/60">Caçador de Ofertas</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <Link
          href="/catalogo-viral"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold py-3 hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Ver Catálogo Público
        </Link>
      </div>
    </aside>
  );
}
