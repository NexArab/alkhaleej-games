#!/usr/bin/env node
/**
 * Build orchestrator.
 *
 * Pipeline:
 *   1. Load data (split per-game JSON or legacy combined)
 *   2. Validate schema — fail fast on broken games
 *   3. Build homepage, game pages, category pages
 *   4. Write sitemap.xml + robots.txt
 *   5. Copy assets
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SITE_FILE = path.join(DATA_DIR, 'site.json');
const GAMES_DIR = path.join(DATA_DIR, 'games');
const LEGACY_COMBINED = path.join(DATA_DIR, 'games.combined.json');
const OUT_DIR = path.join(ROOT, 'generated');
const ASSETS_DIR = path.join(ROOT, 'assets');
const ASSETS_OUT = path.join(OUT_DIR, 'assets');

const { buildHomepage } = require('../templates/homepage.js');
const { buildGamePage } = require('../templates/game.js');
const { buildCategoryPage } = require('../templates/category.js');
const { buildSitemap, buildRobots } = require('./build-sitemap.js');
const { makeRelative } = require('./build-relative.js');
const { validateAll } = require('./validate.js');

// ---------- helpers ----------
function log(label, msg) {
  const colors = { ok: '\x1b[32m', err: '\x1b[31m', info: '\x1b[36m', warn: '\x1b[33m', dim: '\x1b[90m' };
  const c = colors[label] || '';
  console.log(`${c}[${label}]\x1b[0m ${msg}`);
}

function mkdirp(dir) { fs.mkdirSync(dir, { recursive: true }); }

function writeFile(filepath, content) {
  mkdirp(path.dirname(filepath));
  fs.writeFileSync(filepath, content, 'utf8');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  mkdirp(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function loadData() {
  if (fs.existsSync(SITE_FILE) && fs.existsSync(GAMES_DIR)) {
    const siteData = JSON.parse(fs.readFileSync(SITE_FILE, 'utf8'));
    const games = fs.readdirSync(GAMES_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(GAMES_DIR, f), 'utf8'));
        } catch (e) {
          log('err', `Failed to parse ${f}: ${e.message}`);
          return null;
        }
      })
      .filter(Boolean);
    return {
      site: siteData.site,
      categories: siteData.categories,
      emotions: siteData.emotions || {},
      tones: siteData.tones || {},
      statuses: siteData.statuses || {},
      difficulties: siteData.difficulties || {},
      seasons: siteData.seasons || {},
      games
    };
  }
  if (fs.existsSync(LEGACY_COMBINED)) {
    return JSON.parse(fs.readFileSync(LEGACY_COMBINED, 'utf8'));
  }
  throw new Error('No data found. Expected data/site.json + data/games/*.json OR data/games.combined.json');
}

// ---------- main ----------
async function main() {
  const startTime = Date.now();
  const STRICT = process.argv.includes('--strict');
  log('info', '─────────────────────────────────────────');
  log('info', '  Chat Al-Khaleej Games — Build');
  log('info', '─────────────────────────────────────────');

  // Load
  let data;
  try {
    data = loadData();
  } catch (e) {
    log('err', e.message);
    process.exit(1);
  }
  log('ok', `Loaded ${data.games?.length || 0} games, ${data.categories?.length || 0} categories`);

  // Validate — fail build if any game has errors
  const { errors, warnings } = validateAll(data.games, data.categories);
  if (warnings.length) {
    log('warn', `Schema warnings (${warnings.length}):`);
    warnings.slice(0, 20).forEach(w => log('warn', `  ${w}`));
    if (warnings.length > 20) log('warn', `  ... and ${warnings.length - 20} more`);
  }
  if (errors.length) {
    log('err', `Schema validation FAILED (${errors.length} errors):`);
    errors.forEach(e => log('err', `  ${e}`));
    log('err', 'Build aborted. Fix the errors above and try again.');
    process.exit(1);
  }
  log('ok', 'Schema validation passed');

  // Filter out hidden/archived games before building pages
  const publishedGames = data.games.filter(g => g.status !== 'hidden' && g.status !== 'archived');
  const skipped = data.games.length - publishedGames.length;
  if (skipped > 0) log('dim', `Skipping ${skipped} hidden/archived games`);
  data.games = publishedGames;

  // Clean output
  rmrf(OUT_DIR);
  mkdirp(OUT_DIR);
  log('dim', 'Cleaned output directory');

  // Copy assets
  copyDir(ASSETS_DIR, ASSETS_OUT);
  log('ok', 'Copied assets/');

  // Build homepage
  try {
    const html = buildHomepage(data);
    writeFile(path.join(OUT_DIR, 'index.html'), html);
    log('ok', 'Built homepage → /index.html');
  } catch (e) {
    log('err', `Homepage build failed: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  }

  // Build game pages
  let gameCount = 0;
  let gameErrors = 0;
  for (const game of data.games) {
    try {
      const html = buildGamePage(game, data);
      writeFile(path.join(OUT_DIR, game.slug, 'index.html'), html);
      gameCount++;
    } catch (e) {
      log('err', `Game build failed for "${game.slug}": ${e.message}`);
      console.error(e.stack);
      gameErrors++;
      if (STRICT) process.exit(1);
    }
  }
  log('ok', `Built ${gameCount} game pages${gameErrors ? ` (${gameErrors} failed)` : ''}`);

  // Category pages — build ALL categories, even empty ones.
  // Empty categories render a "coming soon" state (see category.js).
  let catCount = 0;
  for (const cat of data.categories || []) {
    try {
      const html = buildCategoryPage(cat, data);
      writeFile(path.join(OUT_DIR, cat.slug, 'index.html'), html);
      catCount++;
    } catch (e) {
      log('err', `Category build failed for "${cat.slug}": ${e.message}`);
      console.error(e.stack);
    }
  }
  log('ok', `Built ${catCount} category pages`);

  // Rewrite absolute paths → relative, so the site works on any host
  // (GitHub Pages subfolder, custom domain, or opened locally).
  const rewritten = makeRelative(OUT_DIR);
  log('ok', `Made ${rewritten} pages portable (relative paths)`);

  // Sitemap + robots
  writeFile(path.join(OUT_DIR, 'sitemap.xml'), buildSitemap(data));
  log('ok', 'Built sitemap.xml');
  writeFile(path.join(OUT_DIR, 'robots.txt'), buildRobots());
  log('ok', 'Built robots.txt');

  // GitHub Pages files — regenerated every build so they survive the
  // clean step. CNAME = custom domain, .nojekyll = serve files as-is.
  const domain = (data.site.url || '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  if (domain) {
    writeFile(path.join(OUT_DIR, 'CNAME'), domain + '\n');
    log('ok', `Built CNAME (${domain})`);
  }
  writeFile(path.join(OUT_DIR, '.nojekyll'), '');
  log('ok', 'Built .nojekyll');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  log('info', '─────────────────────────────────────────');
  log('ok', `Build complete in ${elapsed}s`);
  log('info', `Output: ${OUT_DIR}`);
  log('info', '─────────────────────────────────────────');
}

main().catch(err => {
  log('err', `Build failed: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
