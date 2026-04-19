# PostgreSQL + pgvector Setup Guide

Status Label: Designed / Target

This guide explains how to set up PostgreSQL with the `pgvector` extension for local development of the WCP Compliance Agent. The database is required for Phase 02 features (hybrid retrieval, persistent decisions, human review queue persistence).

---

## Why PostgreSQL + pgvector?

| Need | Solution |
|------|---------|
| Vector storage for DBWD embeddings | pgvector HNSW index |
| Persistent decision audit log | PostgreSQL JSONB |
| Human review queue persistence | Replaces in-memory stub |
| Prompt registry | Versioned prompt table |

**Current state (Phase 01)**: The application uses in-memory stubs. The database is not required to run `npm run dev`, `npm test`, or `npm run test:pipeline`.

**Phase 02**: Database becomes required for hybrid retrieval and persistent decisions.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 18+ (already required by the project)
- `psql` client (optional, for manual inspection)

---

## Quick Start

### 1. Start PostgreSQL + pgvector

```bash
# From the project root
docker compose up -d
```

Verify it started:

```bash
docker compose ps
# Should show: wcp_postgres   running (healthy)
```

### 2. Confirm the Database is Ready

```bash
# Check connection (no psql required)
docker compose exec postgres pg_isready -U wcp_user -d wcp_compliance

# Expected output:
# /var/run/postgresql:5432 - accepting connections
```

### 3. Run Migrations

```bash
# Apply the initial schema
docker compose exec postgres psql -U wcp_user -d wcp_compliance \
  -f /migrations/001_initial_schema.sql
```

Expected output includes lines like:
```
CREATE EXTENSION
CREATE TABLE
CREATE INDEX
...
INSERT 0 1
```

### 4. Verify Schema

```bash
docker compose exec postgres psql -U wcp_user -d wcp_compliance -c "\dt"
```

Expected tables:
```
 Schema |            Name             | Type  |  Owner
--------+-----------------------------+-------+---------
 public | decisions                   | table | wcp_user
 public | human_review_queue          | table | wcp_user
 public | prompts                     | table | wcp_user
 public | schema_migrations           | table | wcp_user
 public | wage_determination_vectors  | table | wcp_user
```

### 5. Update Your .env

Add the database connection variables to your `.env`:

```bash
# Copy these into your .env
DATABASE_URL=postgresql://wcp_user:wcp_dev_password@localhost:5432/wcp_compliance
POSTGRES_USER=wcp_user
POSTGRES_PASSWORD=wcp_dev_password
POSTGRES_DB=wcp_compliance
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Or copy from `.env.example`:

```bash
# The .env.example already has these defaults set
```

---

## Configuration

The `docker-compose.yml` reads environment variables from `.env`. Defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `wcp_user` | Database user |
| `POSTGRES_PASSWORD` | `wcp_dev_password` | Database password |
| `POSTGRES_DB` | `wcp_compliance` | Database name |
| `POSTGRES_PORT` | `5432` | Host port to bind |

To change any default, set the variable in `.env` before running `docker compose up`.

---

## Verifying pgvector

Confirm the pgvector extension is active:

```bash
docker compose exec postgres psql -U wcp_user -d wcp_compliance \
  -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

Expected output shows one row with `extname = vector`.

Test a basic vector operation:

```bash
docker compose exec postgres psql -U wcp_user -d wcp_compliance -c "
  SELECT '[1,2,3]'::vector <=> '[4,5,6]'::vector AS cosine_distance;
"
```

---

## Persistent Data

Data is stored in Docker volume `wcp_postgres_data`. It persists across `docker compose down` restarts.

To **wipe all data** and start fresh:

```bash
docker compose down -v
docker compose up -d
# Then re-run migrations
```

---

## Troubleshooting

### Port already in use

```
Error response from daemon: Ports are not available: listen tcp 0.0.0.0:5432
```

Either stop the conflicting service, or change the port in `.env`:

```bash
POSTGRES_PORT=5433
```

Then update `DATABASE_URL` to use port 5433.

### pgvector extension not found

If the `CREATE EXTENSION vector` fails, the Docker image may not include pgvector. Make sure you're using `ankane/pgvector:latest` (not `postgres:latest`).

### Migration fails: relation already exists

Migrations use `CREATE IF NOT EXISTS` — they are safe to re-run. If you see other errors, check the migration file for syntax issues.

### Can't connect from the app

Verify your `.env` has the correct connection string and restart the dev server:

```bash
DATABASE_URL=postgresql://wcp_user:wcp_dev_password@localhost:5432/wcp_compliance
```

---

## Teardown

```bash
# Stop containers (keep data)
docker compose down

# Stop and remove all data
docker compose down -v
```

---

## Using with Supabase (Alternative)

For cloud-based development, Supabase offers a free tier with pgvector pre-enabled:

1. Create a project at [supabase.com](https://supabase.com)
2. Enable the vector extension in the Supabase SQL editor: `CREATE EXTENSION vector;`
3. Run migrations via the Supabase SQL editor or CLI
4. Set `DATABASE_URL` to your Supabase connection string

See [ADR-002](../adrs/ADR-002-hybrid-retrieval.md) for the retrieval architecture decisions.

---

## References

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [ankane/pgvector Docker image](https://hub.docker.com/r/ankane/pgvector)
- `docker-compose.yml` — service definition
- `migrations/` — SQL migration files
- `migrations/README.md` — migration conventions
- `docs/adrs/ADR-002-hybrid-retrieval.md` — why pgvector over Pinecone/Weaviate

---

**Last Updated**: 2026-04-19
**Status**: Phase 02 prerequisite (not required for Phase 01 testing)
