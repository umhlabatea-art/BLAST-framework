/**
 * Prisma-backed store adapter — same interface as createInMemoryStore().
 *
 * Loaded dynamically via server.js when DATABASE_URL is set.
 * Requires the Prisma client to have been generated first:
 *   npm run db:generate && npm run db:push
 *
 * The in-memory store remains the default for tests and zero-config local dev.
 */

// Generic collection → Prisma model name map.
const MODEL = {
  tracks: "track",
  registrations: "registration",
  agentTasks: "agentTask",
  posts: "post",
  listings: "listing",
  bookings: "booking",
  episodes: "episode",
};

function deserialize(record) {
  if (!record) return record;
  // Re-inflate JSON blobs stored as strings.
  const out = { ...record };
  for (const key of ["payload", "history", "meta"]) {
    if (typeof out[key] === "string") {
      try { out[key] = JSON.parse(out[key]); } catch { /* leave as string */ }
    }
  }
  if (typeof out.tags === "string") out.tags = out.tags ? out.tags.split(",") : [];
  return out;
}

function serialize(record) {
  const out = { ...record };
  for (const key of ["payload", "history", "meta"]) {
    if (out[key] !== undefined && typeof out[key] !== "string") {
      out[key] = JSON.stringify(out[key]);
    }
  }
  if (Array.isArray(out.tags)) out.tags = out.tags.join(",");
  return out;
}

export async function createPrismaStore() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  await prisma.$connect();

  function model(name) {
    const m = MODEL[name];
    if (!m || !prisma[m]) throw new Error(`Unknown collection: ${name}`);
    return prisma[m];
  }

  return {
    async insert(name, record) {
      const data = serialize(record);
      // Remove undefined values — Prisma rejects them.
      Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
      const stored = await model(name).create({ data });
      return deserialize(stored);
    },

    async get(name, id) {
      const stored = await model(name).findUnique({ where: { id } });
      return deserialize(stored);
    },

    async update(name, id, patch) {
      const data = serialize(patch);
      Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
      const stored = await model(name).update({ where: { id }, data });
      return deserialize(stored);
    },

    async list(name, predicate) {
      const all = await model(name).findMany({ orderBy: { createdAt: "desc" } });
      const mapped = all.map(deserialize);
      return predicate ? mapped.filter(predicate) : mapped;
    },

    // --- User -----------------------------------------------------------------

    async createUser({ email, passwordHash }) {
      const normalized = email.toLowerCase();
      try {
        return await prisma.user.create({
          data: { email: normalized, passwordHash, tier: "free" },
        });
      } catch (err) {
        if (err.code === "P2002") throw new Error("Email already registered");
        throw err;
      }
    },

    async findUserByEmail(email) {
      return prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    },

    async findUserById(id) {
      return prisma.user.findUnique({ where: { id } });
    },

    // --- Payments -------------------------------------------------------------

    async recordPayment({ userId, sessionId, amount, currency, status }) {
      return prisma.payment.create({
        data: { userId, sessionId, amount, currency: currency || "ZAR", status: status || "pending" },
      });
    },

    async listPaymentsByUser(userId) {
      return prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    },

    async findPaymentBySession(sessionId) {
      return prisma.payment.findUnique({ where: { sessionId } });
    },
  };
}
