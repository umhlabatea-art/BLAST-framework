/**
 * Deterministic mock data — the offline seed that makes the entire app usable
 * with zero backend. Fixtures are drawn from the approved product prototype
 * (featured artists, live-sales feed) and the Amapiano production guide
 * (genres, BPM ranges, keys, chord progressions).
 *
 * Everything here is pure data + pure generators; no dates that drift, no
 * randomness that isn't seeded, so tests and snapshots stay stable.
 */
import { seededRandom, pick } from "../rand.js";

// --- Genres (from the Amapiano / production guides) ----------------------

export const GENRES = [
  { id: "amapiano", name: "Amapiano", bpmRange: [113, 120], defaultBpm: 116, keys: ["Cm", "Fm", "Gm", "Am", "Dm"] },
  { id: "afrobeat", name: "Afrobeat", bpmRange: [100, 118], defaultBpm: 108, keys: ["Am", "Em", "Gm"] },
  { id: "afro-jazz", name: "Afro Jazz", bpmRange: [90, 120], defaultBpm: 100, keys: ["Dm", "Gm", "Cmaj7"] },
  { id: "house", name: "House / Deep House", bpmRange: [118, 125], defaultBpm: 122, keys: ["Am", "Fm", "Cm"] },
  { id: "hip-hop", name: "Hip-Hop", bpmRange: [80, 100], defaultBpm: 90, keys: ["Cm", "Gm", "Am"] },
  { id: "neo-soul", name: "Neo-Soul", bpmRange: [70, 95], defaultBpm: 84, keys: ["Ebmaj7", "Am", "Dm"] },
];

/** Signature Amapiano chord progressions (used to flavour generated tracks). */
export const CHORD_PROGRESSIONS = [
  { name: "Melancholic Sunset", key: "Cm", chords: "Cm7 - Fm7 - Gm7 - Abmaj7" },
  { name: "Township Hope", key: "Fm", chords: "Fm7 - Bbm7 - Ebmaj7 - Ab7" },
  { name: "Deep Groove", key: "Gm", chords: "Gm7 - Cm7 - F7 - Bbmaj7 - Eb7" },
  { name: "Gospel Soul", key: "Am", chords: "Am7 - Dm7 - G7 - Cmaj7 - Fmaj7" },
  { name: "Cultural Pride", key: "Fm", chords: "Fm7 - Db7 - Cm7 - Bb7 - Ab7" },
  { name: "Modern Classic", key: "Cm", chords: "Cm7 - Ab7 - Gm7 - Fm7 - Bb7 - Ebmaj7" },
];

// --- Artists (from the studios prototype) --------------------------------

export const ARTISTS = [
  { id: "art_nkosi", stageName: "Nkosi Mthembu", genre: "Afro Jazz", plays: 125000, likes: 8200, city: "Johannesburg" },
  { id: "art_amara", stageName: "Amara Soul", genre: "Neo-Soul", plays: 89000, likes: 6500, city: "Cape Town" },
  { id: "art_zulu", stageName: "The Zulu Collective", genre: "Afrobeat", plays: 210000, likes: 15000, city: "Durban" },
  { id: "art_khanyisa", stageName: "DJ Khanyisa", genre: "Amapiano", plays: 305000, likes: 22000, city: "Pretoria" },
];

// --- Tracks --------------------------------------------------------------
// A short, silent WAV data URI so the player has real, license-free audio to
// load in every environment (no external asset fetch required).
export const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

export const TRACKS = [
  { id: "trk_ubuntu", title: "Ubuntu Rising", artistId: "art_nkosi", genre: "Afro Jazz", bpm: 100, key: "Dm", priceRands: 85, durationSec: 225, plays: 42000, likes: 3100 },
  { id: "trk_ancestral", title: "Ancestral Echoes", artistId: "art_amara", genre: "Neo-Soul", bpm: 84, key: "Am", priceRands: 120, durationSec: 240, plays: 30500, likes: 2600 },
  { id: "trk_township", title: "Township Dreams", artistId: "art_zulu", genre: "Afrobeat", bpm: 108, key: "Em", priceRands: 95, durationSec: 210, plays: 51000, likes: 4200 },
  { id: "trk_sunrise", title: "African Sunrise", artistId: "art_khanyisa", genre: "Amapiano", bpm: 116, key: "Cm", priceRands: 75, durationSec: 318, plays: 88000, likes: 7300 },
  { id: "trk_logdrum", title: "Log Drum Prayer", artistId: "art_khanyisa", genre: "Amapiano", bpm: 115, key: "Fm", priceRands: 80, durationSec: 300, plays: 64000, likes: 5100 },
];

// --- Community posts -----------------------------------------------------

export const COMMUNITY_POSTS = [
  { id: "post_1", authorId: "art_amara", authorName: "Amara Soul", body: "Looking for a log-drum player for a Cape Town session this weekend. All welcome — first time or seasoned. 🎹", likes: 34, comments: 12, tag: "collab" },
  { id: "post_2", authorId: "art_nkosi", authorName: "Nkosi Mthembu", body: "Free open-mic every Thursday. Bring your voice, your instrument, or just your ears. Music is for everyone.", likes: 58, comments: 9, tag: "event" },
  { id: "post_3", authorId: "art_zulu", authorName: "The Zulu Collective", body: "Just generated a whole Afrobeat groove in the app and mastered it with the AI agent. Wild times to be an artist.", likes: 91, comments: 21, tag: "showcase" },
];

// --- Affiliate / revenue programs ---------------------------------------

export const AFFILIATE_PROGRAMS = [
  { id: "aff_merch", name: "Print-on-Demand Merch", partner: "Printful", commission: 0.15, description: "AI-designed merch; earn on every sale." },
  { id: "aff_sync", name: "Sync Licensing Pool", partner: "Umhlabatea Sync", commission: 0.5, description: "Place your tracks in film, ads & games." },
  { id: "aff_referral", name: "Artist Referral", partner: "Umhlabatea", commission: 0.1, description: "Earn when artists you invite subscribe." },
];

// --- Live-sales feed generator (ported from the prototype's addSale) ------

const FEED_ARTISTS = ["Sipho Ngwenya", "Thandi Mbeki", "Zanele Dlamini", "Bongani Khumalo", "Nomsa Nkosi", "Nkosi Mthembu", "Amara Soul", "DJ Khanyisa"];
const FEED_TRACKS = ["Isibindi", "Thula Mama", "Jabulani", "Ubuntu Spirit", "African Sky", "Log Drum Prayer"];
const FEED_CITIES = ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein"];

/**
 * Deterministically build a live-sales feed of `count` items from a seed, so
 * the same seed always renders the same feed (stable for tests & snapshots).
 */
export function liveSalesFeed(count = 6, seed = "feed") {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => {
    const priceRands = 50 + Math.floor(rand() * 100);
    return {
      id: `sale_${seed}_${i}`,
      artist: pick(FEED_ARTISTS, `${seed}-a-${i}`),
      track: pick(FEED_TRACKS, `${seed}-t-${i}`),
      city: pick(FEED_CITIES, `${seed}-c-${i}`),
      priceRands,
    };
  });
}

/** Join a track to its artist for display. */
export function trackWithArtist(track) {
  const artist = ARTISTS.find((a) => a.id === track.artistId);
  return { ...track, artistName: artist ? artist.stageName : "Unknown Artist" };
}

export const tracksWithArtists = () => TRACKS.map(trackWithArtist);

export default {
  GENRES,
  CHORD_PROGRESSIONS,
  ARTISTS,
  TRACKS,
  SILENT_WAV,
  COMMUNITY_POSTS,
  AFFILIATE_PROGRAMS,
  liveSalesFeed,
  trackWithArtist,
  tracksWithArtists,
};
