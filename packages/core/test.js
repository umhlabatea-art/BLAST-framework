/**
 * Unit tests for @umhlabatea/core. Pure functions, no network — runs anywhere.
 * Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import { seoAeo } from "./agents/seo.js";
import { createRegistration, advance, STATES } from "./agents/compliance.js";
import { splitSale, summarize, affiliateEarning } from "./agents/revenue.js";
import { generate, generateJob } from "./agents/musicgen.js";
import { routeAgent } from "./agents/tasks.js";
import { TRACKS, trackWithArtist, liveSalesFeed, AFFILIATE_PROGRAMS } from "./mock/index.js";
import { revenueConfig } from "./theme/index.js";

let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

const sampleTrack = trackWithArtist(TRACKS[3]); // African Sunrise (Amapiano)

// --- SEO/AEO ---
{
  const seo = seoAeo(sampleTrack);
  assert.ok(seo.description.length <= 160, "description within 160 chars");
  assert.equal(seo.keywords.length, 10, "exactly 10 keywords");
  assert.equal(new Set(seo.keywords).size, 10, "keywords are unique");
  assert.equal(seo.jsonLd["@type"], "MusicRecording");
  assert.equal(seo.jsonLd.byArtist.name, sampleTrack.artistName);
  assert.ok(seo.jsonLd.offers.priceCurrency === "ZAR");
  assert.ok(seo.voiceSearch.length >= 3, "voice-search phrases present");
  ok("seoAeo produces bounded description + valid MusicRecording JSON-LD");
}

// --- Compliance state machine ---
{
  let reg = createRegistration("samro", sampleTrack);
  assert.equal(reg.state, "draft");
  reg = advance(reg, { track: sampleTrack, artistName: "DJ Khanyisa", writers: [{ name: "DJ Khanyisa", share: 100 }] });
  assert.equal(reg.state, "prepared");
  assert.equal(reg.payload.totalShare, 100, "writer shares sum to 100");
  reg = advance(reg);
  assert.equal(reg.state, "submitted");
  reg = advance(reg);
  assert.equal(reg.state, "registered");
  const terminal = advance(reg); // no-op at terminal state
  assert.equal(terminal.state, "registered");
  assert.equal(reg.history.length, STATES.length);
  ok("compliance advances draft→prepared→submitted→registered and stops");

  // RISA issues a well-formed ISRC.
  let risa = createRegistration("risa", sampleTrack);
  risa = advance(risa, { track: sampleTrack });
  assert.match(risa.payload.isrc, /^ZA-U01-\d{2}-\d{5}$/, "ISRC format");
  ok("RISA registration emits a valid ISRC");

  assert.throws(() => createRegistration("bogus", sampleTrack), /Unknown rights body/);
  ok("unknown rights body rejected");
}

// --- Revenue 80/20 ---
{
  const split = splitSale(100, 0);
  assert.equal(split.artistShare, 80, "artist gets 80");
  assert.equal(split.platformShare, 20, "platform gets 20");
  assert.equal(split.artistShare + split.platformShare, split.gross, "shares reconcile to gross");

  const now = 1_000_000_000_000;
  const cleared = { amountRands: 100, createdAtMs: now - (revenueConfig.payoutDelayHours + 1) * 3600 * 1000 };
  const fresh = { amountRands: 50, createdAtMs: now };
  const sum = summarize([cleared, fresh], now);
  assert.equal(sum.salesCount, 2);
  assert.equal(sum.artistEarningsRands, 120, "80 + 40");
  assert.equal(sum.paidOutRands, 80, "only the cleared sale paid out");
  assert.equal(sum.pendingRands, 40, "fresh sale still pending");
  ok("revenue split + summarize compute 80/20 and payout windows");

  const aff = affiliateEarning(AFFILIATE_PROGRAMS[0], 200);
  assert.equal(aff.earnedRands, 30, "15% of 200");
  ok("affiliate earning computes commission");

  assert.throws(() => splitSale(0), /positive number/);
  ok("splitSale rejects non-positive amounts");
}

// --- Music generation determinism ---
{
  const a = await generate("deep amapiano log drum groove", { genre: "amapiano" });
  const b = await generate("deep amapiano log drum groove", { genre: "amapiano" });
  assert.equal(a.id, b.id, "same prompt+params → same id");
  assert.equal(a.title, b.title, "deterministic title");
  assert.equal(a.durationSec, b.durationSec, "deterministic duration");
  assert.equal(a.genre, "Amapiano");
  assert.ok(a.bpm >= 113 && a.bpm <= 120, "amapiano bpm in range");
  assert.ok(a.audioUrl && a.audioUrl.startsWith("data:audio"), "playable audio url");

  const c = await generate("bright afrobeat horns", { genre: "afrobeat" });
  assert.notEqual(a.id, c.id, "different inputs → different id");
  ok("musicGen is deterministic and genre-aware");

  await assert.rejects(() => generate(""), /prompt is required/);
  ok("musicGen rejects empty prompt");
}

// --- Async job wrapper ---
{
  const steps = [];
  const track = await generateJob("sunset neo-soul", { genre: "neo-soul" }, (p) => steps.push(p.step));
  assert.deepEqual(steps, ["queued", "composing", "arranging", "mixing", "complete"]);
  assert.ok(track.id.startsWith("gen_"));
  ok("generateJob reports progress and resolves a track");
}

// --- Live feed determinism ---
{
  const f1 = liveSalesFeed(6, "seed-x");
  const f2 = liveSalesFeed(6, "seed-x");
  assert.deepEqual(f1, f2, "same seed → same feed");
  assert.equal(f1.length, 6);
  ok("liveSalesFeed is deterministic");
}

// --- Agent-task routing ---
{
  assert.equal(routeAgent("Register Ubuntu Rising with SAMRO"), "legal");
  assert.equal(routeAgent("Mix and master the log drum"), "mixing");
  assert.equal(routeAgent("Design 4K cover artwork"), "visual");
  assert.equal(routeAgent("Schedule the launch campaign"), "marketing");
  assert.equal(routeAgent("Optimise the track metadata for search"), "seo");
  assert.equal(routeAgent("Follow up with the superfans"), "crm");
  assert.equal(routeAgent("something unrelated"), "crm", "defaults to crm");
  ok("routeAgent maps action items to the right agent");
}

console.log(`\nAll ${passed} core tests passed.`);
