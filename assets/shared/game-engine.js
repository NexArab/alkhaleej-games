/**
 * Game Engine — generic quiz/test runner.
 * Reads config from #game-config (injected JSON) and runs the game UI.
 * Integrates with window.CAK.Share for sharing results.
 *
 * DOM ids — synced with the current game page template:
 *   #startScreen, #questionScreen, #resultCard            (screens)
 *   #questionNum, #stepLabel, #questionText, #optionsGrid (question UI)
 *   #nextBtn, #progressFill, #timerVal                    (controls)
 *   #resultIcon, #resultTitle, #resultDesc, #resultScoreNum, #resultTags
 *   #resultRarity, #resultCta, #replayReason
 *   #faqList, #heroHook, #toastContainer
 *
 * Note: start / next / skip / restart / share buttons are wired both
 * via inline onclick (GameTemplate.*) and — when present as ids —
 * via addEventListener. Missing ids are handled gracefully.
 */
(function () {
  'use strict';

  // Read game config injected as JSON in the page
  let CFG = null;
  try {
    const node = document.getElementById('game-config');
    if (node) CFG = JSON.parse(node.textContent);
  } catch (e) {
    console.error('[game-engine] failed to read #game-config', e);
  }
  if (!CFG) return;

  // Safe analytics helper — no-op if Analytics not loaded yet
  function track(name, props) {
    try { window.CAK && window.CAK.track && window.CAK.track(name, props); } catch (e) {}
  }

  const $ = id => document.getElementById(id);
  const state = {
    currentQ: 0,
    answers: {},
    scores: {},
    startTime: null,
    timerInterval: null,
    transitioning: false,
    finalResult: null,
    finalScore: 0
  };

  // ---------- INIT ----------
  function init() {
    applyConfig();
    renderFaq();
    bindControls();
    initHeroHooks();
  }

  // Rotate hooks in the hero every 3.5s for engagement
  function initHeroHooks() {
    const el = document.getElementById('heroHook');
    if (!el) return;
    let hooks = [];
    try { hooks = JSON.parse(el.getAttribute('data-hooks') || '[]'); } catch (e) {}
    if (hooks.length < 2) return;
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % hooks.length;
      el.classList.add('fading');
      setTimeout(() => {
        el.textContent = hooks[idx];
        el.classList.remove('fading');
      }, 200);
    }, 3500);
  }

  function applyConfig() {
    // Set --game-color on body so the page picks up the per-game theme
    if (CFG.color) document.body.style.setProperty('--game-color', CFG.color);
    if (CFG.colorSoft) document.body.style.setProperty('--game-color-soft', CFG.colorSoft);

    // Title meta-update if title element exists
    const titleEl = document.querySelector('[data-game-title]');
    if (titleEl) titleEl.textContent = CFG.title;
  }

  function renderFaq() {
    const list = $('faqList');
    if (!list || !Array.isArray(CFG.faq) || CFG.faq.length === 0) return;
    list.innerHTML = CFG.faq.map((f, i) => `
      <div class="faq-item">
        <button class="faq-q" onclick="CAK.toggleFaq(this)" aria-expanded="false">
          <span>${escapeHtml(f.q)}</span>
          <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6,9 12,15 18,9"/></svg>
        </button>
        <div class="faq-a"><p>${escapeHtml(f.a)}</p></div>
      </div>
    `).join('');
  }

  function bindControls() {
    const startBtn = $('startBtn');
    if (startBtn) startBtn.addEventListener('click', startGame);
    const nextBtn = $('nextBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    const skipBtn = $('skipBtn');
    if (skipBtn) skipBtn.addEventListener('click', skipQuestion);
    const restartBtn = $('restartBtn');
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
    const shareResultBtn = $('shareResultBtn');
    if (shareResultBtn) shareResultBtn.addEventListener('click', shareResult);
  }

  // ---------- GAME FLOW ----------
  function startGame() {
    state.currentQ = 0;
    state.answers = {};
    state.scores = {};
    state.startTime = Date.now();
    track('game_start', { game: CFG.slug, total_questions: (CFG.questions||[]).length });
    showScreen('questionScreen');
    renderQuestion();
    startTimer();
    scrollToGame();
  }

  function scrollToGame() {
    const box = document.querySelector('.game-box') || document.getElementById('gameBox');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderQuestion() {
    const q = CFG.questions[state.currentQ];
    if (!q) { finishGame(); return; }
    const total = CFG.questions.length;

    const numEl = $('questionNum');
    if (numEl) numEl.textContent = `سؤال ${toArabicNum(state.currentQ + 1)} من ${toArabicNum(total)}`;

    const stepEl = $('stepLabel');
    if (stepEl) stepEl.textContent = `${Math.round(((state.currentQ) / total) * 100)}%`;

    const textEl = $('questionText');
    if (textEl) textEl.textContent = q.text;

    updateProgress(((state.currentQ) / total) * 100);

    const letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
    const optionsHtml = q.options.map((opt, i) => `
      <button class="option-btn" data-id="${escapeAttr(opt.id)}">
        <span class="option-letter">${letters[i] || (i+1)}</span>
        <span class="option-text">${escapeHtml(opt.text)}</span>
      </button>
    `).join('');
    const grid = $('optionsGrid');
    if (grid) {
      grid.innerHTML = optionsHtml;
      grid.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => selectOption(btn, btn.dataset.id));
      });
    }

    const nextBtn = $('nextBtn');
    if (nextBtn) {
      nextBtn.disabled = !state.answers[state.currentQ];
      nextBtn.textContent = state.currentQ === total - 1 ? 'إنهاء ✓' : 'التالي →';
    }
  }

  function selectOption(btn, optId) {
    if (state.transitioning) return;
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected', 'pop');
    setTimeout(() => btn.classList.remove('pop'), 320);

    const q = CFG.questions[state.currentQ];
    const opt = q.options.find(o => o.id === optId);
    if (!opt) return;
    state.answers[state.currentQ] = optId;

    // Accumulate scores: option can have either {score: 'key'} or {scores: {k:1,k2:2}}
if (opt.score && typeof opt.score === 'string') {

  state.scores[opt.score] =
    (state.scores[opt.score] || 0) + 1;

} else if (opt.score && typeof opt.score === 'object') {

  Object.entries(opt.score).forEach(([k, v]) => {

    state.scores[k] =
      (state.scores[k] || 0) + Number(v || 0);

  });

} else if (opt.scores && typeof opt.scores === 'object') {

  Object.entries(opt.scores).forEach(([k, v]) => {

    state.scores[k] =
      (state.scores[k] || 0) + Number(v || 0);

  });

}

    const nextBtn = $('nextBtn');
    if (nextBtn) nextBtn.disabled = false;
    tryVibrate(15);
  }

  function nextQuestion() {
    if (state.transitioning) return;
    if (!state.answers[state.currentQ]) return;
    transitionToNext();
  }

  function skipQuestion() {
    if (state.transitioning) return;
    transitionToNext();
  }

  function transitionToNext() {
    state.transitioning = true;
    const screen = $('questionScreen');
    if (screen) screen.classList.add('exiting');
    const total = CFG.questions.length;
    setTimeout(() => {
      state.currentQ++;
      if (state.currentQ >= total) {
        finishGame();
      } else {
        if (screen) {
          screen.classList.remove('exiting');
          screen.classList.add('entering');
        }
        renderQuestion();
        setTimeout(() => { if (screen) screen.classList.remove('entering'); }, 320);
      }
      state.transitioning = false;
    }, 280);
  }

  function finishGame() {
    stopTimer();
    updateProgress(100);
    const result = calculateResult();
    state.finalResult = result.result;
    state.finalScore = result.score;
    const durationSec = Math.round((Date.now() - state.startTime) / 1000);
    track('game_finish', {
      game: CFG.slug,
      result_id: result.result?.id || null,
      result_title: result.result?.title || null,
      score: result.score,
      duration_sec: durationSec,
      questions_answered: Object.keys(state.answers).length,
      total_questions: (CFG.questions||[]).length,
      rarity_weight: result.result?.weight || null
    });
    showScreen('resultCard');
    showResult(result.result, result.score);
  }

  function calculateResult() {
    const results = CFG.results || [];
    const topKey = Object.entries(state.scores).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const result = results.find(r => r.id === topKey) || results[results.length - 1] || {
      id: 'default', title: 'نتيجتك جاهزة', desc: 'شكراً لمشاركتك!', icon: '🎯', tags: []
    };
    const answered = Object.keys(state.answers).length;
    const pct = Math.round((answered / CFG.questions.length) * 100);
    // Friendly displayed score: blend of completion + a small randomized boost so it feels personalized
    const score = Math.max(65, Math.min(98, pct + Math.floor(Math.random() * 15)));
    return { result, score };
  }

  function showResult(result, score) {
    const card = $('resultCard');
    if (!card) return;
    setTimeout(() => card.classList.add('show'), 80);

    const iconEl = $('resultIcon');
    if (iconEl) iconEl.textContent = result.icon || '🎯';
    const titleEl = $('resultTitle');
    if (titleEl) titleEl.textContent = result.title || '';
    const descEl = $('resultDesc');
    if (descEl) descEl.textContent = result.desc || '';

    const scoreEl = $('resultScoreNum');
    if (scoreEl) animateNumber(scoreEl, 0, score, 1400, v => v + '%');

    const tagsEl = $('resultTags');
    if (tagsEl && Array.isArray(result.tags)) {
      tagsEl.innerHTML = result.tags.map(t => `<span class="result-tag">${escapeHtml(t)}</span>`).join('');
    }

    // Rarity badge
    renderRarity(result);

    // Result-specific CTA (overrides default share box title)
    const ctaEl = $('resultCta');
    if (ctaEl && result.cta) {
      ctaEl.textContent = result.cta;
      ctaEl.style.display = '';
    }

    // Replay reason
    const replayEl = $('replayReason');
    if (replayEl && CFG.replayReason) {
      replayEl.textContent = CFG.replayReason;
      replayEl.style.display = '';
    }

    tryVibrate([20, 60, 30]);
  }

  /**
   * "You are in the rarest X% of players who got this result"
   * Uses the result.weight field if present (percent likelihood).
   * Falls back to a neutral message.
   */
  function renderRarity(result) {
    const slot = $('resultRarity');
    if (!slot) return;
    const w = Number(result.weight);
    if (!w || w <= 0 || w >= 100) {
      slot.innerHTML = '';
      return;
    }
    let label, emoji, tone;
    if (w <= 5)      { label = `أنت ضمن ${w}% فقط من اللاعبين 🔥`; emoji = '👑'; tone = 'ultra'; }
    else if (w <= 15){ label = `نتيجة نادرة — ${w}% فقط حصلوا عليها`;     emoji = '💎'; tone = 'rare'; }
    else if (w <= 30){ label = `${w}% فقط من اللاعبين مثلك`;              emoji = '⭐'; tone = 'uncommon'; }
    else if (w <= 50){ label = `أنت ضمن أقلية مميزة (${w}%)`;             emoji = '✨'; tone = 'normal'; }
    else             { label = `النتيجة الأكثر شيوعاً بين اللاعبين`;       emoji = '🎯'; tone = 'common'; }
    state.rarityLabel = label;
    state.rarityTone = tone;
    slot.innerHTML = `<div class="result-rarity tone-${tone}"><span class="rarity-emoji">${emoji}</span><span>${escapeHtml(label)}</span></div>`;
  }

  function animateNumber(el, from, to, duration, fmt) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (to - from) * eased);
      el.textContent = fmt ? fmt(toArabicNum(val)) : toArabicNum(val);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function restartGame() {
    track('game_restart', { game: CFG.slug });
    const card = $('resultCard');
    if (card) card.classList.remove('show');
    state.currentQ = 0;
    state.answers = {};
    state.scores = {};
    state.finalResult = null;
    state.finalScore = 0;
    updateProgress(0);
    showScreen('startScreen');
  }

  // ---------- TIMER ----------
  function startTimer() {
    state.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      const el = $('timerVal') || $('gameTimer');
      if (el) el.textContent = `${toArabicNum(m)}:${toArabicNum(s.toString().padStart(2, '0'))}`;
    }, 1000);
  }
  function stopTimer() { clearInterval(state.timerInterval); }

  // ---------- HELPERS ----------
  function updateProgress(pct) {
    const fill = $('progressFill');
    if (fill) fill.style.width = pct + '%';
  }
function showScreen(id) {
  ['startScreen', 'questionScreen', 'loadingScreen', 'resultCard']
    .forEach(screenId => {
      const el = $(screenId);
      if (!el) return;

      el.classList.add('hidden');

      if (screenId === 'resultCard') {
        el.classList.remove('show');
      }
    });

  const active = $(id);

  if (active) {
    active.classList.remove('hidden');

    if (id === 'resultCard') {
      active.classList.add('show');
    }
  }
}
  function toArabicNum(n) {
    const map = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    return String(n).replace(/\d/g, d => map[d]);
  }
  function tryVibrate(pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---------- SHARE RESULT ----------
  function shareResult() {
    const result = state.finalResult;
    const score = state.finalScore;
    const rarity = state.rarityLabel;

    // Pick the best share template for this result
    // Priority: rare > tone-matched > neutral > fallback
    let templateText = '';
    if (result && result.shareTemplates) {
      const tpl = result.shareTemplates;
      if (state.rarityTone === 'ultra' || state.rarityTone === 'rare') {
        templateText = tpl.rare || tpl.dramatic || tpl.neutral || '';
      }
      if (!templateText) {
        // Match game tone if available
        const gameTone = CFG.tone;
        if (gameTone && tpl[gameTone]) templateText = tpl[gameTone];
      }
      if (!templateText) templateText = tpl.neutral || tpl.dramatic || tpl.romantic || tpl.funny || '';
    }

    // Build final share text
    let resultLine = '';
    if (templateText) {
      resultLine = templateText;
    } else if (result) {
      resultLine = `🎯 نتيجتي: ${result.title}`;
      if (score) resultLine += ` (${score}%)`;
    }

    // Prepend rarity hook for ultra/rare if it's not already in the template
    let hook = '';
    if (rarity && (state.rarityTone === 'ultra' || state.rarityTone === 'rare')
        && resultLine && !resultLine.includes(`${result.weight}%`)) {
      hook = `${rarity}\n`;
    }

    const baseText = CFG.shareText || `جرب لعبة ${CFG.title}`;
    const text = hook + (resultLine ? `${resultLine}\n${baseText}` : baseText);

    if (window.CAK && window.CAK.Share) {
      window.CAK.Share.open({
        text: text,
        url: CFG.url || window.location.href,
        title: result ? `${result.title} — ${CFG.title}` : CFG.title
      });
    } else if (navigator.share) {
      navigator.share({ text: text, url: CFG.url || window.location.href }).catch(() => {});
    }
  }

  // Expose for inline handlers — both names supported
  const api = { init, startGame, nextQuestion, skipQuestion, restartGame, shareResult };
  window.GameEngine = api;
  window.GameTemplate = api;

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();