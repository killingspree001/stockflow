"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import Sidebar, { MobileBottomNav, MobileTopBar } from "@/components/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  const name = profile.full_name ?? profile.email ?? "Account";
  const email = profile.email ?? "";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar role={profile.role} name={name} email={email} />
      <MobileTopBar role={profile.role} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8">
          {children}
        </div>
      </main>

      <MobileBottomNav role={profile.role} />
    </div>
  );
}
