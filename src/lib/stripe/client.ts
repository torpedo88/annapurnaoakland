import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let _stripe: Stripe | null = null;

/** Lazily-constructed Stripe client (so env is only read when actually used). */
export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.stripe().secretKey, { apiVersion: "2026-05-27.dahlia" });
  }
  return _stripe;
}
