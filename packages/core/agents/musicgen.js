/**
 * AI music-generation agent (offline stub).
 *
 * `generate()` turns a text prompt + parameters into a fully-formed Track,
 * deterministically, so the Generate flow is exercisable with no model, keys or
 * network. A real engine (Suno / Replicate / MusicGen) is injected via the
 * `provider` seam — same call shape, so no UI change when it goes live.
 */
import { GENRES, CHORD_PROGRESSIONS, SILENT_WAV } from "../mock/index.js";
import { seededRandom, pick } from "../rand.js";

/** Title fragments used to name generated tracks deterministically. */
const TITLE_HEADS = ["Golden", "Township", "Ancestral", "Midnight", "Rising", "Sacred", "Velvet", "Electric"];
const TITLE_TAILS = ["Groove", "Horizon", "Prayer", "Echoes", "Motion", "Sunrise", "Ritual", "Bloom"];

/** Resolve a genre descriptor (defaults to Amapiano — the platform's home sound). */
function resolveGenre(genreId) {
  return GENRES.find((g) => g.id === genreId) || GENRES[0];
}

/**
 * The default, deterministic provider. Given a normalized spec it returns the
 * synthesized track fields. Swap this out for a network-backed provider that
 * returns `{ audioUrl, coverUrl, durationSec }` from a real model.
 */
export function stubProvider(spec) {
  const rand = seededRandom(`${spec.prompt}|${spec.genre}|${spec.bpm}|${spec.key}`);
  const durationSec = 180 + Math.floor(rand() * 180); // 3–6 min
  return {
    audioUrl: SILENT_WAV,
    coverUrl: null, // the app renders a themed gradient placeholder when null
    durationSec,
  };
}

/**
 * Replicate MusicGen provider. Submits a prediction, polls until it
 * succeeds or fails, then returns `{ audioUrl, coverUrl, durationSec }`.
 *
 * Requires `REPLICATE_API_TOKEN` in the environment.
 * Model: meta/musicgen — "large" version via Replicate's official deployment.
 */
export async function replicateProvider(spec) {
  const token = typeof process !== "undefined" && process.env && process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN not set");

  const MUSICGEN_MODEL = "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eeab43";
  const headers = {
    Authorization: `Token ${token}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    version: MUSICGEN_MODEL.split(":")[1],
    input: {
      prompt: `${spec.genre} music, ${spec.bpm} bpm, key of ${spec.key}. ${spec.prompt}`,
      model_version: "large",
      output_format: "mp3",
      normalization_strategy: "loudness",
      duration: 30,
    },
  });

  // Submit prediction
  const submit = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers,
    body,
  });
  if (!submit.ok) {
    const err = await submit.text();
    throw new Error(`Replicate submit failed: ${submit.status} ${err}`);
  }
  const { id: predId, urls } = await submit.json();
  const pollUrl = urls?.get || `https://api.replicate.com/v1/predictions/${predId}`;

  // Poll until terminal state (up to 5 minutes)
  const deadline = Date.now() + 5 * 60_000;
  let delay = 2000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 10_000);

    const poll = await fetch(pollUrl, { headers });
    if (!poll.ok) continue;
    const result = await poll.json();

    if (result.status === "succeeded") {
      const audioUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return { audioUrl, coverUrl: null, durationSec: 30 };
    }
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(`Replicate prediction ${result.status}: ${result.error || ""}`);
    }
  }
  throw new Error("Replicate prediction timed out after 5 minutes");
}

/**
 * Generate a track from a prompt.
 * @param {string} prompt
 * @param {object} [params] - { genre, bpm, key, artistId, artistName, provider }
 * @returns {object} a Track with a stable id derived from the inputs.
 */
export async function generate(prompt, params = {}) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("prompt is required");
  }
  const genre = resolveGenre(params.genre);
  const bpm = params.bpm || genre.defaultBpm;
  const key = params.key || pick(genre.keys, `${prompt}-key`);
  const progression = pick(CHORD_PROGRESSIONS, `${prompt}-prog`);

  const seed = `${prompt}|${genre.id}|${bpm}|${key}`;
  const rand = seededRandom(seed);
  const title = params.title || `${pick(TITLE_HEADS, `${seed}-h`)} ${pick(TITLE_TAILS, `${seed}-t`)}`;
  const id = `gen_${Math.abs(hash(seed)).toString(36)}`;

  const provider = params.provider === "replicate" ? replicateProvider
    : (params.provider || stubProvider);
  const rendered = await Promise.resolve(provider({ prompt, genre: genre.id, bpm, key }));

  return {
    id,
    title,
    artistId: params.artistId || "me",
    artistName: params.artistName || "You",
    genre: genre.name,
    genreId: genre.id,
    bpm,
    key,
    progression: progression.chords,
    prompt,
    priceRands: 75 + Math.floor(rand() * 50),
    durationSec: rendered.durationSec,
    audioUrl: rendered.audioUrl,
    coverUrl: rendered.coverUrl,
    plays: 0,
    likes: 0,
    generated: true,
  };
}

/**
 * Simulate an async generation "job" (queued → processing → complete) so the UI
 * can render progress. Deterministic result; the delay is cosmetic.
 */
export async function generateJob(prompt, params = {}, onProgress) {
  const steps = ["queued", "composing", "arranging", "mixing", "complete"];
  for (let i = 0; i < steps.length; i++) {
    if (onProgress) onProgress({ step: steps[i], progress: (i + 1) / steps.length });
    if (params.delayMs) await new Promise((r) => setTimeout(r, params.delayMs));
  }
  return await generate(prompt, params);
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (Math.imul(31, h) + String(s).charCodeAt(i)) | 0;
  return h;
}

export default { generate, generateJob, stubProvider };
