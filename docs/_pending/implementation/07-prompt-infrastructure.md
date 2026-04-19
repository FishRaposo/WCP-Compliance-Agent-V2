# Prompt Infrastructure: Versioning, A/B Testing, Per-Org Config

Status Label: Designed / Target

Truth anchors:

- [`./INDEX.md`](./INDEX.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`../architecture/decision-engine.md`](../architecture/decision-engine.md)

## Role in the System

Prompt infrastructure enables version-controlled, experimentable, and configurable decision prompts. It supports A/B testing of prompt variations, per-contractor-org overrides, and cost-aware routing—turning prompts from code into managed configuration.

## WCP Domain Mapping

| Revenue Intelligence Concept | WCP Compliance Equivalent |
|---|---|
| Rep-specific prompt tuning | Contractor-org-specific prompt adjustments |
| Deal stage prompt variants | Submission type prompt variants (weekly vs monthly vs final) |
| Account-level configuration | Contractor compliance history-informed prompts |
| Prompt experiment tracking | Prompt version → decision quality correlation |

## Architecture

```mermaid
flowchart TB
    subgraph Registry["Prompt Registry"]
        Versions[Prompt Versions]
        Experiments[Experiments]
        Config[Org Config Overrides]
    end

    subgraph Router["Prompt Router"]
        VersionResolve[Version Resolution]
        ABTest[A/B Test Assignment]
        Override[Org Override Check]
    end

    subgraph Execution["Execution"]
        Render[Template Rendering]
        CostGuard[Cost Guardrails]
    end

    subgraph Audit["Audit & Tracking"]
      Versioning["Version Storage"]
      Experiments["Experiment Logs"]
      Usage["Usage Analytics"]
    end

    Registry --> Router --> Execution --> Agent
    Execution --> Audit
```

## Schema Design

### PostgreSQL Schema

```sql
-- Prompt registry
CREATE TABLE prompts (
    prompt_id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    purpose VARCHAR(50) NOT NULL, -- 'decision', 'extraction', 'summarization'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Prompt versions
CREATE TABLE prompt_versions (
    version_id VARCHAR(100) PRIMARY KEY,
    prompt_id VARCHAR(100) REFERENCES prompts(prompt_id),
    version_number INT NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    
    -- Configuration
    model VARCHAR(100) NOT NULL,
    temperature DECIMAL(3, 2) DEFAULT 0.0,
    max_tokens INT,
    top_p DECIMAL(3, 2),
    
    -- Metadata
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    parent_version_id VARCHAR(100) REFERENCES prompt_versions(version_id),
    
    -- Cost and performance tracking
    estimated_tokens_per_call INT,
    avg_latency_ms INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_version UNIQUE(prompt_id, version_number),
    CONSTRAINT only_one_default UNIQUE(prompt_id, is_default) WHERE is_default = TRUE
);

-- Experiments
CREATE TABLE prompt_experiments (
    experiment_id VARCHAR(100) PRIMARY KEY,
    prompt_id VARCHAR(100) REFERENCES prompts(prompt_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Variant configuration
    control_version_id VARCHAR(100) REFERENCES prompt_versions(version_id),
    treatment_version_id VARCHAR(100) REFERENCES prompt_versions(version_id),
    traffic_split DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0 (treatment percentage)
    
    -- Targeting
    target_org_ids TEXT[], -- NULL means all orgs
    target_contractor_ids TEXT[],
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'running', 'paused', 'concluded'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Results
    winner_version_id VARCHAR(100) REFERENCES prompt_versions(version_id),
    conclusion_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization prompt configuration
CREATE TABLE org_prompt_config (
    org_id VARCHAR(100) NOT NULL,
    prompt_id VARCHAR(100) NOT NULL,
    
    -- Override settings
    forced_version_id VARCHAR(100) REFERENCES prompt_versions(version_id),
    temperature_override DECIMAL(3, 2),
    max_tokens_override INT,
    
    -- Custom additions (appended to base prompt)
    system_prompt_append TEXT,
    user_prompt_append TEXT,
    
    -- Feature flags
    features_enabled TEXT[], -- e.g., ['strict_validation', 'detailed_citations']
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    
    PRIMARY KEY (org_id, prompt_id)
);

-- Prompt usage log (for analytics and cost tracking)
CREATE TABLE prompt_usage_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Identification
    submission_id VARCHAR(100),
    decision_id VARCHAR(100),
    org_id VARCHAR(100),
    contractor_id VARCHAR(100),
    
    -- Prompt info
    prompt_id VARCHAR(100),
    version_id VARCHAR(100),
    experiment_id VARCHAR(100),
    
    -- Usage
    model VARCHAR(100),
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    latency_ms INT,
    estimated_cost_usd DECIMAL(10, 6),
    
    -- Outcome
    decision_outcome VARCHAR(20),
    confidence DECIMAL(3, 2)
);

-- Indexes
CREATE INDEX idx_prompt_versions_active ON prompt_versions(prompt_id, is_active);
CREATE INDEX idx_prompt_versions_default ON prompt_versions(prompt_id, is_default);
CREATE INDEX idx_experiments_status ON prompt_experiments(status);
CREATE INDEX idx_usage_log_timestamp ON prompt_usage_log(timestamp);
CREATE INDEX idx_usage_log_org ON prompt_usage_log(org_id, timestamp);
CREATE INDEX idx_usage_log_version ON prompt_usage_log(version_id, timestamp);
```

## Repository Interface

```typescript
// src/services/prompts/prompt-registry.ts

import { z } from 'zod';

/**
 * Prompt version
 */
export const PromptVersionSchema = z.object({
  versionId: z.string(),
  promptId: z.string(),
  versionNumber: z.number().int(),
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0),
  maxTokens: z.number().int().optional(),
  topP: z.number().min(0).max(1).optional(),
  isActive: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  estimatedTokensPerCall: z.number().int().optional(),
  avgLatencyMs: z.number().int().optional(),
});

export type PromptVersion = z.infer<typeof PromptVersionSchema>;

/**
 * Experiment configuration
 */
export const PromptExperimentSchema = z.object({
  experimentId: z.string(),
  promptId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  controlVersionId: z.string(),
  treatmentVersionId: z.string(),
  trafficSplit: z.number().min(0).max(1).default(0.5),
  targetOrgIds: z.array(z.string()).optional(),
  targetContractorIds: z.array(z.string()).optional(),
  status: z.enum(['draft', 'running', 'paused', 'concluded']).default('draft'),
});

export type PromptExperiment = z.infer<typeof PromptExperimentSchema>;

/**
 * Organization override
 */
export const OrgPromptConfigSchema = z.object({
  orgId: z.string(),
  promptId: z.string(),
  forcedVersionId: z.string().optional(),
  temperatureOverride: z.number().min(0).max(2).optional(),
  maxTokensOverride: z.number().int().optional(),
  systemPromptAppend: z.string().optional(),
  userPromptAppend: z.string().optional(),
  featuresEnabled: z.array(z.string()).optional(),
});

export type OrgPromptConfig = z.infer<typeof OrgPromptConfigSchema>;

/**
 * Resolution context
 */
export const ResolutionContextSchema = z.object({
  orgId: z.string(),
  contractorId: z.string().optional(),
  submissionId: z.string(),
  submissionType: z.enum(['weekly', 'monthly', 'final', 'amendment']).optional(),
});

export type ResolutionContext = z.infer<typeof ResolutionContextSchema>;

/**
 * Resolved prompt ready for execution
 */
export const ResolvedPromptSchema = z.object({
  promptId: z.string(),
  versionId: z.string(),
  versionNumber: z.number().int(),
  experimentId: z.string().optional(),
  variant: z.enum(['control', 'treatment']).optional(),
  
  // Final prompt content
  systemPrompt: z.string(),
  userPromptTemplate: z.string(),
  
  // Execution config
  model: z.string(),
  temperature: z.number(),
  maxTokens: z.number().optional(),
  
  // Metadata
  isOverride: z.boolean().default(false),
});

export type ResolvedPrompt = z.infer<typeof ResolvedPromptSchema>;

export interface PromptRegistry {
  /**
   * Register a new prompt
   */
  registerPrompt(
    promptId: string,
    name: string,
    description: string,
    purpose: string
  ): Promise<void>;
  
  /**
   * Create new version
   */
  createVersion(
    promptId: string,
    version: Omit<PromptVersion, 'versionId' | 'versionNumber' | 'isActive' | 'isDefault'>
  ): Promise<PromptVersion>;
  
  /**
   * Set default version for a prompt
   */
  setDefaultVersion(promptId: string, versionId: string): Promise<void>;
  
  /**
   * Activate/deactivate version
   */
  setVersionActive(versionId: string, active: boolean): Promise<void>;
  
  /**
   * Create experiment
   */
  createExperiment(experiment: Omit<PromptExperiment, 'experimentId'>): Promise<PromptExperiment>;
  
  /**
   * Start/pause/conclude experiment
   */
  updateExperimentStatus(
    experimentId: string,
    status: PromptExperiment['status']
  ): Promise<void>;
  
  /**
   * Set org configuration
   */
  setOrgConfig(config: OrgPromptConfig): Promise<void>;
  
  /**
   * Resolve prompt for execution (core method)
   */
  resolve(
    promptId: string,
    context: ResolutionContext
  ): Promise<ResolvedPrompt>;
  
  /**
   * Log prompt usage
   */
  logUsage(params: {
    submissionId: string;
    decisionId: string;
    orgId: string;
    promptId: string;
    versionId: string;
    experimentId?: string;
    model: string;
    tokensUsed: { prompt: number; completion: number };
    latencyMs: number;
    estimatedCostUsd: number;
    decisionOutcome?: string;
    confidence?: number;
  }): Promise<void>;
}

export class PostgresPromptRegistry implements PromptRegistry {
  constructor(private readonly db: PostgresClient) {}

  async resolve(
    promptId: string,
    context: ResolutionContext
  ): Promise<ResolvedPrompt> {
    // 1. Check for org override
    const orgConfig = await this.getOrgConfig(context.orgId, promptId);
    
    if (orgConfig?.forcedVersionId) {
      // Forced version takes precedence
      const version = await this.getVersion(orgConfig.forcedVersionId);
      return this.buildResolvedPrompt(version, orgConfig, true);
    }
    
    // 2. Check for running experiments targeting this org/submission
    const experiment = await this.findApplicableExperiment(
      promptId,
      context.orgId,
      context.contractorId
    );
    
    if (experiment && experiment.status === 'running') {
      // A/B test assignment
      const variant = this.assignVariant(experiment, context.submissionId);
      const versionId = variant === 'control'
        ? experiment.controlVersionId
        : experiment.treatmentVersionId;
      const version = await this.getVersion(versionId);
      
      return {
        ...this.buildResolvedPrompt(version, orgConfig, false),
        experimentId: experiment.experimentId,
        variant,
      };
    }
    
    // 3. Use default version
    const defaultVersion = await this.getDefaultVersion(promptId);
    return this.buildResolvedPrompt(defaultVersion, orgConfig, false);
  }

  private async findApplicableExperiment(
    promptId: string,
    orgId: string,
    contractorId?: string
  ): Promise<PromptExperiment | null> {
    const result = await this.db.query(
      `SELECT * FROM prompt_experiments 
       WHERE prompt_id = $1 
         AND status = 'running'
         AND (target_org_ids IS NULL OR $2 = ANY(target_org_ids))
         AND (target_contractor_ids IS NULL OR $3 = ANY(target_contractor_ids))
       LIMIT 1`,
      [promptId, orgId, contractorId || null]
    );
    
    return result.rows[0] || null;
  }

  private assignVariant(
    experiment: PromptExperiment,
    submissionId: string
  ): 'control' | 'treatment' {
    // Deterministic assignment based on submission_id hash
    // Ensures same submission always gets same variant
    const hash = this.hashString(submissionId);
    const normalized = (hash % 100) / 100;
    return normalized < experiment.trafficSplit ? 'treatment' : 'control';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private buildResolvedPrompt(
    version: PromptVersion,
    orgConfig?: OrgPromptConfig,
    isOverride: boolean = false
  ): ResolvedPrompt {
    return {
      promptId: version.promptId,
      versionId: version.versionId,
      versionNumber: version.versionNumber,
      systemPrompt: this.applyOrgOverrides(
        version.systemPrompt,
        orgConfig?.systemPromptAppend
      ),
      userPromptTemplate: this.applyOrgOverrides(
        version.userPromptTemplate,
        orgConfig?.userPromptAppend
      ),
      model: version.model,
      temperature: orgConfig?.temperatureOverride ?? version.temperature,
      maxTokens: orgConfig?.maxTokensOverride ?? version.maxTokens,
      isOverride,
    };
  }

  private applyOrgOverrides(base: string, append?: string): string {
    if (!append) return base;
    return `${base}\n\n---\n\nOrganization-Specific Instructions:\n${append}`;
  }

  // Additional methods omitted for brevity...
  private async getOrgConfig(orgId: string, promptId: string): Promise<OrgPromptConfig | null> {
    const result = await this.db.query(
      `SELECT * FROM org_prompt_config WHERE org_id = $1 AND prompt_id = $2`,
      [orgId, promptId]
    );
    return result.rows[0] || null;
  }

  private async getVersion(versionId: string): Promise<PromptVersion> {
    const result = await this.db.query(
      `SELECT * FROM prompt_versions WHERE version_id = $1`,
      [versionId]
    );
    if (!result.rows[0]) throw new Error(`Version not found: ${versionId}`);
    return this.rowToVersion(result.rows[0]);
  }

  private async getDefaultVersion(promptId: string): Promise<PromptVersion> {
    const result = await this.db.query(
      `SELECT * FROM prompt_versions WHERE prompt_id = $1 AND is_default = TRUE`,
      [promptId]
    );
    if (!result.rows[0]) throw new Error(`No default version for prompt: ${promptId}`);
    return this.rowToVersion(result.rows[0]);
  }

  private rowToVersion(row: Record<string, unknown>): PromptVersion {
    return {
      versionId: row.version_id as string,
      promptId: row.prompt_id as string,
      versionNumber: row.version_number as number,
      systemPrompt: row.system_prompt as string,
      userPromptTemplate: row.user_prompt_template as string,
      model: row.model as string,
      temperature: Number(row.temperature),
      maxTokens: row.max_tokens as number | undefined,
      topP: row.top_p ? Number(row.top_p) : undefined,
      isActive: row.is_active as boolean,
      isDefault: row.is_default as boolean,
    };
  }

  async registerPrompt(
    promptId: string,
    name: string,
    description: string,
    purpose: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO prompts (prompt_id, name, description, purpose)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (prompt_id) DO NOTHING`,
      [promptId, name, description, purpose]
    );
  }

  async createVersion(
    promptId: string,
    version: Omit<PromptVersion, 'versionId' | 'versionNumber' | 'isActive' | 'isDefault'>
  ): Promise<PromptVersion> {
    // Get next version number
    const result = await this.db.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
       FROM prompt_versions WHERE prompt_id = $1`,
      [promptId]
    );
    const versionNumber = result.rows[0].next_version;
    const versionId = `${promptId}.v${versionNumber}`;

    await this.db.query(
      `INSERT INTO prompt_versions (
        version_id, prompt_id, version_number, system_prompt, user_prompt_template,
        model, temperature, max_tokens, top_p, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE)`,
      [
        versionId,
        promptId,
        versionNumber,
        version.systemPrompt,
        version.userPromptTemplate,
        version.model,
        version.temperature,
        version.maxTokens,
        version.topP,
      ]
    );

    return this.getVersion(versionId);
  }

  async createExperiment(
    experiment: Omit<PromptExperiment, 'experimentId'>
  ): Promise<PromptExperiment> {
    const experimentId = `exp-${Date.now()}`;
    
    await this.db.query(
      `INSERT INTO prompt_experiments (
        experiment_id, prompt_id, name, description,
        control_version_id, treatment_version_id, traffic_split,
        target_org_ids, target_contractor_ids
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        experimentId,
        experiment.promptId,
        experiment.name,
        experiment.description,
        experiment.controlVersionId,
        experiment.treatmentVersionId,
        experiment.trafficSplit,
        experiment.targetOrgIds,
        experiment.targetContractorIds,
      ]
    );

    return { ...experiment, experimentId, status: 'draft' };
  }

  async setOrgConfig(config: OrgPromptConfig): Promise<void> {
    await this.db.query(
      `INSERT INTO org_prompt_config (
        org_id, prompt_id, forced_version_id, temperature_override,
        max_tokens_override, system_prompt_append, user_prompt_append, features_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (org_id, prompt_id) DO UPDATE SET
        forced_version_id = EXCLUDED.forced_version_id,
        temperature_override = EXCLUDED.temperature_override,
        max_tokens_override = EXCLUDED.max_tokens_override,
        system_prompt_append = EXCLUDED.system_prompt_append,
        user_prompt_append = EXCLUDED.user_prompt_append,
        features_enabled = EXCLUDED.features_enabled,
        updated_at = CURRENT_TIMESTAMP`,
      [
        config.orgId,
        config.promptId,
        config.forcedVersionId,
        config.temperatureOverride,
        config.maxTokensOverride,
        config.systemPromptAppend,
        config.userPromptAppend,
        config.featuresEnabled,
      ]
    );
  }

  async logUsage(params: {
    submissionId: string;
    decisionId: string;
    orgId: string;
    promptId: string;
    versionId: string;
    experimentId?: string;
    model: string;
    tokensUsed: { prompt: number; completion: number };
    latencyMs: number;
    estimatedCostUsd: number;
    decisionOutcome?: string;
    confidence?: number;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO prompt_usage_log (
        submission_id, decision_id, org_id, prompt_id, version_id, experiment_id,
        model, prompt_tokens, completion_tokens, total_tokens,
        latency_ms, estimated_cost_usd, decision_outcome, confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        params.submissionId,
        params.decisionId,
        params.orgId,
        params.promptId,
        params.versionId,
        params.experimentId,
        params.model,
        params.tokensUsed.prompt,
        params.tokensUsed.completion,
        params.tokensUsed.prompt + params.tokensUsed.completion,
        params.latencyMs,
        params.estimatedCostUsd,
        params.decisionOutcome,
        params.confidence,
      ]
    );
  }

  async setDefaultVersion(promptId: string, versionId: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Clear existing default
      await trx.query(
        `UPDATE prompt_versions SET is_default = FALSE 
         WHERE prompt_id = $1 AND is_default = TRUE`,
        [promptId]
      );
      // Set new default
      await trx.query(
        `UPDATE prompt_versions SET is_default = TRUE 
         WHERE version_id = $1`,
        [versionId]
      );
    });
  }

  async setVersionActive(versionId: string, active: boolean): Promise<void> {
    await this.db.query(
      `UPDATE prompt_versions SET is_active = $1, deployed_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE deployed_at END
       WHERE version_id = $2`,
      [active, versionId]
    );
  }

  async updateExperimentStatus(
    experimentId: string,
    status: PromptExperiment['status']
  ): Promise<void> {
    const updates: string[] = ['status = $1'];
    const values: unknown[] = [status];
    
    if (status === 'running') {
      updates.push('started_at = CURRENT_TIMESTAMP');
    } else if (status === 'concluded') {
      updates.push('ended_at = CURRENT_TIMESTAMP');
    }
    
    values.push(experimentId);
    
    await this.db.query(
      `UPDATE prompt_experiments SET ${updates.join(', ')} WHERE experiment_id = $${values.length}`,
      values
    );
  }
}
```

## Integration with Agent

```typescript
// src/mastra/agents/wcp-agent.ts (with prompt registry)

import { PostgresPromptRegistry } from '../../services/prompts/prompt-registry';

const promptRegistry = new PostgresPromptRegistry(db);

export async function generateDecision(
  submission: Submission,
  validation: ValidationResult,
  evidence: RetrievedEvidence[]
): Promise<DecisionResult> {
  // Resolve prompt for this submission
  const prompt = await promptRegistry.resolve('wcp.decision', {
    orgId: submission.orgId,
    contractorId: submission.contractorId,
    submissionId: submission.id,
    submissionType: submission.type,
  });
  
  // Render template
  const userPrompt = renderTemplate(prompt.userPromptTemplate, {
    submission,
    validation,
    evidence,
  });
  
  // Execute LLM call
  const startTime = Date.now();
  const response = await openai.chat.completions.create({
    model: prompt.model,
    messages: [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: prompt.temperature,
    max_tokens: prompt.maxTokens,
  });
  const latencyMs = Date.now() - startTime;
  
  // Parse decision
  const decision = parseDecisionResponse(response);
  
  // Log usage
  await promptRegistry.logUsage({
    submissionId: submission.id,
    decisionId: decision.id,
    orgId: submission.orgId,
    promptId: prompt.promptId,
    versionId: prompt.versionId,
    experimentId: prompt.experimentId,
    model: prompt.model,
    tokensUsed: {
      prompt: response.usage?.prompt_tokens || 0,
      completion: response.usage?.completion_tokens || 0,
    },
    latencyMs,
    estimatedCostUsd: calculateCost(response.usage, prompt.model),
    decisionOutcome: decision.outcome,
    confidence: decision.confidence,
  });
  
  return decision;
}
```

## Config Example

```bash
# .env

# Prompt registry DB (can be same as main DB)
PROMPT_REGISTRY_URL=postgresql://user:pass@localhost:5432/wcp_prompts

# Default prompts
DEFAULT_DECISION_PROMPT_VERSION=wcp.decision.v3
DEFAULT_EXTRACTION_PROMPT_VERSION=wcp.extraction.v2

# A/B testing
EXPERIMENT_DEFAULT_TRAFFIC_SPLIT=0.5

# Feature flags (per-org)
ENABLE_STRICT_VALIDATION=true
ENABLE_DETAILED_CITATIONS=true
```

## Trade-offs

| Decision | Rationale |
|---|---|
| **DB-backed vs file-backed prompts** | DB enables runtime version switching, A/B testing, and per-org config without redeploy. File-based is simpler but requires redeploy for changes. |
| **Deterministic A/B assignment** | Using submission_id hash ensures same submission always gets same variant, preventing confusion in debugging. |
| **Org overrides vs global only** | Org overrides enable customer-specific tuning (compliance requirement) but add complexity. Global-only is simpler but less flexible. |
| **Prompt template vs hardcoded** | Templates enable dynamic content injection (evidence, validation results). Hardcoded would require string concatenation. |

## Implementation Phasing

### Phase 1: Registry Core
- Schema and basic CRUD
- Version resolution (no experiments yet)
- Integration with agent

### Phase 2: A/B Testing
- Experiment management
- Variant assignment
- Results tracking

### Phase 3: Advanced Features
- Org overrides
- Template rendering
- Usage analytics dashboard
