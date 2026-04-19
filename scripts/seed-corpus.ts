/**
 * Seed DBWD Corpus
 *
 * One-shot script: loads data/dbwd-corpus.json into:
 *   1. Elasticsearch index (BM25 keyword search)
 *   2. PostgreSQL wage_determination_vectors table (pgvector similarity search)
 *
 * Idempotent — skips records already present by wdId.
 *
 * Usage:
 *   npm run seed:corpus
 *
 * Prerequisites:
 *   docker compose up -d   (starts PostgreSQL + Elasticsearch)
 *   OPENAI_API_KEY must be set for embedding generation
 *   POSTGRES_URL and ELASTICSEARCH_URL must be set
 */

import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Client as ESClient } from "@elastic/elasticsearch";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ============================================================================
// Types
// ============================================================================

interface DBWDEntry {
  wdId: string;
  tradeCode: string;
  jobTitle: string;
  aliases: string[];
  locality: string;
  state: string;
  baseRate: number;
  fringeRate: number;
  effectiveDate: string;
  description: string;
}

// ============================================================================
// Embedding generation
// ============================================================================

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || ["mock", "mock-key", "test-api-key"].includes(apiKey)) {
    // Return zero vector in mock mode
    return new Array(1536).fill(0);
  }

  const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!resp.ok) {
    throw new Error(`OpenAI embeddings API error: ${resp.status} ${await resp.text()}`);
  }

  const data = (await resp.json()) as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

// ============================================================================
// Elasticsearch seeding
// ============================================================================

async function seedElasticsearch(corpus: DBWDEntry[]): Promise<void> {
  const esUrl = process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
  const indexName = process.env.ELASTICSEARCH_INDEX ?? "dbwd_corpus";

  const es = new ESClient({ node: esUrl, requestTimeout: 10_000 });

  // Check ES is reachable
  try {
    await es.ping();
  } catch {
    console.warn("[Seed] Elasticsearch not reachable — skipping ES seeding");
    return;
  }

  // Create index if not exists
  const indexExists = await es.indices.exists({ index: indexName });
  if (!indexExists) {
    await es.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            wdId: { type: "keyword" },
            tradeCode: { type: "keyword" },
            jobTitle: { type: "text", analyzer: "english", fields: { keyword: { type: "keyword" } } },
            aliases: { type: "text", analyzer: "english" },
            locality: { type: "keyword" },
            state: { type: "keyword" },
            baseRate: { type: "float" },
            fringeRate: { type: "float" },
            effectiveDate: { type: "date" },
            description: { type: "text", analyzer: "english" },
          },
        },
        settings: { number_of_shards: 1, number_of_replicas: 0 },
      },
    });
    console.log(`[Seed] Created Elasticsearch index: ${indexName}`);
  }

  let indexed = 0;
  let skipped = 0;

  for (const entry of corpus) {
    // Check if already indexed
    const exists = await es.exists({ index: indexName, id: entry.wdId });
    if (exists) {
      skipped++;
      continue;
    }

    await es.index({
      index: indexName,
      id: entry.wdId,
      document: {
        wdId: entry.wdId,
        tradeCode: entry.tradeCode,
        jobTitle: entry.jobTitle,
        aliases: entry.aliases,
        locality: entry.locality,
        state: entry.state,
        baseRate: entry.baseRate,
        fringeRate: entry.fringeRate,
        effectiveDate: entry.effectiveDate,
        description: entry.description,
      },
    });
    indexed++;
  }

  console.log(`[Seed] Elasticsearch: ${indexed} indexed, ${skipped} skipped`);
}

// ============================================================================
// pgvector seeding
// ============================================================================

async function seedPgvector(corpus: DBWDEntry[]): Promise<void> {
  const pgUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!pgUrl || pgUrl.startsWith("file:")) {
    console.warn("[Seed] POSTGRES_URL not set or is file-based — skipping pgvector seeding");
    return;
  }

  const pool = new pg.Pool({ connectionString: pgUrl, connectionTimeoutMillis: 5_000 });

  try {
    await pool.query("SELECT 1"); // connectivity check
  } catch {
    console.warn("[Seed] PostgreSQL not reachable — skipping pgvector seeding");
    await pool.end();
    return;
  }

  // Ensure pgvector extension exists
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector");

  let inserted = 0;
  let skipped = 0;

  for (const entry of corpus) {
    // Check if already present
    const existing = await pool.query(
      "SELECT id FROM wage_determination_vectors WHERE wd_id = $1 LIMIT 1",
      [entry.wdId]
    );

    if (existing.rows.length > 0) {
      skipped++;
      continue;
    }

    const embeddingText = `${entry.jobTitle}: ${entry.description}. Aliases: ${entry.aliases.join(", ")}`;
    console.log(`[Seed] Generating embedding for ${entry.jobTitle}...`);
    const embedding = await generateEmbedding(embeddingText);

    await pool.query(
      `INSERT INTO wage_determination_vectors
         (wd_id, job_title, locality, wage_rate, fringe_rate, effective_date, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.wdId,
        entry.jobTitle,
        entry.locality,
        entry.baseRate,
        entry.fringeRate,
        entry.effectiveDate,
        `[${embedding.join(",")}]`,
        JSON.stringify({
          tradeCode: entry.tradeCode,
          aliases: entry.aliases,
          state: entry.state,
          description: entry.description,
        }),
      ]
    );
    inserted++;
  }

  await pool.end();
  console.log(`[Seed] pgvector: ${inserted} inserted, ${skipped} skipped`);
}

// ============================================================================
// Main
// ============================================================================

async function seedPrompts(): Promise<void> {
  try {
    const { seedPromptRegistry } = await import("../src/prompts/resolver.js");
    await seedPromptRegistry();
  } catch (err) {
    console.warn("[Seed] Prompt seeding failed (DB may be unavailable):", (err as Error).message);
  }
}

async function main(): Promise<void> {
  console.log("[Seed] Starting DBWD corpus seeding...");

  const corpusPath = resolve(ROOT, process.env.DBWD_CORPUS_PATH ?? "data/dbwd-corpus.json");
  const raw = await readFile(corpusPath, "utf-8");
  const corpus: DBWDEntry[] = JSON.parse(raw);

  console.log(`[Seed] Loaded ${corpus.length} corpus entries from ${corpusPath}`);

  await seedElasticsearch(corpus);
  await seedPgvector(corpus);
  await seedPrompts();

  console.log("[Seed] Done.");
}

main().catch((err) => {
  console.error("[Seed] Fatal error:", err);
  process.exit(1);
});
