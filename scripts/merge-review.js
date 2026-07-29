#!/usr/bin/env node
/**
 * merge-review.js — offline same-event collapse for the historical backlog.
 *
 * WHY THIS IS SEPARATE FROM dedupe.js's `review`/`apply`:
 * The live gate (dedupe.js findDuplicate) folds a new candidate into ONE best
 * match pairwise, so claim identity is safe there. The whole-corpus `review`
 * path uses connected components, which is TRANSITIVE: a multi-event "roundup"
 * article shares one claim with story A and another with story B, chaining
 * unrelated stories through the hub (a claim edge there once merged a physics
 * paper with EU AI Act guidelines). So dedupe.js keeps its offline edge
 * lexical-only, and same-event collapse of the backlog lives here instead, built
 * on four ideas the connected-components path lacks:
 *
 *   1. KEY-ANCHORED, NON-TRANSITIVE. Cluster by a shared *dominant event key*,
 *      not by chained edges. Each cluster is a star: members merge INTO one hub,
 *      never into each other, so no roundup can bridge two events.
 *   2. DOMINANT-EVENT GUARD. A story's key is the (specific entity, event_date)
 *      of the primary claim whose STATEMENT best matches the story's HEADLINE —
 *      i.e. what the piece is *about*, not an incidental restated fact. This is
 *      what separates "Fable 5 launched (06-09)" from "Fable 5 shut down (06-13)"
 *      even though the shutdown piece restates the launch date.
 *   3. LEXICAL/ENTITY CO-FLOOR. Identity alone over-fires (two same-day items
 *      sharing an entity but nothing else); a member must also clear txt and ent
 *      floors against the hub. Calibrated: separates genuine forks from cousins.
 *   4. HUB = FOLDING HUB, NOT LATEST publishDate. Canonical is the article that
 *      accreted the most timeline (max updateCount, then updatedDate). The Ireland
 *      AI Act fork is two hubs (176 vs 96 updates); keep-latest-publishDate would
 *      demote the richer one. apply UNIONS the members' timelines into the hub
 *      before demoting them, so no folded intelligence is lost.
 *
 * False merge stays worse than false miss: review writes proposals only; apply
 * is --yes-gated, demotes (reversible) rather than deletes, and unions timelines
 * so a wrong merge loses nothing but a slug.
 *
 * Self-contained: reads hub metrics (updatedDate, updateCount) itself, so it
 * needs no change to the live-gate module's data shape.
 *
 * CLI:
 *   node scripts/merge-review.js review [daysBack] [coTxt] [coEnt]
 *   node scripts/merge-review.js apply  <review.json> [--yes]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import {
  loadCorpusWindow, score, primaryEventClaims, demoteToDraft,
} from './dedupe.js';
import { loadClaims, isSpecificEntity } from './claims.js';
import { aliasCanonical } from './entities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Co-floors: a member must clear BOTH against the hub. Calibrated on the corpus —
// identity+these separated 25 genuine same-event pairs from 131 spurious ones.
export const CO_TXT_FLOOR = 0.25;
export const CO_ENT_FLOOR = 0.10;
// Keep primary claims within this fraction of the top headline-match score as
// co-dominant (handles a story with two equally-lead events).
export const DOMINANT_TIE = 0.85;
const WHOLE_CORPUS_DAYS = 36500;

const isoDate = (d) => {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? String(d).slice(0, 10) : t.toISOString().slice(0, 10);
};
const headline = (s) => `${s.title || ''} ${s.description || ''}`;
const toks = (t) => String(t).toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let i = 0; for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
}

/** The story's dominant event key(s): (canonical specific entity | event_date)
 *  of the primary claim(s) whose statement best matches the headline. Empty when
 *  the story carries no dated, specifically-tagged primary claim. */
export function dominantEventKeys(story) {
  const prim = primaryEventClaims(story.claims || [])
    .filter((c) => c.event_date && (c.entities || []).some(isSpecificEntity));
  if (!prim.length) return new Set();
  const hTok = toks(headline(story));
  let best = -1;
  const scored = prim.map((c) => { const sc = jaccard(toks(c.statement), hTok); if (sc > best) best = sc; return { c, sc }; });
  if (best <= 0) return new Set();
  const keys = new Set();
  for (const { c, sc } of scored) {
    if (sc < best * DOMINANT_TIE) continue;
    for (const e of c.entities) if (isSpecificEntity(e)) keys.add(`${aliasCanonical(e)}|${isoDate(c.event_date)}`);
  }
  return keys;
}

const hubRank = (a, b) =>
  (b.updateCount - a.updateCount)
  || String(isoDate(b.updatedDate) || '').localeCompare(String(isoDate(a.updatedDate) || ''))
  || String(isoDate(b.publishDate) || '').localeCompare(String(isoDate(a.publishDate) || ''));

function buildCorpus(daysBack) {
  const corpus = loadCorpusWindow(daysBack);
  const byStory = new Map();
  for (const c of loadClaims()) {
    if (!c.story_id) continue;
    if (!byStory.has(c.story_id)) byStory.set(c.story_id, []);
    byStory.get(c.story_id).push(c);
  }
  for (const s of corpus) {
    // Hub metrics (updatedDate, updateCount) are read here, not via loadCorpusWindow,
    // so this offline tool needs no change to the live-gate module's data shape.
    try {
      const { data } = matter(fs.readFileSync(s.file, 'utf-8'));
      s.updatedDate = data.updatedDate || null;
      s.updateCount = Array.isArray(data.updates) ? data.updates.length : 0;
    } catch { s.updatedDate = null; s.updateCount = 0; }
    s.claims = byStory.get(s.slug) || [];
    s.domKeys = dominantEventKeys(s);
  }
  return corpus;
}

/** Non-transitive, key-anchored, globally-best-assigned merge proposals. */
export function buildClusters(corpus, { coTxt = CO_TXT_FLOOR, coEnt = CO_ENT_FLOOR } = {}) {
  // 1. group story indices by shared dominant event key
  const key2idx = new Map();
  corpus.forEach((s, i) => { for (const k of s.domKeys) { if (!key2idx.has(k)) key2idx.set(k, []); key2idx.get(k).push(i); } });

  // 2. per key: pick the folding hub, propose members that clear the co-floor
  const hubByKey = new Map();
  const proposals = []; // { member, hub, key, txt, ent }
  for (const [key, idxs] of key2idx) {
    if (idxs.length < 2) continue;
    const live = idxs.filter((i) => !corpus[i].draft);
    if (live.length < 2) continue;
    const hub = [...live].sort((a, b) => hubRank(corpus[a], corpus[b]))[0];
    hubByKey.set(key, hub);
    for (const i of live) {
      if (i === hub) continue;
      const sc = score(corpus[hub], corpus[i]);
      if (sc.txt >= coTxt && sc.ent >= coEnt) proposals.push({ member: i, hub, key, txt: +sc.txt.toFixed(3), ent: +sc.ent.toFixed(3) });
    }
  }

  // 3. GLOBAL-BEST assignment: each member anchors to exactly one hub (highest
  //    txt). This is what makes it non-transitive — a member shared across keys
  //    (e.g. an export-controls story touching two dates) picks one canonical.
  //    A member is absorbed only into a STRICTLY RICHER hub; a rich hub can still
  //    be absorbed by an even richer one (Ireland 96 → 176), but two equally-rich
  //    stories never merge (ambiguous canonical → leave for human).
  const bestForMember = new Map();
  for (const p of proposals) {
    if (hubRank(corpus[p.hub], corpus[p.member]) >= 0) continue; // hub not strictly richer
    const cur = bestForMember.get(p.member);
    if (!cur || p.txt > cur.txt) bestForMember.set(p.member, p);
  }

  // 4. a story absorbed as a member cannot also be a canonical: iteratively drop
  //    proposals whose hub is itself absorbed elsewhere, until stable. (No chains:
  //    a member never inherits a hub's members.)
  let assigns = [...bestForMember.values()];
  for (;;) {
    const absorbed = new Set(assigns.map((p) => p.member));
    const next = assigns.filter((p) => !absorbed.has(p.hub));
    if (next.length === assigns.length) break;
    assigns = next;
  }

  const byHub = new Map();
  for (const p of assigns) {
    if (!byHub.has(p.hub)) byHub.set(p.hub, []);
    byHub.get(p.hub).push(p);
  }

  return [...byHub.entries()]
    .map(([hub, members]) => ({ hub, members: members.sort((a, b) => b.txt - a.txt) }))
    .filter((c) => c.members.length)
    .sort((a, b) => b.members.length - a.members.length || corpus[b.hub].updateCount - corpus[a.hub].updateCount);
}

function review(daysBack, coTxt, coEnt) {
  const corpus = buildCorpus(daysBack);
  const clusters = buildClusters(corpus, { coTxt, coEnt });

  const out = clusters.map(({ hub, members }) => ({
    canonical: {
      slug: corpus[hub].slug, file: corpus[hub].file, title: corpus[hub].title,
      publishDate: isoDate(corpus[hub].publishDate), updatedDate: isoDate(corpus[hub].updatedDate), updateCount: corpus[hub].updateCount,
    },
    members: members.map((m) => ({
      slug: corpus[m.member].slug, file: corpus[m.member].file, title: corpus[m.member].title,
      publishDate: isoDate(corpus[m.member].publishDate), updateCount: corpus[m.member].updateCount,
      key: m.key, score: { txt: m.txt, ent: m.ent },
    })),
  }));

  const total = out.reduce((n, c) => n + c.members.length, 0);
  const outPath = path.join(__dirname, '..', 'dedupe-merge-review.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: 'merge-review (non-transitive, dominant-key, hub-canonical, timeline-union on apply)',
    windowDays: daysBack, coFloor: { txt: coTxt ?? CO_TXT_FLOOR, ent: coEnt ?? CO_ENT_FLOOR },
    corpusSize: corpus.length,
    note: 'PROPOSALS ONLY. Canonical = folding hub (kept, published). apply UNIONS each ' +
      'member timeline into the canonical then demotes the member to draft:true (reversible). ' +
      'Delete a cluster/member to reject; apply requires --yes. Review low-txt and moving-story ' +
      'pairs (launch vs shutdown, news vs reference) carefully before applying.',
    clusters: out,
  }, null, 2));

  console.log(`merge-review: ${corpus.length} articles, ${out.length} clusters, ${total} members to merge+demote.\n`);
  for (const c of out) {
    console.log(`# HUB uc=${c.canonical.updateCount} upd=${c.canonical.updatedDate}  ${c.canonical.slug}  [${c.canonical.publishDate}]`);
    console.log(`    ${c.canonical.title}`);
    for (const m of c.members) {
      console.log(`  + MERGE [t=${m.score.txt} e=${m.score.ent} uc=${m.updateCount}] key=${m.key}`);
      console.log(`          ${m.slug}  [${m.publishDate}]`);
    }
    console.log('');
  }
  console.log(`Review file: ${outPath}`);
  console.log(`Approve, then: node scripts/merge-review.js apply dedupe-merge-review.json --yes`);
}

// ── timeline union (surgical raw-line insertion; no YAML reserialise) ─────────
const UPDATE_LINE = /^\s*-\s*\{\s*date:.*\}\s*$/;
const normNote = (n) => String(n).toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
const fmBlock = (raw) => { const m = raw.match(/^---\n([\s\S]*?)\n---/); if (!m) throw new Error('no frontmatter'); return m; };
function updateLines(raw) { return fmBlock(raw)[1].split('\n').filter((l) => UPDATE_LINE.test(l)); }
function noteOf(line) { const m = line.match(/note:\s*"([^"]*)"/); return m ? m[1] : line; }

/** Union `lines` into the hub file's updates block, skipping notes already
 *  present; bump updatedDate to `maxDate`. Mirrors dedupe.appendUpdates. */
function unionIntoHub(hubFile, lines, maxDate) {
  const raw = fs.readFileSync(hubFile, 'utf-8');
  const fm = fmBlock(raw);
  const have = new Set(updateLines(raw).map((l) => normNote(noteOf(l))));
  const add = lines.filter((l) => !have.has(normNote(noteOf(l))));
  let block = fm[1];
  block = /^updatedDate:/m.test(block)
    ? block.replace(/^updatedDate:.*$/m, `updatedDate: ${maxDate}`)
    : `${block}\nupdatedDate: ${maxDate}`;
  if (add.length) {
    const rendered = add.map((l) => (l.startsWith('  ') ? l : `  ${l.trim()}`)).join('\n');
    block = /^updates:/m.test(block)
      ? block.replace(/^updates:.*$/m, (m) => `${m.replace(/\s*\[\s*\]\s*$/, '')}\n${rendered}`)
      : `${block}\nupdates:\n${rendered}`;
  }
  fs.writeFileSync(hubFile, raw.replace(fm[0], `---\n${block}\n---`));
  return add.length;
}

function apply(reviewPath, { yes }) {
  if (!reviewPath) { console.error('usage: node scripts/merge-review.js apply <review.json> --yes'); process.exit(1); }
  const full = path.isAbsolute(reviewPath) ? reviewPath : path.join(process.cwd(), reviewPath);
  const { clusters } = JSON.parse(fs.readFileSync(full, 'utf-8'));
  const memberCount = clusters.reduce((n, c) => n + c.members.length, 0);

  if (!yes) {
    console.log(`Would union ${memberCount} member timelines into ${clusters.length} canonicals and demote the members to draft:true.`);
    console.log('Destructive (reversible: members become drafts, timelines preserved). Re-run with --yes.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  let merged = 0, folded = 0, demoted = 0, missing = 0;
  for (const c of clusters) {
    if (!fs.existsSync(c.canonical.file)) { console.warn(`⚠️  canonical missing: ${c.canonical.slug}`); continue; }
    for (const m of c.members) {
      if (!fs.existsSync(m.file)) { missing++; console.warn(`⚠️  member gone: ${m.slug}`); continue; }
      const memberRaw = fs.readFileSync(m.file, 'utf-8');
      const lines = updateLines(memberRaw);
      lines.push(`  - { date: ${today}, note: "Merged duplicate coverage: ${String(m.title).replace(/"/g, "'").slice(0, 150)}" }`);
      const maxDate = [c.canonical.updatedDate, m.publishDate, today].filter(Boolean).sort().pop();
      folded += unionIntoHub(c.canonical.file, lines, maxDate);
      demoteToDraft(m.file);
      merged++; demoted++;
      console.log(`↳ ${m.slug} → merged into ${c.canonical.slug}, demoted to draft`);
    }
  }
  console.log(`\n✨ ${merged} members merged into ${clusters.length} canonicals; ${folded} timeline entries folded; ${demoted} demoted; ${missing} already gone.`);
  console.log('   git add -A to stage.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (cmd === 'review') {
    review(parseInt(argv[1] || WHOLE_CORPUS_DAYS, 10), argv[2] ? parseFloat(argv[2]) : undefined, argv[3] ? parseFloat(argv[3]) : undefined);
  } else if (cmd === 'apply') {
    apply(argv[1], { yes: argv.includes('--yes') });
  } else {
    console.error('usage:\n  node scripts/merge-review.js review [daysBack] [coTxt] [coEnt]\n  node scripts/merge-review.js apply <review.json> [--yes]');
    process.exit(1);
  }
}
