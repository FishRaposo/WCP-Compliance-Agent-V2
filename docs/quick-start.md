# Quick Start

Status Label: Implemented

Get the WCP Compliance Agent running locally in under 5 minutes.

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- Git
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## 1. Clone and Install

```bash
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent
npm install
```

## 2. Configure Environment

```bash
# Copy the example environment file
copy .env.example .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=sk-your-key-here
```

## 3. Verify Setup

```bash
# Run the test suite
npm test

# Expected output:
# ✓ pipeline-contracts > should validate check results
# ✓ trust-score > should compute trust components correctly
# ✓ decision-pipeline > should return TrustScoredDecision type
# ✓ decision-pipeline > should catch underpayment violations
```

## 4. Start the Server

```bash
# Development mode with hot reload
npm run dev

# Or production build
npm run build
npm start
```

Server starts on `http://localhost:3000`

## 5. Make Your First API Call

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "Role: Electrician, Hours: 45, Wage: 35.50"
  }'
```

**Expected Response:**

```json
{
  "traceId": "wcp-20240115-AB12",
  "finalStatus": "Reject",
  "deterministic": {
    "extracted": {
      "role": "Electrician",
      "hours": 45,
      "wage": 35.50
    },
    "checks": [
      {
        "id": "base_wage_001",
        "type": "wage",
        "passed": false,
        "regulation": "40 U.S.C. § 3142(a)",
        "severity": "critical",
        "message": "UNDERPAYMENT: $3.00/hr shortfall"
      }
    ],
    "deterministicScore": 0.5
  },
  "verdict": {
    "status": "Reject",
    "rationale": "Worker underpaid by $3.00/hr",
    "referencedCheckIds": ["base_wage_001"],
    "selfConfidence": 0.95,
    "tokenUsage": 150
  },
  "trust": {
    "score": 0.45,
    "band": "require_human",
    "components": {
      "deterministic": 0.5,
      "classification": 1.0,
      "llmSelf": 0.95,
      "agreement": 1.0
    }
  },
  "humanReview": {
    "required": true,
    "status": "pending"
  },
  "health": {
    "cycleTime": 245,
    "tokenUsage": 150,
    "validationScore": 0.5,
    "confidence": 0.45
  },
  "requestId": "req-abc123",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Common Issues

### "OPENAI_API_KEY not set"

**Fix:** Ensure `.env` file exists and contains your API key:

```bash
echo OPENAI_API_KEY=sk-your-key > .env
```

### "Port 3000 already in use"

**Fix:** Kill existing process or use different port:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or set custom port in .env
PORT=3001
```

### Tests failing with "Module not found"

**Fix:** Reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

### Model timeout errors

**Fix:** The system has built-in mock mode for offline testing:

```bash
# Run with mock responses (no API calls)
MOCK_MODE=true npm run dev
```

## Next Steps

- Read the [full documentation](./INDEX.md)
- Explore the [case study](./showcase/case-study.md) for real examples
- Review the [architecture overview](./architecture/system-overview.md)
- Check the [API documentation](./architecture/api-and-integrations.md)

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:pipeline` | Pipeline-specific tests |
| `npm run test:calibration` | Trust calibration golden set |
| `npm run lint:pipeline` | Check pipeline architecture |
| `npm run lint` | Check code style |
| `npm run typecheck` | Verify TypeScript types |

## Getting Help

- Check [FAQ](./FAQ.md) for common questions
- Review [troubleshooting](./implementation/12-troubleshooting.md) for detailed debugging
- Open an issue on GitHub for bugs or feature requests
