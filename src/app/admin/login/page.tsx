"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-6"
          style={{ backgroundColor: "rgba(201,162,75,0.15)", color: "#C9A24B" }}
        >
          <Lock className="h-3.5 w-3.5" /> Staff only
        </div>
        <h1
          className="text-5xl lg:text-6xl leading-[0.95] tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 200, color: "#F3E9D6" }}
        >
          Admin sign in.
        </h1>
        <p className="mt-4 leading-relaxed" style={{ color: "#8A8276" }}>
          Sign in with your staff account to manage orders, menu, and settings.
        </p>
        <form action={formAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8A8276" }}>
              Email
            </span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              className="w-full rounded-full px-6 py-4 text-lg focus:outline-none transition"
              style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6" }}
              placeholder="you@restaurant.com"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#8A8276" }}>
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-full px-6 py-4 text-lg focus:outline-none transition"
              style={{ backgroundColor: "#1C1712", border: "1px solid rgba(201,162,75,0.2)", color: "#F3E9D6" }}
              placeholder="••••••••"
            />
          </label>
          {state?.error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex justify-center items-center gap-2 rounded-full py-4 font-bold text-base transition disabled:opacity-60"
            style={{ backgroundColor: "#C9A24B", color: "#14100D" }}
          >
            {pending ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </section>
  );
}
