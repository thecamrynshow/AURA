# SEO & Teacher Resource Content System

Companion to `docs/PROJECT-LOG.md`. Technical reference for PNEUOMA's static SEO content pipeline.

---

## Overview

| Layer | Path | Count | Generator |
|-------|------|-------|-----------|
| Resource hub | `/resources/index.html` | 1 | Manual |
| Problem articles | `/resources/*.html` | 31 articles | `generate-resource-cluster.js` (+ 11 legacy hand-written) |
| Interactive play | `/resources/play/*.html` | 10 + hub | `generate-interactive-resources.js` |
| **Sitemap total** | `sitemap.xml` | **122 URLs** | `npm run sitemap` |

---

## Phase 1 — Problem-based articles

**Shipped:** `90ce2c3` (June 2026)

**Data:** `scripts/resource-cluster-data.js`  
**Generator:** `scripts/generate-resource-cluster.js`  
**Pattern:** `resources/RESOURCE_PAGE_PATTERN.md`

### Hub categories

1. Breathing & Reset Routines  
2. Classroom Transitions  
3. SEL & Emotional Regulation  
4. Focus & Attention  
5. Teacher Scripts  
6. Platform & Tools  

### Regenerate

```bash
node scripts/generate-resource-cluster.js
npm run sitemap
```

---

## Phase 2 — Interactive play pages

**Shipped:** `18a098f` (June 2026)

**Data:** `scripts/interactive-resource-data.js`  
**Generator:** `scripts/generate-interactive-resources.js`  
**Tracker:** `resource-play.js`

### Page pattern

1. Problem (hero + section)  
2. Explanation  
3. Embedded game (lazy iframe on Launch)  
4. Teacher instructions + script  
5. Classroom adaptation  
6. CTA band  

### Game pairings

See full table in `docs/PROJECT-LOG.md` § Phase 2.

### GA4 events (register in GA4 admin)

| Event | Trigger |
|-------|---------|
| `resource_game_start` | Launch button clicked |
| `resource_game_time_spent` | Every 30s + page hide (`engagement_time_sec`) |
| `resource_toolkit_click` | Toolkit CTA |
| `resource_classroom_sync_click` | Classroom Sync CTA |
| `resource_pilot_click` | School pilot CTA |

### Regenerate

```bash
node scripts/generate-interactive-resources.js
npm run sitemap
```

---

## Content rules

- School-safe language; no medical claims  
- No fabricated statistics  
- No thin/duplicate pages  
- Approved disclaimer on every resource page  
- ADHD/anxiety pages: **support** language, not treatment language  

---

## Phase 3 — Backlog (not built)

Suggested next URLs (add to `resource-cluster-data.js`):

- `/resources/box-breathing-for-students.html`  
- `/resources/whole-class-breathing-routine.html`  
- `/resources/solfege-warm-ups-elementary-music.html`  
- `/resources/autism-friendly-regulation-activities.html`  
- `/resources/middle-school-regulation-activities.html`  
- … (full list of 30 in project chat / expand data file)

---

## CI

`.github/workflows/sitemap.yml` — auto-commits `sitemap.xml` on HTML changes.

`.github/workflows/` does not build pages; GitHub Pages serves static files from `main`.

---

*See also: `docs/PROJECT-LOG.md`, `resources/RESOURCE_PAGE_PATTERN.md`*
