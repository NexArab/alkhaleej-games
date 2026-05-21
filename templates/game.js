/**
 * Game page template builder.
 * Receives a single game + the full data set (for related engine).
 * Returns a complete HTML page using the SAME design system as the original template.
 */

const {
  navbarHtml, footerHtml, mobileBottomNavHtml, shareModalHtml,
  chatCtaBannerHtml, SITE, escapeHtml, escapeAttr, formatPlaysBadge
} = require('./partials');
const { gameCardHtml } = require('./homepage');
const { relatedGames: computeRelated } = require('../scripts/build-related.js');

/**
 * Related games — uses the shared engine (handles forceRelated, viralScore, seasonal).
 */
function relatedGames(current, all, limit = 4, data = {}) {
  return computeRelated(current, all, { limit, seasons: data.seasons || {} });
}

/**
 * Build the head <title> + meta + schema for a single game.
 */
function buildHead(game, site) {
  const url = `${site.url}/${game.slug}/`;
  const og = game.ogImage || `${site.url}/images/${game.slug}-og.webp` || site.defaultOg;
  const title = `${game.title} | ألعاب شات الخليج`;
  const desc = game.description;
  const keywords = (game.tags || []).concat(['شات الخليج', 'العاب', 'اختبارات']).join(', ');

  const schemaGame = {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": game.title,
    "description": game.description,
    "url": url,
    "image": og,
    "author": { "@type": "Organization", "name": "شات الخليج", "url": SITE.chatUrl },
    "inLanguage": "ar",
    "applicationCategory": "Game",
    "genre": game.category
  };
  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "الرئيسية", "item": `${SITE.chatUrl}/` },
      { "@type": "ListItem", "position": 2, "name": "الألعاب", "item": `${site.url}/` },
      { "@type": "ListItem", "position": 3, "name": game.title, "item": url }
    ]
  };
  const schemaFaq = game.faq && game.faq.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": game.faq.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  } : null;

  const schemas = [schemaGame, schemaBreadcrumb, schemaFaq].filter(Boolean);

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="${game.color || '#0284C7'}">

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(desc)}">
  <meta name="keywords" content="${escapeAttr(keywords)}">
  <link rel="canonical" href="${url}">

  <meta property="og:title" content="${escapeAttr(game.title)} | شات الخليج">
  <meta property="og:description" content="${escapeAttr(desc)}">
  <meta property="og:image" content="${og}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ألعاب شات الخليج">
  <meta property="og:locale" content="ar_SA">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@chatalkhaleej">
  <meta name="twitter:title" content="${escapeAttr(game.title)} | شات الخليج">
  <meta name="twitter:description" content="${escapeAttr(desc)}">
  <meta name="twitter:image" content="${og}">

  <link rel="icon" type="image/webp" href="${SITE.logo}">
  <link rel="apple-touch-icon" href="${SITE.logo}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/assets/shared/styles.css">
  <link rel="stylesheet" href="/assets/shared/game-page.css">

  ${schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ')}
  `;
}

/**
 * Build the full game page HTML.
 * @param {object} game - the game object
 * @param {object} data - the full data set (for related games + popular footer)
 */
function buildGamePage(game, data) {
  const site = data.site || {};
  const related = relatedGames(game, data.games, 4, data);
  const popularFooter = [...data.games]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 4);
  const category = (data.categories || []).find(c => c.slug === game.category) || null;

  // Next-game chain card — pre-rendered server-side (SEO + instant paint).
  // Marked with data-personalize so platform.js can swap it client-side
  // when the user has enough play history.
  const nextGame = related[0] || null;
  const nextGameCardHtml = nextGame ? `
    <div class="next-game-chain" id="nextGameChain"
         data-personalize="next-game"
         data-current-slug="${escapeAttr(game.slug)}"
         data-track="next_game_view" data-track-props='${JSON.stringify({from:game.slug, to:nextGame.slug})}'>
      <div class="next-game-label">🎯 جرّب اللعبة الجاية</div>
      <a href="/${nextGame.slug}/" class="next-game-card" data-track="next_game_click" data-track-props='${JSON.stringify({from:game.slug, to:nextGame.slug})}' style="--game-color:${escapeAttr(nextGame.color)};--game-color-soft:${escapeAttr(nextGame.colorSoft)}">
        <div class="next-game-icon" style="background:${escapeAttr(nextGame.colorSoft)};color:${escapeAttr(nextGame.color)}">${nextGame.icon}</div>
        <div class="next-game-info">
          <span class="next-game-title">${escapeHtml(nextGame.title)}</span>
          <span class="next-game-desc">${escapeHtml(nextGame.shortDesc || nextGame.description || '')}</span>
          <span class="next-game-meta">
            <span>${escapeHtml(formatPlaysBadge(nextGame.plays))} لعبوها</span>
            <span class="meta-sep">·</span>
            <span>${escapeHtml(nextGame.duration || '')}</span>
          </span>
        </div>
        <span class="next-game-arrow" aria-hidden="true">←</span>
      </a>
    </div>
  ` : '';

  // Sidebar related items — also personalizable client-side
  const sidebarRelated = related.map(g => `
    <a href="/${g.slug}/" class="related-game-item">
      <div class="related-game-icon" style="background:${g.colorSoft};color:${g.color}">${g.icon}</div>
      <div class="related-game-info">
        <span class="related-game-name">${escapeHtml(g.shortTitle || g.title)}</span>
        <span class="related-game-plays">${escapeHtml(formatPlaysBadge(g.plays))} لعبة</span>
      </div>
    </a>`).join('');

  const head = buildHead(game, site);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>${head}</head>
<body data-theme="light" style="--game-color:${game.color || '#0284C7'};--game-color-soft:${game.colorSoft || '#F0F9FF'}">

  <div class="toast-container" id="toastContainer" aria-live="polite"></div>

  ${navbarHtml('games')}

  <div class="breadcrumb-inner">
    <nav class="breadcrumb" aria-label="مسار التنقل">
      <a href="${SITE.chatUrl}/">الرئيسية</a>
      <span class="breadcrumb-sep">›</span>
      <a href="${site.url}/">الألعاب</a>
      ${category ? `<span class="breadcrumb-sep">›</span><a href="/${category.slug}/">${escapeHtml(category.name)}</a>` : ''}
      <span class="breadcrumb-sep">›</span>
      <span class="current">${escapeHtml(game.shortTitle || game.title)}</span>
    </nav>
  </div>

  <section class="hero" aria-labelledby="game-title">
    <div class="hero-inner">
      <div class="hero-badge">
        <span>🔥</span>
        <span>${escapeHtml(game.badge || (category ? category.name : 'لعبة'))}</span>
      </div>
      <div class="hero-icon-wrap" style="background:${game.color}">${game.icon}</div>
      <h1 id="game-title">${escapeHtml(game.title)}</h1>
      ${Array.isArray(game.hooks) && game.hooks.length ? `
      <div class="hero-hook" id="heroHook" data-hooks='${escapeAttr(JSON.stringify(game.hooks))}'>${escapeHtml(game.hooks[0])}</div>
      ` : ''}
      <p>${escapeHtml(game.description)}</p>
      <div class="hero-actions">
        <button class="btn-primary" onclick="GameTemplate.startGame()" data-track="hero_start_click">ابدأ الآن</button>
        <button class="btn-secondary" onclick="CAK.Share.open()" data-track="hero_share_click">شارك</button>
      </div>
      <div class="hero-stats-inline">
        <span><strong>${escapeHtml(formatPlaysBadge(game.plays))}</strong> لاعب</span>
        <span class="stats-sep"></span>
        <span><strong>${game.questionsCount || (game.questions || []).length}</strong> أسئلة</span>
        <span class="stats-sep"></span>
        <span><strong>${escapeHtml(game.duration || '3 د')}</strong></span>
        ${game.difficulty ? `<span class="stats-sep"></span><span class="difficulty-badge difficulty-${escapeAttr(game.difficulty)}">${escapeHtml(({easy:'سهل',medium:'متوسط',hard:'صعب'})[game.difficulty] || game.difficulty)}</span>` : ''}
      </div>
    </div>
  </section>

  <div class="page-layout">

    <div class="main-col">

      <!-- GAME BOX -->
      <section class="game-box" id="gameBox" aria-label="منطقة اللعبة">
        <div class="game-box-header">
          <div class="game-progress-wrap">
            <div class="game-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
              <div class="game-progress-fill" id="progressFill"></div>
            </div>
            <span class="game-step-label" id="stepLabel">1 / ${(game.questions || []).length}</span>
          </div>
          <div class="game-timer" id="gameTimer">⏱ <span id="timerVal">0:00</span></div>
        </div>

        <div id="startScreen" class="start-screen">
          <div class="start-screen-icon">🎮</div>
          <h2>جاهز تبدأ؟</h2>
          <p>أجب على الأسئلة واكتشف نتيجتك</p>
          <button class="btn-primary" onclick="GameTemplate.startGame()">ابدأ اللعبة</button>
        </div>

        <div id="questionScreen" class="hidden question-screen">
          <div class="question-section">
            <p class="question-num" id="questionNum">السؤال ١</p>
            <h2 class="question-text" id="questionText"></h2>
          </div>
          <div class="options-grid" id="optionsGrid" role="group" aria-label="الإجابات"></div>
          <div class="game-nav">
            <button class="btn-skip" onclick="GameTemplate.skipQuestion()">تخطي</button>
            <button class="btn-next" id="nextBtn" onclick="GameTemplate.nextQuestion()" disabled>التالي ←</button>
          </div>
        </div>

        <div id="loadingScreen" class="hidden loading-screen">
          <div class="loading-dots"><span></span><span></span><span></span></div>
          <p>جاري تحليل إجاباتك...</p>
        </div>
      </section>

      <!-- RESULT -->
      <section class="result-card" id="resultCard" aria-label="النتيجة">
        <div class="result-confetti">🎉</div>
        <div class="result-score-ring">
          <span class="result-score-num" id="resultScoreNum">0%</span>
        </div>
        <h2 class="result-title" id="resultTitle"></h2>
        <p class="result-desc" id="resultDesc"></p>
        <div class="result-tags" id="resultTags"></div>
          <div class="result-rarity-slot" id="resultRarity"></div>

        <div class="share-box">
          <p class="share-title" id="resultCta">شارك نتيجتك مع أصدقائك</p>
          <button class="btn-primary" style="margin-top:6px" onclick="GameTemplate.shareResult()" data-track="result_share_click">📤 شارك النتيجة</button>
        </div>

        ${nextGameCardHtml}

        <div class="result-actions">
          <button class="btn-secondary" onclick="GameTemplate.restartGame()" data-track="result_restart_click">العب مرة أخرى</button>
          <a href="${site.url}/" class="btn-secondary" data-track="result_explore_click">ألعاب أخرى</a>
        </div>
        ${game.replayReason ? `<p class="replay-reason" id="replayReason">${escapeHtml(game.replayReason)}</p>` : ''}
      </section>

      <!-- CTA -->
      <div class="cta-section">
        <div class="cta-content">
          <h3>جرّب شات الخليج 🌊</h3>
          <p>منصة الدردشة العربية الأكبر — تعرّف وتحدّث مع الآلاف</p>
        </div>
        <a href="${SITE.chatUrl}/" class="btn-cta-main" target="_blank" rel="noopener" data-track="chat_cta_click">دخول الشات</a>
      </div>

    </div>

    <!-- SIDEBAR -->
    <aside class="sidebar-col">

      <div class="sidebar-card">
        <h3 class="sidebar-card-title">🎮 ألعاب مشابهة</h3>
        <div id="sidebarRelated">${sidebarRelated}</div>
      </div>

      <div class="sidebar-cta">
        <img src="${SITE.logo}" alt="شات الخليج" width="120" height="28">
        <h3>تحدى أصدقاءك</h3>
        <p>شارك الألعاب على شات الخليج</p>
        <a href="${SITE.chatUrl}/" target="_blank" rel="noopener">دخول الآن</a>
      </div>

    </aside>
  </div>

  <!-- RELATED FULL CARDS -->
  <section class="section-block" aria-labelledby="related-title">
    <div class="section-header">
      <div class="section-title-wrap">
        <span class="section-title-icon">🎯</span>
        <h2 class="section-title" id="related-title">ألعاب قد تعجبك</h2>
      </div>
      <a href="${site.url}/" class="section-link">عرض الكل ←</a>
    </div>
    <div class="games-grid" id="relatedGrid" data-personalize="related-grid" data-current-slug="${escapeAttr(game.slug)}">
      ${related.map(g => gameCardHtml(g)).join('')}
    </div>
  </section>

  <!-- FAQ -->
  ${(game.faq && game.faq.length) ? `
  <section class="faq-section">
    <div class="section-header" style="padding:0">
      <h2 class="section-title">الأسئلة الشائعة</h2>
    </div>
    <div id="faqList">
      ${game.faq.map(f => `
        <div class="faq-item">
          <button class="faq-q" onclick="CAK.toggleFaq(this)">
            ${escapeHtml(f.q)}
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-a"><div class="faq-a-inner">${escapeHtml(f.a)}</div></div>
        </div>
      `).join('')}
    </div>
  </section>` : ''}

  <!-- SEO -->
  ${game.seo ? `
  <section class="seo-section">
    <div class="seo-content">
      <h2>${escapeHtml(game.seo.mainTitle || ('عن ' + game.title))}</h2>
      <div class="seo-columns">
        <div>
          <h3>ما هي هذه اللعبة؟</h3>
          <p>${escapeHtml(game.seo.about || game.description)}</p>
          <h3>لماذا تلعبها؟</h3>
          <p>طريقة ممتعة لمعرفة نفسك ومشاركة النتائج مع أصدقائك.</p>
        </div>
        <div>
          <h3>نصائح لنتيجة أفضل</h3>
          <p>أجب بصدق دون تفكير طويل. الإجابة الأولى عادةً هي الأصدق.</p>
          <h3>شارك مع أصدقائك</h3>
          <p>تحدّى أصدقاءك وقارن نتائجكم على شات الخليج.</p>
        </div>
      </div>
    </div>
  </section>` : ''}

  <div class="section-block">${chatCtaBannerHtml('full')}</div>

  ${footerHtml(popularFooter)}
  ${mobileBottomNavHtml('games')}
  ${shareModalHtml()}

  <!-- GAME CONFIG -->
  <script id="game-config" type="application/json">${JSON.stringify({
    id: game.slug,
    slug: game.slug,
    title: game.title,
    description: game.description,
    icon: game.icon,
    color: game.color,
    colorSoft: game.colorSoft,
    url: `${site.url}/${game.slug}/`,
    ogImage: game.ogImage || `${site.url}/images/${game.slug}-og.webp`,
    shareText: game.shareText || `🎮 جرّب ${game.title} على شات الخليج!`,
    questions: game.questions || [],
    results: game.results || [],
    // Phase 3 enrichment used at runtime
    tone: game.tone || null,
    difficulty: game.difficulty || null,
    viralScore: game.viralScore || null,
    completionRate: game.completionRate || null,
    status: game.status || 'active',
    hooks: game.hooks || [],
    replayReason: game.replayReason || null,
    systemTags: game.systemTags || [],
    audience: game.audience || null
  })}</script>

  <!-- Data for client-side search + personalized related (lightweight subset) -->
  <script id="games-data" type="application/json">${JSON.stringify(data.games.map(g => ({
    slug: g.slug,
    title: g.title,
    shortTitle: g.shortTitle,
    description: g.description,
    shortDesc: g.shortDesc,
    icon: g.icon,
    category: g.category,
    type: g.type || null,
    tags: g.tags || [],
    emotions: g.emotions || [],
    difficulty: g.difficulty || null,
    tone: g.tone || null,
    color: g.color,
    colorSoft: g.colorSoft,
    plays: g.plays || 0,
    popularity: g.popularity || 0,
    duration: g.duration || ''
  })))}</script>

  <script>
    window.__PAGE_TYPE__ = 'game';
    window.__GAME_SLUG__ = ${JSON.stringify(game.slug)};
    window.__GAME_TITLE__ = ${JSON.stringify(game.title)};
    window.__CATEGORY__ = ${category ? JSON.stringify({ slug: category.slug, name: category.name }) : 'null'};
  </script>
  <script src="/assets/shared/analytics.js"></script>
  <script src="/assets/shared/platform.js"></script>
  <script src="/assets/shared/game-engine.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      try {
        const cfg = JSON.parse(document.getElementById('game-config').textContent);
        const allGames = JSON.parse(document.getElementById('games-data').textContent);
        CAK.Search.init(allGames);
        GameTemplate.init(cfg);
        // Personalize related sections from history BEFORE recording this
        // visit, so the current game doesn't pollute its own recommendations.
        CAK.Personalizer.init(allGames);
        CAK.Recent.push(cfg.slug);
      } catch (e) { console.error(e); }
    });
  </script>

</body>
</html>`;
}

module.exports = { buildGamePage, relatedGames };
