# Physician Practice-Admin Kit — Workflow & Notion Tracker

The prompts draft **non-clinical administrative** content; this workflow keeps
that content organized and keeps PHI out of any public AI tool.

## The admin-content pipeline

1. **Templatize** → build reusable templates with merge fields (reminders 1.1/1.2,
   feedback 6.1) — never real patient data in the template.
2. **Coordinate** → administrative referral/coordination letters (2.1), with
   clinical content left for the physician to complete inside compliant systems.
3. **Market** → practice/service descriptions (3.1) and new-patient onboarding
   (4.1), reviewed for accuracy and non-clinical framing.
4. **Operate** → staff SOPs (5.1) for repeatable, HIPAA-aware admin processes.
5. **Merge & send** → merge real patient data only within your HIPAA-compliant
   EHR / practice-management / secure-messaging systems.

## The two hard rules

- **Non-clinical only.** These prompts never touch diagnosis, treatment, dosing,
  triage, or clinical decision support. Route anything clinical to the clinician
  and clinically-validated tools.
- **No PHI in public tools.** Draft with merge fields and generic placeholders.
  Real patient identifiers are added only inside compliant systems, ideally under
  a Business Associate Agreement where a vendor processes PHI.

## Notion practice-ops tracker (schema)

Create a Notion database named **Practice Admin Library**, viewed as a Board
grouped by `Type`.

| Property | Type | Options / notes |
| --- | --- | --- |
| Item | Title | Template/SOP name |
| Type | Select | Reminder · Referral · Marketing · Onboarding · SOP · Feedback |
| Status | Status | Draft · Reviewed · In use · Retired |
| Contains PHI? | Checkbox | ⚑ must be UNCHECKED — templates use merge fields only |
| Reviewed for accuracy? | Checkbox | ⚑ before In use |
| Owner | Person | |
| Last updated | Date | |

### Views
- **Board by Type** — the template/SOP library.
- **Table filtered `Contains PHI? = checked`** — must be empty; anything here is a
  compliance problem to fix immediately.
- **Table filtered `Reviewed for accuracy? = unchecked`** — pending review.

## Cadence
- **Per template:** confirm no PHI and accuracy review before it goes In use.
- **Quarterly:** review templates and SOPs for accuracy and compliance updates.
- **On policy change:** update affected SOPs and re-review.
