-- ==============================================================================
-- Rankres ATS — Complete Supabase PostgreSQL Schema
-- Run this script in the Supabase SQL Editor to set up all tables and indexes.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_code VARCHAR(32) UNIQUE NOT NULL,
    classification VARCHAR(32) NOT NULL DEFAULT 'NEITHER_OR_UNCERTAIN',
    processing_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    lca_score NUMERIC(5, 2) NULL,
    uiux_score NUMERIC(5, 2) NULL,
    evaluation_status VARCHAR(32) NOT NULL DEFAULT 'UNSCORING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(processing_status);
CREATE INDEX IF NOT EXISTS idx_candidates_classification ON candidates(classification);
CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(candidate_code);

-- 2. Resume Documents Table
CREATE TABLE IF NOT EXISTS resume_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_size INTEGER NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    page_count INTEGER NULL,
    raw_text TEXT,
    normalized_text TEXT,
    parser_name VARCHAR(64),
    parser_version VARCHAR(32),
    extraction_status VARCHAR(32) DEFAULT 'PENDING',
    extraction_warnings JSONB DEFAULT '[]'::jsonb,
    extracted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_documents_hash ON resume_documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_resume_documents_candidate ON resume_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resume_documents_extraction_status ON resume_documents(extraction_status);

-- 3. Job Descriptions Table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(32) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    source_text TEXT NOT NULL,
    requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    version VARCHAR(32) NOT NULL DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_role_key ON job_descriptions(role_key);

-- 4. Processing Jobs Table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    stage VARCHAR(64) NOT NULL DEFAULT 'INGESTION',
    attempt_count INTEGER NOT NULL DEFAULT 1,
    error_code VARCHAR(64) NULL,
    error_message_safe TEXT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_candidate ON processing_jobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);

-- 5. Candidate Profiles Table
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    profile_json JSONB NOT NULL,
    schema_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    model_provider VARCHAR(64) NOT NULL,
    model_name VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    extraction_confidence FLOAT NOT NULL DEFAULT 1.0,
    validation_status VARCHAR(32) NOT NULL DEFAULT 'VALIDATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_candidate ON candidate_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_status ON candidate_profiles(validation_status);

-- 6. Evidence Items Table
CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    field_key VARCHAR(128) NOT NULL,
    evidence_text TEXT NOT NULL,
    page_number INTEGER NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    validation_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_items_candidate ON evidence_items(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_field ON evidence_items(field_key);

-- 7. Candidate Evaluations Table
CREATE TABLE IF NOT EXISTS candidate_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    role_key VARCHAR(32) NOT NULL,
    score NUMERIC(5, 2) NULL,
    scoring_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_qualified BOOLEAN NOT NULL DEFAULT FALSE,
    qualification_status VARCHAR(32) NOT NULL DEFAULT 'UNQUALIFIED',
    summary TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_candidate_role UNIQUE (candidate_id, role_key)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_role_score ON candidate_evaluations(role_key, score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate ON candidate_evaluations(candidate_id);
