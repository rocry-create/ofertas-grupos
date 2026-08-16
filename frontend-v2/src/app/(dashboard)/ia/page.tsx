"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function IAPage() {
  const [configured, setConfigured] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadSettings() {
    try {
      const data = await apiFetch("/settings");
      const key = data.find((s: { key: string }) => s.key === "AI_API_KEY");
      setConfigured(!!key?.configured);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar configuracoes");
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          IA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Geracao automatica de titulos e descricoes chamativas
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <Card className="border-border">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Status da IA</p>
            <Badge variant={configured ? "default" : "secondary"}>
              {configured ? "Configurada" : "Nao configurada"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            A IA e opcional. O sistema ja gera mensagens de oferta automaticamente sem ela,
            usando nome do produto, preco e desconto. A IA deixaria o texto mais persuasivo,
            mas tem um custo pequeno por uso (nao e mensalidade).
          </p>
          <p className="text-sm text-muted-foreground">
            Para ativar, va em Configuracoes e cole uma chave de API da OpenAI ou Anthropic.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
