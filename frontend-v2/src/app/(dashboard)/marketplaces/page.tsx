"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Store, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Setting {
  key: string;
  configured: boolean;
}

interface MarketplaceInfo {
  name: string;
  keys: string[];
  automatic: boolean;
  note: string;
}

const marketplaces: MarketplaceInfo[] = [
  { name: "Shopee", keys: ["SHOPEE_APP_ID", "SHOPEE_SECRET_KEY"], automatic: true, note: "" },
  { name: "Amazon", keys: ["AMAZON_ACCESS_KEY", "AMAZON_SECRET_KEY", "AMAZON_ASSOCIATE_TAG"], automatic: true, note: "" },
  { name: "Mercado Livre", keys: ["ML_CLIENT_ID", "ML_CLIENT_SECRET"], automatic: true, note: "" },
  { name: "Magalu / Casas Bahia / Kabum", keys: ["AWIN_API_TOKEN", "LOMADEE_APP_TOKEN"], automatic: true, note: "via Awin ou Lomadee" },
  { name: "AliExpress", keys: ["ALIEXPRESS_APP_KEY", "ALIEXPRESS_APP_SECRET"], automatic: true, note: "" },
  { name: "Temu", keys: [], automatic: false, note: "Requer contato com gerente de parceria - adicione manualmente pelo Catalogo Viral" },
  { name: "Shein", keys: [], automatic: false, note: "Sem API disponivel - adicione manualmente pelo Catalogo Viral" },
  { name: "TikTok Shop", keys: [], automatic: false, note: "Sem API disponivel - adicione manualmente pelo Catalogo Viral" },
];

export default function MarketplacesPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadSettings() {
    try {
      const data = await apiFetch("/settings");
      setSettings(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar configuracoes");
    }
  }

  function isConfigured(keys: string[]) {
    if (keys.length === 0) return false;
    return keys.every((k) => settings.find((s) => s.key === k)?.configured);
  }

  async function importShopee() {
    if (!keyword) {
      setMsg("Digite uma palavra-chave de busca");
      return;
    }
    setSearching(true);
    setMsg("");
    try {
      const data = await apiFetch("/marketplaces/shopee/import", {
        method: "POST",
        body: JSON.stringify({ keyword, limit: 10 }),
      });
      setMsg(`${data.imported} produtos importados da Shopee`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao importar da Shopee");
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          Marketplaces
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Status de conexao de cada loja
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <Card className="border-border">
        <CardContent className="space-y-3">
          <p className="font-semibold text-sm">Buscar produtos reais na Shopee</p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: fone de ouvido, tenis, panela"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button onClick={importShopee} disabled={searching}>
              <Search className="h-4 w-4" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketplaces.map((m) => {
          const configured = isConfigured(m.keys);
          return (
            <Card key={m.name} className="border-border">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{m.name}</p>
                  {m.note && <p className="text-xs text-muted-foreground mt-1">{m.note}</p>}
                </div>
                {!m.automatic ? (
                  <Badge variant="secondary">Manual</Badge>
                ) : configured ? (
                  <Badge variant="default">Conectado</Badge>
                ) : (
                  <Badge variant="secondary">Nao configurado</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
