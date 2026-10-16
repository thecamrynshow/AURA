# PNEUOMA SEO audit — October 2026

This audit is based on the repository and the published GitHub Pages site. It does not include live Google Search Console query data. The September 18–October 15, 2026 Analytics figures in the assignment are historical observations and are not stored in the site.

## Architecture

| Piece | What it is |
|---|---|
| Corporate site and games | Static HTML, CSS, and JavaScript in this repository |
| Hosting | GitHub Pages from the `main` branch root, custom domain `pneuoma.com` |
| API | Separate Render service at `https://pneuoma.onrender.com` (`server/`) |
| Analytics | One GA4 property, `G-TQGSNCV7Q2`, loaded in page heads |
| Inquiry storage | `POST /api/inquiries` on the Render service |

Changing this repository does not change Dean OS, ISS, Capture, Visualizer, Capital Engine, Pilot Engine, or Game Studios. Those are separate sites.

## Strengths

- The homepage, enterprise page, games, and many resource pages already have unique titles, descriptions, and canonical URLs.
- `scripts/generate-sitemap.js` builds `sitemap.xml` from HTML files, skips `noindex`, and emits directory URLs instead of `index.html`.
- `robots.txt` points at the sitemap.
- Classroom Sync, Solfege, Aura, and the emotional-regulation resource are real, indexable pages and already cross-link.
- Project inquiries are stored by the server. The page says “Received” only after `accepted: true`. A mailto link is the failure fallback, not a counted conversion.
- Discovery Engine is not linked as a public product. It is a private founder tool.

## Findings

| Issue | Risk | Status |
|---|---|---|
| `/` and `/index.html`, and `/games/solfege/` and `/games/solfege/index.html`, are the same file on GitHub Pages | Duplicate URLs in Analytics | Canonical tags name the directory URL. A script rewrites `index.html` in the address bar before GA4 configures, and keeps query and hash. A real HTTP 301 is not available on this host. Flagged, not faked. |
| `robots.txt` described the company only as breathing games and listed hoped-for keywords | Misleading crawler file; `Crawl-delay` is ignored by Google | Replaced with a short allow-all file, two utility disallows, and the sitemap |
| `/auth/success.html` and `/auth/forgot-password.html` could be crawled | Utility URLs as landing pages | `noindex` added. Sitemap generator skips them. This is not an access control. |
| Enterprise services had one page, `/platform/enterprise/` | Distinct search intents had nowhere to land | Five service pages added under `/solutions/` |
| Inquiry submit buttons used `demo_request_submit` on click | A click was countable before the server accepted | Click event removed. `project_inquiry_submit` and `partner_inquiry_submit` fire only after acceptance. |
| Games nav logo pointed at `index.html`, and Partner pointed at `#partner` | Duplicate URL and a dead anchor | Logo points at `/`. Partner points at `/#partners`. |
| Search Console verification is not in the repository | Cannot inspect live queries from here | Steps are in `docs/search-console-setup.md` |
| No authenticated Search Console or GA4 API access | Cannot confirm current rankings or that events arrived in GA4 | Not claimed |

## Not changed on purpose

- Game routes, classroom resources, and regulation pages stay indexable.
- Schools and resource copy that serves existing organic traffic was not rewritten into enterprise copy.
- No paid SEO tool, email provider, or new Analytics property was added.
- DNS was not touched.

## Implementation status

Safe changes from this audit are in the branch that contains this file. They are not on `main` until that branch is published.
