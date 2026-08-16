"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Plus, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  marketplace: string;
  category: string | null;
  currentPrice: number;
  previousPrice: number | null;
  imageUrl: string | null;
  affiliateUrl: string | null;
  originalUrl: string;
}

const manualMarketplaces = ["SHEIN", "TEMU", "TIKTOK_SHOP", "OUTRA"];

function money(v: number | null) {
  if (v === null) return null;
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function discountPct(current: number, previous: number | null) {
  if (!previous || previous <= current) return null;
  return Math.round(((previous - current) / previous) * 100);
}

export default function CatalogoViralPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    marketplace: "SHEIN",
    currentPrice: "",
    previousPrice: "",
    affiliateUrl: "",
    imageUrl: "",
  });

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await apiFetch("/products");
      setProducts(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar catalogo");
    } finally {
      setLoading(false);
    }
  }

  async function publishProduct(productId: string) {
    setMsg("");
    try {
      const offer = await apiFetch(`/offers/quick/${productId}`, { method: "POST" });
      await apiFetch(`/publications/${offer.id}/enqueue`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMsg("Produto publicado nos grupos com sucesso");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao publicar produto");
    }
  }

  async function addManualProduct() {
    if (!form.name || !form.currentPrice || !form.affiliateUrl) {
      setMsg("Preencha nome, preco atual e link de afiliado");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/products/manual", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          marketplace: form.marketplace,
          currentPrice: Number(form.currentPrice),
          previousPrice: form.previousPrice ? Number(form.previousPrice) : null,
          affiliateUrl: form.affiliateUrl,
          imageUrl: form.imageUrl || null,
        }),
      });
      setMsg("Produto adicionado ao catalogo");
      setForm({
        name: "",
        marketplace: "SHEIN",
        currentPrice: "",
        previousPrice: "",
        affiliateUrl: "",
        imageUrl: "",
      });
      setShowForm(false);
      loadProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao adicionar produto");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Catalogo Viral
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vitrine com produtos de todas as lojas, automaticos e manuais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProducts} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Adicionar manualmente
          </Button>
        </div>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      {showForm && (
        <Card className="border-border">
          <CardContent className="space-y-4">
            <p className="font-semibold text-sm">
              Adicionar produto manual (Shein, Temu, TikTok Shop ou outra)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome do produto</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Loja</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={form.marketplace}
                  onChange={(e) => setForm({ ...form, marketplace: e.target.value })}
                >
                  {manualMarketplaces.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Preco atual</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.currentPrice}
                  onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preco anterior (opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.previousPrice}
                  onChange={(e) => setForm({ ...form, previousPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Link de afiliado</Label>
                <Input
                  value={form.affiliateUrl}
                  onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Link da imagem (opcional)</Label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={addManualProduct} disabled={saving}>
              {saving ? "Salvando..." : "Adicionar ao catalogo"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum produto no catalogo ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => {
            const pct = discountPct(p.currentPrice, p.previousPrice);
            return (
              <Card
                key={p.id}
                className="border-border overflow-hidden py-0 shadow-sm hover:shadow-lg transition-shadow"
              >
                {p.imageUrl && (
                  <img src={p.imageUrl} alt={p.name} className="h-32 w-full object-cover" />
                )}
                <CardContent className="px-4 py-3">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{p.marketplace}</p>
                  <div className="flex items-center gap-2 mb-2">
                    {p.previousPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {money(p.previousPrice)}
                      </span>
                    )}
                    <span className="text-base font-bold text-primary">
                      {money(p.currentPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {pct !== null && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        {pct}% OFF
                      </span>
                    )}
                    <Button size="sm" className="h-6 text-xs px-2" onClick={() => publishProduct(p.id)}>Publicar</Button>
                    {p.affiliateUrl && (
                      <a
                      
                        href={p.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-primary"
                      >
                        Comprar
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
