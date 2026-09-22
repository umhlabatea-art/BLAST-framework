import type {
  Track,
  Artist,
  CommunityPost,
  Tier,
  AffiliateProgram,
  SeoResult,
  Registration,
  LiveSale,
  Genre,
  AgentTask,
} from "@umhlabatea/core";

export type { Track, Artist, CommunityPost, Tier, AffiliateProgram, SeoResult, Registration, LiveSale, Genre, AgentTask };

export interface NewAgentTask {
  title: string;
  agent?: string;
  detail?: string;
  source?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  tier: "free" | "pro" | "studio";
}

export interface GenerateParams {
  genre?: string;
  bpm?: number;
  key?: string;
  onProgress?: (p: { step: string; progress: number }) => void;
}

/**
 * The contract both the offline mock and the live HTTP client implement. The
 * app depends only on this interface, so switching data sources is a one-line
 * change in `client.ts` — the UI never knows which backend it's talking to.
 */
export interface ApiClient {
  // auth
  register(email: string, password: string): Promise<{ token: string; user: AuthUser }>;
  login(email: string, password: string): Promise<{ token: string; user: AuthUser }>;

  // catalogue
  listTracks(): Promise<Track[]>;
  getTrack(id: string): Promise<Track | null>;
  generate(prompt: string, params?: GenerateParams): Promise<Track>;
  liveSales(count?: number): LiveSale[];

  // community
  listCommunity(): Promise<CommunityPost[]>;
  createPost(body: string, tag?: string): Promise<CommunityPost>;

  // commerce
  tiers(): Tier[];
  affiliates(): AffiliateProgram[];

  // agents
  seo(track: Track): SeoResult;
  listAgentTasks(): Promise<AgentTask[]>;
  createAgentTask(input: NewAgentTask): Promise<AgentTask>;
  completeAgentTask(id: string): Promise<AgentTask>;

  // compliance
  listRegistrations(): Promise<Registration[]>;
  createRegistration(bodyId: string, track: Track): Promise<Registration>;
  advanceRegistration(id: string, ctx?: { artistName?: string }): Promise<Registration>;
}
