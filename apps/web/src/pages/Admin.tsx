import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../services/client";
import { mock } from "../services/mock";
import StatTile from "../components/StatTile";
import type { AdminStats, AgentTask } from "../types";

export default function Admin() {
  const { token, offline } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (offline) {
          const [s, t] = await Promise.all([mock.getAdminStats(), mock.getTasks()]);
          setStats(s.stats as AdminStats);
          setTasks(t.tasks);
        } else {
          const [s, t] = await Promise.all([
            client.get<{ stats: AdminStats }>("/api/admin/stats", token),
            client.get<{ tasks: AgentTask[]; byAgent: Record<string, number>; byStatus: { open: number; done: number } }>("/api/admin/tasks", token),
          ]);
          setStats(s.stats);
          setTasks(t.tasks);
        }
      } catch {
        const [s, t] = await Promise.all([mock.getAdminStats(), mock.getTasks()]);
        setStats(s.stats as AdminStats);
        setTasks(t.tasks);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token, offline]);

  const AGENT_COLORS: Record<string, string> = {
    legal: "#6A5ACD", mixing: "#4682B4", marketing: "var(--gold)", crm: "#27AE60", visual: "#CD853F", seo: "#C0392B",
  };

  return (
    <div style={{ padding: "var(--s8)" }}>
      <div style={{ marginBottom: "var(--s8)" }}>
        <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>Admin</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Platform Overview</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "var(--s2)" }}>
          Platform-wide stats and agent task management.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s4)" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 100, borderRadius: "var(--r-lg)", background: "var(--surface-alt)", animation: "pulse 1.4s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      ) : (
        <>
          {/* Platform stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--s4)", marginBottom: "var(--s8)" }}>
            <StatTile label="Total Tracks" value={stats?.totalTracks ?? 0} sub={`${stats?.generatedTracks ?? 0} AI-generated`} />
            <StatTile label="Artists" value={stats?.artists ?? 0} />
            <StatTile label="Registrations" value={stats?.registrations ?? 0} />
            <StatTile label="Listings" value={stats?.listings ?? 0} />
            <StatTile label="Agent Tasks" value={stats?.agentTasks ?? 0} />
            <StatTile label="Community Posts" value={stats?.communityPosts ?? 0} />
          </div>

          {/* Agent tasks */}
          <div>
            <div className="eyebrow" style={{ marginBottom: "var(--s4)" }}>Agent Task Queue</div>
            {tasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--s10)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                No agent tasks.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
                {tasks.map((task) => {
                  const color = AGENT_COLORS[task.agent] ?? "var(--steel)";
                  return (
                    <div key={task.id} className="card" style={{ padding: "var(--s4) var(--s5)", display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: task.status === "done" ? "var(--success)" : color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, fontSize: 14 }}>{task.title}</div>
                      <span
                        className="tag"
                        style={{ background: `${color}18`, color, border: `1px solid ${color}30`, textTransform: "uppercase" }}
                      >
                        {task.agent}
                      </span>
                      <span className={`tag ${task.status === "done" ? "tag-green" : ""}`}>
                        {task.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
