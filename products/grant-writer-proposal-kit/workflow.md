# Grant Writer Proposal Kit — Workflow & Notion Tracker

The prompts draft the components; this workflow runs the grant lifecycle and
guards the one thing that matters most to funders — accuracy.

## The prospect → submit → report pipeline

1. **Prospect** → prompt 5.1 to summarize funder fit from their real guidelines.
2. **Inquire** → prompt 1.1 LOI where required.
3. **Build the proposal** → needs statement (2.1), goals/objectives (3.1), logic
   model (3.2), budget narrative (4.1).
4. **✎ Fact-check pass** → resolve every `[VERIFY]` / `[NEEDS SOURCE]` flag;
   confirm each statistic traces to a real source; confirm budget numbers.
5. **Submit** → assemble into the funder's required format.
6. **Report** → prompt 6.1 for interim/final reports on real results — track the
   reporting deadlines as carefully as the application ones.

## The accuracy rule

The model drafts language around **data you provide and verify**. It never
originates a statistic, outcome, citation, or funder fact. A single fabricated
figure can cost the funder relationship and, for reporting, breach your grant
agreement. Every number is traceable to a source before submission.

## Notion grants calendar (schema)

Create a Notion database named **Grants Pipeline**, viewed as a Board grouped by
`Stage` and also as a Calendar by `Due date`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Grant | Title | Funder + program |
| Funder | Text | |
| Stage | Status | Prospect · LOI · Drafting · Fact-check · Submitted · Awarded · Declined · Reporting |
| Amount | Number | Requested / awarded |
| Due date | Date | Application deadline |
| Report due | Date | Post-award reporting deadline |
| Fact-checked? | Checkbox | ✎ must be checked before Submitted |
| Eligibility confirmed? | Checkbox | Before Drafting |
| Owner | Person | |
| Next action | Text | |

### Views
- **Calendar by Due date** — never miss a deadline (application *or* report).
- **Board by Stage** — pipeline status.
- **Table filtered `Stage = Fact-check`** — proposals pending verification.
- **Table filtered `Report due` within 30 days** — upcoming reporting obligations.

## Cadence
- **Weekly:** review the calendar for upcoming application and report deadlines.
- **Per proposal:** never submit before the fact-check checkbox is checked.
- **Post-award:** immediately log the reporting deadline(s).
