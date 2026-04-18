# Demo Walkthrough

Status Label: Designed / Target

What the WCP Compliance Agent demo experience looks like, with example scenarios and expected outputs.

---

## Demo Overview

The demo showcases a live compliance checking system for Davis-Bacon Act weekly payroll reports. Users can submit WCP data and receive immediate validation against prevailing wage requirements.

**Demo URL:** (Coming in Phase 3 - Weeks 13-18)

**What you'll see:**
- Input form for WCP data (role, hours, wage)
- Real-time analysis results
- Evidence-based findings with citations
- Confidence scoring and trace information

---

## Example 1: Compliant Laborer Case

### Your Input

**Role:** Laborer  
**Hours:** 38  
**Wage:** $28.50/hour

```
Role: Laborer
Hours: 38
Wage: 28.50
```

### What Happens Behind the Scenes

1. **Extraction** (Deterministic, <1ms)
   - Regex extracts: role="Laborer", hours=38, wage=28.50
   - No LLM call needed for structured input

2. **Validation** (Deterministic, <1ms)
   - Base rate check: $28.50 ≥ $28.00 (LA prevailing) ✅
   - Overtime check: 38 hours < 40, no OT required ✅
   - Fringe check: (Not yet implemented in MVP)

3. **Decision Generation** (LLM, ~200ms)
   - Prompt: "Generate compliant explanation for Laborer at $28.50"
   - Schema-constrained output
   - Confidence: 0.99

### What You See

```
✅ COMPLIANT

This wage report meets Davis-Bacon Act requirements.

Analysis:
• Base wage $28.50/hour exceeds Los Angeles prevailing rate of $28.00
• No overtime hours recorded (38 hours < 40)
• Total weekly pay: $1,083.00

Confidence: 99%
Processing time: 245ms
Request ID: req-demo-001
```

### Key Details to Notice

- **Specific numbers:** Not "looks good" but "$28.50 exceeds $28.00"
- **Processing time:** Fast because deterministic layer does the work
- **Confidence score:** High because checks are unambiguous
- **Trace ID:** Every decision is traceable for audit

---

## Example 2: Violation Detection

### Your Input

**Role:** Electrician  
**Hours:** 45 (40 regular + 5 OT)  
**Wage:** $35.50/hour

```
Role: Electrician
Hours: 45
Wage: 35.50
```

### What Happens Behind the Scenes

1. **Extraction** (<1ms)
   - Regex extracts: role="Electrician", hours=45, wage=35.50

2. **Validation** (<1ms)
   - Base rate check: $35.50 < $38.50 (LA prevailing) ❌
   - Overtime rate check: $35.50 < $57.75 (1.5x base) ❌
   - Severity: base=error, overtime=critical

3. **Decision Generation** (~200ms)
   - Prompt includes finding details
   - LLM generates explanation with calculations
   - Citation to DBWD source included

### What You See

```
❌ VIOLATION DETECTED

This wage report has 2 compliance issues.

🔴 CRITICAL: Overtime rate violation
   Actual: $35.50/hour
   Required: $57.75/hour (1.5x $38.50 base)
   Underpayment: $22.25/hour × 5 hours = $111.25

🟡 ERROR: Base wage below prevailing rate
   Actual: $35.50/hour
   Required: $38.50/hour (Los Angeles Electrician)
   Underpayment: $3.00/hour × 40 hours = $120.00

📊 Total Underpayment This Week: $231.25

Citation: DBWD Electrician Determination LA-2024-001
Confidence: 98%
Processing time: 267ms
Request ID: req-demo-002
```

### Key Details to Notice

- **Severity levels:** Critical vs Error prioritization
- **Exact calculations:** Math shown, not just "underpaid"
- **Citations:** Reference to official source
- **Audit trail:** Every dollar accounted for

---

## Example 3: Edge Case - Missing Data

### Your Input

```
Role: Electrician
Hours: (blank)
Wage: 38.50
```

### What Happens Behind the Scenes

1. **Extraction**
   - Role: "Electrician" ✅
   - Hours: null (not found) ⚠️
   - Wage: 38.50 ✅

2. **Validation**
   - Base rate: $38.50 ≥ $38.50 ✅
   - Overtime: Cannot determine (no hours data) ⚠️

3. **Confidence Assessment**
   - Missing critical field reduces confidence
   - System flags for human review

### What You See

```
⚠️ REVISION NEEDED

Unable to complete full compliance check.

✅ Base wage: $38.50 meets prevailing rate
⚠️ Overtime analysis: Hours data missing

Required for complete analysis:
• Total hours worked this week
• Breakdown of regular vs overtime hours

Please provide the missing information and resubmit.

Confidence: N/A (insufficient data)
Processing time: 189ms
Request ID: req-demo-003
```

### Key Details to Notice

- **Graceful degradation:** System doesn't guess
- **Specific asks:** Tells user exactly what's needed
- **No false confidence:** When data is missing, confidence is N/A

---

## Example 4: Ambiguous Job Title

### Your Input

```
Role: Wireman
Hours: 40
Wage: 38.50
```

### What Happens Behind the Scenes

1. **Extraction**
   - Role: "Wireman" (not in rate table)

2. **Alias Resolution** (Target feature, not yet implemented)
   - Search trade aliases: "Wireman" → "Electrician"
   - Confidence: 0.85 (synonym match)

3. **Validation**
   - Mapped to Electrician rate: $38.50
   - Wage meets rate ✅

### What You See (Target Implementation)

```
✅ COMPLIANT (with clarification)

Job title "Wireman" resolved to "Electrician" via trade alias mapping.

Analysis:
• Base wage $38.50/hour meets Electrician prevailing rate
• No overtime hours (40 hours exactly)

Note: Job title mapping applied
   Input: "Wireman"
   Resolved: "Electrician" (85% confidence)
   If this is incorrect, please use exact DBWD job title.

Confidence: 92%
Processing time: 412ms (includes alias lookup)
Request ID: req-demo-004
```

---

## What to Look For in the Demo

### Evidence of Good Engineering

| Feature | Why It Matters |
|---------|---------------|
| **Exact numbers** | Not vague; shows calculations |
| **Citations** | Every claim backed by source |
| **Trace IDs** | Full audit trail for every decision |
| **Confidence scores** | Honest uncertainty quantification |
| **Fast response** | Deterministic layer keeps latency low |
| **Structured output** | Same format every time (schema-bound) |
| **Graceful failures** | Missing data → ask for more, don't guess |

### Comparison with "ChatGPT Approach"

| Aspect | Generic LLM | This System |
|--------|------------|-------------|
| Arithmetic | May miscalculate | Exact, deterministic |
| Citations | Often hallucinated | Linked to verified source |
| Reproducibility | Different each time | Same input = same output |
| Speed | ~2-5 seconds | ~200-300ms |
| Cost | ~$0.01-0.05/call | ~$0.001/call |
| Audit trail | None | Full trace with IDs |

---

## Behind the Scenes: System Architecture

When you click "Analyze", here's the full flow:

```
User Input
    ↓
[API Gateway] ──▶ Rate limit check ──▶ Auth validation
    ↓
[Extraction Service]
    • Regex pattern matching (deterministic)
    • Output: {role, hours, wage}
    ↓
[Validation Engine]
    • Rate table lookup (current: hardcoded, target: DBWD retrieval)
    • Arithmetic validation (deterministic)
    • Output: {findings[], citations[]}
    ↓
[Decision Agent]
    • Schema-bound LLM call
    • Prompt includes findings + context
    • Output: {explanation, confidence}
    ↓
[Response Assembly]
    • Merge deterministic + LLM results
    • Add trace metadata
    • Return structured JSON
    ↓
User Sees Result
```

**Latency breakdown:**
- Extraction: <1ms (regex)
- Validation: <1ms (arithmetic)
- LLM call: ~200-250ms (GPT-4o-mini)
- Response assembly: <1ms
- **Total: ~250ms**

---

## Try These Test Cases

### Valid Cases

| Role | Hours | Wage | Expected |
|------|-------|------|----------|
| Laborer | 38 | $28.50 | ✅ COMPLIANT |
| Electrician | 40 | $38.50 | ✅ COMPLIANT |
| Laborer | 45 | $42.00 | ✅ COMPLIANT (OT correct) |

### Violation Cases

| Role | Hours | Wage | Expected |
|------|-------|------|----------|
| Electrician | 45 | $35.50 | ❌ VIOLATION (base + OT) |
| Laborer | 40 | $27.00 | ❌ VIOLATION (under minimum) |
| Electrician | 50 | $38.50 | ❌ VIOLATION (OT not 1.5x) |

### Edge Cases

| Role | Hours | Wage | Expected |
|------|-------|------|----------|
| Wireman | 40 | $38.50 | ⚠️ REVISION (alias resolution) |
| Electrician | (blank) | $38.50 | ⚠️ REVISION (missing hours) |
| UnknownRole | 40 | $30.00 | ❌ ERROR (unknown job) |

---

## What This Proves

This demo showcases:

1. **Deterministic + Probabilistic Hybrid**
   - Rules for what must be exact (arithmetic, rate lookups)
   - LLM for what benefits from nuance (explanations, edge cases)

2. **Production-Minded Design**
   - Fast responses via deterministic layer
   - Low cost via minimal LLM calls
   - Full observability via trace IDs

3. **High-Trust System Patterns**
   - Evidence-backed decisions
   - Honest confidence scoring
   - Audit trail for every decision

4. **Scalable Architecture**
   - Async pipeline design
   - Schema contracts at boundaries
   - Evaluation infrastructure built-in

---

## Next Steps

- Read the [Case Study](./case-study.md) for deeper technical details
- Review the [Architecture](../architecture/system-overview.md) for system design
- Check the [FAQ](../FAQ.md) for common questions
- Try the [Quick Start](../quick-start.md) to run locally

---

*Last updated: January 2024*
