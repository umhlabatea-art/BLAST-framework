/**
 * Revenue module — the artist's earnings dashboard and affiliate programs.
 * All maths delegate to the shared revenue agent so "80% to the artist" has a
 * single definition across the platform.
 */
import { Router } from "express";
import { AFFILIATE_PROGRAMS } from "@umhlabatea/core/mock";
import { summarize } from "@umhlabatea/core/agents";
import { requireAuth } from "../lib/auth.js";

export function createRevenueRouter({ store }) {
  const router = Router();

  router.get("/affiliates", (_req, res) => {
    res.json({ programs: AFFILIATE_PROGRAMS });
  });

  // Summarise the caller's paid sales into an earnings breakdown.
  router.get("/revenue", requireAuth, async (req, res) => {
    const payments = await store.listPaymentsByUser(req.user.sub);
    const sales = payments
      .filter((p) => p.status === "paid")
      .map((p) => ({ amountRands: (p.amount || 0) / 100, createdAtMs: Date.parse(p.createdAt) || 0 }));
    res.json({ summary: summarize(sales), programs: AFFILIATE_PROGRAMS });
  });

  return router;
}
