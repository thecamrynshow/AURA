#!/usr/bin/env node
/**
 * generate-sitemap.js
 * ------------------------------------------------------------------
 * Regenerates sitemap.xml from the actual file tree so it never goes
 * stale again. Run it whenever you ship pages:
 *
 *     npm run sitemap
 *
 * It also runs automatically in CI (.github/workflows/sitemap.yml).
 *
 * Behavior:
 *   - Scans the repo for .html pages.
 *   - Skips backend/internal/secondary-product dirs and utility pages.
 *   - Skips any page marked <meta name="robots" content="noindex">.
 *   - Maps index.html -> clean directory URL (trailing slash).
 *   - Derives <lastmod> from the file's last git commit date,
 *     falling back to the filesystem mtime for untracked files.
 *   - Assigns <priority>/<changefreq> from path-based rules.
 *
 * No dependencies. Pure Node.
 * ------------------------------------------------------------------
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---- Config -------------------------------------------------------

const BASE_URL = 'https://pneuoma.com';
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'sitemap.xml');

// Directories we never crawl (backend, internal docs, secondary
// products, build artifacts, tooling).
const SKIP_DIRS = new Set([
    '.git',
    '.github',
    'node_modules',
    'scripts',
    'server',
    'docs',
    'www',                 // separate incident-docs landing
    'incident-capture',    // separate K-12 incident product
    'ios',
    'android',
    'dist',
    'build',
    'terminals',
    'src',                 // game source, not standalone pages
]);

// Specific pages to exclude (post-auth / utility / one-off assets).
// Paths are relative to repo root, POSIX style.
const SKIP_FILES = new Set([
    'auth/success.html',
    'auth/forgot-password.html',
    'linkedin-banner.html',
]);

// Ordered priority/changefreq rules. First match wins.
// `test` runs against the clean URL path (e.g. "/games/aura/").
const RULES = [
    { test: (p) => p === '/', priority: '1.0', changefreq: 'daily' },
    { test: (p) => p === '/platform/games/', priority: '0.95', changefreq: 'weekly' },
    { test: (p) => p === '/toolkit/', priority: '0.9', changefreq: 'weekly' },
    { test: (p) => p === '/resources/', priority: '0.9', changefreq: 'weekly' },
    { test: (p) => p.startsWith('/resources/'), priority: '0.8', changefreq: 'weekly' },
    { test: (p) => p === '/platform/schools/', priority: '0.9', changefreq: 'weekly' },
    { test: (p) => p === '/platform/schools/pilot-program.html', priority: '0.85', changefreq: 'monthly' },
    { test: (p) => p === '/platform/create/', priority: '0.9', changefreq: 'weekly' },
    { test: (p) => p.startsWith('/platform/create/'), priority: '0.85', changefreq: 'weekly' },
    { test: (p) => p === '/games/aura/', priority: '0.9', changefreq: 'monthly' },
    { test: (p) => p.startsWith('/games/'), priority: '0.85', changefreq: 'monthly' },
    { test: (p) => p === '/platform/rituals/', priority: '0.85', changefreq: 'monthly' },
    { test: (p) => p.startsWith('/platform/rituals/'), priority: '0.75', changefreq: 'monthly' },
    { test: (p) => p === '/platform/multiplayer/', priority: '0.8', changefreq: 'monthly' },
    { test: (p) => p.startsWith('/platform/multiplayer/'), priority: '0.75', changefreq: 'monthly' },
    { test: (p) => p === '/platform/companions/', priority: '0.85', changefreq: 'monthly' },
    { test: (p) => p.startsWith('/platform/companions/'), priority: '0.8', changefreq: 'monthly' },
    { test: (p) => p === '/platform/apps/', priority: '0.8', changefreq: 'monthly' },
    { test: (p) => p.startsWith('/platform/apps/'), priority: '0.75', changefreq: 'monthly' },
    { test: (p) => p === '/platform/labs/', priority: '0.7', changefreq: 'monthly' },
    { test: (p) => p.startsWith('/platform/labs/'), priority: '0.6', changefreq: 'monthly' },
    { test: (p) => p === '/platform/about/', priority: '0.7', changefreq: 'monthly' },
    { test: (p) => p === '/platform/surveys/', priority: '0.5', changefreq: 'monthly' },
    { test: (p) => p === '/auth/signup.html', priority: '0.8', changefreq: 'monthly' },
    { test: (p) => p.startsWith('/auth/'), priority: '0.7', changefreq: 'monthly' },
    { test: (p) => p === '/pitch-deck/', priority: '0.6', changefreq: 'monthly' },
    { test: (p) => p === '/schedule/', priority: '0.6', changefreq: 'monthly' },
    { test: (p) => p === '/privacy.html', priority: '0.3', changefreq: 'yearly' },
];

const DEFAULT_RULE = { priority: '0.6', changefreq: 'monthly' };

// ---- Helpers ------------------------------------------------------

function walk(dir, acc = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(path.join(dir, entry.name), acc);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            acc.push(path.join(dir, entry.name));
        }
    }
    return acc;
}

function toRel(absPath) {
    return path.relative(ROOT, absPath).split(path.sep).join('/');
}

function isNoindex(absPath) {
    let html;
    try {
        html = fs.readFileSync(absPath, 'utf8');
    } catch {
        return false;
    }
    // Match <meta name="robots" content="...noindex...">
    const match = html.match(
        /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i
    );
    return !!match && /noindex/i.test(match[1]);
}

function toUrlPath(rel) {
    if (rel === 'index.html') return '/';
    if (rel.endsWith('/index.html')) {
        return '/' + rel.slice(0, -'index.html'.length);
    }
    return '/' + rel;
}

function lastmodFor(absPath, rel) {
    try {
        const out = execFileSync(
            'git',
            ['log', '-1', '--format=%cs', '--', rel],
            { cwd: ROOT, encoding: 'utf8' }
        ).trim();
        if (out) return out;
    } catch {
        /* not a git repo or untracked; fall through */
    }
    try {
        return fs.statSync(absPath).mtime.toISOString().slice(0, 10);
    } catch {
        return new Date().toISOString().slice(0, 10);
    }
}

function ruleFor(urlPath) {
    for (const rule of RULES) {
        if (rule.test(urlPath)) return rule;
    }
    return DEFAULT_RULE;
}

// ---- Build --------------------------------------------------------

function build() {
    const files = walk(ROOT);
    const entries = [];

    for (const abs of files) {
        const rel = toRel(abs);
        if (SKIP_FILES.has(rel)) continue;
        if (isNoindex(abs)) continue;

        const urlPath = toUrlPath(rel);
        const { priority, changefreq } = ruleFor(urlPath);
        entries.push({
            loc: BASE_URL + urlPath,
            urlPath,
            lastmod: lastmodFor(abs, rel),
            changefreq,
            priority,
        });
    }

    // Sort by descending priority, then alphabetically by URL for
    // stable, readable output.
    entries.sort((a, b) => {
        const diff = parseFloat(b.priority) - parseFloat(a.priority);
        if (diff !== 0) return diff;
        return a.loc.localeCompare(b.loc);
    });

    const today = new Date().toISOString().slice(0, 10);
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n' +
        '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'
    );
    lines.push('');
    lines.push('    <!-- ============================================ -->');
    lines.push('    <!-- PNEUOMA - Nervous System Regulation Games   -->');
    lines.push('    <!-- Auto-generated by scripts/generate-sitemap.js -->');
    lines.push(`    <!-- Last generated: ${today}                  -->`);
    lines.push('    <!-- Do not edit by hand: run \`npm run sitemap\` -->');
    lines.push('    <!-- ============================================ -->');
    lines.push('');

    for (const e of entries) {
        lines.push('    <url>');
        lines.push(`        <loc>${e.loc}</loc>`);
        lines.push(`        <lastmod>${e.lastmod}</lastmod>`);
        lines.push(`        <changefreq>${e.changefreq}</changefreq>`);
        lines.push(`        <priority>${e.priority}</priority>`);
        lines.push('    </url>');
    }

    lines.push('</urlset>');
    lines.push('');

    fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
    return entries;
}

const entries = build();
console.log(`Wrote ${entries.length} URLs to ${path.relative(ROOT, OUT_FILE)}`);
