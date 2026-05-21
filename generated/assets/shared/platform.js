/* ═══════════════════════════════════════════════════════════
   CHAT AL-KHALEEJ GAMES — PLATFORM JS
   Shared: theme toggle, search, share, related engine, recently played
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ════════ THEME TOGGLE ════════ */
  const ThemeManager = {
    init() {
      const saved = localStorage.getItem('cak-theme') || 'light';
      document.body.setAttribute('data-theme', saved);
      this.updateBtn(saved);

      const btn = document.getElementById('themeToggle');
      if (btn) btn.addEventListener('click', () => this.toggle());
    },
    toggle() {
      const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('cak-theme', next);
      this.updateBtn(next);
    },
    updateBtn(theme) {
      const btn = document.getElementById('themeToggle');
      if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  };

  /* ════════ MOBILE MENU ════════ */
  const MenuManager = {
    init() {
      const toggle = document.getElementById('menuToggle');
      const menu = document.getElementById('mobileMenu');
      if (!toggle || !menu) return;

      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#navbar') && !e.target.closest('#mobileMenu') && !e.target.closest('#menuToggle')) {
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  };

  /* ════════ TOAST ════════ */
  function showToast(msg, type = 'info') {
    const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 200);
    }, 2200);
  }

  function tryVibrate(pattern) {
    if ('vibrate' in navigator) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  /* ════════ SHARE SYSTEM ════════ */
  const ShareManager = {
    /**
     * Open share modal.
     * @param {object} opts - { title, text, url, resultText }
     */
    open(opts = {}) {
      const modal = document.getElementById('shareModal');
      if (!modal) return;

      const defaults = {
        title: document.title || 'ألعاب شات الخليج',
        text: '🎮 جرّب هذه اللعبة على شات الخليج!',
        url: window.location.href,
        resultText: ''
      };
      this.current = Object.assign({}, defaults, opts);

      const linkInput = document.getElementById('shareLinkInput');
      if (linkInput) linkInput.value = this.current.url;

      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    },

    close() {
      const modal = document.getElementById('shareModal');
      if (!modal) return;
      modal.classList.remove('open');
      document.body.style.overflow = '';
    },

    buildText() {
      const c = this.current || {};
      const result = c.resultText ? `${c.resultText}\n\n` : '';
      return `${result}${c.text}\n${c.url}`;
    },

    /**
     * Share to platform.
     * Platforms: whatsapp, twitter, telegram, snapchat, instagram, chat, copy, native
     */
    to(platform) {
      const c = this.current || { url: window.location.href, text: 'ألعاب شات الخليج' };
      const text = encodeURIComponent(this.buildText());
      const url = encodeURIComponent(c.url);
      const title = encodeURIComponent(c.title || '');

      // Track every share intent — this is gold for understanding what travels
      try {
        if (window.CAK && window.CAK.track) {
          window.CAK.track('share_click', {
            platform: platform,
            game: window.__GAME_SLUG__ || null,
            page_type: window.__PAGE_TYPE__ || null,
            has_result: !!(c.text && c.text.includes('نتيجتي'))
          });
        }
      } catch (e) {}

      const urls = {
        whatsapp: `https://wa.me/?text=${text}`,
        twitter:  `https://twitter.com/intent/tweet?text=${text}`,
        telegram: `https://t.me/share/url?url=${url}&text=${text}`,
        // Snapchat & Instagram لا تدعمان روابط مشاركة ويب مباشرة — نسخ رابط + توجيه
        snapchat: `https://www.snapchat.com/scan?attachmentUrl=${url}`,
        // مشاركة داخل شات الخليج عبر deep-link
        chat:     `https://chat-alkhaleej.com/share/`
      };

      if (platform === 'copy') {
        this.copyLink();
        return;
      }
      if (platform === 'native') {
        this.native();
        return;
      }
      if (platform === 'instagram') {
        // انستغرام: انسخ + افتح التطبيق
        this.copyLink('تم نسخ الرابط — افتح انستغرام والصق الرابط في القصة');
        // محاولة فتح التطبيق على الموبايل
        setTimeout(() => {
          window.location.href = 'instagram://story-camera';
        }, 600);
        return;
      }

      if (urls[platform]) {
        window.open(urls[platform], '_blank', 'noopener,noreferrer');
        tryVibrate(5);
        this.close();
      }
    },

    copyLink(msg = 'تم نسخ الرابط') {
      const c = this.current || { url: window.location.href };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(c.url)
          .then(() => { showToast(msg, 'success'); tryVibrate(5); })
          .catch(() => this._fallbackCopy(c.url, msg));
      } else {
        this._fallbackCopy(c.url, msg);
      }
    },

    _fallbackCopy(text, msg) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showToast(msg, 'success'); }
      catch (e) { showToast('فشل النسخ', 'error'); }
      document.body.removeChild(ta);
    },

    /** Web Share API — for mobile */
    native() {
      const c = this.current || {};
      if (navigator.share) {
        navigator.share({
          title: c.title,
          text: c.text,
          url: c.url
        }).then(() => this.close()).catch(() => {});
      } else {
        this.copyLink('متصفّحك لا يدعم المشاركة المباشرة — تم نسخ الرابط');
      }
    },

    init() {
      const modal = document.getElementById('shareModal');
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === e.currentTarget) this.close();
        });
      }
    }
  };

  /* ════════ SEARCH (homepage / global) ════════ */
  const SearchManager = {
    games: [],

    init(games) {
      this.games = games || [];
      const input = document.getElementById('searchInput');
      const results = document.getElementById('searchResults');
      if (!input || !results) return;

      let timer = null;
      input.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => this.search(e.target.value), 90);
      });
      input.addEventListener('focus', (e) => {
        if (e.target.value.trim()) this.search(e.target.value);
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrap')) results.classList.remove('open');
      });
    },

    search(query) {
      const results = document.getElementById('searchResults');
      const q = (query || '').trim().toLowerCase();
      if (!q) { results.classList.remove('open'); results.innerHTML = ''; return; }

      const matches = this.games.filter(g => {
        const haystack = [
          g.title || '',
          g.shortTitle || '',
          g.description || '',
          (g.tags || []).join(' '),
          g.category || ''
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      }).slice(0, 8);

      if (matches.length === 0) {
        results.innerHTML = `<div class="search-empty">لا توجد نتائج لـ "${this._escape(query)}"</div>`;
      } else {
        results.innerHTML = matches.map(g => `
          <a href="/${g.slug}/" class="search-result-item">
            <div class="search-result-icon" style="background:${g.colorSoft};color:${g.color}">${g.icon}</div>
            <div class="search-result-info">
              <div class="search-result-title">${this._escape(g.title)}</div>
              <div class="search-result-meta">${this._escape(g.shortDesc || g.description || '')}</div>
            </div>
          </a>
        `).join('');
      }
      results.classList.add('open');
    },

    _escape(s) {
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
  };

  /* ════════ RECENTLY PLAYED (localStorage) ════════ */
  const RecentlyPlayed = {
    KEY: 'cak-recent-games',
    MAX: 8,

    push(slug) {
      try {
        const list = this.get();
        const filtered = list.filter(s => s !== slug);
        filtered.unshift(slug);
        localStorage.setItem(this.KEY, JSON.stringify(filtered.slice(0, this.MAX)));
      } catch (e) {}
    },

    get() {
      try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
      catch (e) { return []; }
    },

    clear() { localStorage.removeItem(this.KEY); }
  };

  /* ════════ RELATED GAMES ENGINE ════════ */
  /**
   * Compute relatedness score between current game and candidate.
   * Weighting:
   *  - same category: +10
   *  - shared tag: +3 per tag
   *  - same type: +2
   *  - popularity tiebreaker: +pop/20
   */
  const RelatedEngine = {
    compute(current, allGames, limit = 4) {
      if (!current || !Array.isArray(allGames)) return [];
      return allGames
        .filter(g => g.slug !== current.slug)
        .map(g => {
          let score = 0;
          if (g.category === current.category) score += 10;
          const currTags = new Set(current.tags || []);
          (g.tags || []).forEach(t => { if (currTags.has(t)) score += 3; });
          if (g.type === current.type) score += 2;
          const currEmotions = new Set(current.emotions || []);
          (g.emotions || []).forEach(e => { if (currEmotions.has(e)) score += 4; });
          score += (g.popularity || 0) / 20;
          return { game: g, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.game);
    },

    /**
     * Personalized recommendation.
     * Builds a taste profile from the user's recently-played games
     * (categories + emotions + tags they keep choosing), then scores
     * every candidate against BOTH the current game and that profile.
     *
     * @param {object}   current      - the game currently being viewed
     * @param {string[]} recentSlugs  - slugs from CAK.Recent.get()
     * @param {object[]} allGames     - full games dataset
     * @param {number}   limit
     * @returns {object[]} ranked games (most relevant first)
     */
    computePersonalized(current, recentSlugs, allGames, limit = 4) {
      if (!current || !Array.isArray(allGames)) return [];

      // Resolve recent slugs to game objects (skip the current game itself)
      const recentGames = (recentSlugs || [])
        .map(slug => allGames.find(g => g.slug === slug))
        .filter(g => g && g.slug !== current.slug);

      // Build a weighted taste profile — more recent = heavier weight
      const catWeight = {}, emoWeight = {}, tagWeight = {};
      recentGames.forEach((g, i) => {
        const recencyWeight = Math.max(1, recentGames.length - i); // newest first
        if (g.category) catWeight[g.category] = (catWeight[g.category] || 0) + recencyWeight;
        (g.emotions || []).forEach(e => { emoWeight[e] = (emoWeight[e] || 0) + recencyWeight; });
        (g.tags || []).forEach(t => { tagWeight[t] = (tagWeight[t] || 0) + recencyWeight; });
      });

      const recentSet = new Set(recentGames.map(g => g.slug));

      return allGames
        .filter(g => g.slug !== current.slug)
        .map(g => {
          let score = 0;

          // ── base relevance to the current game (same as compute()) ──
          if (g.category === current.category) score += 10;
          const currTags = new Set(current.tags || []);
          (g.tags || []).forEach(t => { if (currTags.has(t)) score += 3; });
          if (g.type === current.type) score += 2;
          const currEmotions = new Set(current.emotions || []);
          (g.emotions || []).forEach(e => { if (currEmotions.has(e)) score += 4; });
          score += (g.popularity || 0) / 20;

          // ── personalization bonus from the taste profile ──
          // Weighted strongly enough to override same-category bias when
          // the user shows a clear, repeated preference for another type.
          if (g.category && catWeight[g.category]) score += catWeight[g.category] * 4;
          (g.emotions || []).forEach(e => { if (emoWeight[e]) score += emoWeight[e] * 2.5; });
          (g.tags || []).forEach(t => { if (tagWeight[t]) score += tagWeight[t] * 1.5; });

          // ── penalty: already played recently (don't re-suggest) ──
          if (recentSet.has(g.slug)) score -= 100;

          return { game: g, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.game);
    },

    /** For homepage / when no current game — return trending or featured */
    fallback(allGames, limit = 4) {
      return [...allGames]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, limit);
    }
  };

  /* ════════ FAQ TOGGLE ════════ */
  function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  }

  /* ════════ LAZY LOAD IMAGES ════════ */
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;
    const lazyImages = document.querySelectorAll('img[data-src]');
    if (lazyImages.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '120px' });

    lazyImages.forEach(img => observer.observe(img));
  }

  /* ════════ GLOBAL INIT ════════ */
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    MenuManager.init();
    ShareManager.init();
    initLazyImages();
  });

  /* ════════ FORMAT HELPERS ════════ */
  const Format = {
    // 12000 → "12K", 1500000 → "1.5M", returns Arabic-friendly suffix
    plays(n) {
      n = Number(n) || 0;
      if (n < 1000) return String(n);
      if (n < 1000000) {
        const k = n / 1000;
        return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K';
      }
      const m = n / 1000000;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    },
    // 12000 → "+12K" for stat displays
    playsBadge(n) {
      n = Number(n) || 0;
      return n >= 1000 ? '+' + Format.plays(n) : String(n);
    },
    // 87 → "٨٧"
    arabicNum(n) {
      return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
  };

  /* ════════ FORMAT NODES ON LOAD ════════ */
  // Any element with data-format-plays="12000" gets formatted to "+12K"
  function formatPlaysNodes() {
    document.querySelectorAll('[data-format-plays]').forEach(el => {
      const n = parseInt(el.getAttribute('data-format-plays'), 10);
      el.textContent = Format.playsBadge(n);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', formatPlaysNodes);
  } else {
    formatPlaysNodes();
  }

  /* ════════ PERSONALIZER ════════
   * Upgrades server-rendered "related" sections into personalized ones
   * based on the user's play history (CAK.Recent), entirely client-side.
   *
   * The HTML ships with a static (SEO-friendly) recommendation. After
   * load, if the user has enough history, we silently swap it for a
   * personalized pick. New visitors / crawlers keep the static version.
   *
   * Elements opt in via:  data-personalize="next-game" | "related-grid"
   * and carry  data-current-slug="<slug>".
   */
  const Personalizer = {
    // Minimum games in history before we personalize at all
    MIN_HISTORY: 2,

    init(allGames) {
      if (!Array.isArray(allGames) || !allGames.length) return;

      const recent = (window.CAK && CAK.Recent) ? CAK.Recent.get() : [];
      // Not enough signal — leave the static server version untouched
      if (recent.length < this.MIN_HISTORY) return;

      const nodes = document.querySelectorAll('[data-personalize]');
      nodes.forEach(node => {
        const kind = node.getAttribute('data-personalize');
        const currentSlug = node.getAttribute('data-current-slug');
        const current = allGames.find(g => g.slug === currentSlug);
        if (!current) return;

        if (kind === 'next-game') {
          this.swapNextGame(node, current, recent, allGames);
        } else if (kind === 'related-grid') {
          this.swapRelatedGrid(node, current, recent, allGames);
        }
      });
    },

    swapNextGame(node, current, recent, allGames) {
      const picks = CAK.Related.computePersonalized(current, recent, allGames, 1);
      const pick = picks[0];
      if (!pick) return;

      const link = node.querySelector('.next-game-card');
      if (!link) return;

      // Don't bother if personalization landed on the same game
      const currentHref = link.getAttribute('href');
      if (currentHref === `/${pick.slug}/`) return;

      // Rewrite the card in place
      link.setAttribute('href', `/${pick.slug}/`);
      link.style.setProperty('--game-color', pick.color || '');
      link.style.setProperty('--game-color-soft', pick.colorSoft || '');

      const icon = link.querySelector('.next-game-icon');
      if (icon) {
        icon.textContent = pick.icon || '🎮';
        icon.style.background = pick.colorSoft || '';
        icon.style.color = pick.color || '';
      }
      const title = link.querySelector('.next-game-title');
      if (title) title.textContent = pick.title || '';
      const desc = link.querySelector('.next-game-desc');
      if (desc) desc.textContent = pick.shortDesc || pick.description || '';
      const metaSpans = link.querySelectorAll('.next-game-meta > span');
      if (metaSpans[0]) {
        metaSpans[0].textContent = Format.playsBadge(pick.plays || 0) + ' لعبوها';
      }
      if (metaSpans[2]) metaSpans[2].textContent = pick.duration || '';

      // Update tracking props + mark as personalized
      const props = JSON.stringify({ from: current.slug, to: pick.slug, personalized: true });
      node.setAttribute('data-track-props', props);
      link.setAttribute('data-track-props', props);
      node.setAttribute('data-personalized', '1');

      // Subtle label tweak so it feels tailored
      const label = node.querySelector('.next-game-label');
      if (label) label.textContent = '🎯 اخترنا لك';
    },

    swapRelatedGrid(node, current, recent, allGames) {
      const count = node.children.length || 4;
      const picks = CAK.Related.computePersonalized(current, recent, allGames, count);
      if (!picks.length) return;

      node.innerHTML = picks.map(g => this.cardHtml(g)).join('');
      node.setAttribute('data-personalized', '1');
    },

    // Mirrors the server-side gameCardHtml so the swapped cards look identical
    cardHtml(g) {
      const tag = (g.tags && g.tags.length) ? g.tags[0] : null;
      const esc = s => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      return `
        <a href="/${g.slug}/" class="gcard" aria-label="${esc(g.title)}" data-track="related_personalized_click" data-track-props='${JSON.stringify({to:g.slug})}'>
          <div class="gcard__thumb" style="background:${g.thumbBg || g.colorSoft}">
            <span class="gcard__icon" aria-hidden="true">${g.icon || '🎮'}</span>
          </div>
          <div class="gcard__body">
            <h3 class="gcard__title">${esc(g.shortTitle || g.title)}</h3>
            <div class="gcard__meta">
              <span class="gcard__plays">${esc(Format.playsBadge(g.plays || 0))}</span>
              ${tag ? `<span class="gcard__dot"></span><span class="gcard__tag">${esc(tag)}</span>` : ''}
            </div>
          </div>
        </a>`;
    }
  };

  /* ════════ EXPORT ════════ */
  window.CAK = {
    Theme: ThemeManager,
    Menu: MenuManager,
    Share: ShareManager,
    Search: SearchManager,
    Recent: RecentlyPlayed,
    Related: RelatedEngine,
    Personalizer,
    Format,
    toggleFaq,
    showToast,
    tryVibrate
  };
})();
