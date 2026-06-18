/**
 * Offline tests for the routines engine. No LLM, no waiting — the scheduler is
 * driven with explicit dates and a mock runner. Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import { parseCron, cronMatches, nextRun } from "./cron.js";
import { createScheduler } from "./scheduler.js";

let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

// --- cron parsing & matching --------------------------------------------
{
  assert.throws(() => parseCron("* * *"), /5 fields/);
  assert.throws(() => parseCron("60 * * * *"), /Invalid cron field/);
  ok("parseCron rejects malformed expressions");

  // 09:00 on weekdays
  const wd = parseCron("0 9 * * 1-5");
  assert.equal(cronMatches(wd, new Date("2026-06-15T09:00:00")), true, "Mon 09:00 matches");
  assert.equal(cronMatches(wd, new Date("2026-06-15T09:01:00")), false, "09:01 does not match");
  assert.equal(cronMatches(wd, new Date("2026-06-14T09:00:00")), false, "Sunday does not match");
  ok("cronMatches handles hour/minute/weekday ranges");

  // every 15 minutes
  const q = parseCron("*/15 * * * *");
  assert.equal(cronMatches(q, new Date("2026-06-15T10:30:00")), true);
  assert.equal(cronMatches(q, new Date("2026-06-15T10:31:00")), false);
  ok("cronMatches handles step values");

  // OR semantics when both DOM and DOW are restricted
  const either = parseCron("0 0 1 * 1"); // 1st of month OR Mondays
  assert.equal(cronMatches(either, new Date("2026-06-01T00:00:00")), true, "1st matches");
  assert.equal(cronMatches(either, new Date("2026-06-08T00:00:00")), true, "Monday matches");
  assert.equal(cronMatches(either, new Date("2026-06-09T00:00:00")), false, "Tue 9th no match");
  ok("cronMatches uses OR semantics for DOM+DOW");

  const next = nextRun(parseCron("30 14 * * *"), new Date("2026-06-15T14:31:00"));
  assert.equal(next.getHours(), 14);
  assert.equal(next.getMinutes(), 30);
  assert.equal(next.getDate(), 16, "rolls to next day");
  ok("nextRun computes the next matching minute");
}

// --- scheduler -----------------------------------------------------------
{
  const calls = [];
  const runner = async (routine) => {
    calls.push(routine.name);
    return { passed: true, note: `routines/${routine.name}.md` };
  };
  const routines = [
    { name: "nine-am", schedule: "0 9 * * *", task: "do A" },
    { name: "every-15", schedule: "*/15 * * * *", task: "do B" },
    { name: "disabled", schedule: "0 9 * * *", task: "do C", enabled: false },
  ];
  const scheduler = createScheduler({ routines, runner, now: () => new Date("2026-06-15T09:00:00") });

  const due = scheduler.dueRoutines(new Date("2026-06-15T09:00:00"));
  assert.deepEqual(due.map((r) => r.name).sort(), ["every-15", "nine-am"], "due excludes disabled");
  ok("dueRoutines returns enabled routines matching the time");

  const results = await scheduler.runDue(new Date("2026-06-15T09:00:00"));
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.ok), "all ran ok");
  assert.deepEqual(calls.sort(), ["every-15", "nine-am"]);
  ok("runDue executes due routines via the runner");

  // Same minute again -> no double-fire.
  const again = await scheduler.runDue(new Date("2026-06-15T09:00:00"));
  assert.equal(again.length, 0, "does not re-run within the same minute");
  ok("runDue guards against double-firing in the same minute");

  // A failing runner is reported, not thrown.
  const failing = createScheduler({
    routines: [{ name: "boom", schedule: "* * * * *", task: "x" }],
    runner: async () => { throw new Error("kaboom"); },
  });
  const r = await failing.runDue(new Date("2026-06-15T09:00:00"));
  assert.equal(r[0].ok, false);
  assert.match(r[0].error, /kaboom/);
  ok("runDue captures runner errors without throwing");

  // Validation
  assert.throws(
    () => createScheduler({ routines: [{ schedule: "* * * * *", task: "x" }], runner }),
    /needs a name/
  );
  assert.throws(() => createScheduler({ routines: [], runner: null }), /runner function is required/);
  ok("scheduler validates routines and runner");
}

console.log(`\nAll ${passed} routines tests passed.`);
