/**
 * Umhlabatea design tokens — the single source of truth for the platform's
 * Afrocentric visual identity. Consumed by the mobile app's Tailwind config
 * (`apps/mobile/tailwind.config.js`) and available to any web export or the API.
 *
 * The palette and type choices are lifted from the approved `umhlabateastudios`
 * prototype so the native app matches the established brand.
 */

// Colours live in a CJS file so Tailwind (CommonJS) and the ESM app share one
// source; re-exported here as ESM named exports.
import tokens from "./palette.cjs";

/** Core brand palette (earthy bohemian with vibrant accents). */
export const palette = tokens.palette;

/**
 * Semantic aliases so components reference intent, not raw hues. Keeping this
 * layer means a rebrand only touches `palette.cjs`.
 */
export const semantic = tokens.semantic;

/**
 * A single coding-style typeface (IBM Plex Mono) across the whole app for a
 * calm, minimalist identity. `display` and `body` map to the same family and
 * differ only by weight where used.
 */
export const fonts = {
  display: "IBMPlexMono", // headings — heavier weight applied in components
  body: "IBMPlexMono", // UI body
};

/**
 * Subscription tiers — standard SaaS practice: three plans, round monthly
 * prices in ZAR, an ~2-months-free annual price, and short, scannable feature
 * lists. The most popular plan is flagged.
 */
export const tiers = [
  {
    id: "free",
    name: "Free",
    priceRands: 0,
    annualRands: 0,
    period: "forever",
    tagline: "Start creating, keep 80%.",
    agents: [],
    features: [
      "Unlimited AI music generation",
      "80% revenue share",
      "Artist profile & community",
      "Basic analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceRands: 99,
    annualRands: 990,
    period: "per month",
    highlighted: true,
    tagline: "Grow your audience on autopilot.",
    agents: ["crm", "seo", "marketing", "legal"],
    features: [
      "Everything in Free",
      "CRM, SEO/AEO & Marketing agents",
      "Rights automation (SAMRO · CAPASSO · RISA)",
      "Priority payouts (24–48h)",
      "Advanced analytics",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    priceRands: 299,
    annualRands: 2990,
    period: "per month",
    tagline: "The full studio, powered by AI.",
    agents: ["crm", "seo", "marketing", "legal", "mixing", "visual"],
    features: [
      "Everything in Pro",
      "AI mixing & mastering",
      "4K visuals & print-on-demand",
      "Financial & tax agent",
      "10% off studio services",
    ],
  },
];

/** Revenue split & payout policy (from the platform's revenue config). */
export const revenueConfig = {
  artistShare: 0.8,
  platformShare: 0.2,
  payoutThresholdRands: 50,
  payoutDelayHours: 48,
  vatRate: 0.15,
};

export default { palette, semantic, fonts, tiers, revenueConfig };
