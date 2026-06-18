/**
 * In-memory vector store with cosine-similarity search.
 *
 * Deliberately tiny and dependency-free: it holds embeddings in an array and
 * does a linear scan. That's perfectly adequate for a personal Obsidian vault
 * (thousands of notes). The API mirrors what a hosted vector DB (Pinecone)
 * exposes, so it can be swapped out later without touching callers:
 *
 *   store.upsert(id, vector, payload)
 *   store.query(vector, { limit }) -> [{ id, score, payload }]
 */
import { cosineSimilarity } from "./embeddings.js";

export function createVectorStore() {
  const items = new Map(); // id -> { vector, payload }

  return {
    upsert(id, vector, payload = {}) {
      items.set(id, { vector, payload });
    },
    delete(id) {
      items.delete(id);
    },
    size() {
      return items.size;
    },
    query(vector, { limit = 5, minScore = 0 } = {}) {
      const scored = [];
      for (const [id, item] of items) {
        const score = cosineSimilarity(vector, item.vector);
        if (score > minScore) {
          scored.push({ id, score: Number(score.toFixed(4)), payload: item.payload });
        }
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit);
    },
    clear() {
      items.clear();
    },
  };
}
