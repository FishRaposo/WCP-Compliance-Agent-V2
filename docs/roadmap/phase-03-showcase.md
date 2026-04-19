# Phase 03: Showcase

> **This file is preserved for reference detail.**
> The single authoritative release plan is **[RELEASE_PLAN.md](./RELEASE_PLAN.md)**.
> Phase 03 plans are in the [Phase 03 section](./RELEASE_PLAN.md#phase-03-showcase--not-started) of that document.

Status Label: Designed / Target

**Duration**: Weeks 13-18 (6 weeks)  
**Effort**: 10-15 hrs/week  
**Dependencies**: Phase 02 complete (working retrieval, real processing)  
**Exit Gate**: Public demo deployed, feedback collected, portfolio ready

---

## Objectives

1. **Deploy public demonstration**: Live URL accessible to anyone
2. **Collect user feedback**: Mechanism for external input, not just self-testing
3. **Polish presentation quality**: Portfolio-ready, recruiter-impressive
4. **Document showcase narrative**: Clear story for technical and non-technical audiences
5. **Iterate based on feedback**: Demonstrate product development loop
6. **✅ Demonstrate regulatory compliance**: Showcase Davis-Bacon Act enforcement capabilities

---

## Exit Gate Criteria

All must be true to consider Phase 03 complete:

- [ ] Public demo deployed
  - [ ] Live URL accessible
  - [ ] Example WCP submissions for visitors
  - [ ] Clear value proposition displayed
  - [ ] Mobile-responsive design
- [ ] Feedback collection operational
  - [ ] 10+ external users have interacted
  - [ ] Feedback form or mechanism in place
  - [ ] Analytics tracking usage
- [ ] Portfolio presentation ready
  - [ ] Technical write-up complete
  - [ ] Demo video or walkthrough recorded
  - [ ] Recruiter-facing summary updated
- [ ] Documentation polished
  - [ ] README reflects current state
  - [ ] Architecture diagrams current
  - [ ] Quick-start guide works for new users
- [x] **Three-layer validation demo operational**
  - [x] Live demo of deterministic → LLM → trust score pipeline
  - [x] Layer 1: Show extracted data, DBWD lookup, rule checks
  - [x] Layer 2: Show LLM reasoning with cited check IDs
  - [x] Layer 3: Show trust score calculation and human review trigger
  - [x] Interactive: Toggle between layers to see data flow
- [x] **Compliance showcase operational**
  - [x] Audit replay demo accessible
  - [x] Regulatory citations displayed in decisions
  - [x] Violation detection gallery with real examples
  - [x] Compliance metrics dashboard visible

---

## Key Deliverables

### 1. Public Deployment

**Status**: Designed / Target

**Infrastructure**:
- Hosting: Vercel, Netlify, or Render (serverless-friendly)
- Domain: Custom domain optional (e.g., `wcp-demo.vercel.app`)
- Database: Supabase or Render PostgreSQL (free tier sufficient for demo)
- File storage: Not needed (text-based WCP input)

**Deployment Checklist**:
- [ ] Environment variables configured (OpenAI API key, DB credentials)
- [ ] Health endpoint responding
- [ ] `/analyze` endpoint functional
- [ ] Error handling graceful (no stack traces exposed)
- [ ] CORS configured for frontend
- [ ] Rate limiting enabled (prevent abuse)

**Time Estimate**: 12 hours

---

### 2. Landing Page & Demo UI

**Status**: Designed / Target

**Purpose**: First impression for recruiters and hiring managers

**Sections**:
1. **Hero**: Clear value proposition
   - "AI-Powered Davis-Bacon Act Compliance"
   - Tagline: "Validate Weekly Certified Payrolls in seconds"
   - CTA: Try the demo

2. **Three-Layer Validation Demo** (Interactive)
   - Input: WCP text or select example
   - Layer 1 panel: Show extracted data, DBWD lookup, rule checks
   - Layer 2 panel: Show LLM reasoning, cited check IDs
   - Layer 3 panel: Show trust score components, human review trigger
   - Visual flow: Animated data flow between layers

3. **Compliance Showcase**
   - Audit trail viewer (trace IDs, replay capability)
   - Regulatory citations (40 U.S.C. § 3142, 29 CFR 5.5)
   - Violation gallery (underpayment, overtime errors)

4. **Technical Architecture**
   - High-level diagram
   - Three-layer pipeline explanation
   - Trust scoring formula

5. **Case Studies**
   - Example: Electrician underpayment detection
   - Example: Overtime calculation validation
   - Example: Unknown role escalation

6. **About / Team**
   - Solo developer + AI assistance story
   - Skills demonstrated (AI infrastructure, compliance, TypeScript)
   - GitHub link

**Tech Stack**:
- Framework: React or vanilla HTML/CSS/JS
- Styling: Tailwind CSS or plain CSS
- Components: Shadcn/ui or custom
- Build: Vite or Next.js

**Time Estimate**: 20 hours

---

### 3. Three-Layer Validation Demo

**Status**: Structurally Implemented, Demo-Ready

**Purpose**: Demonstrate the core architectural innovation—deterministic scaffold → LLM verdict → trust score pipeline

**Demo Components**:

| Component | What It Shows | User Interaction |
|-----------|---------------|------------------|
| **Pipeline Visualizer** | Data flow through 3 layers | Step through each layer |
| **Layer 1 Panel** | Extracted data, DBWD lookup results, check results | Toggle which checks to run |
| **Layer 2 Panel** | LLM reasoning, referenced check IDs, citations | See which checks LLM cited |
| **Layer 3 Panel** | Trust score components, band assignment, human review queue | Adjust thresholds live |
| **Trace Inspector** | Full decision trace with audit trail | Replay any decision |

**Demo Scenarios**:
1. **Clean Case**: Electrician at correct wage → High trust, auto-approve
2. **Underpayment**: Below prevailing wage → Low trust, flag for review
3. **Unknown Classification**: Unrecognized role → Very low trust, require human
4. **Overtime Error**: Wrong OT calculation → Medium trust, flag for review
5. **Disagreement**: LLM verdict contradicts findings → Force human review

**Architecture Diagram** (shown in demo):
```
WCP Input
    ↓
Layer 1 (Deterministic) → Extract → Lookup → Check
    ↓ DeterministicReport
Layer 2 (LLM Verdict) → Review → Decide → Cite
    ↓ LLMVerdict
Layer 3 (Trust Score) → Compute → Threshold → Route
    ↓ TrustScoredDecision
   ┌──────────────────────┐
   │  Human Review Queue  │ ← (if trust < 0.60)
   └──────────────────────┘
```

**Key Demo Features**:
- **Trust Score Breakdown**: Visualize the 0.35/0.25/0.20/0.20 formula
- **Agreement Check**: Show when LLM verdict aligns with deterministic findings
- **Check ID Validation**: Highlight which checks LLM referenced
- **Human Review Simulator**: Show queue priority based on violation severity

**Technical Implementation**:
```typescript
// Demo uses real pipeline with visualization hooks
const demoDecision = await executeDecisionPipeline({
  content: exampleWCP,
  onLayerComplete: (layer, data) => updateVisualization(layer, data)
});
```

**Time Estimate**: 12 hours

---

### 4. User Acquisition Strategy

**Status**: Designed / Target

**Goal**: 10+ external users providing feedback (not revenue)

**Channels**:

#### A. LinkedIn (Primary)
- **Content**: Technical posts about compliance AI challenges
- **Topics**:
  - "Building retrieval-grounded AI for regulated domains"
  - "Why hybrid search beats pure vector RAG"
  - "Three-layer validation: deterministic → LLM → trust score"
- **Timing**: 2-3 posts during showcase phase
- **CTA**: "Try the demo and tell me what you'd change"

#### B. Hacker News (Secondary)
- **Post**: "Show HN: AI-powered Davis-Bacon Act compliance agent"
- **Focus**: Technical architecture, not product pitch
- **Respond**: Thoughtfully to all comments

#### C. AI/ML Communities
- **Subreddits**: r/MachineLearning, r/LocalLLaMA
- **Focus**: Technical approach, not promotion
- **Value**: Share lessons learned

#### D. Personal Network
- **Peers**: Engineering friends for code review
- **Mentors**: Career advice on presentation
- **Recruiters**: Early preview for feedback

**Time Estimate**: 8 hours (writing posts, responding)

---

### 5. Feedback Collection Mechanisms

**Status**: Designed / Target

**Multiple Channels**:

#### A. In-App Feedback Form
```typescript
interface Feedback {
  rating: 1-5;  // Overall experience
  clarity: 1-5; // Was explanation clear?
  bugs: string; // Any errors?
  suggestions: string; // What would you change?
  email?: string; // Optional follow-up
}
```

#### B. Analytics
- **Tool**: Plausible (privacy-friendly) or Google Analytics
- **Metrics**:
  - Page views
  - Time on site
  - Demo completion rate
  - Most-viewed scenarios

#### C. GitHub Issues
- Enable discussions on repo
- Label: `feedback`, `showcase`
- Respond within 24 hours

#### D. Direct Contact
- **Email**: Displayed on site
- **LinkedIn**: Personal profile link
- **GitHub**: Repo discussions enabled

**Time Estimate**: 6 hours

---

### 6. Documentation & Presentation

**Status**: Designed / Target

**Technical Write-Up** (for HN/LinkedIn):
- [ ] "Building a Compliance Agent: Architecture Decisions"
  - Why hybrid retrieval?
  - Why deterministic scaffolding?
  - Evaluation strategy
- [ ] "Solo Founder + AI: 3 Months to Working Prototype"
  - Development process
  - AI assistance patterns
  - Lessons learned

**Demo Video** (2-5 minutes):
- Walk through three-layer validation
- Show compliance features
- Explain trust scoring
- Mention regulatory citations

**Portfolio Site**:
- Professional bio
- Skills demonstrated
- Project links
- Contact info

**README Polish**:
- [ ] Screenshots or GIF of demo
- [ ] Quick-start guide tested
- [ ] Architecture diagram updated
- [ ] Link to live demo prominent

**Time Estimate**: 12 hours

---

### 7. Feedback Iteration

**Status**: Designed / Target

**Process**:
1. **Collect** feedback (ongoing)
2. **Triage** weekly (bug vs feature vs nice-to-have)
3. **Implement** quick wins (small bugs, UI improvements)
4. **Document** larger requests (backlog for Phase 05)

**Quick Wins to Implement**:
- [ ] UI polish (spacing, colors, typography)
- [ ] Error message clarity
- [ ] Example document variety

**Backlog for Later**:
- [ ] Major features (OCR, batch processing)
- [ ] Advanced analytics
- [ ] User accounts
- [ ] API access

**Time Estimate**: 10 hours (iteration during weeks 17-18)

---

### 8. Compliance Showcase Features

**Status**: Structurally Implemented

**Purpose**: Demonstrate regulatory compliance capabilities to visitors, hiring managers, and auditors

**Compliance Story**: The WCP Compliance Agent enforces federal labor standards with deterministic validation, audit trails, and regulatory transparency—critical capabilities for high-trust AI systems.

#### 8.1 Audit Replay Demonstration

**Feature**: Visitors can replay any decision to verify audit trail functionality

**Implementation**:
- Store traceId → decision mapping (in-memory for demo)
- Replay button re-runs the same inputs
- Show identical outputs (deterministic guarantee)

**UI**:
```
Trace ID: wcp-20240115-abc123
[Replay Decision]

Original: Reject (trust: 0.45)
Replay:   Reject (trust: 0.45)
Match:    ✅ Verified
```

#### 8.2 Regulatory Citations Display

**Feature**: Show the regulation behind each check

**Example**:
```
❌ Base Wage Violation
   Regulation: 40 U.S.C. § 3142(a)
   Description: "The wages of every laborer and mechanic employed on public work shall be not less than the prevailing wage"
   Shortfall: $3.00/hr
```

#### 8.3 Violation Detection Gallery

**Feature**: Pre-loaded examples of violations the system catches

**Scenarios**:
1. **Underpayment**: Electrician at $35.50/hr (prevailing: $38.50)
2. **Overtime Error**: 45 hours at straight time (should be 1.5× for 5 hours)
3. **Missing Fringe**: No fringe benefits listed (should be $8.50/hr)
4. **Unknown Role**: "Wireman" not in DBWD classification

#### 8.4 Compliance Metrics Dashboard

**Feature**: Real-time display of system performance

**Metrics**:
- Total decisions processed
- Violation detection rate
- Trust score distribution
- Human review queue depth
- Average decision time

**Time Estimate**: 8 hours

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Demo uptime | 99%+ | Hosting dashboard |
| Page load time | <3 seconds | Lighthouse |
| Unique visitors | 100+ first week | Analytics |
| Feedback pieces | 5+ actionable | GitHub issues, email |
| LinkedIn engagement | 10+ comments | LinkedIn analytics |

---

## Timeline

| Week | Focus | Key Deliverable |
|------|-------|-----------------|
| 13-14 | Deployment | Live URL |
| 15-16 | Landing page | Demo UI complete |
| 17 | Content | Write-ups, video |
| 18 | Launch | LinkedIn post, HN |

---

## Next Actions

1. **Choose hosting platform** (Vercel recommended)
2. **Set up deployment pipeline** (GitHub → Vercel)
3. **Build landing page skeleton** (React + Tailwind)
4. **Implement three-layer demo** (visualization components)
5. **Create example scenarios** (5 violation cases)
6. **Write LinkedIn post draft** (technical, not promotional)
7. **Set up analytics** (Plausible)

---

**Last Updated**: 2026-04-17  
**Status**: Ready for Phase 02 completion before execution
