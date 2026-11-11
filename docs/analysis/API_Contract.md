# GFI AI Resume Screener — Backend API Specification & Contract

**Version:** 1.0.0  
**Phase:** Phase 5 — Backend API and Reviewer Workflows  
**Base URL:** `http://localhost:8000` (or deployed API origin)  
**Governing Documents:** [`docs/PRD.md`](file:///d:/Aryan/GFI-assignment/docs/PRD.md), [`docs/Architecture.md`](file:///d:/Aryan/GFI-assignment/docs/Architecture.md), [`docs/analysis/Scoring_Rules.md`](file:///d:/Aryan/GFI-assignment/docs/analysis/Scoring_Rules.md)

---

## 1. Overview

The backend REST API is built with FastAPI and Pydantic v2. It provides a complete suite of endpoints supporting:
- Document ingestion and atomic upload pipelines
- Text extraction and non-destructive normalization
- Schema-constrained profile extraction and evidence verification
- Deterministic dual-role scoring and orthogonal classification
- Explainable, filtered candidate rankings
- Candidate drawer / detail views with time-limited signed document URLs
- Processing job tracking, retry mechanisms, and methodology transparency

---

## 2. API Endpoints Catalog

### 2.1 Ingestion & Document Access (`/api/resumes`)

#### `POST /api/resumes`
Uploads a single resume (`.pdf` or `.docx`).
- **Query Params:** `auto_process: bool = True` (If true, automatically runs extraction, profiling, and evaluations end-to-end).
- **Body:** `multipart/form-data` with `file: UploadFile`.
- **Response (201 Created):**
```json
{
  "candidate_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "candidate_code": "CAND-048",
  "original_filename": "jane_doe_resume.docx",
  "file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "processing_status": "UPLOADED",
  "job_id": "8f3b2e1a-4c5d-6e7f-8a9b-0c1d2e3f4a5b",
  "message": "Resume uploaded, extracted, and evaluated successfully."
}
```
- **Error Codes:** `400 BAD_REQUEST` (invalid signature/extension, oversized file), `409 CONFLICT` (duplicate SHA-256).

#### `GET /api/resumes/{candidate_id}/document-url`
Generates a time-limited signed URL to view or download the original resume.
- **Query Params:** `expires_in_seconds: int = 300` (default: 5 minutes).
- **Response (200 OK):**
```json
{
  "candidate_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "original_filename": "resume.docx",
  "access_url": "/api/documents/preview/signed_token_here",
  "expires_in_seconds": 300
}
```

---

### 2.2 Text Extraction (`/api/resumes`)

#### `POST /api/resumes/{candidate_id}/extract`
Runs PyMuPDF / python-docx text extraction and conservative normalization.

#### `POST /api/resumes/batch-extract`
Batches text extraction across all candidates in the repository.

#### `GET /api/resumes/{candidate_id}/extracted-text`
Retrieves both raw text and normalized text with parser metadata and warnings.

---

### 2.3 Structured Profile & Evidence (`/api/resumes`)

#### `POST /api/resumes/{candidate_id}/profile`
Triggers schema-constrained LLM extraction and evidence verification.

#### `GET /api/resumes/{candidate_id}/profile`
Retrieves stored structured profile (`skills`, `tools`, `work_experience`, `education`, `relocation_willingness="UNKNOWN"`).

---

### 2.4 Deterministic Evaluation & Rankings (`/api/evaluations` & `/api/rankings`)

#### `POST /api/evaluations/{candidate_id}`
Evaluates a candidate independently against LCA and UI/UX roles.

#### `POST /api/evaluations/batch`
Evaluates all candidates and returns classification distributions.

#### `GET /api/evaluations/{candidate_id}`
Returns criterion-level breakdowns, scores, weights, evidence citations, and rationales for both roles.

#### `GET /api/rankings/{role_key}`
Returns deterministic, explainable rankings for `"LCA"` or `"UI_UX"`.
- **Query Params:**
  - `qualification_status`: `"QUALIFIED"`, `"UNQUALIFIED"`, `"MANUAL_REVIEW_REQUIRED"`, `"ALL"`
  - `min_score`: `float` (0.0 to 100.0)
  - `max_score`: `float` (0.0 to 100.0)
  - `search`: string query (candidate code or key strength)
- **Response (200 OK):**
```json
{
  "role_key": "LCA",
  "role_title": "Life Cycle Assessment (LCA) Consultant",
  "total_candidates": 47,
  "qualified_count": 2,
  "unqualified_count": 44,
  "unavailable_count": 1,
  "rankings": [
    {
      "rank": 1,
      "candidate_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "candidate_code": "CAND-047",
      "score": 63.0,
      "is_qualified": true,
      "qualification_status": "QUALIFIED",
      "classification": "LCA",
      "extraction_confidence": 1.0,
      "key_strengths": [
        "Environmental Domain Degree: 15/15 pts",
        "LCA Project Experience: 20/25 pts",
        "GaBi / SimaPro Modeling Tools: 20/25 pts"
      ],
      "summary": "Candidate CAND-047 qualifies for LCA Consultant with a score of 63.0/100."
    }
  ]
}
```

---

### 2.5 Reviewer Workflows (`/api/candidates` & `/api/methodology`)

#### `GET /api/candidates`
Paginated candidate table with filtering and full-text search.
- **Query Params:**
  - `page`: integer (default: 1)
  - `page_size`: integer (default: 20, max: 100)
  - `classification`: `"LCA"`, `"UI_UX"`, `"BOTH"`, `"NEITHER_OR_UNCERTAIN"`, `"ALL"`
  - `status`: processing status filter
  - `min_score`: minimum top score
  - `max_score`: maximum top score
  - `search`: query matching candidate code, original filename, or skills
- **Response (200 OK):**
```json
{
  "total": 47,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "candidates": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "candidate_code": "CAND-001",
      "classification": "LCA",
      "processing_status": "PROFILED",
      "lca_score": 58.0,
      "uiux_score": 10.0,
      "original_filename": "anonymized_AK_1793682784184.docx",
      "file_size": 9993,
      "extraction_confidence": 1.0,
      "created_at": "2026-11-10T23:30:00Z"
    }
  ]
}
```

#### `GET /api/candidates/{candidate_id}`
Returns complete candidate drawer dataset:
- Document metadata + time-limited secure access signed URL
- Extracted text snippets (raw & normalized)
- Structured profile with verbatim evidence snippets
- Verified evidence items with pass/fail verification flags
- Both LCA and UI/UX evaluation breakdowns with criterion weights and notes
- Processing warnings and confidence score

#### `POST /api/candidates/{candidate_id}/retry`
Triggers immediate reprocessing of a candidate document (re-runs text extraction, profile extraction, and dual evaluation).

#### `GET /api/candidates/{candidate_id}/status`
Returns processing job stage, attempt count, and safe error messages.

#### `GET /api/methodology`
Returns authoritative methodology specification, role criteria, weights, thresholds, and governance rules.

---

### 2.6 System & Health (`/api/health`)

#### `GET /api/health`
Returns system status, active database engine (`sqlite` or `supabase`), storage bucket, and LLM provider.

