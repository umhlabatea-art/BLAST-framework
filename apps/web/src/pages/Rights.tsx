import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../services/client";
import { mock } from "../services/mock";
import type { Registration, Track } from "../types";

const BODIES = [
  { id: "samro",   name: "SAMRO",   right: "Performance & broadcast", icon: "◈" },
  { id: "capasso", name: "CAPASSO", right: "Mechanical reproduction",  icon: "◇" },
  { id: "risa",    name: "RISA",    right: "Sound recording (ISRC)",   icon: "◆" },
];

const STATE_COLORS: Record<string, string> = {
  draft:      "var(--steel)",
  prepared:   "var(--gold)",
  submitted:  "#4682B4",
  registered: "var(--success)",
};

export default function Rights() {
  const { token, offline } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [bodyId, setBodyId] = useState("samro");
  const [trackId, setTrackId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [r, t] = offline
          ? await Promise.all([mock.getRegistrations(), mock.getTracks()])
          : await Promise.all([
              client.get<{ registrations: Registration[] }>("/api/compliance", token),
              client.get<{ tracks: Track[] }>("/api/tracks", token),
            ]);
        setRegistrations(r.registrations);
        setTracks(t.tracks);
        if (t.tracks.length) setTrackId(t.tracks[0].id);
      } catch {
        const [r, t] = await Promise.all([mock.getRegistrations(), mock.getTracks()]);
        setRegistrations(r.registrations);
        setTracks(t.tracks);
        if (t.tracks.length) setTrackId(t.tracks[0].id);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token, offline]);

  async function handleCreate() {
    if (!trackId) return;
    setCreating(true);
    try {
      const data = offline
        ? await mock.createRegistration(bodyId, trackId)
        : await client.post<{ registration: Registration }>("/api/compliance", { bodyId, trackId }, token);
      setRegistrations((prev) => [data.registration, ...prev]);
      setShowNew(false);
    } catch {
      // todo: surface error
    } finally {
      setCreating(false);
    }
  }

  async function handleAdvance(reg: Registration) {
    try {
      const data = offline
        ? await mock.advanceRegistration(reg.id)
        : await client.post<{ registration: Registration }>(`/api/compliance/${reg.id}/advance`, { artistName: "You" }, token);
      setRegistrations((prev) => prev.map((r) => r.id === reg.id ? data.registration : r));
    } catch {
      // todo: surface error
    }
  }

  return (
    <div style={{ padding: "var(--s8)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s8)" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>Rights Management</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Rights Hub</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "var(--s2)" }}>
            Register your tracks with SAMRO, CAPASSO, and RISA.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>+ New registration</button>
      </div>

      {/* Bodies */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--s4)", marginBottom: "var(--s8)" }}>
        {BODIES.map((b) => (
          <div key={b.id} className="card" style={{ padding: "var(--s5)" }}>
            <div style={{ fontSize: 20, marginBottom: "var(--s2)", color: "var(--gold)" }}>{b.icon}</div>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "0.06em", fontSize: 14, marginBottom: "var(--s1)" }}>{b.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.right}</div>
          </div>
        ))}
      </div>

      {/* New registration form */}
      {showNew && (
        <div className="card" style={{ padding: "var(--s6)", marginBottom: "var(--s6)" }}>
          <div className="eyebrow" style={{ marginBottom: "var(--s4)" }}>New Registration</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "var(--s4)", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>Rights body</label>
              <select className="input select" value={bodyId} onChange={(e) => setBodyId(e.target.value)}>
                {BODIES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 6, color: "var(--text-secondary)" }}>Track</label>
              <select className="input select" value={trackId} onChange={(e) => setTrackId(e.target.value)}>
                {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "var(--s2)" }}>
              <button className="btn btn-gold" onClick={handleCreate} disabled={creating || !trackId}>
                {creating ? "…" : "Create"}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Registration list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 72, borderRadius: "var(--r-lg)", background: "var(--surface-alt)", animation: "pulse 1.4s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      ) : registrations.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s12)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
          No registrations yet. Create one above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {registrations.map((reg) => {
            const body = BODIES.find((b) => b.id === reg.bodyId);
            const stateColor = STATE_COLORS[reg.state] ?? "var(--steel)";
            const isTerminal = reg.state === "registered";
            return (
              <div key={reg.id} className="card" style={{ padding: "var(--s5)", display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--r)",
                    background: `${stateColor}20`,
                    border: `1px solid ${stateColor}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: stateColor,
                    flexShrink: 0,
                  }}
                >
                  {body?.icon ?? "◈"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {body?.name ?? reg.bodyId} — {reg.trackTitle ?? reg.trackId}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {body?.right}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <span
                    className="tag"
                    style={{
                      background: `${stateColor}18`,
                      color: stateColor,
                      border: `1px solid ${stateColor}30`,
                      textTransform: "capitalize",
                    }}
                  >
                    {reg.state}
                  </span>
                  {!isTerminal && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleAdvance(reg)}>
                      Advance →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
