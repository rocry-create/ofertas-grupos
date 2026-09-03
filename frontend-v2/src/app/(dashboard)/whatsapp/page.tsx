"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, RefreshCw, Search, Power, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Group {
  id: string;
  name: string;
  groupJid: string;
  niche: string | null;
  active: boolean;
  dailyLimit: number;
}

interface AvailableGroup {
  id: string;
  subject: string;
}

export default function WhatsappPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [available, setAvailable] = useState<AvailableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function loadGroups() {
    setLoading(true);
    try {
      const data = await apiFetch("/groups");
      setGroups(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar grupos");
    } finally {
      setLoading(false);
    }
  }

  async function searchAvailable() {
    setSearching(true);
    setMsg("");
    try {
      const data = await apiFetch("/groups/available");
      setAvailable(data.slice(0, 30));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao buscar grupos no WhatsApp");
    } finally {
      setSearching(false);
    }
  }

  async function saveGroup(groupJid: string, name: string) {
    try {
      await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify({
          name,
          groupJid,
          instanceName: "mellcrm",
          niche: "geral",
          dailyLimit: 5,
        }),
      });
      setMsg("Grupo salvo com sucesso");
      loadGroups();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar grupo");
    }
  }

  async function deleteGroup(group: Group) {
    if (!confirm(`Excluir o grupo "${group.name}"? Isso nao apaga publicacoes ja enviadas.`)) return;
    setTogglingId(group.id);
    setMsg("");
    try {
      await apiFetch(`/groups/${group.id}`, { method: "DELETE" });
      setMsg(`Grupo "${group.name}" excluido`);
      loadGroups();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao excluir grupo");
    } finally {
      setTogglingId(null);
    }
  }

  async function toggleActive(group: Group) {
    setTogglingId(group.id);
    setMsg("");
    const novoStatus = !group.active;
    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, active: novoStatus } : g))
    );
    try {
      await apiFetch(`/groups/${group.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: novoStatus }),
      });
      setMsg(`Grupo "${group.name}" ${novoStatus ? "ativado" : "desativado"} com sucesso`);
    } catch (e) {
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, active: group.active } : g))
      );
      setMsg(e instanceof Error ? e.message : "Erro ao atualizar status do grupo");
    } finally {
      setTogglingId(null);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          Grupos WhatsApp
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Grupos conectados via Evolution API para publicacao automatica
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={searchAvailable} disabled={searching}>
          <Search className="h-4 w-4" />
          {searching ? "Buscando..." : "Buscar grupos reais do WhatsApp"}
        </Button>
        <Button variant="outline" onClick={loadGroups} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Atualizar lista
        </Button>
      </div>

      {available.length > 0 && (
        <Card className="border-border">
          <CardContent>
            <p className="font-semibold text-sm mb-3">Grupos encontrados no WhatsApp</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {available.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                >
                  <span className="text-sm truncate">{g.subject || g.id}</span>
                  <Button size="sm" onClick={() => saveGroup(g.id, g.subject || g.id)}>
                    Salvar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardContent>
          <p className="font-semibold text-sm mb-3">Grupos salvos</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum grupo salvo ainda. Busque grupos reais acima.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.niche || "sem nicho"} - limite {g.dailyLimit}/dia
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={g.active ? "default" : "secondary"}>
                      {g.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      size="sm"
                      variant={g.active ? "outline" : "default"}
                      onClick={() => toggleActive(g)}
                      disabled={togglingId === g.id}
                      className="h-7 text-xs px-3"
                    >
                      <Power className="h-3.5 w-3.5" />
                      {togglingId === g.id ? "..." : g.active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteGroup(g)}
                      disabled={togglingId === g.id}
                      className="h-7 text-xs px-3"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
