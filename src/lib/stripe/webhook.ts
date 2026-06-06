import "server-only";
import type Stripe from "stripe";
import { stripe } from "./client";
import { env } from "@/lib/env";

/**
 * Verifies the Stripe-Signature header against the raw body and returns the
 * typed event. Throws if the signature is invalid (caller returns 400).
 */
export function constructStripeEvent(rawBody: string, signature: string | null): Stripe.Event {
  if (!signature) throw new Error("Missing Stripe-Signature header");
  return stripe().webhooks.constructEvent(rawBody, signature, env.stripe().webhookSecret);
}
