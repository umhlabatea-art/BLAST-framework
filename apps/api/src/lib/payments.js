/**
 * Payments module (Stripe-compatible).
 *
 * If STRIPE_SECRET_KEY is set AND the `stripe` package is installed, this uses
 * the real Stripe Checkout API. Otherwise it falls back to a deterministic stub
 * that mimics Checkout session creation and webhook events — so the full
 * payment flow can be developed and tested offline with no keys.
 *
 * The stub's contract matches the parts of Stripe we use, so swapping to live
 * mode requires only environment variables, not code changes.
 */
import crypto from "node:crypto";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

let stripeClient = null;
async function getStripe() {
  if (!STRIPE_KEY) return null;
  if (stripeClient) return stripeClient;
  try {
    const { default: Stripe } = await import("stripe");
    stripeClient = new Stripe(STRIPE_KEY);
    return stripeClient;
  } catch {
    // `stripe` not installed — fall back to stub even if a key is present.
    return null;
  }
}

/**
 * Create a Checkout session for a one-off purchase.
 * @returns {{ id: string, url: string, mode: "live"|"stub" }}
 */
export async function createCheckoutSession({ userId, priceCents, currency = "usd", productName = "Umhlawati Product" }) {
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    throw new Error("priceCents must be a positive integer (amount in cents)");
  }

  const stripe = await getStripe();
  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: { name: productName },
          },
        },
      ],
      success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/cancel`,
    });
    return { id: session.id, url: session.url, mode: "live" };
  }

  // --- stub mode ---
  const id = `cs_stub_${crypto.randomBytes(12).toString("hex")}`;
  return {
    id,
    url: `${APP_URL}/checkout/stub?session_id=${id}&amount=${priceCents}&currency=${currency}`,
    mode: "stub",
  };
}

/**
 * Verify and parse a webhook event.
 * - live mode: verifies the Stripe signature header.
 * - stub mode: accepts a plain JSON body describing the event.
 * @returns parsed event { type, data: { object } }
 */
export async function parseWebhookEvent({ rawBody, signature }) {
  const stripe = await getStripe();
  if (stripe) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is required in live mode");
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
  // stub mode: body is trusted local JSON (may arrive as a Buffer, string, or object)
  let parsed = rawBody;
  if (Buffer.isBuffer(rawBody)) parsed = rawBody.toString("utf8");
  if (typeof parsed === "string") parsed = JSON.parse(parsed);
  if (!parsed || !parsed.type) throw new Error("Stub webhook missing 'type'");
  return parsed;
}

export function isStubMode() {
  return !STRIPE_KEY;
}
