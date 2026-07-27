# Recruiter Hiring-Copy System — Workflow & Notion Tracker

The prompts are only half the system. This is the workflow that turns them into
consistent, compliant, trackable hiring — and the human checkpoints that keep
you on the right side of EEOC scrutiny.

## The req-to-offer pipeline

Each stage maps to prompts in `prompts.md`. The **⚑ checkpoint** rows are where
a human must review before anything external is sent.

1. **Intake** — capture the role's must-have *skills* (not credentials) with the
   hiring manager.
2. **Job description** → prompt 1.1 (or 1.2 to de-bias an existing JD).
   **⚑ Checkpoint:** confirm no unnecessary degree requirement, no coded
   language, comp range policy applied.
3. **Sourcing** → prompt 2.1 for Boolean strings.
4. **Screening questions** → prompt 3.1. Ask the *same* set of every candidate.
5. **Outreach** → prompts 4.1 / 4.2.
   **⚑ Checkpoint:** personalization references a skill/achievement, never a
   protected characteristic.
6. **Interviews** → prompt 5.1 scorecard, one per interviewer, same competencies.
   **⚑ Checkpoint:** decisions justified against competencies, not "culture fit".
7. **Decision** → rejection (6.1) or offer summary (6.2).
   **⚑ Checkpoint:** rejection reasons reference role criteria only.

## Human-in-the-loop rule

AI writes the draft; the recruiter owns the decision and the words that leave
the building. Never auto-send an AI-generated candidate communication. Never let
a model *rank or reject* candidates — it drafts, you decide. This isn't
bureaucracy; it's what keeps an adverse-impact claim off your desk.

## Notion hiring tracker (schema)

Create a Notion database named **Hiring Pipeline** with these properties. Import
this table as a starting point, then switch the view to a Board grouped by
`Stage`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Candidate | Title | Name or anonymized ID |
| Role | Select | One per open req |
| Stage | Status | Sourced · Screen · Interview · Offer · Hired · Rejected |
| Source | Select | Inbound · Referral · Sourced · Agency |
| Screen score | Number | From the prompt 3.1 rubric (avg) |
| Scorecard avg | Number | From prompt 5.1 scorecards |
| Structured Qs asked? | Checkbox | ⚑ must be checked before Interview stage |
| Compliance reviewed? | Checkbox | ⚑ must be checked before any external send |
| Next action | Text | e.g. "send offer summary" |
| Owner | Person | Recruiter responsible |
| Last touch | Date | Drives follow-up nudges |

### Views to add

- **Board by Stage** — daily pipeline standup.
- **Table filtered `Compliance reviewed? = unchecked` AND Stage ≠ Sourced** —
  your pre-send safety net.
- **Calendar by Last touch** — surfaces candidates going cold (trigger prompt 4.2).

## Cadence

- **Daily:** work the Board; anything sitting >3 days gets a next action.
- **Weekly:** audit the compliance-review filter view — it should be empty for
  anyone past Sourced.
- **Per hire:** archive the req, note time-to-fill, and reuse the winning JD as a
  template for the next similar role.
