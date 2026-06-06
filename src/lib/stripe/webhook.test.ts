import { describe, it, expect, vi, beforeEach } from "vitest";

// env requires real vars; stub them for the test.
vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_testsecret");

import Stripe from "stripe";
import { constructStripeEvent } from "./webhook";

describe("constructStripeEvent", () => {
  it("rejects a missing signature", () => {
    expect(() => constructStripeEvent("{}", null)).toThrow();
  });

  it("accepts a correctly-signed payload", () => {
    const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: {} } });
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_testsecret" });
    const evt = constructStripeEvent(payload, header);
    expect(evt.type).toBe("checkout.session.completed");
  });

  it("rejects a tampered payload", () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload: "{}", secret: "whsec_testsecret" });
    expect(() => constructStripeEvent('{"x":1}', header)).toThrow();
  });
});
