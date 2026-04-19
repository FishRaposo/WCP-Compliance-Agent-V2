# Development Environment

Status Label: Implemented

Complete setup guide for local development of the WCP Compliance Agent.

---

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Git
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- (Optional) PostgreSQL with pgvector (for hybrid retrieval development)
- (Optional) Elasticsearch (for BM25 search development)

---

## Quick Setup (5 minutes)

```bash
# 1. Clone repo
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent

# 2. Install dependencies
npm install

# 3. Set up environment
copy .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Verify setup
npm test

# 5. Start dev server
npm run dev
```

Server starts at `http://localhost:3000`

---

## Detailed Setup

### Node.js Version

Check your Node version:

```bash
node --version  # Should be v18.x or higher
```

If needed, use [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows):

```bash
nvm install 18
nvm use 18
```

### Environment Variables

Create `.env` file:

```bash
copy .env.example .env
```

Edit `.env`:

```env
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional (defaults work for local dev)
OPENAI_MODEL=gpt-4o-mini
AGENT_MAX_STEPS=3
PORT=3000
NODE_ENV=development

# Optional (for advanced features)
POSTGRES_URL=postgresql://user:pass@localhost:5432/wcp
ELASTICSEARCH_URL=http://localhost:9200
```

### Mock Mode

For development without API costs, set `OPENAI_API_KEY` to a mock value:

```bash
# Run with mock responses (no OpenAI calls)
OPENAI_API_KEY=mock npm run dev

# Or set in .env
OPENAI_API_KEY=mock
```

Mock mode returns deterministic responses for testing. Valid mock values: `mock`, `mock-key`, `test-api-key`, empty, or undefined.

---

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run production build |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:pipeline` | Pipeline-specific tests |
| `npm run test:calibration` | Trust calibration tests |
| `npm run lint:pipeline` | Check pipeline architecture |
| `npm run lint` | Check code style |
| `npm run typecheck` | Verify TypeScript types |

---

## Debugging

### VS Code Setup

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:unit"],
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

### Common Debug Patterns

**Log the pipeline flow**:

```typescript
// In orchestrator.ts
console.log(`[Pipeline] Layer ${layer} complete:`, result);
```

**Inspect trust score components**:

```typescript
// After decision
console.log('Trust components:', decision.trust.components);
console.log('Final score:', decision.trust.score);
console.log('Band:', decision.trust.band);
```

**Check deterministic findings**:

```typescript
console.log('Checks:', decision.deterministic.checks);
console.log('Score:', decision.deterministic.deterministicScore);
```

---

## Project Structure

```
src/
├── entrypoints/
│   └── wcp-entrypoint.ts      # Main API entry
├── pipeline/
│   ├── orchestrator.ts        # Pipeline composer
│   ├── layer1-deterministic.ts  # Deterministic layer
│   ├── layer2-llm-verdict.ts    # LLM verdict layer
│   └── layer3-trust-score.ts    # Trust score layer
├── services/
│   └── human-review-queue.ts  # Queue service
├── types/
│   ├── decision-pipeline.ts   # Pipeline types
│   └── index.ts               # Main types
├── mastra/
│   ├── agents/
│   │   └── wcp-agent.ts       # LLM agent
│   └── tools/
│       └── wcp-tools.ts       # Deterministic tools
├── app.ts                     # Hono app
├── server.ts                  # Server entry
└── utils/
    ├── errors.ts              # Error classes
    ├── logger.ts              # Logging
    └── mock-responses.ts      # Mock data

docs/                          # Documentation
tests/
├── unit/                      # Unit tests
├── integration/               # Integration tests
└── eval/                      # Calibration tests
```

---

## TypeScript Configuration

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true
  }
}
```

**Key settings**:
- `strict: true` — Full type safety
- `moduleResolution: bundler` — Modern resolution
- `skipLibCheck: true` — Faster builds

---

## Testing

### Test Structure

```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../src/utils/example';

describe('My Function', () => {
  it('should do the thing', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
  
  it('should handle edge case', () => {
    const result = myFunction('');
    expect(result).toBeNull();
  });
});
```

### Watch Mode

```bash
# Run tests on every file change
npm run test:unit -- --watch

# Run specific test file
npm run test:unit -- pipeline-contracts
```

### Coverage

```bash
# Generate coverage report
npm run test:unit -- --coverage

# Coverage appears in terminal and ./coverage/
```

---

## Troubleshooting

### "Module not found" errors

**Fix**: Reinstall dependencies

```bash
rm -rf node_modules
npm install
```

### TypeScript errors

**Fix**: Check `tsconfig.json` and type definitions

```bash
# See detailed errors
npm run typecheck

# Often caused by outdated @types
npm update
```

### Tests failing

**Fix**: Check environment

```bash
# Verify .env exists
cat .env

# Run with mock mode (no API needed)
OPENAI_API_KEY=mock npm test

# Run specific test for debugging
npm run test:unit -- --reporter=verbose
```

### Port already in use

**Fix**: Kill existing process or change port

```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

### OpenAI API errors

**Fix**: Check API key and quota

```bash
# Verify key is set
echo %OPENAI_API_KEY%

# Check quota at https://platform.openai.com/settings/organization/billing/overview

# Use mock mode if quota exceeded
OPENAI_API_KEY=mock npm run dev
```

---

## Optional Services

### PostgreSQL + pgvector

For hybrid retrieval development:

```bash
# Using Docker
docker run -d \
  --name wcp-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  ankane/pgvector:latest

# Create database
docker exec -it wcp-postgres psql -U postgres -c "CREATE DATABASE wcp;"
```

### Elasticsearch

For BM25 search development:

```bash
# Using Docker
docker run -d \
  --name wcp-elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:8.11.0
```

---

## IDE Setup

### VS Code Extensions

Recommended:
- **TypeScript Importer** — Auto-imports
- **ESLint** — Linting
- **Prettier** — Code formatting
- **Markdown All in One** — Doc editing
- **Vitest** — Test runner

### Settings

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

---

## Next Steps

Once environment is set up:

1. Read [contributor-guide.md](./contributor-guide.md)
2. Explore [current-state.md](../foundation/current-state.md)
3. Try [how-to-add-check.md](./how-to-add-check.md) for first contribution

---

**Last Updated**: 2026-04-17
