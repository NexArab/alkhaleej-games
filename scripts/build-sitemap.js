/**
 * Build sitemap.xml and robots.txt.
 */
const { SITE } = require('../templates/partials.js');

function isoDate(d) {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().split('T')[0];
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[c]));
}

function buildSitemap(data) {
  const baseUrl = SITE.gamesUrl.replace(/\/$/, '');
  const urls = [];

  urls.push({
    loc: baseUrl + '/',
    lastmod: isoDate(data.site.updatedAt || new Date()),
    changefreq: 'daily',
    priority: '1.0'
  });

  // Only include non-hidden, non-archived games
  for (const g of data.games || []) {
    if (g.status === 'hidden' || g.status === 'archived') continue;
    urls.push({
      loc: `${baseUrl}/${g.slug}/`,
      lastmod: isoDate(g.updatedAt || g.publishedAt),
      changefreq: 'weekly',
      priority: '0.8'
    });
  }

  const categoriesWithGames = new Set(
    (data.games || [])
      .filter(g => g.status !== 'hidden' && g.status !== 'archived')
      .map(g => g.category)
  );
  // Include ALL categories — empty ones still have a "coming soon" page,
  // just at a lower crawl priority.
  for (const cat of data.categories || []) {
    const hasGames = categoriesWithGames.has(cat.slug);
    urls.push({
      loc: `${baseUrl}/${cat.slug}/`,
      lastmod: isoDate(new Date()),
      changefreq: hasGames ? 'weekly' : 'monthly',
      priority: hasGames ? '0.6' : '0.3'
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

function buildRobots() {
  const baseUrl = SITE.gamesUrl.replace(/\/$/, '');
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

module.exports = { buildSitemap, buildRobots };
