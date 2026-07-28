/**
 * Agents module — direct endpoints for the embedded AI agents. Currently the
 * SEO/AEO optimiser; the same pattern extends to CRM/marketing later. The
 * offline stub can be swapped for a real LLM behind the agent/ provider seam
 * without changing this route.
 */
import { Router } from "express";
import { seoAeo } from "@umhlabatea/core/agents";
import { trackWithArtist, TRACKS } from "@umhlabatea/core/mock";

export function createAgentsRouter({ store }) {
  const router = Router();

  // Generate SEO/AEO metadata + JSON-LD for a track (by id or inline object).
  router.post("/agents/seo", async (req, res) => {
    const { trackId, track } = req.body || {};
    let subject = track;
    if (!subject && trackId) {
      subject = (await store.get("tracks", trackId)) || TRACKS.find((t) => t.id === trackId);
      if (subject && !subject.artistName) subject = trackWithArtist(subject);
    }
    if (!subject) return res.status(400).json({ error: "Provide trackId or track" });
    res.json({ seo: seoAeo(subject) });
  });

  return router;
}
