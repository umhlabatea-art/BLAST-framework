/**
 * BM25 memory index over an Obsidian vault.
 *
 * BM25 is a well-understood ranking function that scores how relevant a
 * document is to a query. It needs no embeddings or external services, so this
 * memory layer works fully offline — a solid default before (optionally)
 * upgrading to a vector store like Pinecone later.
 *
 * Public API (createObsidianMemory):
 *   await mem.reindex()
 *   mem.search(query, { limit })  -> [{ id, title, score, snippet, tags }]
 *   mem.get(id)                   -> note | null
 *   mem.stats()                   -> { notes, terms, avgDocLength }
 */
import { loadVault } from "./vault.js";
import { createEmbedder } from "./embeddings.js";
import { createVectorMemory, createVectorMemoryFromNotes } from "./vector-memory.js";

// BM25 free parameters (standard defaults).
const K1 = 1.5; // term-frequency saturation
const B = 0.75; // length normalization

// Stopwords: common English filler plus imperative verbs and filler that show
// up in task prompts ("add a refund endpoint") but carry no retrieval signal.
const STOPWORDS = new Set(
  (
    "a an and are as at be but by for if in into is it no not of on or such that the their then there these they this to was will with you your " +
    "add use set get make create write build implement update remove fix do does how what when where which "
  )
    .trim()
    .split(/\s+/)
);

export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (t) => t.length > 1 && !STOPWORDS.has(t)
  );
}

/**
 * Build the searchable text for a note. Title and tags are repeated so matches
 * there carry more weight than matches deep in the body.
 */
export function buildDocumentText(note) {
  const titleBoost = `${note.title} ${note.title} ${note.title}`;
  const tagBoost = note.tags.map((t) => `${t} ${t}`).join(" ");
  return `${titleBoost} ${tagBoost} ${note.body}`;
}

function buildIndex(notes) {
  const docs = notes.map((note) => {
    const tokens = tokenize(buildDocumentText(note));
    const tf = new Map();
    for (const tok of tokens) tf.set(tok, (tf.get(tok) || 0) + 1);
    return { note, tf, length: tokens.length };
  });

  // Document frequency per term.
  const df = new Map();
  for (const doc of docs) {
    for (const term of doc.tf.keys()) df.set(term, (df.get(term) || 0) + 1);
  }

  const totalLength = docs.reduce((sum, d) => sum + d.length, 0);
  const avgDocLength = docs.length ? totalLength / docs.length : 0;

  return { docs, df, avgDocLength, N: docs.length };
}

function idf(term, df, N) {
  const n = df.get(term) || 0;
  // BM25 idf with +1 to keep it non-negative for very common terms.
  return Math.log(1 + (N - n + 0.5) / (n + 0.5));
}

function makeSnippet(note, queryTerms, maxLen = 200) {
  const lines = note.body.split("\n").map((l) => l.trim()).filter(Boolean);
  // Prefer the first line that contains any query term.
  const hit = lines.find((line) => {
    const lower = line.toLowerCase();
    return queryTerms.some((t) => lower.includes(t));
  });
  const chosen = hit || lines[0] || "";
  return chosen.length > maxLen ? `${chosen.slice(0, maxLen)}…` : chosen;
}

export function createMemoryFromNotes(notes) {
  let index = buildIndex(notes);
  const byId = new Map(notes.map((n) => [n.id, n]));

  function search(query, { limit = 5 } = {}) {
    const terms = tokenize(query);
    if (terms.length === 0) return [];

    const scored = [];
    for (const doc of index.docs) {
      let score = 0;
      for (const term of terms) {
        const tf = doc.tf.get(term);
        if (!tf) continue;
        const numerator = tf * (K1 + 1);
        const denominator =
          tf + K1 * (1 - B + (B * doc.length) / (index.avgDocLength || 1));
        score += idf(term, index.df, index.N) * (numerator / denominator);
      }
      if (score > 0) {
        scored.push({
          id: doc.note.id,
          title: doc.note.title,
          tags: doc.note.tags,
          score: Number(score.toFixed(4)),
          snippet: makeSnippet(doc.note, terms),
        });
      }
    }
    scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    return scored.slice(0, limit);
  }

  return {
    search,
    get: (id) => byId.get(id) || null,
    all: () => notes.slice(),
    stats: () => ({
      notes: index.N,
      terms: index.df.size,
      avgDocLength: Number(index.avgDocLength.toFixed(2)),
    }),
    // Re-build from a fresh set of notes (used by reindex on the vault wrapper).
    _replace(newNotes) {
      notes = newNotes;
      index = buildIndex(notes);
      byId.clear();
      for (const n of notes) byId.set(n.id, n);
    },
  };
}

/**
 * Create a memory backed by an Obsidian vault on disk.
 *
 * @param {object}  opts
 * @param {string}  opts.vaultPath
 * @param {string}  [opts.backend]   "bm25" (default) | "vector" | "hybrid".
 *                                    Falls back to MEMORY_BACKEND env var.
 * @param {object}  [opts.embedder]  custom embedder for vector/hybrid backends.
 */
export async function createObsidianMemory({ vaultPath, backend, embedder } = {}) {
  if (!vaultPath) throw new Error("vaultPath is required");
  const mode = (backend || process.env.MEMORY_BACKEND || "bm25").toLowerCase();

  if (mode === "bm25") {
    const notes = await loadVault(vaultPath);
    const memory = createMemoryFromNotes(notes);
    return {
      ...memory,
      vaultPath,
      backend: "bm25",
      async reindex() {
        const fresh = await loadVault(vaultPath);
        memory._replace(fresh);
        return memory.stats();
      },
    };
  }

  if (mode === "vector") {
    const emb = embedder || createEmbedder();
    const memory = await createVectorMemory({ vaultPath, embedder: emb });
    return { ...memory, backend: "vector" };
  }

  if (mode === "hybrid") {
    const emb = embedder || createEmbedder();
    let notes = await loadVault(vaultPath);
    let bm25 = createMemoryFromNotes(notes);
    let vec = await createVectorMemoryFromNotes(notes, emb);
    let byId = new Map(notes.map((n) => [n.id, n]));

    // Normalize a result list to [0,1] by its own max score.
    const normalize = (list) => {
      const max = list.reduce((m, x) => Math.max(m, x.score), 0) || 1;
      return new Map(list.map((x) => [x.id, x.score / max]));
    };

    async function search(query, { limit = 5 } = {}) {
      if (!query || !query.trim()) return [];
      const wide = limit * 3;
      const bList = bm25.search(query, { limit: wide });
      const vList = await vec.search(query, { limit: wide });
      const bn = normalize(bList);
      const vn = normalize(vList);
      const snippetById = new Map(
        [...vList, ...bList].map((x) => [x.id, x.snippet])
      );
      const ids = new Set([...bn.keys(), ...vn.keys()]);
      const merged = [...ids].map((id) => {
        const note = byId.get(id);
        const score = 0.5 * (bn.get(id) || 0) + 0.5 * (vn.get(id) || 0);
        return {
          id,
          title: note ? note.title : id,
          tags: note ? note.tags : [],
          score: Number(score.toFixed(4)),
          snippet: snippetById.get(id) || "",
        };
      });
      merged.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
      return merged.slice(0, limit);
    }

    return {
      search,
      get: (id) => byId.get(id) || null,
      all: () => notes.slice(),
      stats: () => ({ notes: notes.length, backend: "hybrid", embedder: emb.name }),
      vaultPath,
      backend: "hybrid",
      async reindex() {
        notes = await loadVault(vaultPath);
        bm25 = createMemoryFromNotes(notes);
        vec = await createVectorMemoryFromNotes(notes, emb);
        byId = new Map(notes.map((n) => [n.id, n]));
        return this.stats();
      },
    };
  }

  throw new Error(`Unknown memory backend: ${mode} (use bm25 | vector | hybrid)`);
}
