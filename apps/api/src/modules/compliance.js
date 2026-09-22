/**
 * Compliance module — SAMRO / CAPASSO / RISA registration workflow.
 *
 * These bodies have no public API, so the agent prepares submissions and tracks
 * their state; it never calls a live endpoint. Registrations persist to the
 * store and advance one lifecycle step per request.
 */
import { Router } from "express";
import { RIGHTS_BODIES, createRegistration, advanceRegistration } from "@umhlabatea/core/agents";
import { trackWithArtist, TRACKS } from "@umhlabatea/core/mock";
import { requireAuth } from "../lib/auth.js";

async function resolveTrack(store, trackId) {
  const generated = await store.get("tracks", trackId);
  if (generated) return generated;
  const seed = TRACKS.find((t) => t.id === trackId);
  return seed ? trackWithArtist(seed) : null;
}

export function createComplianceRouter({ store }) {
  const router = Router();

  router.get("/compliance/bodies", (_req, res) => {
    res.json({ bodies: Object.values(RIGHTS_BODIES) });
  });

  router.get("/compliance", requireAuth, async (req, res) => {
    const registrations = await store.list("registrations", (r) => r.ownerId === req.user.sub);
    res.json({ registrations });
  });

  // Create a draft registration for a track with a given rights body.
  router.post("/compliance", requireAuth, async (req, res) => {
    const { bodyId, trackId } = req.body || {};
    const track = await resolveTrack(store, trackId);
    if (!track) return res.status(404).json({ error: "Track not found" });
    try {
      const reg = createRegistration(bodyId, track);
      const stored = await store.insert("registrations", { ...reg, ownerId: req.user.sub });
      res.status(201).json({ registration: stored });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Advance a registration one step (draft→prepared→submitted→registered).
  router.post("/compliance/:id/advance", requireAuth, async (req, res) => {
    const reg = await store.get("registrations", req.params.id);
    if (!reg || reg.ownerId !== req.user.sub) {
      return res.status(404).json({ error: "Registration not found" });
    }
    const track = await resolveTrack(store, reg.trackId);
    try {
      const next = advanceRegistration(reg, {
        track,
        artistName: req.body?.artistName || track?.artistName,
        writers: req.body?.writers,
        at: Date.now(),
      });
      const stored = await store.update("registrations", reg.id, next);
      res.json({ registration: stored });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
