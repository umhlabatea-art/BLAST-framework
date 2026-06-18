/**
 * Lead enrichment (offline, deterministic).
 *
 * Derives useful attributes from the raw lead so the pipeline can prioritize
 * and route leads without an external data provider:
 *   - email domain + business-vs-free classification
 *   - a company guess (when none was supplied)
 *   - a 0-100 lead score
 *   - descriptive tags
 *
 * A real enrichment provider can be layered on later; this gives a sensible,
 * test-stable baseline that runs anywhere.
 */

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

function titleCase(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function enrichLead(lead = {}) {
  const email = (lead.email || "").toLowerCase().trim();
  const domain = email.includes("@") ? email.split("@")[1] : "";
  const isBusiness = Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);

  const companyGuess =
    (lead.company || "").trim() ||
    (isBusiness ? titleCase(domain.split(".")[0]) : "");

  let score = 0;
  if (email) score += 30;
  if (isBusiness) score += 40;
  if ((lead.company || "").trim()) score += 15;
  if (lead.source && lead.source !== "manual") score += 15;
  score = Math.min(100, score);

  const tags = [];
  if (isBusiness) tags.push("business-email");
  else if (domain) tags.push("free-email");
  else tags.push("no-email");
  if (score >= 70) tags.push("hot");
  else if (score >= 40) tags.push("warm");
  else tags.push("cold");

  return { domain, isBusiness, companyGuess, score, tags };
}
