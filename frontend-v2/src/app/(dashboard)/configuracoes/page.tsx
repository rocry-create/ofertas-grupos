"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SettingField {
  key: string;
  label: string;
  placeholder: string;
}

interface MarketplaceGroup {
  name: string;
  fields: SettingField[];
}

const groups: MarketplaceGroup[] = [
  {
    name: "Shopee",
    fields: [
      { key: "SHOPEE_APP_ID", label: "App ID", placeholder: "Ex: 18320110052" },
      { key: "SHOPEE_SECRET_KEY", label: "Secret Key", placeholder: "Chave secreta" },
    ],
  },
  {
    name: "Amazon",
    fields: [
      { key: "AMAZON_ACCESS_KEY", label: "Access Key", placeholder: "Access Key" },
      { key: "AMAZON_SECRET_KEY", label: "Secret Key", placeholder: "Secret Key" },
      { key: "AMAZON_ASSOCIATE_TAG", label: "Associate Tag", placeholder: "Tag de afiliado" },
    ],
  },
  {
    name: "Mercado Livre",
    fields: [
      { key: "ML_CLIENT_ID", label: "Client ID", placeholder: "Client ID" },
      { key: "ML_CLIENT_SECRET", label: "Client Secret", placeholder: "Client Secret" },
    ],
  },
  {
    name: "Magalu / Casas Bahia / Kabum (Awin ou Lomadee)",
    fields: [
      { key: "AWIN_API_TOKEN", label: "Awin API Token", placeholder: "Token da Awin" },
      { key: "LOMADEE_APP_TOKEN", label: "Lomadee App Token", placeholder: "Token da Lomadee" },
    ],
  },
  {
    name: "AliExpress",
    fields: [
      { key: "ALIEXPRESS_APP_KEY", label: "App Key", placeholder: "App Key" },
      { key: "ALIEXPRESS_APP_SECRET", label: "App Secret", placeholder: "App Secret" },
    ],
  },
  {
    name: "IA (opcional)",
    fields: [
      { key: "AI_PROVIDER", label: "Provedor", placeholder: "openai ou anthropic" },
      { key: "AI_API_KEY", label: "Chave de API", placeholder: "Chave de API" },
    ],
  },
];

export default function ConfiguracoesPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function loadSettings() {
    try {
      const data = await apiFetch("/settings");
      const configuredMap: Record<string, boolean> = {};
      data.forEach((s: { key: string; configured: boolean }) => {
        configuredMap[s.key] = s.configured;
      });
      setConfigured(configuredMap);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar configuracoes");
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

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Configuracoes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cole aqui as chaves de API de cada marketplace assim que voce conseguir
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groups.map((group) => (
          <Card key={group.name} className="border-border">
            <CardContent className="space-y-4">
              <p className="font-semibold">{group.name}</p>
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {configured[field.key] && (
                      <Badge variant="default" className="text-xs">Configurado</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id={field.key}
                      type="text"
                      placeholder={field.placeholder}
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
