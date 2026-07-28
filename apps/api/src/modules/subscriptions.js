/**
 * Subscriptions & payments module.
 *
 * Exposes the subscription tiers (from the shared theme) and the checkout /
 * webhook / payments flow. Payments run through the existing Stripe-stub in
 * ../lib/payments.js, so the whole purchase loop works offline and flips to
 * live Stripe via environment variables alone.
 */
import { Router } from "express";
import { tiers } from "@umhlabatea/core/theme";
import { requireAuth } from "../lib/auth.js";
import { createCheckoutSession, parseWebhookEvent } from "../lib/payments.js";

export function createSubscriptionsRouter({ store }) {
  const router = Router();

  // Public: list tiers so the app can render pricing without auth.
  router.get("/subscriptions", (_req, res) => {
    res.json({ tiers });
  });

  // Start a checkout (one-off purchase or subscription upgrade).
  router.post("/checkout", requireAuth, async (req, res) => {
    const { priceCents, productName } = req.body || {};
    try {
      const session = await createCheckoutSession({ userId: req.user.sub, priceCents, productName });
      await store.recordPayment({
        userId: req.user.sub,
        sessionId: session.id,
        amount: priceCents,
        currency: "zar",
        status: "pending",
      });
      res.json(session);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/webhook", async (req, res) => {
    try {
      const event = await parseWebhookEvent({
        rawBody: req.body,
        signature: req.headers["stripe-signature"],
      });
      if (event.type === "checkout.session.completed") {
        const payment = await store.findPaymentBySession(event.data.object.id);
        if (payment) payment.status = "paid";
      }
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ error: `Webhook error: ${err.message}` });
    }
  });

  router.get("/payments", requireAuth, async (req, res) => {
    const payments = await store.listPaymentsByUser(req.user.sub);
    res.json({ payments });
  });

  return router;
}
