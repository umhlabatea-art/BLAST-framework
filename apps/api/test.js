/**
 * End-to-end tests for the Umhlabatea API, run in-process against the Express
 * app (no port binding, no external services). Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import { createApp } from "./src/app.js";

const app = createApp();
const server = app.listen(0);
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

async function api(method, pathname, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (raw !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = raw;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${base}${pathname}`, { method, headers, body: payload });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

try {
  // --- health ---
  {
    const r = await api("GET", "/health");
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
    assert.equal(r.json.paymentsMode, "stub");
    ok("health reports stub payments mode");
  }

  // --- register validation ---
  {
    const bad = await api("POST", "/api/auth/register", { body: { email: "x", password: "short" } });
    assert.equal(bad.status, 400);
    ok("register rejects invalid email/password");
  }

  // --- register + token ---
  let token;
  {
    const r = await api("POST", "/api/auth/register", {
      body: { email: "Dev@Umhlabatea.io", password: "supersecret1" },
    });
    assert.equal(r.status, 201);
    assert.ok(r.json.token, "token issued");
    assert.equal(r.json.user.email, "dev@umhlabatea.io", "email normalized");
    assert.equal(r.json.user.tier, "free", "defaults to free tier");
    token = r.json.token;
    ok("register creates user and issues token");
  }

  // --- duplicate register ---
  {
    const r = await api("POST", "/api/auth/register", {
      body: { email: "dev@umhlabatea.io", password: "supersecret1" },
    });
    assert.equal(r.status, 409);
    ok("duplicate registration rejected");
  }

  // --- protected route without token ---
  {
    const r = await api("GET", "/api/auth/me");
    assert.equal(r.status, 401);
    ok("protected route blocks anonymous access");
  }

  // --- protected route with token ---
  {
    const r = await api("GET", "/api/auth/me", { token });
    assert.equal(r.status, 200);
    assert.equal(r.json.user.email, "dev@umhlabatea.io");
    ok("protected route works with valid token");
  }

  // --- login wrong password ---
  {
    const r = await api("POST", "/api/auth/login", {
      body: { email: "dev@umhlabatea.io", password: "wrongpass1" },
    });
    assert.equal(r.status, 401);
    ok("login rejects wrong password");
  }

  // --- checkout (stub) + webhook -> paid ---
  {
    const checkout = await api("POST", "/api/checkout", { token, body: { priceCents: 11100, productName: "Artist Pro" } });
    assert.equal(checkout.status, 200);
    assert.equal(checkout.json.mode, "stub");
    assert.match(checkout.json.id, /^cs_stub_/);
    ok("checkout creates a stub session");

    const before = await api("GET", "/api/payments", { token });
    assert.equal(before.json.payments[0].status, "pending");

    const webhook = await api("POST", "/api/webhook", {
      raw: JSON.stringify({ type: "checkout.session.completed", data: { object: { id: checkout.json.id } } }),
    });
    assert.equal(webhook.status, 200);
    assert.equal(webhook.json.received, true);
    ok("webhook accepts completed event");

    const after = await api("GET", "/api/payments", { token });
    assert.equal(after.json.payments[0].status, "paid");
    ok("payment marked paid after webhook");
  }

  // --- invalid checkout amount ---
  {
    const r = await api("POST", "/api/checkout", { token, body: { priceCents: -1 } });
    assert.equal(r.status, 400);
    ok("checkout rejects invalid amount");
  }

  // --- subscriptions tiers (public) ---
  {
    const r = await api("GET", "/api/subscriptions");
    assert.equal(r.status, 200);
    assert.equal(r.json.tiers.length, 3);
    assert.equal(r.json.tiers[1].id, "pro");
    ok("subscriptions lists the three tiers");
  }

  // --- tracks catalogue + detail ---
  {
    const list = await api("GET", "/api/tracks");
    assert.equal(list.status, 200);
    assert.ok(list.json.tracks.length >= 5, "seed catalogue present");
    assert.ok(list.json.tracks[list.json.tracks.length - 1].artistName, "tracks carry artist name");

    const detail = await api("GET", "/api/tracks/trk_sunrise");
    assert.equal(detail.status, 200);
    assert.equal(detail.json.track.title, "African Sunrise");
    ok("tracks list + detail work off the seed catalogue");

    const missing = await api("GET", "/api/tracks/nope");
    assert.equal(missing.status, 404);
    ok("unknown track returns 404");
  }

  // --- AI generation (auth) ---
  let generatedId;
  {
    const anon = await api("POST", "/api/generate", { body: { prompt: "amapiano groove" } });
    assert.equal(anon.status, 401);

    const r = await api("POST", "/api/generate", { token, body: { prompt: "deep amapiano log drum groove", genre: "amapiano" } });
    assert.equal(r.status, 201);
    assert.ok(r.json.track.id.startsWith("gen_"), "generated id");
    assert.equal(r.json.track.genre, "Amapiano");
    assert.ok(r.json.track.audioUrl.startsWith("data:audio"), "playable audio");
    generatedId = r.json.track.id;
    ok("generate creates and stores a track for the artist");

    const inList = await api("GET", "/api/tracks");
    assert.ok(inList.json.tracks.some((t) => t.id === generatedId), "generated track appears in catalogue");
    ok("generated track appears in the catalogue");

    const empty = await api("POST", "/api/generate", { token, body: { prompt: "" } });
    assert.equal(empty.status, 400);
    ok("generate rejects empty prompt");
  }

  // --- community feed ---
  {
    const before = await api("GET", "/api/community");
    assert.ok(before.json.posts.length >= 3, "seed posts present");

    const created = await api("POST", "/api/community", { token, body: { body: "Open jam this Friday!", tag: "event" } });
    assert.equal(created.status, 201);
    assert.equal(created.json.post.body, "Open jam this Friday!");

    const bad = await api("POST", "/api/community", { token, body: { body: "  " } });
    assert.equal(bad.status, 400);
    ok("community feed lists seeds and accepts new posts");
  }

  // --- compliance workflow ---
  {
    const create = await api("POST", "/api/compliance", { token, body: { bodyId: "samro", trackId: generatedId } });
    assert.equal(create.status, 201);
    assert.equal(create.json.registration.state, "draft");
    const regId = create.json.registration.id;

    const adv = await api("POST", `/api/compliance/${regId}/advance`, { token, body: { artistName: "You" } });
    assert.equal(adv.status, 200);
    assert.equal(adv.json.registration.state, "prepared");
    assert.ok(adv.json.registration.payload, "prepared payload generated");

    const bad = await api("POST", "/api/compliance", { token, body: { bodyId: "bogus", trackId: generatedId } });
    assert.equal(bad.status, 400);
    ok("compliance creates and advances a SAMRO registration");
  }

  // --- revenue summary ---
  {
    const r = await api("GET", "/api/revenue", { token });
    assert.equal(r.status, 200);
    // The R111.00 subscription payment above is marked paid → counts as a sale.
    assert.equal(r.json.summary.salesCount, 1);
    assert.equal(r.json.summary.artistEarningsRands, 88.8, "80% of R111");
    assert.ok(Array.isArray(r.json.programs));
    ok("revenue summarises the artist's 80% earnings");
  }

  // --- SEO/AEO agent ---
  {
    const r = await api("POST", "/api/agents/seo", { body: { trackId: "trk_sunrise" } });
    assert.equal(r.status, 200);
    assert.ok(r.json.seo.description.length <= 160);
    assert.equal(r.json.seo.jsonLd["@type"], "MusicRecording");
    ok("SEO agent returns bounded metadata + JSON-LD");
  }

  // --- agent tasks (shared with the mobile app) ---
  {
    const empty = await api("GET", "/api/agents/tasks");
    assert.equal(empty.status, 200);
    assert.equal(empty.json.tasks.length, 0, "no tasks initially");

    const bad = await api("POST", "/api/agents/tasks", { body: { title: "  " } });
    assert.equal(bad.status, 400);

    const created = await api("POST", "/api/agents/tasks", {
      body: { title: "Register Ubuntu Rising with SAMRO", source: "recorder" },
    });
    assert.equal(created.status, 201);
    assert.equal(created.json.task.agent, "legal", "SAMRO routes to the legal agent");
    assert.equal(created.json.task.status, "open");
    assert.equal(created.json.task.source, "recorder");
    const taskId = created.json.task.id;

    const mix = await api("POST", "/api/agents/tasks", { body: { title: "Mix and master the log drum" } });
    assert.equal(mix.json.task.agent, "mixing", "mix/master routes to the mixing agent");

    const list = await api("GET", "/api/agents/tasks");
    assert.equal(list.json.tasks.length, 2, "tasks are listed for the mobile app to read");

    const done = await api("POST", `/api/agents/tasks/${taskId}/done`);
    assert.equal(done.status, 200);
    assert.equal(done.json.task.status, "done");

    const missing = await api("POST", "/api/agents/tasks/nope/done");
    assert.equal(missing.status, 404);
    ok("agent tasks create, route to an agent, list, and complete");
  }

  console.log(`\nAll ${passed} API tests passed.`);
} finally {
  server.close();
}
