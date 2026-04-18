# 5-Minute Demo Script — Jobs Keynote Structure

**Purpose:** Upwork interview for Founding AI Infrastructure Engineer  
**Style:** Steve Jobs keynote (problem → hero → demo → "one more thing")  
**Target:** Revenue intelligence platform hiring team

---

## Pre-Demo Setup (30 seconds before you start)

```bash
# Terminal 1: Start the server
cd WCP-Compliance-Agent
export OPENAI_API_KEY=sk-your-key
npm run dev

# Terminal 2: Ready for curl commands
# Have these pre-typed, just need to hit enter:
```

---

## 1. Set the Stage — The Problem (45 seconds)

**[Slide: Black box with question marks]**

> "Current AI compliance tools are black boxes. You feed in a payroll document. You get back 'violation detected.' And if a federal auditor asks 'how did you reach this decision?' — you can't answer.

> No traceability. No audit trail. No evidence chain.

> That's not compliance. That's gambling with federal contracts."

**[Pause. Let them feel the pain.]**

---

## 2. Introduce the Hero — The Solution (30 seconds)

**[Slide: Three-layer architecture diagram]**

> "WCP Compliance Agent treats every decision like a court case. Three layers of evidence. Every finding cites a specific regulation. Every decision has a trace ID you can replay.

> This isn't magic. This is engineering discipline."

---

## 3. The Rule of Three — Architecture (45 seconds)

**[Slide: Three layers, one at a time]**

> "Three layers:
> 
> **One:** Deterministic extraction. No LLM hallucination on arithmetic or lookups. Hard rules, hard citations.
> 
> **Two:** Constrained LLM reasoning. The LLM reviews findings — but cannot recompute or re-lookup. It's a reviewer, not a calculator.
> 
> **Three:** Trust score routing. Below 0.60 confidence? Automatic human review. No guesswork."

---

## 4. Live Demo — Show, Don't Tell (2.5 minutes)

**[Switch to terminal]**

### Demo 1: Clean Case (Approved)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Role: Electrician, Hours: 40, Wage: $52"}'
```

**Narrate while it runs:**
> "Electrician, 40 hours, $52 wage. Above the $51.69 DBWD base rate. No overtime."

**[Show the JSON output]**

Point to key fields:
- `"finalStatus": "Approved"` — clean pass
- `"trust.score": 0.92` — high confidence
- `"humanReview.required": false` — auto-approved
- `"auditTrail"` — every step logged

> "Clean case. High trust. Auto-approved. Full audit trail."

### Demo 2: Violation (Rejected + Human Review)

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Role: Electrician, Hours: 45, Wage: $35"}'
```

**Narrate:**
> "Same electrician. But 45 hours — that's overtime. And $35 wage — that's $16 below the prevailing rate. Two violations."

**[Show the JSON output]**

Point to key fields:
- `"finalStatus": "Reject"`
- `"deterministic.checks"` — show the two failed checks with regulation citations
- `"verdict.rationale"` — LLM explaining based on those checks
- `"trust.score": 0.28` — low confidence
- `"humanReview.required": true` — routed to expert
- `"humanReview.status": "pending"` — queued for review

> "Two violations. Trust score drops to 0.28. Automatically routed to human expert. Not guessed. Not hoped. Routed with evidence."

---

## 5. The Evidence Chain — Audit Trail (30 seconds)

**[Scroll to auditTrail in the JSON]**

> "Every decision has a complete evidence chain. Timestamped. Replayable. This is what an auditor needs. This is what a court needs. This is what *you* need when someone asks 'why did the AI decide this?'"

---

## 6. "One More Thing..." — Transfer to Revenue Intelligence (30 seconds)

**[Slide: Same architecture, different labels]**

> "And here's what makes this transferable to revenue intelligence:

> Swap 'trade' for 'deal stage.'
> Swap 'DBWD rates' for 'historical win rates.'
> Swap 'wage violations' for 'deal risk factors.'

> Same three-layer pattern. Same deterministic scaffolding. Same audit trail.

> This isn't just payroll compliance. This is how you build trustworthy AI for any high-stakes decision."

---

## 7. Close — The Ask (15 seconds)

> "I've built this before — at Expat Money, I owned the zero-to-one AI infrastructure. 90% cost reduction, 50% speed increase. I can bring this same deterministic discipline to your revenue intelligence platform.

> The question isn't whether this works. The question is: when do we start?"

**[Pause. Wait for questions.]**

---

## If They Ask About Gaps

**"What about PDF ingestion?"**
> "Intentionally stubbed. This is an architecture showcase, not a production product. The hybrid retrieval is designed but not implemented — I wanted to prove I can architect the full system without spending weeks on Elasticsearch setup. The core innovation is the three-layer trust architecture, which is fully implemented."

**"Only 5 hardcoded trades?"**
> "Correct — for the demo. Production would integrate SAM.gov API for live rates. The architecture supports dynamic rate sources; this proves the validation logic works."

**"No CI running?"**
> "Removed the GitHub Actions because they need OPENAI_API_KEY as a repo secret, which isn't configured. The `npm run lint:pipeline` command still enforces architectural discipline locally."

---

## Key Principles to Remember

1. **Lead with pain** — Make them feel the black-box problem first
2. **Show, don't tell** — Live demo beats architecture diagrams
3. **Rule of three** — Three layers, clean and memorable
4. **Confidence** — "This isn't magic. This is engineering discipline."
5. **Transferability** — End with "this applies to your domain"

---

## Backup Plan

If the API call fails during demo:
> "Let me show you what the output structure looks like..." 

Then walk through the JSON in `WCP_CORE.md` or the mock response.

The architecture proof is in the code structure, not just the live call.

---

*Practice this twice before the interview. Know the curl commands cold. The demo should feel effortless.*
