"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import {
  addProduct,
  deleteProduct,
  importProducts,
  listProducts,
  updateProduct,
} from "@/lib/db";
import { money } from "@/lib/format";
import type { Product, ProductInput } from "@/lib/types";

type Draft = {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  cost_price: string;
  sell_price: string;
  quantity: string;
  reorder_level: string;
};

const emptyDraft: Draft = {
  name: "",
  sku: "",
  barcode: "",
  category: "",
  cost_price: "",
  sell_price: "",
  quantity: "",
  reorder_level: "5",
};

export default function ProductsClient() {
  const fileInput = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setProducts(await listProducts());
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q)
    );
  });

  async function run(action: () => Promise<void>, ok?: string) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await action();
      await reload();
      if (ok) setMessage(ok);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function handleAdd(draft: Draft) {
    run(async () => {
      await addProduct(draftToInput(draft));
      setShowAdd(false);
    }, "Product added.");
  }

  function handleSaveEdit(id: string, draft: Draft) {
    run(async () => {
      await updateProduct(id, draftToInput(draft));
      setEditingId(null);
    }, "Changes saved.");
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    run(() => deleteProduct(id), "Product deleted.");
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data
          .map(rowToInput)
          .filter((r): r is ProductInput => r !== null);
        run(
          () => importProducts(rows),
          `Imported ${rows.length} product${rows.length === 1 ? "" : "s"}.`
        );
        if (fileInput.current) fileInput.current.value = "";
      },
      error: () => setError("Could not read that file."),
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">
            {products.length} item{products.length === 1 ? "" : "s"} in stock.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={downloadSample} className={ghostButton}>
            Sample CSV
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className={ghostButton}
            disabled={busy}
          >
            Import CSV
          </button>
          <button
            onClick={() => {
              setShowAdd((v) => !v);
              setEditingId(null);
            }}
            className={primaryButton}
          >
            {showAdd ? "Close" : "Add product"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </header>

      {(message || error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            error ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-700"
          }`}
        >
          {error ?? message}
        </p>
      )}

      {showAdd && (
        <ProductForm
          title="New product"
          initial={emptyDraft}
          busy={busy}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAdd}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU, category…"
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            {products.length === 0
              ? "No products yet. Add one or import a CSV to get started."
              : "Nothing matches your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 text-right font-medium">Cost</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((product) =>
                  editingId === product.id ? (
                    <tr key={product.id} className="bg-slate-50">
                      <td colSpan={6} className="p-4">
                        <ProductForm
                          title={`Edit ${product.name}`}
                          initial={productToDraft(product)}
                          busy={busy}
                          onCancel={() => setEditingId(null)}
                          onSubmit={(draft) => handleSaveEdit(product.id, draft)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {product.name}
                        </div>
                        {product.category && (
                          <div className="text-xs text-slate-400">
                            {product.category}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {product.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {money(product.cost_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900">
                        {money(product.sell_price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StockBadge product={product} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingId(product.id);
                            setShowAdd(false);
                          }}
                          className="text-sm font-medium text-slate-500 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="ml-3 text-sm font-medium text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StockBadge({ product }: { product: Product }) {
  const low = product.quantity <= product.reorder_level;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        low ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {product.quantity}
    </span>
  );
}

function ProductForm({
  title,
  initial,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string;
  initial: Draft;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (draft: Draft) => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);

  function set<K extends keyof Draft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Name" required value={draft.name} onChange={(v) => set("name", v)} />
        <Input label="SKU" value={draft.sku} onChange={(v) => set("sku", v)} />
        <Input label="Barcode" value={draft.barcode} onChange={(v) => set("barcode", v)} />
        <Input label="Category" value={draft.category} onChange={(v) => set("category", v)} />
        <Input
          label="Cost price"
          type="number"
          value={draft.cost_price}
          onChange={(v) => set("cost_price", v)}
        />
        <Input
          label="Sell price"
          type="number"
          value={draft.sell_price}
          onChange={(v) => set("sell_price", v)}
        />
        <Input
          label="Quantity"
          type="number"
          value={draft.quantity}
          onChange={(v) => set("quantity", v)}
        />
        <Input
          label="Reorder level"
          type="number"
          value={draft.reorder_level}
          onChange={(v) => set("reorder_level", v)}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button type="submit" className={primaryButton} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function draftToInput(draft: Draft): ProductInput {
  return {
    name: draft.name.trim(),
    sku: draft.sku.trim() || null,
    barcode: draft.barcode.trim() || null,
    category: draft.category.trim() || null,
    cost_price: toNumber(draft.cost_price),
    sell_price: toNumber(draft.sell_price),
    quantity: Math.round(toNumber(draft.quantity)),
    reorder_level: Math.round(toNumber(draft.reorder_level)),
  };
}

function productToDraft(p: Product): Draft {
  return {
    name: p.name,
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    category: p.category ?? "",
    cost_price: String(p.cost_price),
    sell_price: String(p.sell_price),
    quantity: String(p.quantity),
    reorder_level: String(p.reorder_level),
  };
}

// Maps a CSV row to a product, accepting a few common header spellings.
function rowToInput(row: Record<string, string>): ProductInput | null {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const found = Object.keys(row).find(
        (k) => k.trim().toLowerCase() === key
      );
      if (found && row[found] != null) return String(row[found]).trim();
    }
    return "";
  };

  const name = get("name", "product", "product name", "item");
  if (!name) return null;

  return {
    name,
    sku: get("sku", "code") || null,
    barcode: get("barcode", "upc") || null,
    category: get("category", "type") || null,
    cost_price: toNumber(get("cost_price", "cost", "buy price")),
    sell_price: toNumber(get("sell_price", "price", "sell price", "retail")),
    quantity: Math.round(toNumber(get("quantity", "qty", "stock", "count"))),
    reorder_level: Math.round(toNumber(get("reorder_level", "reorder", "min")) || 5),
  };
}

function toNumber(value: string) {
  const n = Number(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function downloadSample() {
  const csv =
    "name,sku,category,cost_price,sell_price,quantity,reorder_level\n" +
    "Cordless Drill,TLS-001,Tools,42.00,89.99,12,5\n" +
    "LED Work Light,TLS-014,Tools,8.50,19.99,40,10\n" +
    "Paint Roller Set,PNT-220,Paint,3.25,7.99,4,6\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stockflow-sample.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const primaryButton =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60";
const ghostButton =
  "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60";
