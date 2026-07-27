# Umhlawati Prompt Toolkits — Product Catalog

Role-bound, workflow-embedded AI prompt **systems** for professionals. Not a
generic "10,000 prompts" dump — each toolkit is a small, opinionated set of
fill-in-the-`[bracket]` prompts wrapped in a workflow doc, a Notion tracker
spec, and a compliance layer, so a buyer goes from download to first usable
draft in minutes.

This directory is the sellable content. The storefront in [`/src`](../src)
serves this catalog for checkout (see the [go-live playbook](#go-live-playbook)
for how the digital content is actually delivered in production).

## The three launch niches

| Toolkit | Buyer | Core price | Compliance moat |
| --- | --- | --- | --- |
| [Recruiter Hiring-Copy System](./recruiter-hiring-copy-system/) | Recruiters / TA | **$49** | EEOC — inclusive-language defaults, skills-based criteria |
| [Financial Advisor Content Kit](./financial-advisor-content-kit/) | Advisors / RIAs | **$79** | FINRA Rule 2210 + SEC Marketing Rule 206(4)-1 |
| [Consultant Deliverable Toolkit](./consultant-deliverable-toolkit/) | Management consultants | **$59** | Draft-requires-review + client confidentiality |

These three are the highest-composite-score niches in the market research
(willingness-to-pay × market size × low saturation × ease of proving ROI):
expense-budget buyers, meaningfully less saturated than real-estate and generic
marketing packs, and each carries a regulatory overlay that scares off amateur
sellers — which is exactly why a professionally disclaimered kit commands a
premium.

## Pricing architecture

Every toolkit ships as a three-tier ladder. The **Core** tier is the authored
deliverable in this repo; Entry is a trimmed subset and Premium adds a
walkthrough + bonuses + update access.

| Tier | Format | Recruiter | Fin. Advisor | Consultant |
| --- | --- | --- | --- | --- |
| **Entry** | Core prompts, single PDF | $19 | $27 | $19 |
| **Core** | Prompts + Notion tracker + workflow doc | $49 | $79 | $59 |
| **Premium** | Core + video walkthrough + bonuses + updates | $99 | $149 | $129 |

**Why the price holds (value-equation logic).** Value =
(Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort). Each kit
maximises the dream outcome ("fill the role faster / pass compliance review /
ship the proposal today") and perceived likelihood (named workflow, example
outputs), while driving time-delay and effort toward zero (instant download,
copy-paste-ready brackets, no learning curve).

**The ROI anchor is the whole pitch.** Two hours saved per week ≈ 100 hours a
year. Against the buyer's own billing rate, the kit costs less than 20 minutes
of their time and returns a hundred hours:

- Recruiter / HR specialist — AI cuts job-post creation time materially; the
  saved hours redeploy to candidate contact.
- Financial advisor — median compensation is six figures and client-facing
  time is the constraint; a compliant content engine protects the scarce hour.
- Management consultant — bills $100–$350/hr and loses 30–60 min of
  non-billable admin per billable hour; the toolkit reclaims it.

> Headcounts, adoption percentages, and "$X/month" seller figures cited in the
> product pages are the most recent citable estimates and, where self-reported,
> are directional only — not audited revenue. Re-verify before using any of them
> verbatim in launch copy.

## Compliance is the moat

Regulated niches carry real exposure, so every toolkit ships with a bold
disclaimer that outputs are **drafts requiring professional review** and do not
constitute legal, financial, or medical advice. The professional end-user — not
the tool — carries liability (reinforced by the EU AI Act, UK regulator
guidance, and South Africa's POPIA). Each kit's `DISCLAIMER.md` states the
niche-specific overlay:

- **Recruiting/HR** — EEOC / anti-discrimination: inclusive-language defaults,
  skills-based criteria, no protected-class proxies.
- **Financial** — FINRA Rule 2210 and SEC Marketing Rule 206(4)-1 apply to all
  AI-generated communications identically to human-written ones (pre-use
  approval, fair-balance, recordkeeping). The March-2024 SEC "AI-washing"
  settlements are the cautionary tale. Build in disclosure blocks and a
  route-to-compliance-before-sending workflow with a human checkpoint.
- **Consulting** — lighter touch: draft-review discipline and client
  confidentiality (never paste identifying client data into a public model).

## Go-live playbook (not executed in this repo)

The blueprint's business layer — how these files become a running business:

- **Gumroad = primary storefront.** Since Jan 1 2025 Gumroad is a full
  **Merchant of Record**: it calculates, collects, and remits global sales
  tax/VAT/GST on the seller's behalf. For a South African seller this removes
  the need to register for VAT across dozens of jurisdictions — the decisive
  reason to centre the business on Gumroad rather than Stripe-direct.
- **Do NOT sell standalone prompts on Etsy.** As of June 2025 Etsy prohibits
  selling AI prompts as standalone products.
- **Envato is not viable** for prompt output (AI-generated content barred from
  the download file).
- **Whop = strong secondary** for bundles and community/subscription upsell;
  **PromptBase = validation only** (price-capped) — use it to test titles, not
  for revenue.
- **Hostinger proprietary store = margin maximiser** once repeat buyers exist;
  migrate the email list there.

**Licensing.** Offer clear tiers: **personal use** (default, cheapest),
**commercial/team use** (higher). Do **not** grant resale / Master Resell
Rights on these premium professional kits — it cannibalises sales and dilutes
the brand.

**Refunds.** Digital-goods standard is "all sales final." Gumroad does not
refund its fee even on a refunded sale, so price in a buffer.

**South African tax note.** Gumroad's MoR status handles foreign VAT, but
Gumroad earnings are **foreign income and must be declared to SARS**. Keep
records in ZAR with exchange rate and date per payout. The local VAT
registration threshold is R1 million (~USD $60k) annual turnover. Consult a SA
tax practitioner re: provisional tax. This is orientation, not tax or legal
advice.

## Launch roadmap

- **Stage 1 (Weeks 0–4)** — ship the **Recruiter** kit first (highest composite
  score, lowest saturation). Benchmark to advance: 25 sales or 5 reviews in 30
  days.
- **Stage 2 (Weeks 4–10)** — add **Financial Advisor** and **Consultant** kits
  (monetise the compliance moat). Benchmark: $2,000 cumulative revenue triggers
  the Hostinger-store migration and email-list build.
- **Kill/re-position** any kit that fails to clear 25 sales in 60 days despite
  traffic; **double down** (membership + consultation upsell) on any niche that
  clears $5,000/mo.
