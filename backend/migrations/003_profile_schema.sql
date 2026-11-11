-- Phase 3 Migration: Candidate Profiles & Evidence Items Schema

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

