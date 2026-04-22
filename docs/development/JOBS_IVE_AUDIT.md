# Jobs/Ive Product & Brand Audit: WCP Compliance Agent

**Date:** 2026-04-22
**Auditor:** Clanker (jobs-ive skill — channeling Steve Jobs + Jony Ive)
**Scope:** README.md, docs/, repo branding, product positioning

---

## The Jobs/Ive Filter: Three Laws

### 1. Is it essential?

**Current README opening:**
> "WCP Compliance Agent validates Weekly Certified Payroll (WCP) submissions against Davis-Bacon Act prevailing wage requirements. It's a reference implementation of a trustworthy AI decision system..."

**Verdict:** Two ideas in two sentences. First is functional. Second is aspirational. Neither is visceral.

**The elimination test:** Remove everything until it breaks. What remains?
> "Payroll decisions you can defend in court."

That's it. That's the product. Everything else is commentary.

**What to cut from README:**
- "reference implementation" — academic hedging
- "trustworthy AI decision system" — every AI startup says this
- "The core pattern transfers directly to any domain" — trying to be everything
- Version history (V1, V2, V3 tables) — belongs in changelog
- Tech stack table — belongs in docs
- Project structure tree — belongs in CONTRIBUTING.md

---

### 2. Is it human?

**Current:** "Three-layer AI decision pipeline for regulated-domain compliance. Every finding cites a regulation. Every decision has a replayable audit trail."

**Problem:** "Regulated-domain compliance" is not how humans talk. "Replayable audit trail" is DevOps speak.

**Human translation:**
> "You wouldn't sign a contract without reading it. Why let AI approve payroll without showing its work?"

Or:
> "Every payroll decision gets three rounds of proof. Every finding cites the law. Every decision has a paper trail."

**The "1,000 songs in your pocket" test:**

| Current (README) | Human version |
|---|---|
| "Deterministic scaffolding → constrained LLM reasoning → trust-scored routing" | "Check the math. Then ask the AI. Then score the confidence." |
| "Full timestamped auditTrail on every decision" | "A paper trail for every call." |
| "Four-component trust score with auto/flag/human bands" | "High confidence? Approve. Medium? Flag for review. Low? Human decides." |
| "Configurable in-memory corpus (20 trades)" | "Knows 20 job types out of the box." |
| "Hybrid retrieval (BM25 + vector + rerank)" | "Finds the right wage rate, even when job titles don't match exactly." |

---

### 3. Does it feel inevitable?

**Current:** "The core pattern — deterministic scaffolding → constrained LLM reasoning → trust-scored routing — transfers directly to any domain where AI errors have consequences: healthcare, finance, legal, revenue intelligence."

**Problem:** Hedging. Reference implementations are optional. This positioning says "you could use this, or you could build your own."

**Inevitable framing:**
> "This is how AI should make decisions in regulated industries. Three layers of proof. No shortcuts."

The "should" is confident without being arrogant. The "no shortcuts" is a value statement that makes the competition look careless.

---

## Jobs/Ive Verdict by Section

### README: Header + Badges

**Current:** 4 badges (CI, coverage 83.25%, license, Node.js)

**Verdict:** Acceptable. Badges signal "this is real." But 83.25% is engineering precision. Round to "83%+" — the decimal screams "I care about numbers more than clarity."

---

### README: Version History

**Current:** Massive section. V1, V2, V3 each get full paragraphs + comparison table.

**Verdict:** CUT. Jobs never showed the Newton at the iPhone launch. Ive never showed the Titanium PowerBook when unveiling the MacBook Air.

**Fix:** One sentence.
> "Built from the ground up after a prototype proved the concept. No legacy debt."

Move all version archaeology to `CHANGELOG.md` or `docs/version-history.md`.

---

### README: Architecture Diagram

**Current:** ASCII flowchart with file paths.

**Verdict:** WRONG. Jobs never showed architecture diagrams. Ive never showed exploded views. They showed the *experience*.

**Fix:** Replace with human steps.
> ### How it works
> 1. **Check the facts** — Extract role, hours, wage from payroll. Verify against federal rates.
> 2. **Get a second opinion** — AI reviews the findings. Must cite the law. Cannot change the math.
> 3. **Route with confidence** — High confidence? Approve. Medium? Flag for review. Low? Human decides.

Then add the technical diagram in a collapsible `<details>` block or in `docs/architecture/`.

---

### README: Quick Start

**Current:** 4 commands + server URL.

**Verdict:** Good. Could be shorter.

**Fix:**
```bash
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent && npm install
OPENAI_API_KEY=mock npm run serve
```

Three lines instead of four. The `cd` and `npm install` belong together. The `echo` step is unnecessary — `.env.example` already explains configuration.

---

### README: API Reference

**Current:** Full JSON request/response examples.

**Verdict:** Essential for developers. But doesn't belong in the hero.

**Fix:** Move to `docs/api-reference.md`. In README, show only:
> ### One endpoint. Three layers of proof.
> `POST /api/analyze` — Submit payroll text. Get a decision with full audit trail.
> 
> See [API Reference](docs/api-reference.md) for PDF/CSV upload, async jobs, and all endpoints.

---

### README: Tech Stack

**Current:** 10-row table.

**Verdict:** CUT from hero. Nobody cares about tech stacks on a product page. Tech stacks are for job descriptions.

**Fix:** Move to `docs/tech-stack.md` or bottom of README. Replace with:
> **Built with:** TypeScript, Hono, OpenAI, Zod. Runs on Node.js 22+.

---

### README: Project Structure

**Current:** ASCII tree of directories.

**Verdict:** CUT. This belongs in `CONTRIBUTING.md`, not the front door.

---

### README: Documentation Links

**Current:** 7 flat links.

**Verdict:** Good. But could be grouped by audience.

**Fix:**
> ### For developers
> - [Quick Start](docs/quick-start.md) — 5 minutes to running
> - [Architecture](docs/architecture/system-overview.md) — How the three layers work
> - [API Reference](docs/api-reference.md) — All endpoints
> 
> ### For compliance officers
> - [Regulatory Report](docs/compliance/regulatory-compliance-report.md) — How we enforce Davis-Bacon
> - [Traceability Matrix](docs/compliance/traceability-matrix.md) — Code-to-regulation mapping

---

### Quick Start Doc: Opening

**Current:**
> "This is a three-layer AI decision system that proves every compliance call with evidence. Think of it as a court case for every payroll decision — three layers of proof, every finding cites a regulation, every decision has a paper paper trail."

**Verdict:** CLOSE. The "court case" analogy is human. But "three-layer AI decision system" is not. And "paper paper trail" has a typo.

**Fix:**
> "Every payroll decision needs a paper trail. This gives it one — with three rounds of proof and citations to the law."

---

### System Overview Doc: Status Label

**Current:** "Status Label: Designed / Target"

**Verdict:** JARGON. Nobody outside the team knows what this means.

**Fix:** Delete. Or say: "This is the planned architecture. See README for what's implemented."

---

## Jobs/Ive: Red Flags in Current Copy

| Red Flag | Where | Why It Fails |
|---|---|---|
| "And also..." | README opening | Two ideas. Say one. |
| "For power users..." | N/A (but watch for this) | Hedging. Decide for everyone. |
| "Flexible" or "Customizable" | "Configurable in-memory corpus" | You haven't decided yet. Decide. |
| "Reference implementation" | README opening | Optional. Not a product. |
| Feature comparison matrix | V1 vs V2 table | That's a spec sheet, not a story. |
| "The core pattern transfers to any domain" | README opening | Trying to be everything. |
| ASCII architecture diagram | README hero | Show the experience, not the wiring. |
| Multiple CTAs | README (7 doc links) | Group by audience, not flat list. |
| "We believe..." | N/A | Say it like you know it. |

---

## Jobs/Ive: Recommended README Rewrite

```markdown
# WCP Compliance Agent

[![CI](https://github.com/FishRaposo/WCP-Compliance-Agent/actions/workflows/pipeline-discipline.yml/badge.svg)](https://github.com/FishRaposo/WCP-Compliance-Agent/actions/workflows/pipeline-discipline.yml)
[![Coverage](https://img.shields.io/badge/coverage-83%2B-brightgreen)](#running-tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-green)](https://nodejs.org/)

> **Payroll decisions you can defend in court.**  
> Three rounds of proof. Every finding cites the law. Every decision has a paper trail.

**[→ Live Demo](https://wcp-compliance-agent.vercel.app)** · **[→ Quick Start](./docs/quick-start.md)** · **[→ FAQ](./docs/faq.md)**

---

## What It Does

WCP Compliance Agent validates [Davis-Bacon Act](https://www.dol.gov/agencies/whd/government-contracts/construction) 
federal construction payroll submissions. 

It checks: Are workers paid the legal minimum? Is overtime calculated correctly? 
Are fringe benefits sufficient? Is the classification correct?

Every decision goes through three layers:

1. **Check the facts** — Extract role, hours, wage. Verify against federal rates.
2. **Get a second opinion** — AI reviews the findings. Must cite the law. Cannot change the math.
3. **Route with confidence** — High confidence? Approve. Medium? Flag for review. Low? Human decides.

---

## By the Numbers

- **310 tests** covering unit, integration, and end-to-end scenarios
- **83%+ code coverage** with 80% CI gate
- **102-example golden set** for regression detection
- **20 trades** in the default DBWD corpus
- **3 layers** of decision proof
- **60 req/min** rate limiting per IP
- **7-year** audit trail retention design
- **0 external dependencies** for core functionality

---

## Quick Start

```bash
git clone https://github.com/FishRaposo/WCP-Compliance-Agent.git
cd WCP-Compliance-Agent && npm install
OPENAI_API_KEY=mock npm run serve
```

Server runs at `http://localhost:3000`. See [Quick Start](docs/quick-start.md) for full setup.

---

## One Endpoint. Three Layers of Proof.

`POST /api/analyze` — Submit payroll text. Get a decision with full audit trail.

See [API Reference](docs/api-reference.md) for PDF/CSV upload, async jobs, and all endpoints.

---

## Documentation

### For developers
- [Quick Start](docs/quick-start.md) — 5 minutes to running
- [Architecture](docs/architecture/system-overview.md) — How the three layers work
- [API Reference](docs/api-reference.md) — All endpoints

### For compliance officers
- [Regulatory Report](docs/compliance/regulatory-compliance-report.md) — How we enforce Davis-Bacon
- [Traceability Matrix](docs/compliance/traceability-matrix.md) — Code-to-regulation mapping
- [FAQ](docs/faq.md) — Common questions

### Roadmap
- [V3 Plan](docs/v3/V3_PLAN.md) — Production architecture (Python + TypeScript + React)

---

## License

[MIT](./LICENSE) © 2026 Vinícius Raposo

*Last updated: 2026-04-22*
```

---

## Jobs/Ive: What This Replaces

| Cut | Replaced with |
|---|---|
| Version history (V1, V2, V3 paragraphs + table) | "Built from the ground up after a prototype proved the concept. No legacy debt." |
| ASCII architecture diagram | Human explanation: "Check the facts. Get a second opinion. Route with confidence." |
| Tech stack table (10 rows) | One line: "Built with: TypeScript, Hono, OpenAI, Zod. Runs on Node.js 22+." |
| API reference with JSON | One-liner + link to docs |
| Project structure tree | Moved to CONTRIBUTING.md |
| "reference implementation" framing | "Payroll decisions you can defend in court." |
| "transfers to any domain" hedging | Removed. Let the architecture speak for itself. |

---

## Jobs/Ive: Naming the Product

**Current:** "WCP Compliance Agent"

**Analysis:**
- "WCP" is an acronym — requires explanation
- "Compliance Agent" is generic — many tools claim this
- Not memorable. Not evocative.

**Jobs would push for:**
- **Shorter:** 2-3 syllables
- **Evocative:** Creates a feeling, not describes a function
- **Consistent:** Follows a family if there is one

**Options to consider for v3:**
1. **"Verdict"** — Short. Evokes a decision. Feels final.
2. **"Bench"** — As in "work bench" + "bench mark" + "bench trial"
3. **"Paycheck"** — Too generic. Not defensible.
4. **Keep "WCP"** — But explain it in the tagline: "WCP — Weekly Certified Payroll, validated."

**My recommendation:** Keep "WCP Compliance Agent" for v2 (established). For v3, consider rebranding to **"Verdict"** or **"WCP Verdict"** if you want something shorter and more memorable.

---

## Jobs/Ive: Presenting This (Keynote Structure)

If you were presenting this at a conference or to a client:

### 1. Set the stage (problem)
> "Federal construction contractors process thousands of payroll forms. One mistake — one wrong wage, one missed overtime calculation — and the Department of Labor shows up. Fines. Disbarment. Lawsuits."

### 2. Introduce the hero (solution)
> "This is WCP Compliance Agent. It reads every payroll form like a compliance officer would — but in seconds, not hours."

### 3. The Rule of Three
> "Three layers of proof. 
> One: check the math. 
> Two: ask the AI. 
> Three: score the confidence."

### 4. Live demo
> Show the `/api/analyze` call. Show the decision. Show the audit trail.

### 5. "One more thing..."
> "Every finding cites the actual regulation. Not a summary. The statute. So when the auditor asks 'why did you approve this?' — you have an answer."

### 6. Minimal slides
> Average Apple keynote: 19 words across 12 slides. Your deck should have:
> - Slide 1: "Payroll decisions you can defend in court."
> - Slide 2: The three layers (one word each)
> - Slide 3: Live demo screenshot
> - Slide 4: "Open source. MIT license."

---

## Jobs/Ive: The Final Check

Before shipping v2 (or v3), apply all five:

1. **Is it simple?** — Can you explain the product in one sentence? ✅ "Payroll decisions you can defend in court."
2. **Is it human?** — Would you explain it this way to a friend? ✅ "Three rounds of proof, every finding cites the law."
3. **Is it confident?** — No hedging, no qualifiers. ✅ Remove "reference implementation." Remove "transfers to any domain."
4. **Is it inevitable?** — Does it feel like the only right answer? ✅ "This is how AI should make decisions in regulated industries."
5. **Does it show care?** — Would someone sense the obsession? ✅ The audit trail, the regulation citations, the trust score — these aren't features. They're values made visible.

If any answer is no, it's not done.

> "Real artists ship." — Steve Jobs
> But they ship when it's ready. Not before.

---

## Jobs/Ive: Priority Action List

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | Rewrite README opening to one sentence | 5 min | High |
| 2 | Cut version history from README → CHANGELOG | 5 min | High |
| 3 | Replace ASCII diagram with human explanation | 10 min | High |
| 4 | Move API reference to docs/ | 10 min | Medium |
| 5 | Move tech stack to bottom | 5 min | Medium |
| 6 | Cut project structure tree | 2 min | Medium |
| 7 | Add "By the Numbers" section | 5 min | High |
| 8 | Group docs by audience | 5 min | Medium |
| 9 | Create docs/faq.md | 30 min | High |
| 10 | Create docs/comparison.md | 20 min | Medium |
| 11 | Fix "paper paper trail" typo | 1 min | Small |
| 12 | Consider v3 rebrand to "Verdict" | 5 min | High (strategic) |

**Total: ~113 minutes for all Jobs/Ive fixes**

---

*Report generated: 2026-04-22*
*Skill: jobs-ive (Steve Jobs + Jony Ive Decision Engine)*
