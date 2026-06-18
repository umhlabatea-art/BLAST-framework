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

function mapLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    email: row.email,
    company: row.company,
    source: row.source,
    status: row.status,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function mapNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    body: row.body,
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

    // --- CRM: leads ---
    async createLead({ ownerId, name, email, company, source, status }) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { rows } = await pool.query(
        `INSERT INTO leads (id, owner_id, name, email, company, source, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, owner_id, name, email, company, source, status, created_at`,
        [id, ownerId, name, email, company, source, status, now]
      );
      return mapLead(rows[0]);
    },

    async listLeads(ownerId, { status } = {}) {
      const { rows } = status
        ? await pool.query(
            `SELECT id, owner_id, name, email, company, source, status, created_at
               FROM leads WHERE owner_id = $1 AND status = $2 ORDER BY created_at ASC`,
            [ownerId, status]
          )
        : await pool.query(
            `SELECT id, owner_id, name, email, company, source, status, created_at
               FROM leads WHERE owner_id = $1 ORDER BY created_at ASC`,
            [ownerId]
          );
      return rows.map(mapLead);
    },

    async findLeadById(id) {
      const { rows } = await pool.query(
        `SELECT id, owner_id, name, email, company, source, status, created_at
           FROM leads WHERE id = $1`,
        [id]
      );
      return mapLead(rows[0]);
    },

    async updateLead(id, patch) {
      // Only a known, safe set of columns may be updated.
      const allowed = ["name", "email", "company", "source", "status"];
      const cols = Object.keys(patch).filter((k) => allowed.includes(k));
      if (cols.length === 0) return this.findLeadById(id);
      const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(", ");
      const values = cols.map((c) => patch[c]);
      const { rows } = await pool.query(
        `UPDATE leads SET ${sets} WHERE id = $1
         RETURNING id, owner_id, name, email, company, source, status, created_at`,
        [id, ...values]
      );
      return mapLead(rows[0]);
    },

    async addLeadNote(leadId, body) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { rows } = await pool.query(
        `INSERT INTO lead_notes (id, lead_id, body, created_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, body, created_at`,
        [id, leadId, body, now]
      );
      return mapNote(rows[0]);
    },

    async listLeadNotes(leadId) {
      const { rows } = await pool.query(
        `SELECT id, body, created_at FROM lead_notes WHERE lead_id = $1 ORDER BY created_at ASC`,
        [leadId]
      );
      return rows.map(mapNote);
    },
  };
}
