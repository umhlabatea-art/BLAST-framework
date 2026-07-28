/**
 * Community module — the shared feed where artists and listeners post collabs,
 * events and showcases. Seed posts come from the core mock; new posts persist
 * to the store.
 */
import { Router } from "express";
import { COMMUNITY_POSTS } from "@umhlabatea/core/mock";
import { requireAuth } from "../lib/auth.js";

export function createCommunityRouter({ store }) {
  const router = Router();

  router.get("/community", async (_req, res) => {
    const posted = await store.list("posts");
    res.json({ posts: [...posted, ...COMMUNITY_POSTS] });
  });

  router.post("/community", requireAuth, async (req, res) => {
    const { body, tag } = req.body || {};
    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Post body is required" });
    }
    const post = await store.insert("posts", {
      authorId: req.user.sub,
      authorName: req.user.email,
      body: body.trim(),
      tag: tag || "post",
      likes: 0,
      comments: 0,
    });
    res.status(201).json({ post });
  });

  return router;
}
