-- =============================================================================
-- Migration 001: Initial Schema
-- =============================================================================
-- Phase 01 foundation schema for WCP Compliance Agent.
-- Provides the database structures needed for Phase 02 features.
--
-- Run: psql -U wcp_user -d wcp_compliance -f migrations/001_initial_schema.sql
-- Requires: PostgreSQL 14+ with pgvector extension
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- For BM25-style fuzzy text search

-- =============================================================================
-- Wage Determination Vectors
-- Core table for hybrid retrieval (Phase 02)
-- =============================================================================

CREATE TABLE IF NOT EXISTS wage_determination_vectors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wd_id           VARCHAR(50)     NOT NULL,           -- SAM.gov WD number (e.g., "WD-2024-0490")
    job_title       VARCHAR(200)    NOT NULL,           -- Official DBWD job title
    trade_code      VARCHAR(50),                       -- DOL trade classification code
    locality        VARCHAR(100),                       -- County/locality code
    state           CHAR(2),                           -- State abbreviation
    wage_rate       DECIMAL(10,2),                     -- Base hourly wage rate
    fringe_rate     DECIMAL(10,2),                     -- Fringe benefits per hour
    effective_date  DATE,                              -- Rate effective date
    expiry_date     DATE,                              -- Rate expiry date (null = current)
    embedding       VECTOR(1536),                      -- OpenAI text-embedding-3-small
    metadata        JSONB           DEFAULT '{}',      -- Supplementary data
    source_url      TEXT,                              -- SAM.gov source URL
    created_at      TIMESTAMP       DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

-- HNSW index for approximate nearest-neighbor search (pgvector)
CREATE INDEX IF NOT EXISTS idx_wage_det_embedding
    ON wage_determination_vectors
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN index for trigram text search (BM25-like keyword matching)
CREATE INDEX IF NOT EXISTS idx_wage_det_job_title_trgm
    ON wage_determination_vectors
    USING gin (job_title gin_trgm_ops);

-- Standard indices
CREATE INDEX IF NOT EXISTS idx_wage_det_wd_id       ON wage_determination_vectors (wd_id);
CREATE INDEX IF NOT EXISTS idx_wage_det_trade_code  ON wage_determination_vectors (trade_code);
CREATE INDEX IF NOT EXISTS idx_wage_det_locality    ON wage_determination_vectors (locality, state);
CREATE INDEX IF NOT EXISTS idx_wage_det_effective   ON wage_determination_vectors (effective_date DESC);

-- =============================================================================
-- Decision Audit Log
-- Persistent record of all compliance decisions (Phase 02)
-- =============================================================================

CREATE TABLE IF NOT EXISTS decisions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id        VARCHAR(100)    UNIQUE NOT NULL,    -- Pipeline trace ID
    input_hash      VARCHAR(64)     NOT NULL,           -- SHA-256 of raw input (for dedup)
    final_status    VARCHAR(50)     NOT NULL,           -- Approved | Revise | Reject | Pending Human Review
    trust_score     DECIMAL(4,3),                      -- 0.000 - 1.000
    trust_band      VARCHAR(20),                        -- auto | flag_for_review | require_human
    layer1_score    DECIMAL(4,3),                      -- Deterministic layer score
    model_used      VARCHAR(50),                        -- LLM model (e.g., gpt-4o-mini)
    processing_ms   INTEGER,                            -- Total processing time
    created_at      TIMESTAMP       DEFAULT NOW(),
    payload         JSONB           NOT NULL            -- Full TrustScoredDecision JSON
);

CREATE INDEX IF NOT EXISTS idx_decisions_trace_id    ON decisions (trace_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status      ON decisions (final_status);
CREATE INDEX IF NOT EXISTS idx_decisions_trust_band  ON decisions (trust_band);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at  ON decisions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_input_hash  ON decisions (input_hash);

-- =============================================================================
-- Human Review Queue
-- Persistent review queue for low-trust decisions (replaces in-memory stub)
-- =============================================================================

CREATE TABLE IF NOT EXISTS human_review_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id        VARCHAR(100)    UNIQUE NOT NULL,    -- Links to decisions.trace_id
    priority        VARCHAR(20)     NOT NULL            -- low | normal | high | critical
                        CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'escalated')),
    trust_score     DECIMAL(4,3),                      -- Snapshot of trust score at enqueue
    trust_band      VARCHAR(20),                        -- Snapshot of trust band
    assigned_to     VARCHAR(100),                       -- Reviewer identifier
    reviewer_decision VARCHAR(50),                     -- Approved | Revise | Reject | override_*
    notes           TEXT,                              -- Reviewer notes
    queued_at       TIMESTAMP       DEFAULT NOW(),
    started_at      TIMESTAMP,                         -- When reviewer began
    completed_at    TIMESTAMP,                         -- When review completed
    reviewed_at     TIMESTAMP,                         -- Alias for completed_at (compatibility)
    reviewer_id     VARCHAR(100),                      -- Alias for assigned_to (compatibility)
    resolution      JSONB,                             -- Full resolution details
    audit_trail     JSONB           DEFAULT '[]'       -- Array of ReviewAuditEvent
);

CREATE INDEX IF NOT EXISTS idx_hrq_trace_id     ON human_review_queue (trace_id);
CREATE INDEX IF NOT EXISTS idx_hrq_status       ON human_review_queue (status);
CREATE INDEX IF NOT EXISTS idx_hrq_priority     ON human_review_queue (priority);
CREATE INDEX IF NOT EXISTS idx_hrq_assigned_to  ON human_review_queue (assigned_to);
CREATE INDEX IF NOT EXISTS idx_hrq_queued_at    ON human_review_queue (queued_at DESC);

-- =============================================================================
-- Prompt Registry
-- Versioned prompt storage for Phase 02 prompt infrastructure
-- =============================================================================

CREATE TABLE IF NOT EXISTS prompts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_key      VARCHAR(100)    NOT NULL,           -- Logical key (e.g., "wcp_verdict_v2")
    version         INTEGER         NOT NULL,           -- Version number (increments)
    content         TEXT            NOT NULL,           -- Prompt template text
    variables       JSONB           DEFAULT '[]',       -- Expected template variables
    model_hint      VARCHAR(50),                        -- Recommended model
    org_id          VARCHAR(100),                       -- Organization override (null = global)
    is_active       BOOLEAN         DEFAULT FALSE,      -- Whether this version is active
    created_at      TIMESTAMP       DEFAULT NOW(),
    deprecated_at   TIMESTAMP,
    UNIQUE (prompt_key, version, org_id)
);

CREATE INDEX IF NOT EXISTS idx_prompts_key_active   ON prompts (prompt_key, is_active);
CREATE INDEX IF NOT EXISTS idx_prompts_org_id        ON prompts (org_id);

-- =============================================================================
-- Schema Version Tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version         VARCHAR(50)     PRIMARY KEY,
    description     TEXT            NOT NULL,
    applied_at      TIMESTAMP       DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Initial schema: wage_determination_vectors, decisions, human_review_queue, prompts')
ON CONFLICT (version) DO NOTHING;
