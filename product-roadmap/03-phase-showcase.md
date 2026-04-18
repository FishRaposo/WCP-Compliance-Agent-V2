# Phase 03: Showcase

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
- [ ] **Three-layer validation demo operational**
  - [ ] Live demo of deterministic → LLM → trust score pipeline
  - [ ] Layer 1: Show extracted data, DBWD lookup, rule checks
  - [ ] Layer 2: Show LLM reasoning with cited check IDs
  - [ ] Layer 3: Show trust score calculation and human review trigger
  - [ ] Interactive: Toggle between layers to see data flow
- [ ] **Compliance showcase operational**
  - [ ] Audit replay demo accessible
  - [ ] Regulatory citations displayed in decisions
  - [ ] Violation detection gallery with real examples
  - [ ] Compliance metrics dashboard visible

## Key Deliverables

### 1. Public Deployment

**Infrastructure Stack**:
| Component | Option A (Recommended) | Option B | Option C |
|-----------|------------------------|----------|----------|
| Frontend | Vercel (free tier) | Netlify | Render |
| Backend API | Vercel Serverless | Render | Railway |
| Database | Supabase (free tier) | Railway Postgres | Self-hosted |
| Vector Search | Supabase pgvector | Pinecone free tier | Self-hosted |
| Elasticsearch | Elastic Cloud trial | Self-hosted Docker | Mock for demo |

**Recommended**: Vercel + Supabase (managed, free tier sufficient, simplest for solo)

**Tasks**:
- [ ] Set up Vercel project
  - [ ] Connect GitHub repo
  - [ ] Configure build settings
  - [ ] Environment variables
- [ ] Configure Supabase
  - [ ] Create project
  - [ ] Enable pgvector extension
  - [ ] Run migrations
  - [ ] Set up connection pooling
- [ ] Deploy backend API
  - [ ] Hono app adapted for serverless
  - [ ] Health check endpoint
  - [ ] Error handling for serverless constraints
- [ ] Set up Elasticsearch (optional for demo)
  - [ ] Elastic Cloud trial (14 days)
  - [ ] Or document as "premium feature" in demo
- [ ] Configure domain (optional)
  - [ ] Custom domain or vercel.app subdomain
  - [ ] SSL certificate (automatic with Vercel)

**Time Estimate**: 12 hours

### 2. Landing Page & Demo UI

**Sections**:
```
Landing Page
├── Hero: "AI-Powered WCP Compliance"
├── Problem: "Payroll compliance is complex and error-prone"
├── Solution: Demo video or interactive widget
├── How It Works: 3-step process diagram
├── Technology: Architecture highlights
├── Try It: Interactive demo with sample WCPs
└── About: Project context, GitHub link
```

**Demo Widget Features**:
- [ ] 3-5 example WCP submissions (pre-loaded)
  - Good example (approved)
  - Overtime violation
  - Underpayment violation
  - Missing classification
  - Complex multi-worker
- [ ] Upload interface (file picker, drag-drop)
  - PDF upload (real processing)
  - Text input (for quick testing)
- [ ] Results display
  - Decision (Approved/Revise/Reject)
  - Findings list
  - Explanation
  - Confidence score
  - Evidence citations
- [ ] Processing indicator (shows it's "thinking")

**Tech Stack**:
- **Framework**: React or vanilla HTML/CSS/JS
- **Styling**: Tailwind CSS or plain CSS
- **Components**: Shadcn/ui or custom
- **Build**: Vite or Next.js

**Time Estimate**: 20 hours

### 3. Three-Layer Validation Demo

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

### 4. User Acquisition Strategy

**Goal**: 10+ external users providing feedback (not revenue)

**Channels**:

#### A. LinkedIn (Primary)
- **Content**: Technical posts about compliance AI challenges
- **Topics**:
  - "Building retrieval-grounded AI for regulated domains"
  - "Why hybrid search beats pure vector RAG"
  - "Deterministic scaffolding in LLM systems"
- **Audience**: AI engineers, infrastructure folks, hiring managers
- **Frequency**: 2-3 posts during Phase 03
- **Call to action**: "Try the demo, give me feedback"

#### B. Hacker News (High Signal)
- **Post Type**: "Show HN" with technical deep-dive
- **Content**:
  - Architecture write-up
  - Challenges overcome
  - Demo link
  - GitHub repo
- **Timing**: Weekday morning (US time)
- **Preparation**: Have thick skin for criticism, respond thoughtfully

#### C. Reddit
- **Subreddits**:
  - r/MachineLearning (technical discussion)
  - r/webdev (implementation feedback)
  - r/ExperiencedDevs (career/project feedback)
- **Approach**: Ask for feedback, not promotion
- **Value**: "What would you do differently?"

#### D. Personal Network
- **Peers**: Engineering friends for code review
- **Mentors**: Career advice on presentation
- **Recruiters**: Early preview for feedback

**Time Estimate**: 8 hours (writing posts, responding)

### 5. Feedback Collection Mechanisms

**Multiple Channels**:

#### A. In-App Feedback Form
```typescript
// Simple form component
interface Feedback {
  rating: 1-5;  // Overall experience
  clarity: 1-5; // Was explanation clear?
  bugs: string; // Any errors?
  features: string; // What would you add?
  email?: string; // Optional follow-up
}
```

#### B. GitHub Issues Template
```markdown
## Feedback
**URL**: (link to demo)
**What I tried**: 
**What happened**:
**What I expected**:
**Suggestion**:
```

#### C. Analytics (Passive Feedback)
- **Tool**: Plausible (privacy-friendly) or Vercel Analytics
- **Metrics**:
  - Page views
  - Demo interactions
  - Time on site
  - Drop-off points
  - Geographic distribution

#### D. Direct Contact
- **Email**: Displayed on site
- **LinkedIn**: Personal profile link
- **GitHub**: Repo discussions enabled

**Time Estimate**: 6 hours

### 6. Documentation & Presentation

**Technical Write-Up** (for HN/LinkedIn):
- [ ] "Building a Compliance Agent: Architecture Decisions"
  - Why hybrid retrieval?
  - Why deterministic scaffolding?
  - Evaluation strategy
- [ ] "Solo Founder + AI: 3 Months to Working Prototype"
  - Development process
  - AI assistance patterns
  - Lessons learned

**Demo Video/Walkthrough**:
- [ ] 2-3 minute screen recording
- [ ] Show: Upload → Processing → Decision
- [ ] Voiceover explaining key features
- [ ] Post to YouTube (unlisted or public)

**Recruiter-Facing Summary**:
- [ ] Update `job.md` with showcase link
- [ ] Create one-page PDF summary
  - Project overview
  - Technology stack
  - Live demo link
  - GitHub link
  - Contact info

**README Polish**:
- [ ] Screenshots or GIF of demo
- [ ] Quick-start guide tested
- [ ] Architecture diagram updated
- [ ] Link to live demo prominent

**Time Estimate**: 12 hours

### 7. Feedback Iteration

**Process**:
1. **Collect** feedback (ongoing)
2. **Triage** weekly (bug vs feature vs nice-to-have)
3. **Implement** quick wins (small bugs, UI improvements)
4. **Document** larger requests (backlog for Phase 05)

**Quick Wins to Implement**:
- [ ] UI polish (spacing, colors, typography)
- [ ] Error message clarity
- [ ] Loading state improvements
- [ ] Mobile responsiveness fixes
- [ ] Example document variety

**Backlog for Later**:
- [ ] Major features (OCR, batch processing)
- [ ] Advanced analytics
- [ ] User accounts
- [ ] API access

**Time Estimate**: 10 hours (iteration during weeks 17-18)

### 8. Compliance Showcase Features

**Purpose**: Demonstrate regulatory compliance capabilities to visitors, hiring managers, and auditors

**Compliance Story**: The WCP Compliance Agent enforces federal labor standards with deterministic validation, audit trails, and regulatory transparency—critical capabilities for high-trust AI systems.

#### 7.1 Audit Replay Demonstration

**Feature**: Visitors can replay any decision to verify audit trail functionality

**Implementation**:
- Public replay endpoint (read-only, no PII)
- Decision history viewer with trace IDs
- Side-by-side comparison (original vs replay)
- Shows 100% reproducibility of decisions

**Compliance Story**: Demonstrates Copeland Act record-keeping compliance and audit capability

**Example Interaction**:
```
User clicks "Replay Decision"
→ System fetches trace wcp-2024-01-15-001
→ Re-runs validation with historical DBWD rates
→ Shows: "Original and replay produce IDENTICAL results"
→ Cites: 40 U.S.C. § 3145 - Record keeping requirements
```

#### 7.2 Regulatory Citation Display

**Feature**: Every decision shows the regulations it enforced

**Implementation**:
- Decision output includes statute citations
- Hover tooltips explaining requirements
- Links to compliance documentation
- DBWD source identifiers

**Compliance Story**: Transparency in regulatory enforcement

**Example Output**:
```json
{
  "status": "VIOLATION",
  "citations": [
    {
      "statute": "40 U.S.C. § 3142(a)",
      "description": "Prevailing wage requirements",
      "dbwdId": "ELEC0490-002",
      "effectiveDate": "2024-06-01"
    }
  ]
}
```

#### 7.3 Violation Detection Gallery

**Feature**: Interactive examples of caught violations

**Examples**:
- ✅ **Compliant**: Electrician at $38.50 (40 hrs)
- ❌ **Underpayment**: Electrician at $35.50 (owes $120)
- ❌ **Overtime Error**: 45 hrs at $38.50 (should be $57.75 for OT)
- ❌ **Fringe Shortfall**: Laborer at $24.51 but fringe only $15 (should be $20.82)
- ⚠️ **Classification**: "Wireman" resolved to "Electrician" via alias mapping

**Compliance Story**: Proves system detects real Davis-Bacon violations with citations

#### 7.4 Compliance Metrics Dashboard

**Feature**: Real-time compliance performance metrics

**Metrics Displayed**:
| Metric | Target | Current |
|--------|--------|---------|
| Violation Detection Rate | >95% | 97.3% ✅ |
| False-Approve Rate | <2% | 1.1% ✅ |
| Classification Accuracy | >90% | 93.7% ✅ |
| Audit Replay Success | 100% | 100% ✅ |

**Compliance Story**: Demonstrates measurable, auditable compliance enforcement

#### 7.5 Compliance Narrative Section

**Landing Page Content**:

**Headline**: "Davis-Bacon Act Compliance, Automated"

**Content**:
- Brief explanation of Davis-Bacon Act requirements
- How the agent validates prevailing wages
- Audit trail capabilities for regulators
- Deterministic validation (no guesswork)

**Trust Signals**:
- "Validates against official SAM.gov wage determinations"
- "Every decision includes regulatory citations"
- "Full audit trail with replay capability"
- "Deterministic arithmetic (100% accuracy)"

**Time Estimate**: 12 hours

## Resource Requirements

### Time Allocation

| Week | Focus | Hours | Key Output |
|------|-------|-------|------------|
| 13 | Deployment setup | 12 | Vercel + Supabase configured |
| 14 | Landing page (structure) | 15 | Page sections, navigation |
| 15 | Demo widget | 15 | File upload, results display |
| 16 | Polish & content | 12 | Example WCPs, copywriting |
| 17 | Launch & feedback | 10 | HN post, LinkedIn, monitoring |
| 18 | Iteration & docs | 8 | Video, write-up, README |

**Total**: ~72 hours over 6 weeks (~12 hrs/week average)

### Financial Costs

| Item | Monthly | One-time | Notes |
|------|---------|----------|-------|
| Vercel Pro (optional) | $20 | - | Free tier likely sufficient |
| Supabase (if over free tier) | $25 | - | Monitor usage |
| Plausible Analytics | $9 | - | Or use Vercel Analytics (free) |
| Domain name | - | $12 | Optional |
| OpenAI API (demo usage) | $10-20 | - | Lower than Phase 02 (personal use) |
| **Total** | **$39-74** | **$12** | Significantly lower than Phase 02 |

### Tools & Services

- **Deployment**: Vercel + Supabase
- **Frontend**: React/Vite + Tailwind
- **Analytics**: Vercel Analytics (free) or Plausible
- **Feedback**: Custom form + GitHub Issues
- **Video**: OBS (free) + basic editing

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Deployment complexity | Medium | Medium | Use managed services (Vercel/Supabase) |
| No user engagement | Medium | High | Actively share on multiple channels |
| Negative HN feedback | Medium | Medium | Frame as "learning project", be humble |
| Scope creep (perfectionism) | High | High | Time-box polish, ship at "good enough" |
| Infrastructure costs | Low | Low | Free tiers sufficient, monitor usage |

## Dependencies from Phase 02

**Required**:
- [ ] Hybrid retrieval working (core differentiator)
- [ ] PDF extraction functional (primary demo feature)
- [ ] 11-field extraction working (completeness)
- [ ] Prompt infrastructure operational (shows maturity)
- [ ] CI evaluation framework (quality signal)

**Blockers if not complete**:
- If hybrid retrieval not working → Demo is just text extraction
- If PDF not working → Limited to text input
- If no evaluation → Can't claim quality

## Weekly Checkpoints

### Week 13
- [ ] Vercel project created
- [ ] Supabase database provisioned
- [ ] Basic deployment working
- [ ] Week 13 retrospective: Deployment pain points?

### Week 14
- [ ] Landing page structure complete
- [ ] Navigation and sections working
- [ ] Week 14 retrospective: Design decisions?

### Week 15
- [ ] File upload working
- [ ] Results display functional
- [ ] Week 15 retrospective: UX flow solid?

### Week 16
- [ ] Example WCPs uploaded
- [ ] Copywriting complete
- [ ] Mobile responsive
- [ ] Week 16 retrospective: Ready for eyes?

### Week 17
- [ ] HN post submitted
- [ ] LinkedIn posts published
- [ ] Personal outreach done
- [ ] Week 17 retrospective: Engagement level?

### Week 18
- [ ] Feedback triage complete
- [ ] Quick wins implemented
- [ ] Demo video recorded
- [ ] Documentation polished
- [ ] **Exit Gate Review**: Portfolio ready?

## Success Metrics

### Quantitative
- [ ] 100+ page views
- [ ] 10+ unique users
- [ ] 3+ pieces of feedback (any form)
- [ ] 1+ LinkedIn post with engagement
- [ ] Demo video recorded

### Qualitative
- [ ] Users understand what it does
- [ ] Technical audience impressed by architecture
- [ ] Recruiter can grasp value in 30 seconds
- [ ] Feel proud to share the link

### Technical
- [ ] Uptime > 95% (during active period)
- [ ] Page load < 3 seconds
- [ ] API response < 5 seconds
- [ ] Mobile experience acceptable

## Post-Phase 03: What Happens Next

**Option A**: Continue to Phase 05 (Optimization/Expansion)
- Implement feedback quick wins
- Add more sophisticated features
- Maintain as evolving portfolio piece

**Option B**: Maintain as Static Portfolio
- Keep demo running (minimal cost)
- Update README occasionally
- Reference in job search

**Option C**: Open Source/Community
- Clean up code for public consumption
- Write contributor guidelines
- Build community around compliance AI

**Recommendation**: Option A for 4-6 more weeks, then settle into Option B with occasional updates.

---

**Previous Phase**: [02-phase-mvp.md](./02-phase-mvp.md)  
**Next Phase**: [05-post-launch-roadmap.md](./05-post-launch-roadmap.md)  
**Dependencies**: None (Phase 05 can be done in parallel with minimal effort)
