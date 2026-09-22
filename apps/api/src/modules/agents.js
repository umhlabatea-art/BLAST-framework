/**
 * Agents module — direct endpoints for the embedded AI agents. Currently the
 * SEO/AEO optimiser; the same pattern extends to CRM/marketing later. The
 * offline stub can be swapped for a real LLM behind the agent/ provider seam
 * without changing this route.
 */
import { Router } from "express";
import { seoAeo, routeAgent, AGENT_IDS } from "@umhlabatea/core/agents";
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

  // Agent-task queue — the shared surface that lets tasks created anywhere
  // (e.g. the Studio Hub's meeting-minutes recorder) be read by the mobile app.
  router.get("/agents/tasks", async (_req, res) => {
    res.json({ tasks: await store.list("agentTasks") });
  });

  router.post("/agents/tasks", async (req, res) => {
    const { title, agent, detail, source } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: "title is required" });
    const routed = AGENT_IDS.includes(agent) ? agent : routeAgent(title);
    const task = await store.insert("agentTasks", {
      title: String(title).trim(),
      agent: routed,
      detail: detail ? String(detail) : "",
      source: source ? String(source) : "manual",
      status: "open",
    });
    res.status(201).json({ task });
  });

  router.post("/agents/tasks/:id/done", async (req, res) => {
    const task = await store.update("agentTasks", req.params.id, { status: "done" });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ task });
  });

  return router;
}
