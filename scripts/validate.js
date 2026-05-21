/**
 * Schema validation for game data.
 * Throws on missing required fields or invalid values.
 * Goal: never ship a broken page silently.
 */

const REQUIRED_FIELDS = [
  'slug', 'title', 'shortTitle', 'description', 'icon',
  'category', 'type', 'color', 'colorSoft', 'tags',
  'questions', 'results', 'shareText'
];

const RECOMMENDED_FIELDS = [
  'shortDesc', 'emotions', 'plays', 'popularity', 'duration',
  'questionsCount', 'publishedAt', 'updatedAt', 'faq', 'seo',
  'thumbBg', 'difficulty', 'viralScore', 'completionRate',
  'tone', 'status', 'audience', 'systemTags', 'hooks',
  'replayReason', 'searchKeywords'
];

const VALID_TONES = ['funny', 'emotional', 'dramatic', 'toxic', 'chaotic', 'serious', 'romantic'];
const VALID_STATUSES = ['active', 'beta', 'hidden', 'seasonal', 'archived'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

class ValidationError extends Error {
  constructor(slug, msg) {
    super(`[${slug}] ${msg}`);
    this.slug = slug;
  }
}

function validateGame(game, allSlugs = []) {
  const errors = [];
  const warnings = [];
  const slug = game.slug || '<unknown>';

  // Quiz-style games need questions+results; skill games (challenge/typing/reaction) don't
  const isQuiz = !game.type || ['quiz', 'personality', 'compatibility'].includes(game.type);

  const requiredForAll = [
    'slug', 'title', 'shortTitle', 'description', 'icon',
    'category', 'type', 'color', 'colorSoft', 'tags', 'shareText'
  ];
  const requiredForQuiz = isQuiz ? ['questions', 'results'] : [];

  // Required fields
  for (const field of [...requiredForAll, ...requiredForQuiz]) {
    if (game[field] === undefined || game[field] === null || game[field] === '') {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Slug format
  if (game.slug && !/^[a-z0-9][a-z0-9-]*$/.test(game.slug)) {
    errors.push(`Invalid slug "${game.slug}" — must be lowercase, alphanumeric, dashes only`);
  }

  // Colors
  if (game.color && !/^#[0-9A-Fa-f]{3,8}$/.test(game.color)) {
    errors.push(`Invalid color "${game.color}" — must be hex`);
  }
  if (game.colorSoft && !/^#[0-9A-Fa-f]{3,8}$/.test(game.colorSoft)) {
    errors.push(`Invalid colorSoft "${game.colorSoft}" — must be hex`);
  }

  // Questions (only for quiz-style games)
  if (isQuiz && Array.isArray(game.questions)) {
    if (game.questions.length === 0) {
      errors.push('Questions array is empty');
    }
    game.questions.forEach((q, i) => {
      if (!q.text) errors.push(`Question[${i}]: missing "text"`);
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`Question[${i}]: needs at least 2 options`);
      } else {
        q.options.forEach((o, j) => {
          if (!o.id) errors.push(`Question[${i}].option[${j}]: missing "id"`);
          if (!o.text) errors.push(`Question[${i}].option[${j}]: missing "text"`);
          if (!o.score && !o.scores) {
            warnings.push(`Question[${i}].option[${j}]: no "score" or "scores" — answer won't count`);
          }
        });
      }
    });
  } else if (isQuiz && game.questions !== undefined && !Array.isArray(game.questions)) {
    errors.push('"questions" must be an array');
  }

  // Results (only for quiz-style games)
  if (isQuiz && Array.isArray(game.results)) {
    if (game.results.length === 0) {
      errors.push('Results array is empty');
    }
    let totalWeight = 0;
    game.results.forEach((r, i) => {
      if (!r.id) errors.push(`Result[${i}]: missing "id"`);
      if (!r.title) errors.push(`Result[${i}]: missing "title"`);
      if (typeof r.weight === 'number') totalWeight += r.weight;
    });
    // Validate weights roughly sum to ~100 (allow ±5 tolerance)
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 5) {
      warnings.push(`Result weights sum to ${totalWeight}, expected ~100 (rarity calc will be off)`);
    }
  } else if (isQuiz && game.results !== undefined && !Array.isArray(game.results)) {
    errors.push('"results" must be an array');
  }

  // Enum validations
  if (game.tone && !VALID_TONES.includes(game.tone)) {
    errors.push(`Invalid tone "${game.tone}". Must be one of: ${VALID_TONES.join(', ')}`);
  }
  if (game.status && !VALID_STATUSES.includes(game.status)) {
    errors.push(`Invalid status "${game.status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (game.difficulty && !VALID_DIFFICULTIES.includes(game.difficulty)) {
    errors.push(`Invalid difficulty "${game.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  // Numeric ranges
  if (game.viralScore !== undefined && (game.viralScore < 0 || game.viralScore > 100)) {
    errors.push(`viralScore must be 0-100, got ${game.viralScore}`);
  }
  if (game.completionRate !== undefined && (game.completionRate < 0 || game.completionRate > 100)) {
    errors.push(`completionRate must be 0-100, got ${game.completionRate}`);
  }
  if (game.popularity !== undefined && (game.popularity < 0 || game.popularity > 100)) {
    errors.push(`popularity must be 0-100, got ${game.popularity}`);
  }
  if (game.plays !== undefined && typeof game.plays !== 'number') {
    errors.push(`plays must be a number (got ${typeof game.plays}: "${game.plays}")`);
  }

  // Audience
  if (game.audience) {
    const { minAge, maxAge } = game.audience;
    if (minAge !== undefined && (minAge < 0 || minAge > 100)) {
      errors.push(`audience.minAge out of range`);
    }
    if (maxAge !== undefined && minAge !== undefined && maxAge < minAge) {
      errors.push(`audience.maxAge (${maxAge}) < minAge (${minAge})`);
    }
  }

  // forceRelated must reference existing games
  if (Array.isArray(game.forceRelated) && allSlugs.length) {
    game.forceRelated.forEach(s => {
      if (s === game.slug) {
        warnings.push(`forceRelated includes self ("${s}") — ignored`);
      } else if (!allSlugs.includes(s)) {
        errors.push(`forceRelated references unknown game: "${s}"`);
      }
    });
  }

  // Recommended (warnings only)
  for (const field of RECOMMENDED_FIELDS) {
    if (game[field] === undefined) {
      warnings.push(`Missing recommended field: "${field}"`);
    }
  }

  return { errors, warnings, slug };
}

function validateAll(games, categories = []) {
  const allSlugs = games.map(g => g.slug);
  const allErrors = [];
  const allWarnings = [];
  const validCategories = new Set(categories.map(c => c.slug));

  for (const g of games) {
    const { errors, warnings } = validateGame(g, allSlugs);
    errors.forEach(e => allErrors.push(`[${g.slug || '?'}] ${e}`));
    warnings.forEach(w => allWarnings.push(`[${g.slug || '?'}] ${w}`));

    // Category reference check
    if (g.category && validCategories.size && !validCategories.has(g.category)) {
      allErrors.push(`[${g.slug}] category "${g.category}" does not exist in site.json`);
    }
  }

  // Duplicate slugs
  const slugCounts = {};
  games.forEach(g => { slugCounts[g.slug] = (slugCounts[g.slug] || 0) + 1; });
  Object.entries(slugCounts).forEach(([slug, n]) => {
    if (n > 1) allErrors.push(`Duplicate slug "${slug}" appears ${n} times`);
  });

  return { errors: allErrors, warnings: allWarnings };
}

module.exports = {
  validateGame,
  validateAll,
  ValidationError,
  VALID_TONES,
  VALID_STATUSES,
  VALID_DIFFICULTIES
};
