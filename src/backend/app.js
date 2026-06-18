/**
 * BLAST API application factory.
 *
 * Exported as an async factory so tests can inject a fresh store and payments
 * client and exercise the app without binding to a port. Routes:
 *
 *   POST /api/auth/register   { email, password }        -> { token, user }
 *   POST /api/auth/login      { email, password }        -> { token, user }
 *   GET  /api/me              (auth)                      -> { user }
 *   POST /api/checkout        (auth) { priceCents }       -> { id, url, mode }
 *   POST /api/webhook         (stripe/stub event)         -> { received: true }
 *   GET  /api/payments        (auth)                      -> { payments }
 *   GET  /health                                          -> { ok: true }
 */
import express from "express";
import { hashPassword, verifyPassword, issueToken, requireAuth } from "./auth.js";
import { createPayments } from "./payments.js";
import { createInMemoryStore } from "./store.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

/**
 * @param {object} [opts]
 * @param {object} [opts.store]    data store (defaults to in-memory)
 * @param {object} [opts.payments] payments client (defaults to env-configured)
 */
export async function createApp({ store, payments } = {}) {
  const db = store || createInMemoryStore();
  const pay = payments || (await createPayments());

  const app = express();

  // The webhook needs the raw body for signature verification, so register a
  // raw parser for that route before the global JSON parser.
  app.use("/api/webhook", express.raw({ type: "*/*" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, paymentsMode: pay.mode });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body || {};
    if (!EMAIL_RE.test(email || "")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    try {
      const user = await db.createUser({ email, passwordHash: hashPassword(password) });
      const token = issueToken({ sub: user.id, email: user.email });
      res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      res.status(409).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {};
    const user = await db.findUserByEmail(email || "");
    if (!user || !verifyPassword(password || "", user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = issueToken({ sub: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    const user = await db.findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  });

  app.post("/api/checkout", requireAuth, async (req, res) => {
    const { priceCents, productName } = req.body || {};
    try {
      const session = await pay.createCheckoutSession({
        userId: req.user.sub,
        priceCents,
        productName,
      });
      await db.recordPayment({
        userId: req.user.sub,
        sessionId: session.id,
        amount: priceCents,
        currency: "usd",
        status: "pending",
      });
      res.json(session);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/webhook", async (req, res) => {
    try {
      const event = await pay.parseWebhookEvent({
        rawBody: req.body, // Buffer (raw parser) or object
        signature: req.headers["stripe-signature"],
      });
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await db.markPaymentStatus(session.id, "paid");
      }
      res.json({ received: true });
    } catch (err) {
      res.status(400).json({ error: `Webhook error: ${err.message}` });
    }
  });

  app.get("/api/payments", requireAuth, async (req, res) => {
    const payments = await db.listPaymentsByUser(req.user.sub);
    res.json({ payments });
  });

  return app;
}
