/**
 * CRM -> routines bridge: scan leads, find overdue follow-ups, and render a
 * "Next Actions" digest (Markdown) suitable for writing to the vault each
 * morning.
 *
 * "Overdue" uses the lead's follow-up cadence (days after creation). The
 * recommended action is the most recent cadence milestone that has passed, for
 * active leads only (terminal won/lost are skipped).
 */
import { computeFollowUps } from "../src/backend/leads.js";

export function buildFollowUpDigest(leads, { now = new Date(), cadenceDays } = {}) {
  const items = [];
  for (const lead of leads) {
    if (lead.status === "won" || lead.status === "lost") continue;
    const opts = cadenceDays ? { now, cadenceDays } : { now };
    const { schedule } = computeFollowUps(lead, opts);
    const overdue = schedule.filter((s) => s.overdue);
    if (overdue.length === 0) continue;
    const action = overdue[overdue.length - 1]; // latest passed milestone
    items.push({
      id: lead.id,
      name: lead.name,
      email: lead.email || "",
      status: lead.status,
      step: action.step,
      dueAt: action.dueAt,
    });
  }
  items.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return { items, markdown: renderMarkdown(items, now) };
}

function renderMarkdown(items, now) {
  const date = now.toISOString().slice(0, 10);
  const lines = [`# Next Actions — ${date}`, ""];
  if (items.length === 0) {
    lines.push("No overdue follow-ups. 🎉");
    return lines.join("\n");
  }
  lines.push(`${items.length} lead(s) need follow-up:`, "");
  for (const it of items) {
    const due = it.dueAt.slice(0, 10);
    const who = it.email ? `${it.name} <${it.email}>` : it.name;
    lines.push(`- **${who}** — _${it.status}_ — step ${it.step} due ${due}`);
  }
  return lines.join("\n");
}
