# B2B SaaS Copywriter Kit — Workflow & Notion Tracker

The prompts draft the copy; this workflow keeps your client work organized and
your claims defensible.

## The research → draft → client-review pipeline

1. **Research** — gather the shared inputs (positioning, ICP, voice-of-customer
   quotes, and — critically — the client's **provable** proof). Copy is only as
   good as the research behind it.
2. **Draft** — pick the asset prompt in `prompts.md`, paste the shared inputs.
3. **Edit for voice** — rewrite in the client's brand voice; the model gives you
   structure and angles, not the final register.
4. **✎ Substantiation check** — for every performance, comparison, or "results"
   claim, confirm the client can back it up. Strip or soften anything they
   can't. This is the FTC guardrail (see `DISCLAIMER.md`).
5. **Client review** — deliver with the `[NEEDS PROOF]` flags visible so the
   client supplies evidence or approves the softer version.
6. **Ship & log** — schedule/hand off, and record it in the content calendar.

## The swipe-file habit

Keep a Notion database of winning subject lines, hooks, and CTAs from your own
sends (with open/click rates where you have them). Feed the best performers back
into the prompts as examples — your swipe file is your moat, not the prompts.

## Notion content calendar (schema)

Create a Notion database named **Content Pipeline**, viewed as a Board grouped by
`Status`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Asset | Title | e.g. "Onboarding email 3" |
| Client | Select | One per client |
| Type | Select | Email · Landing page · Ad · SEO brief · Social |
| Status | Status | Briefed · Drafting · Substantiation · Client review · Approved · Shipped |
| Claims substantiated? | Checkbox | ✎ must be checked before Client review |
| Due | Date | Deadline |
| Live link | URL | Where it shipped |
| Result | Text | Open/click/conversion once known |

### Views
- **Board by Status** — weekly workload.
- **Table filtered `Status = Substantiation`** — your pre-delivery safety net.
- **Calendar by Due** — deadline view per client.

## Cadence
- **Per asset:** never skip the substantiation row.
- **Weekly:** review the Board; move stalled drafts.
- **Monthly:** update the swipe file with what actually converted.
