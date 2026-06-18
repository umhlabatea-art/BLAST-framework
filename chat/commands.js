/**
 * Transport-agnostic chat command router.
 *
 * Parses chat messages into commands and dispatches to Hermes and the CRM. It
 * is deliberately independent of Slack/Discord so it can be unit-tested with a
 * mock runner + in-memory store, and reused by any adapter.
 *
 * Commands (default prefix `!`):
 *   !help
 *   !hermes <task>                 run a Hermes task (result saved to the vault)
 *   !leads [status]                list leads (optional status filter)
 *   !lead add <name> | <email> | <company>
 *   !lead status <id> <status>     transition a lead
 *   !followups                     overdue follow-ups digest
 *
 * handle(text) -> { text, thread? }  (null if the message isn't a command)
 */
import { normalizeLeadInput, canTransition, isValidStatus } from "../src/backend/leads.js";
import { buildFollowUpDigest } from "../crm/followup-digest.js";

const MAX_CODE = 1200;

function formatLead(l) {
  const email = l.email ? ` <${l.email}>` : "";
  const company = l.company ? ` @ ${l.company}` : "";
  return `• [${l.status}] ${l.name}${email}${company}  (id: ${l.id})`;
}

export function createCommandRouter({ runner, store, ownerId = "chat", prefix = "!" } = {}) {
  if (typeof runner !== "function") throw new Error("runner function is required");
  if (!store) throw new Error("store is required");

  const help = [
    "Umhlawati bot commands:",
    "`!hermes <task>` — run a Hermes task (saved to the vault)",
    "`!leads [status]` — list leads",
    "`!lead add <name> | <email> | <company>` — create a lead",
    "`!lead status <id> <new-status>` — move a lead",
    "`!followups` — overdue follow-ups",
    "`!help` — this message",
  ].join("\n");

  async function handle(text) {
    const trimmed = (text || "").trim();
    if (!trimmed.startsWith(prefix)) return null; // not a command for us
    const bodyText = trimmed.slice(prefix.length).trim();
    const cmd = bodyText.split(/\s+/)[0]?.toLowerCase() || "";
    const argline = bodyText.slice(cmd.length).trim();

    try {
      if (cmd === "help" || cmd === "") return { text: help };

      if (cmd === "hermes") {
        if (!argline) return { text: "Usage: `!hermes <task>`" };
        const result = await runner(argline);
        const code = (result.code || "").slice(0, MAX_CODE);
        const noteLine = result.note ? `\n📝 saved: ${result.note}` : "";
        return {
          thread: true,
          text:
            `**Hermes** — ${result.passed ? "✅ passed" : "⚠️ stopped"} ` +
            `(${result.iterations ?? "?"} iteration(s))\n` +
            `${result.summary || ""}${noteLine}\n\`\`\`\n${code}\n\`\`\``,
        };
      }

      if (cmd === "leads") {
        const status = argline ? argline.split(/\s+/)[0] : undefined;
        if (status && !isValidStatus(status)) return { text: `Unknown status: ${status}` };
        const leads = await store.listLeads(ownerId, { status });
        if (leads.length === 0) return { text: "No leads yet." };
        return { text: `${leads.length} lead(s):\n${leads.map(formatLead).join("\n")}` };
      }

      if (cmd === "lead") {
        const sub = argline.split(/\s+/)[0]?.toLowerCase();
        const subArgs = argline.slice(sub?.length || 0).trim();

        if (sub === "add") {
          const [name, email, company] = subArgs.split("|").map((s) => s.trim());
          const fields = normalizeLeadInput({ name, email, company, source: "chat" });
          const lead = await store.createLead({ ownerId, ...fields });
          return { text: `Created lead ${lead.name} (id: ${lead.id}, status: ${lead.status}).` };
        }

        if (sub === "status") {
          const [id, status] = subArgs.split(/\s+/);
          if (!id || !status) return { text: "Usage: `!lead status <id> <new-status>`" };
          const lead = await store.findLeadById(id);
          if (!lead || lead.ownerId !== ownerId) return { text: `Lead not found: ${id}` };
          if (!canTransition(lead.status, status)) {
            return { text: `Cannot move ${lead.name} from ${lead.status} to ${status}.` };
          }
          const updated = await store.updateLead(id, { status });
          return { text: `Moved ${updated.name} to ${updated.status}.` };
        }

        return { text: "Usage: `!lead add <name> | <email> | <company>` or `!lead status <id> <status>`" };
      }

      if (cmd === "followups") {
        const leads = await store.listLeads(ownerId);
        const { items, markdown } = buildFollowUpDigest(leads);
        return { text: items.length ? markdown : "No overdue follow-ups. 🎉" };
      }

      return { text: `Unknown command \`${cmd}\`. Try \`!help\`.` };
    } catch (err) {
      return { text: `⚠️ ${err.message}` };
    }
  }

  return { handle, help };
}
