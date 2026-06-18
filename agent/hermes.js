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
 *
 * With no provider configured it defaults to the deterministic mock provider,
 * so you can dry-run the orchestration without any API keys.
 */
import { loadEnv } from "./env.js";
import { createProvider } from "./provider.js";
import { runCriticLoop } from "./critic-loop.js";

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
  console.error("[hermes] running critic loop...\n");

  const result = await runCriticLoop({
    provider,
    task,
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

  // The final artifact goes to stdout so it can be piped/redirected.
  process.stdout.write(result.code + "\n");
}

main().catch((err) => {
  console.error("[hermes] fatal:", err.message);
  process.exit(1);
});
