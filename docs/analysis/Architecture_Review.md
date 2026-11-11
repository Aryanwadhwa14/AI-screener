# Architecture Review & Implementation Feasibility

**Date:** 2026-11-10  
**Status:** Approved Technical Architecture Review  
**Reference Document:** `docs/Architecture.md`  

---

## 1. Executive Summary

This architecture review assesses the proposed system design against the empirical findings from the Phase 0 source-data audit (47 DOCX resumes, 2 JDs) and the assignment's technical and non-functional requirements.

The overall architecture—a **modular monolith** consisting of a Next.js frontend, a FastAPI Python service, Supabase PostgreSQL, and private Supabase Object Storage—is sound, resilient, and well-aligned with assignment constraints.

---

## 2. Component-by-Component Review & Adjustments

### 2.1 Resume Ingestion & Parsing Engine
- **Finding from Audit:** 100% of the initial 47 resumes are standard `.docx` files without embedded image scans. However, the application must also support new `.pdf` and `.docx` uploads during evaluation.
- **Architectural Adjustment:**
  - Standardize text extraction via a dual-engine adapter: `python-docx` for `.docx` and `PyMuPDF` (`fitz`) for `.pdf`.
  - Add an explicit **Low-Text Content Guard / Validation Trigger**: A 50-character threshold serves as a low-text warning and validation trigger, not an automatic proof that a resume is invalid. If character length is below 50, the document is specifically validated. If genuinely unreadable or empty (as observed in `anonymized_resume_1793685080327.docx`), bypass LLM calls, record an explicit `EMPTY_FILE` processing warning, set extraction status to `FAILED`, and assign classification `NEITHER_OR_UNCERTAIN`.
  - **Methodology Correction (Score & Status Handling):** Failed extraction must NOT automatically result in a candidate score of zero. An unavailable score must be represented as `null`, with a clear processing status (`FAILED_EXTRACTION` or `PARTIAL`) and a visible requirement for manual human review.
  - **Methodology Correction (Relocation Willingness):** Missing relocation willingness must be represented as `UNKNOWN`, not `FALSE`. Willingness to relocate must never be inferred or presumed absent merely because it is not explicitly mentioned in the resume.

### 2.2 LLM Extraction & Evidence Validation Layer
- **Finding from Audit:** Resumes contain dense terminology (e.g., ISO standards, GaBi, SimaPro, Figma, EPD). Candidate initials can collide with role keywords (e.g., candidate "UI").
- **Architectural Adjustment:**
  - Extraction must use strict Pydantic v2 schemas with structured JSON outputs.
  - Require an `evidence_snippet` string for every extracted skill, degree, and project claim.
  - Implement an in-memory evidence validator that confirms the snippet actually appears as a substring (or normalized sequence) in the raw document text. Unverified claims are marked `is_verified: false` and down-weighted.
  - Keep prompts versioned and isolated under `backend/app/prompts/`.

### 2.3 Deterministic Scoring & Classification Engine
- **Finding from Audit:** The two job descriptions represent orthogonal domains (LCA vs. UI/UX) with entirely different experience expectations (2–3 years for LCA vs. 0–1 years for UI/UX Intern). Out-of-domain resumes (Banking Risk, Halal Compliance) are present.
- **Architectural Adjustment:**
  - Keep LCA and UI/UX scoring strictly independent.
  - Formulate role configurations (`RoleConfig`) versioned in code and database:
    - **LCA:** Evaluates domain experience (2–3+ yrs), software (GaBi/SimaPro), completed projects (≥3), ISO standards (14040/14044), and education.
    - **UI/UX:** Evaluates Figma proficiency, design methodologies/HCD, user research/psychology, portfolio presence, and 0–1 yr experience fit.
  - Classification logic:
    - `LCA`: LCA score ≥ threshold AND UI/UX score < threshold.
    - `UI_UX`: UI/UX score ≥ threshold AND LCA score < threshold.
    - `BOTH`: Both scores ≥ threshold (rare/exceptional).
    - `NEITHER_OR_UNCERTAIN`: Both scores < threshold OR extraction failed/empty.
  - Tie-breaking: Deterministic sort by (1) Required criteria score, (2) Total match score, (3) Candidate ID.

### 2.4 Data Storage & Privacy
- **Supabase Database:**
  - Relational tables for `candidates`, `job_descriptions`, `candidate_profiles`, `candidate_evaluations`, `evidence_items`, and `processing_jobs`.
  - Sensitive candidate resumes stored only in a private bucket.
- **Access Control:**
  - Resume previews delivered via short-lived signed URLs (e.g., 60-second expiration) or server-mediated streaming.
  - Resumes are excluded from Git commits via `.gitignore` (`data/resumes/` and `data/*.docx`).

### 2.5 WebGL Shader Integration
- **Implementation Strategy:**
  - The supplied `assets/Waves.frag` is mounted via a lightweight custom WebGL1 component (`ShaderBackground.tsx`).
  - No Three.js or heavy rendering runtime.
  - Shader is strictly placed behind hero/overview areas and empty states.
  - High-density candidate tables and drawer evidence panels will render on opaque charcoal surfaces (`#08080A`) to ensure readability and zero contrast degradation.
  - Event loop pauses when `document.visibilityState === 'hidden'`.
  - Full fallback to a static CSS gradient when WebGL1 is unsupported or `prefers-reduced-motion` is enabled.

---

## 3. Hosting & Resource Feasibility

| Service | Selected Tier / Host | Operational Considerations |
|---|---|---|
| **Frontend** | Vercel (Next.js) | Standard build and edge CDN caching for static assets. |
| **Backend API** | Render / Railway / Local | Python 3.12+ runtime. Batch processing can be chunked into resumable jobs to respect timeout limits. |
| **Database & Storage** | Supabase (PostgreSQL & Storage) | Connection pooling enabled (Transaction mode) to stay within pooler limits. Storage bucket configured with private RLS. |

---

## 4. Phase 0 Architecture Decision Record (ADR) Summary

1. **ADR-01: DOCX-First Ingestion Pipeline:** Initial dataset is 100% DOCX; build native Word extraction using `python-docx` as primary, with `PyMuPDF` for PDF uploads.
2. **ADR-02: Low-Text Validation Trigger & Null Scores:** The 50-character threshold is a low-text validation trigger, not automatic invalidity proof. If confirmed unreadable/empty, mark `FAILED_EXTRACTION`. Crucially, failed extractions must NOT receive an artificial score of zero; scores remain `null` with mandatory manual review.
3. **ADR-03: Independence of Role Scoring:** LCA and UI/UX are evaluated independently in parallel; scores are never combined into a single blended metric.
4. **ADR-04: Ground Truth Grounding in Source JDs:** Baseline LCA required experience is set to 2–3 years per `JD1 (LCA).txt` source text, resolving the discrepancy with the assignment overview's 4–6 years note.
5. **ADR-05: Missing Attribute Policy (Relocation):** Missing relocation willingness is strictly recorded as `UNKNOWN`, never inferred as `FALSE`.

