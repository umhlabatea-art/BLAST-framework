/**
 * Umhlabatea API application factory.
 *
 * Composes the domain modules into one Express app. Exported as a factory so
 * tests inject a fresh store and exercise the app without binding a port.
 *
 * Route map (all under /api unless noted):
 *   auth          POST /auth/register · /auth/login · GET /auth/me
 *   tracks        GET  /tracks · /tracks/:id · POST /generate
 *   community     GET  /community · POST /community
 *   subscriptions GET  /subscriptions · /payments · POST /checkout · /webhook
 *   revenue       GET  /revenue · /affiliates
 *   compliance    GET  /compliance · /compliance/bodies · POST /compliance · /compliance/:id/advance
 *   agents        POST /agents/seo · GET /agents/tasks · POST /agents/tasks · /agents/tasks/:id/done
 *   health        GET  /health
 */
import express from "express";
import { isStubMode } from "./lib/payments.js";
import { createInMemoryStore } from "./lib/store.js";
import { createAuthRouter } from "./modules/auth.js";
import { createTracksRouter } from "./modules/tracks.js";
import { createCommunityRouter } from "./modules/community.js";
import { createSubscriptionsRouter } from "./modules/subscriptions.js";
import { createRevenueRouter } from "./modules/revenue.js";
import { createComplianceRouter } from "./modules/compliance.js";
import { createAgentsRouter } from "./modules/agents.js";
import { createMarketplaceRouter } from "./modules/marketplace.js";
import { createAdminRouter } from "./modules/admin.js";

export function createApp({ store = createInMemoryStore() } = {}) {
  const app = express();

  // The webhook needs the raw body for signature verification, so register a
  // raw parser for that route before the global JSON parser.
  app.use("/api/webhook", express.raw({ type: "*/*" }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, paymentsMode: isStubMode() ? "stub" : "live" });
  });

  const ctx = { store };
  app.use("/api/auth", createAuthRouter(ctx));
  app.use("/api", createTracksRouter(ctx));
  app.use("/api", createCommunityRouter(ctx));
  app.use("/api", createSubscriptionsRouter(ctx));
  app.use("/api", createRevenueRouter(ctx));
  app.use("/api", createComplianceRouter(ctx));
  app.use("/api", createAgentsRouter(ctx));
  app.use("/api", createMarketplaceRouter(ctx));
  app.use("/api", createAdminRouter(ctx));

  return app;
}
