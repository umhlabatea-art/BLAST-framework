// Shared domain types for the web dashboard.
// Mirror the @umhlabatea/core types to avoid import issues in strict TS.

export interface User {
  id: string;
  email: string;
  tier: "free" | "pro" | "studio";
  createdAt?: string;
}

export interface Track {
  id: string;
  title: string;
  artistId?: string;
  artistName?: string;
  genre: string;
  bpm: number;
  key: string;
  priceRands: number;
  durationSec: number;
  plays?: number;
  likes?: number;
  audioUrl?: string;
  generated?: boolean;
  createdAt?: string;
}

export interface Listing {
  id: string;
  type: "beat" | "loop" | "session" | "stem";
  title: string;
  description: string;
  priceRands: number;
  genre: string;
  bpm?: number | null;
  audioUrl?: string;
  sellerId: string;
  sellerName: string;
  status: "active" | "inactive";
  tags: string;
  createdAt?: string;
}

export interface Registration {
  id: string;
  bodyId: string;
  bodyName?: string;
  trackId: string;
  trackTitle?: string;
  state: "draft" | "prepared" | "submitted" | "registered";
  payload?: unknown;
  history?: { state: string; at: number | null }[];
  createdAt?: string;
}

export interface AgentTask {
  id: string;
  agent: string;
  title: string;
  source?: string;
  status: "open" | "done";
  createdAt?: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  likes: number;
  comments: number;
  tag: string;
  createdAt?: string;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  transcript: string;
  showNotes: string;
  audioUrl?: string;
  duration: number;
  status: "draft" | "published";
  createdAt?: string;
}

export interface Tier {
  id: string;
  name: string;
  priceRands: number;
  annualRands?: number;
  period: string;
  tagline?: string;
  highlighted?: boolean;
  agents: string[];
  features: string[];
}

export interface LiveSale {
  id: string;
  artist: string;
  track: string;
  city: string;
  priceRands: number;
}

export interface AdminStats {
  seedTracks: number;
  generatedTracks: number;
  totalTracks: number;
  artists: number;
  registrations: number;
  agentTasks: number;
  listings: number;
  communityPosts: number;
}
