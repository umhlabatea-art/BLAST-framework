#!/usr/bin/env node
/**
 * Query an Obsidian vault from the command line.
 *
 *   node cli.js <vaultPath> "<query>" [limit]
 *
 * Examples:
 *   node cli.js ~/ObsidianVault "stripe webhook handling"
 *   node cli.js ./memory/fixtures/vault "jwt auth" 3
 *
 * If no vaultPath is given it falls back to the OBSIDIAN_VAULT env var.
 */
import { createObsidianMemory } from "./memory-store.js";

async function main() {
  const [, , maybeVault, ...rest] = process.argv;
  const vaultPath = maybeVault || process.env.OBSIDIAN_VAULT;
  const limitArg = rest.length > 1 ? Number(rest[rest.length - 1]) : NaN;
  const limit = Number.isInteger(limitArg) ? limitArg : 5;
  const query = (Number.isInteger(limitArg) ? rest.slice(0, -1) : rest).join(" ");

  if (!vaultPath || !query) {
    console.error('Usage: node cli.js <vaultPath> "<query>" [limit]');
    console.error("       (vaultPath may be omitted if OBSIDIAN_VAULT is set)");
    process.exit(2);
  }

  const memory = await createObsidianMemory({ vaultPath });
  const stats = memory.stats();
  console.error(
    `[memory] indexed ${stats.notes} notes (backend: ${memory.backend}) from ${vaultPath}\n`
  );

  const results = await memory.search(query, { limit });
  if (results.length === 0) {
    console.log(`No matches for "${query}".`);
    return;
  }
  for (const r of results) {
    console.log(`${r.score.toFixed(3)}  ${r.title}  [${r.id}]`);
    if (r.tags.length) console.log(`        tags: ${r.tags.join(", ")}`);
    console.log(`        ${r.snippet}\n`);
  }
}

main().catch((err) => {
  console.error("[memory] error:", err.message);
  process.exit(1);
});
