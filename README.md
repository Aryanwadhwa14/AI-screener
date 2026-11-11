# GFI AI Resume Screener

AI-assisted resume screening, structured extraction, deterministic dual-role scoring, explainable ranking, and HR reviewer web application for Growth For Impact (GFI).

---

## 1. Overview & Problem Definition

The **GFI AI Resume Screener** automates the evaluation of candidates across two distinct roles specified in the canonical job descriptions:
1. **Life Cycle Assessment (LCA) Consultant** — Onsite in Chennai, requiring 2–3 years baseline experience (per canonical `JD1 (LCA).txt` Lines 29–30), proficiency in GaBi or SimaPro modeling software, and ISO 14040/14044 standard conformance.
2. **UI/UX Designer Intern** — Fully remote position, targeting 0–1 years of experience (per `JD2.txt` Line 19), Figma prototyping, user research, cognitive psychology, and portfolio deliverables.

The system processes native `.docx` and `.pdf` resumes, extracts structured candidate profiles using schema-constrained AI extraction, verifies all cited claims against raw resume text to eliminate hallucinations, computes deterministic role-fit scores (0–100) using versioned formulas, and provides an HR reviewer dashboard.

---

## 2. Core Architecture & Design Decisions

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, custom obsidian/orange design system (`#020203` background, `#FF5729` accent), and exact WebGL1 Waves ambient background shader (`assets/Waves.frag`).
- **Backend:** Python 3.12+, FastAPI, Pydantic v2 schemas, PyMuPDF, python-docx.
- **Scoring Authority:** Generative AI is strictly restricted to structured data extraction and evidence quotation; all final scores and rankings are calculated deterministically in Python using versioned criteria.
- **Zero-Hallucination Evidence Grounding:** The `EvidenceVerifier` ensures that every cited skill, tool, or experience snippet is physically present in the resume text. Unverified claims are stripped and penalize extraction confidence.
- **Fairness & Demographic Blindness:** Zero protected personal characteristics (gender, age, marital status, race, religion, photos) are stored or factored into scoring. Missing relocation willingness is represented as `UNKNOWN` with neutral credit (never inferred as `False`). Empty documents are assigned `null` scores with `MANUAL_REVIEW_REQUIRED` (never an artificial zero).
- **Dual Adapter Architecture:** Transparent dual repository (`SupabaseRepository` vs `SQLiteRepository`) and dual storage (`SupabaseStorageService` vs `LocalStorageService`), allowing seamless local execution out-of-the-box and production cloud deployment.

---

## 3. Repository Structure

```text
gfi-ai-resume-screener/
├── frontend/                     # Next.js App Router Frontend
│   ├── app/                      # Application routes (/, /rankings/lca, /rankings/uiux, /methodology)
│   ├── components/
│   │   ├── candidates/           # Candidate Reviewer Drawer & inspector
│   │   ├── layout/               # AppShell, Navbar, ReviewerContext
│   │   ├── rankings/             # Reusable threshold-aware RankingTable
│   │   ├── shader/               # Exact WebGL1 Waves ambient shader
│   │   └── upload/               # Drag & drop upload modal
│   ├── lib/                      # Typed API client and TypeScript interfaces
│   └── Dockerfile                # Production multi-stage Docker build
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                  # Endpoints (candidates, rankings, resumes, health, methodology)
│   │   ├── core/                 # Environment configuration & security
│   │   ├── models/               # Relational entity definitions
│   │   ├── schemas/              # Pydantic v2 schemas (profiles, evaluations, reviewer)
│   │   ├── services/             # Ingestion, extraction, verification, scoring
│   │   └── main.py               # FastAPI entrypoint & router registration
│   ├── migrations/               # SQL schema migrations (001 to 004)
│   ├── tests/                    # 45 automated pytest unit and integration tests
│   ├── requirements.txt
│   └── Dockerfile                # Production Python 3.12 container
│
├── data/                         # Canonical JDs & initial 47 anonymized resumes
├── docs/                         # PRD, Architecture, Rules, Roadmap, Operations
│   ├── analysis/                 # Source data audits, JD review, fairness & evaluation logs
│   ├── Deployment_Guide.md       # Step-by-step production deployment instructions
│   ├── Memory.md                 # Project trajectory & architectural decision log (ADRs)
│   └── Phases.md                 # Phase-wise implementation verification status
├── assets/                       # Exact Waves.frag fragment shader
├── docker-compose.yml            # One-click multi-container production orchestration
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 4. Quick Start & Local Execution

### Option A: Running Directly on Host

#### 1. Backend (FastAPI)
```powershell
# In terminal 1 (from repository root):
$env:PYTHONPATH='backend'
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 2. Frontend (Next.js)
```powershell
# In terminal 2:
cd frontend
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 3. Run Automated Tests
```powershell
$env:PYTHONPATH='backend'
pytest backend/tests -v
```
*(45 passed across all test suites)*

---

### Option B: Docker Compose (One-Click Production)

```bash
docker compose up --build -d
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 5. Cloud Deployment (Vercel + Render + Supabase)

Detailed step-by-step instructions with screenshot guidance are available in [`docs/Deployment_Guide.md`](docs/Deployment_Guide.md):
1. **Database & Storage:** Create a free project on [Supabase](https://supabase.com), run SQL scripts in `backend/migrations/`, and create a private bucket named `resumes`.
2. **Backend:** Deploy `backend/` to [Render](https://render.com) or [Railway](https://railway.app), supplying `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY`.
3. **Frontend:** Deploy `frontend/` to [Vercel](https://vercel.com), setting `NEXT_PUBLIC_API_URL` to your Render backend URL.

---

## 6. Implementation Phases Summary

- [x] **Phase 0: Project Discovery, Source-Data Audit & Initialization**
- [x] **Phase 1: Database, Storage & Ingestion Foundation**
- [x] **Phase 2: Text Extraction & Normalization**
- [x] **Phase 3: Structured AI Extraction & Evidence Grounding**
- [x] **Phase 4: Deterministic Scoring Engine & Dual-Role Evaluation**
- [x] **Phase 5: Backend API & Reviewer Workflows**
- [x] **Phase 6: Frontend Dashboard & Visual Identity**
- [x] **Phase 7: Evaluation, Data Cleaning & Fairness Review**
- [x] **Phase 8: Deployment & Final Submission Packaging**

---

## 7. Submission Artifacts & Documentation Index

- **Core Trajectory Log & ADRs:** [`docs/Memory.md`](docs/Memory.md)
- **Phase Verification Matrix:** [`docs/Phases.md`](docs/Phases.md)
- **Deployment Operations Guide:** [`docs/Deployment_Guide.md`](docs/Deployment_Guide.md)
- **REST API Contract Specification:** [`docs/analysis/API_Contract.md`](docs/analysis/API_Contract.md)
- **Deterministic Scoring Specification:** [`docs/analysis/Scoring_Rules.md`](docs/analysis/Scoring_Rules.md)
- **Evaluation & Data Cleaning Log:** [`docs/analysis/Evaluation_Audit_Log.md`](docs/analysis/Evaluation_Audit_Log.md)
- **Fairness & Bias Review:** [`docs/analysis/Fairness_Review.md`](docs/analysis/Fairness_Review.md)
- **Job Description Analysis:** [`docs/analysis/JD_Analysis.md`](docs/analysis/JD_Analysis.md)
