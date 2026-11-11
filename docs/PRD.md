# GFI AI Resume Screener — Product Requirements Document

**Status:** Initial implementation specification  
**Product:** AI-assisted resume screening and candidate ranking prototype  
**Target deployment:** Vercel frontend + separately hosted API/worker  
**Primary users:** HR/recruitment reviewers  
**Assignment context:** GFI Software Engineering Assignment

## 1. Product summary

Build a web application that ingests the 47 supplied anonymized resumes and two supplied job descriptions, extracts job-relevant information, classifies each candidate against both roles, and produces two independent, explainable rankings.

The system must also allow an HR reviewer to upload a new resume. The new candidate must be processed, evaluated against both job descriptions, and inserted into the appropriate rankings without manually rebuilding the dataset.

This is a human-review tool, not an autonomous hiring decision-maker. It must show evidence, uncertainty, extraction issues, and the source resume so a human can verify every important conclusion.

## 2. Problem statement

The hiring team has two openings:

1. **Life Cycle Assessment (LCA):** role requiring approximately 4–6 years of experience.
2. **UI/UX Design Internship:** internship role.

There are 47 anonymized resumes across the two applicant pools, but the role associated with each resume is not provided. HR needs a consistent way to identify likely fit and prioritize review.

The exact job-description requirements must be extracted from the supplied JD1 and JD2 files. Do not invent mandatory skills, qualifications, or weights before those documents have been inspected.

## 3. Goals

- Process the initial 47 resumes in a repeatable batch.
- Extract structured, job-related candidate information.
- Evaluate every candidate independently against both JDs.
- Classify candidates as `LCA`, `UI_UX`, `BOTH`, or `NEITHER_OR_UNCERTAIN`.
- Calculate a separate score and rank for each role.
- Explain each score using traceable resume evidence and JD requirements.
- Preserve access to each original resume.
- Allow new PDF/DOCX resume uploads and automatically evaluate them.
- Make extraction failures and uncertainty visible.
- Provide an understandable interface for non-technical HR reviewers.
- Document the scoring methodology and data-cleaning decisions.

## 4. Non-goals

- Automatically reject, hire, or make final employment decisions.
- Infer protected or sensitive personal attributes.
- Score candidates using name, photograph, gender, age, religion, caste, ethnicity, marital status, disability, or other protected characteristics.
- Scrape private profiles or search for additional personal information.
- Train a custom foundation model.
- Claim that semantic similarity alone proves qualification.
- Guarantee perfect extraction from every resume.
- Expose chain-of-thought or private model reasoning. Show concise evidence-based explanations instead.

## 5. Users and user stories

### HR reviewer
- As an HR reviewer, I want to see the two job profiles and their separate ranked candidate lists.
- I want to understand why a candidate received a score.
- I want to inspect the extracted profile and open the original resume.
- I want to filter and sort by score, relevant experience, classification, and processing status.
- I want to see warnings when information is missing, ambiguous, or unreadable.
- I want to upload a new resume and see its results alongside existing candidates.

### Assignment evaluator
- As an evaluator, I want to understand the extraction pipeline, scoring formula, assumptions, and validation process.
- I want to see that AI output has been cleaned and checked rather than accepted blindly.
- I want to test the app using a new resume.

## 6. Functional requirements

### FR-01: Job description management
- Import JD1 (LCA) and JD2 (UI/UX internship).
- Store the source text and a normalized requirements representation.
- Separate required, preferred, and contextual criteria where the JD supports that distinction.
- Preserve source snippets or page/section references for each requirement.
- Allow criteria and weights to be reviewed and edited by an administrator before final scoring.
- Do not fabricate missing JD requirements.

### FR-02: Resume ingestion
- Support PDF and DOCX uploads.
- Process the initial batch of 47 resumes.
- Support a single new resume upload after deployment.
- Validate file type and size; reject unsupported or unsafe files with a clear message.
- Assign a stable internal candidate ID.
- Preserve the original file and its original filename as metadata.
- Detect duplicate uploads using a file hash.
- Track processing status: `PENDING`, `PROCESSING`, `COMPLETED`, `PARTIAL`, or `FAILED`.

### FR-03: Text extraction
- Extract text from digital PDFs and DOCX files.
- Detect low-text/scanned PDFs and route them to OCR where configured.
- Retain page-level text where possible.
- Record parser/OCR warnings.
- Never silently replace missing text with guessed content.

### FR-04: Structured information extraction
Extract only job-relevant fields:
- Candidate ID.
- Skills and tools.
- Employment and internship history.
- Role titles, organizations where present, dates, and responsibilities.
- Estimated relevant experience, with calculation method and confidence.
- Education and relevant coursework/certifications.
- Projects, contributions, methods, and outcomes.
- Domain-specific keywords supported by the resume.
- Portfolio or project URLs explicitly present in the resume.
- Evidence snippets and source page/section references.
- Missing, ambiguous, and conflicting fields.

Every extracted claim should be traceable to source text. Unknown information must be represented as unknown, not guessed.

### FR-05: Classification
Evaluate each resume against both job descriptions and assign one label:
- `LCA`: stronger evidence of fit for LCA only.
- `UI_UX`: stronger evidence of fit for UI/UX only.
- `BOTH`: meaningful evidence for both roles.
- `NEITHER_OR_UNCERTAIN`: insufficient evidence for either role, or extraction quality too low to make a reliable classification.

Classification must use both role scores, evidence sufficiency, and configurable thresholds. It must not be a forced binary decision.

### FR-06: Scoring and ranking
- Produce a 0–100 score for LCA and a separate 0–100 score for UI/UX.
- Use role-specific criteria and weights derived from the actual JDs.
- Normalize criterion scores consistently.
- Record each criterion score, weight, evidence, and missing-data treatment.
- Sort candidates separately for each role.
- Use deterministic tie-breaking.
- Distinguish a low match score from low extraction confidence.
- Make the formula visible in the methodology view.

Initial proposed criteria are placeholders only. Final criteria and weights must be confirmed after inspecting JD1 and JD2.

### FR-07: Explanations
For each role evaluation, show:
- Overall match score.
- Criterion-level score and weight.
- Positive evidence with source snippets.
- Gaps or criteria for which evidence was not found.
- Extraction confidence and processing warnings.
- A concise, factual summary.
- A clear note that the result is decision support, not a hiring decision.

Do not generate unsupported praise, assumptions, or fabricated years of experience.

### FR-08: HR dashboard
- Overview metrics: total resumes, completed, partial, failed, and candidate counts by classification.
- Separate LCA and UI/UX ranking pages.
- Candidate table with ID, role score, classification, relevant experience (if verifiable), extraction status, and review action.
- Search, sort, and filter controls.
- Candidate detail page/drawer with extracted profile, score breakdown, evidence, warnings, and original resume link.
- New resume upload flow with processing status.
- Responsive layout and accessible contrast.

### FR-09: Error handling
- Show a clear status for every resume.
- Preserve partial extraction results when safe and useful.
- Show actionable error messages without exposing stack traces or secrets.
- Allow retry of failed processing.
- Keep one bad file from stopping the rest of a batch.

### FR-10: Methodology and auditability
- Publish a methodology page or document describing extraction, cleaning, criteria, weights, scoring, thresholds, and limitations.
- Store model/provider and prompt/schema version metadata for each extraction.
- Store scoring version and timestamp.
- Log manual corrections with before/after values and reviewer note where implemented.
- Make clear which values are extracted, calculated, or manually reviewed.

## 7. UX and visual requirements

### Visual direction supplied by the user
- Overall feel: premium, minimal, dark, technology-oriented.
- Base background: `#020203`.
- Accent: `#FF5729`.
- Secondary surfaces: charcoal/near-black.
- Text: high-contrast white and muted neutral gray.
- Animated background: user-supplied “Waves” WebGL1 fragment shader.
- Cursor interaction: off.
- Grain: subtle.
- Shader must sit behind page content and must not impair readability.

### UI guidance
- Use the animated shader selectively: landing/overview hero and selected empty states, not behind dense tables or long candidate reports.
- Candidate tables should use solid or nearly opaque surfaces.
- Use orange for primary actions, selected navigation, and important score accents; do not use orange for every element.
- Use restrained motion, clear typography, generous spacing, and consistent status labels.
- Provide a reduced-motion/static fallback.
- Provide loading, empty, partial, and error states.

## 8. Quality attributes

- **Correctness:** all displayed scores must be reproducible from stored criterion scores and weights.
- **Traceability:** every material extracted claim should point to source evidence where possible.
- **Reliability:** a failed resume must not break batch processing.
- **Security:** validate uploads, restrict file access, protect secrets, and avoid public exposure of candidate documents.
- **Privacy:** process only assignment-provided candidate data; minimize retention and do not use data for model training unless explicitly authorized.
- **Performance:** show progress for long-running extraction; use background jobs for batch processing.
- **Accessibility:** keyboard navigation, semantic labels, readable contrast, and reduced-motion support.
- **Maintainability:** separate UI, extraction, evaluation, storage, and deployment concerns.

## 9. Acceptance criteria

The assignment prototype is considered complete when:
1. The two actual JDs have been imported and their requirements reviewed.
2. All 47 supplied resumes have a recorded processing outcome.
3. Each successfully processed resume has a structured profile and source reference.
4. Each candidate has separate LCA and UI/UX scores or a clearly stated unavailable/uncertain result.
5. Both ranking pages sort correctly and show criterion-level explanations.
6. HR can inspect the original resume and the evidence behind a score.
7. A new PDF or DOCX can be uploaded and evaluated against both roles.
8. Extraction failures and partial results are visible and recoverable.
9. The methodology and data-cleaning decisions are documented.
10. The application is deployed and tested using the public submission URL.

## 10. Open inputs / assumptions

The actual resume files and JD1/JD2 must be inspected before finalizing:
- Required and preferred criteria.
- Criterion weights.
- Experience calculation rules.
- Classification thresholds.
- OCR requirements.
- File-size limits.

Do not treat example weights or example scores in planning notes as final assignment facts.
