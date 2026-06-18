/**
 * Export leads to Instantly (outbound email tool) — curriculum 7.2.
 *
 * Injectable HTTP client for offline testing. In live mode (INSTANTLY_API_KEY
 * set, or a client injected) it POSTs leads to a campaign. In stub mode it
 * returns the mapped payload so the whole pipeline is runnable without a key.
 *
 * Leads without an email are skipped (Instantly is email-based) and reported.
 */

function makeHttpClient({ apiKey, baseUrl }) {
  return {
    async addLeads(campaignId, leads) {
      const res = await fetch(`${baseUrl}/lead/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, campaign_id: campaignId, leads }),
      });
      if (!res.ok) throw new Error(`instantly ${res.status}: ${await res.text()}`);
      return res.json();
    },
  };
}

export function toInstantlyLead(lead, enrichment = {}) {
  const [first, ...rest] = (lead.name || "").trim().split(/\s+/);
  return {
    email: lead.email,
    first_name: first || "",
    last_name: rest.join(" "),
    company_name: (lead.company || "").trim() || enrichment.companyGuess || "",
    custom_variables: {
      source: lead.source || "",
      score: enrichment.score ?? null,
      status: lead.status || "",
    },
  };
}

export async function createInstantlyExporter(opts = {}) {
  const apiKey = opts.apiKey ?? process.env.INSTANTLY_API_KEY;
  const baseUrl = opts.baseUrl ?? process.env.INSTANTLY_BASE_URL ?? "https://api.instantly.ai/api/v1";
  const client = opts.client ?? (apiKey ? makeHttpClient({ apiKey, baseUrl }) : null);
  const mode = client ? "live" : "stub";

  /**
   * @param {string} campaignId
   * @param {object[]} leads
   * @param {Record<string, object>} [enrichments] keyed by lead id
   */
  async function exportLeads(campaignId, leads, enrichments = {}) {
    if (!campaignId) throw new Error("campaignId is required");
    const withEmail = leads.filter((l) => l.email);
    const skipped = leads.length - withEmail.length;
    const payload = withEmail.map((l) => toInstantlyLead(l, enrichments[l.id]));

    if (mode === "live") {
      const response = await client.addLeads(campaignId, payload);
      return { mode: "live", campaignId, exported: payload.length, skipped, response };
    }
    return { mode: "stub", campaignId, exported: payload.length, skipped, leads: payload };
  }

  return { mode, exportLeads, toInstantlyLead };
}
