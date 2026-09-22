import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, offline } = useAuth();
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem("openrouter_key") ?? "");
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("umh_api_url") ?? "");
  const [saved, setSaved] = useState("");

  function save(key: string, value: string, label: string) {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
    setSaved(label);
    setTimeout(() => setSaved(""), 2500);
  }

  return (
    <div style={{ padding: "var(--s8)", maxWidth: 640 }}>
      <div style={{ marginBottom: "var(--s8)" }}>
        <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>Preferences</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Settings</h1>
      </div>

      {saved && (
        <div style={{ marginBottom: "var(--s5)", padding: "var(--s3) var(--s5)", background: "rgba(39,174,96,0.12)", border: "1px solid rgba(39,174,96,0.3)", borderRadius: "var(--r)", fontSize: 13, color: "#1A6B3F" }}>
          ✓ {saved} saved.
        </div>
      )}

      {/* Account */}
      <Section title="Account">
        <Field label="Email" value={user?.email ?? "—"} readOnly />
        <Field label="Plan" value={user?.tier ?? "free"} readOnly />
        <Field label="Mode" value={offline ? "Offline (mock data)" : "Live API"} readOnly />
      </Section>

      {/* API */}
      <Section title="API connection">
        <div>
          <label style={lbl}>Backend API URL</label>
          <p style={hint}>Override where the web app sends API requests. Leave blank to use the Vite proxy (localhost).</p>
          <div style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s2)" }}>
            <input
              className="input"
              type="url"
              placeholder="https://api.umhlabatea.io"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-ghost" onClick={() => save("umh_api_url", apiUrl, "API URL")}>Save</button>
          </div>
        </div>
      </Section>

      {/* AI */}
      <Section title="AI provider">
        <div>
          <label style={lbl}>OpenRouter API Key</label>
          <p style={hint}>Used for live AI features (show-note generation, SEO metadata). Stored only in this browser, sent only to OpenRouter. Leave blank to use offline stubs.</p>
          <div style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s2)" }}>
            <input
              className="input"
              type="password"
              placeholder="sk-or-…"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13 }}
              autoComplete="off"
            />
            <button className="btn btn-ghost" onClick={() => save("openrouter_key", openRouterKey, "OpenRouter key")}>Save</button>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Data">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Clear local data</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Remove all cached settings and mock data from this browser.</div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ color: "var(--error)", borderColor: "rgba(192,57,43,0.3)" }}
            onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            Clear
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--s8)" }}>
      <div className="eyebrow" style={{ marginBottom: "var(--s4)" }}>{title}</div>
      <div className="card" style={{ padding: "var(--s6)", display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, readOnly }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input
        className="input"
        type="text"
        value={value}
        readOnly={readOnly}
        style={{ background: readOnly ? "var(--surface-alt)" : undefined, color: readOnly ? "var(--text-secondary)" : undefined }}
      />
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4, color: "var(--text-secondary)" };
const hint: React.CSSProperties = { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 };
