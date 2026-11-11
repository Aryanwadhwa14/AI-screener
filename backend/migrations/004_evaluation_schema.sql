-- Phase 4: Database Migration: Evaluation & Scoring Schema
-- Tables: candidate_evaluations
-- Columns: lca_score, uiux_score on candidates

CREATE TABLE IF NOT EXISTS candidate_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    role_key VARCHAR(32) NOT NULL, -- 'LCA' or 'UI_UX'
    score NUMERIC(5, 2) NULL, -- NULL represents unavailable/failed score (Methodology Rule: never force to 0)
    scoring_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_qualified BOOLEAN NOT NULL DEFAULT FALSE,
    qualification_status VARCHAR(32) NOT NULL DEFAULT 'UNQUALIFIED', -- 'QUALIFIED', 'UNQUALIFIED', 'MANUAL_REVIEW_REQUIRED'
    summary TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_candidate_role UNIQUE (candidate_id, role_key)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_role_score ON candidate_evaluations(role_key, score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate ON candidate_evaluations(candidate_id);

-- Add denormalized score cache columns on candidates for high-performance dashboard queries
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS lca_score NUMERIC(5, 2) NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS uiux_score NUMERIC(5, 2) NULL;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(32) NOT NULL DEFAULT 'UNSCORING';

