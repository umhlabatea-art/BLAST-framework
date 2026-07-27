# Bookkeeper & Accountant Client-Comms Kit — Workflow & Notion Tracker

The prompts draft the words; this workflow ties them to your monthly close
rhythm so no client and no communication slips.

## The client-lifecycle pipeline

1. **Onboard** → prompt 1.1 (welcome + document request) and 2.1 (engagement
   letter). **✎ Have the engagement letter reviewed** before first use.
2. **Monthly close** → prompt 4.1 to chase missing records, then 3.1 for the
   month-end summary once the books are closed.
3. **Advisory** → prompt 5.1 when you spot something worth a client memo (this is
   the higher-value work).
4. **Account management** → prompt 6.1 for price increases / scope changes.

## Guardrails baked into the workflow

- **Data stays out of public models.** Describe generically, or use a data-
  protected tool. Client financials and PII never get pasted into a public chat.
- **You own the numbers.** The model drafts wording around figures *you* provide
  and verify — it never calculates or infers a number.
- **Stay in your lane.** Bookkeeping communications summarize the books; they
  don't give tax, audit, or legal advice. Route those to a CPA/attorney.

## Notion client tracker (schema)

Create a Notion database named **Client Book**, viewed as a Board grouped by
`Close status`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Client | Title | Business name |
| Services | Multi-select | Bookkeeping · Payroll · AP/AR · Advisory |
| Close status | Status | Awaiting records · In progress · Closed · Sent summary |
| Engagement letter signed? | Checkbox | ✎ before work starts |
| Records complete? | Checkbox | Drives the chase sequence |
| Period | Text | Current close period |
| Fee | Number | Monthly fee |
| Next action | Text | |

### Views
- **Board by Close status** — your monthly close command center.
- **Table filtered `Records complete? = unchecked`** — who to chase (prompt 4.1).
- **Table filtered `Engagement letter signed? = unchecked`** — onboarding gaps.

## Cadence
- **Monthly:** work the Board top to bottom; every closed client gets a summary.
- **Weekly during close:** chase missing records.
- **Quarterly:** review which clients are ready for advisory memos (upsell).
