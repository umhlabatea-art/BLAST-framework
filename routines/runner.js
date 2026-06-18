/**
 * Hermes runner for routines.
 *
 * Turns a routine into an executed Hermes task: runs the autonomous critic loop
 * with the configured LLM provider, optionally grounds it in vault memory, and
 * (when a vault is configured) writes the outcome back as an Obsidian note —
 * so scheduled runs accumulate as long-term memory.
 *
 * Returns { task, passed, iterations, summary, code, note? }.
 */
import { createProvider } from "../agent/provider.js";
import { runCriticLoop } from "../agent/critic-loop.js";
import { recallContext } from "../agent/memory-context.js";
import { writeNote } from "../memory/ingest.js";

export function createHermesRunner({ env = process.env } = {}) {
  const vaultPath = env.MEMORY_VAULT || env.OBSIDIAN_VAULT || "";

  return async function run(routine) {
    const provider = createProvider(env);

    let context = "";
    if (vaultPath) {
      try {
        const recall = await recallContext({ vaultPath, query: routine.task, limit: 3 });
        context = recall.context;
      } catch {
        /* recall is best-effort */
      }
    }

    const result = await runCriticLoop({
      provider,
      task: routine.task,
      context,
      maxIterations: 3,
    });

    let note = null;
    if (vaultPath) {
      try {
        const saved = await writeNote({
          vaultPath,
          subdir: "routines",
          title: `Routine: ${routine.name}`,
          tags: ["routine", routine.name, result.passed ? "passed" : "unfinished", ...(routine.tags || [])],
          frontmatter: { schedule: routine.schedule, passed: result.passed, iterations: result.iterations },
          body:
            `## Routine\n${routine.name} (\`${routine.schedule}\`)\n\n` +
            `## Task\n${routine.task}\n\n` +
            `## Outcome\n${result.verdict?.summary || "n/a"} (score ${result.verdict?.score ?? "n/a"})\n\n` +
            `## Result\n\`\`\`\n${result.code}\n\`\`\`\n`,
        });
        note = saved.id;
      } catch {
        /* logging is best-effort */
      }
    }

    return {
      task: routine.task,
      passed: result.passed,
      iterations: result.iterations,
      summary: result.verdict?.summary || "",
      code: result.code,
      note,
    };
  };
}
