/**
 * timeline.js — which developments belong on a story's timeline.
 *
 * Plain JS, no dependencies, so the generator (at fold time) and PostLayout (at
 * build time) apply one rule.
 *
 * Why: 2026-09-28 audit — the gate folded EVERY novel claim from a matching
 * research run into the matched story, with no check that each claim was about
 * that story. Broad stories became attractors: 44 published items carried >20
 * updates, 8 carried >100 (the Irish AI bill page had 460, including claims
 * about DeepSeek and a US executive order).
 *
 * Rule: a development fits a story only if its text names the story's CORE
 * entities — the tagged entities that appear in the story's own title or
 * description. It must name at least two of them (or all, if the story has
 * fewer than two). A story with no core entities accepts nothing: a false merge
 * is worse than a missed update.
 */

const key = (s) => ` ${String(s).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim()} `;

/** Entity keys (padded) that surface in the story's headline. */
export function coreKeys(story) {
  const hay = key(`${story.title || ''} ${story.description || ''}`);
  const out = new Set();
  for (const e of story.entities || []) {
    const k = key(e);
    if (k.trim().length >= 2 && hay.includes(k)) out.add(k);
  }
  return out;
}

/** Does this development's text belong on this story's timeline? */
export function fitsStory(text, story, core = coreKeys(story)) {
  if (!core.size) return false;
  const hay = key(text);
  let hits = 0;
  for (const k of core) if (hay.includes(k)) hits++;
  return hits >= Math.min(2, core.size);
}

/**
 * The timeline to show: fitting entries only, repeated notes dropped,
 * newest first, at most `max`.
 */
export function curateTimeline(updates = [], story, max = 12) {
  const core = coreKeys(story);
  const seen = new Set();
  return [...updates]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((u) => {
      if (!fitsStory(u.note, story, core)) return false;
      const k = key(u.note).slice(0, 90);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, max);
}
