"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, RefreshCw, Sparkles, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Offer {
  id: string;
  discountPct: number;
  status: string;
  product: {
    name: string;
  } | null;
}

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

export default function OfertasPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
    try {
      await apiFetch(`/offers/${id}/approve`, { method: "PATCH" });
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao aprovar oferta");
    }
  }

  async function rejectOffer(id: string) {
    try {
      await apiFetch(`/offers/${id}/reject`, { method: "PATCH" });
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao rejeitar oferta");
    }
  }

  async function publishOffer(id: string) {
    try {
      const data = await apiFetch(`/publications/${id}/enqueue`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMsg(`${data.enqueued} publicacoes enfileiradas`);
      loadOffers();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao publicar oferta");
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          Ofertas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ofertas geradas a partir de quedas de preco reais
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={generateOffers} disabled={generating}>
          <Sparkles className="h-4 w-4" />
          {generating ? "Gerando..." : "Gerar ofertas automaticamente"}
        </Button>
        <Button variant="outline" onClick={loadOffers} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Atualizar lista
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground p-6">Carregando...</p>
          ) : offers.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Nenhuma oferta ainda. Clique em Gerar ofertas automaticamente.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Produto</th>
                  <th className="p-4 font-medium">Desconto</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{o.product?.name || "-"}</td>
                    <td className="p-4 font-semibold text-primary">{o.discountPct}%</td>
                    <td className="p-4">
                      <Badge variant={statusVariant[o.status] || "secondary"}>
                        {statusLabel[o.status] || o.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {o.status === "PENDING" && (
                          <>
                            <Button size="sm" onClick={() => approveOffer(o.id)}>
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectOffer(o.id)}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {o.status === "APPROVED" && (
                          <Button size="sm" onClick={() => publishOffer(o.id)}>
                            <Send className="h-3.5 w-3.5" />
                            Publicar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
