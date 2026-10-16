# Page and component architecture

The site has no component framework. “Components” here means markup patterns and stylesheets that can be copied until a shared include exists.

## Constraint

`styles.css` is global. The redesign must not restyle `.hero`, `.platform-grid`, or other homepage classes that other pages do not use, and it must not change token values. New layout lives in `corporate.css` under `body.corporate` and `c-` classes. Tokens, `.btn`, `.nav`, and the reduced-motion rule come from `styles.css`.

## Homepage files

| File | Role |
|---|---|
| `index.html` | Document, metadata, sections, JSON-LD |
| `corporate.css` | Layout, navigation disclosure, cards, forms, breakpoints |
| `corporate.js` | Mobile nav, honest inquiry submit |
| `assets/corporate/*.png` | Screenshots taken from the live products |

Scripts kept from production: gtag, `auth/auth.js` (sign-in state), `conversion.js` (`data-pc-event`), Discovery scripts, and the existing leads endpoint variable. `main.js` is not loaded. Its partner handler reports success without sending the inquiry.

## Patterns

**Primary nav.** Five text items plus Sign In and Contact. Products is a `<details>` menu so it works with a keyboard and without a hover-only script. Games, Apps, Rituals, Classroom Sync, Multiplayer, Create, Companions, and Tech are inside it and repeated as a visible link row.

**Capability pillar.** Eyebrow, name, one paragraph tied to real products.

**Featured product.** Screenshot with alt text, name, category, problem, users, capabilities, availability, access note, and one CTA with a `data-pc-event`.

**Directory row.** Name, one line, status, link. No invented screenshot.

**Solution card.** Audience, what exists today, link to a real page or the inquiry form.

**Milestone.** Date only when the repo or the live product states it. No metric that was not published.

**Inquiry.** Named fields, visible labels, `aria-live` status. Email can be posted to `/api/leads`. The message body is not stored by that API, so the form also opens a mailto to `camrynjackson@pneuoma.com` and says so. It never says the message was sent unless that is true.

## Breakpoints

- Desktop: featured product is image plus text. Pillars and solutions are four columns, wrapping to two under 1100px.
- Tablet: two-column pillars, solutions, and directory.
- Mobile: one column. Nav becomes the existing drawer (`.nav-toggle`, `.nav-links.open`).

## Accessibility

- Skip link, one `h1`, section `h2`s, landmark `header` / `main` / `footer`.
- Visible form labels. Buttons and links have text.
- `:focus-visible` outline in teal.
- Screenshots have width, height, and alt text. Decorative background is `aria-hidden`.
- `prefers-reduced-motion` is already global in `styles.css`.

## Analytics events added on the homepage

Existing binder in `conversion.js` picks these up. No new analytics vendor.

| Event | Control |
|---|---|
| `cta_explore_technology_click` | Hero, Explore Technology |
| `cta_work_with_us_click` | Hero and other Work With Us links |
| `cta_product_classroom_sync` | Featured Classroom Sync |
| `cta_product_solfege` | Featured Solfège |
| `cta_product_visualizer` | Featured Visualizer |
| `cta_product_dean_os` | Featured Dean OS |
| `cta_partner_submit` | Inquiry submit |

## Later, not in this branch

1. One nav include used by platform pages, games, and resources.
2. A product-page template (name, problem, users, capabilities, screenshots, status, CTA, access).
3. Solution pages only after copy is sourced from real offers.
4. Replace the fake `main.js` partner success on any page that still uses it.
