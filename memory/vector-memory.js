/**
 * Vector-backed memory over an Obsidian vault.
 *
 * Embeds every note once, stores the vectors, and answers queries by embedding
 * the query and ranking notes by cosine similarity. Exposes the SAME interface
 * as the BM25 memory (search/get/all/stats/reindex) so the two are
 * interchangeable behind `createObsidianMemory({ backend })`.
 */
import { loadVault } from "./vault.js";
import { buildDocumentText } from "./memory-store.js";
import { createVectorStore } from "./vector-store.js";

function makeSnippet(note, maxLen = 200) {
  const firstLine =
    note.body.split("\n").map((l) => l.trim()).find(Boolean) || "";
  return firstLine.length > maxLen ? `${firstLine.slice(0, maxLen)}…` : firstLine;
}

async function indexNotes(notes, embedder, store) {
  store.clear();
  if (notes.length === 0) return;
  const vectors = await embedder.embed(notes.map((n) => buildDocumentText(n)));
  notes.forEach((note, i) => {
    store.upsert(note.id, vectors[i], {
      title: note.title,
      tags: note.tags,
      snippet: makeSnippet(note),
    });
  });
}

export async function createVectorMemoryFromNotes(notes, embedder) {
  const store = createVectorStore();
  const byId = new Map(notes.map((n) => [n.id, n]));
  await indexNotes(notes, embedder, store);

  async function search(query, { limit = 5 } = {}) {
    if (!query || !query.trim()) return [];
    const [qVec] = await embedder.embed(query);
    return store.query(qVec, { limit, minScore: 0.0001 }).map((r) => ({
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
    stats: () => ({ notes: store.size(), backend: "vector", embedder: embedder.name }),
    async _replace(newNotes) {
      notes = newNotes;
      byId.clear();
      for (const n of notes) byId.set(n.id, n);
      await indexNotes(notes, embedder, store);
    },
  };
}

export async function createVectorMemory({ vaultPath, embedder }) {
  if (!vaultPath) throw new Error("vaultPath is required");
  if (!embedder) throw new Error("embedder is required");
  const notes = await loadVault(vaultPath);
  const memory = await createVectorMemoryFromNotes(notes, embedder);
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
