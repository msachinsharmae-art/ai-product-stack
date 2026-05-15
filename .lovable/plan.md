## Goal

Produce a recruiter-ready, ATS-optimized, single-page A4 resume for Sachin Kumar Sharma targeting **PM / APM / Product Ops / BA / AI Product** roles, plus a full coaching report.

## Deliverables (saved to `/mnt/documents/`)

1. **`Sachin_Kumar_Sharma_PM_Resume.pdf`** — final one-page A4, black & white, ATS-clean (no tables, no columns, no icons, no graphics)
2. **`Sachin_Kumar_Sharma_PM_Resume.docx`** — editable Word version, identical layout
3. **In-chat coaching report** containing:
   - ATS optimization score estimate (with rationale)
   - Missing keywords suggestions
   - Recruiter impression analysis (5-second scan test)
   - Top strengths of the profile
   - Weak areas to improve
   - Suggested PM/APM role targeting (companies + role types)
   - Recommended LinkedIn headline (3 variants)

## Resume Structure (one A4 page, single column)

```
SACHIN KUMAR SHARMA
PM / APM / Product Ops · Gurugram · Phone · Email · LinkedIn · GitHub
─────────────────────────────────────────────────────────────────
PROFESSIONAL SUMMARY      (3–4 sharp lines)
EXPERIENCE                (Zimyo: 6–7 bullets · Innoterra: 3 · Ensuredit: 3 · FieldAssist: 3)
PROJECTS                  (AI Product Ops Stack · JobMatch — 2 bullets each, product-framed)
SKILLS                    (Product · Analytics · AI & Automation · Technical · Tools)
EDUCATION                 (B.Tech Mech, Kurukshetra Univ, CGPA 8.6)
CERTIFICATIONS            (compressed one-liner)
```

## Content Strategy

- Rewrite every bullet to **Action Verb + What + How + Quantified Impact**
- Front-load metrics: 200% OKR · 40% QA reduction · 91% on-time delivery · 30% adoption · 25% engagement · 20pt CSAT · -20% MTTR
- Frame Customer Success roles as **Product Discovery / Technical PM** work (not support)
- Reframe projects as **shipped AI products**, not "student projects" — emphasize problem, stack, AI angle, business outcome
- Pack ATS keywords naturally: Product Strategy, PRD, Roadmapping, Discovery, User Stories, Stakeholder Management, SQL, REST APIs, Agile/Scrum, A/B Testing, Cohort Analysis, Prompt Engineering, LLM Workflow Automation, Cross-functional, GTM
- Tone: executive, sharp, recruiter-scannable in 5 seconds

## Technical approach

- Generate the PDF with **ReportLab Platypus** (single column, no tables) — Helvetica, 10pt body / 9pt for dense lines, tight 1.15 leading, 0.55–0.6" margins to guarantee one-page fit on A4
- Generate the DOCX with **docx-js** mirroring the same content and hierarchy (Arial, no tables, no columns)
- Validate page count = 1 by rendering the PDF to JPEGs and visually inspecting; iterate font/spacing if it spills to page 2
- Re-verify the DOCX opens cleanly

## Out of scope

- No website/UI changes to the Lovable project — this is a pure artifact-generation task
- No GitHub push (that requires your account); I'll deliver the files for you to download and upload to your `about-me` repo if desired

Approve and I'll generate both files plus the coaching report.