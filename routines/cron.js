/**
 * Minimal 5-field cron engine (no dependencies).
 *
 *   ┌ minute (0-59)
 *   │ ┌ hour (0-23)
 *   │ │ ┌ day of month (1-31)
 *   │ │ │ ┌ month (1-12)
 *   │ │ │ │ ┌ day of week (0-6, Sunday = 0)
 *   * * * * *
 *
 * Each field supports: `*`, a number, lists `a,b`, ranges `a-b`, and steps
 * `*\/n` or `a-b/n`. Enough to express the schedules routines need.
 */

const FIELD_RANGES = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // day of month
  [1, 12], // month
  [0, 6], // day of week
];

function parseField(field, [min, max]) {
  const allowed = new Set();
  for (const part of field.split(",")) {
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart ? Number(stepPart) : 1;
    if (!Number.isInteger(step) || step < 1) {
      throw new Error(`Invalid step in cron field: "${part}"`);
    }

    let lo;
    let hi;
    if (rangePart === "*") {
      lo = min;
      hi = max;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-").map(Number);
      lo = a;
      hi = b;
    } else {
      lo = Number(rangePart);
      hi = lo;
    }

    if (!Number.isInteger(lo) || !Number.isInteger(hi) || lo < min || hi > max || lo > hi) {
      throw new Error(`Invalid cron field value: "${part}" (allowed ${min}-${max})`);
    }
    for (let v = lo; v <= hi; v += step) allowed.add(v);
  }
  return allowed;
}

export function parseCron(expr) {
  if (typeof expr !== "string") throw new Error("cron expression must be a string");
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`cron expression must have 5 fields, got ${fields.length}: "${expr}"`);
  }
  return {
    minute: parseField(fields[0], FIELD_RANGES[0]),
    hour: parseField(fields[1], FIELD_RANGES[1]),
    dayOfMonth: parseField(fields[2], FIELD_RANGES[2]),
    month: parseField(fields[3], FIELD_RANGES[3]),
    dayOfWeek: parseField(fields[4], FIELD_RANGES[4]),
    source: expr.trim(),
  };
}

/**
 * Does `date` satisfy the cron expression? Standard cron semantics: when both
 * day-of-month and day-of-week are restricted (not `*`), a match on EITHER is
 * sufficient.
 */
export function cronMatches(parsed, date) {
  const fields = typeof parsed === "string" ? parseCron(parsed) : parsed;
  const minuteOk = fields.minute.has(date.getMinutes());
  const hourOk = fields.hour.has(date.getHours());
  const monthOk = fields.month.has(date.getMonth() + 1);
  if (!minuteOk || !hourOk || !monthOk) return false;

  const domRestricted = fields.dayOfMonth.size !== 31;
  const dowRestricted = fields.dayOfWeek.size !== 7;
  const domOk = fields.dayOfMonth.has(date.getDate());
  const dowOk = fields.dayOfWeek.has(date.getDay());

  if (domRestricted && dowRestricted) return domOk || dowOk;
  if (domRestricted) return domOk;
  if (dowRestricted) return dowOk;
  return true;
}

/**
 * Next minute (strictly after `from`) at which the expression matches.
 * Scans minute-by-minute up to a bounded horizon (~4 years) to stay simple.
 */
export function nextRun(parsed, from = new Date()) {
  const fields = typeof parsed === "string" ? parseCron(parsed) : parsed;
  const d = new Date(from.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const horizon = 60 * 24 * 366 * 4; // minutes in ~4 years
  for (let i = 0; i < horizon; i++) {
    if (cronMatches(fields, d)) return d;
    d.setMinutes(d.getMinutes() + 1);
  }
  return null; // unreachable schedule (e.g. Feb 30)
}
