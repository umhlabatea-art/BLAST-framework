/**
 * PostgreSQL / Supabase-backed store.
 *
 * Implements the same interface as the in-memory store (see store.js) so it
 * drops into createApp() unchanged. It accepts a `pg`-compatible pool, which
 * makes it testable offline against an in-memory Postgres (pg-mem) and runnable
 * in production against a real database or Supabase connection string.
 *
 * IDs and timestamps are generated in the app layer for database portability.
 */
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(here, "schema.sql");

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    sessionId: row.session_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function isUniqueViolation(err) {
  return err && (err.code === "23505" || /unique|duplicate/i.test(err.message || ""));
}

/**
 * @param {{ pool: { query: Function } }} opts  a pg Pool (or pg-mem adapter)
 */
export function createPostgresStore({ pool }) {
  if (!pool || typeof pool.query !== "function") {
    throw new Error("createPostgresStore requires a pg-compatible pool");
  }

  return {
    /** Create tables if they do not exist. Call once at startup. */
    async init() {
      const schema = await readFile(SCHEMA_PATH, "utf8");
      // Run statements individually (strip comments) so this works on both real
      // PostgreSQL and the in-memory pg-mem used in tests.
      const statements = schema
        .replace(/--.*$/gm, "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) await pool.query(stmt);
      return this;
    },

    async createUser({ email, passwordHash }) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      try {
        const { rows } = await pool.query(
          `INSERT INTO users (id, email, password_hash, created_at)
           VALUES ($1, $2, $3, $4)
           RETURNING id, email, password_hash, created_at`,
          [id, email.toLowerCase(), passwordHash, now]
        );
        return mapUser(rows[0]);
      } catch (err) {
        if (isUniqueViolation(err)) throw new Error("Email already registered");
        throw err;
      }
    },

    async findUserByEmail(email) {
      const { rows } = await pool.query(
        `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
        [String(email).toLowerCase()]
      );
      return mapUser(rows[0]);
    },

    async findUserById(id) {
      const { rows } = await pool.query(
        `SELECT id, email, password_hash, created_at FROM users WHERE id = $1`,
        [id]
      );
      return mapUser(rows[0]);
    },

    async recordPayment({ userId, sessionId, amount, currency, status }) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { rows } = await pool.query(
        `INSERT INTO payments (id, user_id, session_id, amount, currency, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, session_id, amount, currency, status, created_at`,
        [id, userId, sessionId, amount, currency, status, now]
      );
      return mapPayment(rows[0]);
    },

    async listPaymentsByUser(userId) {
      const { rows } = await pool.query(
        `SELECT id, user_id, session_id, amount, currency, status, created_at
           FROM payments WHERE user_id = $1 ORDER BY created_at ASC`,
        [userId]
      );
      return rows.map(mapPayment);
    },

    async findPaymentBySession(sessionId) {
      const { rows } = await pool.query(
        `SELECT id, user_id, session_id, amount, currency, status, created_at
           FROM payments WHERE session_id = $1 LIMIT 1`,
        [sessionId]
      );
      return mapPayment(rows[0]);
    },

    /**
     * Update a payment's status by session id (used by the webhook handler).
     * Returns the updated payment, or null if no matching record exists.
     */
    async markPaymentStatus(sessionId, status) {
      const { rows } = await pool.query(
        `UPDATE payments SET status = $2 WHERE session_id = $1
         RETURNING id, user_id, session_id, amount, currency, status, created_at`,
        [sessionId, status]
      );
      return mapPayment(rows[0]);
    },
  };
}
