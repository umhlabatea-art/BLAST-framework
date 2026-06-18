/**
 * Tests for the agent layer, using the deterministic mock provider so they run
 * offline with zero API keys. Exits non-zero on any failure.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProvider } from "./provider.js";
import { extractJson, runCriticLoop } from "./critic-loop.js";
import { recallContext } from "./memory-context.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_VAULT = path.join(here, "..", "memory", "fixtures", "vault");

let passed = 0;
function ok(name) {
  console.log(`  ok - ${name}`);
  passed++;
}

// 1. extractJson pulls a balanced object out of noisy text.
{
  const parsed = extractJson('prefix {"verdict":"pass","n":{"a":1}} trailing');
  assert.equal(parsed.verdict, "pass");
  assert.equal(parsed.n.a, 1);
  ok("extractJson handles nested/noisy output");
}

// 2. Mock provider produces an initial draft.
{
  const provider = createProvider({ LLM_PROVIDER: "mock" });
  const draft = await provider.complete({ user: "Task: write greet. Write the implementation." });
  assert.match(draft, /function greet/);
  ok("mock provider generates a draft");
}

// 3. Critic loop converges to pass after one revision and adds validation.
{
  const provider = createProvider({ LLM_PROVIDER: "mock" });
  const iterations = [];
  const result = await runCriticLoop({
    provider,
    task: "Write a greet(name) function.",
    maxIterations: 3,
    onIteration: (info) => iterations.push(info.verdict.verdict),
  });
  assert.equal(result.passed, true, "loop should pass");
  assert.equal(result.iterations, 2, "should take exactly 2 iterations");
  assert.deepEqual(iterations, ["revise", "pass"]);
  assert.match(result.code, /must be a non-empty string/, "final code has validation");
  ok("critic loop self-corrects then passes");
}

// 4. Loop validates its inputs.
{
  await assert.rejects(
    () => runCriticLoop({ provider: createProvider({ LLM_PROVIDER: "mock" }), task: "" }),
    /task is required/
  );
  ok("critic loop rejects empty task");
}

// 5. Unknown provider is rejected.
{
  assert.throws(() => createProvider({ LLM_PROVIDER: "nope" }), /Unknown LLM_PROVIDER/);
  ok("unknown provider is rejected");
}

// 6. Memory recall returns relevant grounding context for a payments task.
{
  const { context, hits } = await recallContext({
    vaultPath: FIXTURE_VAULT,
    query: "add a stripe refund endpoint to the payments module",
    limit: 3,
  });
  assert.ok(context.includes("Stripe Integration"), "context grounds in the Stripe note");
  assert.ok(
    hits.every((h) => h.title !== "Pasta Recipe"),
    "relevance guard filters the irrelevant note"
  );
  ok("recallContext returns relevant, guarded grounding context");
}

// 7. Memory recall with no vault is a no-op (not an error).
{
  const { context, hits } = await recallContext({ vaultPath: "", query: "anything" });
  assert.equal(context, "");
  assert.equal(hits.length, 0);
  ok("recallContext is a safe no-op without a vault");
}

console.log(`\nAll ${passed} agent tests passed.`);
