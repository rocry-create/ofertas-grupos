"use client";

import { useEffect, useState } from "react";
import { Tag, RefreshCw, Sparkles, Send, Package, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Offer {
  id: string;
  discountPct: number;
  status: string;
  product: {
    name: string;
    imageUrl: string | null;
  } | null;
}

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-secondary text-foreground",
  APPROVED: "bg-emerald-500/15 text-emerald-500",
  REJECTED: "bg-red-500/15 text-red-500",
};

export default function OfertasPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function loadOffers() {
    setLoading(true);
    try {
      const data = await apiFetch("/offers");
      setOffers(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar ofertas");
    } finally {
      setLoading(false);
    }
  }

  async function generateOffers() {
    setGenerating(true);
    setMsg("");
    try {
      const data = await apiFetch("/offers/generate", {
        method: "POST",
        body: JSON.stringify({ minDiscountPct: 10 }),
      });
      setMsg(`${data.generated} ofertas geradas`);
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao gerar ofertas");
    } finally {
      setGenerating(false);
    }
  }

  async function approveOffer(id: string) {
    setBusy(id);
    try {
      await apiFetch(`/offers/${id}/approve`, { method: "PATCH" });
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao aprovar oferta");
    } finally {
      setBusy(null);
    }
  }

  async function rejectOffer(id: string) {
    setBusy(id);
    try {
      await apiFetch(`/offers/${id}/reject`, { method: "PATCH" });
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao rejeitar oferta");
    } finally {
      setBusy(null);
    }
  }

  async function deleteOffer(id: string) {
    const ok = window.confirm("Excluir esta oferta?");
    if (!ok) return;
    setBusy(id);
    try {
      await apiFetch(`/offers/${id}`, { method: "DELETE" });
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao excluir oferta");
    } finally {
      setBusy(null);
    }
  }

  async function deleteAllOffers() {
    const ok = window.confirm("Excluir TODAS as ofertas?");
    if (!ok) return;
    try {
      const data = await apiFetch("/offers/all/bulk", { method: "DELETE" });
      setMsg(`${data.deleted} oferta(s) excluida(s)`);
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao excluir todas as ofertas");
    }
  }

  async function publishOffer(id: string) {
    setBusy(id);
    try {
      const data = await apiFetch(`/publications/${id}/enqueue`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMsg(`${data.enqueued} publicacoes enfileiradas`);
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao publicar oferta");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Tag className="h-6 w-6 text-orange-500" />
          Ofertas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ofertas geradas a partir de quedas de preço reais
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={generateOffers}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4" />
          {generating ? "Gerando..." : "Gerar oferta automaticamente"}
        </button>
        <button
          onClick={loadOffers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border text-foreground text-sm font-medium px-4 py-2 hover:bg-secondary transition-colors disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar lista
        </button>
        <button
          onClick={deleteAllOffers}
          disabled={offers.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 text-red-500 text-sm font-medium px-4 py-2 hover:bg-red-500/10 transition-colors disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Excluir Todos
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Carregando...</p>
      ) : offers.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">
          Nenhuma oferta ainda. Clique em Gerar ofertas automaticamente.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {offers.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
            >
              <div className="relative aspect-square bg-secondary">
                {o.product?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.product.imageUrl}
                    alt={o.product?.name || "Produto"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute top-2 left-2 rounded-full bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 shadow">
                  {o.discountPct}% OFF
                </span>
              </div>
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {o.product?.name || "-"}
                </p>
                <span
                  className={`self-start rounded-full text-[10px] font-semibold px-2 py-0.5 ${
                    statusColor[o.status] || "bg-secondary text-foreground"
                  }`}
                >
                  {statusLabel[o.status] || o.status}
                </span>

                <div className="mt-auto flex gap-2 pt-1 flex-wrap">
                  {o.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => approveOffer(o.id)}
                        disabled={busy === o.id}
                        className="flex-1 inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 transition-colors disabled:opacity-60"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => rejectOffer(o.id)}
                        disabled={busy === o.id}
                        className="inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50 text-xs font-medium px-3 py-2 transition-colors"
                      >
                        Rejeitar
                      </button>
                    </>
                  )}
                  {o.status === "APPROVED" && (
                    <button
                      onClick={() => publishOffer(o.id)}
                      disabled={busy === o.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 transition-colors disabled:opacity-60"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Publicar
                    </button>
                  )}
                  <button
                    onClick={() => deleteOffer(o.id)}
                    disabled={busy === o.id}
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
