#!/usr/bin/env node
/**
 * Routines CLI.
 *
 *   node cli.js list [configPath]       list configured routines + next run
 *   node cli.js run-due [configPath]    run everything due right now (wire to system cron)
 *   node cli.js start [configPath]      run the in-process scheduler (once a minute)
 *
 * Config defaults to ./routines.json. The runner uses the LLM provider from the
 * environment (mock by default) and logs outcomes to MEMORY_VAULT if set.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createScheduler } from "./scheduler.js";
import { createHermesRunner } from "./runner.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function loadRoutines(configPath) {
  const file = configPath || path.join(here, "routines.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const [, , command = "list", configPath] = process.argv;
  const routines = await loadRoutines(configPath);
  const scheduler = createScheduler({ routines, runner: createHermesRunner() });

  if (command === "list") {
    for (const r of scheduler.list()) {
      console.log(`${r.enabled ? "●" : "○"} ${r.name}  [${r.schedule}]`);
      console.log(`    ${r.task}`);
    }
    const next = scheduler.nextRunAt();
    console.log(`\nNext run: ${next ? next.toISOString() : "(none scheduled)"}`);
    return;
  }

  if (command === "run-due") {
    const results = await scheduler.runDue();
    if (results.length === 0) {
      console.log("Nothing due right now.");
      return;
    }
    for (const r of results) {
      console.log(
        r.ok
          ? `✓ ${r.name}: ${r.result.passed ? "passed" : "unfinished"}` +
              (r.result.note ? ` (note: ${r.result.note})` : "")
          : `✗ ${r.name}: ${r.error}`
      );
    }
    return;
  }

  if (command === "start") {
    console.log("[routines] scheduler started (once a minute). Ctrl-C to stop.");
    scheduler.start();
    // Keep the process alive.
    setInterval(() => {}, 1 << 30);
    return;
  }

  console.error(`Unknown command: ${command} (use list | run-due | start)`);
  process.exit(2);
}

main().catch((err) => {
  console.error("[routines] error:", err.message);
  process.exit(1);
});
