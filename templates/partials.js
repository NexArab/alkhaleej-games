/**
 * Shared HTML partials used by the build script.
 * Pure functions: state → HTML string.
 */

const SITE = {
  chatUrl: 'https://chat-alkhaleej.com',
  toolsUrl: 'https://tools.chat-alkhaleej.com',
  blogUrl: 'https://blog.chat-alkhaleej.com',
  roomsUrl: 'https://chat-alkhaleej.com/rooms/',
  gamesUrl: 'https://games.chat-alkhaleej.com',
  logo: 'https://tools.chat-alkhaleej.com/logo.webp'
};

/**
 * Top navbar with mobile menu.
 * @param {string} activeKey - 'home' | 'games' | 'tools' | 'blog' | 'rooms'
 */
function navbarHtml(activeKey = 'games') {
  const cls = (k) => `nav-link${activeKey === k ? ' active' : ''}`;
  return `
  <header class="navbar" id="navbar" role="banner">
    <div class="nav-inner">
      <a href="${SITE.chatUrl}/" class="nav-logo" aria-label="شات الخليج">
        <img src="${SITE.logo}" alt="شات الخليج" width="30" height="30">
        <span class="nav-logo-text">شات الخليج</span>
      </a>

      <nav class="nav-links" role="navigation">
        <a href="${SITE.chatUrl}/" class="${cls('home')}">الرئيسية</a>
        <a href="${SITE.gamesUrl}/" class="${cls('games')}">الألعاب</a>
        <a href="${SITE.toolsUrl}/" class="${cls('tools')}">الأدوات</a>
        <a href="${SITE.blogUrl}/" class="${cls('blog')}">المدونة</a>
        <a href="${SITE.roomsUrl}" class="${cls('rooms')}">الغرف</a>
        <a href="${SITE.chatUrl}/" class="nav-link nav-cta">دخول الشات</a>
      </nav>

      <div class="nav-actions">
        <button class="btn-theme" id="themeToggle" aria-label="تبديل المظهر">🌙</button>
        <button class="nav-hamburger" id="menuToggle" aria-label="القائمة" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <nav class="mobile-menu" id="mobileMenu">
      <a href="${SITE.chatUrl}/" class="${cls('home')}">الرئيسية</a>
      <a href="${SITE.gamesUrl}/" class="${cls('games')}">الألعاب</a>
      <a href="${SITE.toolsUrl}/" class="${cls('tools')}">الأدوات</a>
      <a href="${SITE.blogUrl}/" class="${cls('blog')}">المدونة</a>
      <a href="${SITE.roomsUrl}" class="${cls('rooms')}">غرف الدردشة</a>
      <a href="${SITE.chatUrl}/" class="nav-link nav-cta" style="text-align:center;margin-top:6px">دخول الشات</a>
    </nav>
  </header>`;
}

/**
 * Footer with top columns + bottom bar.
 * @param {Array} popularGames - up to 4 game objects for the footer
 */
function footerHtml(popularGames = []) {
  const popular = popularGames.slice(0, 4).map(g => `<li><a href="${SITE.gamesUrl}/${g.slug}/">${g.shortTitle || g.title}</a></li>`).join('');
  const year = new Date().getFullYear();
  return `
  <footer class="footer" role="contentinfo">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="${SITE.logo}" alt="شات الخليج" width="30" height="30">
          <p>منصة شات الخليج — ألعاب، اختبارات، وغرف دردشة تربطك بملايين المستخدمين.</p>
        </div>
        <div>
          <p class="footer-col-title">المنصة</p>
          <ul class="footer-links">
            <li><a href="${SITE.chatUrl}/">شات الخليج</a></li>
            <li><a href="${SITE.gamesUrl}/">الألعاب</a></li>
            <li><a href="${SITE.toolsUrl}/">الأدوات</a></li>
            <li><a href="${SITE.blogUrl}/">المدونة</a></li>
          </ul>
        </div>
        <div>
          <p class="footer-col-title">ألعاب شائعة</p>
          <ul class="footer-links">${popular}</ul>
        </div>
        <div>
          <p class="footer-col-title">الدعم</p>
          <ul class="footer-links">
            <li><a href="${SITE.chatUrl}/support/">الدعم</a></li>
            <li><a href="${SITE.chatUrl}/privacy/">الخصوصية</a></li>
            <li><a href="${SITE.chatUrl}/terms/">الشروط</a></li>
            <li><a href="${SITE.chatUrl}/about/">عن المنصة</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="footer-copy">© ${year} شات الخليج</p>
        <div class="footer-legal">
          <a href="${SITE.chatUrl}/privacy/">الخصوصية</a>
          <a href="${SITE.chatUrl}/terms/">الشروط</a>
        </div>
      </div>
    </div>
  </footer>`;
}

/**
 * Mobile bottom nav.
 * @param {string} activeKey - 'home' | 'games' | 'tools' | 'rooms' | 'chat'
 */
function mobileBottomNavHtml(activeKey = 'games') {
  const cls = (k) => `mobile-nav-btn${activeKey === k ? ' active' : ''}`;
  return `
  <nav class="mobile-bottom-nav">
    <div class="mobile-bottom-nav-inner">
      <a href="${SITE.chatUrl}/" class="${cls('home')}"><span>🏠</span>الرئيسية</a>
      <a href="${SITE.gamesUrl}/" class="${cls('games')}"><span>🎮</span>الألعاب</a>
      <a href="${SITE.toolsUrl}/" class="${cls('tools')}"><span>🛠</span>الأدوات</a>
      <a href="${SITE.roomsUrl}" class="${cls('rooms')}"><span>💬</span>الدردشة</a>
      <a href="${SITE.chatUrl}/" class="${cls('chat')}"><span>🌊</span>شات</a>
    </div>
  </nav>`;
}

/**
 * Floating share button + share modal.
 * Modal contains 7 platforms + native + copy link.
 */
function shareModalHtml() {
  return `
  <button class="float-share-btn" onclick="CAK.Share.open()" aria-label="مشاركة">📤</button>

  <div class="modal-overlay" id="shareModal" role="dialog" aria-modal="true" aria-labelledby="shareModalTitle">
    <div class="modal-box">
      <button class="modal-close" onclick="CAK.Share.close()" aria-label="إغلاق">✕</button>
      <h3 class="modal-title" id="shareModalTitle">شارك مع أصدقائك</h3>
      <p class="modal-subtitle">انشر اللعبة وتحدّى أصحابك</p>

      <div class="share-platforms">
        <button class="share-platform" onclick="CAK.Share.to('whatsapp')" aria-label="واتساب">
          <div class="share-platform-icon" style="background:#25D366">
            <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </div>
          <span class="share-platform-label">واتساب</span>
        </button>

        <button class="share-platform" onclick="CAK.Share.to('twitter')" aria-label="إكس / تويتر">
          <div class="share-platform-icon" style="background:#0F1419">
            <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </div>
          <span class="share-platform-label">إكس</span>
        </button>

        <button class="share-platform" onclick="CAK.Share.to('telegram')" aria-label="تيليجرام">
          <div class="share-platform-icon" style="background:#26A5E4">
            <svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </div>
          <span class="share-platform-label">تيليجرام</span>
        </button>

        <button class="share-platform" onclick="CAK.Share.to('snapchat')" aria-label="سناب شات">
          <div class="share-platform-icon" style="background:#FFFC00;color:#000">
            <svg viewBox="0 0 24 24"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.122-.015-.182-.015h-.106c-1.467 0-2.426-.69-3.279-1.288-.599-.42-1.107-.779-1.722-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>
          </div>
          <span class="share-platform-label">سناب</span>
        </button>

        <button class="share-platform" onclick="CAK.Share.to('instagram')" aria-label="انستغرام">
          <div class="share-platform-icon" style="background:linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)">
            <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
          <span class="share-platform-label">انستغرام</span>
        </button>

        <button class="share-platform" onclick="CAK.Share.to('chat')" aria-label="شات الخليج">
          <div class="share-platform-icon" style="background:#0284C7">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          </div>
          <span class="share-platform-label">شات الخليج</span>
        </button>

        <button class="share-platform" onclick="CAK.Share.to('native')" aria-label="مشاركة عبر الجهاز">
          <div class="share-platform-icon" style="background:var(--surface-3);color:var(--text-1)">
            <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
          </div>
          <span class="share-platform-label">المزيد</span>
        </button>

        <button class="share-platform" onclick="CAK.Share.to('copy')" aria-label="نسخ الرابط">
          <div class="share-platform-icon" style="background:var(--surface-3);color:var(--text-1)">
            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </div>
          <span class="share-platform-label">نسخ الرابط</span>
        </button>
      </div>

      <div class="share-row">
        <input type="text" id="shareLinkInput" readonly value="">
        <button onclick="CAK.Share.copyLink()">نسخ</button>
      </div>
    </div>
  </div>`;
}

/**
 * Head meta tags + schema.org markup.
 * @param {object} opts - { title, description, url, ogImage, keywords, schema }
 */
function metaHeadHtml(opts) {
  const o = opts || {};
  const title = o.title || 'ألعاب شات الخليج';
  const desc = o.description || 'منصة ألعاب واختبارات شات الخليج.';
  const url = o.url || SITE.gamesUrl + '/';
  const og = o.ogImage || (SITE.gamesUrl + '/images/og-default.webp');
  const keywords = o.keywords || 'العاب, اختبارات, شات الخليج';
  const schemaJson = o.schema ? JSON.stringify(o.schema) : '';

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0284C7">

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(desc)}">
  <meta name="keywords" content="${escapeAttr(keywords)}">
  <link rel="canonical" href="${url}">

  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(desc)}">
  <meta property="og:image" content="${og}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ألعاب شات الخليج">
  <meta property="og:locale" content="ar_SA">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@chatalkhaleej">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(desc)}">
  <meta name="twitter:image" content="${og}">

  <link rel="icon" type="image/webp" href="${SITE.logo}">
  <link rel="apple-touch-icon" href="${SITE.logo}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/assets/shared/styles.css">
  ${schemaJson ? `<script type="application/ld+json">${schemaJson}</script>` : ''}
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

// 12000 → "12K", 1500000 → "1.5M"
function formatPlays(n) {
  n = Number(n) || 0;
  if (n < 1000) return String(n);
  if (n < 1000000) {
    const k = n / 1000;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K';
  }
  const m = n / 1000000;
  return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
}
// 12000 → "+12K"
function formatPlaysBadge(n) {
  n = Number(n) || 0;
  return n >= 1000 ? '+' + formatPlays(n) : String(n || 0);
}

/**
 * Chat Al-Khaleej CTA banner.
 * A prominent, recurring call-to-action driving users into the chat.
 * Drop it into any page (homepage, game page, category page).
 *
 * @param {string} variant - 'full' (default) or 'compact'
 */
function chatCtaBannerHtml(variant = 'full') {
  if (variant === 'compact') {
    return `
  <a href="${SITE.chatUrl}/" class="chat-cta chat-cta--compact" data-track="chat_cta_click" data-track-props='{"location":"banner-compact"}'>
    <span class="chat-cta__icon">🌊</span>
    <span class="chat-cta__text">دخول شات الخليج — تعرّف على أصدقاء جدد</span>
    <span class="chat-cta__arrow" aria-hidden="true">‹</span>
  </a>`;
  }
  return `
  <section class="chat-cta chat-cta--full" aria-label="دخول شات الخليج">
    <div class="chat-cta__body">
      <span class="chat-cta__icon">🌊</span>
      <div class="chat-cta__copy">
        <strong class="chat-cta__title">شات الخليج — دردشة بدون تسجيل</strong>
        <span class="chat-cta__sub">انضم لآلاف المستخدمين الآن، تعرّف على أصدقاء جدد ودردش مباشرة.</span>
      </div>
    </div>
    <a href="${SITE.chatUrl}/" class="chat-cta__btn" data-track="chat_cta_click" data-track-props='{"location":"banner-full"}'>
      دخول الشات ‹
    </a>
  </section>`;
}

module.exports = {
  SITE,
  navbarHtml,
  footerHtml,
  mobileBottomNavHtml,
  shareModalHtml,
  chatCtaBannerHtml,
  metaHeadHtml,
  escapeHtml,
  escapeAttr,
  formatPlays,
  formatPlaysBadge
};
