"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Tag,
  Send,
  MessageCircle,
  Plus,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  totalProducts: number;
  totalOffers: number;
  totalPublicationsSent: number;
  activeGroups: number;
  offersByStatus: { status: string; _count: number }[];
  productsByMarketplace: { marketplace: string; _count: number }[];
  recentOffers: {
    id: string;
    discountPct: number;
    status: string;
    product: { name: string; marketplace: string; currentPrice: number; previousPrice: number | null } | null;
  }[];
  publicationsByDay: Record<string, number>;
}

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

function money(v: number) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/dashboard/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats
    ? [
        { label: "Produtos Monitorados", value: stats.totalProducts, icon: Package },
        { label: "Ofertas Geradas", value: stats.totalOffers, icon: Tag },
        { label: "Publicações Enviadas", value: stats.totalPublicationsSent, icon: Send },
        { label: "Grupos WhatsApp Ativos", value: stats.activeGroups, icon: MessageCircle },
      ]
    : [];

  const marketplaceData = stats?.productsByMarketplace.map((m) => ({
    nome: m.marketplace,
    valor: m._count,
  })) || [];

  const statusLabelMap: Record<string, string> = { PENDING: "Pendente", APPROVED: "Aprovada", REJECTED: "Rejeitada" };
  const statusColorMap: Record<string, string> = { PENDING: "#94A3B8", APPROVED: "#22C55E", REJECTED: "#EF4444" };
  const offersPieData = (stats?.offersByStatus || []).map((o) => ({
    name: statusLabelMap[o.status] || o.status,
    value: o._count,
    color: statusColorMap[o.status] || "#94A3B8",
  }));
  const totalOffersCount = offersPieData.reduce((sum, o) => sum + o.value, 0);

  const publicationsChartData = stats
    ? Object.entries(stats.publicationsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, count]) => ({ d: day.slice(5).split("-").reverse().join("/"), v: count }))
    : [];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-transparent px-5 py-6 md:px-7">
        <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100" style={{ background: 'radial-gradient(ellipse 400px 250px at 85% 20%, rgba(249,115,22,0.18), transparent 70%)' }} />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-semibold uppercase tracking-wide px-3 py-1 mb-3">
              <Sparkles className="h-3 w-3" />
              Painel Inteligente
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Bem-vindo ao <span className="text-orange-500">Catálogo Viral Inteligente</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl mb-4">
              Monitore produtos, identifique ofertas com alto desconto e publique automaticamente nos seus grupos de WhatsApp — tudo em um só lugar.
            </p>
            <div className="flex items-center gap-3">
              <a href="/produtos" className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 transition-colors">
                <Plus className="h-4 w-4" />
                Ver Produtos
              </a>
              <a href="/catalogo-viral" className="inline-flex items-center gap-1.5 rounded-lg border border-border text-foreground text-sm font-medium px-4 py-2 hover:bg-secondary transition-colors">
                <ExternalLink className="h-4 w-4" />
                Ver Catálogo
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-card shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold leading-tight text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border bg-card shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-sm text-foreground">Últimas Ofertas Geradas</div>
              <a href="/ofertas" className="text-xs text-orange-500 font-medium">Ver todas →</a>
            </div>
            {!stats || stats.recentOffers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhuma oferta gerada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-2 font-medium pr-3">Produto</th>
                      <th className="pb-2 font-medium pr-3">Origem</th>
                      <th className="pb-2 font-medium pr-3">Preço</th>
                      <th className="pb-2 font-medium pr-3">Desconto</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOffers.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-3 font-medium text-foreground whitespace-nowrap max-w-[220px] truncate">{o.product?.name || "-"}</td>
                        <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{o.product?.marketplace || "-"}</td>
                        <td className="py-3 pr-3 text-orange-500 font-semibold whitespace-nowrap">{o.product ? money(o.product.currentPrice) : "-"}</td>
                        <td className="py-3 pr-3 whitespace-nowrap">{o.discountPct}%</td>
                        <td className="py-3 whitespace-nowrap text-xs">{statusLabel[o.status] || o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm p-5">
            <div className="text-sm font-semibold text-foreground mb-1">Publicações Enviadas (7 dias)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={publicationsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                <Line type="monotone" dataKey="v" stroke="#F97316" strokeWidth={2} dot={{ fill: "#F97316" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card shadow-sm p-5">
            <div className="text-sm font-semibold text-foreground mb-4">Ofertas por Status</div>
            {totalOffersCount === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhuma oferta gerada ainda.</p>
            ) : (
              <>
                <div className="flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={offersPieData} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={2}>
                        {offersPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <div className="text-lg font-bold text-foreground">{totalOffersCount}</div>
                    <div className="text-[10px] text-muted-foreground">Total</div>
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={marketplaceData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis dataKey="nome" type="category" tick={{ fontSize: 11, fill: "var(--foreground)" }} width={90} />
                <Bar dataKey="valor" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
