/**
 * Tracks & AI generation module.
 *
 * Reads combine the seed catalogue (@umhlabatea/core mock) with user-generated
 * tracks persisted in the store. Generation delegates to the shared
 * `generateTrack` stub so the API and the app produce identical results.
 */
import { Router } from "express";
import { tracksWithArtists, trackWithArtist, TRACKS } from "@umhlabatea/core/mock";
import { generateTrack } from "@umhlabatea/core/agents";
import { requireAuth } from "../lib/auth.js";

export function createTracksRouter({ store }) {
  const router = Router();

  router.get("/tracks", async (_req, res) => {
    const generated = await store.list("tracks");
    res.json({ tracks: [...generated, ...tracksWithArtists()] });
  });

  router.get("/tracks/:id", async (req, res) => {
    const generated = await store.get("tracks", req.params.id);
    if (generated) return res.json({ track: generated });
    const seed = TRACKS.find((t) => t.id === req.params.id);
    if (!seed) return res.status(404).json({ error: "Track not found" });
    res.json({ track: trackWithArtist(seed) });
  });

  // Generate a new track from a prompt and persist it to the caller's library.
  // Pass provider: "replicate" in the request body to use the Replicate MusicGen
  // API (requires REPLICATE_API_TOKEN env var); omit for the deterministic stub.
  router.post("/generate", requireAuth, async (req, res) => {
    const { prompt, genre, bpm, key, artistName, provider } = req.body || {};
    const resolvedProvider =
      provider === "replicate" && process.env.REPLICATE_API_TOKEN
        ? "replicate"
        : undefined;
    try {
      const track = await generateTrack(prompt, {
        genre, bpm, key,
        artistId: req.user.sub,
        artistName,
        provider: resolvedProvider,
      });
      const stored = await store.insert("tracks", { ...track, ownerId: req.user.sub });
      res.status(201).json({ track: stored });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}
