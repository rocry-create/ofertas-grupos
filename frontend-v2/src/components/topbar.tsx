"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  FileText,
  Settings,
  HelpCircle,
  ClipboardList,
  LogOut,
  Circle,
  Sun,
  Moon,
} from "lucide-react";
import { clearToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ofertas.allcepts.com/api";

export function Topbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => setMounted(true), []);

  async function checkHealth() {
    try {
      const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
      setOnline(res.ok);
    } catch {
      setOnline(false);
    }
  }

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleRefreshAll() {
    setRefreshing(true);
    await checkHealth();
    setTimeout(() => setRefreshing(false), 600);
  }

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  const navButtonClass =
    "flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 hover:bg-secondary transition-colors";

  const iconButtonClass =
    "text-muted-foreground hover:text-foreground p-2 rounded-md border border-border hover:bg-secondary transition-colors";

  return (
    <>
      {/* Versão desktop */}
      <div className="hidden md:flex h-16 items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-30 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefreshAll}
            className="flex items-center gap-2 text-sm font-semibold text-primary-foreground bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-lg px-3 py-2 transition-colors shadow-sm shadow-primary/30"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar Tudo
          </button>
          <button className={navButtonClass}>
            <Search className="h-4 w-4" />
            Pesquisa Avançada
          </button>
          <button className={navButtonClass}>
            <SlidersHorizontal className="h-4 w-4" />
            Filtros Globais
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className={navButtonClass}>
            <FileText className="h-4 w-4" />
            Gerar Relatório
          </button>
          <button className={navButtonClass}>
            <Settings className="h-4 w-4" />
            Configurações do Sistema
          </button>
          <button className={navButtonClass}>
            <HelpCircle className="h-4 w-4" />
            Ajuda
          </button>
          <button className={navButtonClass}>
            <ClipboardList className="h-4 w-4" />
            Log de Atividade
          </button>

          <button onClick={toggleTheme} className={iconButtonClass} title="Alternar tema">
            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-1 pl-3 border-l border-border">
            <Circle
              className={`h-2 w-2 ${online ? "fill-emerald-500 text-emerald-500" : online === false ? "fill-red-500 text-red-500" : "fill-muted-foreground text-muted-foreground"}`}
            />
            {online === null ? "Verificando..." : online ? "Sistema online" : "Sistema offline"}
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary transition-colors" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Versão mobile - compacta */}
      <div className="flex md:hidden items-center justify-between px-3 py-2 border-b border-border bg-background sticky top-14 z-20 gap-2 overflow-x-auto">
        <button
          onClick={handleRefreshAll}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg px-3 py-1.5 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={toggleTheme} className="text-muted-foreground p-1.5 rounded-md border border-border shrink-0" title="Alternar tema">
            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Circle
            className={`h-2 w-2 shrink-0 ${online ? "fill-emerald-500 text-emerald-500" : online === false ? "fill-red-500 text-red-500" : "fill-muted-foreground text-muted-foreground"}`}
          />
          <button onClick={handleLogout} className="text-muted-foreground p-1.5 rounded-md" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
