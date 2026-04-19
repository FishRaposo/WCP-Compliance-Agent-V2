# Cost Tracking: Per-Submission, Per-Org Accounting

Status Label: Designed / Target

Truth anchors:

- [`./INDEX.md`](./INDEX.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`./07-prompt-infrastructure.md`](./07-prompt-infrastructure.md)
- [`./06-observability-otel-phoenix.md`](./06-observability-otel-phoenix.md)

## Role in the System

Cost tracking provides granular accounting of LLM and infrastructure costs per submission and per contractor organization. It enables budget enforcement, cost attribution, and optimization insights—turning operational costs into actionable business metrics.

## WCP Domain Mapping

| Revenue Intelligence Concept | WCP Compliance Equivalent |
|---|---|
| Cost per call/meeting | Cost per submission review |
| Rep-level cost allocation | Contractor-org cost allocation |
| Deal stage cost tracking | Submission type cost tracking (weekly vs monthly vs final) |
| Account cost caps | Contractor budget limits and enforcement |

## Architecture

```mermaid
flowchart TB
    subgraph Sources["Cost Sources"]
        LLM[LLM API Calls]
        Embeddings[Embedding API]
        Reranker[Reranker API]
        Storage[Storage & Compute]
    end

    subgraph Tracking["Cost Tracking"]
        Middleware[Request Middleware]
        TokenCount[Token Counting]
        PriceLookup[Price Lookup]
        Accumulator[Cost Accumulator]
    end

    subgraph Attribution["Attribution"]
        Submission["Per Submission"]
        Org["Per Org (Monthly)"]
        Project["Per Project"]
    end

    subgraph Enforcement["Enforcement"]
        BudgetCheck[Budget Check]
        CircuitBreaker[Circuit Breaker]
        Alerts[Budget Alerts]
    end

    subgraph Reporting["Reporting"]
        Warehouse[Analytics Warehouse]
        Dashboard[Cost Dashboard]
        Invoices[Cost Reports]
    end

    Sources --> Tracking --> Attribution --> Warehouse
    Attribution --> Enforcement
    Warehouse --> Reporting
```

## Schema Design

### Cost Events Table

```sql
-- Granular cost events
CREATE TABLE cost_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Attribution
    submission_id VARCHAR(100),
    decision_id VARCHAR(100),
    org_id VARCHAR(100) NOT NULL,
    contractor_id VARCHAR(100),
    project_id VARCHAR(100),
    
    -- Cost source
    source_type VARCHAR(50) NOT NULL, -- 'llm', 'embedding', 'reranker', 'storage'
    provider VARCHAR(50) NOT NULL, -- 'openai', 'cohere', 'aws', 'gcp'
    operation VARCHAR(100) NOT NULL, -- 'completion', 'embedding', 'rerank', 'search'
    
    -- Usage metrics
    model VARCHAR(100),
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    
    request_count INT DEFAULT 1,
    compute_seconds DECIMAL(10, 2),
    storage_gb_months DECIMAL(10, 4),
    
    -- Cost
    cost_usd DECIMAL(10, 6) NOT NULL,
    cost_currency VARCHAR(3) DEFAULT 'USD',
    effective_rate DECIMAL(10, 6), -- per 1K tokens or per unit
    
    -- Context
    latency_ms INT,
    cache_hit BOOLEAN,
    
    -- Prompt/experiment tracking
    prompt_version_id VARCHAR(100),
    experiment_id VARCHAR(100),
    
    -- Metadata
    metadata JSONB
);

-- Indexes for reporting
CREATE INDEX idx_cost_events_timestamp ON cost_events(timestamp);
CREATE INDEX idx_cost_events_org ON cost_events(org_id, timestamp);
CREATE INDEX idx_cost_events_submission ON cost_events(submission_id);
CREATE INDEX idx_cost_events_source ON cost_events(source_type, timestamp);
```

### Budget Configuration

```sql
-- Organization budget settings
CREATE TABLE org_budgets (
    org_id VARCHAR(100) PRIMARY KEY,
    
    -- Monthly budget
    monthly_budget_usd DECIMAL(10, 2),
    budget_reset_day_of_month INT DEFAULT 1,
    
    -- Per-submission limits
    max_cost_per_submission_usd DECIMAL(10, 4),
    max_tokens_per_submission INT,
    
    -- Enforcement
    enforcement_mode VARCHAR(20) DEFAULT 'warn', -- 'warn', 'block', 'throttle'
    
    -- Alerts
    alert_threshold_50 BOOLEAN DEFAULT TRUE,
    alert_threshold_80 BOOLEAN DEFAULT TRUE,
    alert_threshold_100 BOOLEAN DEFAULT TRUE,
    
    -- Current spend (updated periodically)
    current_month_spend_usd DECIMAL(10, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget alerts log
CREATE TABLE budget_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    org_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- 'threshold_50', 'threshold_80', 'threshold_100', 'over_budget'
    threshold_percent INT,
    current_spend_usd DECIMAL(10, 2),
    budget_usd DECIMAL(10, 2),
    notified BOOLEAN DEFAULT FALSE
);
```

## Service Interface

```typescript
// src/services/cost/cost-tracker.ts

import { z } from 'zod';

/**
 * Cost event schema
 */
export const CostEventSchema = z.object({
  eventId: z.string().uuid().optional(),
  timestamp: z.date().default(() => new Date()),
  
  // Attribution
  submissionId: z.string().optional(),
  decisionId: z.string().optional(),
  orgId: z.string(),
  contractorId: z.string().optional(),
  projectId: z.string().optional(),
  
  // Source
  sourceType: z.enum(['llm', 'embedding', 'reranker', 'storage', 'compute']),
  provider: z.enum(['openai', 'cohere', 'anthropic', 'huggingface', 'aws', 'gcp', 'azure']),
  operation: z.string(),
  
  // Usage
  model: z.string().optional(),
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  requestCount: z.number().int().default(1),
  computeSeconds: z.number().optional(),
  storageGbMonths: z.number().optional(),
  
  // Cost
  costUsd: z.number(),
  costCurrency: z.string().default('USD'),
  effectiveRate: z.number().optional(),
  
  // Context
  latencyMs: z.number().int().optional(),
  cacheHit: z.boolean().optional(),
  promptVersionId: z.string().optional(),
  experimentId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CostEvent = z.infer<typeof CostEventSchema>;

/**
 * Budget check result
 */
export const BudgetCheckResultSchema = z.object({
  allowed: z.boolean(),
  currentSpendUsd: z.number(),
  budgetUsd: z.number(),
  remainingUsd: z.number(),
  thresholdPercent: z.number(),
  enforcementMode: z.enum(['warn', 'block', 'throttle']),
  reason: z.string().optional(),
});

export type BudgetCheckResult = z.infer<typeof BudgetCheckResultSchema>;

/**
 * Organization budget configuration
 */
export const OrgBudgetSchema = z.object({
  orgId: z.string(),
  monthlyBudgetUsd: z.number().optional(),
  budgetResetDayOfMonth: z.number().int().min(1).max(31).default(1),
  maxCostPerSubmissionUsd: z.number().optional(),
  maxTokensPerSubmission: z.number().int().optional(),
  enforcementMode: z.enum(['warn', 'block', 'throttle']).default('warn'),
  alertThreshold50: z.boolean().default(true),
  alertThreshold80: z.boolean().default(true),
  alertThreshold100: z.boolean().default(true),
  currentMonthSpendUsd: z.number().default(0),
  lastUpdated: z.date().default(() => new Date()),
});

export type OrgBudget = z.infer<typeof OrgBudgetSchema>;

export interface CostTracker {
  /**
   * Record a cost event
   */
  record(event: CostEvent): Promise<void>;
  
  /**
   * Check if operation is within budget
   */
  checkBudget(
    orgId: string,
    estimatedCostUsd: number
  ): Promise<BudgetCheckResult>;
  
  /**
   * Get current spend for organization
   */
  getCurrentSpend(orgId: string): Promise<{
    currentMonthUsd: number;
    currentMonthStart: Date;
    budgetUsd?: number;
  }>;
  
  /**
   * Get cost breakdown for submission
   */
  getSubmissionCost(submissionId: string): Promise<{
    totalUsd: number;
    breakdown: Array<{
      sourceType: string;
      operation: string;
      costUsd: number;
      tokens?: number;
    }>;
  }>;
  
  /**
   * Set/update organization budget
   */
  setBudget(budget: OrgBudget): Promise<void>;
}

export class PostgresCostTracker implements CostTracker {
  constructor(
    private readonly db: PostgresClient,
    private readonly priceCatalog: PriceCatalog
  ) {}

  async record(event: CostEvent): Promise<void> {
    const validated = CostEventSchema.parse(event);
    
    await this.db.query(
      `INSERT INTO cost_events (
        event_id, timestamp, submission_id, decision_id, org_id, contractor_id, project_id,
        source_type, provider, operation, model,
        prompt_tokens, completion_tokens, total_tokens, request_count,
        cost_usd, cost_currency, effective_rate,
        latency_ms, cache_hit, prompt_version_id, experiment_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [
        validated.eventId,
        validated.timestamp,
        validated.submissionId,
        validated.decisionId,
        validated.orgId,
        validated.contractorId,
        validated.projectId,
        validated.sourceType,
        validated.provider,
        validated.operation,
        validated.model,
        validated.promptTokens,
        validated.completionTokens,
        validated.totalTokens,
        validated.requestCount,
        validated.costUsd,
        validated.costCurrency,
        validated.effectiveRate,
        validated.latencyMs,
        validated.cacheHit,
        validated.promptVersionId,
        validated.experimentId,
        validated.metadata ? JSON.stringify(validated.metadata) : null,
      ]
    );
    
    // Update org current spend (async, can be batched in production)
    await this.updateOrgSpend(validated.orgId);
  }

  async checkBudget(
    orgId: string,
    estimatedCostUsd: number
  ): Promise<BudgetCheckResult> {
    const budget = await this.getBudget(orgId);
    const currentSpend = await this.getCurrentSpend(orgId);
    
    const budgetUsd = budget?.monthlyBudgetUsd;
    const remainingUsd = budgetUsd !== undefined
      ? budgetUsd - currentSpend.currentMonthUsd
      : Number.POSITIVE_INFINITY;
    const thresholdPercent = budgetUsd !== undefined
      ? Math.round((currentSpend.currentMonthUsd / budgetUsd) * 100)
      : 0;
    
    // Check per-submission limit
    if (budget?.maxCostPerSubmissionUsd && estimatedCostUsd > budget.maxCostPerSubmissionUsd) {
      return {
        allowed: budget.enforcementMode !== 'block',
        currentSpendUsd: currentSpend.currentMonthUsd,
        budgetUsd: budgetUsd || 0,
        remainingUsd,
        thresholdPercent,
        enforcementMode: budget.enforcementMode,
        reason: `Estimated cost $${estimatedCostUsd.toFixed(4)} exceeds per-submission limit $${budget.maxCostPerSubmissionUsd.toFixed(4)}`,
      };
    }
    
    // Check monthly budget
    if (remainingUsd < estimatedCostUsd) {
      return {
        allowed: budget?.enforcementMode !== 'block',
        currentSpendUsd: currentSpend.currentMonthUsd,
        budgetUsd: budgetUsd || 0,
        remainingUsd,
        thresholdPercent,
        enforcementMode: budget?.enforcementMode || 'warn',
        reason: `Insufficient budget: $${remainingUsd.toFixed(2)} remaining, need $${estimatedCostUsd.toFixed(4)}`,
      };
    }
    
    return {
      allowed: true,
      currentSpendUsd: currentSpend.currentMonthUsd,
      budgetUsd: budgetUsd || 0,
      remainingUsd,
      thresholdPercent,
      enforcementMode: budget?.enforcementMode || 'warn',
    };
  }

  async getCurrentSpend(orgId: string): Promise<{
    currentMonthUsd: number;
    currentMonthStart: Date;
    budgetUsd?: number;
  }> {
    const budget = await this.getBudget(orgId);
    
    // Calculate current month start based on reset day
    const now = new Date();
    let currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const resetDay = budget?.budgetResetDayOfMonth || 1;
    
    if (now.getDate() < resetDay) {
      // We're still in previous billing cycle
      currentMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, resetDay);
    } else {
      currentMonthStart = new Date(now.getFullYear(), now.getMonth(), resetDay);
    }
    
    const result = await this.db.query(
      `SELECT COALESCE(SUM(cost_usd), 0) as total
       FROM cost_events
       WHERE org_id = $1 AND timestamp >= $2`,
      [orgId, currentMonthStart]
    );
    
    return {
      currentMonthUsd: Number(result.rows[0].total),
      currentMonthStart,
      budgetUsd: budget?.monthlyBudgetUsd,
    };
  }

  async getSubmissionCost(submissionId: string): Promise<{
    totalUsd: number;
    breakdown: Array<{
      sourceType: string;
      operation: string;
      costUsd: number;
      tokens?: number;
    }>;
  }> {
    const result = await this.db.query(
      `SELECT 
        source_type,
        operation,
        SUM(cost_usd) as cost_usd,
        SUM(total_tokens) as tokens
       FROM cost_events
       WHERE submission_id = $1
       GROUP BY source_type, operation`,
      [submissionId]
    );
    
    const totalResult = await this.db.query(
      `SELECT COALESCE(SUM(cost_usd), 0) as total
       FROM cost_events
       WHERE submission_id = $1`,
      [submissionId]
    );
    
    return {
      totalUsd: Number(totalResult.rows[0].total),
      breakdown: result.rows.map(row => ({
        sourceType: row.source_type,
        operation: row.operation,
        costUsd: Number(row.cost_usd),
        tokens: row.tokens ? Number(row.tokens) : undefined,
      })),
    };
  }

  async setBudget(budget: OrgBudget): Promise<void> {
    await this.db.query(
      `INSERT INTO org_budgets (
        org_id, monthly_budget_usd, budget_reset_day_of_month,
        max_cost_per_submission_usd, max_tokens_per_submission,
        enforcement_mode, alert_threshold_50, alert_threshold_80, alert_threshold_100
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (org_id) DO UPDATE SET
        monthly_budget_usd = EXCLUDED.monthly_budget_usd,
        max_cost_per_submission_usd = EXCLUDED.max_cost_per_submission_usd,
        max_tokens_per_submission = EXCLUDED.max_tokens_per_submission,
        enforcement_mode = EXCLUDED.enforcement_mode,
        updated_at = CURRENT_TIMESTAMP`,
      [
        budget.orgId,
        budget.monthlyBudgetUsd,
        budget.budgetResetDayOfMonth,
        budget.maxCostPerSubmissionUsd,
        budget.maxTokensPerSubmission,
        budget.enforcementMode,
        budget.alertThreshold50,
        budget.alertThreshold80,
        budget.alertThreshold100,
      ]
    );
  }

  private async getBudget(orgId: string): Promise<OrgBudget | null> {
    const result = await this.db.query(
      `SELECT * FROM org_budgets WHERE org_id = $1`,
      [orgId]
    );
    return result.rows[0] || null;
  }

  private async updateOrgSpend(orgId: string): Promise<void> {
    // In production, this would be a batched/periodic update
    // For simplicity, doing it inline here
    const spend = await this.getCurrentSpend(orgId);
    
    await this.db.query(
      `UPDATE org_budgets
       SET current_month_spend_usd = $1, last_updated = CURRENT_TIMESTAMP
       WHERE org_id = $2`,
      [spend.currentMonthUsd, orgId]
    );
  }
}
```

## Price Catalog

```typescript
// src/services/cost/price-catalog.ts

export interface ModelPricing {
  model: string;
  provider: string;
  promptPricePer1k: number; // USD
  completionPricePer1k: number; // USD
}

export class PriceCatalog {
  private prices: Map<string, ModelPricing> = new Map();
  
  constructor() {
    // Initialize with current OpenAI pricing (as of 2024)
    this.register({
      model: 'gpt-4-turbo',
      provider: 'openai',
      promptPricePer1k: 0.01,
      completionPricePer1k: 0.03,
    });
    
    this.register({
      model: 'gpt-4',
      provider: 'openai',
      promptPricePer1k: 0.03,
      completionPricePer1k: 0.06,
    });
    
    this.register({
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      promptPricePer1k: 0.0005,
      completionPricePer1k: 0.0015,
    });
    
    this.register({
      model: 'text-embedding-3-small',
      provider: 'openai',
      promptPricePer1k: 0.00002,
      completionPricePer1k: 0,
    });
    
    this.register({
      model: 'text-embedding-3-large',
      provider: 'openai',
      promptPricePer1k: 0.00013,
      completionPricePer1k: 0,
    });
    
    // Anthropic
    this.register({
      model: 'claude-3-opus',
      provider: 'anthropic',
      promptPricePer1k: 0.015,
      completionPricePer1k: 0.075,
    });
    
    this.register({
      model: 'claude-3-sonnet',
      provider: 'anthropic',
      promptPricePer1k: 0.003,
      completionPricePer1k: 0.015,
    });
  }
  
  register(pricing: ModelPricing): void {
    const key = `${pricing.provider}:${pricing.model}`;
    this.prices.set(key, pricing);
  }
  
  getPrice(provider: string, model: string): ModelPricing | undefined {
    const key = `${provider}:${model}`;
    return this.prices.get(key);
  }
  
  calculateCost(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const pricing = this.getPrice(provider, model);
    if (!pricing) {
      console.warn(`Unknown model pricing: ${provider}:${model}`);
      return 0;
    }
    
    const promptCost = (promptTokens / 1000) * pricing.promptPricePer1k;
    const completionCost = (completionTokens / 1000) * pricing.completionPricePer1k;
    
    return promptCost + completionCost;
  }
}
```

## Middleware Integration

```typescript
// src/middleware/cost-tracking.ts

import { MiddlewareHandler } from 'hono';
import { PostgresCostTracker } from '../services/cost/cost-tracker';
import { PriceCatalog } from '../services/cost/price-catalog';

/**
 * Hono middleware for cost tracking
 */
export function costTrackingMiddleware(
  costTracker: PostgresCostTracker,
  priceCatalog: PriceCatalog
): MiddlewareHandler {
  return async (c, next) => {
    const startTime = Date.now();
    const orgId = c.get('orgId') || 'default';
    const submissionId = c.get('submissionId');
    
    // Store tracker in context for downstream use
    c.set('costTracker', costTracker);
    c.set('priceCatalog', priceCatalog);
    
    // Pre-request budget check (if we can estimate)
    if (submissionId) {
      const budgetCheck = await costTracker.checkBudget(orgId, 0.50); // Conservative estimate
      if (!budgetCheck.allowed && budgetCheck.enforcementMode === 'block') {
        return c.json({
          error: 'Budget exceeded',
          details: budgetCheck,
        }, 429);
      }
    }
    
    await next();
    
    // Post-request: could track API call costs here
    // LLM costs are tracked at the call site
  };
}

/**
 * Decorator for tracking LLM calls
 */
export function withCostTracking<TArgs extends unknown[], TReturn>(
  operation: string,
  provider: string,
  model: string,
  fn: (...args: TArgs) => Promise<TReturn & { usage?: { prompt_tokens: number; completion_tokens: number } }>
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    // This would need access to costTracker and context
    // Simplified version - actual implementation would use DI
    const result = await fn(...args);
    
    // Cost recording would happen here
    // const cost = priceCatalog.calculateCost(provider, model, ...);
    // await costTracker.record({ ... });
    
    return result;
  };
}
```

## Integration with Agent

```typescript
// src/mastra/agents/wcp-agent.ts (with cost tracking)

import { PostgresCostTracker } from '../../services/cost/cost-tracker';
import { PriceCatalog } from '../../services/cost/price-catalog';

const costTracker = new PostgresCostTracker(db, new PriceCatalog());

export async function generateDecisionWithCostTracking(
  submission: Submission,
  validation: ValidationResult,
  evidence: RetrievedEvidence[]
): Promise<DecisionResult> {
  // Check budget before expensive operations
  const estimatedCost = 0.05; // Conservative estimate for GPT-4 call
  const budgetCheck = await costTracker.checkBudget(submission.orgId, estimatedCost);
  
  if (!budgetCheck.allowed) {
    throw new BudgetExceededError(
      `Budget check failed: ${budgetCheck.reason}`,
      budgetCheck
    );
  }
  
  // Resolve prompt
  const prompt = await promptRegistry.resolve('wcp.decision', {
    orgId: submission.orgId,
    contractorId: submission.contractorId,
    submissionId: submission.id,
  });
  
  // Estimate tokens (rough)
  const estimatedTokens = estimateTokens(prompt.systemPrompt) +
    estimateTokens(renderTemplate(prompt.userPromptTemplate, { submission, validation, evidence }));
  
  // Check token budget
  const budget = await costTracker.getBudget(submission.orgId);
  if (budget?.maxTokensPerSubmission && estimatedTokens > budget.maxTokensPerSubmission) {
    throw new TokenBudgetExceededError(
      `Estimated ${estimatedTokens} tokens exceeds limit of ${budget.maxTokensPerSubmission}`
    );
  }
  
  // Make LLM call
  const startTime = Date.now();
  const response = await openai.chat.completions.create({
    model: prompt.model,
    messages: [...],
  });
  const latencyMs = Date.now() - startTime;
  
  // Calculate and record cost
  const costUsd = priceCatalog.calculateCost(
    'openai',
    prompt.model,
    response.usage?.prompt_tokens || 0,
    response.usage?.completion_tokens || 0
  );
  
  await costTracker.record({
    submissionId: submission.id,
    decisionId: decision.id,
    orgId: submission.orgId,
    contractorId: submission.contractorId,
    projectId: submission.projectId,
    sourceType: 'llm',
    provider: 'openai',
    operation: 'completion',
    model: prompt.model,
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
    totalTokens: response.usage?.total_tokens || 0,
    costUsd,
    effectiveRate: costUsd / ((response.usage?.total_tokens || 1) / 1000),
    latencyMs,
    promptVersionId: prompt.versionId,
    experimentId: prompt.experimentId,
  });
  
  return decision;
}
```

## Config Example

```bash
# .env

# Cost tracking
COST_TRACKING_ENABLED=true
COST_TRACKING_DB_URL=postgresql://user:pass@localhost:5432/wcp_costs

# Budget defaults
DEFAULT_MONTHLY_BUDGET_USD=1000
DEFAULT_MAX_COST_PER_SUBMISSION_USD=0.50
DEFAULT_ENFORCEMENT_MODE=warn

# Alerting
COST_ALERT_EMAIL=finance@company.com
COST_ALERT_WEBHOOK_URL=https://hooks.slack.com/...

# Price catalog update
PRICE_CATALOG_REFRESH_HOURS=24
```

## Integration Points

| Existing File | Integration |
|---|---|
| `src/services/cost/` | New directory with cost tracker and price catalog |
| `src/middleware/` | Add `cost-tracking.ts` middleware |
| `src/mastra/agents/wcp-agent.ts` | Budget checks and cost recording |
| `src/mastra/tools/` | Cost tracking for retrieval, embedding calls |
| `src/warehouse/` | Cost reporting queries |

## Trade-offs

| Decision | Rationale |
|---|---|
| **Per-call vs aggregated tracking** | Per-call gives full visibility but adds overhead. Aggregated is cheaper but loses debugging detail. Current plan: per-call for LLM (expensive), aggregated for storage/compute. |
| **Inline recording vs async queue** | Inline is simpler but adds latency. Async (queue) is better for throughput. Start inline, add queue if needed. |
| **Hardcoded vs dynamic pricing** | Hardcoded in code for stability, with periodic updates. Dynamic (API call) risks outages affecting decisions. |
| **Block vs warn on budget** | Configurable per-org. 'warn' allows operations to continue with alerts. 'block' enforces hard stops. |

## Implementation Phasing

### Phase 1: Recording
- Cost event schema and recording
- Price catalog for major models
- LLM call cost tracking

### Phase 2: Budgets
- Org budget configuration
- Budget checking middleware
- Alert generation

### Phase 3: Optimization
- Cost dashboard
- Budget vs actuals reporting
- Optimization recommendations

## Cost Optimization Strategies

1. **Model tiering**: Use cheaper models (GPT-3.5) for simple decisions, GPT-4 only for complex cases
2. **Caching**: Cache embeddings and retrieval results
3. **Token efficiency**: Optimize prompts to reduce token count
4. **Batch processing**: Batch embedding requests
5. **Circuit breakers**: Skip expensive steps when budget tight

## Sample Cost Breakdown (per submission)

| Component | Tokens | Cost (USD) |
|---|---|---|
| Extraction (GPT-3.5) | 2K | $0.001 |
| Validation (deterministic) | 0 | $0.000 |
| Retrieval (embeddings) | 1K | $0.00002 |
| Decision synthesis (GPT-4) | 5K | $0.15 |
| Total | 8K | ~$0.15 |

At 1000 submissions/month: ~$150/month baseline + storage/compute.
