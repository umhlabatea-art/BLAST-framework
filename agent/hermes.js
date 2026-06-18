#!/usr/bin/env node
/**
 * Hermes — the umhlawati AI operator / orchestrator.
 *
 * Takes a natural-language task, runs it through the autonomous critic loop
 * using whichever LLM provider is configured, and prints the self-corrected
 * result.
 *
 * Usage:
 *   node hermes.js "Write a function that validates an email address"
 *   LLM_PROVIDER=openrouter LLM_API_KEY=... node hermes.js "<task>"
 *   MEMORY_VAULT=/path/to/ObsidianVault node hermes.js "<task>"
 *
 * With no provider configured it defaults to the deterministic mock provider,
 * so you can dry-run the orchestration without any API keys. If MEMORY_VAULT is
 * set, Hermes recalls relevant notes from the vault and grounds the task in them.
 */
import { loadEnv } from "./env.js";
import { createProvider } from "./provider.js";
import { runCriticLoop } from "./critic-loop.js";
import { recallContext } from "./memory-context.js";

async function main() {
  await loadEnv();

  const task = process.argv.slice(2).join(" ").trim();
  if (!task) {
    console.error('Usage: node hermes.js "<task description>"');
    process.exit(2);
  }

  const providerName = (process.env.LLM_PROVIDER || "mock").toLowerCase();
  const provider = createProvider(process.env);

  console.error(`[hermes] provider=${providerName}`);
  console.error(`[hermes] task: ${task}`);

  // Recall grounding context from the Obsidian vault, if one is configured.
  let context = "";
  const vaultPath = process.env.MEMORY_VAULT || process.env.OBSIDIAN_VAULT;
  if (vaultPath) {
    try {
      const recall = await recallContext({ vaultPath, query: task, limit: 3 });
      context = recall.context;
      if (recall.hits.length) {
        console.error(
          `[hermes] recalled ${recall.hits.length} note(s): ${recall.hits
            .map((h) => h.title)
            .join(", ")}`
        );
      } else {
        console.error("[hermes] no relevant notes found in vault");
      }
    } catch (err) {
      console.error(`[hermes] memory recall skipped: ${err.message}`);
    }
  }

  console.error("[hermes] running critic loop...\n");

  const result = await runCriticLoop({
    provider,
    task,
    context,
    maxIterations: 3,
    onIteration: ({ iteration, verdict }) => {
      console.error(
        `[hermes] iteration ${iteration}: ${verdict.verdict} (score ${verdict.score}) — ${verdict.summary}`
      );
    },
  });

  console.error(
    `\n[hermes] ${result.passed ? "PASSED" : "stopped (budget reached)"} after ${result.iterations} iteration(s).\n`
  );

  // Auto-ingest: persist this outcome back into the vault for future recall.
  // Enabled with MEMORY_AUTOSAVE=1 (or true/yes) and a configured vault.
  if (vaultPath && /^(1|true|yes)$/i.test(process.env.MEMORY_AUTOSAVE || "")) {
    try {
      const { writeNote } = await import("../memory/ingest.js");
      const saved = await writeNote({
        vaultPath,
        subdir: "hermes",
        title: `Task: ${task.slice(0, 60)}`,
        tags: ["hermes", "auto", result.passed ? "passed" : "unfinished"],
        frontmatter: { iterations: result.iterations, passed: result.passed },
        body:
          `## Task\n${task}\n\n` +
          `## Outcome\n${result.verdict?.summary || "n/a"} ` +
          `(score ${result.verdict?.score ?? "n/a"})\n\n` +
          `## Result\n\`\`\`\n${result.code}\n\`\`\`\n`,
      });
      console.error(`[hermes] saved note to vault: ${saved.id}`);
    } catch (err) {
      console.error(`[hermes] could not save note: ${err.message}`);
    }
  }

  // The final artifact goes to stdout so it can be piped/redirected.
  process.stdout.write(result.code + "\n");
}

main().catch((err) => {
  console.error("[hermes] fatal:", err.message);
  process.exit(1);
});
