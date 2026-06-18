#!/usr/bin/env node
/**
 * BLAST backend entry point. Serves the API and the static frontend.
 *
 * Store selection:
 *   - DATABASE_URL set -> PostgreSQL / Supabase (via the `pg` pool)
 *   - otherwise        -> in-memory (zero-config local dev)
 *
 * Payments mode is decided by payments.js (live when STRIPE_SECRET_KEY is set
 * and the `stripe` package is installed; otherwise stub).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
import { buildStore } from "./build-store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

async function main() {
  const store = await buildStore(process.env, { log: (m) => console.log(`[blast] ${m}`) });
  const app = await createApp({ store });

  // Serve the minimal frontend from ../frontend at the site root.
  app.use(express.static(path.resolve(here, "..", "frontend")));

  app.listen(PORT, () => {
    console.log(`[blast] API + frontend on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[blast] fatal:", err.message);
  process.exit(1);
});
