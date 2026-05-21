/**
 * Related games engine (server-side).
 *
 * Scoring:
 *   +10  same category
 *   +4   each shared emotion
 *   +3   each shared tag
 *   +2   same type
 *   +(viralScore/10)  viral boost (so virally-strong games surface more)
 *   +(seasonalBoost/10)  if currently in season
 *   +(popularity/20)  tiebreaker
 *
 *   forceRelated entries are always returned FIRST (in order), regardless of score.
 *
 * Hidden/archived games are excluded.
 */

function currentSeasons(seasonsConfig = {}) {
  const today = new Date();
  const md = String(today.getMonth() + 1).padStart(2, '0') + '-' +
             String(today.getDate()).padStart(2, '0');
  const active = [];
  for (const [name, s] of Object.entries(seasonsConfig)) {
    if (!s.start || !s.end) continue;
    // Handle wrap-around (e.g. newyear 12-25 → 01-07)
    if (s.start <= s.end) {
      if (md >= s.start && md <= s.end) active.push(name);
    } else {
      if (md >= s.start || md <= s.end) active.push(name);
    }
  }
  return active;
}

function relatedGames(current, all, opts = {}) {
  const limit = opts.limit || 4;
  const seasonsConfig = opts.seasons || {};
  const activeSeasons = currentSeasons(seasonsConfig);

  // 1. forceRelated takes priority — pinned slots
  const forced = [];
  if (Array.isArray(current.forceRelated)) {
    for (const slug of current.forceRelated) {
      if (slug === current.slug) continue;
      const found = all.find(g => g.slug === slug);
      if (found && found.status !== 'hidden' && found.status !== 'archived') {
        forced.push(found);
      }
      if (forced.length >= limit) break;
    }
  }

  // 2. Score remaining games
  const forcedSlugs = new Set(forced.map(g => g.slug));
  const scored = all
    .filter(g =>
      g.slug !== current.slug &&
      !forcedSlugs.has(g.slug) &&
      g.status !== 'hidden' &&
      g.status !== 'archived'
    )
    .map(g => {
      let score = 0;
      if (g.category === current.category) score += 10;

      const currTags = new Set(current.tags || []);
      (g.tags || []).forEach(t => { if (currTags.has(t)) score += 3; });

      if (g.type === current.type) score += 2;

      const currEmotions = new Set(current.emotions || []);
      (g.emotions || []).forEach(e => { if (currEmotions.has(e)) score += 4; });

      score += (g.viralScore || 0) / 10;
      score += (g.popularity || 0) / 20;

      // Seasonal boost
      if (g.seasonal && activeSeasons.length) {
        for (const s of activeSeasons) {
          if (g.seasonal[s]) score += g.seasonal[s] / 10;
        }
      }

      return { game: g, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.game);

  // 3. Combine: forced first, then scored, until limit
  return [...forced, ...scored].slice(0, limit);
}

module.exports = { relatedGames, currentSeasons };
