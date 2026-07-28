/** Re-export brand tokens for places that need raw values (icons, gradients). */
import { palette, semantic, fonts } from "@umhlabatea/core";

export { palette, semantic, fonts };

/** Format an integer amount of Rands, e.g. 88.8 -> "R88.80". */
export function rands(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

/** Format seconds as m:ss. */
export function duration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Compact play counts, e.g. 125000 -> "125K". */
export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/** Deterministic gradient pair for a cover placeholder, seeded by an id. */
export function coverGradient(seed: string): [string, string] {
  const pairs: [string, string][] = [
    [palette.terracotta, palette["deep-teal"]],
    [palette.ochre, palette.sage],
    [palette["burnt-orange"], palette.gold],
    [palette["pattern-purple"], palette["earth-brown"]],
    [palette.gold, palette.terracotta],
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  return pairs[h % pairs.length];
}
