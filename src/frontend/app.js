/* Minimal vanilla-JS client for the BLAST API. No build step required. */
const log = (msg) => {
  document.getElementById("log").textContent =
    typeof msg === "string" ? msg : JSON.stringify(msg, null, 2);
};

const state = { token: localStorage.getItem("token") || null };

async function api(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function showApp(user) {
  document.getElementById("auth-section").hidden = true;
  document.getElementById("app-section").hidden = false;
  document.getElementById("user-email").textContent = user.email;
  refreshPayments();
}

function showAuth() {
  document.getElementById("auth-section").hidden = false;
  document.getElementById("app-section").hidden = true;
}

async function refreshPayments() {
  try {
    const { payments } = await api("GET", "/api/payments");
    const ul = document.getElementById("payments");
    ul.innerHTML = payments.length
      ? payments
          .map(
            (p) =>
              `<li><span>$${(p.amount / 100).toFixed(2)} ${p.currency.toUpperCase()}</span>` +
              `<span class="status-${p.status}">${p.status}</span></li>`
          )
          .join("")
      : "<li>No payments yet.</li>";
  } catch (err) {
    log(err.message);
  }
}

async function authenticate(action) {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const path = action === "login" ? "/api/auth/login" : "/api/auth/register";
  try {
    const { token, user } = await api("POST", path, { email, password });
    state.token = token;
    localStorage.setItem("token", token);
    log(`${action} successful`);
    showApp(user);
  } catch (err) {
    log(err.message);
  }
}

document.getElementById("auth-form").addEventListener("submit", (e) => {
  e.preventDefault();
  authenticate("register");
});
document.getElementById("login-btn").addEventListener("click", () => authenticate("login"));

document.getElementById("logout-btn").addEventListener("click", () => {
  state.token = null;
  localStorage.removeItem("token");
  showAuth();
  log("logged out");
});

document.getElementById("checkout-btn").addEventListener("click", async () => {
  try {
    const session = await api("POST", "/api/checkout", {
      priceCents: 2999,
      productName: "OHS Starter Pack",
    });
    log(`Checkout session (${session.mode}): ${session.url}`);
    // In stub mode there is no hosted page; simulate completion via webhook so
    // the demo is fully exercisable without Stripe.
    if (session.mode === "stub") {
      await api("POST", "/api/webhook", {
        type: "checkout.session.completed",
        data: { object: { id: session.id } },
      });
      log("Stub payment completed.");
      refreshPayments();
    } else {
      window.location.href = session.url;
    }
  } catch (err) {
    log(err.message);
  }
});

// Restore session on load.
(async function init() {
  if (!state.token) return showAuth();
  try {
    const { user } = await api("GET", "/api/me");
    showApp(user);
  } catch {
    state.token = null;
    localStorage.removeItem("token");
    showAuth();
  }
})();
