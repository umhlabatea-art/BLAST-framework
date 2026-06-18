/**
 * Vector-backed memory over an Obsidian vault.
 *
 * Embeds every note once, stores the vectors in a pluggable vector store, and
 * answers queries by embedding the query and ranking by cosine similarity.
 * Exposes the SAME interface as the BM25 memory (search/get/all/stats/reindex)
 * so the two are interchangeable behind `createObsidianMemory({ backend })`.
 *
 * The vector store is pluggable: the default is the in-memory cosine index;
 * setting VECTOR_STORE=pinecone (or passing a `store`) uses a hosted index.
 * All store operations are awaited, so sync (in-memory) and async (Pinecone)
 * stores work identically.
 */
import { loadVault } from "./vault.js";
import { buildDocumentText } from "./memory-store.js";
import { createVectorStore } from "./vector-store.js";

function makeSnippet(note, maxLen = 200) {
  const firstLine =
    note.body.split("\n").map((l) => l.trim()).find(Boolean) || "";
  return firstLine.length > maxLen ? `${firstLine.slice(0, maxLen)}…` : firstLine;
}

/** Resolve which vector store to use (injected > env > in-memory default). */
export async function resolveVectorStore({ vectorStore } = {}) {
  if (vectorStore) return vectorStore;
  if ((process.env.VECTOR_STORE || "").toLowerCase() === "pinecone") {
    const { createPineconeStore } = await import("./pinecone-store.js");
    return createPineconeStore();
  }
  return createVectorStore();
}

async function indexNotes(notes, embedder, store) {
  await store.clear();
  if (notes.length === 0) return;
  const vectors = await embedder.embed(notes.map((n) => buildDocumentText(n)));
  const records = notes.map((note, i) => ({
    id: note.id,
    vector: vectors[i],
    payload: { title: note.title, tags: note.tags, snippet: makeSnippet(note) },
  }));
  if (typeof store.upsertMany === "function") {
    await store.upsertMany(records);
  } else {
    for (const r of records) await store.upsert(r.id, r.vector, r.payload);
  }
}

export async function createVectorMemoryFromNotes(notes, embedder, store) {
  const vectorStore = store || createVectorStore();
  const byId = new Map(notes.map((n) => [n.id, n]));
  await indexNotes(notes, embedder, vectorStore);

  async function search(query, { limit = 5 } = {}) {
    if (!query || !query.trim()) return [];
    const [qVec] = await embedder.embed(query);
    const results = await vectorStore.query(qVec, { limit, minScore: 0.0001 });
    return results.map((r) => ({
      id: r.id,
      title: r.payload.title,
      tags: r.payload.tags,
      score: r.score,
      snippet: r.payload.snippet,
    }));
  }

  return {
    search,
    get: (id) => byId.get(id) || null,
    all: () => notes.slice(),
    stats: () => ({ notes: notes.length, backend: "vector", embedder: embedder.name }),
    async _replace(newNotes) {
      notes = newNotes;
      byId.clear();
      for (const n of notes) byId.set(n.id, n);
      await indexNotes(notes, embedder, vectorStore);
    },
  };
}

export async function createVectorMemory({ vaultPath, embedder, store }) {
  if (!vaultPath) throw new Error("vaultPath is required");
  if (!embedder) throw new Error("embedder is required");
  const notes = await loadVault(vaultPath);
  const memory = await createVectorMemoryFromNotes(notes, embedder, store);
  return {
    ...memory,
    vaultPath,
    async reindex() {
      const fresh = await loadVault(vaultPath);
      await memory._replace(fresh);
      return memory.stats();
    },
  };
}
