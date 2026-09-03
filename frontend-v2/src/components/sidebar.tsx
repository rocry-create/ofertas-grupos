"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  Zap,
  Store,
  Smartphone,
  MessageCircle,
  Bot,
  Send,
  BarChart3,
  FileText,
  Settings,
  ExternalLink,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/ofertas", label: "Ofertas", icon: Tag },
  { href: "/automacao", label: "Automação", icon: Zap },
  { href: "/marketplaces", label: "Marketplaces", icon: Store },
  { href: "/whatsapp", label: "Grupos de WhatsApp", icon: MessageCircle },
  { href: "/conexao-whatsapp", label: "Conexao WhatsApp", icon: Smartphone },
  { href: "/ia", label: "IA", icon: Bot },
  { href: "/publicacoes", label: "Publicações", icon: Send },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/documentos", label: "Documentos", icon: FileText },

];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Catálogo Viral" className="h-8 w-8 shrink-0 object-contain" />
          <span className="text-white font-semibold text-sm">Catálogo Viral</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white p-2">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
          "w-64"
        )}
      >
        <div className={cn("h-16 hidden md:flex items-center border-b border-sidebar-border", collapsed ? "justify-center px-0" : "justify-between px-5")}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <img src="/logo-icon.png" alt="Catálogo Viral" className="h-10 w-10 shrink-0 object-contain" />
              <div className="leading-tight">
                <div className="text-sm font-bold text-white">Catálogo Viral</div>
                <div className="text-[10px] font-semibold text-orange-500">Inteligente</div>
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="text-white/50 hover:text-white p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <div className="h-14 md:hidden" />

        <div className={cn("px-5 pt-4 pb-1", collapsed ? "md:hidden" : "")}>
          <span className="text-[10px] font-semibold tracking-wider text-white/35">MENU</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-all",
                  collapsed ? "md:justify-center md:px-0" : "",
                  active
                    ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/30 font-semibold"
                    : "text-white/60 hover:bg-sidebar-accent hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn(collapsed ? "md:hidden" : "")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={cn("p-3 border-t border-sidebar-border", collapsed ? "flex justify-center" : "")}>
          <Link
            href="/catalogo-viral"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/40 text-white text-xs py-2.5 px-3 hover:bg-sidebar-accent transition-colors",
              collapsed ? "md:w-10 md:px-0 md:justify-center" : "w-full"
            )}
            title={collapsed ? "Ver Catálogo Público" : undefined}
          >
            <div className="h-7 w-7 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
              <ExternalLink className="h-3.5 w-3.5 text-orange-500" />
            </div>
            {!collapsed && (
              <div className="leading-tight flex-1">
                <div className="font-medium">Ver Catálogo Público</div>
                <div className="text-[10px] text-white/40">Ofertas em tempo real</div>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
