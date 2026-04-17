# Warehouse: Payroll Analytics (Redshift/BigQuery)

Status Label: Designed / Target

Truth anchors:

- [`./INDEX.md`](./INDEX.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`../architecture/system-overview.md`](../architecture/system-overview.md)

## Role in the System

The analytics warehouse serves as the authoritative source for compliance reporting, trend analysis, and LLM tool queries over historical decisions. It enables questions like "Which contractors have the most wage violations?" and "Are approval rates increasing for a given trade?" without burdening the operational database.

## WCP Domain Mapping

| Revenue Intelligence Concept | WCP Compliance Equivalent |
|---|---|
| Sales rep performance | Contractor violation rates and trends |
| Deal stage conversion | Submission → finding → appeal → resolution pipeline |
| Account health score | Contractor compliance score (weighted violations) |
| Opportunity win rate | Decision approval rate by trade/locality |

## Architecture

```mermaid
flowchart TB
    subgraph Sources["Data Sources"]
        PG[(PostgreSQL<br/>Operational DB)]
        Decisions[Decision Service]
    end

    subgraph ETL["ETL Pipeline"]
        Daily[Daily Extract]
        Transform[Transform & Enrich]
        Load[Load to Warehouse]
    end

    subgraph Warehouse["Redshift Warehouse"]
        Fact[Fact Tables]
        Dim[Dimension Tables]
    end

    subgraph Consumers["Query Consumers"]
        BI[BI Dashboards]
        LLM[LLM Tools<br/>queryWarehouse()]
        Audit[Audit Queries]
    end

    Sources --> ETL
    ETL --> Warehouse
    Warehouse --> Consumers
```

## Schema Design

### Dimension Tables

```sql
-- contractors dimension
CREATE TABLE dim_contractors (
    contractor_sk BIGINT PRIMARY KEY,
    contractor_id VARCHAR(64) NOT NULL,
    contractor_name VARCHAR(255),
    dba_name VARCHAR(255),
    ein VARCHAR(20),
    registration_date DATE,
    contractor_status VARCHAR(20), -- 'active', 'suspended', 'inactive'
    -- SCD Type 2 fields
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN DEFAULT TRUE
);

-- projects dimension
CREATE TABLE dim_projects (
    project_sk BIGINT PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    project_name VARCHAR(255),
    project_type VARCHAR(50), -- 'federal', 'state', 'private'
    location_city VARCHAR(100),
    location_state VARCHAR(2),
    contract_value DECIMAL(15, 2),
    project_start_date DATE,
    project_end_date DATE,
    effective_date DATE,
    is_current BOOLEAN DEFAULT TRUE
);

-- trades dimension
CREATE TABLE dim_trades (
    trade_sk BIGINT PRIMARY KEY,
    trade_code VARCHAR(20) NOT NULL,
    trade_name VARCHAR(255),
    trade_category VARCHAR(50),
    dbwd_category VARCHAR(50),
    effective_date DATE,
    is_current BOOLEAN DEFAULT TRUE
);

-- time dimension
CREATE TABLE dim_time (
    time_sk INT PRIMARY KEY, -- YYYYMMDD format
    full_date DATE NOT NULL,
    year SMALLINT,
    quarter TINYINT,
    month TINYINT,
    week_of_year TINYINT,
    day_of_week TINYINT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);
```

### Fact Tables

```sql
-- wage determinations fact (from DBWD ingestion)
CREATE TABLE fact_wage_determinations (
    determination_sk BIGINT PRIMARY KEY,
    time_sk INT REFERENCES dim_time(time_sk),
    trade_sk BIGINT REFERENCES dim_trades(trade_sk),
    locality_code VARCHAR(20),
    base_wage DECIMAL(10, 2),
    fringe_benefits DECIMAL(10, 2),
    total_package DECIMAL(10, 2),
    effective_date DATE,
    expiration_date DATE,
    source_document_url VARCHAR(500)
);

-- submissions fact
CREATE TABLE fact_submissions (
    submission_sk BIGINT PRIMARY KEY,
    time_sk INT REFERENCES dim_time(time_sk),
    contractor_sk BIGINT REFERENCES dim_contractors(contractor_sk),
    project_sk BIGINT REFERENCES dim_projects(project_sk),
    submission_id VARCHAR(64) NOT NULL,
    submission_date DATE,
    reporting_period_start DATE,
    reporting_period_end DATE,
    worker_count INT,
    total_hours DECIMAL(10, 2),
    total_wages DECIMAL(15, 2),
    submission_status VARCHAR(20)
);

-- decisions fact (core for compliance tracking)
CREATE TABLE fact_decisions (
    decision_sk BIGINT PRIMARY KEY,
    time_sk INT REFERENCES dim_time(time_sk),
    contractor_sk BIGINT REFERENCES dim_contractors(contractor_sk),
    project_sk BIGINT REFERENCES dim_projects(project_sk),
    submission_sk BIGINT REFERENCES fact_submissions(submission_sk),
    decision_id VARCHAR(64) NOT NULL,
    decision_timestamp TIMESTAMP,
    decision_outcome VARCHAR(20), -- 'approved', 'rejected', 'deferred'
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    finding_count INT,
    critical_finding_count INT,
    processing_time_ms INT,
    llm_tokens_used INT,
    retrieval_hit_count INT,
    agent_version VARCHAR(50)
);

-- findings fact (for violation analysis)
CREATE TABLE fact_findings (
    finding_sk BIGINT PRIMARY KEY,
    decision_sk BIGINT REFERENCES fact_decisions(decision_sk),
    time_sk INT REFERENCES dim_time(time_sk),
    contractor_sk BIGINT REFERENCES dim_contractors(contractor_sk),
    finding_type VARCHAR(50), -- 'underpayment', 'overtime_violation', etc.
    severity VARCHAR(20), -- 'critical', 'warning', 'info'
    trade_code VARCHAR(20),
    affected_workers INT,
    estimated_underpayment DECIMAL(10, 2),
    was_corrected BOOLEAN
);
```

## LLM Tool Interface

The warehouse is exposed to the decision agent via a bounded tool interface:

```typescript
// src/mastra/tools/warehouse-tool.ts

import { z } from 'zod';
import { createTool } from '@mastra/core';

/**
 * Schema for warehouse query parameters.
 * Only read-only SELECT queries are allowed.
 */
export const WarehouseQuerySchema = z.object({
  query: z.string()
    .describe('SQL SELECT query against warehouse schema')
    .refine(
      (q) => q.trim().toUpperCase().startsWith('SELECT'),
      { message: 'Only SELECT queries are allowed' }
    )
    .refine(
      (q) => !/DROP|DELETE|INSERT|UPDATE|ALTER/i.test(q),
      { message: 'Modifying queries are not allowed' }
    ),
  maxRows: z.number().int().min(1).max(1000).default(100)
    .describe('Maximum rows to return'),
});

export type WarehouseQueryInput = z.infer<typeof WarehouseQuerySchema>;

export interface WarehouseQueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

/**
 * Tool: queryWarehouse
 * 
 * Allows the LLM to query historical compliance data for context.
 * Queries are sandboxed to SELECT only and limited to 1000 rows.
 */
export const queryWarehouseTool = createTool({
  id: 'query-warehouse',
  description: `Query the compliance analytics warehouse for historical trends.
Use this to get context on contractor violation history, 
trade-specific issues, or approval rate patterns.`,
  inputSchema: WarehouseQuerySchema,
  execute: async ({ query, maxRows }): Promise<WarehouseQueryResult> => {
    // Implementation would connect to Redshift/BigQuery via connection pool
    // with read-only credentials
    throw new Error('Not implemented - warehouse connection required');
  },
});

/**
 * Pre-defined safe query builders for common patterns
 */
export const SafeWarehouseQueries = {
  contractorViolations: (contractorId: string, months: number) => `
    SELECT 
      d.full_date as violation_date,
      f.finding_type,
      f.severity,
      f.affected_workers,
      f.estimated_underpayment
    FROM fact_findings f
    JOIN dim_time d ON f.time_sk = d.time_sk
    JOIN dim_contractors c ON f.contractor_sk = c.contractor_sk
    WHERE c.contractor_id = '${contractorId}'
      AND d.full_date >= DATEADD(month, -${months}, CURRENT_DATE)
      AND c.is_current = TRUE
    ORDER BY d.full_date DESC
    LIMIT 50
  `,
  
  tradeApprovalRates: (tradeCode: string, months: number) => `
    SELECT 
      t.month,
      COUNT(*) as total_decisions,
      SUM(CASE WHEN decision_outcome = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN decision_outcome = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN decision_outcome = 'deferred' THEN 1 ELSE 0 END) as deferred,
      AVG(confidence_score) as avg_confidence
    FROM fact_decisions d
    JOIN dim_time t ON d.time_sk = t.time_sk
    WHERE d.trade_code = '${tradeCode}'
      AND t.full_date >= DATEADD(month, -${months}, CURRENT_DATE)
    GROUP BY t.month
    ORDER BY t.month DESC
  `,
  
  contractorRiskScore: (contractorId: string) => `
    SELECT 
      c.contractor_id,
      c.contractor_name,
      COUNT(DISTINCT f.decision_sk) as total_violations,
      SUM(f.critical_finding_count) as critical_findings,
      AVG(d.confidence_score) as avg_decision_confidence,
      MAX(d.decision_timestamp) as last_submission
    FROM dim_contractors c
    LEFT JOIN fact_decisions d ON c.contractor_sk = d.contractor_sk
    LEFT JOIN fact_findings f ON d.decision_sk = f.decision_sk
    WHERE c.contractor_id = '${contractorId}'
      AND c.is_current = TRUE
    GROUP BY c.contractor_id, c.contractor_name
  `
};
```

## Config Example

```bash
# .env (for warehouse connection - never commit real credentials)

# Redshift configuration
REDSHIFT_HOST=your-cluster.redshift.amazonaws.com
REDSHIFT_PORT=5439
REDSHIFT_DATABASE=compliance_warehouse
REDSHIFT_USERNAME=read_only_user
REDSHIFT_PASSWORD=secure_password_here
REDSHIFT_SCHEMA=public

# Connection pooling
REDSHIFT_MAX_CONNECTIONS=10
REDSHIFT_CONNECTION_TIMEOUT=30000
REDSHIFT_QUERY_TIMEOUT=60000

# Alternative: BigQuery
BIGQUERY_PROJECT_ID=your-project-id
BIGQUERY_DATASET=compliance_warehouse
BIGQUERY_LOCATION=US

# Use service account JSON (path or env var)
# BIGQUERY_CREDENTIALS_PATH=/path/to/service-account.json
```

## Integration Points

| Existing File | Integration |
|---|---|
| `src/mastra/tools/` | Add `warehouse-tool.ts` with bounded query interface |
| `src/mastra/tools/wcp-tools.ts` | Extend with warehouse-backed context queries |
| `src/entrypoints/wcp-entrypoint.ts` | Optionally inject warehouse context for repeat contractors |
| `src/types/index.ts` | Add warehouse result types |

## Trade-offs

| Decision | Rationale |
|---|---|
| **Redshift vs BigQuery** | Redshift if team has AWS investment and needs low-latency dashboards. BigQuery if cost model (query-based) fits irregular access patterns better. |
| **Daily ETL vs Streaming** | Daily batch sufficient for compliance reporting. Real-time streaming adds complexity without clear benefit for this domain. |
| **Read-only tool vs Full ORM** | Bounded SQL interface keeps LLM queries inspectable and auditable. Full ORM adds abstraction overhead. |
| **Star schema vs Normalized** | Star schema optimizes for the query patterns we expect (time-series, aggregations by contractor/trade). |

## Implementation Phasing

### Phase 1: Schema & ETL
- Define dimension and fact tables
- Build ETL pipeline from operational Postgres
- Verify data quality

### Phase 2: Tool Integration
- Implement `queryWarehouseTool`
- Add safe query builders
- Connect to decision engine

### Phase 3: Advanced Queries
- Pre-built contractor risk score
- Trade approval rate trends
- Violation pattern detection

## Security Considerations

- Warehouse credentials should be read-only
- Query logs should be retained for audit
- PII (worker names, SSNs) should NOT be replicated to warehouse
- Contractor and project identifiers are acceptable
- All queries logged with trace correlation
