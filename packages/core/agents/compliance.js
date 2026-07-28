/**
 * Rights-compliance agent (offline stub).
 *
 * SAMRO, CAPASSO and RISA have **no public API** (confirmed in the platform's
 * API & legal guides), so "handling registration" means the agent *prepares*
 * the correct submission payload and *tracks* its status through a state
 * machine — it does not call a live endpoint. When a real integration or portal
 * automation becomes available, it slots in at `advance()` without changing the
 * data model the app renders.
 *
 * Bodies:
 *   - SAMRO   — performance rights (composition). Emits work-registration fields.
 *   - CAPASSO — mechanical reproduction rights. Emits a CSV row.
 *   - RISA    — issues the ISRC recording code.
 */

/** Ordered lifecycle. Each registration advances one step at a time. */
export const STATES = ["draft", "prepared", "submitted", "registered"];

export const BODIES = {
  samro: { id: "samro", name: "SAMRO", right: "Performance rights (composition)" },
  capasso: { id: "capasso", name: "CAPASSO", right: "Mechanical reproduction rights" },
  risa: { id: "risa", name: "RISA", right: "ISRC recording code" },
};

function assertBody(bodyId) {
  if (!BODIES[bodyId]) throw new Error(`Unknown rights body: ${bodyId}`);
}

/** Build the SAMRO work-registration field set from a track + its writers. */
export function prepareSamroPayload(track, writers) {
  return {
    workTitle: track.title,
    duration: track.durationSec,
    genre: track.genre,
    writers: writers.map((w) => ({
      name: w.name,
      role: w.role || "composer",
      share: w.share,
    })),
    totalShare: writers.reduce((sum, w) => sum + (w.share || 0), 0),
  };
}

/** Build a single CAPASSO CSV row (header + values) for mechanical rights. */
export function prepareCapassoRow(track, artistName, isrc) {
  const header = ["Work Title", "Composer", "ISRC", "Duration", "Recording Artist"];
  const values = [track.title, track.writers?.map((w) => w.name).join("; ") || artistName, isrc || "", String(track.durationSec), artistName];
  return { header, values, csv: `${header.join(",")}\n${values.join(",")}` };
}

/**
 * Generate a deterministic ISRC in the ZA-U01-YY-NNNNN format (RISA registrant).
 * Real codes come from RISA; this shape is valid and stable for a given track.
 */
export function prepareIsrc(track, year = 26) {
  const n = String(Math.abs(hash(track.id)) % 100000).padStart(5, "0");
  return `ZA-U01-${String(year).padStart(2, "0")}-${n}`;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (Math.imul(31, h) + String(s).charCodeAt(i)) | 0;
  return h;
}

/** Create a fresh registration in the `draft` state. */
export function createRegistration(bodyId, track, meta = {}) {
  assertBody(bodyId);
  return {
    id: `reg_${bodyId}_${track.id}`,
    bodyId,
    bodyName: BODIES[bodyId].name,
    trackId: track.id,
    trackTitle: track.title,
    state: "draft",
    payload: null,
    meta,
    history: [{ state: "draft", at: null }],
  };
}

/**
 * Advance a registration one step. When moving `draft → prepared`, the correct
 * body-specific payload is generated from the supplied context. Pure: returns a
 * new object, never mutates the input.
 */
export function advance(registration, context = {}) {
  const idx = STATES.indexOf(registration.state);
  if (idx === -1) throw new Error(`Invalid state: ${registration.state}`);
  if (idx === STATES.length - 1) return registration; // already registered

  const nextState = STATES[idx + 1];
  let payload = registration.payload;

  if (nextState === "prepared") {
    const { track, artistName, writers = [], isrc } = context;
    if (!track) throw new Error("advance() to 'prepared' requires context.track");
    if (registration.bodyId === "samro") payload = prepareSamroPayload(track, writers.length ? writers : [{ name: artistName, role: "composer", share: 100 }]);
    else if (registration.bodyId === "capasso") payload = prepareCapassoRow(track, artistName, isrc);
    else if (registration.bodyId === "risa") payload = { isrc: isrc || prepareIsrc(track) };
  }

  return {
    ...registration,
    state: nextState,
    payload,
    history: [...registration.history, { state: nextState, at: context.at || null }],
  };
}

export default { STATES, BODIES, createRegistration, advance, prepareSamroPayload, prepareCapassoRow, prepareIsrc };
