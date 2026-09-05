"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, RefreshCw, Download, Store } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string | null;
  marketplace: string;
  currentPrice: number;
  previousPrice: number | null;
  imageUrl: string | null;
  commissionPct: number | null;
  commissionValue: number | null;
}

const MARKETPLACES = [
  { key: "TIKTOK_SHOP", label: "TikTok Shop" },
  { key: "SHOPEE", label: "Shopee" },
  { key: "MERCADO_LIVRE", label: "Mercado Livre" },
  { key: "AMAZON", label: "Amazon" },
  { key: "TEMU", label: "Temu" },
  { key: "SHEIN", label: "Shein" },
];

const CATEGORIES = [
  "Alimentos & Bebidas",
  "Beleza",
  "Casa, Cozinha & Decoração",
  "Eletrônicos",
  "Infantil & Baby",
  "Moda",
  "Pets",
  "Saúde",
];

const MARKETPLACE_COLORS: Record<string, string> = {
  TIKTOK_SHOP: "bg-black text-white",
  SHOPEE: "bg-orange-500 text-white",
  MERCADO_LIVRE: "bg-yellow-400 text-black",
  AMAZON: "bg-slate-800 text-white",
  TEMU: "bg-orange-600 text-white",
  SHEIN: "bg-black text-white",
};

function money(v: number | null) {
  if (v === null || v === undefined) return "-";
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function marketplaceLabel(key: string) {
  return MARKETPLACES.find((m) => m.key === key)?.label || key;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [divulgando, setDivulgando] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("TODOS");
  const [categoryFilter, setCategoryFilter] = useState<string>("TODAS");

  async function loadProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (marketplaceFilter !== "TODOS") params.set("marketplace", marketplaceFilter);
      if (categoryFilter !== "TODAS") params.set("category", categoryFilter);
      const qs = params.toString();
      const data = await apiFetch(`/products${qs ? `?${qs}` : ""}`);
      setProducts(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  async function importTest() {
    setImporting(true);
    setMsg("");
    try {
      const data = await apiFetch("/products/import-test", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMsg(`${data.imported} produtos importados com sucesso`);
      loadProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao importar produtos");
    } finally {
      setImporting(false);
    }
  }

  async function divulgar(productId: string) {
    setDivulgando(productId);
    setMsg("");
    try {
      await apiFetch(`/offers/quick/${productId}`, { method: "POST" });
      setMsg("Produto enviado para o Catálogo Viral!");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao divulgar produto");
    } finally {
      setDivulgando(null);
    }
  }

  async function excluir(productId: string) {
    if (!confirm("Excluir este produto?")) return;
    try {
      await apiFetch(`/products/${productId}`, { method: "DELETE" });
      setMsg("Produto excluido");
      loadProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao excluir produto");
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketplaceFilter, categoryFilter]);

  const filterChips = useMemo(
    () => [{ key: "TODOS", label: "Início" }, ...MARKETPLACES],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Package className="h-6 w-6 text-orange-500" />
          Produtos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Produtos monitorados para geração de ofertas
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={importTest}
          disabled={importing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {importing ? "Importando..." : "Importar produtos de teste"}
        </button>
        <button
          onClick={loadProducts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border text-foreground text-sm font-medium px-4 py-2 hover:bg-secondary transition-colors disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar lista
        </button>
      </div>

      {/* Filtro por plataforma */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {filterChips.map((m) => (
          <button
            key={m.key}
            onClick={() => setMarketplaceFilter(m.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              marketplaceFilter === m.key
                ? "bg-orange-500 border-orange-500 text-white"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {m.key === "TODOS" && <Store className="h-3.5 w-3.5" />}
            {m.label}
          </button>
        ))}
      </div>

      {/* Lista de produtos em cards, com rolagem */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Carregando...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">
          Nenhum produto encontrado com esse filtro.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
            >
              <div className="relative aspect-square bg-secondary">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                )}
                <span
                  className={`absolute top-2 left-2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${
                    MARKETPLACE_COLORS[p.marketplace] || "bg-secondary text-foreground"
                  }`}
                  title={marketplaceLabel(p.marketplace)}
                >
                  {marketplaceLabel(p.marketplace).charAt(0)}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                {p.category && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {p.category}
                  </span>
                )}
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Preço: <span className="text-foreground font-medium">{money(p.currentPrice)}</span>
                </p>
                {(p.commissionValue || p.commissionPct) && (
                  <p className="text-xs text-emerald-500 font-medium">
                    Comissão: {p.commissionValue ? money(p.commissionValue) : ""}
                    {p.commissionPct ? ` (${p.commissionPct}%)` : ""}
                  </p>
                )}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => divulgar(p.id)}
                    disabled={divulgando === p.id}
                    className="flex-1 inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 transition-colors disabled:opacity-60"
                  >
                    {divulgando === p.id ? "Enviando..." : "Publicar"}
                  </button>
                  <button
                    onClick={() => excluir(p.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50 text-xs font-medium px-3 py-2 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
