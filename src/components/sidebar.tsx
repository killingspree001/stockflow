"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";
import type { Role } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["owner", "manager"] },
  { href: "/products", label: "Products", roles: ["owner", "manager"] },
  { href: "/checkout", label: "Checkout", roles: ["owner", "manager", "cashier"] },
];

const roleLabel: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
};

export default function Sidebar({
  role,
  name,
  email,
}: {
  role: Role;
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter((item) => item.roles.includes(role));

  async function handleSignOut() {
    await signOut(getAuthClient());
    router.replace("/login");
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          S
        </div>
        <span className="text-lg font-semibold text-slate-900">StockFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{email}</p>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {roleLabel[role]}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
