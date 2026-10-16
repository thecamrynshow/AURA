# Implementation plan

## This review (branch `cursor/corporate-homepage-b0a0`)

Done here:

1. Audit, sitemap, architecture, content inventory, and this plan in `docs/corporate-2.0/`.
2. Homepage redesign at `/` on this branch only: new section order, navigation, real screenshots, honest inquiry, GA4 events through the existing `data-pc-event` binder.
3. No merge to `main`. No change to `CNAME`, GitHub Pages, Render, Stripe, `robots.txt`, or the sitemap URL set.

`index.html` on this branch replaces the homepage document so the review is the real page, not a side URL. Production `main` keeps the current homepage until this is explicitly approved. Other routes are untouched.

## Review checklist

- Desktop, tablet, and a 390px-wide phone: nav, hero, four pillars, four featured products, solutions, labs, milestones, inquiry, footer.
- Keyboard: skip link, Products disclosure, focus ring, form.
- `prefers-reduced-motion`: inherited from `styles.css`.
- Inquiry status text does not claim a message was delivered when it only opened mail.
- No new clinical, certification, or customer claims.
- Games, Apps, Rituals, and Classroom Sync are reachable without hunting.

## After approval, in later branches

1. Ship the homepage to `main` only when asked. GitHub Pages will publish it. Expect the title change to alter the homepage search snippet. Resource URLs stay indexed.
2. Extract the nav into one snippet and apply it to platform, game, and resource pages. Until then, inner pages keep their current menus.
3. Product pages for Dean OS, Capture, ISS, Pilot Engine, Capital Engine, and Visualizer using the architecture template. Screenshots only from those products. Discovery stays unlisted as a public demo until there is a public screen.
4. Solution pages only with offers that exist. Education can point at Classroom Sync, the toolkit, and the pilot request. Enterprise is a custom-build inquiry, not a customer story.
5. Fix `main.js` so leftover partner forms cannot show a false “sent” state.
6. Re-verify App Store listings before repeating them.
7. Add a shared skip link and focus style to `styles.css` once inner pages are in scope.
8. Register the new GA4 event names in the GA4 interface. The site already sends them.

## Out of scope until a separate decision

Redirects, deleting the classroom homepage copy from history, changing canonicals, removing resource pages, inventing case studies, and a visual rebrand beyond the current dark, teal, serif system.
