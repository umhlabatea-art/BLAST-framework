/**
 * Routine scheduler — runs tasks on cron schedules ("24/7 agents").
 *
 * A routine is: { name, schedule (cron), task, enabled?, tags? }.
 *
 * The scheduler is built around an injectable `runner(routine) -> result` so it
 * can be tested without an LLM, and a `now()` clock so time is deterministic in
 * tests. `tick(date)` runs everything due at that minute; `start()` wires a
 * real once-a-minute interval.
 */
import { parseCron, cronMatches, nextRun } from "./cron.js";

export function createScheduler({ routines = [], runner, now = () => new Date() } = {}) {
  if (typeof runner !== "function") throw new Error("runner function is required");

  // Validate + pre-parse schedules up front so a bad cron fails fast.
  const compiled = routines.map((r) => {
    if (!r.name) throw new Error("each routine needs a name");
    if (!r.task) throw new Error(`routine "${r.name}" needs a task`);
    return { ...r, enabled: r.enabled !== false, parsed: parseCron(r.schedule) };
  });

  // Guard against double-firing within the same minute.
  const lastRunMinute = new Map();
  const minuteKey = (d) => Math.floor(d.getTime() / 60000);

  function dueRoutines(date = now()) {
    return compiled.filter((r) => r.enabled && cronMatches(r.parsed, date));
  }

  async function runDue(date = now()) {
    const results = [];
    for (const routine of dueRoutines(date)) {
      const key = `${routine.name}@${minuteKey(date)}`;
      if (lastRunMinute.get(routine.name) === minuteKey(date)) continue; // already ran this minute
      lastRunMinute.set(routine.name, minuteKey(date));
      try {
        const result = await runner(routine);
        results.push({ name: routine.name, ok: true, result });
      } catch (err) {
        results.push({ name: routine.name, ok: false, error: err.message });
      }
    }
    return results;
  }

  let timer = null;
  return {
    dueRoutines,
    runDue,
    /** Next scheduled run across all enabled routines. */
    nextRunAt(from = now()) {
      const times = compiled
        .filter((r) => r.enabled)
        .map((r) => nextRun(r.parsed, from))
        .filter(Boolean);
      return times.length ? new Date(Math.min(...times.map((t) => t.getTime()))) : null;
    },
    list() {
      return compiled.map((r) => ({
        name: r.name,
        schedule: r.parsed.source,
        enabled: r.enabled,
        task: r.task,
      }));
    },
    start({ intervalMs = 60000 } = {}) {
      if (timer) return;
      timer = setInterval(() => {
        runDue(now()).catch((err) => console.error("[routines] tick error:", err.message));
      }, intervalMs);
      if (typeof timer.unref === "function") timer.unref();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
