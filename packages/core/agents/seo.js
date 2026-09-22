/**
 * SEO/AEO agent (offline stub).
 *
 * Produces search- and answer-engine-optimised metadata for a track: a bounded
 * meta description, keywords, social blurbs, voice-search phrases, and a
 * schema.org `MusicRecording` JSON-LD object that populates <head> on the web
 * export. The function signature and output shape match the `SEOAgent` contract
 * in the product's reference backend, so a real LLM implementation can drop in
 * behind it (via the agent/ provider seam) without changing any caller.
 */

const MAX_DESCRIPTION = 160;

/** Clamp a string to `max` chars without cutting mid-word where avoidable. */
function clamp(text, max = MAX_DESCRIPTION) {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 40 ? lastSpace : slice.length)}…`;
}

function keywordsFor({ title, artistName, genre, key, bpm }) {
  const base = [
    title,
    `${artistName} ${title}`,
    `${genre} music`,
    `South African ${genre}`,
    `${genre} ${bpm} BPM`,
    `${genre} in ${key}`,
    `${artistName} songs`,
    `buy ${genre} tracks`,
    "Umhlabatea artists",
    `${genre} beat download`,
  ];
  // De-dupe, drop empties, cap at 10.
  return [...new Set(base.map((k) => k.trim()).filter(Boolean))].slice(0, 10);
}

/**
 * @param {object} track - a track joined with its artist name.
 * @returns SEO/AEO metadata bundle.
 */
export function seoAeo(track) {
  const {
    id,
    title,
    artistName = "Umhlabatea Artist",
    genre = "Amapiano",
    key = "Cm",
    bpm = 116,
    durationSec = 0,
    priceRands,
  } = track;

  const description = clamp(
    `${title} by ${artistName} — a ${genre} track in ${key} at ${bpm} BPM. ` +
      `Stream, generate and support South African artists on Umhlabatea.`
  );

  const keywords = keywordsFor({ title, artistName, genre, key, bpm });

  const social = {
    twitter: clamp(`🎵 "${title}" by ${artistName} is live on Umhlabatea. ${genre}, ${bpm} BPM. Artists keep 80%. Listen now →`),
    facebook: clamp(`New on Umhlabatea: "${title}" by ${artistName}. Fresh ${genre} in ${key}. Support the artist directly — 80% goes to them.`),
    instagram: clamp(`"${title}" · ${artistName} · ${genre} 🎧 #Amapiano #SouthAfricanMusic #Umhlabatea`),
  };

  // Answer-Engine phrases: how a voice assistant question would be phrased.
  const voiceSearch = [
    `play ${title} by ${artistName}`,
    `find ${genre} songs like ${title}`,
    `who made the song ${title}`,
    `${genre} music in ${key}`,
  ];

  // schema.org MusicRecording — the structured record answer engines read.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `urn:umhlabatea:track:${id}`,
    name: title,
    byArtist: { "@type": "MusicGroup", name: artistName },
    genre,
    duration: `PT${Math.floor(durationSec / 60)}M${durationSec % 60}S`,
    ...(priceRands != null
      ? {
          offers: {
            "@type": "Offer",
            price: priceRands,
            priceCurrency: "ZAR",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };

  return { description, keywords, social, voiceSearch, jsonLd };
}

export default { seoAeo };
