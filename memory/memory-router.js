/**
 * Three levels of memory (per the curriculum):
 *
 *   1. Context   — what's relevant right now (this session). Ephemeral, in RAM.
 *   2. Project   — knowledge scoped to the current project (docs, decisions).
 *   3. Long-term — everything, forever (your Obsidian vault).
 *
 * The router queries whichever tiers are configured, normalizes each tier's
 * scores, applies a per-tier weight (recent context outranks distant
 * long-term memory), merges, and returns unified results tagged with `level`.
 *
 * Project and long-term tiers are any object implementing `search()/get()`
 * (e.g. createObsidianMemory). The context tier is built in: push items with
 * `remember()` and they participate in recall, newest-first.
 */
import { createMemoryFromNotes } from "./memory-store.js";

const DEFAULT_WEIGHTS = { context: 1.0, project: 0.8, longterm: 0.6 };

function normalize(list) {
  const max = list.reduce((m, x) => Math.max(m, x.score), 0) || 1;
  return list.map((x) => ({ ...x, norm: x.score / max }));
}

export function createMemoryRouter({
  project = null,
  longterm = null,
  weights = {},
  contextCapacity = 50,
} = {}) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const contextItems = []; // newest pushed to the end

  /** Record a short-term context item (e.g. a decision made this session). */
  function remember(text, { id, title, tags = [] } = {}) {
    const item = {
      id: id || `ctx-${contextItems.length + 1}`,
      title: title || text.slice(0, 40),
      tags,
      body: text,
    };
    contextItems.push(item);
    while (contextItems.length > contextCapacity) contextItems.shift();
    return item.id;
  }

  function searchContext(query, limit) {
    if (contextItems.length === 0) return [];
    const mem = createMemoryFromNotes(contextItems);
    const hits = mem.search(query, { limit });
    // Recency boost: more recent items (higher index) get a small bump.
    const positionOf = new Map(contextItems.map((it, i) => [it.id, i]));
    return hits.map((h) => {
      const recency = (positionOf.get(h.id) + 1) / contextItems.length;
      return { ...h, score: h.score * (0.75 + 0.25 * recency) };
    });
  }

  async function recall(query, { limit = 5, levels } = {}) {
    if (!query || !query.trim()) return [];
    const active = levels || ["context", "project", "longterm"];
    const perTier = limit * 2;
    const merged = new Map(); // id -> best entry

    const add = (level, hits) => {
      for (const h of normalize(hits)) {
        const weighted = h.norm * (w[level] ?? 0.5);
        const existing = merged.get(h.id);
        if (!existing || weighted > existing.score) {
          merged.set(h.id, {
            id: h.id,
            title: h.title,
            tags: h.tags || [],
            snippet: h.snippet || "",
            level,
            score: Number(weighted.toFixed(4)),
          });
        }
      }
    };

    if (active.includes("context")) add("context", searchContext(query, perTier));
    if (active.includes("project") && project) {
      add("project", await project.search(query, { limit: perTier }));
    }
    if (active.includes("longterm") && longterm) {
      add("longterm", await longterm.search(query, { limit: perTier }));
    }

    return [...merged.values()]
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, limit);
  }

  return {
    remember,
    recall,
    get(id) {
      const ctx = contextItems.find((c) => c.id === id);
      if (ctx) return { ...ctx, level: "context" };
      return (project && project.get(id)) || (longterm && longterm.get(id)) || null;
    },
    stats() {
      return {
        context: contextItems.length,
        project: project ? project.stats() : null,
        longterm: longterm ? longterm.stats() : null,
        weights: w,
      };
    },
  };
}
