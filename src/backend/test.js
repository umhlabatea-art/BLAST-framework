/**
 * End-to-end tests for the BLAST backend, run in-process against the Express
 * app (no port binding, no external services). Uses Node's built-in fetch +
 * a throwaway listener on port 0. Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import { createApp } from "./app.js";

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
  // health
  {
    const r = await api("GET", "/health");
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
    assert.equal(r.json.paymentsMode, "stub");
    ok("health reports stub payments mode");
  }

  // register validation
  {
    const bad = await api("POST", "/api/auth/register", { body: { email: "x", password: "short" } });
    assert.equal(bad.status, 400);
    ok("register rejects invalid email/password");
  }

  // register + token
  let token;
  {
    const r = await api("POST", "/api/auth/register", {
      body: { email: "Dev@Umhlawati.io", password: "supersecret1" },
    });
    assert.equal(r.status, 201);
    assert.ok(r.json.token, "token issued");
    assert.equal(r.json.user.email, "dev@umhlawati.io", "email normalized");
    token = r.json.token;
    ok("register creates user and issues token");
  }

  // duplicate register
  {
    const r = await api("POST", "/api/auth/register", {
      body: { email: "dev@umhlawati.io", password: "supersecret1" },
    });
    assert.equal(r.status, 409);
    ok("duplicate registration rejected");
  }

  // protected route without token
  {
    const r = await api("GET", "/api/me");
    assert.equal(r.status, 401);
    ok("protected route blocks anonymous access");
  }

  // protected route with token
  {
    const r = await api("GET", "/api/me", { token });
    assert.equal(r.status, 200);
    assert.equal(r.json.user.email, "dev@umhlawati.io");
    ok("protected route works with valid token");
  }

  // login wrong password
  {
    const r = await api("POST", "/api/auth/login", {
      body: { email: "dev@umhlawati.io", password: "wrongpass1" },
    });
    assert.equal(r.status, 401);
    ok("login rejects wrong password");
  }

  // checkout (stub) + webhook -> paid
  {
    const checkout = await api("POST", "/api/checkout", { token, body: { priceCents: 2999, productName: "OHS Starter Pack" } });
    assert.equal(checkout.status, 200);
    assert.equal(checkout.json.mode, "stub");
    assert.match(checkout.json.id, /^cs_stub_/);
    ok("checkout creates a stub session");

    const before = await api("GET", "/api/payments", { token });
    assert.equal(before.json.payments[0].status, "pending");

    const webhook = await api("POST", "/api/webhook", {
      raw: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { id: checkout.json.id } },
      }),
    });
    assert.equal(webhook.status, 200);
    assert.equal(webhook.json.received, true);
    ok("webhook accepts completed event");

    const after = await api("GET", "/api/payments", { token });
    assert.equal(after.json.payments[0].status, "paid");
    ok("payment marked paid after webhook");
  }

  // invalid checkout amount
  {
    const r = await api("POST", "/api/checkout", { token, body: { priceCents: -1 } });
    assert.equal(r.status, 400);
    ok("checkout rejects invalid amount");
  }

  console.log(`\nAll ${passed} backend tests passed.`);
} finally {
  server.close();
}
