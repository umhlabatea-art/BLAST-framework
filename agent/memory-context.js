/**
 * Bridge between the Obsidian memory layer and the Hermes agent.
 *
 * Given a vault path and a task, recall the most relevant notes and format them
 * into a compact grounding-context string the critic loop can prepend to its
 * prompts. Returns "" when there is no vault or no relevant note, so callers can
 * use it unconditionally.
 */
import { createObsidianMemory } from "../memory/memory-store.js";

/**
 * @param {{ vaultPath: string, query: string, limit?: number, maxChars?: number }} opts
 * @returns {Promise<{ context: string, hits: Array }>}
 */
export async function recallContext({ vaultPath, query, limit = 3, maxChars = 1500 }) {
  if (!vaultPath) return { context: "", hits: [] };

  const memory = await createObsidianMemory({ vaultPath });
  const allHits = memory.search(query, { limit });
  if (allHits.length === 0) return { context: "", hits: [] };

  // Relevance guard: drop hits that score far below the top match. A single
  // common word (e.g. "add") can cause an otherwise-irrelevant note to surface;
  // requiring at least 30% of the top score filters that noise out.
  const topScore = allHits[0].score;
  const hits = allHits.filter((h) => h.score >= topScore * 0.3);

  let context = "";
  for (const hit of hits) {
    const note = memory.get(hit.id);
    const body = note ? note.body : hit.snippet;
    const block = `## ${hit.title}${hit.tags.length ? ` (tags: ${hit.tags.join(", ")})` : ""}\n${body}\n\n`;
    if (context.length + block.length > maxChars) {
      // Add a trimmed version of this block to respect the budget, then stop.
      context += block.slice(0, Math.max(0, maxChars - context.length));
      break;
    }
    context += block;
  }

  return { context: context.trim(), hits };
}
