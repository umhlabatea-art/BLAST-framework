#!/usr/bin/env node
/**
 * Enrich all leads and export them to an Instantly campaign.
 *
 *   INSTANTLY_API_KEY=... node crm/enrich-export-cli.js <campaignId>
 *
 * Without an API key it runs in stub mode (prints the mapped payload) so the
 * full pipeline can be rehearsed offline.
 */
import { buildStore } from "../src/backend/build-store.js";
import { enrichLead } from "./enrich.js";
import { createInstantlyExporter } from "./instantly.js";

async function main() {
  const campaignId = process.argv[2] || process.env.INSTANTLY_CAMPAIGN;
  if (!campaignId) {
    console.error("Usage: node crm/enrich-export-cli.js <campaignId>  (or set INSTANTLY_CAMPAIGN)");
    process.exit(2);
  }

  const store = await buildStore(process.env, { log: (m) => console.error(`[crm] ${m}`) });
  const leads = await store.listAllLeads();
  const enrichments = {};
  for (const lead of leads) enrichments[lead.id] = enrichLead(lead);

  const exporter = await createInstantlyExporter();
  const result = await exporter.exportLeads(campaignId, leads, enrichments);

  console.log(
    `[crm] instantly export (${result.mode}): exported ${result.exported}, skipped ${result.skipped} -> campaign ${campaignId}`
  );
  if (result.mode === "stub") {
    console.log(JSON.stringify(result.leads, null, 2));
  }
}

main().catch((err) => {
  console.error("[crm] export error:", err.message);
  process.exit(1);
});
