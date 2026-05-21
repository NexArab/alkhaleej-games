/**
 * Analytics — provider-agnostic event tracking.
 *
 * Goal: every meaningful interaction is captured so we can see what works.
 * The dispatcher tries (in order):
 *   1. window.gtag (Google Analytics 4)
 *   2. window.plausible (Plausible Analytics)
 *   3. window.umami (Umami)
 *   4. window.posthog (Posthog)
 *   5. Custom endpoint via navigator.sendBeacon to window.CAK_ANALYTICS_URL (if set)
 *   6. console.log (dev mode) — only if URL hash contains #debug
 *
 * Events queue until any provider is loaded, then flush.
 *
 * USAGE:
 *   CAK.track('game_start', { game: 'love-test' });
 *   CAK.track('game_finish', { game: 'love-test', result: 'romantic', score: 87 });
 *   CAK.track('share_click', { game: 'love-test', platform: 'whatsapp' });
 */
(function () {
  'use strict';

  const QUEUE = [];
  let flushed = false;
  const DEBUG = location.hash.includes('debug') || localStorage.getItem('cak-debug') === '1';

  // Session id — anonymous, lives for the tab session
  function getSessionId() {
    let sid = sessionStorage.getItem('cak-sid');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      sessionStorage.setItem('cak-sid', sid);
    }
    return sid;
  }

  // Anonymous user id — survives across sessions (no PII)
  function getUserId() {
    let uid = localStorage.getItem('cak-uid');
    if (!uid) {
      uid = 'u_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      localStorage.setItem('cak-uid', uid);
    }
    return uid;
  }

  function enrich(name, props) {
    return Object.assign({
      event: name,
      timestamp: Date.now(),
      session_id: getSessionId(),
      user_id: getUserId(),
      page: location.pathname,
      referrer: document.referrer || null,
      page_title: document.title
    }, props || {});
  }

  function dispatch(payload) {
    const name = payload.event;
    const props = Object.assign({}, payload);
    delete props.event;

    if (DEBUG) console.log('[analytics]', name, props);

    // GA4
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', name, props); } catch (e) {}
    }
    // Plausible
    if (typeof window.plausible === 'function') {
      try { window.plausible(name, { props }); } catch (e) {}
    }
    // Umami
    if (window.umami && typeof window.umami.track === 'function') {
      try { window.umami.track(name, props); } catch (e) {}
    }
    // Posthog
    if (window.posthog && typeof window.posthog.capture === 'function') {
      try { window.posthog.capture(name, props); } catch (e) {}
    }
    // Custom endpoint (set window.CAK_ANALYTICS_URL = 'https://...' to enable)
    if (window.CAK_ANALYTICS_URL && navigator.sendBeacon) {
      try {
        navigator.sendBeacon(
          window.CAK_ANALYTICS_URL,
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
      } catch (e) {}
    }
  }

  function hasProvider() {
    return (
      typeof window.gtag === 'function' ||
      typeof window.plausible === 'function' ||
      (window.umami && typeof window.umami.track === 'function') ||
      (window.posthog && typeof window.posthog.capture === 'function') ||
      !!window.CAK_ANALYTICS_URL ||
      DEBUG
    );
  }

  function flush() {
    if (flushed) return;
    if (!hasProvider()) return;
    flushed = true;
    while (QUEUE.length) dispatch(QUEUE.shift());
  }

  function track(name, props) {
    if (!name) return;
    const payload = enrich(name, props);
    if (hasProvider()) {
      dispatch(payload);
    } else {
      QUEUE.push(payload);
    }
  }

  // Try flushing periodically until a provider lands (in case it loads async)
  let attempts = 0;
  const interval = setInterval(() => {
    flush();
    attempts++;
    if (flushed || attempts > 20) clearInterval(interval);
  }, 500);

  // ---------- AUTO-TRACK: pageview ----------
  // Capture page type from window globals set by templates
  function autoPageview() {
    const pageType =
      window.__PAGE_TYPE__ ||
      (document.body.dataset && document.body.dataset.pageType) ||
      'unknown';
    track('pageview', {
      page_type: pageType,
      game: window.__GAME_SLUG__ || null,
      category: window.__CATEGORY__?.slug || null
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoPageview);
  } else {
    autoPageview();
  }

  // ---------- AUTO-TRACK: clicks via data-track ----------
  // <button data-track="cta_click" data-track-props='{"location":"hero"}'>...</button>
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    const evt = el.getAttribute('data-track');
    let props = {};
    try {
      const raw = el.getAttribute('data-track-props');
      if (raw) props = JSON.parse(raw);
    } catch (err) {}
    track(evt, props);
  }, true);

  // ---------- EXPORT ----------
  window.CAK = window.CAK || {};
  window.CAK.track = track;
  window.CAK.Analytics = {
    track,
    getSessionId,
    getUserId,
    setEndpoint(url) { window.CAK_ANALYTICS_URL = url; flush(); },
    enableDebug() { localStorage.setItem('cak-debug', '1'); }
  };
})();
