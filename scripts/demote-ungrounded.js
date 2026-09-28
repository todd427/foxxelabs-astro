#!/usr/bin/env node
/**
 * demote-ungrounded.js — make the frontmatter agree with the grounding rule.
 *
 * The rule lives in src/lib/grounding.js and ALREADY hides ungrounded news at
 * build time (news list, article pages, homepage, RSS). This script is optional:
 * it reports the ungrounded items and, with --yes, sets `draft: true` on them so
 * the files themselves say what the site does, and writes a manifest.
 *
 * An item is UNGROUNDED when its `sourceUrl` cannot be a specific article:
 *   - missing      → no source at all
 *   - self         → a Foxxe domain cited as the source of external news
 *   - bare-domain  → a site homepage, no path
 *   - section      → a one-segment index page (/news, /research, /blog ...)
 *
 * Most were written March–June 2026, before the 2026-06-17 pipeline rework
 * began binding sourceUrl to fetched URLs. Demotion never deletes: the file
 * stays in src/content/news/ and in the dedupe corpus, so the gate still
 * remembers the story and will not regenerate it.
 *
 * Usage:
 *   node scripts/demote-ungrounded.js            # dry run: counts + reasons
 *   node scripts/demote-ungrounded.js --yes      # set draft: true, write manifest
 *
 * Manifest: data/demoted-ungrounded.json (slug, publishDate, reason, sourceUrl).
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { NEWS_DIR, demoteToDraft } from './dedupe.js';
import { classifySource as classify } from '../src/lib/grounding.js';

export { classify };

const MANIFEST = path.resolve(NEWS_DIR, '..', '..', '..', 'data', 'demoted-ungrounded.json');

function main() {
  const apply = process.argv.includes('--yes');
  const files = fs.readdirSync(NEWS_DIR).filter((f) => f.endsWith('.md')).sort();
  const hits = [];
  let alreadyDraft = 0;

  for (const f of files) {
    const fp = path.join(NEWS_DIR, f);
    const { data } = matter(fs.readFileSync(fp, 'utf-8'));
    const reason = classify(data.sourceUrl);
    if (!reason) continue;
    if (data.draft === true) { alreadyDraft++; continue; }
    hits.push({
      slug: f.replace(/\.md$/, ''),
      publishDate: data.publishDate ? new Date(data.publishDate).toISOString().slice(0, 10) : null,
      reason,
      sourceUrl: data.sourceUrl ?? null,
      fp,
    });
  }

  const byReason = hits.reduce((m, h) => ((m[h.reason] = (m[h.reason] || 0) + 1), m), {});
  const byMonth = hits.reduce((m, h) => { const k = (h.publishDate || 'unknown').slice(0, 7); m[k] = (m[k] || 0) + 1; return m; }, {});
  console.log(`Scanned ${files.length} news items.`);
  console.log(`Ungrounded and not yet draft: ${hits.length}  (already draft: ${alreadyDraft})`);
  console.log('By reason:', byReason);
  console.log('By month: ', Object.fromEntries(Object.entries(byMonth).sort()));

  if (!apply) { console.log('\nDry run. Re-run with --yes to set draft: true and write the manifest.'); return; }

  for (const h of hits) demoteToDraft(h.fp);
  const manifest = {
    generated: new Date().toISOString(),
    rule: 'src/lib/grounding.js classifySource: sourceUrl missing, Foxxe domain, bare domain, or one-segment section page',
    restore: "set the item's `draft:` line back to false AND relax isPublishedNews() in src/lib/grounding.js",
    count: hits.length,
    byReason,
    items: hits.map(({ fp, ...rest }) => rest),
  };
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nSet draft: true on ${hits.length} items. Manifest: ${path.relative(process.cwd(), MANIFEST)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
