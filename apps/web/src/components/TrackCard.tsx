import type { Track } from "../types";

interface Props {
  track: Track;
  onPlay?: (track: Track) => void;
  compact?: boolean;
}

const GENRE_COLORS: Record<string, string> = {
  Amapiano: "#C9A84C",
  Afrobeat: "#6B8E23",
  "Afro Jazz": "#6A5ACD",
  "Neo-Soul": "#CD853F",
  "House": "#4682B4",
  "Hip-Hop": "#A0522D",
};

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function TrackCard({ track, onPlay, compact }: Props) {
  const color = GENRE_COLORS[track.genre] ?? "#8892A4";
  const initial = track.title[0]?.toUpperCase() ?? "T";

  return (
    <div
      className="card"
      style={{
        padding: compact ? "var(--s4)" : "var(--s5)",
        display: "flex",
        alignItems: "center",
        gap: "var(--s4)",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--sh)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--sh-sm)"; }}
    >
      {/* Cover */}
      <div
        style={{
          width: compact ? 40 : 52,
          height: compact ? 40 : 52,
          borderRadius: "var(--r)",
          background: `linear-gradient(135deg, ${color}33, ${color}88)`,
          border: `1px solid ${color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontSize: compact ? 16 : 20,
          fontWeight: 700,
          color,
          flexShrink: 0,
        }}
      >
        {initial}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {track.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {track.artistName ?? "You"} · {track.genre} · {track.bpm} BPM
        </div>
        {!compact && (
          <div style={{ display: "flex", gap: "var(--s3)", marginTop: "var(--s2)", alignItems: "center" }}>
            <span className="tag">{track.key}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {fmtDuration(track.durationSec ?? 0)}
            </span>
            {track.plays !== undefined && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>♪ {fmtNumber(track.plays)}</span>
            )}
          </div>
        )}
      </div>

      {/* Price + actions */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--s2)", flexShrink: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          R{track.priceRands}
        </div>
        {onPlay && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onPlay(track)}
            style={{ fontSize: 12 }}
          >
            ▶ Play
          </button>
        )}
        {track.generated && (
          <span className="tag tag-gold" style={{ fontSize: 10 }}>AI</span>
        )}
      </div>
    </div>
  );
}
