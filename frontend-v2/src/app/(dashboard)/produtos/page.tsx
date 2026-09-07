"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, RefreshCw, Store, Plus, X, Check, Trash2, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string | null;
  marketplace: string;
  currentPrice: number;
  previousPrice: number | null;
  imageUrl: string | null;
  commissionPct: number | null;
  commissionValue: number | null;
  productType: string;
  description: string | null;
  stock: number | null;
  isActive: boolean;
}

interface BatchResult {
  productId: string | null;
  url: string;
  name: string;
  price: string;
  imageUrl: string;
  missingName: boolean;
  missingPrice: boolean;
  missingImage: boolean;
  saved: boolean;
  saving: boolean;
  error: string;
}

const MARKETPLACES = [
  { key: "TIKTOK_SHOP", label: "TikTok Shop" },
  { key: "SHOPEE", label: "Shopee" },
  { key: "MERCADO_LIVRE", label: "Mercado Livre" },
  { key: "AMAZON", label: "Amazon" },
  { key: "TEMU", label: "Temu" },
  { key: "SHEIN", label: "Shein" },
];

const MARKETPLACES_MANUAL = [{ key: "MINHA_LOJA", label: "Minha Loja" }, ...MARKETPLACES];

const CATEGORIES = [
  "Alimentos & Bebidas",
  "Beleza",
  "Casa, Cozinha & Decoração",
  "Eletrônicos",
  "Infantil & Baby",
  "Moda",
  "Pets",
  "Saúde",
];

const MARKETPLACE_COLORS: Record<string, string> = {
  TIKTOK_SHOP: "bg-black text-white",
  SHOPEE: "bg-orange-500 text-white",
  MERCADO_LIVRE: "bg-yellow-400 text-black",
  AMAZON: "bg-slate-800 text-white",
  TEMU: "bg-orange-600 text-white",
  SHEIN: "bg-black text-white",
  MINHA_LOJA: "bg-emerald-600 text-white",
};

const TYPE_FILTERS = [
  { key: "TODOS", label: "Todos" },
  { key: "affiliate_product", label: "Produtos afiliados" },
  { key: "store_product", label: "Minha loja" },
];

function money(v: number | null) {
  if (v === null || v === undefined) return "-";
  return "R$ " + v.toFixed(2).replace(".", ",");
}

function marketplaceLabel(key: string) {
  return MARKETPLACES_MANUAL.find((m) => m.key === key)?.label || key;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [divulgando, setDivulgando] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("TODOS");
  const [categoryFilter, setCategoryFilter] = useState<string>("TODAS");
  const [typeFilter, setTypeFilter] = useState<string>("TODOS");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editPreviousPrice, setEditPreviousPrice] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<"link" | "batch" | "manual">("link");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  const [addStep, setAddStep] = useState<"link" | "complete">("link");
  const [addMarketplace, setAddMarketplace] = useState("TEMU");
  const [addLink, setAddLink] = useState("");
  const [addProductId, setAddProductId] = useState<string | null>(null);
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addMissing, setAddMissing] = useState<{ name: boolean; price: boolean; image: boolean }>({
    name: false,
    price: false,
    image: false,
  });

  // aba "Vários links (lote)"
  const [batchMarketplace, setBatchMarketplace] = useState("TEMU");
  const [batchLinksText, setBatchLinksText] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchDone, setBatchDone] = useState(false);

  const [manualMarketplace, setManualMarketplace] = useState("MINHA_LOJA");
  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualPreviousPrice, setManualPreviousPrice] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [manualStock, setManualStock] = useState("");
  const [manualActive, setManualActive] = useState(true);

  async function loadProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (marketplaceFilter !== "TODOS") params.set("marketplace", marketplaceFilter);
      if (categoryFilter !== "TODAS") params.set("category", categoryFilter);
      if (typeFilter !== "TODOS") params.set("productType", typeFilter);
      const qs = params.toString();
      const data = await apiFetch(`/products${qs ? `?${qs}` : ""}`);
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

  async function divulgar(productId: string) {
    setDivulgando(productId);
    setMsg("");
    try {
      await apiFetch(`/offers/quick/${productId}`, { method: "POST" });
      setMsg("Produto enviado para o Catálogo Viral!");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao divulgar produto");
    } finally {
      setDivulgando(null);
    }
  }

  async function excluir(productId: string) {
    if (!confirm("Excluir este produto?")) return;
    try {
      await apiFetch(`/products/${productId}`, { method: "DELETE" });
      setMsg("Produto excluido");
      loadProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao excluir produto");
    }
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setEditPrice(String(product.currentPrice));
    setEditPreviousPrice(product.previousPrice !== null && product.previousPrice !== undefined ? String(product.previousPrice) : "");
  }

  function closeEditModal() {
    setEditingProduct(null);
  }

  async function saveEdit() {
    if (!editingProduct) return;
    setEditSaving(true);
    try {
      const payload: Record<string, unknown> = {
        currentPrice: Number(editPrice.replace(",", ".")),
      };
      if (editPreviousPrice.trim()) {
        payload.previousPrice = Number(editPreviousPrice.replace(",", "."));
      } else {
        payload.previousPrice = null;
      }
      await apiFetch(`/products/${editingProduct.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMsg("Produto atualizado com sucesso");
      closeEditModal();
      loadProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao atualizar produto");
    } finally {
      setEditSaving(false);
    }
  }

  async function excluirTodos() {
    if (!confirm("Tem certeza que deseja excluir TODOS os produtos? Essa acao nao pode ser desfeita.")) return;
    try {
      const data = await apiFetch("/products/all/bulk", { method: "DELETE" });
      setMsg(`${data.deleted} produto(s) excluido(s)`);
      loadProducts();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao excluir todos os produtos");
    }
  }

  function openAddModal() {
    setShowAddModal(true);
    setAddMode("link");
    setAddError("");

    setAddStep("link");
    setAddMarketplace("TEMU");
    setAddLink("");
    setAddProductId(null);
    setAddName("");
    setAddPrice("");
    setAddImageUrl("");
    setAddMissing({ name: false, price: false, image: false });

    setBatchMarketplace("TEMU");
    setBatchLinksText("");
    setBatchResults([]);
    setBatchDone(false);

    setManualMarketplace("MINHA_LOJA");
    setManualName("");
    setManualDescription("");
    setManualCategory("");
    setManualPrice("");
    setManualPreviousPrice("");
    setManualImageUrl("");
    setManualLink("");
    setManualStock("");
    setManualActive(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
  }

  async function submitLink() {
    if (!addLink.trim()) {
      setAddError("Cole o link de afiliado do produto");
      return;
    }
    setAddSubmitting(true);
    setAddError("");
    try {
      const data = await apiFetch("/products/from-link", {
        method: "POST",
        body: JSON.stringify({ marketplace: addMarketplace, affiliateUrl: addLink.trim() }),
      });
      const missing = {
        name: !data.foundTitle,
        price: !data.foundPrice,
        image: !data.foundImage,
      };
      if (!missing.name && !missing.price && !missing.image) {
        setMsg("Produto adicionado com sucesso, com dados capturados automaticamente!");
        closeAddModal();
        loadProducts();
        return;
      }
      setAddProductId(data.product.id);
      setAddName(missing.name ? "" : data.product.name);
      setAddPrice(missing.price ? "" : String(data.product.currentPrice));
      setAddImageUrl(missing.image ? "" : data.product.imageUrl || "");
      setAddMissing(missing);
      setAddStep("complete");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Erro ao processar o link");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function submitComplete() {
    if (!addProductId) return;
    if (addMissing.name && !addName.trim()) {
      setAddError("Preencha o nome do produto");
      return;
    }
    if (addMissing.price && !addPrice.trim()) {
      setAddError("Preencha o preço do produto");
      return;
    }
    setAddSubmitting(true);
    setAddError("");
    try {
      const payload: Record<string, unknown> = { autoPublish: true };
      if (addMissing.name) payload.name = addName.trim();
      if (addMissing.price) payload.currentPrice = Number(addPrice.replace(",", "."));
      if (addMissing.image && addImageUrl.trim()) payload.imageUrl = addImageUrl.trim();
      await apiFetch(`/products/${addProductId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setMsg("Produto completado e adicionado com sucesso!");
      closeAddModal();
      loadProducts();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Erro ao salvar os dados do produto");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function submitBatch() {
    const links = batchLinksText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (links.length === 0) {
      setAddError("Cole ao menos um link, um por linha");
      return;
    }
    setAddError("");
    setBatchSubmitting(true);
    setBatchResults([]);
    setBatchDone(false);
    const results: BatchResult[] = [];
    for (const url of links) {
      try {
        const data = await apiFetch("/products/from-link", {
          method: "POST",
          body: JSON.stringify({ marketplace: batchMarketplace, affiliateUrl: url }),
        });
        results.push({
          productId: data.product.id,
          url,
          name: data.product.name,
          price: String(data.product.currentPrice ?? ""),
          imageUrl: data.product.imageUrl || "",
          missingName: !data.foundTitle,
          missingPrice: !data.foundPrice,
          missingImage: !data.foundImage,
          saved: !( !data.foundTitle || !data.foundPrice || !data.foundImage ),
          saving: false,
          error: "",
        });
      } catch (e) {
        results.push({
          productId: null,
          url,
          name: "",
          price: "",
          imageUrl: "",
          missingName: false,
          missingPrice: false,
          missingImage: false,
          saved: false,
          saving: false,
          error: e instanceof Error ? e.message : "Erro ao importar este link",
        });
      }
      setBatchResults([...results]);
    }
    setBatchSubmitting(false);
    setBatchDone(true);
    loadProducts();
  }

  function updateBatchItem(index: number, patch: Partial<BatchResult>) {
    setBatchResults((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  }

  async function saveBatchItem(index: number) {
    const item = batchResults[index];
    if (!item.productId) return;
    if (item.missingName && !item.name.trim()) {
      updateBatchItem(index, { error: "Preencha o título" });
      return;
    }
    if (item.missingPrice && !item.price.trim()) {
      updateBatchItem(index, { error: "Preencha o preço" });
      return;
    }
    updateBatchItem(index, { saving: true, error: "" });
    try {
      const payload: Record<string, unknown> = { autoPublish: true };
      if (item.missingName) payload.name = item.name.trim();
      if (item.missingPrice) payload.currentPrice = Number(item.price.replace(",", "."));
      if (item.missingImage && item.imageUrl.trim()) payload.imageUrl = item.imageUrl.trim();
      await apiFetch(`/products/${item.productId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      updateBatchItem(index, { saving: false, saved: true });
      loadProducts();
    } catch (e) {
      updateBatchItem(index, {
        saving: false,
        error: e instanceof Error ? e.message : "Erro ao salvar",
      });
    }
  }

  async function submitManual() {
    if (!manualName.trim()) {
      setAddError("Preencha o título do produto");
      return;
    }
    if (!manualPrice.trim()) {
      setAddError("Preencha o preço do produto");
      return;
    }
    if (!manualLink.trim()) {
      setAddError("Preencha o link do produto (da sua loja ou de afiliado)");
      return;
    }
    setAddSubmitting(true);
    setAddError("");
    try {
      const payload: Record<string, unknown> = {
        marketplace: manualMarketplace,
        name: manualName.trim(),
        currentPrice: Number(manualPrice.replace(",", ".")),
        affiliateUrl: manualLink.trim(),
        isActive: manualActive,
      };
      if (manualPreviousPrice.trim()) {
        payload.previousPrice = Number(manualPreviousPrice.replace(",", "."));
      }
      if (manualImageUrl.trim()) payload.imageUrl = manualImageUrl.trim();
      if (manualDescription.trim()) payload.description = manualDescription.trim();
      if (manualCategory.trim()) payload.category = manualCategory.trim();
      if (manualStock.trim()) payload.stock = Number(manualStock);
      await apiFetch("/products/manual", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMsg("Produto cadastrado com sucesso no catálogo!");
      closeAddModal();
      loadProducts();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Erro ao cadastrar produto");
    } finally {
      setAddSubmitting(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketplaceFilter, categoryFilter, typeFilter]);

  const filterChips = useMemo(
    () => [{ key: "TODOS", label: "Início" }, ...MARKETPLACES_MANUAL],
    []
  );

  const batchCompleteCount = batchResults.filter((r) => r.saved).length;
  const batchPendingCount = batchResults.filter((r) => !r.saved && r.productId).length;
  const batchErrorCount = batchResults.filter((r) => !r.productId && r.error).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
          <Package className="h-6 w-6 text-orange-500" />
          Produtos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Produtos monitorados para geração de ofertas
        </p>
      </div>

      {msg && (
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-sm px-4 py-2">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </button>
        <button
          onClick={loadProducts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border text-foreground text-sm font-medium px-4 py-2 hover:bg-secondary transition-colors disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar lista
        </button>
        <button
          onClick={excluirTodos}
          disabled={products.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 text-red-500 text-sm font-medium px-4 py-2 hover:bg-red-500/10 transition-colors disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Excluir Todos
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              typeFilter === t.key
                ? "bg-foreground border-foreground text-background"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {filterChips.map((m) => (
          <button
            key={m.key}
            onClick={() => setMarketplaceFilter(m.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              marketplaceFilter === m.key
                ? "bg-orange-500 border-orange-500 text-white"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {m.key === "TODOS" && <Store className="h-3.5 w-3.5" />}
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Carregando...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">
          Nenhum produto encontrado com esse filtro.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border border-border bg-card overflow-hidden flex flex-col ${
                !p.isActive ? "opacity-50" : ""
              }`}
            >
              <div className="relative aspect-square bg-secondary">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                )}
                <span
                  className={`absolute top-2 left-2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${
                    MARKETPLACE_COLORS[p.marketplace] || "bg-secondary text-foreground"
                  }`}
                  title={marketplaceLabel(p.marketplace)}
                >
                  {marketplaceLabel(p.marketplace).charAt(0)}
                </span>
                {!p.isActive && (
                  <span className="absolute top-2 right-2 rounded-full bg-black/70 text-white text-[9px] font-semibold px-2 py-0.5">
                    Inativo
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {p.category && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {p.category}
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                      p.productType === "store_product"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-orange-500/15 text-orange-600"
                    }`}
                  >
                    {p.productType === "store_product" ? "Minha loja" : "Afiliado"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {p.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Preço: <span className="text-foreground font-medium">{money(p.currentPrice)}</span>
                </p>
                {p.stock !== null && p.stock !== undefined && (
                  <p className="text-xs text-muted-foreground">Estoque: {p.stock}</p>
                )}
                {(p.commissionValue || p.commissionPct) && (
                  <p className="text-xs text-emerald-500 font-medium">
                    Comissão: {p.commissionValue ? money(p.commissionValue) : ""}
                    {p.commissionPct ? ` (${p.commissionPct}%)` : ""}
                  </p>
                )}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => divulgar(p.id)}
                    disabled={divulgando === p.id}
                    className="flex-1 inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-2 transition-colors disabled:opacity-60"
                  >
                    {divulgando === p.id ? "Enviando..." : "Publicar"}
                  </button>
                  <button
                    onClick={() => openEditModal(p)}
                    className="inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground text-xs font-medium px-3 py-2 transition-colors"
                    title="Editar preco"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => excluir(p.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50 text-xs font-medium px-3 py-2 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-lg my-auto max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-base font-bold text-foreground">Adicionar Produto</h2>
              <button
                onClick={closeAddModal}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex border-b border-border sticky top-[57px] bg-card z-10">
              <button
                onClick={() => {
                  setAddMode("link");
                  setAddError("");
                }}
                className={`flex-1 text-xs font-medium py-2.5 px-1 transition-colors ${
                  addMode === "link"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1 link
              </button>
              <button
                onClick={() => {
                  setAddMode("batch");
                  setAddError("");
                }}
                className={`flex-1 text-xs font-medium py-2.5 px-1 transition-colors ${
                  addMode === "batch"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Vários links (lote)
              </button>
              <button
                onClick={() => {
                  setAddMode("manual");
                  setAddError("");
                }}
                className={`flex-1 text-xs font-medium py-2.5 px-1 transition-colors ${
                  addMode === "manual"
                    ? "text-orange-500 border-b-2 border-orange-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cadastro manual
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {addError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2">
                  {addError}
                </div>
              )}

              {addMode === "link" && addStep === "link" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Plataforma
                    </label>
                    <select
                      value={addMarketplace}
                      onChange={(e) => setAddMarketplace(e.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    >
                      {MARKETPLACES.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Link de afiliado do produto
                    </label>
                    <input
                      type="text"
                      value={addLink}
                      onChange={(e) => setAddLink(e.target.value)}
                      placeholder="Cole aqui o link do produto"
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      O sistema tenta capturar foto, nome e preço automaticamente. Se algo não
                      for encontrado, você completa na próxima tela.
                    </p>
                  </div>
                  <button
                    onClick={submitLink}
                    disabled={addSubmitting}
                    className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
                  >
                    {addSubmitting ? "Buscando..." : "Continuar"}
                  </button>
                </>
              )}

              {addMode === "link" && addStep === "complete" && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Não conseguimos capturar tudo automaticamente. Complete os campos abaixo antes
                    de salvar.
                  </p>
                  {addMissing.image && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Link da foto do produto
                      </label>
                      <input
                        type="text"
                        value={addImageUrl}
                        onChange={(e) => setAddImageUrl(e.target.value)}
                        placeholder="https://... (link direto de uma imagem)"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                  )}
                  {!addMissing.image && addImageUrl && (
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={addImageUrl}
                        alt="Prévia"
                        className="h-24 w-24 object-cover rounded-lg border border-border"
                      />
                    </div>
                  )}
                  {addMissing.name && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Título do produto
                      </label>
                      <input
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="Ex: Fone de Ouvido Bluetooth XYZ"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                  )}
                  {!addMissing.name && addName && (
                    <p className="text-sm text-foreground font-medium">{addName}</p>
                  )}
                  {addMissing.price && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Preço (R$)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={addPrice}
                        onChange={(e) => setAddPrice(e.target.value)}
                        placeholder="Ex: 99,90"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                  )}
                  <button
                    onClick={submitComplete}
                    disabled={addSubmitting}
                    className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
                  >
                    {addSubmitting ? "Salvando..." : "Salvar Produto"}
                  </button>
                </>
              )}

              {addMode === "batch" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Plataforma (vale para todos os links abaixo)
                    </label>
                    <select
                      value={batchMarketplace}
                      onChange={(e) => setBatchMarketplace(e.target.value)}
                      disabled={batchSubmitting}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    >
                      {MARKETPLACES.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Links dos produtos (um por linha)
                    </label>
                    <textarea
                      value={batchLinksText}
                      onChange={(e) => setBatchLinksText(e.target.value)}
                      disabled={batchSubmitting}
                      placeholder={"https://...\nhttps://...\nhttps://..."}
                      rows={6}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground resize-none"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Cole quantos links quiser, um em cada linha. O sistema processa todos e
                      avisa quais precisam de complemento manual.
                    </p>
                  </div>
                  {!batchDone && (
                    <button
                      onClick={submitBatch}
                      disabled={batchSubmitting}
                      className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
                    >
                      {batchSubmitting
                        ? `Processando... (${batchResults.length} de ${
                            batchLinksText.split("\n").filter((l) => l.trim()).length
                          })`
                        : "Importar todos"}
                    </button>
                  )}

                  {batchResults.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      {batchDone && (
                        <p className="text-xs text-muted-foreground">
                          {batchCompleteCount} completo(s) automaticamente
                          {batchPendingCount > 0 && `, ${batchPendingCount} precisam de complemento`}
                          {batchErrorCount > 0 && `, ${batchErrorCount} com erro`}.
                        </p>
                      )}
                      {batchResults.map((item, idx) => {
                        if (item.saved) {
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2"
                            >
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-1">{item.name || item.url}</span>
                            </div>
                          );
                        }
                        if (!item.productId) {
                          return (
                            <div
                              key={idx}
                              className="text-xs text-red-600 bg-red-500/10 rounded-lg px-3 py-2"
                            >
                              Falhou: {item.url}
                              <br />
                              {item.error}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={idx}
                            className="rounded-lg border border-border p-3 space-y-2"
                          >
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {item.url}
                            </p>
                            {item.error && (
                              <p className="text-xs text-red-500">{item.error}</p>
                            )}
                            {item.missingImage && (
                              <input
                                type="text"
                                value={item.imageUrl}
                                onChange={(e) => updateBatchItem(idx, { imageUrl: e.target.value })}
                                placeholder="Link da foto"
                                className="w-full rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground"
                              />
                            )}
                            {item.missingName && (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateBatchItem(idx, { name: e.target.value })}
                                placeholder="Título do produto"
                                className="w-full rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground"
                              />
                            )}
                            {item.missingPrice && (
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.price}
                                onChange={(e) => updateBatchItem(idx, { price: e.target.value })}
                                placeholder="Preço (R$)"
                                className="w-full rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-xs text-foreground"
                              />
                            )}
                            <button
                              onClick={() => saveBatchItem(idx)}
                              disabled={item.saving}
                              className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium py-1.5 transition-colors disabled:opacity-60"
                            >
                              {item.saving ? "Salvando..." : "Salvar este produto"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {addMode === "manual" && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Preencha os dados do seu produto. Nenhuma busca automática é feita aqui — vai
                    direto pro catálogo do jeito que você preencher.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Loja / Plataforma
                    </label>
                    <select
                      value={manualMarketplace}
                      onChange={(e) => setManualMarketplace(e.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    >
                      {MARKETPLACES_MANUAL.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Título do produto
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Ex: Camiseta Estampada Premium"
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="Detalhes do produto, tamanhos, cores, etc."
                      rows={3}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Categoria (opcional)
                    </label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Sem categoria</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Preço atual (R$)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        placeholder="Ex: 49,90"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Preço antigo (opcional)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={manualPreviousPrice}
                        onChange={(e) => setManualPreviousPrice(e.target.value)}
                        placeholder="Ex: 69,90"
                        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Estoque (opcional)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={manualStock}
                      onChange={(e) => setManualStock(e.target.value)}
                      placeholder="Ex: 20"
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Link da foto (opcional)
                    </label>
                    <input
                      type="text"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="https://... (link direto de uma imagem)"
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    />
                    {manualImageUrl.trim() && (
                      <div className="flex justify-center pt-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={manualImageUrl}
                          alt="Prévia"
                          className="h-24 w-24 object-cover rounded-lg border border-border"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Link do produto (sua loja ou link de afiliado)
                    </label>
                    <input
                      type="text"
                      value={manualLink}
                      onChange={(e) => setManualLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={manualActive}
                      onChange={(e) => setManualActive(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    Produto ativo (visível no catálogo)
                  </label>
                  <button
                    onClick={submitManual}
                    disabled={addSubmitting}
                    className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
                  >
                    {addSubmitting ? "Salvando..." : "Cadastrar Produto"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border shadow-lg my-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Editar preco</h2>
              <button
                onClick={closeEditModal}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <p className="text-sm font-medium text-foreground line-clamp-2">{editingProduct.name}</p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Preco atual (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Preco antigo / De (opcional, usado para calcular o desconto)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editPreviousPrice}
                  onChange={(e) => setEditPreviousPrice(e.target.value)}
                  placeholder="Deixe em branco se nao houver desconto"
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </div>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-60"
              >
                {editSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
