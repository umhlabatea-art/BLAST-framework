#!/usr/bin/env node
/**
 * Morning follow-up digest. Scans all leads, finds overdue follow-ups, prints a
 * summary, and (when MEMORY_VAULT is set) writes a "Next Actions" note to the
 * vault under `crm/`. Wire to system cron, e.g.:
 *
 *   0 8 * * 1-5  cd /repo && MEMORY_VAULT=~/vault node crm/digest-cli.js
 */
import { buildStore } from "../src/backend/build-store.js";
import { writeNote } from "../memory/ingest.js";
import { buildFollowUpDigest } from "./followup-digest.js";

async function main() {
  const store = await buildStore(process.env, { log: (m) => console.error(`[crm] ${m}`) });
  const leads = await store.listAllLeads();
  const { items, markdown } = buildFollowUpDigest(leads);

  console.log(`[crm] ${items.length} lead(s) need follow-up of ${leads.length} total`);
  console.log(markdown);

  const vault = process.env.MEMORY_VAULT || process.env.OBSIDIAN_VAULT;
  if (vault) {
    const saved = await writeNote({
      vaultPath: vault,
      subdir: "crm",
      title: `Next Actions ${new Date().toISOString().slice(0, 10)}`,
      tags: ["crm", "followups", "digest"],
      frontmatter: { overdue: items.length, total: leads.length },
      body: markdown,
    });
    console.error(`[crm] wrote digest note: ${saved.id}`);
  }
}

main().catch((err) => {
  console.error("[crm] digest error:", err.message);
  process.exit(1);
});
