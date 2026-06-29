#!/usr/bin/env node
/**
 * Generates music regulation SEO landing pages under resources/music/
 * Run: node scripts/generate-music-resource-pages.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'resources', 'music');
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

function renderFAQJsonLd(faq) {
    const mainEntity = faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
    }));

    const json = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity
    };

    return JSON.stringify(json, null, 2);
}

function renderPage(p) {
    const canonical = BASE + '/resources/music/' + p.slug + '.html';
    const seoTitle = p.title + ' | PNEUOMA';

    const adaptations = p.gradeVariations
        .map(
            (a) =>
                '<h3>' +
                esc(a.grade) +
                '</h3><p>' +
                esc(a.text) +
                '</p>'
        )
        .join('\n');

    const jsonLd = renderFAQJsonLd(p.faq);

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
            <div class="nav-buttons"><a href="/auth/signup.html" class="nav-cta nav-signup" data-pc-event="cta_start_free_click" data-pc-label="music_res_start">Start Free</a></div>
        </div>
    </nav>

    <header class="pc-res-hero">
        <p class="pc-res-eyebrow">${esc(p.eyebrow || 'Music Regulation')}</p>
        <h1>${esc(p.h1)}</h1>
        <p class="pc-res-lede">${esc(p.problem)}</p>
    </header>

    <main class="pc-article">
        <h2>Problem</h2>
        <p>${esc(p.problem)}</p>

        <h2>Explanation</h2>
        <p>${esc(p.explanation)}</p>

        <h2>Embedded game</h2>
        <div class="pc-game-embed" role="group" aria-label="${esc(p.embedded.iframeTitle)}">
            <iframe
                class="pc-game-iframe"
                title="${esc(p.embedded.iframeTitle)}"
                src="${esc(p.embedded.src)}"
                allow="microphone; autoplay"
                loading="lazy"
            ></iframe>
        </div>

        <h2>Teacher instructions</h2>
        <ol>
${p.teacherSteps.map((s) => '            <li>' + esc(s) + '</li>').join('\n')}
        </ol>
        <div class="pc-callout">
            <p>${esc(p.teacherScript)}</p>
        </div>

        <h2>Classroom adaptation</h2>
        <p>${esc(p.classroomAdaptation)}</p>

        <h2>Grade variations</h2>
        ${adaptations}

        <h2>FAQ</h2>
        <div class="pc-faq">
${p.faq
    .map(
        (item) =>
            `            <div class="pc-faq-item"><h3>${esc(item.q)}</h3><p>${esc(item.a)}</p></div>`
    )
    .join('\n')}
        </div>

        <div class="pc-cta-band">
            <h3>Use this routine school-wide</h3>
            <p>Download the toolkit, try whole-class sync, or request a pilot.</p>
            <div class="pc-cta-row">
                <a href="/toolkit/" class="btn btn-primary" data-pc-event="music_toolkit_click" data-pc-label="music_${esc(p.slug)}_toolkit"><span>Download Toolkit</span></a>
                <a href="/platform/multiplayer/classroom-sync/" class="btn btn-secondary" data-pc-event="music_classroom_sync_click" data-pc-label="music_${esc(p.slug)}_classroom_sync">Try Classroom Sync</a>
                <a href="/platform/schools/pilot-program.html" class="btn btn-secondary" data-pc-event="music_pilot_click" data-pc-label="music_${esc(p.slug)}_pilot">Request School Pilot</a>
            </div>
        </div>
    </main>

    <nav class="pc-related pc-resource-nav" aria-label="Resource navigation">
        <h2>More resources</h2>
        <div class="pc-related-grid">
            <a href="/resources/">Teacher Resources Hub</a>
            <a href="/platform/games/">PNEUOMA Games</a>
            <a href="/platform/multiplayer/classroom-sync/">Classroom Sync</a>
            <a href="/toolkit/">Toolkit</a>
        </div>
    </nav>

    <p class="pc-article" style="padding-top:0;font-size:0.9rem;color:var(--pc-text-dim);text-align:center;">${esc(DISCLAIMER)}</p>

    <script type="application/ld+json">${jsonLd}</script>
    <script src="/lib/discovery-config.js"></script>
    <script src="/lib/discovery.js"></script>
    <script src="/conversion.js"></script>
</body>
</html>
`;
}

const PAGES = require('./music-resource-pages-data');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const p of PAGES) {
    fs.writeFileSync(
        path.join(OUT_DIR, p.slug + '.html'),
        renderPage(p),
        'utf8'
    );
    written++;
    console.log('wrote music/' + p.slug + '.html');
}

console.log('Generated', written, 'music resource pages.');

