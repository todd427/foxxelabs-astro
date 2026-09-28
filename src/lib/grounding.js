/**
 * grounding.js — the one definition of "publishable news".
 *
 * A news item is published only if it cites a SPECIFIC article. Plain JS so the
 * Astro pages (news list, article pages, homepage, RSS) and the Node pipeline
 * scripts share one rule instead of drifting apart.
 *
 * Why: 2026-09-28 audit — 861 of 1,234 news items (almost all March–June 2026,
 * before the 2026-06-17 rework bound sourceUrl to fetched URLs) cited no real
 * source: a homepage, a section index such as anthropic.com/news, a Foxxe domain,
 * or nothing. They are hidden here, not deleted; the files stay in the corpus so
 * the dedupe gate still remembers those stories and will not regenerate them.
 *
 * To restore everything, make isPublishedNews() ignore classifySource().
 */

// Hyphenated single path segments are usually article slugs; these are not.
const SECTION_SEGMENTS = new Set([
  'ai-news', 'ai-artificial-intelligence', 'security-research',
  'security-advisory', 'ai-security-developments', 'latest-news',
  'press-releases', 'news-room', 'newsroom',
]);

/**
 * Why a source URL cannot be a specific article, or null if it can.
 * @returns {'missing'|'self'|'placeholder'|'bare-domain'|'section'|null}
 */
export function classifySource(sourceUrl) {
  if (!sourceUrl) return 'missing';
  let u;
  try { u = new URL(String(sourceUrl)); } catch { return 'missing'; }
  if (/(^|\.)foxxe[a-z]*\./i.test(u.hostname)) return 'self';
  // Reserved placeholder domains (RFC 2606/6761): never a real source.
  if (/(^|\.)example\.(com|org|net)$|\.(example|test|invalid|localhost)$|^localhost$/i.test(u.hostname)) return 'placeholder';
  const segs = u.pathname.split('/').filter(Boolean);
  if (segs.length === 0) return 'bare-domain';
  if (segs.length === 1) {
    const s = segs[0].toLowerCase();
    if (!s.includes('-') || SECTION_SEGMENTS.has(s)) return 'section';
  }
  return null;
}

/** Collection filter for every page that lists or renders news. */
export function isPublishedNews(data) {
  return data.draft !== true && classifySource(data.sourceUrl) === null;
}
