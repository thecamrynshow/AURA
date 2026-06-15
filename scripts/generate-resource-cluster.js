#!/usr/bin/env node
/**
 * Generates problem-based classroom regulation resource pages from structured data.
 * Output: static HTML in resources/ (GitHub Pages compatible, no runtime build).
 *
 * Run: node scripts/generate-resource-cluster.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'resources');
const BASE = 'https://pneuoma.com';

const DISCLAIMER =
    'PNEUOMA is an educational regulation support tool. It does not diagnose, treat, cure, or prevent medical or behavioral conditions.';

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function listItems(items) {
    return items.map((i) => '            <li>' + i + '</li>').join('\n');
}

function faqHtml(faq) {
    return faq
        .map(
            (f) =>
                '        <div class="pc-faq-item"><h3>' +
                f.q +
                '</h3><p>' +
                f.a +
                '</p></div>'
        )
        .join('\n');
}

function faqJsonLd(faq) {
    return JSON.stringify(
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
            })),
        },
        null,
        2
    );
}

function relatedGrid(related) {
    return related
        .map((r) => '            <a href="' + r.href + '">' + esc(r.label) + '</a>')
        .join('\n');
}

function renderPage(p) {
    const canonical = BASE + '/resources/' + p.slug + '.html';
    const seoTitle = p.title + ' | PNEUOMA';
    const adaptations = p.adaptations
        .map((a) => '<h3>' + a.grade + '</h3><p>' + a.text + '</p>')
        .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TQGSNCV7Q2"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-TQGSNCV7Q2');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(seoTitle)}</title>
    <meta name="description" content="${esc(p.metaDescription)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonical}">
    <meta property="og:title" content="${esc(p.title)}">
    <meta property="og:description" content="${esc(p.metaDescription)}">
    <meta property="og:image" content="${BASE}/logo-1024.png">
    <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="/conversion.css">
</head>
<body>
    <div class="background"><div class="gradient-orb orb-1"></div><div class="gradient-orb orb-2"></div><div class="gradient-orb orb-3"></div></div>

    <nav class="nav">
        <a href="/" class="nav-logo" style="text-decoration:none;"><span class="logo-icon">πνεῦμα</span><span class="logo-text">PNEUOMA</span></a>
        <div class="nav-links">
            <a href="/platform/games/">Games</a>
            <a href="/platform/multiplayer/classroom-sync/">Classroom Sync</a>
            <a href="/resources/">Resources</a>
            <a href="/platform/schools/">For Schools</a>
            <div class="nav-buttons"><a href="/auth/signup.html" class="nav-cta nav-signup" data-pc-event="cta_start_free_click" data-pc-label="nav">Start Free</a></div>
        </div>
    </nav>

    <header class="pc-res-hero">
        <p class="pc-res-eyebrow">${p.eyebrow}</p>
        <h1>${p.h1}</h1>
        <p class="pc-res-lede">${p.lede}</p>
    </header>

    <main class="pc-article">
        <h2>Classroom use case</h2>
        <p>${p.useCase}</p>

        <h2>Step-by-step routine</h2>
        <ol>
${p.steps.map((s) => '            <li>' + s + '</li>').join('\n')}
        </ol>

        <h2>Teacher script (read aloud)</h2>
        <div class="pc-callout"><p>${p.script}</p></div>

        <h2>Age and grade adaptations</h2>
        ${adaptations}

        <h2>Common mistakes</h2>
        <ul>
${listItems(p.mistakes)}
        </ul>

        <h2>When to use this</h2>
        <p>${p.whenToUse}</p>

        <p>${p.pneuomaNote}</p>

        <div class="pc-cta-band">
            <h3>Next steps for your classroom</h3>
            <p>Grab free tools, try whole-class sync, or ask about a school pilot.</p>
            <div class="pc-cta-row">
                <a href="/toolkit/" class="btn btn-primary" data-pc-event="cta_download_toolkit_click" data-pc-label="resource_${p.slug}"><span>Download Free Classroom Regulation Toolkit</span></a>
                <a href="/platform/multiplayer/classroom-sync/" class="btn btn-secondary" data-pc-event="cta_classroom_sync_click" data-pc-label="resource_${p.slug}">Try Classroom Sync</a>
                <a href="/platform/schools/pilot-program.html" class="btn btn-secondary" data-pc-event="cta_request_pilot_click" data-pc-label="resource_${p.slug}">Request School Pilot</a>
            </div>
        </div>
    </main>

    <nav class="pc-related pc-resource-nav" aria-label="Resource navigation">
        <h2>Explore PNEUOMA</h2>
        <div class="pc-related-grid">
            <a href="/resources/">Teacher Resources Hub</a>
            <a href="/platform/games/">PNEUOMA Platform &amp; Games</a>
            <a href="/platform/multiplayer/classroom-sync/">Classroom Sync</a>
            <a href="/auth/signup.html" data-pc-event="cta_start_free_click" data-pc-label="resource_nav">Start Free Account</a>
        </div>
    </nav>

    <section class="pc-related">
        <h2>Related articles</h2>
        <div class="pc-related-grid">
${relatedGrid(p.related)}
        </div>
    </section>

    <section class="pc-faq">
        <h2>Frequently asked questions</h2>
${faqHtml(p.faq)}
    </section>

    <p class="pc-article" style="padding-top:0;font-size:0.9rem;color:var(--pc-text-dim);text-align:center;">${DISCLAIMER}</p>

    <footer class="footer">
        <div class="section-container">
            <div class="footer-bottom" style="border:none; justify-content:center; gap:1.5rem;">
                <p>© 2026 PNEUOMA. Breathe. Play. Regulate.</p>
                <a href="/resources/" class="pc-link">All Resources</a>
                <a href="/platform/schools/" class="pc-link">For Schools</a>
            </div>
        </div>
    </footer>

    <script type="application/ld+json">
${faqJsonLd(p.faq)}
    </script>
    <script src="/conversion.js"></script>
</body>
</html>
`;
}

// Shared FAQ helpers
const faqGeneral = [
    {
        q: 'How long should a regulation routine take?',
        a: 'Most whole-class routines work best in 1–5 minutes. Short and consistent beats long and occasional.',
    },
    {
        q: 'Do I need special equipment?',
        a: 'No. These routines use voice, breath, movement, and attention — things you already have in the classroom.',
    },
    {
        q: 'Is this a replacement for counseling or clinical support?',
        a: 'No. These are everyday classroom regulation supports. They do not replace school mental health services or clinical care.',
    },
];

const PAGES = require('./resource-cluster-data');

let written = 0;
for (const p of PAGES) {
    const out = path.join(OUT_DIR, p.slug + '.html');
    fs.writeFileSync(out, renderPage(p), 'utf8');
    written++;
    console.log('wrote', p.slug + '.html');
}
console.log('Generated', written, 'resource pages.');
