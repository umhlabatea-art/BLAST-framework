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
import { createInMemoryStore } from "./store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

async function buildStore() {
  if (!process.env.DATABASE_URL) {
    console.log("[blast] store: in-memory (set DATABASE_URL for Postgres/Supabase)");
    return createInMemoryStore();
  }
  // Lazy-load pg + the Postgres store only when a database is configured.
  const { default: pg } = await import("pg");
  const { createPostgresStore } = await import("./store-postgres.js");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase and most managed Postgres require SSL.
    ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
  });
  const store = createPostgresStore({ pool });
  await store.init();
  console.log("[blast] store: PostgreSQL/Supabase (schema ensured)");
  return store;
}

async function main() {
  const store = await buildStore();
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
