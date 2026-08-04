/**
 * @umhlabatea/core — the shared heart of the platform.
 *
 * One place for domain data, brand tokens, and the deterministic AI-agent
 * stubs, imported by both the Express API (`apps/api`) and the Expo app
 * (`apps/mobile`) so the two never drift apart.
 */
export * as theme from "./theme/index.js";
export * as mock from "./mock/index.js";
export * as agents from "./agents/index.js";

// Flat re-exports for the most-used helpers.
export { palette, semantic, fonts, tiers, revenueConfig } from "./theme/index.js";
export {
  GENRES,
  CHORD_PROGRESSIONS,
  ARTISTS,
  TRACKS,
  COMMUNITY_POSTS,
  AFFILIATE_PROGRAMS,
  liveSalesFeed,
  trackWithArtist,
  tracksWithArtists,
} from "./mock/index.js";
export {
  seoAeo,
  COMPLIANCE_STATES,
  RIGHTS_BODIES,
  createRegistration,
  advanceRegistration,
  splitSale,
  affiliateEarning,
  summarize,
  generateTrack,
  generateJob,
  routeAgent,
  AGENT_IDS,
} from "./agents/index.js";
