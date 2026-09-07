"use client";

import { useEffect, useState } from "react";
import { Zap, Play, Pause, RefreshCw, AlertCircle, Settings, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface WhatsappStatus {
  connected: boolean;
  lastCheck: string | null;
  lastDrop: string | null;
}

interface AutomationSettingsData {
  intervalMinutes: number;
  minDiscountPct: number;
  keywords: string[];
  maxPerDay: number;
  hourStart: number;
  hourEnd: number;
  intervalHoursBetweenPosts: number;
}

interface AutomationStatus {
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  productsFoundToday: number;
  offersCreatedToday: number;
  publicationsSentToday: number;
  settings: AutomationSettingsData;
  recentFailures: { id: string; productName: string; errorMessage: string | null; createdAt: string }[];
}

function formatDate(iso: string | null) {
  if (!iso) return "Nunca";
  return new Date(iso).toLocaleString("pt-BR");
}

export default function AutomacaoPage() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsappStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");

  const [intervalMinutes, setIntervalMinutes] = useState("60");
  const [minDiscountPct, setMinDiscountPct] = useState("0");
  const [keywordsText, setKeywordsText] = useState("");
  const [maxPerDay, setMaxPerDay] = useState("6");
  const [hourStart, setHourStart] = useState("8");
  const [hourEnd, setHourEnd] = useState("22");
  const [intervalHoursBetweenPosts, setIntervalHoursBetweenPosts] = useState("2");
  const [savingSettings, setSavingSettings] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const data = await apiFetch("/automation/status");
      setStatus(data);
      if (data.settings) {
        setIntervalMinutes(String(data.settings.intervalMinutes));
        setMinDiscountPct(String(data.settings.minDiscountPct));
        setKeywordsText(data.settings.keywords.join(", "));
        setMaxPerDay(String(data.settings.maxPerDay));
        setHourStart(String(data.settings.hourStart));
        setHourEnd(String(data.settings.hourEnd));
        setIntervalHoursBetweenPosts(String(data.settings.intervalHoursBetweenPosts));
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar status");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    setMsg("");
    try {
      const keywords = keywordsText.split(",").map((k) => k.trim()).filter(Boolean);
      await apiFetch("/automation/settings", {
        method: "POST",
        body: JSON.stringify({
          intervalMinutes: Number(intervalMinutes),
          minDiscountPct: Number(minDiscountPct),
          keywords,
          maxPerDay: Number(maxPerDay),
          hourStart: Number(hourStart),
          hourEnd: Number(hourEnd),
          intervalHoursBetweenPosts: Number(intervalHoursBetweenPosts),
        }),
      });
      setMsg("Configuracoes salvas com sucesso");
      loadStatus();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar configuracoes");
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleAutomation(enabled: boolean) {
    setToggling(true);
    try {
      await apiFetch("/automation/toggle", {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });
      setMsg(enabled ? "Automação ativada" : "Automação pausada");
      loadStatus();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao alterar automação");
    } finally {
      setToggling(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setMsg("");
    try {
      await apiFetch("/automation/run-now", { method: "POST" });
      setMsg("Execução iniciada! Atualize em alguns segundos para ver o resultado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao executar");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    loadStatus();
    apiFetch("/whatsapp/status").then(setWhatsapp).catch(() => setWhatsapp(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Zap className="h-6 w-6 text-orange-500" />
            Automação
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Robô de busca automática de ofertas (Shopee)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runNow}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border text-foreground text-sm font-medium px-4 py-2 hover:bg-secondary transition-colors disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {running ? "Executando..." : "Executar agora"}
          </button>
          {status?.enabled ? (
            <button
              onClick={() => toggleAutomation(false)}
              disabled={toggling}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
            >
              <Pause className="h-4 w-4" />
              Pausar automação
            </button>
          ) : (
            <button
              onClick={() => toggleAutomation(true)}
              disabled={toggling}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              Ativar automação
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      {whatsapp && !whatsapp.connected && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3">
          <strong>Atenção:</strong> o WhatsApp está desconectado no momento. As publicações não estão sendo enviadas até reconectar.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Carregando...</p>
      ) : status ? (
        <>
          <div className="rounded-xl border border-border bg-card shadow-sm p-5 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${status.enabled ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className="font-semibold text-foreground">
              {status.enabled ? "Automação ativa" : "Automação pausada"}
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              Última execução: {formatDate(status.lastRunAt)}
            </span>
            <span className="text-sm text-muted-foreground">
              Próxima: {formatDate(status.nextRunAt)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card shadow-sm p-4">
              <div className="text-2xl font-bold text-foreground">{status.productsFoundToday}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Produtos encontrados hoje</div>
            </div>
            <div className="rounded-xl border border-border bg-card shadow-sm p-4">
              <div className="text-2xl font-bold text-foreground">{status.offersCreatedToday}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Ofertas criadas hoje</div>
            </div>
            <div className="rounded-xl border border-border bg-card shadow-sm p-4">
              <div className="text-2xl font-bold text-foreground">{status.publicationsSentToday}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Publicações realizadas hoje</div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <div className="text-sm font-semibold text-foreground">Erros de hoje</div>
            </div>
            {status.recentFailures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum erro registrado hoje.</p>
            ) : (
              <div className="space-y-2">
                {status.recentFailures.map((f) => (
                  <div key={f.id} className="text-xs border-b border-border pb-2 last:border-0">
                    <span className="font-medium text-foreground">{f.productName}</span>
                    <span className="text-muted-foreground"> — {f.errorMessage || "erro desconhecido"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-orange-500" />
              <div className="text-sm font-semibold text-foreground">Configuracoes da automacao</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Buscar a cada (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Desconto minimo para virar oferta (%)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minDiscountPct}
                  onChange={(e) => setMinDiscountPct(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Maximo de publicacoes por dia
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Intervalo entre publicacoes (horas)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={intervalHoursBetweenPosts}
                  onChange={(e) => setIntervalHoursBetweenPosts(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Horario inicial (0-23)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hourStart}
                  onChange={(e) => setHourStart(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Horario final (0-23)
                </label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hourEnd}
                  onChange={(e) => setHourEnd(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Palavras-chave de busca (separadas por virgula)
              </label>
              <textarea
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground resize-none"
              />
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 transition-colors disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {savingSettings ? "Salvando..." : "Salvar configuracoes"}
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-6">Não foi possível carregar o status.</p>
      )}
    </div>
  );
}
