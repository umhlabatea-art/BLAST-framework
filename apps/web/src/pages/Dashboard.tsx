import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../services/client";
import { mock } from "../services/mock";
import StatTile from "../components/StatTile";
import TrackCard from "../components/TrackCard";
import LiveFeed from "../components/LiveFeed";
import type { Track } from "../types";

interface RevSummary {
  salesCount: number;
  grossRands: number;
  artistEarningsRands: number;
  paidOutRands: number;
  pendingRands: number;
}

export default function Dashboard() {
  const { token, user, offline } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [rev, setRev] = useState<RevSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (offline) {
          const [t, r] = await Promise.all([mock.getTracks(), mock.getRevenue()]);
          setTracks(t.tracks.slice(0, 4));
          setRev(r.summary);
        } else {
          const [t, r] = await Promise.all([
            client.get<{ tracks: Track[] }>("/api/tracks", token),
            client.get<{ summary: RevSummary }>("/api/revenue", token),
          ]);
          setTracks(t.tracks.slice(0, 4));
          setRev(r.summary);
        }
      } catch {
        const [t, r] = await Promise.all([mock.getTracks(), mock.getRevenue()]);
        setTracks(t.tracks.slice(0, 4));
        setRev(r.summary);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token, offline]);

  if (loading) return <PageLoader />;

  return (
    <div style={{ padding: "var(--s8)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--s8)" }}>
        <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>Overview</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
          Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "var(--s2)" }}>
          {new Date().toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--s4)",
          marginBottom: "var(--s8)",
        }}
      >
        <StatTile label="Your Earnings" value={`R${rev?.artistEarningsRands?.toFixed(2) ?? "0.00"}`} sub="80% artist share" accent />
        <StatTile label="Total Sales" value={rev?.salesCount ?? 0} sub="this period" />
        <StatTile label="Paid Out" value={`R${rev?.paidOutRands?.toFixed(2) ?? "0.00"}`} sub="cleared to wallet" />
        <StatTile label="Pending" value={`R${rev?.pendingRands?.toFixed(2) ?? "0.00"}`} sub="clearing within 48 h" />
      </div>

      {/* Content grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: "var(--s6)",
          alignItems: "start",
        }}
      >
        {/* Recent tracks */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--s4)" }}>
            <div className="eyebrow">Recent Tracks</div>
            <a href="/tracks" style={{ fontSize: 12, color: "var(--gold)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              View all →
            </a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            {tracks.map((t) => (
              <TrackCard key={t.id} track={t} compact />
            ))}
          </div>
        </section>

        {/* Live feed */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s2)", marginBottom: "var(--s4)" }}>
            <div
              style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 6px rgba(39,174,96,0.6)" }}
            />
            <div className="eyebrow">Live Sales</div>
          </div>
          <LiveFeed compact />

          {/* Quick-action links */}
          <div style={{ marginTop: "var(--s6)" }}>
            <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
              {[
                { label: "Generate a track", href: "/tracks", icon: "♫" },
                { label: "Browse marketplace", href: "/marketplace", icon: "◎" },
                { label: "Register a track", href: "/rights", icon: "⚖" },
                { label: "Record an episode", href: "/podcast", icon: "⏺" },
              ].map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s3)",
                    padding: "var(--s3) var(--s4)",
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--sh)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--sh-sm)"; }}
                >
                  <span style={{ fontSize: 15 }}>{a.icon}</span>
                  {a.label}
                  <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>→</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div style={{ padding: "var(--s8)", display: "flex", flexDirection: "column", gap: "var(--s6)" }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ height: 80, borderRadius: "var(--r-lg)", background: "var(--surface-alt)", animation: "pulse 1.4s infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  );
}
