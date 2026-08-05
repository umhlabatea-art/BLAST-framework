import type { Listing } from "../types";

interface Props {
  listing: Listing;
  onBook?: (listing: Listing) => void;
}

const TYPE_COLORS = { beat: "var(--gold)", loop: "#6A5ACD", session: "#27AE60", stem: "#4682B4" };
const TYPE_ICONS  = { beat: "♪", loop: "⟳", session: "◉", stem: "⋈" };

export default function ListingCard({ listing, onBook }: Props) {
  const color = TYPE_COLORS[listing.type] ?? "var(--steel)";
  const icon  = TYPE_ICONS[listing.type]  ?? "◎";

  return (
    <div
      className="card"
      style={{
        padding: "var(--s5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s3)",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "var(--sh)";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "var(--sh-sm)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r)",
            background: `${color}20`,
            border: `1px solid ${color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color,
          }}
        >
          {icon}
        </div>
        <div
          className="tag"
          style={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}30`,
            textTransform: "uppercase",
            fontSize: 10,
          }}
        >
          {listing.type}
        </div>
      </div>

      {/* Title + description */}
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{listing.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: "var(--s1)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {listing.description}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", gap: "var(--s2)", flexWrap: "wrap" }}>
        <span className="tag">{listing.genre}</span>
        {listing.bpm && <span className="tag">{listing.bpm} BPM</span>}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "var(--s2)", borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600 }}>
            R{listing.priceRands.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{listing.sellerName}</div>
        </div>
        {onBook && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onBook(listing)}
          >
            {listing.type === "session" ? "Book" : "Buy"}
          </button>
        )}
      </div>
    </div>
  );
}
