# GFI AI Resume Screener — Project Memory & Trajectory Log

**Last Updated:** 2026-11-11  
**Current Phase:** Phase 8 (COMPLETED — ALL PHASES VERIFIED)  
**Status:** Entire end-to-end project from Phase 0 to Phase 8 fully built, audited, containerized, documented, and verified.

---

## 1. Verified Project Milestones

### Phase 0: Project Discovery, Source-Data Audit & Initialization (COMPLETED)
- Verified 47 candidate resumes in `data/` (all 47 native `.docx` files, 47 unique SHA-256 hashes).
- Verified both source JDs: `data/JD1 (LCA).txt` (2–3 yrs experience, GaBi/SimaPro) and `data/JD2.txt` (0–1 yrs experience, Figma).
- Cataloged edge cases: empty resume (`anonymized_resume_1793685080327.docx`), minimal student resume (`anonymized_KN_...`), substring acronym collision (Candidate initials `"UI"`), out-of-domain profiles.
- Established baseline repository layout and living documentation.

### Phase 1: Database, Storage & Ingestion Foundation (COMPLETED)
- Database schema: `candidates`, `resume_documents`, `job_descriptions`, `processing_jobs` tables with migration `001_initial_schema.sql`.
- Dual repository: `SupabaseRepository` for cloud deployment and `SQLiteRepository` for local development/testing.
- Dual storage: `SupabaseStorageService` (private bucket `resumes`) and `LocalStorageService` with time-limited tokens.
- Ingestion engine: `validate_file()` with magic bytes checking (%PDF, PK\x03\x04), SHA-256 deduplication, transactional rollback.
- Batch import: 47/47 resumes imported idempotently; 14 tests verified.

### Phase 2: Text Extraction & Normalization (COMPLETED)
- Dual Extraction Engines: `PyMuPDF` (PDF) preserving page-by-page blocks, scanned/image detection; `python-docx` (DOCX) traversing paragraphs and tables.
- Non-destructive text normalization: `normalize_text()` preserving all keywords, dates, URLs, emails, and phone numbers.
- Database Schema Extension: Migration `002_extraction_schema.sql` adding raw and normalized text columns.
- Executed across all 47 real resumes: 46 COMPLETED, 1 FAILED (`anonymized_resume_1793685080327.docx`, confirmed empty 0-word document, score remains null, marked `NEITHER_OR_UNCERTAIN`).
- Automated tests: 25 backend tests passed.

### Phase 3: Structured Information Extraction & Evidence Linking (COMPLETED)
- Database Schema Extension: Migration `003_profile_schema.sql` adding `candidate_profiles` and `evidence_items`.
- Pydantic Profile & Evidence Schemas: `CandidateProfile`, `EvidenceSnippet`, `WorkExperienceItem`, `EducationItem`, `ProjectItem`. Relocation willingness strictly defaults to `"UNKNOWN"`.
- Traceable Evidence Verifier: `EvidenceVerifier` validating exact text snippets against raw and normalized text; penalizing confidence on unverified claims.
- Provider-Agnostic LLM Layer: `LLMProvider` abstract contract, `MockLLMProvider` (offline/test), and `GeminiLLMProvider` (Google Gemini with structured schema mode).
- Verified on all 47 real resumes; 31 backend tests passed.

### Phase 4: Role-Specific Evaluation & Deterministic Scoring Engine (COMPLETED)
- Database Schema Migration: `004_evaluation_schema.sql` adding `candidate_evaluations` table and score caches.
- Deterministic Role Scorers: `LCARoleScorer` (threshold: 55.0) and `UIUXRoleScorer` (threshold: 50.0).
- Methodological rules verified: Failed extractions receive `null` score (never forced to 0.0), `relocation_willingness` is `UNKNOWN` with neutral non-punitive credit.
- Orthogonal Candidate Classification: `LCA`, `UI_UX`, `BOTH`, `NEITHER_OR_UNCERTAIN`.
- Multi-tier tie-breaking protocol implemented.
- 39 backend tests passed.

### Phase 5: Backend API and Reviewer Workflows (COMPLETED)
- Reviewer Schemas (`backend/app/schemas/reviewer.py`): `CandidateSummaryItem`, `CandidateListResponse`, `CandidateDetailResponse`, `DocumentMeta`, `TextSnippetMeta`, `ProcessingStatusResponse`, `MethodologyResponse`.
- Reviewer Orchestration Service (`backend/app/services/reviewer/service.py`): paginated listing, multi-parameter filtering, candidate drawer detail compilation with secure signed URLs, reprocessing retry, and methodology specification.
- Reviewer & Ranking API Endpoints: `/api/candidates`, `/api/candidates/{id}`, `/api/candidates/{id}/retry`, `/api/candidates/{id}/status`, `/api/methodology`, `/api/rankings/{role_key}`.
- Atomic Upload Pipeline (`POST /api/resumes?auto_process=true`): Ingests, extracts, profiles, and evaluates new resumes end-to-end.
- API Contract Documentation: `docs/analysis/API_Contract.md`.
- 45 automated backend tests passing across all suites (`pytest backend/tests -v`).

### Phase 6: Frontend Dashboard and Visual Identity (COMPLETED)
- Design Language & Visual Identity: Dark theme (`#020203`, `#0B0C0E`, `#FF5729`), solid opaque cards for table contrast.
- WebGL Waves Shader (`frontend/components/shader/ShaderBackground.tsx`): Exact `assets/Waves.frag`, pointer-events none, DPR capped at 2, RAF paused on hidden, static fallback.
- Typed API Client & Reviewer Context: Next.js App Router, global drawer state, upload modal.
- Pages: Overview Dashboard (`/`), LCA Rankings (`/rankings/lca`), UI/UX Rankings (`/rankings/uiux`), Methodology (`/methodology`).
- Production build verified (`npx next build`): 7/7 static routes compiled cleanly.

### Phase 7: Evaluation, Data Cleaning and Fairness Review (COMPLETED)
- Evaluation Distribution Audit (`docs/analysis/Evaluation_Audit_Log.md`): Audited all 47 candidates. 2 LCA Qualified (`CAND-047`, `CAND-028`), 24 UI/UX Qualified, 0 Dual-Qualified, 21 Neither/Uncertain. Border candidates (<55.0) verified for missing GaBi/SimaPro.
- Fairness & Bias Review (`docs/analysis/Fairness_Review.md`): 100% Demographic Blindness verified (zero prohibited attributes in schema/prompts). Non-punitive Unknowns (Relocation UNKNOWN = 2/5 pts; Empty doc = null score & manual review). Verbatim evidence verification enforced.

### Phase 8: Deployment and Final Submission Packaging (COMPLETED)
- [x] **Production Docker Infrastructure:**
  - `backend/Dockerfile`: Multi-stage Python 3.12 container with build tools, curl healthcheck, and unprivileged user support.
  - `frontend/Dockerfile`: Multi-stage Node 20 container with standalone production build and non-root user `nextjs`.
  - `docker-compose.yml`: Full stack orchestration for one-command execution (`docker compose up --build`).
  - `.dockerignore`: Fast, clean build context exclusions.
- [x] **Deployment Documentation & Runbooks:**
  - `docs/Deployment_Guide.md`: Complete instructions for both Docker local production and Cloud deployment (Vercel + Render + Supabase).
  - `README.md`: Updated with full architecture summary, quick start guides, submission index, and phase checklists.
- [x] **Verification:**
  - All 45 automated backend tests pass.
  - Frontend production build succeeds cleanly.
  - Repository verified clean of secrets, passwords, or raw personal data.

---

## 2. Key Architectural Decisions (ADR Log)

- **ADR-01 (Low-Text Validation Trigger & Null Scores):** A 50-character threshold is a low-text validation trigger, not an automatic proof of invalidity. If validated as unreadable/empty (e.g. `anonymized_resume_1793685080327.docx`), it bypasses LLM extraction and is marked `FAILED_EXTRACTION`. Crucially, failed extractions must NOT receive an artificial score of zero; unavailable scores must be represented as `null`, with explicit status and manual review required.
- **ADR-02 (DOCX-First Ingestion):** 100% of initial 47 files are `.docx`. Pipeline uses `python-docx` for initial batch, with `PyMuPDF` for future `.pdf` uploads.
- **ADR-03 (LCA Experience Baseline):** Governed by canonical source text in `JD1 (LCA).txt` (2–3 years baseline for full credit, bonus for 4+ years), overriding the assignment overview note.
- **ADR-04 (Orthogonal Scoring):** Separate scoring engines for LCA and UI/UX running independently without blending scores.
- **ADR-05 (Deterministic Scoring Authority):** LLM outputs strict JSON with cited text snippets; final score is calculated by versioned Python formulas.
- **ADR-06 (Relocation Willingness Policy):** Missing relocation willingness must strictly be represented as `UNKNOWN`, not `FALSE`. Never infer willingness or unwillingness to relocate from a candidate's resume.
- **ADR-07 (Dual Database & Storage Adapters):** Clean provider interfaces allow transparent switching between Supabase and local SQLite/local disk storage, guaranteeing that backend tests and local demos work reliably without external network dependencies while supporting full cloud Supabase configuration.
- **ADR-08 (Dual-Text Persistence):** Store both `raw_text` (unmodified parser output) and `normalized_text` (cleaned, standardized text) in database for auditability and explainability.
- **ADR-09 (Evidence-Anchored Traceability):** Every extracted claim must cite verbatim resume text. The `EvidenceVerifier` ensures claims are physically present in the source text; unverifiable claims are flagged and penalize extraction confidence.
- **ADR-10 (Deterministic Scoring & Multi-Tier Tie Breaking):** Candidate scoring is 100% deterministic, side-effect-free, and reproducible. Ranking ties are resolved deterministically using a 5-tier comparator (Score -> Confidence -> Primary Criterion -> Verified Count -> Candidate Code).
- **ADR-11 (Atomic End-to-End Upload Processing):** `POST /api/resumes` supports `auto_process=true`, allowing new uploads from the HR interface to immediately pass through ingestion, extraction, and evaluation without background job delays or manual multi-step triggers.
- **ADR-12 (Solid Surface Contrast & Ambient Shader Placement):** The animated WebGL shader is mounted as a fixed background (`-z-10`, `pointer-events: none`). All tables, candidate detail panels, and modals use solid opaque backgrounds (`#0B0C0E` and `#0d0d11`) to prevent readability degradation.
- **ADR-13 (Demographic Blindness & Zero-Hallucination Governance):** Prohibited personal characteristics are completely eliminated from extraction schema and scoring models. All scored claims require verbatim resume proof.
- **ADR-14 (Production Container & Cloud Agnostic Packaging):** Both backend and frontend include standalone production Dockerfiles and docker-compose configurations, permitting deployment on any platform (Vercel, Render, Railway, AWS, or local Docker) with zero friction.

---

## 3. Current Project Status

- **ALL PHASES COMPLETE (Phases 0 through 8).**
- **Test Suite Status:** 45/45 tests passing.
- **Build Status:** Next.js production build clean.
- **Submission Readiness:** Complete. All documentation, audit logs, fairness reviews, and deployment configurations are committed and verified.
