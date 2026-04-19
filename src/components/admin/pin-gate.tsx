"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { Lock } from "lucide-react";

export function PinGate() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#2B1E16] text-[#F2A545] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-6">
          <Lock className="h-3.5 w-3.5" /> Staff only
        </div>
        <h1
          className="text-5xl lg:text-6xl leading-[0.95] tracking-tight"
          style={{ fontFamily: "var(--font-instrument), serif" }}
        >
          Kitchen <em style={{ color: "#C85A3C" }}>display.</em>
        </h1>
        <p className="mt-4 text-[#2B1E16]/70 leading-relaxed">
          This page shows live orders for the kitchen team. Enter the daily staff PIN to continue.
        </p>
        <form action={formAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-widest text-[#2B1E16]/60 mb-2">
              Staff PIN
            </span>
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              required
              className="w-full rounded-full bg-white border border-[#2B1E16]/10 px-6 py-4 text-xl tracking-[0.4em] font-mono focus:outline-none focus:border-[#C85A3C] focus:ring-2 focus:ring-[#C85A3C]/20"
              placeholder="••••"
            />
          </label>
          {state?.error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex justify-center items-center gap-2 rounded-full bg-[#C85A3C] text-[#FDF4E4] py-4 font-bold text-base hover:bg-[#2B1E16] transition disabled:opacity-60"
          >
            {pending ? "Checking…" : "Unlock kitchen view →"}
          </button>
        </form>
        <p className="mt-6 text-xs text-[#2B1E16]/50 leading-relaxed">
          Interim PIN protection. Real Supabase staff auth lands in Phase B.
          Change the PIN anytime by setting <code className="font-mono">STAFF_PIN</code> in your env.
        </p>
      </div>
    </section>
  );
}
