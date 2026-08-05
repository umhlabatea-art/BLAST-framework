/**
 * Admin module — platform-wide statistics and user management.
 *
 * Guarded by the ADMIN_EMAILS env var (comma-separated list of admin email
 * addresses). In production, flip user.isAdmin in the database instead.
 */
import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { TRACKS, ARTISTS, COMMUNITY_POSTS } from "@umhlabatea/core/mock";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean),
);

function requireAdmin(req, res, next) {
  const email = req.user?.email?.toLowerCase() || "";
  if (!ADMIN_EMAILS.has(email)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function createAdminRouter({ store }) {
  const router = Router();

  // All admin routes require auth + admin flag.
  router.use(requireAuth, requireAdmin);

  // Platform-wide stats.
  router.get("/admin/stats", async (_req, res) => {
    const [tracks, registrations, agentTasks, listings, posts] = await Promise.all([
      store.list("tracks"),
      store.list("registrations"),
      store.list("agentTasks"),
      store.list("listings"),
      store.list("posts"),
    ]);

    res.json({
      stats: {
        seedTracks: TRACKS.length,
        generatedTracks: tracks.length,
        totalTracks: tracks.length + TRACKS.length,
        artists: ARTISTS.length,
        registrations: registrations.length,
        agentTasks: agentTasks.length,
        listings: listings.length,
        communityPosts: posts.length + COMMUNITY_POSTS.length,
      },
    });
  });

  // Agent task breakdown.
  router.get("/admin/tasks", async (_req, res) => {
    const tasks = await store.list("agentTasks");
    const byAgent = {};
    for (const t of tasks) {
      byAgent[t.agent] = (byAgent[t.agent] || 0) + 1;
    }
    const byStatus = { open: 0, done: 0 };
    for (const t of tasks) {
      if (t.status === "done") byStatus.done++;
      else byStatus.open++;
    }
    res.json({ tasks, byAgent, byStatus });
  });

  return router;
}
