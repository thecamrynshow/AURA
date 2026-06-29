#!/usr/bin/env node
/**
 * Generates interactive SEO landing pages under resources/play/
 * Run: node scripts/generate-interactive-resources.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'resources', 'play');
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

function renderPage(p) {
    const canonical = BASE + '/resources/play/' + p.slug + '.html';
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
            <div class="nav-buttons"><a href="/auth/signup.html" class="nav-cta nav-signup" data-pc-event="cta_start_free_click" data-pc-label="play_nav">Start Free</a></div>
        </div>
    </nav>

    <header class="pc-res-hero">
        <p class="pc-res-eyebrow">Interactive Classroom Tool</p>
        <h1>${p.h1}</h1>
        <p class="pc-res-lede">${p.problem}</p>
    </header>

    <main class="pc-article">
        <h2>The problem</h2>
        <p>${p.problemDetail}</p>

        <h2>Why this helps</h2>
        <p>${p.explanation}</p>

        <div class="pc-game-embed" data-pc-game-embed data-pc-game-id="${esc(p.gameId)}" data-pc-game-url="${esc(p.gameUrl)}">
            <div class="pc-game-embed-header">
                <h2>Try it now — ${esc(p.gameName)}</h2>
                <p>${p.embedNote}</p>
            </div>
            <div class="pc-game-stage">
                <div class="pc-game-placeholder">
                    <p>${p.embedPrompt}</p>
                    <button type="button" class="btn btn-primary pc-game-launch" data-pc-game-launch><span>Launch ${esc(p.gameName)}</span></button>
                </div>
                <iframe class="pc-game-iframe" hidden title="${esc(p.gameName)} interactive demo" allow="microphone; autoplay" loading="lazy"></iframe>
            </div>
            <div class="pc-game-embed-footer">
                <span>Works in browser — no download</span>
                <a href="${p.gameUrl}" target="_blank" rel="noopener">Open full screen ↗</a>
            </div>
        </div>

        <h2>Teacher instructions</h2>
        <ol>
${p.teacherSteps.map((s) => '            <li>' + s + '</li>').join('\n')}
        </ol>
        <div class="pc-callout"><p>${p.teacherScript}</p></div>

        <h2>Classroom adaptation</h2>
        ${adaptations}

        <div class="pc-cta-band">
            <h3>Use this routine school-wide</h3>
            <p>Download the toolkit, try whole-class sync, or request a pilot.</p>
            <div class="pc-cta-row">
                <a href="/toolkit/" class="btn btn-primary" data-pc-event="resource_toolkit_click" data-pc-label="play_${p.slug}"><span>Download Free Classroom Regulation Toolkit</span></a>
                <a href="/platform/multiplayer/classroom-sync/" class="btn btn-secondary" data-pc-event="resource_classroom_sync_click" data-pc-label="play_${p.slug}">Try Classroom Sync</a>
                <a href="/platform/schools/pilot-program.html" class="btn btn-secondary" data-pc-event="resource_pilot_click" data-pc-label="play_${p.slug}">Request School Pilot</a>
            </div>
        </div>
    </main>

    <nav class="pc-related pc-resource-nav" aria-label="Resource navigation">
        <h2>More resources</h2>
        <div class="pc-related-grid">
            <a href="/resources/">Teacher Resources Hub</a>
            <a href="/resources/play/">All Interactive Tools</a>
            <a href="/platform/games/">PNEUOMA Games</a>
            <a href="${p.gameUrl}">${p.gameName} (full game)</a>
        </div>
    </nav>

    <p class="pc-article" style="padding-top:0;font-size:0.9rem;color:var(--pc-text-dim);text-align:center;">${DISCLAIMER}</p>

    <footer class="footer">
        <div class="section-container">
            <div class="footer-bottom" style="border:none; justify-content:center; gap:1.5rem;">
                <p>© 2026 PNEUOMA. Breathe. Play. Regulate.</p>
                <a href="/resources/" class="pc-link">All Resources</a>
            </div>
        </div>
    </footer>

    <script src="/lib/discovery-config.js"></script>
    <script src="/lib/discovery.js"></script>
    <script src="/conversion.js"></script>
    <script src="/resource-play.js"></script>
</body>
</html>
`;
}

const PAGES = require('./interactive-resource-data');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const p of PAGES) {
    fs.writeFileSync(path.join(OUT_DIR, p.slug + '.html'), renderPage(p), 'utf8');
    written++;
    console.log('wrote play/' + p.slug + '.html');
}
console.log('Generated', written, 'interactive resource pages.');
