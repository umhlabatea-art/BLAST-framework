import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "register";

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s8)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "var(--s8)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, color: "var(--warm-white)", letterSpacing: "-0.02em" }}>
            Umhlabatea
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--gold)", marginTop: "var(--s1)", textTransform: "uppercase" }}>
            Creator OS
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: "var(--s4)" }}>
            The AI-powered platform for South African artists
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--warm-white)",
            borderRadius: "var(--r-xl)",
            padding: "var(--s8)",
            boxShadow: "var(--sh-lg)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", borderRadius: "var(--r)", background: "var(--surface-alt)", padding: 3, marginBottom: "var(--s6)" }}>
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "calc(var(--r) - 2px)",
                  background: mode === m ? "var(--surface)" : "transparent",
                  color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: mode === m ? 600 : 400,
                  fontSize: 14,
                  transition: "all 0.15s",
                  border: "none",
                  boxShadow: mode === m ? "var(--sh-sm)" : "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: "var(--s2)", color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: "var(--s2)", color: "var(--text-secondary)" }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "register" ? 8 : 1}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--error)", background: "rgba(192,57,43,0.08)", padding: "var(--s3) var(--s4)", borderRadius: "var(--r-sm)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={busy}
              style={{ width: "100%", justifyContent: "center", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div style={{ marginTop: "var(--s5)", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
            {mode === "login" ? "Works offline too — just sign in and the app uses mock data." : "No card required. Start free."}
          </div>
        </div>
      </div>
    </div>
  );
}
