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
 */
import crypto from "node:crypto";

export function createInMemoryStore() {
  const usersById = new Map();
  const usersByEmail = new Map();
  const payments = new Map();
  const leads = new Map();
  const leadNotes = new Map(); // leadId -> [{ id, body, createdAt }]

  return {
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

    async markPaymentStatus(sessionId, status) {
      const payment = [...payments.values()].find((p) => p.sessionId === sessionId);
      if (!payment) return null;
      payment.status = status;
      return payment;
    },

    // --- CRM: leads ---
    async createLead({ ownerId, name, email, company, source, status }) {
      const lead = {
        id: crypto.randomUUID(),
        ownerId,
        name,
        email,
        company,
        source,
        status,
        createdAt: new Date().toISOString(),
      };
      leads.set(lead.id, lead);
      leadNotes.set(lead.id, []);
      return lead;
    },

    async listLeads(ownerId, { status } = {}) {
      return [...leads.values()]
        .filter((l) => l.ownerId === ownerId && (!status || l.status === status))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async listAllLeads() {
      return [...leads.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async findLeadById(id) {
      return leads.get(id) || null;
    },

    async updateLead(id, patch) {
      const lead = leads.get(id);
      if (!lead) return null;
      Object.assign(lead, patch);
      return lead;
    },

    async addLeadNote(leadId, body) {
      const note = { id: crypto.randomUUID(), body, createdAt: new Date().toISOString() };
      const list = leadNotes.get(leadId) || [];
      list.push(note);
      leadNotes.set(leadId, list);
      return note;
    },

    async listLeadNotes(leadId) {
      return [...(leadNotes.get(leadId) || [])];
    },
  };
}
