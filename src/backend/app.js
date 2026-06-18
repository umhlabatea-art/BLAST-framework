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
import {
  normalizeLeadInput,
  canTransition,
  isValidStatus,
  computeFollowUps,
} from "./leads.js";
import { enrichLead } from "../../crm/enrich.js";
import { createInstantlyExporter } from "../../crm/instantly.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

/**
 * @param {object} [opts]
 * @param {object} [opts.store]    data store (defaults to in-memory)
 * @param {object} [opts.payments] payments client (defaults to env-configured)
 */
export async function createApp({ store, payments, instantly } = {}) {
  const db = store || createInMemoryStore();
  const pay = payments || (await createPayments());
  const exporter = instantly || (await createInstantlyExporter());

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

  // --- CRM: leads (all scoped to the authenticated owner) ---

  // Load a lead and enforce ownership; responds 404 if missing or not owned
  // (avoids leaking the existence of other users' leads).
  async function loadOwnedLead(req, res) {
    const lead = await db.findLeadById(req.params.id);
    if (!lead || lead.ownerId !== req.user.sub) {
      res.status(404).json({ error: "Lead not found" });
      return null;
    }
    return lead;
  }

  app.post("/api/leads", requireAuth, async (req, res) => {
    try {
      const fields = normalizeLeadInput(req.body || {});
      const lead = await db.createLead({ ownerId: req.user.sub, ...fields });
      res.status(201).json({ lead });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Bulk import / seed (e.g. from a scraping pipeline). Reports per-row errors.
  app.post("/api/leads/bulk", requireAuth, async (req, res) => {
    const rows = Array.isArray(req.body?.leads) ? req.body.leads : null;
    if (!rows) return res.status(400).json({ error: "Body must be { leads: [...] }" });
    const created = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const fields = normalizeLeadInput(rows[i]);
        created.push(await db.createLead({ ownerId: req.user.sub, ...fields }));
      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }
    res.status(201).json({ imported: created.length, created, errors });
  });

  app.get("/api/leads", requireAuth, async (req, res) => {
    const status = req.query.status;
    if (status && !isValidStatus(status)) {
      return res.status(400).json({ error: `invalid status filter: ${status}` });
    }
    const leads = await db.listLeads(req.user.sub, { status });
    res.json({ leads });
  });

  app.get("/api/leads/:id", requireAuth, async (req, res) => {
    const lead = await loadOwnedLead(req, res);
    if (!lead) return;
    res.json({ lead });
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    const lead = await loadOwnedLead(req, res);
    if (!lead) return;
    const patch = {};
    try {
      if (req.body?.status !== undefined) {
        if (!canTransition(lead.status, req.body.status)) {
          return res
            .status(400)
            .json({ error: `cannot transition from ${lead.status} to ${req.body.status}` });
        }
        patch.status = req.body.status;
      }
      for (const f of ["name", "company", "source"]) {
        if (req.body?.[f] !== undefined) patch[f] = String(req.body[f]).trim();
      }
      const updated = await db.updateLead(lead.id, patch);
      res.json({ lead: updated });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/leads/:id/notes", requireAuth, async (req, res) => {
    const lead = await loadOwnedLead(req, res);
    if (!lead) return;
    const body = (req.body?.body || "").trim();
    if (!body) return res.status(400).json({ error: "note body is required" });
    const note = await db.addLeadNote(lead.id, body);
    res.status(201).json({ note });
  });

  app.get("/api/leads/:id/notes", requireAuth, async (req, res) => {
    const lead = await loadOwnedLead(req, res);
    if (!lead) return;
    res.json({ notes: await db.listLeadNotes(lead.id) });
  });

  app.get("/api/leads/:id/followups", requireAuth, async (req, res) => {
    const lead = await loadOwnedLead(req, res);
    if (!lead) return;
    res.json(computeFollowUps(lead));
  });

  // Enrich a single lead; fills in company when discovered and returns the
  // derived attributes (domain, business flag, score, tags).
  app.post("/api/leads/:id/enrich", requireAuth, async (req, res) => {
    const lead = await loadOwnedLead(req, res);
    if (!lead) return;
    const enrichment = enrichLead(lead);
    if (!lead.company && enrichment.companyGuess) {
      await db.updateLead(lead.id, { company: enrichment.companyGuess });
    }
    res.json({ enrichment, lead: await db.findLeadById(lead.id) });
  });

  // Enrich and export the caller's leads to an Instantly campaign.
  // Body: { campaignId, status? }. Stub unless INSTANTLY_API_KEY is configured.
  app.post("/api/leads/export/instantly", requireAuth, async (req, res) => {
    const { campaignId, status } = req.body || {};
    if (!campaignId) return res.status(400).json({ error: "campaignId is required" });
    if (status && !isValidStatus(status)) {
      return res.status(400).json({ error: `invalid status filter: ${status}` });
    }
    try {
      const leads = await db.listLeads(req.user.sub, { status });
      const enrichments = {};
      for (const lead of leads) enrichments[lead.id] = enrichLead(lead);
      const result = await exporter.exportLeads(campaignId, leads, enrichments);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return app;
}
