/**
 * Homepage template builder — v2 (UI/UX refinement).
 *
 * This file ONLY changes the homepage HTML structure/layout.
 * It does NOT touch: build system, game engine, routing, sitemap,
 * related-games logic, or the JSON data system.
 *
 * Design goals: compact hero, tight spacing, smaller cards, clear
 * visual hierarchy, TikTok/Steam-style discovery rows, mobile-first.
 *
 * gameCardHtml + categoryCardHtml keep the same signature so that
 * game.js and category.js continue to work unchanged.
 */

const {
  navbarHtml, footerHtml, mobileBottomNavHtml, shareModalHtml,
  chatCtaBannerHtml, metaHeadHtml, SITE, escapeHtml, escapeAttr, formatPlaysBadge
} = require('./partials');

/* ───────────────────────── CARD: standard ───────────────────────── */
/**
 * @param {object} g - game object
 * @param {object} opts - { badge?: 'trending'|'new'|'hot', showBadge?: legacy alias }
 */
function gameCardHtml(g, opts = {}) {
  // Back-compat: old callers may pass { showBadge: 'trending' }
  const badgeKey = opts.badge || opts.showBadge || null;
  const badgeMap = {
    trending: '<span class="gc-badge gc-badge--trending">رائج</span>',
    new: '<span class="gc-badge gc-badge--new">جديد</span>',
    hot: '<span class="gc-badge gc-badge--hot">شائع</span>'
  };
  const badge = badgeKey && badgeMap[badgeKey] ? badgeMap[badgeKey] : '';
  const tag = (g.tags && g.tags.length) ? g.tags[0] : null;

  return `
    <a href="/${g.slug}/" class="gcard" aria-label="${escapeAttr(g.title)}">
      <div class="gcard__thumb" style="background:${g.thumbBg || g.colorSoft}">
        ${badge}
        <span class="gcard__icon" aria-hidden="true">${g.icon}</span>
      </div>
      <div class="gcard__body">
        <h3 class="gcard__title">${escapeHtml(g.shortTitle || g.title)}</h3>
        <div class="gcard__meta">
          <span class="gcard__plays">${escapeHtml(formatPlaysBadge(g.plays))}</span>
          ${tag ? `<span class="gcard__dot"></span><span class="gcard__tag">${escapeHtml(tag)}</span>` : ''}
        </div>
      </div>
    </a>`;
}

/* ───────────────────── CARD: rank (most played) ──────────────────── */
function rankCardHtml(g, rank) {
  return `
    <a href="/${g.slug}/" class="rcard" aria-label="${escapeAttr(g.title)}">
      <span class="rcard__rank">${rank}</span>
      <div class="rcard__icon" style="background:${g.colorSoft};color:${g.color}">${g.icon}</div>
      <div class="rcard__body">
        <h3 class="rcard__title">${escapeHtml(g.shortTitle || g.title)}</h3>
        <span class="rcard__plays">${escapeHtml(formatPlaysBadge(g.plays))} لاعب</span>
      </div>
      <span class="rcard__arrow" aria-hidden="true">‹</span>
    </a>`;
}

/* ───────────────────────── CARD: category ────────────────────────── */
function categoryCardHtml(cat, count = 0) {
  const countLabel = count > 0 ? `${count} لعبة` : 'قريباً';
  const emptyClass = count > 0 ? '' : ' ccard--soon';
  return `
    <a href="/${cat.slug}/" class="ccard${emptyClass}" style="--cat-color:${cat.color};--cat-soft:${cat.colorSoft}" aria-label="${escapeAttr(cat.name)}">
      <span class="ccard__icon">${cat.icon}</span>
      <span class="ccard__name">${escapeHtml(cat.name)}</span>
      <span class="ccard__count">${countLabel}</span>
    </a>`;
}

/* ───────────────────────── SECTION helpers ───────────────────────── */
function sectionHead(title, opts = {}) {
  const link = opts.link
    ? `<a href="${opts.link}" class="sec__link">${opts.linkText || 'الكل'}<span aria-hidden="true"> ‹</span></a>`
    : '';
  return `
    <div class="sec__head">
      <h2 class="sec__title">${escapeHtml(title)}</h2>
      ${link}
    </div>`;
}

function scrollSection(title, cards, opts = {}) {
  if (!cards.length) return '';
  return `
  <section class="sec" aria-label="${escapeAttr(title)}">
    ${sectionHead(title, opts)}
    <div class="rail">${cards.join('')}</div>
  </section>`;
}

function gridSection(title, cards, opts = {}) {
  if (!cards.length) return '';
  return `
  <section class="sec"${opts.id ? ` id="${opts.id}"` : ''} aria-label="${escapeAttr(title)}">
    ${sectionHead(title, opts)}
    <div class="grid">${cards.join('')}</div>
  </section>`;
}

/* ───────────────────────── BUILD HOMEPAGE ────────────────────────── */
function buildHomepage(data) {
  const games = data.games || [];
  const categories = data.categories || [];
  const site = data.site || {};

  // ── partitions (UNCHANGED logic — same fields, same sorts) ──
  const byPopularity = (a, b) => (b.popularity || 0) - (a.popularity || 0);
  const byNewest = (a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || '');

  const trending = games.filter(g => g.trending).sort(byPopularity);
  const mostPlayed = [...games].sort(byPopularity).slice(0, 6);
  const latest = [...games].sort(byNewest).slice(0, 10);
  const quickPlay = games.filter(g => {
    const d = g.duration || '';
    return d.includes('1') || d.includes('2');
  }).slice(0, 10);

  const loveGames = games.filter(g => g.category === 'love-games');
  const iqGames = games.filter(g => g.category === 'iq-games' || g.category === 'personality-tests');

  // All categories with their game counts (empty ones included — shown as "قريباً")
  const catCounts = categories
    .map(c => ({ cat: c, count: games.filter(g => g.category === c.slug).length }));
  // Only non-empty categories get a filter chip
  const catCountsWithGames = catCounts.filter(x => x.count > 0);

  const popularFooter = [...games].sort(byPopularity).slice(0, 4);

  // ── SEO schemas (UNCHANGED) ──
  const websiteSchema = {
    "@context": "https://schema.org", "@type": "WebSite",
    "name": site.name || "العاب شات الخليج",
    "url": site.url || SITE.gamesUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${site.url || SITE.gamesUrl}/?q={search_term_string}` },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "ar"
  };
  const itemListSchema = {
    "@context": "https://schema.org", "@type": "ItemList",
    "name": "أحدث الألعاب",
    "itemListElement": latest.slice(0, 10).map((g, i) => ({
      "@type": "ListItem", "position": i + 1,
      "url": `${site.url || SITE.gamesUrl}/${g.slug}/`, "name": g.title
    }))
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": `${SITE.chatUrl}/` },
      { "@type": "ListItem", "position": 2, "name": "الالعاب", "item": `${site.url || SITE.gamesUrl}/` }
    ]
  };
  const schemaScripts = [websiteSchema, itemListSchema, breadcrumbSchema]
    .map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ');

  const head = metaHeadHtml({
    title: 'العاب شات الخليج — اختبارات شخصية، حب، ذكاء وأكثر',
    description: site.description || 'منصة العاب شات الخليج — اختبارات شخصية، ألعاب حب، اختبارات ذكاء، ألعاب تسلية. شارك مع أصدقائك.',
    url: site.url || SITE.gamesUrl,
    ogImage: site.defaultOg,
    keywords: site.keywords
  });

  // ── category chips ──
  const chips = catCountsWithGames.map(({ cat }) =>
    `<a href="/${cat.slug}/" class="chip"><span class="chip__icon">${cat.icon}</span>${escapeHtml(cat.name)}</a>`
  ).join('');

  // ── featured hero game ──
  const heroGame = trending[0] || mostPlayed[0] || games[0];

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  ${head}
  ${schemaScripts}
</head>
<body data-theme="light">

  <div class="toast-container" id="toastContainer" aria-live="polite"></div>

  ${navbarHtml('games')}

  <main class="home">

    <!-- ───────── HERO (compact) ───────── -->
    <section class="hero2">
      <div class="hero2__text">
        <h1 class="hero2__title">العاب واختبارات تكشف شخصيتك</h1>
        <p class="hero2__sub">اختبارات حب، ذكاء، أبراج وتسلية — العب وشارك نتيجتك بثوانٍ.</p>
        <div class="hero2__search">
          <label class="search2" for="searchInput">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 001.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 00-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 005.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input type="search" id="searchInput" class="search2__input" placeholder="ابحث عن لعبة أو اختبار…" aria-label="بحث">
          </label>
          <div class="search-results" id="searchResults" role="listbox"></div>
        </div>
      </div>
      ${heroGame ? `
      <a href="/${heroGame.slug}/" class="hero2__feature" style="background:${heroGame.thumbBg || heroGame.colorSoft}" aria-label="${escapeAttr(heroGame.title)}">
        <span class="hero2__feature-tag">الأكثر رواجاً</span>
        <span class="hero2__feature-icon">${heroGame.icon}</span>
        <span class="hero2__feature-title">${escapeHtml(heroGame.shortTitle || heroGame.title)}</span>
        <span class="hero2__feature-cta">العب الآن ‹</span>
      </a>` : ''}
    </section>

    <!-- ───────── CATEGORY CHIPS ───────── -->
    <nav class="chips" aria-label="تصفّح حسب الفئة">
      <a href="#all" class="chip chip--active">الكل</a>
      ${chips}
    </nav>

    <!-- ───────── TRENDING ───────── -->
    ${scrollSection('🔥 الأكثر رواجاً', trending.map(g => gameCardHtml(g, { badge: 'trending' })), { link: '#all', linkText: 'الكل' })}

    <!-- ───────── QUICK PLAY ───────── -->
    ${scrollSection('⚡ العاب سريعة', (quickPlay.length ? quickPlay : latest).map(g => gameCardHtml(g)), { link: '#all', linkText: 'الكل' })}

    <!-- ───────── MOST PLAYED (ranked) ───────── -->
    ${mostPlayed.length ? `
    <section class="sec" aria-label="الأكثر لعباً">
      ${sectionHead('📈 الأكثر لعباً')}
      <div class="ranks">
        ${mostPlayed.map((g, i) => rankCardHtml(g, i + 1)).join('')}
      </div>
    </section>` : ''}

    <!-- ───────── NEW GAMES ───────── -->
    ${gridSection('🆕 العاب جديدة', latest.slice(0, 8).map(g => gameCardHtml(g, { badge: 'new' })), { link: '#all', linkText: 'الكل' })}

    <!-- ───────── CHAT CTA (mid-page) ───────── -->
    ${chatCtaBannerHtml('full')}

    <!-- ───────── LOVE GAMES ───────── -->
    ${scrollSection('💘 العاب الحب', loveGames.map(g => gameCardHtml(g)), { link: '/love-games/', linkText: 'الكل' })}

    <!-- ───────── IQ / PERSONALITY ───────── -->
    ${scrollSection('🧠 الذكاء والشخصية', iqGames.map(g => gameCardHtml(g)), { link: '/iq-games/', linkText: 'الكل' })}

    <!-- ───────── CATEGORIES ───────── -->
    <section class="sec" aria-label="الفئات">
      ${sectionHead('🗂️ كل الفئات')}
      <div class="cats">
        ${catCounts.map(({ cat, count }) => categoryCardHtml(cat, count)).join('')}
      </div>
    </section>

    <!-- ───────── ALL GAMES ───────── -->
    ${gridSection('🎮 جميع الالعاب', games.map(g => gameCardHtml(g)), { id: 'all' })}

    <!-- ───────── SEO ───────── -->
    <section class="seo2">
      <h2 class="seo2__title">عن منصة العاب شات الخليج</h2>
      <p class="seo2__text">منصة العاب شات الخليج تجمع أفضل الاختبارات والالعاب الاجتماعية بالعربية: اختبارات الشخصية، العاب الحب، اختبارات الذكاء، الأبراج وتحدّيات الكتابة. كل الالعاب مجانية، سريعة، مصمّمة للجوال أولاً، وبدون تسجيل دخول — اختر لعبة، العب، وشارك نتيجتك مع أصدقائك في ثوانٍ.</p>
    </section>

  </main>

  ${footerHtml(popularFooter)}
  ${mobileBottomNavHtml('games')}
  ${shareModalHtml()}

  <script id="games-data" type="application/json">${JSON.stringify(games.map(g => ({
    slug: g.slug,
    title: g.title,
    shortTitle: g.shortTitle,
    description: g.description,
    shortDesc: g.shortDesc,
    icon: g.icon,
    category: g.category,
    tags: g.tags || [],
    emotions: g.emotions || [],
    difficulty: g.difficulty || null,
    tone: g.tone || null,
    color: g.color,
    colorSoft: g.colorSoft
  })))}</script>

  <script>
    window.__PAGE_TYPE__ = 'homepage';
  </script>
  <script src="/assets/shared/analytics.js"></script>
  <script src="/assets/shared/platform.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      try {
        const data = JSON.parse(document.getElementById('games-data').textContent);
        CAK.Search.init(data);
      } catch (e) { console.error(e); }
    });
  </script>

</body>
</html>`;
}

module.exports = { buildHomepage, gameCardHtml, categoryCardHtml };
