# GFI AI Resume Screener — Deployment & Operations Guide

This guide provides end-to-end instructions for deploying the GFI AI Resume Screener across two modes:
1. **Containerized Deployment (Docker / Self-Hosted / Local Production)**
2. **Cloud Managed Deployment (Vercel + Render/Railway + Supabase)**

---

## Mode A: Containerized Production (Docker Compose)

This mode runs the entire production frontend and backend locally or on any cloud VPS (AWS EC2, DigitalOcean Droplet, GCP VM) with a single command.

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+

### Quick Start
1. Clone the repository and navigate to root:
   ```bash
   cd gfi-assignment
   ```
2. (Optional) Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: If no Supabase or Gemini keys are provided, the system runs with local SQLite (`/app/data/app.db`) and local document storage.*
3. Build and launch containers:
   ```bash
   docker compose up --build -d
   ```
4. Access the applications:
   - **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Mode B: Cloud Production (Vercel + Render + Supabase)

Follow these steps to deploy a publicly accessible instance for hiring reviewers.

### Step 1: Database & Storage (Supabase)
1. Sign in to [Supabase](https://supabase.com) and create a new project.
2. Open the **SQL Editor** in the Supabase dashboard and execute the 4 migration scripts in sequence:
   - `backend/migrations/001_initial_schema.sql` (candidates, documents, job descriptions, jobs)
   - `backend/migrations/002_extraction_schema.sql` (raw and normalized text columns)
   - `backend/migrations/003_profile_schema.sql` (structured profiles and evidence items)
   - `backend/migrations/004_evaluation_schema.sql` (evaluations, score caches, rankings)
3. Navigate to **Storage** in the Supabase dashboard:
   - Click **New Bucket**.
   - Name: `resumes`
   - Privacy: **Private** (Toggle "Public bucket" OFF).
4. Navigate to **Project Settings -> API**:
   - Copy **Project URL** (`SUPABASE_URL`).
   - Copy **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`). *Never expose this key to the frontend.*

---

### Step 2: Backend Deployment (Render or Railway)

#### Option 1: Render.com
1. Sign in to [Render](https://render.com) and click **New -> Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `gfi-screener-api`
   - **Language / Runtime:** `Python 3`
   - **Root Directory:** (leave blank or select repo root)
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, add:
   - `PYTHONPATH`: `backend`
   - `ENVIRONMENT`: `production`
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app` (or `*` temporarily)
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-service-role-key`
   - `STORAGE_BUCKET_NAME`: `resumes`
   - `LLM_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: `your-gemini-api-key`
5. Click **Create Web Service**. Once deployed, copy your service URL (e.g., `https://gfi-screener-api.onrender.com`).

---

### Step 3: Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click "Edit" and choose `frontend`.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `https://gfi-screener-api.onrender.com` (your deployed backend URL from Step 2)
5. Click **Deploy**.
6. Once deployed, copy your public URL (e.g., `https://gfi-resume-screener.vercel.app`).
7. Update the `CORS_ORIGINS` variable on your backend (in Render) to match your Vercel URL.

---

## Step 4: Verification Checklist

1. Open your frontend URL (`https://your-frontend.vercel.app`).
2. Verify the **"Backend Online"** green indicator badge in the top right navigation.
3. Navigate between **Overview**, **LCA Consultant**, and **UI/UX Designer** tabs.
4. Click **"Upload Resume"** to upload a test PDF/DOCX file and verify it enters the live rankings.
5. Click any candidate row to verify the slide-over inspector displays:
   - Dual role match scores and criterion breakdown.
   - Verbatim verified source evidence.
   - Normalized vs. raw text toggle.
   - Secure signed download URL.

