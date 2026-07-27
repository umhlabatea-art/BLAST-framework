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
  {
    id: "copywriter-b2b-saas-kit",
    name: "B2B SaaS Copywriter Kit",
    tagline: "Escape the price war — own the highest-value copy sub-niche.",
    slug: "copywriter-b2b-saas-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 1500, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 3700, blurb: "Prompts + Notion calendar + workflow doc." },
      premium: { name: "Premium", priceCents: 6700, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "real-estate-listing-copy-kit",
    name: "Real Estate Listing & Client Copy Kit",
    tagline: "Fair-housing-safe listings in minutes, not an hour.",
    slug: "real-estate-listing-copy-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 1700, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 3700, blurb: "Prompts + Notion tracker + workflow doc." },
      premium: { name: "Premium", priceCents: 6700, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "bookkeeper-client-comms-kit",
    name: "Bookkeeper & Accountant Client-Comms Kit",
    tagline: "Systematize the client emails you send every month.",
    slug: "bookkeeper-client-comms-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 1500, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 3700, blurb: "Prompts + Notion tracker + workflow doc." },
      premium: { name: "Premium", priceCents: 6700, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "saas-customer-success-kit",
    name: "SaaS Customer Success Kit",
    tagline: "Cut time-to-value and save at-risk accounts.",
    slug: "saas-customer-success-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 2700, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 6900, blurb: "Prompts + Notion tracker + workflow doc." },
      premium: { name: "Premium", priceCents: 12900, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "grant-writer-proposal-kit",
    name: "Grant Writer Proposal Kit",
    tagline: "Draft the whole proposal faster — LOI to impact report.",
    slug: "grant-writer-proposal-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 1900, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 4700, blurb: "Prompts + Notion grants calendar + workflow doc." },
      premium: { name: "Premium", priceCents: 9700, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "attorney-admin-drafting-kit",
    name: "Solo Attorney Admin & Drafting Kit",
    tagline: "Reclaim billable hours from client-comms and first-draft overhead.",
    slug: "attorney-admin-drafting-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 2900, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 8900, blurb: "Prompts + Notion matter tracker + workflow doc." },
      premium: { name: "Premium", priceCents: 15900, blurb: "Core + walkthrough + bonuses + updates." },
    },
  },
  {
    id: "physician-admin-kit",
    name: "Physician Practice-Admin Kit",
    tagline: "Non-clinical admin, done faster — never clinical decisions.",
    slug: "physician-admin-kit",
    tiers: {
      entry: { name: "Entry", priceCents: 2900, blurb: "Core prompts, single PDF." },
      core: { name: "Core", priceCents: 7900, blurb: "Prompts + Notion practice-ops tracker + workflow doc." },
      premium: { name: "Premium", priceCents: 14900, blurb: "Core + walkthrough + bonuses + updates." },
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
