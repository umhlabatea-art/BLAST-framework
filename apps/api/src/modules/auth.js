/**
 * Auth module — register, login, and the authenticated identity route.
 * Reuses the crypto-only auth primitives in ../lib/auth.js.
 */
import { Router } from "express";
import { hashPassword, verifyPassword, issueToken, requireAuth } from "../lib/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function publicUser(user) {
  return { id: user.id, email: user.email, tier: user.tier || "free", createdAt: user.createdAt };
}

export function createAuthRouter({ store }) {
  const router = Router();

  router.post("/register", async (req, res) => {
    const { email, password } = req.body || {};
    if (!EMAIL_RE.test(email || "")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    try {
      const user = await store.createUser({ email, passwordHash: hashPassword(password) });
      const token = issueToken({ sub: user.id, email: user.email });
      res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      res.status(409).json({ error: err.message });
    }
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    const user = await store.findUserByEmail(email || "");
    if (!user || !verifyPassword(password || "", user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = issueToken({ sub: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  });

  router.get("/me", requireAuth, async (req, res) => {
    const user = await store.findUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  });

  return router;
}
