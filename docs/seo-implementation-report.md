# SEO implementation report — October 16, 2026

## Changes completed

- Audited the static site, sitemap generator, robots file, canonicals, GA4 snippet, and inquiry API.
- Added five enterprise service pages that use the existing corporate design and the existing inquiry form.
- Normalized `index.html` addresses in the browser on the homepage, Solfege, Aura, the games catalog, Classroom Sync, and the new service pages. Canonical tags remain the durable signal. GitHub Pages cannot send a 301 from `/index.html` to `/` because they are the same file.
- Rewrote `robots.txt` and marked two auth utility pages `noindex`.
- Regenerated `sitemap.xml` so the new pages are included and the utility pages are not.
- Counted an inquiry only after the server returns `accepted: true`.
- Added founder `Person` structured data on the About page and `Service` plus `BreadcrumbList` data on the new pages.
- Pointed the games catalog Partner link at `/#partners` and linked Classroom Sync from the games hero.

## Files changed

- `robots.txt`
- `sitemap.xml`
- `scripts/generate-sitemap.js`
- `corporate.js`
- `auth/auth.js`
- `index.html`
- `platform/enterprise/index.html`
- `platform/about/index.html`
- `platform/games/index.html`
- `platform/multiplayer/classroom-sync/index.html`
- `games/solfege/index.html`
- `games/aura/index.html`
- `auth/success.html`
- `auth/forgot-password.html`
- `solutions/enterprise-ai/index.html`
- `solutions/private-llm/index.html`
- `solutions/legal-ai/index.html`
- `solutions/custom-software/index.html`
- `solutions/workflow-automation/index.html`
- `docs/seo-audit-2026.md`
- `docs/seo-keyword-map.md`
- `docs/search-console-setup.md`
- `docs/seo-implementation-report.md`

## Pages created

- `/solutions/enterprise-ai/`
- `/solutions/private-llm/`
- `/solutions/legal-ai/`
- `/solutions/custom-software/`
- `/solutions/workflow-automation/`

## Redirects

No HTTP redirect was added. GitHub Pages, with `.nojekyll`, does not provide a redirect map. Equivalent `index.html` URLs keep the canonical directory URL, and a `history.replaceState` runs before GA4 so Analytics is less likely to split the hit. Campaign query parameters and hashes are preserved.

## Metadata and structured data

Each new page has a unique title, description, canonical URL, Open Graph tags, and a Twitter card. JSON-LD on those pages is a `BreadcrumbList` and a `Service`. About gained a `Person` record for Camryn Jackson using only the public biography. No reviews, ratings, or customer counts were added.

## Analytics events

Existing property: `G-TQGSNCV7Q2`. No second property was installed.

| Event | When it fires |
|---|---|
| `project_inquiry_start` | First focus inside an inquiry form |
| `project_inquiry_submit` | Server accepts a project inquiry |
| `partner_inquiry_submit` | Server accepts a partner inquiry (`data-source` contains `partner`) |
| `enterprise_cta_click` | Click on an enterprise call to action that declares it |
| `product_outbound_click` | Click on an `http` or `https` link to another host. Parameter is the hostname only |
| `signup_start` | Account signup request begins |
| `signup_complete` | Signup response is successful, before the redirect |

Event parameters are `page_path` and, where needed, a short `label` or hostname. Form text, email, and name are not sent.

The old `demo_request_submit` click on the inquiry button was removed so a click is not a completed inquiry.

## Inquiry workflow

`POST /api/inquiries` on the existing Render service validates the fields, rejects the honeypot, rate-limits by IP, and stores the row. Success UI requires `accepted: true`. Failure keeps the typed values and shows an email link. There is still no outbound mailer. Storage is SQLite, which on Render’s default disk is ephemeral unless `SQLITE_DB_PATH` points at a persistent disk.

## Tests executed

- `node --check` on `corporate.js` and `auth/auth.js`.
- `npm run sitemap` via `node scripts/generate-sitemap.js`. It wrote 140 URLs. The five solution URLs are present. `index.html` duplicate locs and the auth utility URLs are absent.
- JSON-LD on the homepage and the five service pages parses.
- Browser smoke on a local static server:
  - `/index.html` became `/` before the page settled.
  - `/games/solfege/index.html?ref=test` became `/games/solfege/?ref=test`.
  - `/solutions/legal-ai/` rendered the expected heading and canonical URL, with no horizontal overflow at 390px.
  - A custom-software inquiry pointed at a closed port kept the typed description, showed the email fallback, fired `project_inquiry_start` once, and did not fire `project_inquiry_submit`.
  - The games catalog returned 200 and linked Classroom Sync.

Field Core Web Vitals, GA4 DebugView, and Search Console coverage were not available in this environment.

## Outstanding dependencies

- Publish this branch to `main` before GitHub Pages will serve the new URLs.
- Search Console verification and sitemap submission, described in `docs/search-console-setup.md`.
- Confirm in GA4 DebugView that the new events arrive once. That requires the GA4 interface.
- A persistent disk for inquiry rows, if inquiries must survive a Render deploy.
- An email notification when an inquiry is stored, if the founder should not have to read the database. No provider was added.

## Deployment

Do not treat this branch as live. GitHub Pages deploys only `main`. The Render API already has the inquiry route from the earlier publish.

## Measurement plan

### 30 days

Confirm the new URLs are indexed, the sitemap is read, `/index.html` hits decline relative to `/`, and inquiry events appear only on accepted submissions. Fix any coverage errors before writing more pages.

### 60 days

Read Search Console impressions and landing pages for the enterprise URLs and for the existing games and resource URLs. Compare engagement on `/` with the September–October 2026 observation (23 active users, 15 seconds) without assuming that baseline is still current.

### 90 days

Compare organic landing pages and accepted inquiries with the earlier period. Keep pages that earn impressions or inquiries. Do not expect a ranking or a traffic number from this work.
