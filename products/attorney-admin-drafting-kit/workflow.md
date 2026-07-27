# Solo Attorney Admin & Drafting Kit — Workflow & Notion Tracker

The prompts draft the administrative and first-draft layer; this workflow keeps
every output behind the attorney-review gate and every matter organized.

## The intake-to-matter pipeline

1. **Inquiry** → prompt 1.1 intake/screening email (facts only, no advice, no
   attorney-client relationship until engaged). Run your conflicts check.
2. **Engage** → prompt 2.1 engagement-letter draft. **⚑ Attorney review** of
   every fee, scope, and jurisdiction term before it's sent.
3. **Work the matter** → status updates (3.1), internal demand-letter drafts
   (4.1), document summaries (5.1), client explainers (6.1).
4. **⚑ Attorney-review gate (every external item)** → nothing reaches a client,
   opposing counsel, or a court without licensed-attorney review. Verify all law
   and citations against primary sources.

## The two hard rules

- **Attorney review is mandatory and universal.** Every output is an internal
  first draft. The review checkpoint isn't a formality — it's what keeps this on
  the right side of unauthorized-practice-of-law rules and your duty of
  competence.
- **Never trust the model on the law.** AI fabricates citations; lawyers have
  been sanctioned for filing hallucinated cases. The prompts leave `[LEGAL BASIS —
  ATTORNEY TO INSERT]` placeholders on purpose. Verify everything.

## Confidentiality

Keep privileged and confidential client information out of public AI tools.
Redact identifiers, or use a data-protected/enterprise model with appropriate
safeguards and (where required) client consent.

## Notion matter tracker (schema)

Create a Notion database named **Matters**, viewed as a Board grouped by `Stage`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Matter | Title | Client + matter |
| Client | Text | |
| Practice area | Select | |
| Stage | Status | Intake · Conflicts check · Engaged · Active · Review pending · Closed |
| Conflicts cleared? | Checkbox | ⚑ before Engaged |
| Engagement signed? | Checkbox | ⚑ before Active |
| Attorney review done? | Checkbox | ⚑ before any external send |
| Key deadline | Date | Statute/court deadline |
| Next action | Text | |

### Views
- **Board by Stage** — matter pipeline.
- **Table filtered `Attorney review done? = unchecked` AND anything external**
  — the review gate; must clear before sending.
- **Table sorted by Key deadline** — deadline management.

## Cadence
- **Per output:** no external send before the attorney-review checkbox is checked.
- **Daily:** review upcoming deadlines.
- **Per new client:** conflicts check and signed engagement before substantive work.
