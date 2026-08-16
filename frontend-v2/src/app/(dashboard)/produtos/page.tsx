"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string | null;
  marketplace: string;
  currentPrice: number;
  previousPrice: number | null;
}

function money(v: number | null) {
  if (v === null) return "-";
  return "R$ " + v.toFixed(2).replace(".", ",");
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await apiFetch("/products");
      setProducts(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  async function importTest() {
    setImporting(true);
    setMsg("");
    try {
      const data = await apiFetch("/products/import-test", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMsg(`${data.imported} produtos importados com sucesso`);
      loadProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao importar produtos");
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Produtos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Produtos monitorados para geracao de ofertas
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={importTest} disabled={importing}>
          <Download className="h-4 w-4" />
          {importing ? "Importando..." : "Importar produtos de teste"}
        </Button>
        <Button variant="outline" onClick={loadProducts} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Atualizar lista
        </Button>
      </div>

      <Card className="border-border">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground p-6">Carregando...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Nenhum produto ainda. Clique em Importar produtos de teste.
            </p>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium">Marketplace</th>
                  <th className="p-4 font-medium">Preco Atual</th>
                  <th className="p-4 font-medium">Preco Anterior</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4 text-muted-foreground">{p.category || "-"}</td>
                    <td className="p-4 text-muted-foreground">{p.marketplace}</td>
                    <td className="p-4 font-semibold text-primary">{money(p.currentPrice)}</td>
                    <td className="p-4 text-muted-foreground line-through">
                      {money(p.previousPrice)}
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
