/**
 * Agent-task helpers. An AgentTask is an actionable item routed to one of the
 * embedded agents. Kept here so the API, the mobile app, and the Studio Hub all
 * agree on how an action item maps to an agent.
 */

export const AGENT_IDS = ["crm", "seo", "marketing", "mixing", "visual", "legal"];

// Keyword → agent routing, most-specific first. Used to turn a free-text action
// item (e.g. from meeting minutes) into the agent best suited to own it.
const ROUTES = [
  { agent: "legal", re: /\b(samro|capasso|risa|register|registration|contract|split|isrc|licen[cs]e|copyright|rights|compl(y|iance)|popia)\b/i },
  { agent: "mixing", re: /\b(mix|master|eq|level|gain|bounce|stem|mixdown|loud(ness)?|lufs)\b/i },
  { agent: "visual", re: /\b(art(work)?|cover|visual|video|4k|image|thumbnail|poster)\b/i },
  { agent: "marketing", re: /\b(promot|campaign|market|post|social|release|launch|schedule|ad|announc)\b/i },
  { agent: "crm", re: /\b(fan|lead|prospect|email|contact|follow[- ]?up|superfan|audience|crm)\b/i },
  { agent: "seo", re: /\b(seo|aeo|keyword|metadata|tag|discover|search|optimi[sz]e|title)\b/i },
];

/** Route an action-item string to the most relevant agent id. Defaults to crm. */
export function routeAgent(text) {
  const s = String(text || "");
  for (const { agent, re } of ROUTES) if (re.test(s)) return agent;
  return "crm";
}
