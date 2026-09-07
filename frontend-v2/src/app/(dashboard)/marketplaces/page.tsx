"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Store, Search, Save, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Setting {
  key: string;
  configured: boolean;
}

interface KeyField {
  key: string;
  label: string;
}

interface MarketplaceInfo {
  name: string;
  fields: KeyField[];
  automatic: boolean;
  note: string;
  anyOf?: boolean;
}

const marketplaces: MarketplaceInfo[] = [
  {
    name: "Shopee",
    fields: [
      { key: "SHOPEE_APP_ID", label: "App ID" },
      { key: "SHOPEE_SECRET_KEY", label: "Secret Key" },
    ],
    automatic: true,
    note: "",
  },
  {
    name: "Amazon",
    fields: [
      { key: "AMAZON_ACCESS_KEY", label: "Access Key" },
      { key: "AMAZON_SECRET_KEY", label: "Secret Key" },
      { key: "AMAZON_ASSOCIATE_TAG", label: "Associate Tag" },
    ],
    automatic: true,
    note: "",
  },
  {
    name: "Mercado Livre",
    fields: [
      { key: "ML_CLIENT_ID", label: "Client ID" },
      { key: "ML_CLIENT_SECRET", label: "Client Secret" },
    ],
    automatic: true,
    note: "",
  },
  {
    name: "Magalu / Casas Bahia / Kabum",
    anyOf: true,
    fields: [
      { key: "AWIN_API_TOKEN", label: "Awin API Token" },
      { key: "LOMADEE_APP_TOKEN", label: "Lomadee App Token" },
    ],
    automatic: true,
    note: "via Awin ou Lomadee",
  },
  {
    name: "AliExpress",
    fields: [
      { key: "ALIEXPRESS_APP_KEY", label: "App Key" },
      { key: "ALIEXPRESS_APP_SECRET", label: "App Secret" },
    ],
    automatic: true,
    note: "",
  },
  {
    name: "Temu",
    fields: [],
    automatic: false,
    note: "Requer contato com gerente de parceria - adicione manualmente pelo Catalogo Viral",
  },
  {
    name: "Shein",
    fields: [],
    automatic: false,
    note: "Sem API disponivel - adicione manualmente pelo Catalogo Viral",
  },
  {
    name: "TikTok Shop",
    fields: [],
    automatic: false,
    note: "Sem API disponivel - adicione manualmente pelo Catalogo Viral",
  },
];

export default function MarketplacesPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState("");
  const [manualLinks, setManualLinks] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState<string | null>(null);
  const [manualConfigured, setManualConfigured] = useState<Record<string, boolean>>({});

  async function checkManualProducts() {
    const manualKeys = marketplaces.filter((m) => !m.automatic).map((m) => m.name.toUpperCase().replace(/\s+/g, "_"));
    const result: Record<string, boolean> = {};
    for (const key of manualKeys) {
      try {
        const data = await apiFetch(`/products?marketplace=${key}`);
        result[key] = Array.isArray(data) && data.length > 0;
      } catch {
        result[key] = false;
      }
    }
    setManualConfigured(result);
  }

  async function loadSettings() {
    try {
      const data = await apiFetch("/settings");
      setSettings(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar configuracoes");
    }
  }

  function isConfigured(fields: KeyField[], anyOf?: boolean) {
    if (fields.length === 0) return false;
    if (anyOf) return fields.some((f) => settings.find((s) => s.key === f.key)?.configured);
    return fields.every((f) => settings.find((s) => s.key === f.key)?.configured);
  }

  async function deleteField(key: string) {
    if (!confirm("Apagar essa chave/valor salvo?")) return;
    setSaving(key);
    setMsg("");
    try {
      await apiFetch(`/settings/${key}`, { method: "DELETE" });
      setMsg(`${key} removido com sucesso`);
      loadSettings();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao apagar");
    } finally {
      setSaving(null);
    }
  }

  async function saveField(key: string) {
    const value = values[key];
    if (!value) return;
    setSaving(key);
    setMsg("");
    try {
      await apiFetch(`/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
      setMsg(`${key} salvo com sucesso`);
      setValues((prev) => ({ ...prev, [key]: "" }));
      loadSettings();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(null);
    }
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

  async function createFromLink(marketplace: string) {
    const link = manualLinks[marketplace];
    if (!link) return;
    setCreating(marketplace);
    setMsg("");
    try {
      const data = await apiFetch("/products/from-link", {
        method: "POST",
        body: JSON.stringify({
          marketplace: marketplace.toUpperCase().replace(/\s+/g, "_"),
          affiliateUrl: link,
        }),
      });
      if (data.foundTitle) {
      } else {
        setMsg("Produto adicionado, mas nao consegui achar nome/foto automaticos - edite em Produtos.");
      }
      setManualLinks((prev) => ({ ...prev, [marketplace]: "" }));
      checkManualProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao adicionar produto");
    } finally {
      setCreating(null);
    }
  }

  useEffect(() => {
    loadSettings();
    checkManualProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          Marketplaces
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cole a chave de cada loja aqui mesmo, e busque produtos reais
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {marketplaces.map((m) => {
          const configured = isConfigured(m.fields, (m as any).anyOf);
          return (
            <Card key={m.name} className="border-border">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{m.name}</p>
                  {!m.automatic ? (
                    manualConfigured[m.name.toUpperCase().replace(/\s+/g, "_")] ? (
                      <Badge variant="default">Configurado</Badge>
                    ) : (
                      <Badge variant="secondary">Manual</Badge>
                    )
                  ) : configured ? (
                    <Badge variant="default">Conectado</Badge>
                  ) : (
                    <Badge variant="secondary">Nao configurado</Badge>
                  )}
                </div>
                {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
                {!m.automatic && (
                  <div className="space-y-1">
                    <Label htmlFor={`link-${m.name}`} className="text-xs">
                      Link de afiliado
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`link-${m.name}`}
                        placeholder="Cole o link de afiliado aqui"
                        value={manualLinks[m.name] || ""}
                        onChange={(e) =>
                          setManualLinks((prev) => ({ ...prev, [m.name]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => createFromLink(m.name)}
                        disabled={creating === m.name || !manualLinks[m.name]}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setManualLinks((prev) => ({ ...prev, [m.name]: "" }))}
                        disabled={!manualLinks[m.name]}
                        title="Limpar campo"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
                {m.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label htmlFor={field.key} className="text-xs">
                      {field.label}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={field.key}
                        placeholder={field.label}
                        value={values[field.key] || ""}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => saveField(field.key)}
                        disabled={saving === field.key || !values[field.key]}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteField(field.key)}
                        disabled={saving === field.key}
                        title="Apagar"
                        className="border-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
