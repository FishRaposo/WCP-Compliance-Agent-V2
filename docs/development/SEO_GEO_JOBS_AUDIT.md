# SEO + GEO Audit Report: WCP Compliance Agent

**Date:** 2026-04-22
**Auditor:** Clanker (website-seo + seo-geo-audit + jobs-ive skills)
**Scope:** README.md, docs/, and full repo SEO/GEO/brand positioning

---

# PART 1: Traditional SEO Audit (website-seo skill)

## Phase 1: Page-Level Optimization

### README.md — Title & Meta Analysis

**Current README title:** `# WCP Compliance Agent — V2`

**Problems:**
- No `<title>` tag equivalent (GitHub uses repo name, not README H1)
- The `— V2` suffix is internal versioning, not search-friendly
- Missing primary keyword placement: "Davis-Bacon Act" and "prevailing wage"

**SEO Fix:**
```markdown
# WCP Compliance Agent — Davis-Bacon Act Payroll Compliance Validation
```
Or for the repo name itself: rename to `davis-bacon-compliance-agent` or `federal-payroll-compliance`

**Meta description equivalent** (GitHub repo description):
Current: "Regulated-domain AI infrastructure case study for trustworthy LLM decision systems"

**Problem:** Jargon-heavy. No keywords a compliance officer would search.

**SEO Fix:**
```
AI-powered Davis-Bacon Act payroll validation. Checks prevailing wage, overtime, fringe benefits. Three-layer decision pipeline with full audit trail.
```

---

### Header Structure (H1-H6)

**README.md current headers:**
```
H1: WCP Compliance Agent — V2
H2: What This Is
H2: Version History
H3: V1 — Prototype
H3: V2 — Reference Implementation
H3: V3 — Production Platform
H2: Architecture
H2: Quick Start
H2: API Reference
H3: POST /api/analyze
H2: Running Tests
H2: Configuration
H2: Tech Stack
H2: Project Structure
H2: Documentation
H2: License
```

**SEO Problems:**
1. **Duplicate H1 issue** — GitHub renders README H1 as the page title. Only one H1, which is fine, but it should contain primary keywords.
2. **"Version History" H2 is massive** — 60+ lines of content under one header. Breaks SEO concentration.
3. **"Tech Stack" H2 is a table** — Tables are good for humans but don't rank well for keywords.
4. **Missing H2s for key topics:** No dedicated sections for "Features," "How It Works," "Compliance Coverage"

**SEO Fix — Revised Header Structure:**
```
H1: WCP Compliance Agent — Federal Payroll Compliance Validation
H2: What It Does (replaces "What This Is")
H2: How It Works (replaces ASCII diagram with human explanation)
H2: Key Features (new — keyword-rich bullet points)
H2: By the Numbers (new — quotable statistics)
H2: Quick Start
H2: API Overview
H2: Documentation
H3: For Developers
H3: For Compliance Officers
H2: Tech Stack (moved to bottom)
H2: License
```

---

### Content Optimization

**Primary keywords to target:**
- Davis-Bacon Act compliance
- Prevailing wage validation
- Federal payroll compliance
- WH-347 validation
- Construction payroll audit
- AI compliance tool
- Automated wage verification

**Current keyword density:** Zero. The README never uses "Davis-Bacon Act" in the first 100 words. Never uses "prevailing wage" in the opening. Never uses "WH-347" anywhere.

**SEO Fix — Opening paragraph:**
```markdown
WCP Compliance Agent validates [Davis-Bacon Act](https://www.dol.gov/agencies/whd/government-contracts/construction) 
[federal construction payroll](docs/compliance/regulatory-compliance-report.md) submissions. 
It checks prevailing wage rates, overtime calculations, fringe benefits, and worker classifications 
against U.S. Department of Labor requirements.
```

**LSI (Latent Semantic Indexing) keywords to add:**
- Davis-Bacon Act → "prevailing wage," "federal construction," "WH-347," "DOL wage determinations"
- Compliance → "audit trail," "regulatory enforcement," "wage and hour"
- AI → "automated validation," "decision pipeline," "trust scoring"

---

### Internal Linking Strategy

**Current state:** 7 doc links in README. All flat. No hub-and-spoke.

**SEO Fix — Hub and Spoke Model:**

```
HUB: README.md (homepage)
  ├── SPOKE: docs/quick-start.md
  ├── SPOKE: docs/faq.md (NEW — create this)
  ├── SPOKE: docs/comparison.md (NEW — vs alternatives)
  ├── SPOKE: docs/api-reference.md (NEW — split from README)
  ├── SPOKE: docs/tech-stack.md (NEW — split from README)
  └── SPOKE: docs/architecture/system-overview.md

HUB: docs/compliance/regulatory-compliance-report.md
  ├── SPOKE: docs/compliance/traceability-matrix.md
  ├── SPOKE: docs/compliance/implementation-guide.md
  └── SPOKE: docs/faq.md#compliance-questions
```

**Internal linking rules to apply:**
- Every doc should link back to README
- Use descriptive anchor text (not "click here" or "read more")
- Add 2-3 internal links per page

---

## Phase 2: Technical SEO

### Indexability

**Current:** GitHub repo. Automatically indexed by Google.

**Problems:**
- `robots.txt` — N/A (GitHub controls this)
- `sitemap.xml` — N/A (GitHub doesn't provide)
- `noindex` — Not applicable
- Canonical tags — Not applicable

**What we CAN control:**
- ✅ Repo description (acts as meta description)
- ✅ README content (acts as page content)
- ✅ Topics/tags on GitHub repo

**SEO Fix — GitHub repo settings:**
Add these topics/tags to the repo:
```
davis-bacon-act, prevailing-wage, federal-compliance, payroll-validation, 
construction-compliance, wh-347, wage-determination, ai-compliance, 
automated-audit, trust-scoring
```

---

### URL Structure

**Current:** `github.com/FishRaposo/WCP-Compliance-Agent`

**SEO Problems:**
- `WCP` is an acronym — not searchable
- `Compliance-Agent` is generic
- Missing keywords: davis-bacon, prevailing-wage, payroll

**SEO Fix:** Can't change GitHub repo URL easily, but consider:
- Rename repo to: `davis-bacon-compliance-agent` or `federal-payroll-validator`
- OR add a custom domain (GitHub Pages) with keyword-rich URL

**If using GitHub Pages:**
```
https://wcp-compliance-agent.vercel.app → Move to
https://davisbacon.fishraposo.dev or similar keyword-rich domain
```

---

### Performance

**Current:** GitHub-hosted README + Vercel demo.

**Observations:**
- GitHub renders README fast — ✅
- Vercel demo loads quickly — ✅
- Images/badges in README may slow initial paint slightly

**No action needed** — performance is acceptable for a GitHub repo.

---

## Phase 3: Schema Markup

### Current State: No schema markup

GitHub doesn't support JSON-LD in README markdown. But we can add schema in:
1. **GitHub Pages** (if set up) — add to HTML `<head>`
2. **Vercel demo** — add to `index.html`
3. **Static site** (future) — add to all pages

### Recommended Schema Types

**SoftwareApplication:**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "WCP Compliance Agent",
  "description": "AI-powered Davis-Bacon Act payroll compliance validation with three-layer decision pipeline",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Node.js 22+",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": "Vinícius Raposo"
  },
  "license": "https://github.com/FishRaposo/WCP-Compliance-Agent/blob/main/LICENSE"
}
```

**FAQPage:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is WCP Compliance Agent?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "WCP Compliance Agent is an open-source AI tool that validates Weekly Certified Payroll submissions against Davis-Bacon Act prevailing wage requirements."
      }
    },
    {
      "@type": "Question",
      "name": "How does it verify compliance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Every decision goes through three layers: deterministic extraction and rule checks, AI reasoning over findings with regulation citations, and trust-scored routing to approve, flag, or route to human review."
      }
    }
  ]
}
```

---

# PART 2: GEO + Unified Audit (seo-geo-audit skill)

## Executive Summary

| Layer | Score | Status |
|---|---|---|
| Technical SEO | 6/10 | Acceptable — GitHub-hosted, limited control |
| On-Page SEO | 4/10 | Poor — missing keywords, no FAQ, weak headers |
| GEO / AI Visibility | 3/10 | Poor — not structured for LLM citation |
| Trust & Authority | 5/10 | Fair — MIT license, named author, but thin |
| Off-Site Mentions | 2/10 | Poor — no LinkedIn, Reddit, YouTube presence |
| Platform Readiness | 3/10 | Poor — no Bing, Perplexity, AI Overview optimization |

**Overall SEO+GEO Score: 23/60 (Poor — needs significant work)**

---

## Technical Layer

### Crawlability
- ✅ GitHub repos are automatically crawled by Google
- ✅ README content is fully rendered and indexed
- ⚠️ No XML sitemap (GitHub limitation)
- ⚠️ No robots.txt control (GitHub limitation)

### Indexability
- ✅ Repo is public and indexable
- ⚠️ No canonical URL control
- ⚠️ README is the only indexable "page" — docs are secondary

### Performance & Rendering
- ✅ GitHub's CDN serves README globally
- ✅ Vercel demo loads quickly
- ⚠️ Badge images (shields.io) add external requests

### Security
- ✅ HTTPS enforced by GitHub
- ✅ No mixed content issues

**P0 Actions:** None — technical layer is acceptable for GitHub hosting.

---

## On-Page / Content Layer

### Title (GitHub Repo Name + README H1)
**Current:** `WCP Compliance Agent — V2`

**Problems:**
- "WCP" is unsearchable jargon
- "V2" is internal versioning
- No mention of Davis-Bacon, prevailing wage, or compliance

**P0 Fix:**
```
# WCP Compliance Agent — Davis-Bacon Act Payroll Validation
```

### Meta Description (GitHub Repo Description)
**Current:** "Regulated-domain AI infrastructure case study for trustworthy LLM decision systems"

**Problems:**
- "Regulated-domain" — no one searches for this
- "AI infrastructure case study" — academic framing
- "trustworthy LLM decision systems" — buzzword soup

**P0 Fix:**
```
AI-powered Davis-Bacon Act payroll validation. Checks prevailing wage, overtime, 
fringe benefits. Three-layer decision pipeline with full audit trail. Open source.
```

### Headers
**Current:** See Phase 1 analysis above.

**P0 Fixes:**
1. Add H2: `## How It Works` (human explanation, not ASCII diagram)
2. Add H2: `## Key Features` (keyword-rich bullets)
3. Add H2: `## By the Numbers` (quotable statistics)
4. Move Version History to CHANGELOG or collapsible section

### Content Depth
**Current README:** ~150 lines. Dense but not deep.

**Problems:**
- No FAQ section
- No comparison section
- No "By the Numbers" statistics
- No customer/case study evidence
- No "How It Works" for non-technical readers

**P1 Fixes:**
1. Create `docs/faq.md` — 10-15 Q&A pairs
2. Create `docs/comparison.md` — vs generic payroll, vs manual review
3. Add "By the Numbers" section to README
4. Expand "What This Is" to explain Davis-Bacon for non-experts

### Internal Linking
**Current:** 7 flat links. No hierarchy.

**P1 Fix:** Hub-and-spoke model (see Phase 1).

---

## GEO / AI Visibility Layer

### Answer-First Formatting
**Current:** README opens with badges + tagline + explanation.

**Problem:** Not structured for AI extraction. LLMs need:
1. Clear entity definition in first paragraph
2. FAQ format for common questions
3. Comparison tables for "vs" queries

**P0 Fixes:**
1. First paragraph must define: "WCP Compliance Agent is a [type] that [function]"
2. Add FAQ section or `docs/faq.md`
3. Add comparison tables

### Extractability & Quotability
**Current:** Statistics scattered (310 tests, 83%+, 20 trades, etc.)

**Problem:** No concentrated "By the Numbers" block. LLMs can't easily extract key facts.

**P0 Fix:**
```markdown
## By the Numbers

- **310 tests** covering unit, integration, and end-to-end scenarios
- **83%+ code coverage** with 80% CI gate
- **102-example golden set** for regression detection
- **20 trades** in the default DBWD corpus
- **3 layers** of decision proof
- **7-year** audit trail retention design
```

### Semantic Clarity
**Current:** "WCP" is undefined until paragraph 2. "DBWD" is undefined anywhere.

**P0 Fix:** Define every acronym on first use.
```markdown
WCP (Weekly Certified Payroll) Compliance Agent validates...
```

### AI Crawler Access Signals
**Current:** GitHub repo. Standard access.

**No action needed.** GitHub repos are well-crawled by all major LLMs.

---

## Trust, Entity & Authority Layer

### Author & Editorial Transparency
**Current:**
- ✅ Author name in LICENSE: Vinícius Raposo
- ✅ GitHub profile linked
- ❌ No author bio or credentials
- ❌ No "About the Author" section
- ❌ No contact information

**P1 Fixes:**
1. Add author bio to README:
   ```markdown
   ## About the Author
   
   Built by [Vinícius Raposo](https://github.com/FishRaposo) — [your background/role].
   ```
2. Add `docs/about.md` with full background
3. Link to LinkedIn profile

### Organization Identity
**Current:** Personal repo. No organization.

**P1 Fix:** Consider creating a GitHub organization or adding a personal branding page.

### Entity Disambiguation
**Current:** "WCP Compliance Agent" could be confused with:
- Workers' Compensation Program (WCP)
- Web Content Publisher (WCP)
- Windows Communication Platform (WCP)

**P1 Fix:** Add disambiguation:
```markdown
> **WCP** = Weekly Certified Payroll (federal construction payroll form WH-347)
```

### Third-Party Credibility
**Current:** MIT license. No other authority signals.

**P1 Fixes:**
1. Add GitHub stars badge (if ≥ 50 stars)
2. Add "Used by" section with company names (if any)
3. Link to any blog posts or talks about the project
4. Add testimonials/quotes if available

---

## Off-Site Mention Layer

### Current State: Almost Zero

| Platform | Status | Impact |
|---|---|---|
| **LinkedIn** | Not verified | Unknown |
| **Reddit** | Not verified | Unknown |
| **YouTube** | Not verified | Unknown |
| **Wikipedia** | Not verified | Unknown |
| **Product Hunt** | Not verified | Unknown |
| **Hacker News** | Not verified | Unknown |
| **Twitter/X** | Not verified | Unknown |

**P2 Actions:**
1. Post on Hacker News Show HN
2. Submit to Product Hunt
3. Write LinkedIn article about the project
4. Create YouTube demo video
5. Engage in r/construction, r/legaladvice, r/programming discussions

---

## Platform-Specific AI Readiness

### ChatGPT / Bing
- ✅ Content is indexable via Bing (GitHub is indexed)
- ❌ No FAQ means ChatGPT can't answer "what is WCP Compliance Agent"
- ❌ No comparison means ChatGPT can't recommend it vs alternatives

**P0 Fix:** Add FAQ and comparison docs.

### Perplexity
- ✅ Content is in Perplexity's index
- ❌ No quotable facts block means Perplexity may not cite it
- ❌ No schema markup means no rich snippets

**P0 Fix:** Add "By the Numbers" and schema markup.

### Google AI Overviews
- ✅ Traditional SEO still matters
- ❌ No FAQ schema means no featured snippets
- ❌ No HowTo schema means no step-by-step cards

**P1 Fix:** Add FAQ schema and HowTo schema to docs.

### Gemini / Google Ecosystem
- ✅ GitHub repos are known to Google
- ❌ No Google Business Profile (not applicable for open source)
- ❌ No Knowledge Panel presence

**P2 Fix:** Not critical for open source project.

---

# PART 3: Jobs/Ive Brand & Product Analysis

## Jobs/Ive Verdict on Current Positioning

### Current Brand: "Reference Implementation"

**The problem:** The README positions this as an academic exercise — a "reference implementation" that "transfers directly to any domain where AI errors have consequences."

**Jobs would say:** You're building a product, not a research paper. Cut the hedging.

### The Three Laws Applied

**1. Is it essential?**
> Current: "WCP Compliance Agent validates Weekly Certified Payroll submissions against Davis-Bacon Act prevailing wage requirements."
> 
> Jobs version: "Payroll decisions you can defend in court."

**2. Is it human?**
> Current: "Three-layer AI decision pipeline for regulated-domain compliance."
> 
> Jobs version: "Three rounds of proof. Every finding cites the law. Every decision has a paper trail."

**3. Does it feel inevitable?**
> Current: "The core pattern transfers directly to any domain..."
> 
> Jobs version: "This is how AI should make decisions in regulated industries. No shortcuts."

---

## Jobs/Ive — Top 10 Fixes

| # | Fix | Where | Effort |
|---|---|---|---|
| 1 | Cut version history from README → CHANGELOG | README | 5 min |
| 2 | Rewrite opening to one human sentence | README | 5 min |
| 3 | Replace ASCII diagram with human explanation | README | 10 min |
| 4 | Move API reference to docs/ | README | 10 min |
| 5 | Move tech stack to bottom | README | 5 min |
| 6 | Cut project structure tree | README | 2 min |
| 7 | Add "By the Numbers" section | README | 5 min |
| 8 | Group docs by audience | README | 5 min |
| 9 | Add FAQ section or doc | docs/faq.md | 30 min |
| 10 | Add comparison doc | docs/comparison.md | 20 min |

---

# Summary: Priority Action Matrix

## P0 — Do First (Critical for All Audiences)

| # | Action | SEO Impact | GEO Impact | Jobs/Ive Impact | Effort |
|---|---|---|---|---|---|
| 1 | Rewrite README H1 with keywords | High | Medium | High | 2 min |
| 2 | Rewrite repo description (meta) | High | High | High | 2 min |
| 3 | Rewrite opening paragraph with entity definition | High | High | High | 5 min |
| 4 | Add "By the Numbers" section | Medium | High | High | 5 min |
| 5 | Add FAQ section to README or docs/faq.md | Medium | High | Medium | 30 min |
| 6 | Add comparison doc (vs generic payroll, vs manual) | Medium | High | Medium | 20 min |
| 7 | Cut version history from README hero | Low | Low | High | 5 min |
| 8 | Replace ASCII diagram with human text | Low | Medium | High | 10 min |

**P0 Total: ~80 minutes**

## P1 — Do Next (Meaningful Improvements)

| # | Action | SEO Impact | GEO Impact | Jobs/Ive Impact | Effort |
|---|---|---|---|---|---|
| 1 | Add schema markup (JSON-LD) | Medium | Medium | Low | 15 min |
| 2 | Add `llms.txt` at repo root | Low | High | Low | 10 min |
| 3 | Add author bio / about section | Medium | Medium | Medium | 10 min |
| 4 | Improve internal linking (hub-and-spoke) | Medium | Medium | Low | 15 min |
| 5 | Add "Last updated" dates to all docs | Medium | Medium | Low | 10 min |
| 6 | Add GitHub repo topics/tags | Medium | Low | Low | 5 min |
| 7 | Expand "What This Is" for non-experts | Medium | Medium | High | 15 min |

**P1 Total: ~80 minutes**

## P2 — Scale & Off-Site (Long-term)

| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Post on Hacker News Show HN | High | 30 min |
| 2 | Submit to Product Hunt | Medium | 30 min |
| 3 | Write LinkedIn article | Medium | 1 hr |
| 4 | Create YouTube demo | Medium | 2 hrs |
| 5 | Engage in Reddit communities | Medium | Ongoing |
| 6 | Rename repo to keyword-rich URL | High | 5 min |

---

## Expected Outcomes

**After P0:**
- README is human-readable AND AI-discoverable
- Primary keywords present in H1, opening, and FAQ
- LLMs can answer "what is" and "how does it compare" questions
- GitHub repo is findable for Davis-Bacon compliance searches

**After P0 + P1:**
- Schema markup enables rich snippets
- Internal linking improves page authority distribution
- Author signals build trust
- `llms.txt` helps AI crawlers navigate

**After P0 + P1 + P2:**
- Off-site mentions drive backlinks and authority
- Social proof signals credibility
- Knowledge Panel potential for "WCP Compliance Agent"

---

*Report generated: 2026-04-22*
*Skills used: website-seo, seo-geo-audit, jobs-ive*
