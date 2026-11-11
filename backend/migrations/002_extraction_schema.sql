-- Phase 2 Migration: Add text extraction columns to resume_documents

ALTER TABLE resume_documents ADD COLUMN IF NOT EXISTS raw_text TEXT;
ALTER TABLE resume_documents ADD COLUMN IF NOT EXISTS normalized_text TEXT;
ALTER TABLE resume_documents ADD COLUMN IF NOT EXISTS parser_name VARCHAR(64);
ALTER TABLE resume_documents ADD COLUMN IF NOT EXISTS parser_version VARCHAR(32);
ALTER TABLE resume_documents ADD COLUMN IF NOT EXISTS extraction_status VARCHAR(32) DEFAULT 'PENDING';
ALTER TABLE resume_documents ADD COLUMN IF NOT EXISTS extraction_warnings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE resume_documents ADD COLUMN IF NOT EXISTS extracted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_resume_documents_extraction_status ON resume_documents(extraction_status);

