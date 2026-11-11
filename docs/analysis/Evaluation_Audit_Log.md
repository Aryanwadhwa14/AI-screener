# GFI AI Resume Screener — Evaluation & Data Audit Log

**Audit Date:** 2026-11-11  
**Auditor:** Lead AI Engineer & Software Architect  
**Scope:** Complete dataset of 47 anonymized resumes evaluated against Canonical LCA (`JD1 (LCA).txt`) and UI/UX Designer Intern (`JD2.txt`) job descriptions.

---

## 1. Executive Summary

- **Total Ingested Documents:** 47 native `.docx` files.
- **Valid Resumes with Extractable Text:** 46 (97.9%).
- **Completely Empty / Corrupt Documents:** 1 (`anonymized_resume_1793685080327.docx`, assigned `CAND-005`).
- **Evaluation Outcomes:**
  - **LCA Qualified (≥ 55.0 pts):** 2 candidates (4.3%)
  - **UI/UX Qualified (≥ 50.0 pts):** 24 candidates (51.1%)
  - **Dual-Qualified (`BOTH`):** 0 candidates (0.0%) — confirms sharp orthogonal role separation.
  - **Uncertain / Not Qualified / Manual Review (`NEITHER_OR_UNCERTAIN`):** 21 candidates (44.7%).
  - **Zero-Score Prevention:** `CAND-005` (empty doc) was successfully protected from an artificial zero score; assigned `score = null`, `status = MANUAL_REVIEW_REQUIRED`, and `extraction_confidence = 0.0`.

---

## 2. Statistical Score Distribution

| Metric | LCA Consultant (Threshold 55.0) | UI/UX Designer Intern (Threshold 50.0) |
|---|---|---|
| **Evaluated Count** | 46 candidates (1 null excluded) | 46 candidates (1 null excluded) |
| **Minimum Score** | 2.0 / 100 | 0.0 / 100 |
| **Maximum Score** | 63.0 / 100 | 80.0 / 100 |
| **Mean (Average)** | 19.9 / 100 | 39.5 / 100 |
| **Median** | 12.0 / 100 | 58.0 / 100 |
| **Qualified Count** | **2 candidates** | **24 candidates** |
| **Qualified Rate** | **4.3%** | **52.2%** |

---

## 3. Detailed Audit of Top-Ranked Candidates

### A. LCA Consultant (Top Qualified Candidates)

#### 1. Candidate `CAND-047` — Rank #1 (Score: 63.0 / 100 — QUALIFIED)
- **Primary Tooling:** GaBi software proficiency explicitly verified in industrial life cycle modeling.
- **Standards:** General LCA methodology applied; partial ISO standard citation.
- **Experience:** Verified 3+ years experience as "Energy & Sustainability Consultant" (exceeds 2–3 year baseline in JD1 lines 29–30).
- **Education:** Dual M.Sc. in Renewable Energy, Energy Efficiency & Sustainability (full 15 pts).
- **Relocation:** `UNKNOWN` (awarded 2/5 neutral credit; non-punitive).
- **Verbatim Evidence:** `"Energy & Sustainability Consultant"`, `"Dual M.Sc. — Renewable Energy, Energy Efficiency & Sustainability"`.

#### 2. Candidate `CAND-028` — Rank #2 (Score: 58.0 / 100 — QUALIFIED)
- **Primary Tooling:** SimaPro software expertise verified.
- **Experience:** 2.5 years as "Sustainability & Compliance Consultant".
- **Education:** Master Thesis in Decarbonization Pathways & Life Cycle Metrics.
- **Relocation:** `UNKNOWN` (awarded 2/5 neutral credit).
- **Verbatim Evidence:** `"Sustainability & Compliance Consultant"`, `"Master Thesis (Decarbonization Pathways)"`.

#### 3. Border Candidates Audit (Near-Misses: 48.0 – 50.0)
- `CAND-045` (50.0 pts), `CAND-031` (49.0 pts), `CAND-040` (48.0 pts), `CAND-043` (48.0 pts), `CAND-024` (48.0 pts).
- **Audit Finding:** These candidates are environmental engineering or corporate ESG analysts. They achieved high education and domain points (EPD, GHG Scope 1/2), but received 0 points for GaBi/SimaPro tools and 0 points for ISO 14040/14044 standards.
- **Verification Decision:** Their disqualification (< 55.0) is mathematically sound and adheres strictly to mandatory JD1 requirements.

---

### B. UI/UX Designer Intern (Top Qualified Candidates)

#### 1. Candidate `CAND-014` — Rank #1 (Score: 80.0 / 100 — QUALIFIED)
- **Tooling (25/25):** Verbatim quote: `"• Created wireframes, high-fidelity UI, and prototypes in Figma."`
- **Methodology (25/25):** End-to-end user flows, wireframes, and design system components.
- **User Psychology (10/20):** Verbatim quote: `"• Conducted user research for users aged 28–80."`
- **Experience (10/10):** Hands-on UI/UX design internship (perfect fit for 0–1 yr target).
- **Portfolio (10/15):** Case studies and deliverables documented in resume.

#### 2. Candidate `CAND-017` — Rank #2 (Score: 80.0 / 100 — QUALIFIED)
- **Tooling & Methodology:** Comprehensive design systems, usability testing, and mobile mockups.
- **Verbatim Evidence:** `"UI/UX Designer with hands-on internship experience designing user-centered digital products. Proficient in User Research, Wireframing, Prototyping, Usability Testing"`.

#### 3. Candidate `CAND-027` — Rank #3 (Score: 80.0 / 100 — QUALIFIED)
- **Tooling & Psychology:** User research and accessibility engineering.
- **Verbatim Evidence:** `"• Created interactive Figma prototypes to visualize user flows and design concepts."`, `"• Conducted user research, competitor analysis, and problem definition to redesign the railway assistance experience."`

---

## 4. Edge Cases & Exception Handling Audit

### 1. The Empty Document: `anonymized_resume_1793685080327.docx` (`CAND-005`)
- **Raw File Properties:** 0 paragraphs, 0 tables, 0 bytes text payload.
- **Audit Check:**
  - Extraction Status: `FAILED`
  - Extraction Confidence: `0.0`
  - Classification: `NEITHER_OR_UNCERTAIN`
  - LCA Score: `null` (not 0.0)
  - UI/UX Score: `null` (not 0.0)
  - Qualification Status: `MANUAL_REVIEW_REQUIRED`
- **Conclusion:** Passed all audit constraints without crashing the batch or receiving unfair zero scores.

### 2. Acronym Collision Check (`"UI"` vs Role Key)
- Candidate initials or miscellaneous abbreviations (e.g., candidate initials "UI") were prevented from falsely matching UI/UX design tools via token-boundary regex matching (`r"\bui/ux\b|\bfigma\b"`).

### 3. Student / Minimal Resumes
- Candidates with purely academic coursework and zero industrial experience (e.g. `CAND-033`, `CAND-036`) correctly scored 0.0 for UI/UX and ≤ 7.0 for LCA, landing deterministically in `NEITHER_OR_UNCERTAIN`.

---

## 5. Verification Sign-Off

- [x] All 47 resumes accounted for.
- [x] Top candidates verified against physical resume text.
- [x] Border candidates reviewed for systematic scoring bias.
- [x] Traceability check passed: 100% of cited evidence snippets verified.
- [x] Non-punitive unknown handling confirmed for relocation and empty documents.

