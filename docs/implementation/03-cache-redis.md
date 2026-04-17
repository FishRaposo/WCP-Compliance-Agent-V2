# Cache: Contractor & Project State (Redis)

Status Label: Designed / Target

Truth anchors:

- [`./INDEX.md`](./INDEX.md)
- [`../foundation/tech-stack-map.md`](../foundation/tech-stack-map.md)
- [`../architecture/api-and-integrations.md`](../architecture/api-and-integrations.md)

## Role in the System

Redis serves as the fast context cache for contractor and project state, acting as a source-of-truth mirror. It enables sub-millisecond lookups of active contractor profiles, project metadata, and recent wage determinations—essential for latency-sensitive decision paths.

## WCP Domain Mapping

| Revenue Intelligence Concept | WCP Compliance Equivalent |
|---|---|
| Salesforce CRM state | Contractor registry state (active projects, compliance history) |
| Account record | Contractor profile (name, EIN, status, registration date) |
| Opportunity record | Active project (contract value, location, trades required) |
| Contact record | Project contacts (superintendent, payroll admin) |
| Recent deal history | Recent submissions and determinations for this contractor |

## Architecture

```mermaid
flowchart TB
    subgraph Sources["Source of Truth"]
        Postgres[(PostgreSQL<br/>Operational DB)]
        ContractorSvc[Contractor Service]
        ProjectSvc[Project Service]
    end

    subgraph Cache["Redis Cache Layer"]
        Contractor[(Contractor State<br/>Hash + TTL)]
        Project[(Project State<br/>Hash + TTL)]
        WageLookup[(Wage Determination<br/>Cache)]
        Active["Active Projects<br/>Set per Contractor"]
    end

    subgraph Inval["Cache Invalidation"]
        PubSub[Pub/Sub Channel]
        WriteThru[Write-Through on Update]
    end

    subgraph Consumers["Query Consumers"]
        Decision[Decision Agent]
        Retrieval[Retrieval Service]
        API[API Layer]
    end

    Sources -->|Write-Through| Cache
    Sources -->|Invalidation Events| Inval --> Cache
    Cache --> Consumers
```

## Data Model

### Redis Key Patterns

```
# Contractor state (Hash)
wcp:contractor:{contractor_id}
  - id
  - name
  - dba_name
  - ein
  - status
  - registration_date
  - compliance_score
  - last_submission_date
  - violation_count_12m

# Project state (Hash)
wcp:project:{project_id}
  - id
  - name
  - contractor_id
  - location_city
  - location_state
  - contract_value
  - status
  - start_date
  - end_date
  - trades_required (JSON array)

# Active projects for contractor (Set)
wcp:contractor:{contractor_id}:active_projects
  - [project_id_1, project_id_2, ...]

# Wage determination cache (Hash with locality/trade key)
wcp:wage:{locality_code}:{trade_code}
  - base_rate
  - fringe_rate
  - total_package
  - effective_date
  - determination_id
  - cached_at

# Recent submissions for contractor (Sorted Set by timestamp)
wcp:contractor:{contractor_id}:recent_submissions
  - [{submission_id, score: timestamp}, ...]

# Cache metadata (Hash)
wcp:meta:contractor:{contractor_id}
  - cached_at
  - ttl_seconds
  - source_version
  - last_invalidation_reason
```

## Cache Service Interface

```typescript
// src/services/cache/redis-cache.ts

import { z } from 'zod';

/**
 * Contractor state schema
 */
export const ContractorStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  dbaName: z.string().optional(),
  ein: z.string(),
  status: z.enum(['active', 'suspended', 'inactive']),
  registrationDate: z.date(),
  complianceScore: z.number().min(0).max(100).optional(),
  lastSubmissionDate: z.date().optional(),
  violationCount12m: z.number().int().default(0),
  activeProjectIds: z.array(z.string()),
});

export type ContractorState = z.infer<typeof ContractorStateSchema>;

/**
 * Project state schema
 */
export const ProjectStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  contractorId: z.string(),
  locationCity: z.string(),
  locationState: z.string(),
  contractValue: z.number(),
  status: z.enum(['active', 'completed', 'cancelled']),
  startDate: z.date(),
  endDate: z.date().optional(),
  tradesRequired: z.array(z.string()),
});

export type ProjectState = z.infer<typeof ProjectStateSchema>;

/**
 * Wage determination cache entry
 */
export const WageDeterminationCacheSchema = z.object({
  localityCode: z.string(),
  tradeCode: z.string(),
  baseRate: z.number(),
  fringeRate: z.number(),
  totalPackage: z.number(),
  effectiveDate: z.date(),
  determinationId: z.string(),
  cachedAt: z.date(),
});

export type WageDeterminationCache = z.infer<typeof WageDeterminationCacheSchema>;

export interface ContractorCacheService {
  /**
   * Get contractor state from cache (or load from source if miss)
   */
  getContractor(contractorId: string): Promise<ContractorState | null>;
  
  /**
   * Get multiple contractors in batch (MGET)
   */
  getContractors(contractorIds: string[]): Promise<Map<string, ContractorState>>;
  
  /**
   * Refresh contractor state in cache
   */
  refreshContractor(contractorId: string): Promise<ContractorState>;
  
  /**
   * Invalidate contractor (e.g., on profile update)
   */
  invalidateContractor(contractorId: string, reason: string): Promise<void>;
}

export interface ProjectCacheService {
  /**
   * Get project state
   */
  getProject(projectId: string): Promise<ProjectState | null>;
  
  /**
   * Get active projects for contractor
   */
  getActiveProjects(contractorId: string): Promise<ProjectState[]>;
  
  /**
   * Invalidate project
   */
  invalidateProject(projectId: string, reason: string): Promise<void>;
}

export interface WageCacheService {
  /**
   * Get cached wage determination
   */
  getWageDetermination(localityCode: string, tradeCode: string): Promise<WageDeterminationCache | null>;
  
  /**
   * Cache wage determination
   */
  setWageDetermination(determination: WageDeterminationCache, ttlSeconds: number): Promise<void>;
  
  /**
   * Invalidate wage cache by locality (when new determinations published)
   */
  invalidateByLocality(localityCode: string): Promise<void>;
}

export class RedisCacheService implements ContractorCacheService, ProjectCacheService, WageCacheService {
  constructor(
    private readonly redis: RedisClientType,
    private readonly contractorRepo: ContractorRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly wageRepo: WageRepository,
    private readonly defaultTtlSeconds: number = 3600
  ) {}

  async getContractor(contractorId: string): Promise<ContractorState | null> {
    const key = `wcp:contractor:${contractorId}`;
    
    // Try cache
    const cached = await this.redis.hGetAll(key);
    if (Object.keys(cached).length > 0) {
      return this.deserializeContractor(cached);
    }
    
    // Cache miss - load from source
    return this.refreshContractor(contractorId);
  }

  async refreshContractor(contractorId: string): Promise<ContractorState> {
    const contractor = await this.contractorRepo.findById(contractorId);
    if (!contractor) {
      return null;
    }
    
    // Get active projects
    const activeProjects = await this.projectRepo.findActiveByContractor(contractorId);
    
    const state: ContractorState = {
      ...contractor,
      activeProjectIds: activeProjects.map(p => p.id),
    };
    
    // Cache it
    const key = `wcp:contractor:${contractorId}`;
    await this.redis.hSet(key, this.serializeContractor(state));
    await this.redis.expire(key, this.defaultTtlSeconds);
    
    // Cache active projects list
    const activeKey = `wcp:contractor:${contractorId}:active_projects`;
    if (activeProjects.length > 0) {
      await this.redis.sAdd(activeKey, activeProjects.map(p => p.id));
      await this.redis.expire(activeKey, this.defaultTtlSeconds);
    }
    
    return state;
  }

  async invalidateContractor(contractorId: string, reason: string): Promise<void> {
    const key = `wcp:contractor:${contractorId}`;
    const activeKey = `wcp:contractor:${contractorId}:active_projects`;
    const recentKey = `wcp:contractor:${contractorId}:recent_submissions`;
    
    // Log invalidation reason
    await this.redis.hSet(`wcp:meta:contractor:${contractorId}`, {
      invalidated_at: new Date().toISOString(),
      reason,
    });
    
    await this.redis.del([key, activeKey, recentKey]);
  }

  async getActiveProjects(contractorId: string): Promise<ProjectState[]> {
    const activeKey = `wcp:contractor:${contractorId}:active_projects`;
    const projectIds = await this.redis.sMembers(activeKey);
    
    if (projectIds.length === 0) {
      // Cache miss on set - refresh contractor which populates this
      await this.refreshContractor(contractorId);
      const refreshedIds = await this.redis.sMembers(activeKey);
      projectIds.push(...refreshedIds);
    }
    
    // Get each project (potentially batch MGET in production)
    const projects: ProjectState[] = [];
    for (const id of projectIds) {
      const project = await this.getProject(id);
      if (project) projects.push(project);
    }
    
    return projects;
  }

  private serializeContractor(state: ContractorState): Record<string, string> {
    return {
      id: state.id,
      name: state.name,
      dba_name: state.dbaName || '',
      ein: state.ein,
      status: state.status,
      registration_date: state.registrationDate.toISOString(),
      compliance_score: String(state.complianceScore || ''),
      last_submission_date: state.lastSubmissionDate?.toISOString() || '',
      violation_count_12m: String(state.violationCount12m || 0),
      active_project_ids: JSON.stringify(state.activeProjectIds),
    };
  }

  private deserializeContractor(data: Record<string, string>): ContractorState {
    return {
      id: data.id,
      name: data.name,
      dbaName: data.dba_name || undefined,
      ein: data.ein,
      status: data.status as ContractorState['status'],
      registrationDate: new Date(data.registration_date),
      complianceScore: data.compliance_score ? Number(data.compliance_score) : undefined,
      lastSubmissionDate: data.last_submission_date ? new Date(data.last_submission_date) : undefined,
      violationCount12m: Number(data.violation_count_12m || 0),
      activeProjectIds: JSON.parse(data.active_project_ids || '[]'),
    };
  }

  // Additional methods for ProjectCacheService and WageCacheService...
  async getProject(projectId: string): Promise<ProjectState | null> {
    const key = `wcp:project:${projectId}`;
    const cached = await this.redis.hGetAll(key);
    if (Object.keys(cached).length > 0) {
      return this.deserializeProject(cached);
    }
    // Cache miss - load from source
    const project = await this.projectRepo.findById(projectId);
    if (!project) return null;
    
    await this.redis.hSet(key, this.serializeProject(project));
    await this.redis.expire(key, this.defaultTtlSslSeconds);
    return project;
  }

  async invalidateProject(projectId: string, reason: string): Promise<void> {
    const key = `wcp:project:${projectId}`;
    await this.redis.hSet(`wcp:meta:project:${projectId}`, {
      invalidated_at: new Date().toISOString(),
      reason,
    });
    await this.redis.del([key]);
  }

  async getWageDetermination(localityCode: string, tradeCode: string): Promise<WageDeterminationCache | null> {
    const key = `wcp:wage:${localityCode}:${tradeCode}`;
    const cached = await this.redis.hGetAll(key);
    if (Object.keys(cached).length > 0) {
      return {
        localityCode,
        tradeCode,
        baseRate: Number(cached.base_rate),
        fringeRate: Number(cached.fringe_rate),
        totalPackage: Number(cached.total_package),
        effectiveDate: new Date(cached.effective_date),
        determinationId: cached.determination_id,
        cachedAt: new Date(cached.cached_at),
      };
    }
    return null;
  }

  async setWageDetermination(determination: WageDeterminationCache, ttlSeconds: number): Promise<void> {
    const key = `wcp:wage:${determination.localityCode}:${determination.tradeCode}`;
    await this.redis.hSet(key, {
      base_rate: String(determination.baseRate),
      fringe_rate: String(determination.fringeRate),
      total_package: String(determination.totalPackage),
      effective_date: determination.effectiveDate.toISOString(),
      determination_id: determination.determinationId,
      cached_at: determination.cachedAt.toISOString(),
    });
    await this.redis.expire(key, ttlSeconds);
  }

  async invalidateByLocality(localityCode: string): Promise<void> {
    // Pattern match all wage keys for this locality
    const pattern = `wcp:wage:${localityCode}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }
}
```

## Tool Interface

```typescript
// src/mastra/tools/redis-cache-tool.ts

import { z } from 'zod';
import { createTool } from '@mastra/core';

export const GetContractorStateSchema = z.object({
  contractorId: z.string()
    .describe('Contractor ID to look up'),
  includeProjects: z.boolean().default(true)
    .describe('Include active projects in response'),
});

export type GetContractorStateInput = z.infer<typeof GetContractorStateSchema>;

export const GetWageCacheSchema = z.object({
  localityCode: z.string()
    .describe('Locality code (e.g., NY-CITY)'),
  tradeCode: z.string()
    .describe('Trade code (e.g., ELEC)'),
});

export type GetWageCacheInput = z.infer<typeof GetWageCacheSchema>;

/**
 * Tool: getContractorState
 * 
 * Retrieves cached contractor state including active projects.
 * Falls back to source on cache miss.
 */
export const getContractorStateTool = createTool({
  id: 'get-contractor-state',
  description: `Get contractor state from cache.
Use this to understand the contractor's compliance history 
and active projects before making a decision.`,
  inputSchema: GetContractorStateSchema,
  execute: async ({ contractorId, includeProjects }): Promise<ContractorState> => {
    // Implementation would call cache service
    throw new Error('Not implemented - Redis connection required');
  },
});

/**
 * Tool: getWageFromCache
 * 
 * Fast lookup of cached wage determination.
 */
export const getWageFromCacheTool = createTool({
  id: 'get-wage-from-cache',
  description: `Get wage determination from cache (fast).
Use this for quick lookups when you already know 
the locality and trade codes.`,
  inputSchema: GetWageCacheSchema,
  execute: async ({ localityCode, tradeCode }): Promise<WageDeterminationCache | null> => {
    // Implementation would call cache service
    throw new Error('Not implemented - Redis connection required');
  },
});
```

## Config Example

```bash
# .env

# Redis configuration
REDIS_URL=redis://localhost:6379
# Or with auth
REDIS_URL=redis://username:password@your-redis-host:6379

# Alternative: Redis Cluster
REDIS_CLUSTER_NODES=redis-node-1:6379,redis-node-2:6379,redis-node-3:6379

# Connection pooling
REDIS_MAX_CONNECTIONS=20
REDIS_CONNECTION_TIMEOUT=5000
REDIS_COMMAND_TIMEOUT=3000

# Cache TTL settings
REDIS_CONTRACTOR_TTL_SECONDS=3600
REDIS_PROJECT_TTL_SECONDS=1800
REDIS_WAGE_TTL_SECONDS=86400

# Enable keyspace notifications for cache invalidation
REDIS_KEYSPACE_NOTIFICATIONS=KEA
```

## Integration Points

| Existing File | Integration |
|---|---|
| `src/mastra/tools/` | Add `redis-cache-tool.ts` |
| `src/services/` | Create `cache/` directory with Redis implementation |
| `src/entrypoints/wcp-entrypoint.ts` | Inject contractor context at decision start |
| `src/instrumentation.ts` | Cache hit/miss metrics |

## Trade-offs

| Decision | Rationale |
|---|---|
| **Redis vs Memcached** | Redis supports richer data structures (hashes, sets), pub/sub for invalidation, and persistence. Worth the operational complexity. |
| **Hash vs JSON string** | Hashes allow partial field updates and HGET efficiency. JSON strings would require full serialize/deserialize. |
| **Write-through vs Cache-aside** | Write-through ensures consistency but adds latency to writes. Cache-aside simpler but riskier. Current plan: write-through for contractor/project (low write volume), cache-aside for wages (high read, periodic refresh). |
| **TTL vs Explicit Invalidation** | Use both: TTL as safety net, explicit invalidation on updates. Prevents stale data from lingering. |

## Implementation Phasing

### Phase 1: Basic Caching
- Contractor and project state caching
- TTL-based expiration
- Cache-aside pattern

### Phase 2: Write-Through
- Invalidate on source updates
- Pub/sub for cross-instance invalidation
- Wage determination caching

### Phase 3: Advanced Patterns
- Batch MGET for multiple contractors
- Cache warming for high-volume contractors
- Metrics and hit rate monitoring

## Cache Warming Strategy

For high-volume contractors (e.g., large construction firms with weekly submissions):

1. Identify top 100 contractors by submission volume
2. Pre-load their state during low-traffic hours
3. Subscribe to invalidation events for immediate refresh

```typescript
// Cache warming job
export async function warmContractorCache(): Promise<void> {
  const topContractors = await contractorRepo.findTopByVolume(100);
  
  for (const contractor of topContractors) {
    await cacheService.refreshContractor(contractor.id);
    console.log(`Warmed cache for contractor: ${contractor.name}`);
  }
}
```
