# Real Estate Listing & Client Copy Kit — Workflow & Notion Tracker

The prompts write the copy; this workflow keeps every listing moving and every
piece of published copy fair-housing-safe.

## The listing-to-close content pipeline

1. **New listing** — gather factual property details (features, updates,
   measurements). Log the listing.
2. **Listing copy** → prompt 1.1, then **✎ run prompt 1.2** (fair-housing review)
   on the result before it goes to the MLS.
3. **Launch** → social captions (4.1), buyer emails (2.1) to matching clients.
4. **Seller comms** → presentation talking points (3.1) and regular updates.
5. **Market content** → monthly update (5.1) using real data only.
6. **Offers** → negotiation/offer scripts (6.1), confirmed with your client
   before sending.

## The fair-housing checkpoint

Every published or client-facing piece passes a fair-housing review first. The
rule is simple: **market the property, not the person.** You — not the AI — are
legally responsible, so this checkpoint is non-negotiable. When in doubt, run
prompt 1.2 and cut the flagged phrase.

## Notion listing tracker (schema)

Create a Notion database named **Listings**, viewed as a Board grouped by
`Stage`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Address | Title | Property identifier |
| Client | Text | Seller name |
| Stage | Status | New · Copy drafted · Live · Under contract · Closed |
| List price | Number | |
| Fair-housing reviewed? | Checkbox | ✎ must be checked before Live |
| MLS link | URL | |
| Social posted? | Checkbox | |
| Days on market | Number | Auto/manual |
| Next action | Text | |

### Views
- **Board by Stage** — pipeline at a glance.
- **Table filtered `Stage = Copy drafted` AND `Fair-housing reviewed? = unchecked`**
  — your compliance safety net before anything goes Live.
- **Table sorted by Days on market** — listings needing a refresh.

## Cadence
- **Per listing:** never publish before the fair-housing checkbox is checked.
- **Weekly:** review the Board; refresh stale listings.
- **Monthly:** send the market update (prompt 5.1) with current data.
