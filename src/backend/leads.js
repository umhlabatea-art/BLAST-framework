/**
 * CRM lead domain logic (pure, store-agnostic).
 *
 * - Lead lifecycle + allowed status transitions.
 * - A simple, deterministic follow-up cadence so the UI/agent can answer
 *   "when should I next contact this lead?" without external scheduling.
 */

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"];

// Allowed transitions. `won` and `lost` are terminal.
const TRANSITIONS = {
  new: ["contacted", "qualified", "lost"],
  contacted: ["qualified", "won", "lost"],
  qualified: ["won", "lost", "contacted"],
  won: [],
  lost: [],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidStatus(status) {
  return LEAD_STATUSES.includes(status);
}

export function canTransition(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  if (from === to) return true; // idempotent
  return (TRANSITIONS[from] || []).includes(to);
}

/**
 * Validate + normalize incoming lead fields. Throws on invalid input.
 * `email` is optional (scraped leads sometimes lack one) but validated if present.
 */
export function normalizeLeadInput(input = {}) {
  const name = (input.name || "").trim();
  if (!name) throw new Error("lead name is required");
  const email = (input.email || "").trim().toLowerCase();
  if (email && !EMAIL_RE.test(email)) throw new Error("lead email is invalid");
  const status = input.status || "new";
  if (!isValidStatus(status)) throw new Error(`invalid status: ${input.status}`);
  return {
    name,
    email,
    company: (input.company || "").trim(),
    source: (input.source || "manual").trim(),
    status,
  };
}

/**
 * Compute the follow-up schedule for a lead from its creation date and a
 * cadence (days after creation). Terminal leads (won/lost) have none.
 *
 * @returns {{ schedule: Array<{ step, dueAt, overdue }>, next: object|null }}
 */
export function computeFollowUps(lead, { cadenceDays = [0, 3, 7, 14], now = new Date() } = {}) {
  if (lead.status === "won" || lead.status === "lost") {
    return { schedule: [], next: null };
  }
  const created = new Date(lead.createdAt).getTime();
  const nowMs = now.getTime();
  const schedule = cadenceDays.map((days, i) => {
    const dueAt = new Date(created + days * 86400000);
    return { step: i + 1, dueAt: dueAt.toISOString(), overdue: dueAt.getTime() <= nowMs };
  });
  // "next" = the earliest step that is due now or in the future, else the last
  // overdue step (so an overdue lead still surfaces an action).
  const upcoming = schedule.find((s) => !s.overdue);
  const next = upcoming || schedule[schedule.length - 1] || null;
  return { schedule, next };
}
