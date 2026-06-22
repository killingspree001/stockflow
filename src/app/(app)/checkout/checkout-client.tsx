"use client";

import { useEffect, useMemo, useState } from "react";
import { checkout, listProducts } from "@/lib/db";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

type Line = { product: Product; qty: number };
type Receipt = { lines: Line[]; total: number; count: number };

export default function CheckoutClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function reload() {
    const all = await listProducts();
    setProducts(all.filter((p) => p.quantity > 0));
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const total = cart.reduce((sum, l) => sum + l.product.sell_price * l.qty, 0);
  const count = cart.reduce((sum, l) => sum + l.qty, 0);

  function addToCart(product: Product) {
    setError(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.quantity) return prev;
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function setQty(id: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === id
            ? { ...l, qty: Math.max(0, Math.min(qty, l.product.quantity)) }
            : l
        )
        .filter((l) => l.qty > 0)
    );
  }

  function onScan(event: React.FormEvent) {
    event.preventDefault();
    const code = query.trim().toLowerCase();
    if (!code) return;
    const match = products.find(
      (p) =>
        (p.barcode ?? "").toLowerCase() === code ||
        (p.sku ?? "").toLowerCase() === code
    );
    if (match) {
      addToCart(match);
      setQuery("");
    }
  }

  async function completeSale() {
    if (cart.length === 0) return;
    setError(null);
    setBusy(true);
    const snapshot = cart;
    try {
      await checkout(
        snapshot.map((l) => ({ product_id: l.product.id, quantity: l.qty }))
      );
      setReceipt({ lines: snapshot, total, count });
      setCart([]);
      await reload();
    } catch (err) {
      setError((err as Error).message ?? "Could not complete the sale.");
    } finally {
      setBusy(false);
    }
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
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>
        <p className="text-sm text-slate-500">
          Scan a barcode or tap a product to add it to the sale.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={onScan} className="mb-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scan barcode or search…"
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </form>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
              No products in stock match that search.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow"
                >
                  <div className="font-medium text-slate-900">{product.name}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {product.sku ?? "No SKU"} · {product.quantity} in stock
                  </div>
                  <div className="mt-2 font-semibold text-indigo-600">
                    {money(product.sell_price)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-8">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Current sale</h2>
            </div>

            {cart.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                The cart is empty.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cart.map((line) => (
                  <li key={line.product.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {money(line.product.sell_price)} each
                        </p>
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {money(line.product.sell_price * line.qty)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StepButton onClick={() => setQty(line.product.id, line.qty - 1)}>
                        −
                      </StepButton>
                      <span className="w-8 text-center text-sm">{line.qty}</span>
                      <StepButton
                        onClick={() => setQty(line.product.id, line.qty + 1)}
                        disabled={line.qty >= line.product.quantity}
                      >
                        +
                      </StepButton>
                      <button
                        onClick={() => setQty(line.product.id, 0)}
                        className="ml-auto text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {count} item{count === 1 ? "" : "s"}
                </span>
                <span className="text-xl font-semibold text-slate-900">
                  {money(total)}
                </span>
              </div>

              {error && (
                <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                onClick={completeSale}
                disabled={cart.length === 0 || busy}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy ? "Processing…" : "Complete sale"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: Receipt;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            ✓
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Sale complete</h3>
          <p className="text-sm text-slate-500">
            {receipt.count} item{receipt.count === 1 ? "" : "s"} sold
          </p>
        </div>

        <ul className="mb-4 max-h-56 space-y-1 overflow-y-auto text-sm">
          {receipt.lines.map((line) => (
            <li
              key={line.product.id}
              className="flex justify-between text-slate-600"
            >
              <span className="truncate">
                {line.qty} × {line.product.name}
              </span>
              <span className="ml-2 shrink-0">
                {money(line.product.sell_price * line.qty)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mb-5 flex justify-between border-t border-slate-100 pt-3 font-semibold text-slate-900">
          <span>Total</span>
          <span>{money(receipt.total)}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          New sale
        </button>
      </div>
    </div>
  );
}
