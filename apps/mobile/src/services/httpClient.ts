/**
 * Live HTTP client — used when EXPO_PUBLIC_API_URL is set. Dynamic data comes
 * from apps/api; static config and pure agents (tiers, affiliates, SEO,
 * live-sales) are served from the bundled shared core, since they're identical
 * on both sides. This is the app-side mirror of the API's stub↔live switch.
 */
import {
  AFFILIATE_PROGRAMS,
  liveSalesFeed,
  tiers,
  seoAeo,
} from "@umhlabatea/core";
import type { ApiClient, AuthUser, GenerateParams, Track, CommunityPost, Registration } from "./types";
import { getToken } from "../store/auth";

const BASE = process.env.EXPO_PUBLIC_API_URL || "";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  return data as T;
}

export const httpClient: ApiClient = {
  async register(email, password) {
    return req("POST", "/api/auth/register", { email, password });
  },
  async login(email, password) {
    return req("POST", "/api/auth/login", { email, password });
  },

  async listTracks() {
    const { tracks } = await req<{ tracks: Track[] }>("GET", "/api/tracks");
    return tracks;
  },
  async getTrack(id) {
    try {
      const { track } = await req<{ track: Track }>("GET", `/api/tracks/${id}`);
      return track;
    } catch {
      return null;
    }
  },
  async generate(prompt, params: GenerateParams = {}) {
    params.onProgress?.({ step: "queued", progress: 0.2 });
    const { track } = await req<{ track: Track }>("POST", "/api/generate", {
      prompt,
      genre: params.genre,
      bpm: params.bpm,
      key: params.key,
    });
    params.onProgress?.({ step: "complete", progress: 1 });
    return track;
  },
  liveSales(count = 6) {
    return liveSalesFeed(count, `feed-${count}`);
  },

  async listCommunity() {
    const { posts } = await req<{ posts: CommunityPost[] }>("GET", "/api/community");
    return posts;
  },
  async createPost(body, tag = "post") {
    const { post } = await req<{ post: CommunityPost }>("POST", "/api/community", { body, tag });
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
    const { registrations } = await req<{ registrations: Registration[] }>("GET", "/api/compliance");
    return registrations;
  },
  async createRegistration(bodyId, track) {
    const { registration } = await req<{ registration: Registration }>("POST", "/api/compliance", {
      bodyId,
      trackId: track.id,
    });
    return registration;
  },
  async advanceRegistration(id, ctx = {}) {
    const { registration } = await req<{ registration: Registration }>(
      "POST",
      `/api/compliance/${id}/advance`,
      { artistName: ctx.artistName }
    );
    return registration;
  },
};

export type { AuthUser };
