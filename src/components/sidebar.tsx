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

function itemsForRole(role: Role) {
  return NAV.filter((item) => item.roles.includes(role));
}

async function doSignOut(router: ReturnType<typeof useRouter>) {
  await signOut(getAuthClient());
  router.replace("/login");
}

function Logo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
      S
    </div>
  );
}

// Desktop: persistent left rail.
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
  const items = itemsForRole(role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo />
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
                  ? "bg-indigo-50 text-indigo-700"
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
          onClick={() => doSignOut(router)}
          className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

// Mobile: a slim header at the top with the brand and a sign-out control.
export function MobileTopBar({ role }: { role: Role }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="font-semibold text-slate-900">StockFlow</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {roleLabel[role]}
        </span>
      </div>
      <button
        onClick={() => doSignOut(router)}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        Sign out
      </button>
    </header>
  );
}

// Mobile: thumb-friendly bottom tab bar.
export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = itemsForRole(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
              active ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            <span
              className={`h-1 w-6 rounded-full transition ${
                active ? "bg-indigo-600" : "bg-transparent"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
