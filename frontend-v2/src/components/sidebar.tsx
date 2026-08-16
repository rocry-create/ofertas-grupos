"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  Menu,
  X,
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-sidebar-foreground font-bold text-sm">Catálogo Viral</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-sidebar-foreground p-2">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0"
        )}
      >
        <div className="px-5 py-6 hidden md:flex items-center gap-3">
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
        <div className="h-14 md:hidden" />
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary text-white text-sm font-semibold py-3 hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Catálogo Público
          </Link>
        </div>
      </aside>
    </>
  );
}
