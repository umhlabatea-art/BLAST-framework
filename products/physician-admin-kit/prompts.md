# Physician Practice-Admin Kit — Prompt Pack (Core)

> **ADMINISTRATIVE, NON-CLINICAL USE ONLY.** These prompts are for practice
> administration — reminders, letters, marketing, SOPs. They are **not** for
> diagnosis, treatment, dosing, triage, or any clinical decision. **Never enter
> protected health information (PHI) — names, dates, record numbers, or any
> identifying detail — into a public AI tool.** Use generic placeholders and
> merge real data only inside your HIPAA-compliant systems. See `DISCLAIMER.md`.
> Replace every `[BRACKET]`.

---

## 1. Patient appointment / recall reminders

### 1.1 — Appointment reminder template

```
Write a set of appointment-reminder message templates (SMS short, email longer)
using MERGE FIELDS only — never real patient data.

Practice: [PRACTICE NAME]  ·  Appointment type (generic): [e.g. annual visit]
Fields to merge: {{FirstName}}, {{Date}}, {{Time}}, {{Location}}
Prep instructions (generic): [e.g. bring medication list]

Friendly, concise, include how to confirm/reschedule and a no-reply note. Provide
a same-day and a 48-hour-prior version. Do not include clinical advice.
```

### 1.2 — Recall / overdue-visit reminder

```
Write a recall reminder template (merge fields only) for patients due for a
routine, non-urgent [SERVICE TYPE, e.g. wellness visit]. Encouraging, not
alarming; clear CTA to schedule; note that questions go to the office. No clinical
guidance or risk statements.
```

---

## 2. Referral & coordination letters (administrative)

### 2.1 — Referral cover letter (administrative)

```
Draft an ADMINISTRATIVE referral cover letter template to another practice —
logistics and coordination only, with merge-field placeholders for any clinical
content the physician will complete separately.

Referring practice: [NAME]  ·  Referred-to specialty: [SPECIALTY]
Reason category (generic): [e.g. specialist evaluation]
Enclosures placeholder: {{Records/Results to follow via secure channel}}

Cover the administrative essentials (who, why in general terms, how records will
be sent securely, contact info). Insert [PHYSICIAN TO COMPLETE — CLINICAL] where
any clinical detail belongs. No clinical content generated here.
```

---

## 3. Practice-marketing content

### 3.1 — Service / practice description

```
Write practice-marketing copy for [PRACTICE NAME] about [SERVICE/OFFERING].

Audience: [PROSPECTIVE PATIENTS]  ·  Tone: [warm, professional, reassuring]
Facts to include (verified, non-clinical): [HOURS, LOCATION, INSURANCE, WHAT TO
EXPECT ADMINISTRATIVELY]

Describe the service and patient experience in general terms. Do NOT make medical
claims, guarantee outcomes, or imply results. Include a clear CTA to book. Add a
line that content is general information, not medical advice.
```

---

## 4. New-patient onboarding & FAQ

### 4.1 — New-patient welcome & FAQ

```
Write a new-patient welcome message and FAQ for [PRACTICE NAME] covering
administrative topics only.

Topics: [WHAT TO BRING, INSURANCE/BILLING, PORTAL SIGNUP, PARKING, ARRIVAL TIME,
CANCELLATION POLICY]

Warm and clear. FAQ as Q&A. Keep strictly to logistics and policies — no clinical
or triage guidance. Direct medical questions to the care team via the secure
portal or phone.
```

---

## 5. Staff SOPs & internal process docs

### 5.1 — Staff SOP

```
Write an internal Standard Operating Procedure for front-office/admin staff for
[PROCESS, e.g. patient check-in, handling records requests].

Steps (from my notes): [STEPS]
Roles involved: [ROLES]
Compliance notes: [e.g. HIPAA minimum-necessary, ID verification]

Structure: purpose, scope, step-by-step procedure, roles/responsibilities,
compliance reminders, and escalation. Reinforce HIPAA minimum-necessary and
secure-handling practices. Administrative process only.
```

---

## 6. Patient-satisfaction / feedback requests

### 6.1 — Feedback request template

```
Write a post-visit feedback/satisfaction request template (merge fields only) for
[PRACTICE NAME]. Thank the patient, link to a survey placeholder {{SurveyLink}},
keep it short, and note how feedback is used. No clinical content; no PHI in the
template itself.
```

---

_These prompts produce **administrative drafts only**. No clinical use, no PHI in
public tools, verify every patient-facing detail before use. See `DISCLAIMER.md`._
