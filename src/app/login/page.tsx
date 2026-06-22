"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getAuthClient } from "@/lib/firebase";
import { createProfile } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signingUp = mode === "signup";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("full_name") ?? "").trim();

    try {
      const auth = getAuthClient();
      if (signingUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await createProfile(cred.user.uid, email, fullName || email);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            S
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">StockFlow</h1>
          <p className="mt-1 text-sm text-slate-500">
            Inventory and point of sale for small shops.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-md py-1.5 transition ${
                signingUp ? "text-slate-500" : "bg-white text-slate-900 shadow-sm"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-md py-1.5 transition ${
                signingUp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {signingUp && (
              <Field label="Full name">
                <input
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jane Cooper"
                  className={inputClass}
                />
              </Field>
            )}

            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@shop.com"
                className={inputClass}
              />
            </Field>

            <Field label="Password">
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete={signingUp ? "new-password" : "current-password"}
                placeholder="••••••••"
                className={inputClass}
              />
            </Field>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "Please wait…" : signingUp ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          New accounts start as the shop owner.
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    default:
      return "Something went wrong. Please try again.";
  }
}
