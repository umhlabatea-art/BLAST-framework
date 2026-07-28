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
 * Generate a track from a prompt.
 * @param {string} prompt
 * @param {object} [params] - { genre, bpm, key, artistId, artistName, provider }
 * @returns {object} a Track with a stable id derived from the inputs.
 */
export function generate(prompt, params = {}) {
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

  const provider = params.provider || stubProvider;
  const rendered = provider({ prompt, genre: genre.id, bpm, key });

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
  return generate(prompt, params);
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (Math.imul(31, h) + String(s).charCodeAt(i)) | 0;
  return h;
}

export default { generate, generateJob, stubProvider };
