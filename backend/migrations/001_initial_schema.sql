-- Phase 1: Database Migration: Initial Schema
-- Tables: candidates, resume_documents, job_descriptions, processing_jobs

-- Enable pgcrypto for gen_random_uuid() if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_code VARCHAR(32) UNIQUE NOT NULL,
    classification VARCHAR(32) NOT NULL DEFAULT 'NEITHER_OR_UNCERTAIN',
    processing_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(processing_status);
CREATE INDEX IF NOT EXISTS idx_candidates_classification ON candidates(classification);
CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(candidate_code);

-- 2. Resume documents table
CREATE TABLE IF NOT EXISTS resume_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_size INTEGER NOT NULL,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    page_count INTEGER NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_documents_hash ON resume_documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_resume_documents_candidate ON resume_documents(candidate_id);

-- 3. Job descriptions table
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

-- 4. Processing jobs table
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

