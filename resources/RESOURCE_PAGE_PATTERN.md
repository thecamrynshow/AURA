# PNEUOMA Resource Page Pattern

Static problem-based SEO pages for teachers. Generated from `scripts/resource-cluster-data.js` via `node scripts/generate-resource-cluster.js`.

## Required sections (in order)

1. **SEO** — `<title>`, `meta description`, `canonical`, Open Graph tags
2. **Hero** — eyebrow, H1, short direct answer (`pc-res-lede`)
3. **Classroom use case** — when teachers need this
4. **Step-by-step routine** — ordered list
5. **Teacher script** — read-aloud copy in `pc-callout`
6. **Age/grade adaptations** — K–2, 3–5, 6+ as needed
7. **Common mistakes** — bullet list
8. **When to use** — timing guidance
9. **PNEUOMA mention** — optional support tool, not medical claim
10. **CTA band** — Toolkit, Classroom Sync, School Pilot (`data-pc-event` tracking)
11. **Resource nav** — Hub, Platform, Classroom Sync, Start Free
12. **Related articles** — 4 internal links
13. **FAQ** — 3+ questions + matching JSON-LD `FAQPage`
14. **Disclaimer** — approved educational-support language

## Do not include

- Fabricated statistics or study citations
- Diagnose / treat / cure language (except approved disclaimer)
- Thin duplicate content across pages

## Regenerate cluster

```bash
node scripts/generate-resource-cluster.js
npm run sitemap
```
