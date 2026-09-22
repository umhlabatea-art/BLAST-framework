/**
 * Data store for the BLAST backend.
 *
 * Ships with an in-memory implementation so the API runs with zero
 * infrastructure. The interface is intentionally small and async so it can be
 * swapped for a Postgres/Supabase-backed store without touching route code.
 *
 *   createUser({ email, passwordHash }) -> user
 *   findUserByEmail(email)              -> user | null
 *   findUserById(id)                    -> user | null
 *   recordPayment({ userId, ... })      -> payment
 *   listPaymentsByUser(userId)          -> payment[]
 *
 * Domain collections (tracks, community posts, rights registrations) are stored
 * through a small generic `collection(name)` helper so new modules can persist
 * user-generated records without expanding this file's surface each time.
 */
import crypto from "node:crypto";

export function createInMemoryStore() {
  const usersById = new Map();
  const usersByEmail = new Map();
  const payments = new Map();
  const collections = new Map(); // name -> Map(id -> record)

  function collection(name) {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
  }

  return {
    /**
     * Generic per-collection CRUD used by the domain modules. Records get a
     * uuid + createdAt automatically. `insert` returns the stored record;
     * `list` returns newest-first and accepts an optional filter predicate.
     */
    async insert(name, record) {
      const stored = { id: record.id || crypto.randomUUID(), createdAt: new Date().toISOString(), ...record };
      collection(name).set(stored.id, stored);
      return stored;
    },
    async get(name, id) {
      return collection(name).get(id) || null;
    },
    async update(name, id, patch) {
      const existing = collection(name).get(id);
      if (!existing) return null;
      const next = { ...existing, ...patch };
      collection(name).set(id, next);
      return next;
    },
    async list(name, predicate) {
      const all = [...collection(name).values()].reverse();
      return predicate ? all.filter(predicate) : all;
    },

    async createUser({ email, passwordHash }) {
      const normalized = email.toLowerCase();
      if (usersByEmail.has(normalized)) {
        throw new Error("Email already registered");
      }
      const user = {
        id: crypto.randomUUID(),
        email: normalized,
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      usersById.set(user.id, user);
      usersByEmail.set(normalized, user);
      return user;
    },

    async findUserByEmail(email) {
      return usersByEmail.get(String(email).toLowerCase()) || null;
    },

    async findUserById(id) {
      return usersById.get(id) || null;
    },

    async recordPayment({ userId, sessionId, amount, currency, status }) {
      const payment = {
        id: crypto.randomUUID(),
        userId,
        sessionId,
        amount,
        currency,
        status,
        createdAt: new Date().toISOString(),
      };
      payments.set(payment.id, payment);
      return payment;
    },

    async listPaymentsByUser(userId) {
      return [...payments.values()].filter((p) => p.userId === userId);
    },

    async findPaymentBySession(sessionId) {
      return [...payments.values()].find((p) => p.sessionId === sessionId) || null;
    },
  };
}
