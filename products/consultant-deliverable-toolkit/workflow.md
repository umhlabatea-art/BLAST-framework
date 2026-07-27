# Consultant Deliverable Toolkit — Workflow & Notion Pipeline

The prompts draft the deliverables; this workflow keeps your pipeline moving and
your engagements organized so nothing stalls between lead and delivery.

## The lead → proposal → delivery pipeline

Each stage maps to prompts in `prompts.md`.

1. **Lead** — a prospect surfaces. Log it in the pipeline.
2. **Discovery** → prompt 2.1 to run a structured discovery call.
3. **Proposal** → prompt 1.1 to draft the proposal/SOW; 1.2 to tighten it.
   **✎ Review:** verify every `[VERIFY]` number and scope boundary yourself.
4. **Won → Delivery** — produce the work: executive summaries (3.1), slide
   narratives (4.1/4.2).
5. **Communication** → prompt 5.1 for weekly client updates through delivery.
6. **Close → Case study** → prompt 6.1, anonymized unless you have written
   permission to name the client.

## The review rule

AI drafts; you deliver. Your expertise, judgment, and accountability are what the
client is paying for — every draft gets your edit before it leaves. Treat any
number, benchmark, or claim the model produces as unverified until you've checked
it (the prompts mark these with `[VERIFY]` / `[SOURCE?]`).

## Client confidentiality

Never paste a client's confidential or non-public information into a public AI
tool. Anonymize inputs (industry descriptor instead of client name, ranges
instead of exact figures), or use a data-protected/enterprise model where your
engagement terms require it. This protects your client relationships and your own
liability. See `DISCLAIMER.md`.

## Notion proposal pipeline (schema)

Create a Notion database named **Engagement Pipeline** and view it as a Board
grouped by `Stage`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Opportunity | Title | Prospect / engagement name |
| Client | Text | Anonymized descriptor until signed |
| Stage | Status | Lead · Discovery · Proposal sent · Won · Delivering · Delivered · Lost |
| Deal size | Number | Estimated fee |
| Fee model | Select | Fixed · Retainer · Day rate |
| Proposal sent | Date | Drives follow-up cadence |
| Next action | Text | e.g. "follow up on proposal" |
| Confidentiality checked? | Checkbox | ✎ inputs anonymized before any AI use |
| Deliverables | Text | Links to the artifacts produced |
| Close date | Date | For win-rate & cycle-time tracking |

### Views to add

- **Board by Stage** — your weekly pipeline review.
- **Table filtered `Stage = Proposal sent`, sorted by `Proposal sent`** —
  chase stalled proposals (nudge after ~5 business days).
- **Table filtered `Stage = Delivering`** — active engagements needing updates
  (prompt 5.1).

## Cadence

- **Weekly:** review the Board; every active engagement gets a client update and
  every open proposal gets a next action.
- **Per proposal:** verify all `[VERIFY]` items before sending.
- **Per close:** write the case study while the results are fresh (prompt 6.1).
