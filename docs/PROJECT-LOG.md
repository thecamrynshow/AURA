# PNEUOMA Project Log

**Purpose:** Running record of shipped work, architecture decisions, production state, and where to pick up next. Update this file when meaningful work lands on `main`.

**Last updated:** June 15, 2026  
**Production:** [pneuoma.com](https://pneuoma.com) (GitHub Pages) · API [pneuoma.onrender.com](https://pneuoma.onrender.com) (Render)

---

## Where we left off (June 2026)

| Area | Status |
|------|--------|
| **Paid membership / Stripe** | Live. SQLite persistence, webhook verification, server-side entitlement, checkout hardened. Real trial tested successfully. |
| **SEO Phase 1** | Shipped — 20 problem-based teacher resource articles under `/resources/`. |
| **SEO Phase 2** | Shipped — 10 interactive play landing pages under `/resources/play/` with embedded games + GA tracking. |
| **Sitemap** | **122 URLs** auto-maintained via `npm run sitemap` + GitHub Actions. |
| **Pattengill pilot** | Case study doc complete; public homepage quote corrected (`990e504`). |
| **Not committed** | `server/package-lock.json` engines drift (`node: 22.x`) — local only, exclude unless intentional. |

### Suggested next work (not started)

1. **SEO Phase 3** — Next 30 problem pages (see list at end of Phase 1 handoff in chat / expand `scripts/resource-cluster-data.js`).
2. **GA4 custom definitions** — Register `resource_game_start`, `resource_game_time_spent`, `resource_toolkit_click`, `resource_classroom_sync_click`, `resource_pilot_click` in GA4 UI.
3. **Focus game embed** — Premium gate inside iframe on `/resources/play/focus-game.html`; consider SEO preview mode or clearer upgrade path.
4. **School pilot outreach** — Use `docs/school-outreach-templates.md` + Pattengill case study.
5. **`POST /api/leads`** — Wire `window.PNEUOMA_LEADS_ENDPOINT` on toolkit/resource pages for server-side lead capture (endpoint exists on Render).

---

## Commit timeline (recent `main`)

| Commit | Summary |
|--------|---------|
| `990e504` | fix: correct Mrs. Gill pilot testimonial wording |
| `18a098f` | feat: add interactive regulation game resource cluster (Phase 2) |
| `90ce2c3` | feat: add classroom regulation SEO resource cluster (Phase 1) |
| `9c7fa76` | fix: handle expired checkout sessions gracefully |
| `9caa123` | fix: confirm premium status before success page entitlement |
| `8f14ad8` | chore: pin server node runtime for native sqlite build |
| `20ec9be` | feat: harden paid membership persistence and Stripe webhooks |

---

## 1. Production membership & payments (May–June 2026)

### What shipped

- **`server/db.js`** — SQLite (`better-sqlite3`): users, subscriptions, leads.
- **`server/index.js`** — DB-backed auth, Stripe checkout metadata, raw-body webhook with signature verification, `POST /api/leads`, locked `POST /api/auth/subscription` (403).
- **`GET /api/me/subscription`** — Authoritative entitlement (DB + optional Stripe refresh).
- **Frontend gating** — `auth/auth.js`, `auth/protect.js`, `platform/games/game-gating.js` confirm premium via authenticated endpoint (no client master password).
- **`auth/success.html`** — Waits for server-confirmed `isPremium` before showing entitlement.
- **`auth/subscribe.html`** — Requires valid token; redirects stale sessions to login; only calls checkout when `sessionId` exists.

### Production URLs

| Service | URL |
|---------|-----|
| Site | https://pneuoma.com |
| API | https://pneuoma.onrender.com |
| Stripe webhook | https://pneuoma.onrender.com/api/stripe/webhook |
| Checkout success | `/auth/success.html` |
| Subscribe | `/auth/subscribe.html` |

### Env vars (Render)

Documented in `server/README.md`. Critical: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `DATABASE_PATH`, price IDs matching `auth/subscribe.html`.

### Node version

Server pinned to **Node 22.x** for `better-sqlite3` on Render (`8f14ad8`).

---

## 2. SEO content system

### Architecture

- **Static HTML only** — no framework, no build step (except sitemap).
- **GitHub Pages compatible** — root-relative paths, `conversion.css` / `conversion.js`.
- **Two generators:**
  - `scripts/generate-resource-cluster.js` + `scripts/resource-cluster-data.js` → `/resources/*.html`
  - `scripts/generate-interactive-resources.js` + `scripts/interactive-resource-data.js` → `/resources/play/*.html`
- **Pattern docs:** `resources/RESOURCE_PAGE_PATTERN.md`
- **Sitemap:** `npm run sitemap` → `sitemap.xml` (122 URLs as of June 2026)
- **CI:** `.github/workflows/sitemap.yml` regenerates on HTML changes + weekly

### Phase 1 — Problem-based articles (20 pages)

**Commit:** `90ce2c3` · **Hub:** [/resources/](https://pneuoma.com/resources/)

Categories on hub: Breathing & Reset, Classroom Transitions, SEL & Emotional Regulation, Focus & Attention, Teacher Scripts, Platform & Tools.

| Slug | Title |
|------|-------|
| `how-to-calm-classroom-after-recess` | How to Calm a Classroom After Recess |
| `breathing-exercises-kindergarten` | Breathing Exercises for Kindergarten |
| `sel-activities-elementary-students` | SEL Activities for Elementary Students |
| `classroom-transition-games` | Classroom Transition Games |
| `emotional-regulation-activities-students` | Emotional Regulation Activities for Students |
| `nervous-system-reset-activities` | Nervous System Reset Activities |
| `co-regulation-activities-children` | Co-Regulation Activities for Children |
| `self-regulation-games-adhd-students` | Self-Regulation Games for ADHD Students |
| `grounding-games-elementary-classrooms` | Grounding Games for Elementary Classrooms |
| `morning-meeting-regulation-activities` | Morning Meeting Regulation Activities |
| `calm-down-corner-activities` | Calm Down Corner Activities |
| `breathing-games-for-kids` | Breathing Games for Kids |
| `classroom-brain-breaks-regulation` | Classroom Brain Breaks for Regulation |
| `test-anxiety-breathing-exercises-students` | Test Anxiety Breathing Exercises for Students |
| `after-lunch-classroom-reset` | After Lunch Classroom Reset |
| `quiet-line-up-games` | Quiet Line-Up Games |
| `indoor-recess-calm-down-activities` | Indoor Recess Calm Down Activities |
| `teacher-breathing-scripts` | Teacher Breathing Scripts |
| `whole-class-calming-strategies` | Whole-Class Calming Strategies |
| `quick-regulation-activities-5-minutes` | Quick Regulation Activities (5 Min or Less) |

**Plus 11 pre-existing resource articles** (e.g. `classroom-breathing-games`, `classroom-sync`, `adhd-regulation-activities`, …).

**Approved disclaimer (all resource pages):**  
*PNEUOMA is an educational regulation support tool. It does not diagnose, treat, cure, or prevent medical or behavioral conditions.*

### Phase 2 — Interactive play pages (10 pages)

**Commit:** `18a098f` · **Hub:** [/resources/play/](https://pneuoma.com/resources/play/)

| Slug | Paired game |
|------|-------------|
| `box-breathing-game` | [/games/reset/](https://pneuoma.com/games/reset/) |
| `balloon-breathing-game` | [/games/cloudkeeper/](https://pneuoma.com/games/cloudkeeper/) |
| `grounding-game` | [/games/anchor/](https://pneuoma.com/games/anchor/) |
| `focus-game` | [/games/focus/](https://pneuoma.com/games/focus/) (premium) |
| `nervous-system-reset-game` | [/games/deep/](https://pneuoma.com/games/deep/) |
| `classroom-sync-demo` | [/platform/multiplayer/classroom-sync/](https://pneuoma.com/platform/multiplayer/classroom-sync/) |
| `solfege-trainer` | [/games/solfege/](https://pneuoma.com/games/solfege/) |
| `pitch-match-game` | [/games/songbird/](https://pneuoma.com/games/songbird/) |
| `rhythm-regulation-game` | [/games/pulse/](https://pneuoma.com/games/pulse/) |
| `calm-down-countdown` | [/games/chill/](https://pneuoma.com/games/chill/) |

**Tracking:** `resource-play.js`  
Events: `resource_game_start`, `resource_game_time_spent`, `resource_toolkit_click`, `resource_classroom_sync_click`, `resource_pilot_click`

**Embed pattern:** Lazy iframe on “Launch” click; `?embed=1` query on game URL.

### Conversion layer (sitewide)

| File | Role |
|------|------|
| `conversion.js` | GA4 helper, CTA injection, email capture |
| `conversion.css` | Resource hero, articles, CTAs, game embed styles |
| `resource-play.js` | Play-page game + engagement events |

---

## 3. Pattengill kindergarten pilot

**Full case study:** `docs/pilot-pattengill-kindergarten-2026.md`

### Public-facing quote (homepage + classroom-sync resource)

Used on `index.html` and `resources/classroom-sync.html` since `990e504`:

> Absolutely helps, very effective. I'll keep doing it daily during transitions.

— **Mrs. Gill**, Kindergarten Teacher, Pattengill Elementary, Lansing MI

### Independent-use finding (not in quote)

Carried in pilot findings card on homepage:

- *Teacher initiated transitions without founder facilitation*
- *During the pilot, the teacher initiated a transition routine without founder facilitation.*

### Verbatim source quote (internal / case study only)

Full May 21 teacher statement remains in `docs/pilot-pattengill-kindergarten-2026.md` (includes “I don't need [Camryn] anymore—I can do it myself…”).

---

## 4. Key file map

```
auth/                    Login, signup, subscribe, success, protect.js
server/                  Express API, db.js, Stripe, webhooks
resources/               SEO articles + index hub
resources/play/          Interactive game landing pages
scripts/
  generate-resource-cluster.js
  resource-cluster-data.js
  generate-interactive-resources.js
  interactive-resource-data.js
  generate-sitemap.js
conversion.js            Sitewide conversion + GA
resource-play.js         Play page engagement GA
docs/
  PROJECT-LOG.md         ← this file
  pilot-pattengill-kindergarten-2026.md
```

---

## 5. Validation checklist (after content deploys)

1. `npm run sitemap` — confirm URL count
2. Spot-check new pages return 200 on production
3. JSON-LD parses on resource articles
4. Play page: Launch → iframe loads; CTAs → toolkit / sync / pilot (no accidental checkout)
5. GitHub Actions: `pages build and deployment` + `Regenerate sitemap` succeed

---

## 6. How to update this log

When shipping meaningful work:

1. Add a row to **Commit timeline**
2. Update **Where we left off**
3. Add a section or bullet under the relevant area (SEO, payments, pilot, etc.)
4. If adding resource pages, update tables and re-run `npm run sitemap`

---

*Maintainer: Camryn Jackson · camrynjackson@pneuoma.com*
