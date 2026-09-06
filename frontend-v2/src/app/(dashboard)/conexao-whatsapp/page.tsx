"use client";

import { useEffect, useState } from "react";
import { Smartphone, Plus, X, Power, RefreshCw, Wifi, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Instance {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid: string | null;
  profileName: string | null;
}

export default function ConexaoWhatsappPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [modalError, setModalError] = useState("");

  async function loadInstances() {
    setLoading(true);
    try {
      const data = await apiFetch("/whatsapp-instances");
      setInstances(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar instancias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstances();
  }, []);

  function openModal() {
    setShowModal(true);
    setNewName("");
    setQrCode(null);
    setModalError("");
  }

  function closeModal() {
    setShowModal(false);
    setQrCode(null);
    loadInstances();
  }

  async function createInstance() {
    if (!newName.trim()) {
      setModalError("Digite um nome para a instancia");
      return;
    }
    setCreating(true);
    setModalError("");
    try {
      const data = await apiFetch("/whatsapp-instances", {
        method: "POST",
        body: JSON.stringify({ instanceName: newName.trim() }),
      });
      const base64 = data?.qrcode?.base64 || data?.qrcode || null;
      if (base64) {
        setQrCode(base64);
      } else {
        const qrData = await apiFetch(`/whatsapp-instances/${newName.trim()}/qrcode`);
        setQrCode(qrData?.base64 || qrData?.qrcode?.base64 || null);
      }
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Erro ao criar instancia");
    } finally {
      setCreating(false);
    }
  }

  async function reconectar(name: string) {
    setBusy(name);
    setMsg("");
    try {
      const qrData = await apiFetch(`/whatsapp-instances/${name}/qrcode`);
      const base64 = qrData?.base64 || qrData?.qrcode?.base64 || null;
      if (base64) {
        setNewName(name);
        setQrCode(base64);
        setShowModal(true);
      } else {
        setMsg("Nao foi possivel gerar o QR Code agora");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao gerar QR Code");
    } finally {
      setBusy(null);
    }
  }

  async function desconectar(name: string) {
    if (!confirm(`Desconectar a instancia "${name}"?`)) return;
    setBusy(name);
    setMsg("");
    try {
      await apiFetch(`/whatsapp-instances/${name}/logout`, { method: "DELETE" });
      setMsg(`Instancia "${name}" desconectada`);
      loadInstances();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao desconectar instancia");
    } finally {
      setBusy(null);
    }
  }

  async function reiniciar(name: string) {
    setBusy(name);
    setMsg("");
    try {
      await apiFetch(`/whatsapp-instances/${name}/restart`, { method: "PUT" });
      setMsg(`Instancia "${name}" reiniciada`);
      loadInstances();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao reiniciar instancia");
    } finally {
      setBusy(null);
    }
  }

  async function testar(name: string) {
    setBusy(name);
    setMsg("");
    try {
      const data = await apiFetch(`/whatsapp-instances/${name}/status`);
      const status = data?.instance?.state || data?.state || "desconhecido";
      setMsg(`Status de "${name}": ${status}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao testar instancia");
    } finally {
      setBusy(null);
    }
  }

  async function remover(name: string) {
    if (!confirm(`Remover a instancia "${name}"? Essa acao nao pode ser desfeita.`)) return;
    setBusy(name);
    setMsg("");
    try {
      await apiFetch(`/whatsapp-instances/${name}`, { method: "DELETE" });
      setMsg(`Instancia "${name}" removida`);
      loadInstances();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao remover instancia");
    } finally {
      setBusy(null);
    }
  }

  function isConnected(status: string) {
    return status === "open";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Smartphone className="h-6 w-6 text-orange-500" />
            WhatsApp
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Conecte seus numeros via Evolution API e gere o QR Code.
          </p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova instancia
        </button>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Carregando...</p>
      ) : instances.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">
          Nenhuma instancia conectada ainda. Clique em Nova instancia.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((inst) => {
            const connected = isConnected(inst.connectionStatus);
            return (
              <div key={inst.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Smartphone className="h-4.5 w-4.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{inst.name}</p>
                      <p className="text-xs text-muted-foreground">{inst.profileName || inst.name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      connected
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-red-500/15 text-red-500"
                    }`}
                  >
                    {connected ? "Conectado" : "Desconectado"}
                  </span>
                </div>

                {connected ? (
                  <button
                    onClick={() => desconectar(inst.name)}
                    disabled={busy === inst.name}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border text-foreground text-xs font-medium py-2 hover:bg-secondary transition-colors disabled:opacity-60"
                  >
                    <Power className="h-3.5 w-3.5" />
                    Desconectar
                  </button>
                ) : (
                  <button
                    onClick={() => reconectar(inst.name)}
                    disabled={busy === inst.name}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 transition-colors disabled:opacity-60"
                  >
                    <Wifi className="h-3.5 w-3.5" />
                    Conectar (gerar QR Code)
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => reiniciar(inst.name)}
                    disabled={busy === inst.name}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border text-foreground text-xs font-medium py-2 hover:bg-secondary transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reiniciar
                  </button>
                  <button
                    onClick={() => testar(inst.name)}
                    disabled={busy === inst.name}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border text-foreground text-xs font-medium py-2 hover:bg-secondary transition-colors disabled:opacity-60"
                  >
                    <Wifi className="h-3.5 w-3.5" />
                    Testar
                  </button>
                </div>

                <button
                  onClick={() => remover(inst.name)}
                  disabled={busy === inst.name}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-red-500 text-xs font-medium py-1.5 hover:underline transition-colors disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover instancia
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border shadow-lg my-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Nova instancia WhatsApp</h2>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2">
                  {modalError}
                </div>
              )}

              {!qrCode ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Nome da instancia
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: loja2, vendedor-joao"
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                  <button
                    onClick={createInstance}
                    disabled={creating}
                    className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
                  >
                    {creating ? "Gerando QR Code..." : "Criar e gerar QR Code"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground text-center">
                    Abra o WhatsApp no celular, va em Aparelhos conectados e escaneie o codigo abaixo.
                  </p>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                      alt="QR Code WhatsApp"
                      className="h-56 w-56 rounded-lg border border-border"
                    />
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-full rounded-lg border border-border text-foreground text-sm font-medium py-2.5 hover:bg-secondary transition-colors"
                  >
                    Concluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
