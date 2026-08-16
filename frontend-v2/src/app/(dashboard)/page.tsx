import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  Tag,
  Send,
  MessageCircle,
  Flame,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const stats = [
  { label: "Produtos Monitorados", value: 128, delta: "+12 hoje", icon: Package, color: "bg-orange-500" },
  { label: "Ofertas Encontradas", value: 34, delta: "+5 hoje", icon: Tag, color: "bg-rose-500" },
  { label: "Publicações Realizadas", value: 21, delta: "+3 hoje", icon: Send, color: "bg-emerald-500" },
  { label: "Grupos WhatsApp Ativos", value: 3, delta: "todos online", icon: MessageCircle, color: "bg-blue-500" },
];

const ofertas = [
  {
    nome: "Smart TV Samsung 50\" 4K",
    marketplace: "Amazon",
    precoAntigo: 3499,
    precoAtual: 2299,
    desconto: 34,
    img: "electronics-tv",
  },
  {
    nome: "Air Fryer 5L Digital",
    marketplace: "Shopee",
    precoAntigo: 299.9,
    precoAtual: 189.9,
    desconto: 37,
    img: "kitchen-fryer",
  },
  {
    nome: "Tênis Esportivo Runner",
    marketplace: "Mercado Livre",
    precoAntigo: 259.9,
    precoAtual: 149.9,
    desconto: 42,
    img: "sneakers",
  },
  {
    nome: "Perfume Importado 100ml",
    marketplace: "AliExpress",
    precoAntigo: 189.9,
    precoAtual: 99.9,
    desconto: 47,
    img: "perfume",
  },
  {
    nome: "Fone Bluetooth TWS",
    marketplace: "Temu",
    precoAntigo: 119.9,
    precoAtual: 59.9,
    desconto: 50,
    img: "earbuds",
  },
  {
    nome: "Mochila Notebook Impermeável",
    marketplace: "Magalu",
    precoAntigo: 159.9,
    precoAtual: 89.9,
    desconto: 44,
    img: "backpack",
  },
];

const marketplaces = [
  { nome: "Shopee", emoji: "🛍️", ofertas: 42 },
  { nome: "Mercado Livre", emoji: "🟡", ofertas: 31 },
  { nome: "Amazon", emoji: "📦", ofertas: 18 },
  { nome: "AliExpress", emoji: "🔶", ofertas: 24 },
  { nome: "Magalu", emoji: "🏠", ofertas: 9 },
  { nome: "Temu", emoji: "🧡", ofertas: 15 },
  { nome: "Shein", emoji: "👗", ofertas: 6 },
];

function money(v: number) {
  return "R$ " + v.toFixed(2).replace(".", ",");
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-7 py-6 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-orange-100 text-xs font-semibold uppercase tracking-wide mb-1">
            <Flame className="h-3.5 w-3.5" />
            Painel de Controle
          </div>
          <h1 className="text-2xl font-bold mb-1">Bem-vindo ao Catálogo Viral Inteligente</h1>
          <p className="text-orange-50 text-sm max-w-xl">
            Monitore milhares de produtos e publique ofertas nos seus grupos de WhatsApp automaticamente.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button className="bg-white text-orange-600 hover:bg-orange-50 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Buscar Promoções
          </Button>
          <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            Ver Ofertas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border shadow-sm hover:shadow-md transition-shadow duration-200 py-4"
            >
              <CardContent className="px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`h-9 w-9 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.delta}</span>
                </div>
                <div className="text-2xl font-bold leading-tight">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Flame className="h-4 w-4 text-primary" />
              Maiores Descontos
            </div>
            <a href="/ofertas" className="text-xs text-primary font-medium">
              Ver todas
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ofertas.map((o) => (
              <Card
                key={o.nome}
                className="border-border overflow-hidden py-0 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <img
                  src={`https://picsum.photos/seed/${o.img}/400/220`}
                  alt={o.nome}
                  className="h-32 w-full object-cover"
                />
                <CardContent className="px-4 py-3">
                  <p className="text-sm font-semibold truncate">{o.nome}</p>
                  <p className="text-xs text-muted-foreground mb-2">{o.marketplace}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground line-through">
                      {money(o.precoAntigo)}
                    </span>
                    <span className="text-base font-bold text-primary">
                      {money(o.precoAtual)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      {o.desconto}% OFF
                    </span>
                    <Button size="sm" className="h-7 text-xs px-3">
                      Ver Oferta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="border-border shadow-sm">
            <CardContent className="px-5 py-1">
              <div className="flex items-center gap-2 font-semibold text-sm mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                Por Marketplace
              </div>
              <div className="space-y-3">
                {marketplaces.map((m) => (
                  <div
                    key={m.nome}
                    className="flex items-center justify-between border-b border-border pb-2.5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.emoji}</span>
                      <span className="text-sm">{m.nome}</span>
                    </div>
                    <span className="text-sm font-semibold">{m.ofertas}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Desconto médio</span>
                <span className="text-sm font-bold text-primary">42%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
