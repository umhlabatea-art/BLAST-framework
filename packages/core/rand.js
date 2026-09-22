/**
 * Tiny deterministic PRNG (mulberry32) + string hash. Used so every stub in the
 * platform — music generation, live-sales feed, seeded ids — produces stable,
 * reproducible output. Determinism is what lets the whole app run and be tested
 * offline without a database or network.
 */

/** Hash an arbitrary string into a 32-bit unsigned integer seed. */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Returns a deterministic RNG function in [0,1) from a numeric or string seed. */
export function seededRandom(seed) {
  let a = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministically pick one element of an array from a seed. */
export function pick(arr, seed) {
  return arr[Math.floor(seededRandom(seed)() * arr.length)];
}
