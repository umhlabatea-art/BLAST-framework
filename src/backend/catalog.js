/**
 * Product catalog for the BLAST storefront.
 *
 * Single source of truth for what is for sale and — critically — what it
 * costs. Prices are resolved here, server-side, from a productId + tier; the
 * client never gets to name its own price. Adding a product means adding an
 * entry to CATALOG, nothing else.
 *
 * Each product maps to an authored toolkit under /products/<slug>. Prices come
 * from the blueprint's three-tier pricing ladder (Entry / Core / Premium).
 */

const TIER_ORDER = ["entry", "core", "premium"];

const CATALOG = [
  {
    id: "recruiter-hiring-copy-system",
    name: "Recruiter Hiring-Copy System",
    tagline: "EEOC-aware, copy-paste hiring prompts that fill roles faster.",
    slug: "recruiter-hiring-copy-system",
    tiers: {
      entry: { name: "Entry", priceCents: 1900, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 4900, blurb: "Prompts + Notion tracker + workflow doc." },
      premium: { name: "Premium", priceCents: 9900, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "financial-advisor-content-kit",
    name: "Financial Advisor Content Kit",
    tagline: "Client-ready content that routes through compliance before it sends.",
    slug: "financial-advisor-content-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 2700, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 7900, blurb: "Prompts + Notion tracker + workflow doc." },
      premium: { name: "Premium", priceCents: 14900, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "consultant-deliverable-toolkit",
    name: "Consultant Deliverable Toolkit",
    tagline: "Turn non-billable admin into billable hours.",
    slug: "consultant-deliverable-toolkit",
    tiers: {
      entry: { name: "Entry", priceCents: 1900, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 5900, blurb: "Prompts + Notion pipeline + workflow doc." },
      premium: { name: "Premium", priceCents: 12900, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
];

const byId = new Map(CATALOG.map((p) => [p.id, p]));

/** Public catalog for the storefront. Ordered tiers, no internal fields. */
export function listProducts() {
  return CATALOG.map((product) => ({
    id: product.id,
    name: product.name,
    tagline: product.tagline,
    slug: product.slug,
    tiers: TIER_ORDER.map((tier) => ({
      tier,
      name: product.tiers[tier].name,
      priceCents: product.tiers[tier].priceCents,
      blurb: product.tiers[tier].blurb,
    })),
  }));
}

/**
 * Resolve the authoritative price + display name for a product/tier.
 * Throws on anything not in the catalog — callers should surface a 400.
 * @returns {{ priceCents: number, productName: string }}
 */
export function resolvePrice(productId, tier) {
  const product = byId.get(productId);
  if (!product) throw new Error(`Unknown product: ${productId}`);
  const t = product.tiers[tier];
  if (!t) throw new Error(`Unknown tier '${tier}' for product ${productId}`);
  return { priceCents: t.priceCents, productName: `${product.name} — ${t.name}` };
}

export function findProduct(productId) {
  return byId.get(productId) || null;
}
