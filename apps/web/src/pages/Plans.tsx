import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { client } from "../services/client";
import { mock } from "../services/mock";
import type { Tier } from "../types";

export default function Plans() {
  const { token, user, offline } = useAuth();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = offline
          ? await mock.getTiers()
          : await client.get<{ tiers: Tier[] }>("/api/subscriptions", token);
        setTiers(data.tiers);
      } catch {
        const data = await mock.getTiers();
        setTiers(data.tiers);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [token, offline]);

  return (
    <div style={{ padding: "var(--s8)" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "var(--s10)" }}>
        <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>Pricing</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Built for creators,<br />priced for Africa.
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, marginTop: "var(--s4)", maxWidth: 480, margin: "var(--s4) auto 0" }}>
          All plans include the 80/20 revenue split and offline-first access. No hidden fees.
        </p>

        {/* Billing toggle */}
        <div style={{ display: "inline-flex", background: "var(--surface)", borderRadius: "var(--r)", padding: 3, border: "1px solid var(--border)", marginTop: "var(--s6)" }}>
          {(["monthly", "annual"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: "8px 20px",
                borderRadius: "calc(var(--r) - 2px)",
                background: billing === b ? "var(--ink)" : "transparent",
                color: billing === b ? "var(--warm-white)" : "var(--text-muted)",
                fontWeight: billing === b ? 600 : 400,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
              }}
            >
              {b === "monthly" ? "Monthly" : "Annual"}
              {b === "annual" && (
                <span style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gold)" }}>-25%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tiers */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--s5)" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 400, borderRadius: "var(--r-xl)", background: "var(--surface-alt)", animation: "pulse 1.4s infinite" }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--s5)", maxWidth: 1000, margin: "0 auto" }}>
          {tiers.map((tier) => {
            const isCurrent = user?.tier === tier.id;
            const price = billing === "annual" && tier.annualRands
              ? Math.round(tier.annualRands / 12)
              : tier.priceRands;
            return (
              <div
                key={tier.id}
                style={{
                  background: tier.highlighted ? "var(--ink)" : "var(--surface)",
                  border: tier.highlighted ? "2px solid var(--gold)" : "1px solid var(--border)",
                  borderRadius: "var(--r-xl)",
                  padding: "var(--s8)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s5)",
                  position: "relative",
                  color: tier.highlighted ? "var(--warm-white)" : "var(--text-primary)",
                }}
              >
                {tier.highlighted && (
                  <div
                    style={{
                      position: "absolute",
                      top: -14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--gold)",
                      color: "var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      padding: "4px 12px",
                      borderRadius: "100px",
                      textTransform: "uppercase",
                    }}
                  >
                    Most popular
                  </div>
                )}

                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", color: tier.highlighted ? "var(--gold)" : "var(--text-muted)", marginBottom: "var(--s2)" }}>
                    {tier.tagline}
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {tier.name}
                  </div>
                </div>

                <div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em" }}>
                    {tier.priceRands === 0 ? "Free" : `R${price}`}
                  </span>
                  {tier.priceRands > 0 && (
                    <span style={{ fontSize: 13, color: tier.highlighted ? "rgba(255,255,255,0.5)" : "var(--text-muted)", marginLeft: "var(--s2)" }}>
                      / mo
                    </span>
                  )}
                  {billing === "annual" && tier.annualRands && (
                    <div style={{ fontSize: 12, color: tier.highlighted ? "rgba(255,255,255,0.5)" : "var(--text-muted)", marginTop: "var(--s1)" }}>
                      R{tier.annualRands} billed annually
                    </div>
                  )}
                </div>

                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "var(--s3)", fontSize: 13, color: tier.highlighted ? "rgba(255,255,255,0.8)" : "var(--text-secondary)" }}>
                      <span style={{ color: tier.highlighted ? "var(--gold)" : "var(--success)", flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className="btn"
                  style={{
                    marginTop: "auto",
                    justifyContent: "center",
                    background: isCurrent ? "transparent" : tier.highlighted ? "var(--gold)" : "var(--ink)",
                    color: isCurrent ? (tier.highlighted ? "rgba(255,255,255,0.5)" : "var(--text-muted)") : tier.highlighted ? "var(--ink)" : "var(--warm-white)",
                    border: isCurrent ? `1px solid ${tier.highlighted ? "rgba(255,255,255,0.2)" : "var(--border)"}` : "none",
                    fontWeight: 600,
                    cursor: isCurrent ? "default" : "pointer",
                  }}
                >
                  {isCurrent ? "Current plan" : tier.priceRands === 0 ? "Get started free" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div style={{ textAlign: "center", marginTop: "var(--s10)", fontSize: 13, color: "var(--text-muted)" }}>
        All prices in South African Rand (ZAR), VAT inclusive.{" "}
        <span style={{ color: "var(--gold)" }}>80/20 revenue split applies on all paid plans.</span>
      </div>
    </div>
  );
}
