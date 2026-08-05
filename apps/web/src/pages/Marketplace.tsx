import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../services/client";
import { mock } from "../services/mock";
import ListingCard from "../components/ListingCard";
import type { Listing } from "../types";

type ListingType = "all" | "beat" | "loop" | "session" | "stem";

const TYPES: { value: ListingType; label: string }[] = [
  { value: "all",     label: "All"      },
  { value: "beat",    label: "Beats"    },
  { value: "loop",    label: "Loops"    },
  { value: "session", label: "Sessions" },
  { value: "stem",    label: "Stems"    },
];

const GENRES = ["All genres", "Amapiano", "Afrobeat", "Afro Jazz", "Neo-Soul", "House", "Hip-Hop"];

export default function Marketplace() {
  const { token, offline } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ListingType>("all");
  const [genreFilter, setGenreFilter] = useState("All genres");
  const [q, setQ] = useState("");
  const [showSell, setShowSell] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);

  // Sell form state
  const [sellType, setSellType] = useState<Listing["type"]>("beat");
  const [sellTitle, setSellTitle] = useState("");
  const [sellDesc, setSellDesc] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellGenre, setSellGenre] = useState("Amapiano");
  const [sellBpm, setSellBpm] = useState("");
  const [sellTags, setSellTags] = useState("");
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState("");

  useEffect(() => {
    load();
  }, [token, offline]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    try {
      const data = offline
        ? await mock.getListings()
        : await client.get<{ listings: Listing[]; total: number }>("/api/marketplace", token);
      setListings(data.listings);
    } catch {
      const data = await mock.getListings();
      setListings(data.listings);
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(listing: Listing) {
    try {
      offline
        ? await mock.bookListing(listing.id)
        : await client.post(`/api/marketplace/${listing.id}/book`, {}, token);
      setBooked(listing.title);
      setTimeout(() => setBooked(null), 3000);
    } catch {
      // Silently fail in demo — show toast in production.
    }
  }

  async function handleSell(e: FormEvent) {
    e.preventDefault();
    setSellError("");
    setSelling(true);
    try {
      const data = {
        type: sellType,
        title: sellTitle,
        description: sellDesc,
        priceRands: Number(sellPrice),
        genre: sellGenre,
        bpm: sellBpm ? Number(sellBpm) : undefined,
        tags: sellTags,
      };
      const res = offline
        ? await mock.createListing(data as Partial<Listing>)
        : await client.post<{ listing: Listing }>("/api/marketplace", data, token);
      setListings((prev) => [res.listing, ...prev]);
      setShowSell(false);
      setSellTitle(""); setSellDesc(""); setSellPrice(""); setSellBpm(""); setSellTags("");
    } catch (err) {
      setSellError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setSelling(false);
    }
  }

  const filtered = listings.filter((l) => {
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (genreFilter !== "All genres" && l.genre !== genreFilter) return false;
    if (q && !l.title.toLowerCase().includes(q.toLowerCase()) && !(l.tags || "").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: "var(--s8)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--s6)" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>Creator Marketplace</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Marketplace</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "var(--s2)" }}>
            Beats, loops, session musicians, and stem bundles from South African artists.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowSell(!showSell)}>
          + Sell
        </button>
      </div>

      {/* Toast */}
      {booked && (
        <div style={{ marginBottom: "var(--s4)", padding: "var(--s3) var(--s5)", background: "rgba(39,174,96,0.12)", border: "1px solid rgba(39,174,96,0.3)", borderRadius: "var(--r)", fontSize: 13, color: "#1A6B3F" }}>
          ✓ Booking request sent for <strong>{booked}</strong>
        </div>
      )}

      {/* Sell form */}
      {showSell && (
        <div className="card" style={{ padding: "var(--s6)", marginBottom: "var(--s6)" }}>
          <div className="eyebrow" style={{ marginBottom: "var(--s5)" }}>Create a Listing</div>
          <form onSubmit={handleSell} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
            <div>
              <label style={lbl}>Type</label>
              <select className="input select" value={sellType} onChange={(e) => setSellType(e.target.value as Listing["type"])}>
                {["beat","loop","session","stem"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Genre</label>
              <select className="input select" value={sellGenre} onChange={(e) => setSellGenre(e.target.value)}>
                {GENRES.filter(g => g !== "All genres").map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Title</label>
              <input className="input" type="text" placeholder="e.g. Deep Amapiano Beat — Cm" value={sellTitle} onChange={(e) => setSellTitle(e.target.value)} required />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Description</label>
              <textarea className="input" rows={2} placeholder="Brief description" value={sellDesc} onChange={(e) => setSellDesc(e.target.value)} style={{ resize: "vertical" }} />
            </div>
            <div>
              <label style={lbl}>Price (ZAR)</label>
              <input className="input" type="number" min={1} placeholder="150" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>BPM (optional)</label>
              <input className="input" type="number" min={40} max={220} placeholder="116" value={sellBpm} onChange={(e) => setSellBpm(e.target.value)} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>Tags (comma-separated)</label>
              <input className="input" type="text" placeholder="amapiano, log drum, gospel" value={sellTags} onChange={(e) => setSellTags(e.target.value)} />
            </div>
            {sellError && <div style={{ gridColumn: "1/-1", fontSize: 13, color: "var(--error)" }}>{sellError}</div>}
            <div style={{ gridColumn: "1/-1", display: "flex", gap: "var(--s3)" }}>
              <button type="submit" className="btn btn-gold" disabled={selling}>{selling ? "Posting…" : "Post listing"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowSell(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "var(--s3)", marginBottom: "var(--s6)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "var(--surface)", borderRadius: "var(--r)", padding: 3, border: "1px solid var(--border)" }}>
          {TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              style={{
                padding: "6px 14px",
                borderRadius: "calc(var(--r) - 2px)",
                background: typeFilter === value ? "var(--ink)" : "transparent",
                color: typeFilter === value ? "var(--warm-white)" : "var(--text-secondary)",
                fontWeight: typeFilter === value ? 600 : 400,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          className="input select"
          style={{ width: "auto", fontSize: 13 }}
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
        >
          {GENRES.map(g => <option key={g}>{g}</option>)}
        </select>

        <input
          className="input"
          type="search"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 160, fontSize: 13 }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--s4)" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 200, borderRadius: "var(--r-lg)", background: "var(--surface-alt)", animation: "pulse 1.4s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--s16)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
          No listings match your filters.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--s4)" }}>
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} onBook={handleBook} />
          ))}
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 6,
  color: "var(--text-secondary)",
};
