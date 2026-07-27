# Financial Advisor Content Kit — Workflow & Notion Tracker

The prompts draft the content; this workflow is what keeps you inside FINRA Rule
2210 and the SEC Marketing Rule. The non-negotiable step is **pre-use
supervisory approval** — no AI-drafted client communication goes out until a
principal has reviewed it.

## The create → review → archive pipeline

1. **Draft** — pick the prompt in `prompts.md`, keep the disclosure block and
   fair-balance language.
2. **Self-check** — read the model's "compliance flags" list; soften any
   performance-promise, prediction-as-certainty, or unbalanced-benefit language.
3. **⚑ Supervisory review** — route to your CCO / designated principal for
   **pre-use approval**. This applies to *retail communications* per Rule 2210;
   when in doubt, review it. Record who approved and when.
4. **Send** — only after approval.
5. **Archive** — retain the communication and its approval per your firm's
   recordkeeping obligations (books-and-records rules).

## Human-in-the-loop is the baseline

Regulators name **human oversight** as the expected baseline for GenAI in
advice-adjacent workflows. The model never sends, never advises an individual
client on its own, and never makes performance claims you haven't approved. It
drafts; a licensed human owns and approves the words.

## AI-washing caution

Do not market that the firm "uses AI" to manage money, pick securities, or
generate returns unless that is literally, verifiably true. Overstating AI
capabilities is what drew the SEC's 2024 enforcement actions. If you mention AI
at all, describe exactly and only what it does (e.g. "we use AI to help draft
client education, which our advisors review and approve").

## Notion compliance-review tracker (schema)

Create a Notion database named **Content Compliance Log**. This *is* part of your
recordkeeping story — treat it as an audit trail, not a to-do list.

| Property | Type | Options / notes |
| --- | --- | --- |
| Title | Title | Piece name, e.g. "Q3 volatility note" |
| Type | Select | Review summary · Market commentary · Prospecting · Newsletter · Event · Meeting notes |
| Audience | Select | Existing client · Prospect · Public |
| Retail communication? | Checkbox | Drives Rule 2210 review requirement |
| Status | Status | Drafted · In review · Approved · Sent · Archived |
| Reviewed by | Person | CCO / principal — ⚑ required before Sent |
| Approval date | Date | Pre-use approval timestamp |
| Disclosures attached? | Checkbox | ⚑ must be checked before Approved |
| Fair-balance applied? | Checkbox | ⚑ must be checked before Approved |
| Archive link | URL | Where the record is retained |

### Views to add

- **Board by Status** — see what's waiting on review.
- **Table filtered `Status = In review`** — the CCO's queue.
- **Table filtered `Status = Sent` AND `Archive link` is empty** — recordkeeping
  gaps to close.

## Cadence

- **Per piece:** never skip the ⚑ review row.
- **Monthly:** confirm the archive has a record for everything marked Sent.
- **Per model update:** re-review your standing templates when the AI model
  changes — phrasing that was compliant may drift.
