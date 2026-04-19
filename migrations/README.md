# Database Migrations

This directory contains SQL migration scripts for the WCP Compliance Agent PostgreSQL database.

## Current Status

| Migration | Description | Status |
|-----------|-------------|--------|
| `001_initial_schema.sql` | Initial schema (vectors, decisions, review queue, prompts) | Phase 02 prereq |

## Prerequisites

- PostgreSQL 14+ with [pgvector](https://github.com/pgvector/pgvector) extension
- Run via Docker: `docker compose up -d` (see `docs/development/postgres-setup.md`)

## Running Migrations

```bash
# Run all migrations
psql -U wcp_user -d wcp_compliance -f migrations/001_initial_schema.sql

# Or using the Docker service
docker compose exec postgres psql -U wcp_user -d wcp_compliance \
  -f /migrations/001_initial_schema.sql
```

## Migration Conventions

- **Numbered**: `NNN_descriptive_name.sql` (zero-padded to 3 digits)
- **Idempotent**: All statements use `CREATE IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`
- **Additive only**: Never drop tables or columns — use new migrations for schema changes
- **Self-documenting**: Each file has a header block with purpose and dependencies

## Schema Overview

### `wage_determination_vectors`
Core table for hybrid retrieval (Phase 02). Stores DBWD rate data with 1536-dim vector embeddings for semantic search. Includes HNSW index for ANN search and GIN trigram index for keyword search.

### `decisions`
Audit log of all compliance decisions. Stores the full `TrustScoredDecision` payload as JSONB alongside key metrics (trust score, model, latency) for analytics.

### `human_review_queue`
Persistent replacement for the Phase 01 in-memory review queue. Stores decisions requiring human review with full audit trail.

### `prompts`
Versioned prompt registry for Phase 02 prompt infrastructure. Supports per-organization overrides and version pinning.

### `schema_migrations`
Tracks which migrations have been applied.

## Adding a New Migration

1. Create `migrations/NNN_description.sql`
2. Use `CREATE IF NOT EXISTS` and `ON CONFLICT DO NOTHING` for idempotency
3. Add a row to `schema_migrations`
4. Update this README
5. Document the schema change in `docs/architecture/`
