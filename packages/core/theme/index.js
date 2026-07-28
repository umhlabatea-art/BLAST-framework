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

/** Font families (loaded in the app via @expo-google-fonts). */
export const fonts = {
  display: "BebasNeue", // headings / logo
  body: "Ubuntu", // UI body
  serif: "CrimsonText", // editorial subtitles
};

/** Subscription tiers — mirrors the pricing in the product prototype (ZAR). */
export const tiers = [
  {
    id: "free",
    name: "Free Creator",
    priceRands: 0,
    period: "Forever Free",
    agents: [],
    features: [
      "Upload & generate unlimited music",
      "80% revenue share",
      "Basic analytics",
      "Artist profile page",
      "Community access",
    ],
  },
  {
    id: "pro",
    name: "Artist Pro",
    priceRands: 111,
    period: "per month",
    highlighted: true,
    agents: ["crm", "seo", "marketing", "legal"],
    features: [
      "Everything in Free, plus:",
      "CRM & Lead Generation AI",
      "SEO/AEO Optimization AI",
      "Marketing & Social Media AI",
      "Advanced analytics & insights",
      "Priority payouts (24–48h)",
      "Basic legal document automation",
    ],
  },
  {
    id: "premium",
    name: "Studio Premium",
    priceRands: 350,
    period: "per month",
    agents: ["crm", "seo", "marketing", "legal", "mixing", "visual"],
    features: [
      "Everything in Artist Pro, plus:",
      "AI Mixing & Mastering",
      "4K Image & Video Enhancement",
      "Print-on-Demand Integration",
      "Full legal automation (SAMRO, CAPASSO, RISA)",
      "Financial super agent",
      "Studio services discount (10%)",
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
