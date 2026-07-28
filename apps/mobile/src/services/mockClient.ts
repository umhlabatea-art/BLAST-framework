/**
 * Offline mock client — the default data source. Wraps @umhlabatea/core so the
 * whole app runs with no server, no keys, no network. User-generated records
 * (tracks, posts, registrations) live in module memory for the session.
 */
import {
  tracksWithArtists,
  trackWithArtist,
  TRACKS,
  COMMUNITY_POSTS,
  AFFILIATE_PROGRAMS,
  liveSalesFeed,
  tiers,
  generateTrack,
  seoAeo,
  createRegistration,
  advanceRegistration,
} from "@umhlabatea/core";
import type { ApiClient, AuthUser, GenerateParams, Track, CommunityPost, Registration } from "./types";

const generated: Track[] = [];
const posts: CommunityPost[] = [];
const registrations: Registration[] = [];

function fakeToken(email: string) {
  return `mock.${Buffer.from(email).toString("base64url")}.token`;
}

export const mockClient: ApiClient = {
  async register(email) {
    return { token: fakeToken(email), user: { id: "me", email, tier: "free" } as AuthUser };
  },
  async login(email) {
    return { token: fakeToken(email), user: { id: "me", email, tier: "free" } as AuthUser };
  },

  async listTracks() {
    return [...generated, ...tracksWithArtists()];
  },
  async getTrack(id) {
    const g = generated.find((t) => t.id === id);
    if (g) return g;
    const seed = TRACKS.find((t) => t.id === id);
    return seed ? trackWithArtist(seed) : null;
  },
  async generate(prompt, params: GenerateParams = {}) {
    // Deterministic result; a short delay keeps the progress UI honest.
    const steps = ["queued", "composing", "arranging", "mixing", "complete"];
    for (let i = 0; i < steps.length; i++) {
      params.onProgress?.({ step: steps[i], progress: (i + 1) / steps.length });
      await new Promise((r) => setTimeout(r, 350));
    }
    const track = generateTrack(prompt, {
      genre: params.genre,
      bpm: params.bpm,
      key: params.key,
      artistName: "You",
    });
    generated.unshift(track);
    return track;
  },
  liveSales(count = 6) {
    return liveSalesFeed(count, `feed-${count}`);
  },

  async listCommunity() {
    return [...posts, ...COMMUNITY_POSTS];
  },
  async createPost(body, tag = "post") {
    const post: CommunityPost = {
      id: `post_${Date.now()}`,
      authorId: "me",
      authorName: "You",
      body,
      tag,
      likes: 0,
      comments: 0,
    };
    posts.unshift(post);
    return post;
  },

  tiers() {
    return tiers;
  },
  affiliates() {
    return AFFILIATE_PROGRAMS;
  },

  seo(track) {
    return seoAeo(track);
  },

  async listRegistrations() {
    return [...registrations];
  },
  async createRegistration(bodyId, track) {
    const reg = createRegistration(bodyId, track);
    registrations.unshift(reg);
    return reg;
  },
  async advanceRegistration(id, ctx = {}) {
    const idx = registrations.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Registration not found");
    const track = await this.getTrack(registrations[idx].trackId);
    const next = advanceRegistration(registrations[idx], {
      track: track || undefined,
      artistName: ctx.artistName || track?.artistName,
      at: Date.now(),
    });
    registrations[idx] = next;
    return next;
  },
};
