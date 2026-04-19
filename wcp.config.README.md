# WCP Configuration

This directory contains the centralized configuration file for the WCP Compliance Agent.

## Files

- **wcp.config.json** - Main configuration file
- **wcp.config.schema.json** - JSON schema for validation
- **wcp.config.README.md** - This file

## Quick Start

1. Copy `wcp.config.json` to your preferred location (default: root directory)
2. Modify the configuration as needed
3. Set environment variables (see `.env.example`)
4. Run the agent

## Configuration Sections

### Pipeline

**deterministic** - Layer 1 configuration
- `extraction`: Regex patterns for data extraction
- `checks`: Compliance check configuration (enabled, severity, regulation)

**llm** - Layer 2 LLM verdict configuration
- `model`: OpenAI model to use
- `temperature`: LLM temperature (0.0-2.0)
- `maxTokens`: Maximum tokens per response
- `systemPromptPath`: Path to system prompt file

**trust** - Layer 3 trust score configuration
- `thresholds`: Trust band thresholds (autoApprove, flagForReview, requireHuman)
- `weights`: Component weights (deterministic, classification, llmSelf, agreement)
- `severityImpact`: Score multiplier by severity level

### DBWD (Prevailing Wage Rates)

**source**: "hardcoded" (Phase 0-1) or "postgresql" (Phase 2+)
**effectiveDate**: Date of DBWD determination
**rates**: Trade-specific rate table (base, fringe, total, dbwdId)

### API

**port**: Server port (default: 3000)
**host**: Server host (default: localhost)
**cors**: CORS configuration
**endpoints**: API endpoint paths

### Features

Feature flags for future phases:
- `pdfParsing`: PDF document parsing (Phase 2)
- `ragLookup`: Hybrid retrieval (Phase 3)
- `batchProcessing`: Bulk processing (Phase 2+)
- `observability`: Observability features (Phase 2+)

### Observability

**logging**: Log level and format
**tracing**: Distributed tracing (Langfuse integration)

### Database

**url**: Database connection string
**maxConnections**: Maximum pool size
**logging**: Query logging

### Human Review

**enabled**: Enable human review queue
**persistence**: "memory", "file", or "database"
**queuePath**: File path for file-based persistence
**retentionDays**: Queue retention period

### Audit

**enabled**: Enable audit trail
**retentionYears**: Audit retention period (Copeland Act: 7 years)
**trail**: Per-layer audit trail configuration

### Mock

**enabled**: Force mock mode (overrides OPENAI_API_KEY)
**modeDetection**: "openaiApiKey" (default) or "config"
**validKeys**: Valid mock key values

### References

Paths to reference materials:
- `legislation`: Regulatory documents
- `values`: Thresholds and constants
- `instructions`: Agent operating instructions

## Environment Variables

Environment variables override config file settings:

- `OPENAI_API_KEY`: OpenAI API key (or mock value)
- `OPENAI_MODEL`: Model to use (overrides `pipeline.llm.model`)
- `PORT`: Server port (overrides `api.port`)
- `NODE_ENV`: Environment (development, staging, production)

See `.env.example` for all available environment variables.

## Validation

Validate your configuration against the schema:

```bash
npx ajv validate -s wcp.config.schema.json -d wcp.config.json
```

## Common Configurations

### Development (Mock Mode)
```json
{
  "mock": { "enabled": true },
  "features": { "pdfParsing": false, "ragLookup": false },
  "observability": { "enabled": false }
}
```

### Production
```json
{
  "mock": { "enabled": false },
  "dbwd": { "source": "postgresql" },
  "features": { "observability": true },
  "observability": { "enabled": true, "tracing": { "enabled": true } },
  "humanReview": { "persistence": "database" }
}
```

### Local Testing
```json
{
  "mock": { "enabled": false },
  "dbwd": { "source": "hardcoded" },
  "api": { "port": 3000 }
}
```

## Updating Configuration

When updating configuration:

1. Modify `wcp.config.json`
2. Validate against schema
3. Test with sample inputs
4. Commit with clear message describing changes
5. Update CHANGELOG.md if significant changes

## Version Control

The configuration file is version-controlled. Sensitive values (API keys, secrets) should be set via environment variables, not in the config file.

## Troubleshooting

**Config not loading**: Ensure file is named `wcp.config.json` and is in the root directory or set `WCP_CONFIG_PATH` environment variable.

**Validation errors**: Check your config against the schema using `npx ajv validate`.

**DBWD rates not found**: Ensure `dbwd.rates` section is populated or set `dbwd.source` to "postgresql" (Phase 2+).

## Support

For configuration issues, see:
- `docs/phase-0-out-of-scope.md` - Feature availability by phase
- `src/pipeline/reference/` - Reference materials
- `.env.example` - Environment variable reference
