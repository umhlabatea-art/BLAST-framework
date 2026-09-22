import { useState, useEffect, useRef } from "react";
import type { LiveSale } from "../types";
import { mock } from "../services/mock";

interface Props {
  compact?: boolean;
}

export default function LiveFeed({ compact }: Props) {
  const [sales, setSales] = useState<LiveSale[]>([]);
  const [visible, setVisible] = useState<LiveSale[]>([]);
  const idxRef = useRef(0);

  useEffect(() => {
    const feed = mock.getLiveFeed();
    setSales(feed);
    // Show first item immediately.
    setVisible([feed[0]]);
    idxRef.current = 1;
  }, []);

  useEffect(() => {
    if (!sales.length) return;
    const interval = setInterval(() => {
      const next = sales[idxRef.current % sales.length];
      setVisible((prev) => [next, ...prev].slice(0, compact ? 3 : 5));
      idxRef.current++;
    }, 3000);
    return () => clearInterval(interval);
  }, [sales, compact]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s2)" }}>
      {visible.map((sale) => (
        <div
          key={sale.id + sale.artist}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--s3)",
            padding: "var(--s3) var(--s4)",
            background: "var(--surface)",
            borderRadius: "var(--r)",
            border: "1px solid var(--border)",
            fontSize: 13,
            animation: "fadeSlide 0.3s ease",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--success)",
              flexShrink: 0,
              boxShadow: "0 0 6px rgba(39,174,96,0.6)",
            }}
          />
          <span style={{ flex: 1 }}>
            <strong>{sale.artist}</strong>
            {" "}purchased{" "}
            <em>{sale.track}</em>
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gold)", flexShrink: 0 }}>
            R{sale.priceRands}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{sale.city}</span>
        </div>
      ))}
      <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
