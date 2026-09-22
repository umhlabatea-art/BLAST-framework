import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../services/client";
import { mock } from "../services/mock";
import TrackCard from "../components/TrackCard";
import type { Track } from "../types";

const GENRES = ["Amapiano", "Afrobeat", "Afro Jazz", "Neo-Soul", "House", "Hip-Hop"];

export default function Tracks() {
  const { token, offline } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("Amapiano");
  const [error, setError] = useState("");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = offline
          ? await mock.getTracks()
          : await client.get<{ tracks: Track[] }>("/api/tracks", token);
        setTracks(data.tracks);
      } catch {
        const data = await mock.getTracks();
        setTracks(data.tracks);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token, offline]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError("");
    setGenerating(true);
    try {
      const data = offline
        ? await mock.generateTrack(prompt, genre)
        : await client.post<{ track: Track }>("/api/generate", { prompt, genre }, token);
      setTracks((prev) => [data.track, ...prev]);
      setPrompt("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ padding: "var(--s8)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s8)" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>Your Library</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Tracks</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "var(--s2)" }}>
            {tracks.length} track{tracks.length !== 1 ? "s" : ""} in your catalogue
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          ✦ Generate track
        </button>
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="card" style={{ padding: "var(--s6)", marginBottom: "var(--s6)" }}>
          <div className="eyebrow" style={{ marginBottom: "var(--s4)" }}>AI Track Generation</div>
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: "var(--s2)", color: "var(--text-secondary)" }}>
                Describe your track
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. deep amapiano log drum groove with gospel piano chords and a melancholic Cm progression"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: "var(--s4)", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: "var(--s2)", color: "var(--text-secondary)" }}>
                  Genre
                </label>
                <select
                  className="input select"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  {GENRES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-gold" disabled={generating} style={{ opacity: generating ? 0.7 : 1 }}>
                {generating ? "Generating…" : "Generate"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
            {error && (
              <div style={{ fontSize: 13, color: "var(--error)" }}>{error}</div>
            )}
          </form>
        </div>
      )}

      {/* Mini player */}
      {currentTrack && (
        <div
          className="card"
          style={{
            padding: "var(--s4) var(--s6)",
            marginBottom: "var(--s6)",
            display: "flex",
            alignItems: "center",
            gap: "var(--s4)",
            background: "var(--ink)",
            color: "var(--warm-white)",
          }}
        >
          <span style={{ fontSize: 20 }}>♫</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{currentTrack.title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{currentTrack.genre} · {currentTrack.bpm} BPM · {currentTrack.key}</div>
          </div>
          <button
            onClick={() => setCurrentTrack(null)}
            style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Track list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 72, borderRadius: "var(--r-lg)", background: "var(--surface-alt)", animation: "pulse 1.4s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
          {tracks.map((t) => (
            <TrackCard
              key={t.id}
              track={t}
              onPlay={(track) => setCurrentTrack(track)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
