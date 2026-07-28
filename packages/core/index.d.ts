// Type declarations for @umhlabatea/core. Hand-written so the package needs no
// build step: Node/Metro load the .js, TypeScript reads these declarations.

// --- Domain entities -------------------------------------------------------

export interface Genre {
  id: string;
  name: string;
  bpmRange: [number, number];
  defaultBpm: number;
  keys: string[];
}

export interface ChordProgression {
  name: string;
  key: string;
  chords: string;
}

export interface Artist {
  id: string;
  stageName: string;
  genre: string;
  plays: number;
  likes: number;
  city: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName?: string;
  genre: string;
  genreId?: string;
  bpm: number;
  key: string;
  priceRands: number;
  durationSec: number;
  plays: number;
  likes: number;
  audioUrl?: string;
  coverUrl?: string | null;
  progression?: string;
  prompt?: string;
  generated?: boolean;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  likes: number;
  comments: number;
  tag: string;
}

export interface AffiliateProgram {
  id: string;
  name: string;
  partner: string;
  commission: number;
  description: string;
}

export interface LiveSale {
  id: string;
  artist: string;
  track: string;
  city: string;
  priceRands: number;
}

export interface Tier {
  id: "free" | "pro" | "studio";
  name: string;
  priceRands: number;
  annualRands?: number;
  period: string;
  tagline?: string;
  highlighted?: boolean;
  agents: string[];
  features: string[];
}

// --- Theme -----------------------------------------------------------------

export const palette: Record<string, string>;
export const semantic: Record<string, string>;
export const fonts: { display: string; body: string; serif: string };
export const tiers: Tier[];
export const revenueConfig: {
  artistShare: number;
  platformShare: number;
  payoutThresholdRands: number;
  payoutDelayHours: number;
  vatRate: number;
};

// --- Mock data -------------------------------------------------------------

export const GENRES: Genre[];
export const CHORD_PROGRESSIONS: ChordProgression[];
export const ARTISTS: Artist[];
export const TRACKS: Track[];
export const COMMUNITY_POSTS: CommunityPost[];
export const AFFILIATE_PROGRAMS: AffiliateProgram[];
export function liveSalesFeed(count?: number, seed?: string): LiveSale[];
export function trackWithArtist(track: Track): Track;
export function tracksWithArtists(): Track[];

// --- Agents ----------------------------------------------------------------

export interface SeoResult {
  description: string;
  keywords: string[];
  social: { twitter: string; facebook: string; instagram: string };
  voiceSearch: string[];
  jsonLd: Record<string, unknown>;
}
export function seoAeo(track: Track): SeoResult;

export const COMPLIANCE_STATES: ("draft" | "prepared" | "submitted" | "registered")[];
export const RIGHTS_BODIES: Record<string, { id: string; name: string; right: string }>;

export interface Writer {
  name: string;
  role?: string;
  share: number;
}
export interface Registration {
  id: string;
  bodyId: string;
  bodyName: string;
  trackId: string;
  trackTitle: string;
  state: "draft" | "prepared" | "submitted" | "registered";
  payload: unknown;
  meta: Record<string, unknown>;
  history: { state: string; at: number | null }[];
}
export function createRegistration(bodyId: string, track: Track, meta?: Record<string, unknown>): Registration;
export function advanceRegistration(
  registration: Registration,
  context?: { track?: Track; artistName?: string; writers?: Writer[]; isrc?: string; at?: number }
): Registration;

export interface SaleSplit {
  gross: number;
  artistShare: number;
  platformShare: number;
  payoutDelayHours: number;
  payoutAtMs: number;
}
export function splitSale(amountRands: number, createdAtMs?: number): SaleSplit;
export function affiliateEarning(
  program: AffiliateProgram,
  grossRands: number
): { programId: string; programName: string; partner: string; commission: number; earnedRands: number };
export function summarize(
  sales: { amountRands: number; createdAtMs?: number }[],
  nowMs?: number
): {
  salesCount: number;
  grossRands: number;
  artistEarningsRands: number;
  paidOutRands: number;
  pendingRands: number;
  belowThreshold: boolean;
};

export function generateTrack(prompt: string, params?: Record<string, unknown>): Track;
export function generateJob(
  prompt: string,
  params?: Record<string, unknown>,
  onProgress?: (p: { step: string; progress: number }) => void
): Promise<Track>;

export as namespace UmhlabateaCore;
