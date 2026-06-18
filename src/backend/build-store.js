/**
 * Shared store builder. Selects the data store from the environment so the API,
 * the chat bot, and the CRM CLIs all wire up the same way:
 *   - DATABASE_URL set -> PostgreSQL / Supabase
 *   - otherwise        -> in-memory (zero-config local dev)
 */
import { createInMemoryStore } from "./store.js";

export async function buildStore(env = process.env, { log = () => {} } = {}) {
  if (!env.DATABASE_URL) {
    log("store: in-memory (set DATABASE_URL for Postgres/Supabase)");
    return createInMemoryStore();
  }
  const { default: pg } = await import("pg");
  const { createPostgresStore } = await import("./store-postgres.js");
  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
  });
  const store = createPostgresStore({ pool });
  await store.init();
  log("store: PostgreSQL/Supabase (schema ensured)");
  return store;
}
