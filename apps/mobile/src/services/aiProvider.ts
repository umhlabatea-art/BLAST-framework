/**
 * Live AI provider (OpenRouter). When the user has saved an API key, the tasks
 * that benefit from a real model — currently SEO/AEO optimisation — call
 * OpenRouter here. Any failure (no key, network, bad JSON) returns null so the
 * caller transparently falls back to the deterministic offline stub.
 *
 * This is the app-side of the provider seam: the offline `seoAeo` and this live
 * path produce the same `SeoResult` shape, so the UI never changes.
 */
import { seoAeo } from "@umhlabatea/core";
import type { Track, SeoResult } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM = [
  "You optimise music tracks for search engines and AI answer engines.",
  "Reply with ONLY minified JSON, no prose, matching this TypeScript type:",
  "{description:string /* <=160 chars */, keywords:string[] /* 10 */,",
  " social:{twitter:string,facebook:string,instagram:string},",
  " voiceSearch:string[] /* 4 */, jsonLd:object /* schema.org MusicRecording */}",
].join(" ");

export async function optimizeSeoWithAI(
  track: Track,
  opts: { key: string; model: string }
): Promise<SeoResult | null> {
  if (!opts.key?.trim()) return null;
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.key.trim()}`,
        "HTTP-Referer": "https://umhlabatea.co.za",
        "X-Title": "Umhlabatea",
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content:
              `Track "${track.title}" by ${track.artistName}. Genre ${track.genre}, ` +
              `${track.bpm} BPM, key ${track.key}, price R${track.priceRands}. Return the JSON.`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    // Be tolerant of code fences the model might add.
    const json = text.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(json) as Partial<SeoResult>;
    // Backfill anything the model omitted from the deterministic stub.
    const fallback = seoAeo(track);
    return {
      description: parsed.description || fallback.description,
      keywords: parsed.keywords?.length ? parsed.keywords : fallback.keywords,
      social: parsed.social || fallback.social,
      voiceSearch: parsed.voiceSearch?.length ? parsed.voiceSearch : fallback.voiceSearch,
      jsonLd: parsed.jsonLd || fallback.jsonLd,
    };
  } catch {
    return null;
  }
}
