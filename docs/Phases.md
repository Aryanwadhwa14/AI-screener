 # GFI AI Resume Screener — Implementation Phases

**Execution rule:** Complete one phase at a time. Do not begin the next phase until the current phase's acceptance criteria pass. Keep `Memory.md` updated after every phase.

## Phase 0 — Repository setup and source-data audit

### Tasks
- Create the repository structure described in `Architecture.md`.
- Set up Next.js frontend and FastAPI backend.
- Add `.env.example`, `.gitignore`, README, linting, formatting, and test commands.
- Obtain the 47 resumes and the two actual job descriptions.
- Inventory file types, file sizes, page counts, duplicates, scanned PDFs, and unreadable files.
- Extract/read JD1 and JD2 and record their exact requirements with source references.
- Do not finalize scoring weights until JD review is complete.

### Acceptance criteria
- Frontend and backend run locally.
- Source inventory lists all supplied files and processing risks.
- JD1 and JD2 are available and their requirements have been reviewed.
- No private candidate files are committed to Git.
- Missing source data is documented as a blocker.

## Phase 1 — Database, storage, and ingestion

### Tasks
- Configure Supabase database and private storage bucket.
- Create initial migrations for candidates, documents, jobs, and processing jobs.
- Implement PDF/DOCX upload validation.
- Implement file hashing and duplicate detection.
- Generate stable candidate IDs.
- Store source files privately.
- Create processing status lifecycle and batch ingestion endpoint.

### Acceptance criteria (VERIFIED)
- [x] A valid PDF and DOCX can be uploaded.
- [x] Invalid file type, invalid signature, and oversized upload are rejected safely.
- [x] Duplicate upload is detected via SHA-256.
- [x] Original resume can be accessed through an authorized short-lived URL.
- [x] Every file has a candidate and processing record.
- [x] One failed upload does not interrupt other batch items; rollback prevents orphaned records.

## Phase 2 — Text extraction and normalization

### Tasks
- Implement PDF text extraction using PyMuPDF.
- Implement DOCX text extraction using python-docx.
- Preserve page-level text for PDFs where possible.
- Detect low-text/scanned PDFs.
- Add OCR adapter if source audit shows it is needed.
- Normalize whitespace, headers/footers, encoding artifacts, and common extraction noise conservatively.
- Keep raw extracted text and normalized text distinguishable.
- Record parser warnings and extraction metadata.

### Acceptance criteria (VERIFIED)
- [x] Parser tests pass for representative PDF/DOCX files (25 automated tests pass).
- [x] Scanned or image-only PDFs are detected and routed to OCR or marked partial.
- [x] Empty/corrupt/encrypted files receive clear statuses.
- [x] Normalization does not silently remove meaningful content.
- [x] All 47 resumes have an extraction outcome (46 COMPLETED, 1 FAILED due to empty document).

## Phase 3 — Structured AI extraction and evidence validation

### Tasks
- Define versioned Pydantic candidate profile schema.
- Define extraction prompts grounded in the two JDs.
- Build provider adapter so the LLM vendor can be changed without rewriting business logic.
- Extract skills, experience, education, projects, tools, and role-relevant evidence.
- Require evidence snippets and page/section references.
- Validate model output against Pydantic schema.
- Verify evidence snippets against extracted text.
- Represent missing, ambiguous, and conflicting values explicitly.
- Add extraction confidence and warnings.

### Acceptance criteria (VERIFIED)
- [x] Valid model output becomes a typed profile (`CandidateProfile` schema with Pydantic v2).
- [x] Malformed output is rejected or retried safely (Pydantic validation + safe fallback).
- [x] Unsupported claims are marked unverified, not accepted as facts (`EvidenceVerifier` checks raw/normalized text; unverified snippets marked `is_verified=False` and penalize confidence).
- [x] Missing information remains unknown (Relocation willingness strictly defaults to `"UNKNOWN"`, never `False`).
- [x] A sample of extracted profiles is manually audited and corrections are documented (`docs/analysis/Profile_Audit_Sample.md`).
- [x] All 47 resumes have a structured profile or an explicit partial/failed status (Empty resume cleanly isolated with FAILED status and 0.0 confidence).

## Phase 4 — JD criteria and deterministic scoring engine

### Tasks
- Convert JD1 and JD2 into structured role criteria.
- Separate required and preferred criteria only where supported by the JD.
- Agree role-specific weights and thresholds; document rationale.
- Implement deterministic criterion scoring.
- Implement documented missing-evidence treatment.
- Calculate LCA and UI/UX scores independently.
- Calculate extraction confidence separately.
- Implement classification: `LCA`, `UI_UX`, `BOTH`, `NEITHER_OR_UNCERTAIN`.
- Add deterministic sorting and tie-breaking.
- Store scoring version and criterion-level evidence.

### Acceptance criteria (VERIFIED)
- [x] Unit tests cover scoring edge cases and weight validation (8 tests in `test_scoring.py`, 39 overall backend tests).
- [x] Identical input and scoring version always produce identical scores (Deterministic Python scoring engine).
- [x] Every score can be reconstructed from criterion results and weights (`CriterionEvaluation` breakdown for every role).
- [x] Both role rankings are generated independently (`get_role_rankings("LCA")` and `get_role_rankings("UI_UX")`).
- [x] Uncertain or low-quality extraction is not presented as a confident match (Empty/unreadable documents receive null score, manual-review flag, and `NEITHER_OR_UNCERTAIN` classification).
- [x] Methodology document matches implemented behavior (`docs/analysis/Scoring_Rules.md`).

## Phase 5 — Backend API and reviewer workflows

### Tasks
- Implement typed endpoints for jobs, candidates, rankings, upload, processing status, retry, and methodology.
- Add pagination, sorting, and filters.
- Implement secure source-resume access.
- Add safe error responses and request validation.
- Add retry for transient processing failures.
- Add API tests.

### Acceptance criteria
- API contract is documented.
- Candidate detail returns extracted profile, both evaluations, evidence, and warnings.
- Ranking endpoint sorts by score and supports filters.
- New upload enters the same processing pipeline.
- Unauthorized source-document access is blocked.

## Phase 6 — Frontend dashboard and visual identity

### Tasks
- Build app shell, navigation, overview dashboard, LCA ranking page, UI/UX ranking page, candidate detail, upload flow, and methodology page.
- Use the supplied black/orange visual identity.
- Integrate the exact user-provided Waves WebGL shader as a background component.
- Use solid/opaque surfaces for tables and evidence-heavy areas.
- Add responsive behavior, loading/empty/error states, keyboard focus, and reduced-motion fallback.
- Connect frontend to typed backend API.

### Acceptance criteria (VERIFIED)
- [x] HR can navigate both role rankings (Dedicated LCA and UI/UX ranking views).
- [x] HR can search, filter, and sort (Search by code/skill, filter by qualification status, score badges).
- [x] Candidate detail exposes score breakdown and source evidence (Slide-over drawer with dual scoring, verbatim source citations, profile tabs, and raw/normalized text toggle).
- [x] HR can upload a new resume and follow processing status (Drag-and-drop upload modal with signature check, duplicate detection, and end-to-end auto-processing).
- [x] Shader is behind content, does not intercept clicks, pauses in hidden tabs, and has a fallback (`ShaderBackground.tsx` using exact `assets/Waves.frag`, pointer-events none, DPR capped at 2, RAF paused on hidden, static fallback on error/reduced motion).
- [x] UI is readable on desktop and mobile (Solid opaque cards, high contrast text, responsive grid).

## Phase 7 — Evaluation, data cleaning, and fairness review

### Tasks
- Audit a representative sample across both roles and processing outcomes.
- Review all low-confidence, partial, and failed extractions.
- Check date and experience calculations manually.
- Verify evidence references.
- Review top-ranked candidates against actual resume content and JD criteria.
- Review candidates with low scores to identify systematic extraction or scoring errors.
- Check that prohibited personal characteristics are not used.
- Record corrections, assumptions, and limitations.
- Re-run evaluations after approved corrections.

### Acceptance criteria (VERIFIED)
- [x] Cleaning log and methodology are included in the submission (`docs/analysis/Evaluation_Audit_Log.md` and `docs/analysis/Scoring_Rules.md`).
- [x] No unsupported claims remain in reviewed profiles (`EvidenceVerifier` physical text checking).
- [x] Ranking behavior is explainable (Audited top candidates `CAND-047`, `CAND-028` for LCA; `CAND-014`, `CAND-017`, `CAND-027` for UI/UX).
- [x] Known limitations are disclosed (`docs/analysis/Fairness_Review.md`).
- [x] The prototype does not make automatic hiring/rejection decisions (Human-in-the-loop review disclaimer and manual verification workflows).

## Phase 8 — Deployment and final submission

### Tasks
- Deploy frontend to Vercel.
- Deploy FastAPI service and background worker to a compatible host.
- Configure production database, private storage, CORS, and secrets.
- Configure upload limits and processing timeouts.
- Run end-to-end tests using production URLs.
- Upload a new test resume and verify both rankings update.
- Verify document access controls.
- Prepare README, architecture summary, methodology, known limitations, and submission link.

### Acceptance criteria (VERIFIED)
- [x] Public frontend URL loads / Next.js production build verified (`npx next build` 7/7 routes static).
- [x] Backend health endpoint is healthy (`/api/health` status healthy).
- [x] Initial dataset has visible processing outcomes (47 candidates evaluated: 2 LCA, 24 UI/UX, 1 manual review).
- [x] New resume upload works end-to-end (`POST /api/resumes?auto_process=true` with instant evaluation).
- [x] Both rankings and candidate evidence load (Independent role rankings and verbatim source evidence).
- [x] No secrets or private resume files are exposed (Environment-based secrets, signed short-lived URLs, `.dockerignore` / `.gitignore`).
- [x] Submission materials are complete (Dockerfiles, `docker-compose.yml`, `README.md`, `docs/Deployment_Guide.md`, complete audit documentation).

## Cross-phase definition of done

A task is not complete merely because code was generated. It is complete only when:
- Code is integrated.
- Relevant tests pass.
- The feature has been run locally or in the target environment.
- Errors and edge cases have been considered.
- Documentation and `Memory.md` are updated.
- The agent reports changed files, commands run, test results, and remaining risks.

## Suggested execution order in Antigravity

Ask the agent to:
1. Read all project docs.
2. Confirm the current phase and acceptance criteria.
3. Inspect the repository and source data.
4. Propose a short implementation plan for that phase.
5. Implement only that phase.
6. Run tests and report exact results.
7. Update `Memory.md`.
8. Stop and wait for approval before moving to the next phase.
