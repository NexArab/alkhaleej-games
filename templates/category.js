/**
 * Category page template.
 * Lists every game in a single category, with a styled hero using the category color.
 */
const {
  SITE,
  navbarHtml,
  footerHtml,
  mobileBottomNavHtml,
  shareModalHtml,
  chatCtaBannerHtml,
  metaHeadHtml,
  escapeHtml,
  escapeAttr,
  formatPlays
} = require('./partials.js');
const { gameCardHtml } = require('./homepage.js');

function buildCategoryPage(category, data) {
  const games = (data.games || []).filter(g => g.category === category.slug);
  const popular = [...games].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  const latest = [...games].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  const url = `${SITE.gamesUrl.replace(/\/$/, '')}/${category.slug}/`;

  const head = metaHeadHtml({
    title: category.seoTitle || `${category.name} — ${data.site.name}`,
    description: category.seoDesc || category.description,
    url: url,
    image: category.ogImage || data.site.defaultOgImage,
    type: 'website',
    keywords: (category.tags || []).join(', '),
    extraSchemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category.name,
        description: category.description,
        url: url,
        inLanguage: 'ar',
        isPartOf: { '@type': 'WebSite', name: data.site.name, url: SITE.gamesUrl }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: popular.slice(0, 20).map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE.gamesUrl.replace(/\/$/, '')}/${g.slug}/`,
          name: g.title
        }))
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE.gamesUrl },
          { '@type': 'ListItem', position: 2, name: category.name, item: url }
        ]
      }
    ]
  });

  const breadcrumbHtml = `
    <nav class="breadcrumb" aria-label="مسار التنقل">
      <div class="container">
        <a href="${SITE.gamesUrl}">الرئيسية</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">${escapeHtml(category.name)}</span>
      </div>
    </nav>`;

  const heroHtml = `
    <section class="hero hero-category" style="--game-color:${escapeAttr(category.color)};--game-color-soft:${escapeAttr(category.colorSoft)}">
      <div class="container hero-inner">
        <div class="hero-badge" style="background:${escapeAttr(category.colorSoft)};color:${escapeAttr(category.color)}">
          <span>${escapeHtml(category.icon)}</span>
          <span>${escapeHtml(category.name)}</span>
        </div>
        <h1 class="hero-title">${escapeHtml(category.heroTitle || category.name)}</h1>
        <p class="hero-desc">${escapeHtml(category.description)}</p>
        <div class="hero-stats">
          <div class="stat">
            <strong>${games.length}</strong>
            <span>لعبة</span>
          </div>
          <div class="stat">
            <strong>+${formatPlays(games.reduce((s, g) => s + (g.plays || 0), 0))}</strong>
            <span>عدد اللاعبين</span>
          </div>
        </div>
      </div>
    </section>`;

  const popularSection = popular.length > 1 ? `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">الأكثر شعبية في ${escapeHtml(category.name)}</h2>
            <p class="section-sub">الألعاب التي يجربها الجميع</p>
          </div>
        </div>
        <div class="scroll-row">
          ${popular.slice(0, 8).map(g => gameCardHtml(g, { compact: true })).join('')}
        </div>
      </div>
    </section>` : '';

  const allGamesSection = `
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <h2 class="section-title">كل ألعاب ${escapeHtml(category.name)}</h2>
            <p class="section-sub">اختر اللعبة التي تناسبك</p>
          </div>
        </div>
        ${games.length ? `
          <div class="games-grid">
            ${latest.map(g => gameCardHtml(g)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">${escapeHtml(category.icon)}</div>
            <h3>لا توجد ألعاب بعد في هذا القسم</h3>
            <p>نضيف ألعاباً جديدة باستمرار — تابعنا قريباً.</p>
            <a href="${SITE.gamesUrl}" class="btn-primary">العودة للرئيسية</a>
          </div>
        `}
      </div>
    </section>`;

  const seoBlock = category.seoContent ? `
    <section class="section seo-section">
      <div class="container">
        <div class="seo-content">
          ${category.seoContent}
        </div>
      </div>
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
${head}
<link rel="stylesheet" href="${SITE.gamesUrl}assets/shared/styles.css">
</head>
<body data-theme="light">
${navbarHtml('games')}
${breadcrumbHtml}
${heroHtml}
${popularSection}
${allGamesSection}
<div class="container">${chatCtaBannerHtml('full')}</div>
${seoBlock}
${footerHtml(data.games)}
${mobileBottomNavHtml('games')}
${shareModalHtml()}
<div id="toastContainer" class="toast-container" aria-live="polite"></div>
<script>
window.__PAGE_TYPE__ = 'category';
window.__GAMES_DATA__ = ${JSON.stringify((data.games || []).map(stripGameForClient))};
window.__CATEGORY__ = ${JSON.stringify({ slug: category.slug, name: category.name })};
window.__PAGE_URL__ = ${JSON.stringify(url)};
window.__PAGE_TITLE__ = ${JSON.stringify(category.name + ' — ' + data.site.name)};
</script>
<script src="${SITE.gamesUrl}/assets/shared/analytics.js" defer></script>
<script src="${SITE.gamesUrl}/assets/shared/platform.js" defer></script>
</body>
</html>`;
}

function stripGameForClient(g) {
  return {
    slug: g.slug,
    title: g.title,
    shortTitle: g.shortTitle,
    shortDesc: g.shortDesc,
    icon: g.icon,
    category: g.category,
    type: g.type,
    tags: g.tags,
    emotions: g.emotions || [],
    color: g.color,
    colorSoft: g.colorSoft,
    thumbBg: g.thumbBg,
    badge: g.badge,
    trending: g.trending,
    featured: g.featured,
    popularity: g.popularity,
    duration: g.duration,
    questionsCount: g.questionsCount
  };
}

module.exports = { buildCategoryPage };
