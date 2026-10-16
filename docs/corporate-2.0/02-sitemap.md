# Revised sitemap — information architecture

This is the planned public map. It does not add or remove production URLs. Every URL below that already exists stays. Proposed URLs are marked and are not part of the homepage review.

## Keep, unchanged

```
/                                   homepage (content changes on the review branch only)
/platform/games/
/platform/apps/
/platform/rituals/
/platform/rituals/*
/platform/multiplayer/
/platform/multiplayer/classroom-sync/
/platform/multiplayer/*
/platform/create/
/platform/create/*
/platform/companions/
/platform/companions/*
/platform/labs/
/platform/labs/*
/platform/schools/
/platform/schools/pilot-program.html
/platform/about/
/platform/tech/
/games/*
/resources/
/resources/*
/resources/play/*
/toolkit/
/auth/login.html
/auth/signup.html
/auth/subscribe.html
/privacy.html
/privacy/the-house/
/privacy/the-campaigne/
/pitch-deck/
/schedule/
```

Canonicals, the sitemap generator, and `robots.txt` stay as they are until a later approved pass. Homepage canonical remains `https://pneuoma.com/`.

## Homepage sections (this review)

The homepage is one URL. Sections are anchors, not new routes.

| Order | Anchor | Contents |
|---|---|---|
| 1 | hero | Tagline, supporting line, Explore Technology, Work With Us |
| 2 | `#capabilities` | Software, AI, Games, Regulation Systems |
| 3 | `#products` | Featured products plus a directory of the rest |
| 4 | `#solutions` | Education, Enterprise, Professional Services, Creators |
| 5 | `#research` | Labs |
| 6 | `#milestones` | Verified launches, the Pattengill pilot, membership |
| 7 | `#partners` | Partnership and custom development inquiry |
| 8 | `#company` | Company facts and footer |

## Navigation

| Primary | Destination now | Later, if approved |
|---|---|---|
| Products | `#products` and the existing product URLs | A `/products/` index that groups by audience |
| Solutions | `#solutions` | `/solutions/education/`, `/solutions/enterprise/`, `/solutions/professional-services/`, `/solutions/creators/` |
| Research & Labs | `/platform/labs/` | Keep the labs URLs; add a research index only if there is real research to publish |
| Company | `#company` and `/platform/about/` | Keep `/platform/about/` |
| Partners | `#partners` | Keep the homepage inquiry; do not invent a CRM page |

Secondary: Sign In → `/auth/login.html`. Contact / Partner With Us → `#partners`.

Games, Apps, Rituals, Classroom Sync, Multiplayer, Create, and Tech stay linked in the Products menu and in a visible link row. They are not removed from the homepage.

## Product URLs by audience

These are existing destinations. They are not one application.

| Product | Audience | URL | Status used on the homepage |
|---|---|---|---|
| Classroom Sync | Teachers | `/platform/multiplayer/classroom-sync/` | Live in the browser |
| Regulation games, including Solfège | Players, teachers, families | `/platform/games/`, `/games/solfege/` | Live. Free tier is 3 sessions/day |
| Rituals | Same | `/platform/rituals/` | Live |
| Apps catalog | Mobile | `/platform/apps/` | Catalog page exists. Store status not re-verified |
| Dean OS | Deans of students | `https://dean-os.pneuoma.com` | Live, sign-in required |
| Capture | Staff documenting incidents | `https://capture.pneuoma.com` | Live, sign-in required |
| ISS | In-school suspension staff | `https://iss.pneuoma.com` | Live URL, separate product |
| Pilot Engine | People running education pilots | `https://pilot-engine.vercel.app` | Live URL, separate product |
| Capital Engine | Founders | `https://capitalengine.pneuoma.com` | Live URL, separate product |
| Campaigne Visualizer | Creators | `https://visualizer.pneuoma.com` | Public homepage |
| Game Studios | Studio | `https://games.pneuoma.com` | The Campaigne is in development |
| Discovery | Internal | `https://discovery.pneuoma.com` | Private sign-in. Not a public demo |
| Labs | Research visitors | `/platform/labs/` | Exploratory modules |

## Explicitly not in this revision

No redirects. No deleted resource pages. No new solution routes. `sitemap.xml` is not rewritten, because the URL set did not change.
