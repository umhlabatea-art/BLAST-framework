interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function StatTile({ label, value, sub, accent }: Props) {
  return (
    <div
      className="card"
      style={{ padding: "var(--s6)", display: "flex", flexDirection: "column", gap: "var(--s1)" }}
    >
      <div className="eyebrow">{label}</div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: accent ? "var(--gold)" : "var(--text-primary)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
