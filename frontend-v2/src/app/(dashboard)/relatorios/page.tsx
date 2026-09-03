"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, Tag, Send, MessageCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  totalProducts: number;
  totalOffers: number;
  totalPublicationsSent: number;
  activeGroups: number;
  offersByStatus: { status: string; _count: number }[];
  productsByMarketplace: { marketplace: string; _count: number }[];
}

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const statusColor: Record<string, string> = {
  PENDING: "#94A3B8",
  APPROVED: "#22C55E",
  REJECTED: "#EF4444",
};

export default function RelatoriosPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const offersPieData = stats?.offersByStatus.map((o) => ({
    name: statusLabel[o.status] || o.status,
    value: o._count,
    color: statusColor[o.status] || "#94A3B8",
  })) || [];

  const marketplaceBarData = stats?.productsByMarketplace.map((m) => ({
    nome: m.marketplace,
    valor: m._count,
  })) || [];

  const totalOffersCount = offersPieData.reduce((sum, o) => sum + o.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <BarChart3 className="h-6 w-6 text-orange-500" />
          Relatórios
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Números reais do sistema: produtos, ofertas e publicações
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Carregando...</p>
      ) : !stats ? (
        <p className="text-sm text-muted-foreground py-6">Não foi possível carregar os relatórios.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Produtos Monitorados", value: stats.totalProducts, icon: Package },
              { label: "Ofertas Geradas", value: stats.totalOffers, icon: Tag },
              { label: "Publicações Enviadas", value: stats.totalPublicationsSent, icon: Send },
              { label: "Grupos Ativos", value: stats.activeGroups, icon: MessageCircle },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-xl border border-border bg-card shadow-sm p-4">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-2">
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl border border-border bg-card shadow-sm p-5">
              <div className="text-sm font-semibold text-foreground mb-4">Ofertas por Status</div>
              {totalOffersCount === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhuma oferta gerada ainda.</p>
              ) : (
                <>
                  <div className="flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={offersPieData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                          {offersPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <div className="text-xl font-bold text-foreground">{totalOffersCount}</div>
                      <div className="text-[10px] text-muted-foreground">Total de Ofertas</div>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    {offersPieData.map((o) => (
                      <div key={o.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />
                          <span className="text-foreground">{o.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{o.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm p-5">
              <div className="text-sm font-semibold text-foreground mb-4">Produtos por Marketplace</div>
              {marketplaceBarData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhum produto cadastrado ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={marketplaceBarData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis dataKey="nome" type="category" tick={{ fontSize: 11, fill: "var(--foreground)" }} width={100} />
                    <Bar dataKey="valor" fill="#F97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
