# Recruiter Hiring-Copy System — Prompt Pack (Core)

> **Before you send anything a candidate will see, read `DISCLAIMER.md`.**
> Every prompt below defaults to inclusive, skills-based language. Keep those
> defaults in place — they are the compliance layer you paid for. Replace every
> `[BRACKET]` with your specifics; delete guidance in _italics_.

---

## 1. Job descriptions

### 1.1 — Inclusive job description from scratch

```
You are an expert technical recruiter writing an inclusive job description.

Role: [JOB TITLE]
Team / department: [TEAM]
Seniority: [LEVEL]
Location / work model: [ONSITE / HYBRID / REMOTE + REGION]
Must-have skills (skills, not credentials): [3-6 SKILLS]
Nice-to-have skills: [OPTIONAL SKILLS]
Compensation range: [RANGE OR "omit"]

Write a job description with these sections: About the role, What you'll do,
What we're looking for, Nice to have, How we work.

Constraints (do not violate):
- Use skills-based criteria only. Do NOT require a specific degree unless it is
  a legal requirement for the role; if it is, say why.
- Remove gender-coded, age-coded, and ability-coded language (e.g. "rockstar",
  "young and energetic", "he/she", "recent grad").
- No proxies for protected classes (age, race, sex, disability, national
  origin, religion, pregnancy, veteran status).
- Encourage applicants who meet most — not all — requirements to apply.
- Keep it under [WORD COUNT] words, plain English, reading level ~grade 9.
```

### 1.2 — De-bias an existing job description

```
Rewrite the job description below to be inclusive and skills-based without
changing the actual requirements of the role. Flag, in a short list at the end,
every phrase you changed and why (gender-coded / age-coded / ability-coded /
protected-class proxy / unnecessary credential).

Job description:
"""
[PASTE EXISTING JD]
"""
```

---

## 2. Boolean / screening search strings

### 2.1 — Boolean sourcing string

```
Build 3 Boolean search strings (LinkedIn Recruiter syntax) to source candidates
for this role. Vary them: one strict, one broad, one skills-adjacent.

Role: [JOB TITLE]
Core skills: [SKILLS]
Acceptable adjacent titles: [TITLES]
Locations: [LOCATIONS]
Exclusions: [TITLES/TERMS TO EXCLUDE]

For each string, give a one-line note on who it will surface. Do not include
filters that act as proxies for age, sex, or other protected characteristics
(e.g. graduation year, "digital native").
```

---

## 3. Structured screening questions

### 3.1 — Consistent screening question set

```
Write [NUMBER] screening questions for a [JOB TITLE] to be asked identically of
every candidate (structured screening). For each question, provide:
- the question,
- what a strong answer demonstrates,
- a 1-5 scoring anchor.

Base questions strictly on the must-have skills: [SKILLS]. Do not ask about
protected characteristics or their proxies (family plans, age, health,
citizenship beyond legal work-authorization, etc.). Include exactly one
work-authorization question phrased neutrally.
```

---

## 4. Candidate outreach / InMail

### 4.1 — Personalized outreach

```
Write a short, personalized outreach message (max 120 words) to a passive
candidate for [JOB TITLE].

Candidate signal I can reference: [SPECIFIC, e.g. "led a migration to X",
"maintains open-source library Y"]
What's compelling about the role: [1-2 POINTS]
Company: [COMPANY, ONE LINE]
Call to action: [e.g. "open to a 15-min intro this week?"]

Tone: warm, specific, no hype, no "I came across your profile". Do not reference
anything that could signal a protected characteristic.
```

### 4.2 — Follow-up nudge

```
Write a 2-message follow-up sequence for a candidate who didn't reply to the
outreach above. Message 1 at day 4, message 2 at day 9. Each under 70 words,
adds one new reason to talk, easy to decline.
```

---

## 5. Interview scorecards (skills-based)

### 5.1 — Structured interview scorecard

```
Create a structured interview scorecard for [JOB TITLE].

Competencies to assess (from the must-have skills): [SKILLS]
Interview stage: [SCREEN / TECHNICAL / ONSITE / FINAL]

For each competency provide: a definition, 2 suggested questions, and a 1-4
rating rubric (1 = no evidence, 4 = strong evidence) with a concrete behavioral
anchor per level. End with an overall recommendation field
(Strong yes / Yes / No / Strong no) that requires written justification tied to
the competencies — not to "culture fit" or gut feel.
```

---

## 6. Rejection & offer

### 6.1 — Respectful rejection email

```
Write a respectful rejection email to a candidate who [REACHED STAGE].

Role: [JOB TITLE]
Optional specific, kind feedback: [FEEDBACK OR "none"]
Keep the door open: [YES/NO]

Under 130 words, warm and human, no false promises. Do not state a reason that
references a protected characteristic. If no feedback is provided, do not invent
one — keep it gracious and general.
```

### 6.2 — Offer-letter summary draft

```
Draft a plain-English offer summary email (not the formal contract) for the
successful candidate.

Role: [JOB TITLE]
Start date: [DATE]
Compensation: [DETAILS]
Key terms to highlight: [PTO / EQUITY / REMOTE / ETC.]
Deadline to respond: [DATE]

Warm and clear. End by noting the formal offer letter/contract will follow and
is the binding document. Flag any placeholder I still need to fill.
```

---

_These prompts produce **drafts**. A human recruiter must review every output
for accuracy and EEOC compliance before it reaches a candidate. See
`DISCLAIMER.md`._
