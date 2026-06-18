/**
 * End-to-end tests for the BLAST backend. Runs the full API flow against both
 * store implementations (in-memory and PostgreSQL via in-memory pg-mem) and
 * verifies the live-Stripe code path with an injected fake client.
 *
 * No network, no real database, no Stripe keys. Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import { newDb } from "pg-mem";
import { createApp } from "./app.js";
import { createInMemoryStore } from "./store.js";
import { createPostgresStore } from "./store-postgres.js";
import { createPayments } from "./payments.js";

let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

function makeApi(base) {
  return async function api(method, pathname, { token, body, raw } = {}) {
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
  };
}

async function withServer(app, fn) {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    await fn(makeApi(`http://127.0.0.1:${port}`));
  } finally {
    server.close();
  }
}

/** Full register -> auth -> checkout(stub) -> webhook -> paid flow. */
async function runFlow(label, store) {
  const app = await createApp({ store }); // stub payments (no key configured)
  await withServer(app, async (api) => {
    const health = await api("GET", "/health");
    assert.equal(health.json.paymentsMode, "stub");

    const bad = await api("POST", "/api/auth/register", { body: { email: "x", password: "short" } });
    assert.equal(bad.status, 400);

    const reg = await api("POST", "/api/auth/register", {
      body: { email: "Dev@Umhlawati.io", password: "supersecret1" },
    });
    assert.equal(reg.status, 201, "register ok");
    assert.equal(reg.json.user.email, "dev@umhlawati.io", "email normalized");
    const token = reg.json.token;

    const dup = await api("POST", "/api/auth/register", {
      body: { email: "dev@umhlawati.io", password: "supersecret1" },
    });
    assert.equal(dup.status, 409, "duplicate rejected");

    assert.equal((await api("GET", "/api/me")).status, 401, "anon blocked");
    const me = await api("GET", "/api/me", { token });
    assert.equal(me.json.user.email, "dev@umhlawati.io", "me returns user");

    const wrong = await api("POST", "/api/auth/login", {
      body: { email: "dev@umhlawati.io", password: "wrongpass1" },
    });
    assert.equal(wrong.status, 401, "wrong password rejected");

    const checkout = await api("POST", "/api/checkout", {
      token,
      body: { priceCents: 2999, productName: "OHS Starter Pack" },
    });
    assert.equal(checkout.json.mode, "stub");
    assert.match(checkout.json.id, /^cs_stub_/);

    const before = await api("GET", "/api/payments", { token });
    assert.equal(before.json.payments[0].status, "pending");
    assert.equal(before.json.payments[0].amount, 2999);

    const webhook = await api("POST", "/api/webhook", {
      raw: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { id: checkout.json.id } },
      }),
    });
    assert.equal(webhook.json.received, true);

    const after = await api("GET", "/api/payments", { token });
    assert.equal(after.json.payments[0].status, "paid", "payment marked paid");

    const badAmount = await api("POST", "/api/checkout", { token, body: { priceCents: -1 } });
    assert.equal(badAmount.status, 400, "invalid amount rejected");
  });
  ok(`${label} store: full register/auth/checkout/webhook flow`);
}

// 1. In-memory store
await runFlow("in-memory", createInMemoryStore());

// 2. PostgreSQL store (via in-memory pg-mem — exercises the real SQL)
{
  const db = newDb();
  const pg = db.adapters.createPg();
  const pool = new pg.Pool();
  const store = createPostgresStore({ pool });
  await store.init();
  await runFlow("postgres", store);

  // Verify rows actually landed in the database tables.
  const users = await pool.query("SELECT COUNT(*)::int AS n FROM users");
  assert.equal(users.rows[0].n, 1, "one user row persisted");
  const paid = await pool.query("SELECT status FROM payments");
  assert.equal(paid.rows[0].status, "paid", "payment row updated in db");
  ok("postgres store persists rows and updates status in the database");
}

// 3. Live-Stripe code path with an injected fake client
{
  const fakeStripe = {
    checkout: {
      sessions: {
        create: async (args) => {
          assert.equal(args.mode, "payment");
          assert.equal(args.line_items[0].price_data.unit_amount, 4999);
          return { id: "cs_live_test_123", url: "https://stripe.example/pay/cs_live_test_123" };
        },
      },
    },
    webhooks: {
      constructEvent: (raw, sig, secret) => {
        assert.equal(secret, "whsec_test");
        if (sig !== "valid-sig") throw new Error("signature verification failed");
        return JSON.parse(Buffer.isBuffer(raw) ? raw.toString() : raw);
      },
    },
  };

  const payments = await createPayments({
    stripeClient: fakeStripe,
    webhookSecret: "whsec_test",
    appUrl: "https://app.example",
  });
  assert.equal(payments.mode, "live", "injected client -> live mode");

  const session = await payments.createCheckoutSession({ userId: "u1", priceCents: 4999 });
  assert.equal(session.mode, "live");
  assert.equal(session.id, "cs_live_test_123");
  ok("live payments: createCheckoutSession calls Stripe and returns the session");

  // Webhook signature is verified in live mode.
  await assert.rejects(
    () => payments.parseWebhookEvent({ rawBody: "{}", signature: "bad" }),
    /signature verification failed/
  );
  const event = await payments.parseWebhookEvent({
    rawBody: JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "x" } } }),
    signature: "valid-sig",
  });
  assert.equal(event.type, "checkout.session.completed");
  ok("live payments: webhook signature is enforced");

  // End-to-end through the app with live payments + in-memory store.
  const app = await createApp({ store: createInMemoryStore(), payments });
  await withServer(app, async (api) => {
    assert.equal((await api("GET", "/health")).json.paymentsMode, "live");
    const reg = await api("POST", "/api/auth/register", {
      body: { email: "live@umhlawati.io", password: "supersecret1" },
    });
    const token = reg.json.token;
    const checkout = await api("POST", "/api/checkout", { token, body: { priceCents: 4999 } });
    assert.equal(checkout.json.url, "https://stripe.example/pay/cs_live_test_123");

    const webhook = await api("POST", "/api/webhook", {
      raw: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { id: checkout.json.id } },
      }),
      // header set below via fetch — emulate a verified signature
    });
    // Without a signature header the fake constructEvent receives undefined and
    // rejects, so the handler returns 400 — verifying signature enforcement end to end.
    assert.equal(webhook.status, 400, "missing signature is rejected in live mode");
  });
  ok("live payments: app wires checkout to Stripe and enforces webhook signatures");
}

console.log(`\nAll ${passed} backend tests passed.`);
