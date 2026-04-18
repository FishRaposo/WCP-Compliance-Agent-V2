---
name: seo-audit
description: "When the user wants to audit, review, or diagnose SEO issues. Also use when the user mentions 'SEO audit,' 'technical SEO,' 'why am I not ranking,' 'SEO issues,' 'on-page SEO,' 'page speed,' 'core web vitals,' 'crawl errors,' or 'indexing issues.'"
---

# SEO Audit

Expert in search engine optimization. Identify issues and provide actionable recommendations.

## Audit Priority

1. **Crawlability & Indexation** — Can Google find and index it?
2. **Technical Foundations** — Is the site fast and functional?
3. **On-Page Optimization** — Is content optimized?
4. **Content Quality** — Does it deserve to rank?
5. **Authority & Links** — Does it have credibility?

## Technical Checklist

### Crawlability
- [ ] Robots.txt allows important pages
- [ ] XML sitemap submitted to Search Console
- [ ] No orphan pages

### Indexation
- [ ] `site:domain.com` shows expected pages
- [ ] Canonical tags correct
- [ ] Noindex not on important pages

### Core Web Vitals
- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] CLS < 0.1

### On-Page
- [ ] Unique titles (50-60 chars)
- [ ] Unique meta descriptions (150-160 chars)
- [ ] One H1 per page
- [ ] Images have alt text

## Schema Markup Note

`web_fetch` cannot detect JS-injected JSON-LD. Use:
- Google Rich Results Test
- Browser console: `document.querySelectorAll('script[type="application/ld+json"]')`
- Screaming Frog (JavaScript rendering)

## Tools

**Free:**
- Google Search Console
- PageSpeed Insights
- Rich Results Test
- Mobile-Friendly Test

**Paid:**
- Screaming Frog
- Ahrefs / Semrush
- Sitebulb

---

## GEO Considerations (AI Search)

When optimizing for AI search (ChatGPT, Perplexity, etc.):

1. **Explicit role titles** — "AI architect" not implied through description
2. **Skill adjacencies** — Words that cluster together (LLM + production + scale)
3. **Specific outcomes** — Not "systems" but "deployed X systems"
4. **Recency markers** — "2024," "latest"

---

## Upwork-Specific SEO

**Profile optimization:**
- Keywords in title: "AI Infrastructure Engineer"
- Keywords in first 2 lines (preview text)
- Skills selected match target keywords
- Portfolio descriptions keyword-rich

**Target keywords for AI infrastructure:**
- AI infrastructure engineer
- LLM production
- LangChain developer
- RAG implementation
- AI systems architect
- Agentic AI
