/**
 * Payments module (Stripe-compatible) as an injectable factory.
 *
 * createPayments() returns an object with the same surface the app uses:
 *   createCheckoutSession({ userId, priceCents, currency?, productName? })
 *   parseWebhookEvent({ rawBody, signature })
 *   mode : "live" | "stub"
 *
 * Behavior:
 *   - If a Stripe client is available (injected, or `stripe` installed + a key
 *     in STRIPE_SECRET_KEY) it talks to real Stripe.
 *   - Otherwise it falls back to a deterministic stub so the full flow runs
 *     offline with no keys. The stub's contract matches the bits of Stripe we
 *     use, so switching to live mode needs only env vars — no code changes.
 *
 * The Stripe client is injectable to make live-mode behavior testable offline.
 */
import crypto from "node:crypto";

async function loadStripeClient({ stripeClient, stripeKey }) {
  if (stripeClient) return stripeClient; // injected (tests / custom wiring)
  if (!stripeKey) return null; // no key -> stub mode
  try {
    const { default: Stripe } = await import("stripe");
    return new Stripe(stripeKey);
  } catch {
    return null; // `stripe` not installed -> stub mode
  }
}

/**
 * @param {object} [opts]
 * @param {object} [opts.stripeClient] injected Stripe-like client (optional)
 * @param {string} [opts.stripeKey]    defaults to STRIPE_SECRET_KEY
 * @param {string} [opts.webhookSecret] defaults to STRIPE_WEBHOOK_SECRET
 * @param {string} [opts.appUrl]       defaults to APP_URL
 */
export async function createPayments(opts = {}) {
  const stripeKey = opts.stripeKey ?? process.env.STRIPE_SECRET_KEY;
  const webhookSecret = opts.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET;
  const appUrl = opts.appUrl ?? process.env.APP_URL ?? "http://localhost:3000";
  const stripe = await loadStripeClient({ stripeClient: opts.stripeClient, stripeKey });
  const mode = stripe ? "live" : "stub";

  async function createCheckoutSession({
    userId,
    priceCents,
    currency = "usd",
    productName = "Umhlawati Product",
  }) {
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      throw new Error("priceCents must be a positive integer (amount in cents)");
    }

    if (mode === "live") {
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
        success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/cancel`,
      });
      return { id: session.id, url: session.url, mode: "live" };
    }

    const id = `cs_stub_${crypto.randomBytes(12).toString("hex")}`;
    return {
      id,
      url: `${appUrl}/checkout/stub?session_id=${id}&amount=${priceCents}&currency=${currency}`,
      mode: "stub",
    };
  }

  async function parseWebhookEvent({ rawBody, signature }) {
    if (mode === "live") {
      if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is required in live mode");
      return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    // stub mode: body is trusted local JSON (Buffer, string, or object)
    let parsed = rawBody;
    if (Buffer.isBuffer(rawBody)) parsed = rawBody.toString("utf8");
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    if (!parsed || !parsed.type) throw new Error("Stub webhook missing 'type'");
    return parsed;
  }

  return { createCheckoutSession, parseWebhookEvent, mode, isStub: mode === "stub" };
}
