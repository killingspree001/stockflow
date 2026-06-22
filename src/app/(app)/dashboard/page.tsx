"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { listProducts, listSalesSince } from "@/lib/db";
import { money } from "@/lib/format";
import SalesChart from "@/components/sales-chart";
import type { Product, Sale } from "@/lib/types";

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role === "cashier") router.replace("/checkout");
  }, [profile, router]);

  useEffect(() => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    Promise.all([listProducts(), listSalesSince(monthAgo)])
      .then(([p, s]) => {
        setProducts(p);
        setSales(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => computeStats(products, sales), [products, sales]);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">An overview of sales and stock.</p>
      </header>

      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue today" value={money(stats.revenueToday)} />
        <StatCard label="Profit today" value={money(stats.profitToday)} accent />
        <StatCard label="Revenue this week" value={money(stats.revenueWeek)} />
        <StatCard label="Revenue (30 days)" value={money(stats.revenueMonth)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">
            Revenue, last 7 days
          </h2>
          <SalesChart data={stats.chart} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Low stock</h2>
          <p className="mb-4 text-xs text-slate-500">
            At or below the reorder level.
          </p>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-slate-400">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStock.slice(0, 6).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-slate-700">{p.name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {p.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Best sellers</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">
              No sales yet. Head to the{" "}
              <Link href="/checkout" className="text-indigo-600 underline">
                checkout
              </Link>{" "}
              to ring one up.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 text-right font-medium">Units</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.topProducts.map((p) => (
                  <tr key={p.name}>
                    <td className="py-2 text-slate-700">{p.name}</td>
                    <td className="py-2 text-right text-slate-600">{p.units}</td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {money(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">At a glance</h2>
          <dl className="space-y-3 text-sm">
            <Row term="Products tracked" value={String(products.length)} />
            <Row term="Low stock items" value={String(stats.lowStock.length)} />
            <Row term="Inventory value" value={money(stats.inventoryValue)} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function computeStats(products: Product[], sales: Sale[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const sum = (rows: Sale[], key: "total" | "profit") =>
    rows.reduce((acc, r) => acc + r[key], 0);

  const todaySales = sales.filter((s) => s.createdAt >= todayStart);
  const weekSales = sales.filter((s) => s.createdAt >= weekAgo);

  const lowStock = products
    .filter((p) => p.quantity <= p.reorder_level)
    .sort((a, b) => a.quantity - b.quantity);

  const inventoryValue = products.reduce(
    (acc, p) => acc + p.sell_price * p.quantity,
    0
  );

  return {
    revenueToday: sum(todaySales, "total"),
    profitToday: sum(todaySales, "profit"),
    revenueWeek: sum(weekSales, "total"),
    revenueMonth: sum(sales, "total"),
    lowStock,
    inventoryValue,
    chart: buildLast7Days(sales),
    topProducts: buildTopProducts(sales),
  };
}

function buildLast7Days(sales: Sale[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime() - 6 * 24 * 60 * 60 * 1000;

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startMs + i * 24 * 60 * 60 * 1000);
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: 0,
    };
  });

  for (const sale of sales) {
    if (sale.createdAt < startMs) continue;
    const index = Math.floor((sale.createdAt - startMs) / (24 * 60 * 60 * 1000));
    if (index >= 0 && index < days.length) days[index].revenue += sale.total;
  }
  return days;
}

function buildTopProducts(sales: Sale[]) {
  const totals = new Map<string, { units: number; revenue: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const current = totals.get(item.name) ?? { units: 0, revenue: 0 };
      current.units += item.quantity;
      current.revenue += item.line_total;
      totals.set(item.name, current);
    }
  }
  return [...totals.entries()]
    .map(([name, t]) => ({ name, ...t }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${
          accent ? "text-amber-500" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{term}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
    </div>
  );
}
