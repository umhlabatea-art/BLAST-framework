/**
 * Offline tests for the chat command router, using a mock Hermes runner and the
 * in-memory store. No Discord/Slack SDK, no network. Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import { createInMemoryStore } from "../src/backend/store.js";
import { createCommandRouter } from "./commands.js";

let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

function makeRouter() {
  const store = createInMemoryStore();
  const runnerCalls = [];
  const runner = async (task) => {
    runnerCalls.push(task);
    return { passed: true, iterations: 2, summary: "done", code: "console.log(1)", note: "hermes/x.md" };
  };
  const router = createCommandRouter({ runner, store, ownerId: "u1" });
  return { router, store, runnerCalls };
}

// non-commands are ignored
{
  const { router } = makeRouter();
  assert.equal(await router.handle("just chatting"), null, "non-command returns null");
  ok("ignores messages without the command prefix");
}

// help
{
  const { router } = makeRouter();
  const r = await router.handle("!help");
  assert.match(r.text, /commands/i);
  ok("!help lists commands");
}

// hermes
{
  const { router, runnerCalls } = makeRouter();
  const usage = await router.handle("!hermes");
  assert.match(usage.text, /Usage/);
  const r = await router.handle("!hermes write a validator");
  assert.equal(runnerCalls[0], "write a validator", "runner invoked with the task");
  assert.equal(r.thread, true, "hermes replies in a thread");
  assert.match(r.text, /passed/);
  assert.match(r.text, /saved: hermes\/x\.md/);
  ok("!hermes runs the task and reports the result + saved note");
}

// lead add + leads list
{
  const { router } = makeRouter();
  const empty = await router.handle("!leads");
  assert.match(empty.text, /No leads/);

  const add = await router.handle("!lead add Acme Corp | buyer@acme.io | Acme");
  assert.match(add.text, /Created lead Acme Corp/);

  const list = await router.handle("!leads");
  assert.match(list.text, /1 lead/);
  assert.match(list.text, /Acme Corp/);
  ok("!lead add creates a lead and !leads lists it");

  const bad = await router.handle("!lead add  | nope@");
  assert.match(bad.text, /⚠️/, "invalid lead surfaces an error");
  ok("invalid !lead add reports a validation error");
}

// lead status transition (valid + invalid + filter)
{
  const { router } = makeRouter();
  const add = await router.handle("!lead add Beta | b@beta.io | Beta");
  const id = add.text.match(/id: ([0-9a-f-]+)/)[1];

  const moved = await router.handle(`!lead status ${id} contacted`);
  assert.match(moved.text, /Moved Beta to contacted/);

  const illegal = await router.handle(`!lead status ${id} new`);
  assert.match(illegal.text, /Cannot move/);

  const missing = await router.handle("!lead status does-not-exist won");
  assert.match(missing.text, /not found/);

  const filtered = await router.handle("!leads contacted");
  assert.match(filtered.text, /Beta/);
  const none = await router.handle("!leads won");
  assert.match(none.text, /No leads/);
  ok("!lead status enforces transitions; !leads filters by status");
}

// followups
{
  const { router } = makeRouter();
  await router.handle("!lead add Gamma | g@gamma.io | Gamma");
  const fu = await router.handle("!followups");
  // freshly created lead has a day-0 follow-up due now
  assert.ok(/Next Actions|No overdue/.test(fu.text), "followups returns a digest or all-clear");
  ok("!followups returns a follow-up digest");
}

// unknown command + validation of construction
{
  const { router } = makeRouter();
  const unknown = await router.handle("!frobnicate");
  assert.match(unknown.text, /Unknown command/);
  assert.throws(() => createCommandRouter({ store: createInMemoryStore() }), /runner function is required/);
  assert.throws(() => createCommandRouter({ runner: () => {} }), /store is required/);
  ok("unknown commands and bad construction are handled");
}

console.log(`\nAll ${passed} chat tests passed.`);
