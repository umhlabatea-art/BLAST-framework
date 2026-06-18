/**
 * Offline tests for CRM tooling: enrichment, Instantly export (injected client),
 * and the follow-up digest. No network. Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import { enrichLead } from "./enrich.js";
import { createInstantlyExporter, toInstantlyLead } from "./instantly.js";
import { buildFollowUpDigest } from "./followup-digest.js";

let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

// --- enrichment ----------------------------------------------------------
{
  const biz = enrichLead({ name: "Acme", email: "buyer@acme.io", source: "linkedin" });
  assert.equal(biz.domain, "acme.io");
  assert.equal(biz.isBusiness, true);
  assert.equal(biz.companyGuess, "Acme", "guesses company from business domain");
  assert.ok(biz.score >= 70 && biz.tags.includes("hot"), "business+source scores hot");
  ok("enrichLead classifies a business lead and scores it hot");

  const free = enrichLead({ name: "Jo", email: "jo@gmail.com" });
  assert.equal(free.isBusiness, false);
  assert.ok(free.tags.includes("free-email"));
  assert.ok(free.score < 70, "free email scores lower");
  ok("enrichLead classifies a free-email lead");

  const none = enrichLead({ name: "Anon" });
  assert.ok(none.tags.includes("no-email"));
  assert.equal(none.companyGuess, "");
  ok("enrichLead handles a lead with no email");
}

// --- Instantly export (stub + injected live client) ----------------------
{
  const mapped = toInstantlyLead(
    { name: "Ada Lovelace", email: "ada@calc.io", source: "scrape" },
    { companyGuess: "Calc", score: 85 }
  );
  assert.equal(mapped.first_name, "Ada");
  assert.equal(mapped.last_name, "Lovelace");
  assert.equal(mapped.company_name, "Calc");
  assert.equal(mapped.custom_variables.score, 85);
  ok("toInstantlyLead maps name/company/custom vars");

  const stub = await createInstantlyExporter();
  assert.equal(stub.mode, "stub", "no key -> stub mode");
  const res = await stub.exportLeads("camp-1", [
    { id: "1", name: "A", email: "a@x.io" },
    { id: "2", name: "B" }, // no email -> skipped
  ]);
  assert.equal(res.exported, 1);
  assert.equal(res.skipped, 1);
  ok("stub exporter maps leads and skips those without email");

  await assert.rejects(() => stub.exportLeads("", []), /campaignId is required/);
  ok("export requires a campaign id");

  // Injected "live" client.
  const calls = [];
  const fake = { async addLeads(campaignId, leads) { calls.push({ campaignId, leads }); return { ok: true }; } };
  const live = await createInstantlyExporter({ client: fake });
  assert.equal(live.mode, "live", "injected client -> live mode");
  const liveRes = await live.exportLeads("camp-2", [{ id: "1", name: "A", email: "a@x.io" }]);
  assert.equal(liveRes.exported, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].campaignId, "camp-2");
  ok("live exporter calls the injected client");
}

// --- follow-up digest ----------------------------------------------------
{
  const now = new Date("2026-06-20T08:00:00.000Z");
  const leads = [
    { id: "1", name: "Acme", email: "a@acme.io", status: "contacted", createdAt: "2026-06-10T00:00:00.000Z" }, // old -> overdue
    { id: "2", name: "Fresh", email: "f@new.io", status: "new", createdAt: "2026-06-20T07:00:00.000Z" }, // today -> day0 due
    { id: "3", name: "Closed", email: "c@x.io", status: "won", createdAt: "2026-01-01T00:00:00.000Z" }, // terminal -> skip
  ];
  const { items, markdown } = buildFollowUpDigest(leads, { now });
  const ids = items.map((i) => i.id);
  assert.ok(ids.includes("1"), "old active lead is overdue");
  assert.ok(!ids.includes("3"), "won lead is excluded");
  assert.match(markdown, /# Next Actions/, "renders a digest heading");
  assert.match(markdown, /Acme/, "lists the overdue lead");
  ok("buildFollowUpDigest surfaces overdue active leads and skips terminal ones");

  const empty = buildFollowUpDigest([{ id: "9", name: "X", status: "won", createdAt: now.toISOString() }], { now });
  assert.equal(empty.items.length, 0);
  assert.match(empty.markdown, /No overdue follow-ups/);
  ok("digest renders an all-clear message when nothing is due");
}

console.log(`\nAll ${passed} CRM tests passed.`);
