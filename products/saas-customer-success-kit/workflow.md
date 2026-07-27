# SaaS Customer Success Kit — Workflow & Notion Tracker

The prompts draft the touchpoints; this workflow maps them to the customer
lifecycle and the health signals that tell you which one to send.

## The customer-lifecycle pipeline

1. **Onboard** → prompt 1.1 sequence + 2.1 in-app nudges, aimed at the first
   activation milestone.
2. **Adopt** → in-app nudges (2.1) and help docs (5.1) drive deeper usage.
3. **Review** → prompt 3.1 QBR narrative at each business review, tied to the
   customer's stated goals.
4. **Retain** → when health drops, prompt 4.1 churn-save (diagnose first); after
   a loss, 4.2 win-back.
5. **Expand** → prompt 6.1 for healthy, high-fit accounts.

## Health-signal triggers

Let account health choose the touchpoint, not the calendar:

| Signal | Touchpoint |
| --- | --- |
| New account, pre-activation | Onboarding (1.1), nudges (2.1) |
| Usage plateau | Adoption nudges (2.1), help docs (5.1) |
| Renewal/QBR window | QBR narrative (3.1) |
| Usage drop / champion left | Churn-save (4.1) |
| Strong usage, unused adjacent value | Expansion (6.1) |

## Guardrails

- **Promises must be real.** No SLA, roadmap, or feature commitment that isn't
  true. CS builds trust; an overpromise breaks it and creates liability.
- **Only real metrics.** QBRs and reports use verified usage/outcome data, never
  model-invented numbers.
- **Customer data stays protected.** Don't paste customer PII or confidential
  data into public AI tools; use approved/enterprise tooling.

## Notion account-health tracker (schema)

Create a Notion database named **Accounts**, viewed as a Board grouped by
`Health`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Account | Title | Customer name |
| Segment | Select | SMB · Mid-market · Enterprise |
| Health | Status | Onboarding · Healthy · At risk · Churned · Expanding |
| Activated? | Checkbox | Hit first value milestone |
| Renewal date | Date | Drives QBR timing |
| Last touch | Date | |
| Next play | Text | Which prompt/touchpoint to run |
| ARR | Number | |

### Views
- **Board by Health** — daily triage.
- **Table filtered `Health = At risk`** — churn-save queue (prompt 4.1).
- **Table filtered `Renewal date` within 60 days** — QBR/renewal prep.

## Cadence
- **Daily:** triage the At-risk column.
- **Weekly:** review the Board; assign a next play to every account.
- **Per renewal:** run the QBR narrative from real data.
