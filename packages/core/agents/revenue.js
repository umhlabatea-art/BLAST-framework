/**
 * Revenue agent (offline stub).
 *
 * Turns a sale into the artist's 80/20 split, schedules the payout, and models
 * affiliate-program income. Shares and policy come from the shared theme's
 * `revenueConfig`, so there is one canonical definition of "80% to the artist".
 */
import { revenueConfig } from "../theme/index.js";

/**
 * Compute the split for a single sale.
 * @param {number} amountRands - gross sale amount in Rands.
 * @param {number} [createdAtMs] - sale timestamp; payout is scheduled relative to it.
 */
export function splitSale(amountRands, createdAtMs = 0) {
  if (typeof amountRands !== "number" || amountRands <= 0) {
    throw new Error("amountRands must be a positive number");
  }
  const artistShare = round2(amountRands * revenueConfig.artistShare);
  const platformShare = round2(amountRands - artistShare);
  const payoutAtMs = createdAtMs ? createdAtMs + revenueConfig.payoutDelayHours * 3600 * 1000 : 0;
  return {
    gross: round2(amountRands),
    artistShare,
    platformShare,
    payoutDelayHours: revenueConfig.payoutDelayHours,
    payoutAtMs,
  };
}

/** Affiliate income line item for a given program and gross amount. */
export function affiliateEarning(program, grossRands) {
  return {
    programId: program.id,
    programName: program.name,
    partner: program.partner,
    commission: program.commission,
    earnedRands: round2(grossRands * program.commission),
  };
}

/**
 * Aggregate an artist's earnings across many sales into a dashboard summary,
 * separating what has cleared the payout window from what is still pending.
 */
export function summarize(sales, nowMs = Date.now()) {
  let gross = 0;
  let artist = 0;
  let paidOut = 0;
  let pending = 0;
  for (const sale of sales) {
    const s = splitSale(sale.amountRands, sale.createdAtMs || 0);
    gross += s.gross;
    artist += s.artistShare;
    if (s.payoutAtMs && s.payoutAtMs <= nowMs) paidOut += s.artistShare;
    else pending += s.artistShare;
  }
  return {
    salesCount: sales.length,
    grossRands: round2(gross),
    artistEarningsRands: round2(artist),
    paidOutRands: round2(paidOut),
    pendingRands: round2(pending),
    belowThreshold: round2(pending) < revenueConfig.payoutThresholdRands,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export default { splitSale, affiliateEarning, summarize };
