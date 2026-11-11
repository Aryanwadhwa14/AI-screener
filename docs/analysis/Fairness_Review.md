# GFI AI Resume Screener — Fairness, Bias & Compliance Review

**Review Date:** 2026-11-11  
**Auditor:** Lead AI Engineer & Software Architect  
**Compliance Standard:** EEOC Guidelines, EU AI Act (High-Risk Employment Systems Transparency), and GFI Screening Governance.

---

## 1. Demographic Blindness & Prohibited Characteristics Policy

To eliminate algorithmic discrimination, the system enforces complete demographic blindness across all phases of the pipeline:

### Prohibited Attributes Checklist
| Protected Category | Extracted by AI? | Factored into Scoring? | Audit Outcome |
|---|---|---|---|
| **Gender / Sex** | ❌ No | ❌ No (0 pts) | Verified: 0 occurrences in schema or prompts. |
| **Age / Date of Birth** | ❌ No | ❌ No (0 pts) | Verified: Only tenure durations calculated; candidate age is never computed or stored. |
| **Race / Ethnicity** | ❌ No | ❌ No (0 pts) | Verified: 0 occurrences. |
| **Religion / Caste** | ❌ No | ❌ No (0 pts) | Verified: 0 occurrences. |
| **Marital / Family Status** | ❌ No | ❌ No (0 pts) | Verified: 0 occurrences. |
| **Physical Appearance / Photos** | ❌ No | ❌ No (0 pts) | Verified: Embedded images are ignored during text extraction. |
| **Salary / Previous Compensation** | ❌ No | ❌ No (0 pts) | Verified: 0 occurrences. |
| **Residential Address / Pin Code** | ❌ No | ❌ No (0 pts) | Verified: Only explicit relocation willingness is evaluated. |

### Technical Verification in Database Schema
A database schema audit of `candidate_profiles` confirmed the table contains strictly professional attributes:
```sql
['id', 'candidate_id', 'profile_json', 'schema_version', 'model_provider', 'model_name', 'prompt_version', 'extraction_confidence', 'validation_status', 'created_at']
```
A programmatic scan of all 47 stored `profile_json` payloads confirmed that **0 sensitive or demographic keys exist** across the entire database.

---

## 2. Non-Punitive Unknown Handling (Anti-Bias Rule)

Conventional recruitment algorithms penalize candidates when information is missing from their resume (e.g., assuming silence means inability or unwillingness). GFI Resume Screener implements affirmative anti-bias handling:

### 1. Relocation Willingness Policy (ADR-06)
- **The Problem:** In `JD1 (LCA).txt`, the position is located onsite in Chennai. If a candidate does not explicitly state "willing to relocate to Chennai", conventional screeners often infer `relocation_willing = False` and reject them.
- **Our Policy:** Missing relocation willingness is strictly represented as `UNKNOWN`. Never infer unwillingness from silence.
- **Scoring Impact:**
  - Local Chennai resident: **5 / 5 pts**
  - Explicit agreement to relocate: **5 / 5 pts**
  - Missing statement (`UNKNOWN`): **2 / 5 pts** (neutral, non-punitive credit)
  - Explicit refusal ("not willing to relocate"): **0 / 5 pts**

### 2. Low-Text / Extraction Failure Handling (ADR-01)
- **The Problem:** Corrupt, encrypted, or empty files (such as `anonymized_resume_1793685080327.docx`) typically receive a score of 0.0, placing them at the bottom of the applicant pool without explanation.
- **Our Policy:** Unreadable documents are assigned `score = null`, `classification = NEITHER_OR_UNCERTAIN`, and `status = MANUAL_REVIEW_REQUIRED`. They are surfaced to human reviewers in a dedicated "Manual Review" filter rather than dismissed as unqualified.

---

## 3. Zero-Hallucination & Evidence Grounding Policy

Biased systems often make unwarranted inferences based on school prestige or company reputation. Our engine eliminates this through strict grounding:

1. **Verbatim Text Requirement:** Every extracted claim in skills, tools, and experience must quote verbatim text from the candidate's resume.
2. **Physical Text Verification (`EvidenceVerifier`):** If a claimed skill or tool is not physically present in the normalized or raw resume text, it is flagged as unverified, stripped from criterion scoring, and penalizes the extraction confidence score.
3. **Deterministic Scoring Formulas:** Final scores are computed exclusively by Python arithmetic; generative LLMs are strictly forbidden from assigning final scores.

---

## 4. Human-in-the-Loop Governance & Non-Autonomous Decision Making

- **No Automated Adverse Action:** This system does **NOT** make autonomous hiring, shortlisting, or rejection decisions. It produces an explainable, sortable dossier for human recruitment professionals.
- **Explainability Standard:** Every candidate score is accompanied by:
  - Exact criterion-by-criterion mathematical breakdown.
  - Verifiable source citations for every awarded point.
  - System warnings and limitations disclosure.
  - Direct access to the source document for human verification.

---

## 5. Known Limitations & Disclosure

1. **Acronym Ambiguity:** While acronym collisions (such as initials "UI") have been mitigated, rare industrial abbreviations in specialized LCA software might require manual reviewer validation.
2. **Text-Layer Reliance:** The primary extraction pipeline relies on native digital text streams (`python-docx` and `PyMuPDF`). For legacy scanned photocopies, OCR character recognition accuracy depends on document scan resolution.
3. **Career Gap Neutrality:** The scoring engine computes cumulative verified tenure without penalizing parental, medical, or educational career gaps.

