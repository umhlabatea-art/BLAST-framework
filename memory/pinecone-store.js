/**
 * Pinecone-backed vector store.
 *
 * Conforms to the same interface as the in-memory store
 * (upsert / upsertMany / query / delete / clear / size), so the memory layer
 * uses it without changes. Everything is async.
 *
 * Inject a `client` for tests. In production it lazy-loads
 * `@pinecone-database/pinecone` using PINECONE_API_KEY and connects to
 * PINECONE_INDEX (+ optional PINECONE_NAMESPACE).
 *
 * Enable it with VECTOR_STORE=pinecone alongside MEMORY_BACKEND=vector|hybrid.
 */

async function loadClient({ client, apiKey }) {
  if (client) return client;
  if (!apiKey) throw new Error("PINECONE_API_KEY is required for the pinecone vector store.");
  const { Pinecone } = await import("@pinecone-database/pinecone");
  return new Pinecone({ apiKey });
}

export async function createPineconeStore(opts = {}) {
  const apiKey = opts.apiKey ?? process.env.PINECONE_API_KEY;
  const indexName = opts.indexName ?? process.env.PINECONE_INDEX;
  const namespace = opts.namespace ?? process.env.PINECONE_NAMESPACE ?? "umhlawati";
  if (!indexName) throw new Error("PINECONE_INDEX is required for the pinecone vector store.");

  const client = await loadClient({ client: opts.client, apiKey });
  const ns = client.index(indexName).namespace(namespace);

  return {
    async upsert(id, vector, payload = {}) {
      await ns.upsert([{ id, values: vector, metadata: payload }]);
    },
    async upsertMany(records) {
      if (!records || records.length === 0) return;
      await ns.upsert(
        records.map((r) => ({ id: r.id, values: r.vector, metadata: r.payload || {} }))
      );
    },
    async delete(id) {
      await ns.deleteOne(id);
    },
    async query(vector, { limit = 5, minScore = 0 } = {}) {
      const res = await ns.query({ topK: limit, vector, includeMetadata: true });
      return (res.matches || [])
        .filter((m) => m.score > minScore)
        .map((m) => ({
          id: m.id,
          score: Number(m.score.toFixed(4)),
          payload: m.metadata || {},
        }));
    },
    async clear() {
      // Best-effort wipe of the namespace before a full re-index. The namespace
      // may not exist yet on first run, so failures here are non-fatal.
      try {
        await ns.deleteAll();
      } catch {
        /* namespace empty or not yet created */
      }
    },
    async size() {
      // Pinecone has no cheap exact count; the memory layer tracks note counts.
      return undefined;
    },
  };
}
