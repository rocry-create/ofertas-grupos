"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Publication {
  id: string;
  status: string;
  sentAt: string | null;
  offer: {
    product: {
      name: string;
    } | null;
  } | null;
}

const statusLabel: Record<string, string> = {
  QUEUED: "Na fila",
  SENT: "Enviada",
  FAILED: "Falhou",
  PENDING: "Pendente",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  QUEUED: "secondary",
  SENT: "default",
  FAILED: "destructive",
  PENDING: "secondary",
};

function formatDate(v: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleString("pt-BR");
}

export default function PublicacoesPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadPublications() {
    setLoading(true);
    try {
      const data = await apiFetch("/publications");
      setPublications(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar publicacoes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPublications();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          Publicacoes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Historico de envios para os grupos de WhatsApp
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={loadPublications} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Atualizar lista
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground p-6">Carregando...</p>
          ) : publications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Nenhuma publicacao ainda.
            </p>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Produto</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Enviado em</th>
                </tr>
              </thead>
              <tbody>
                {publications.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">
                      {p.offer?.product?.name || "-"}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant[p.status] || "secondary"}>
                        {statusLabel[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{formatDate(p.sentAt)}</td>
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
