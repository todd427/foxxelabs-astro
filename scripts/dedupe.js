#!/usr/bin/env node
/**
 * dedupe.js — story-identity gate for the news pipeline.
 *
 * The corpus IS the database: every decision is a pure function of the
 * committed markdown in src/content/news/. No external service, no index,
 * no network. Recomputed over a bounded window each run.
 *
 * SIMILARITY (lexical TF-IDF, pure JS):
 *   txt      = cosine(TF-IDF over full text: title + description + body)
 *   ent      = Jaccard(entity sets)
 *   combined = W_ENTITY * ent + W_TEXT * txt
 *
 * Why TF-IDF, not raw TF: this corpus is topically saturated (Ireland / EU AI
 * Act / cyberpsychology). Raw TF cosine scored *distinct* stories on the same
 * topic at 0.40+ purely on shared topic vocabulary, conflating "same event"
 * with "same topic". IDF (computed over the window each run) downweights the
 * ubiquitous topic words and lets the distinctive tokens — the numbers, product
 * and org names that ARE the event identity — separate them.
 *
 * Two regimes: the historical corpus has NO entities in frontmatter (they only
 * ever went to Supabase). Both sides have entities -> entity-aware rule; either
 * side lacks them -> higher-bar text-only threshold.
 *
 * Not an embedding model: embeddings of two different "Ireland AI Office"
 * stories are also near-identical, so they would not separate same-event from
 * same-topic any better. Event identity is lexical-distinctive, not semantic.
 * To go semantic anyway, replace cosine()/vectorize() behind the same shape.
 *
 * CLI:
 *   node scripts/dedupe.js report [daysBack]   # calibration + clustering
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const NEWS_DIR = path.join(__dirname, '..', 'src', 'content', 'news');

// ── Thresholds — calibrated against the 864-article corpus (TF-IDF) ──────────
// GATE_TEXT_ONLY = 0.55: above this, near-all pairs are genuine rewrites; the
// 0.45-0.54 band mixes true dupes with topical cousins, so we bias high. The
// live gate's costly error is a false MERGE (burying a new story as an update),
// not a false miss (one near-dupe publishes), so erring high is the safe side.
export const W_ENTITY        = 0.50;
export const W_TEXT          = 0.50;
export const DUP_COMBINED    = 0.55;  // entity regime: combined => duplicate
export const GATE_ENTITY     = 0.34;  // entity regime: AND-gate entity floor
export const GATE_TEXT       = 0.35;  // entity regime: AND-gate text floor
export const GATE_TEXT_ONLY  = 0.55;  // text-only regime: txt => duplicate
export const DEFAULT_WINDOW_DAYS = 120;

const STOPWORDS = new Set((
  'a an the and or but of to in on for with at by from as is are was were be ' +
  'been being it its this that these those new how why what when who will would ' +
  'could should can may might into over under more most less than then them they ' +
  'their there here about after before up down out off your you we our us i ' +
  'has have had not no yes if so such all any one two get also amid via per'
).split(/\s+/));

const normText = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ');

function tokens(text) {
  return normText(text).split(/\s+/).filter(t => t && t.length > 1 && !STOPWORDS.has(t));
}

const storyText = (s) => `${s.title || ''} ${s.description || ''} ${s.content || ''}`;
const mag = (m) => Math.sqrt([...m.values()].reduce((a, w) => a + w * w, 0));

/** Cosine over two weight maps. SWAP POINT for embeddings. */
export function cosine(va, vb) {
  if (!va || !vb || !va.size || !vb.size) return 0;
  const [small, big] = va.size <= vb.size ? [va, vb] : [vb, va];
  let dot = 0;
  for (const [t, w] of small) if (big.has(t)) dot += w * big.get(t);
  const d = mag(va) * mag(vb);
  return d ? dot / d : 0;
}

function normEntity(e) {
  return normText(e).trim().replace(/\s+/g, ' ');
}

export function entityJaccard(aEnts = [], bEnts = []) {
  const A = new Set(aEnts.map(normEntity).filter(Boolean));
  const B = new Set(bEnts.map(normEntity).filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const e of A) if (B.has(e)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Normalise fields only (no vector yet). */
export function makeStory(s) {
  return { ...s, entities: Array.isArray(s.entities) ? s.entities : [] };
}

/** Build a TF-IDF index over a set of stories, attaching `_vec` to each.
 *  Mutates in place; returns { idf, maxIdf } for vectorising new candidates. */
export function buildIndex(stories) {
  const N = stories.length || 1;
  const df = new Map();
  for (const s of stories) {
    s._toks = tokens(storyText(s));
    for (const t of new Set(s._toks)) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = new Map();
  for (const [t, d] of df) idf.set(t, Math.log((N + 1) / (d + 1)) + 1);
  const maxIdf = Math.log((N + 1) / 1) + 1; // unseen/rarest token weight
  for (const s of stories) { s._vec = tfidf(s._toks, idf, maxIdf); delete s._toks; }
  return { idf, maxIdf };
}

function tfidf(toks, idf, maxIdf) {
  const tf = new Map();
  for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
  const v = new Map();
  for (const [t, c] of tf) v.set(t, c * (idf.get(t) ?? maxIdf));
  return v;
}

/** Vectorise a single story against an existing corpus's IDF. */
export function vectorize(story, corpus) {
  const s = makeStory(story);
  s._vec = tfidf(tokens(storyText(s)), corpus.idf, corpus.maxIdf);
  return s;
}

export function score(a, b) {
  const txt = cosine(a._vec, b._vec);
  const ent = entityJaccard(a.entities, b.entities);
  const entitiesPresent = (a.entities?.length > 0) && (b.entities?.length > 0);
  const combined = W_ENTITY * ent + W_TEXT * txt;
  return { ent, txt, combined, entitiesPresent };
}

export function isDuplicate(s) {
  return s.entitiesPresent
    ? ((s.ent >= GATE_ENTITY && s.txt >= GATE_TEXT) || s.combined >= DUP_COMBINED)
    : (s.txt >= GATE_TEXT_ONLY);
}

export function findDuplicate(candidate, corpus) {
  const c = candidate._vec ? candidate : vectorize(candidate, corpus);
  let best = null;
  for (const existing of corpus) {
    const s = score(c, existing);
    if (isDuplicate(s) && (!best || s.txt > best.score.txt)) {
      best = { match: existing, score: s };
    }
  }
  return best;
}

// ── Corpus loading (reads body, builds the TF-IDF index) ─────────────────────
export function loadCorpusWindow(daysBack = DEFAULT_WINDOW_DAYS, newsDir = NEWS_DIR) {
  if (!fs.existsSync(newsDir)) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const out = [];
  for (const file of fs.readdirSync(newsDir)) {
    if (!file.endsWith('.md')) continue;
    const full = path.join(newsDir, file);
    try {
      const { data, content } = matter(fs.readFileSync(full, 'utf-8'));
      const pub = data.publishDate ? new Date(data.publishDate) : null;
      if (pub && pub < cutoff) continue;
      out.push(makeStory({
        file: full,
        slug: file.replace(/\.md$/, ''),
        title: data.title || '',
        description: data.description || '',
        content,
        entities: Array.isArray(data.entities) ? data.entities : [],
        publishDate: data.publishDate || null,
      }));
    } catch { /* unreadable — skip */ }
  }
  const { idf, maxIdf } = buildIndex(out);
  out.idf = idf;
  out.maxIdf = maxIdf;
  return out;
}

// ── Timeline append (surgical: preserve existing frontmatter formatting) ─────
export function appendUpdate(filePath, { date, note, sourceUrl }) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error(`No frontmatter block in ${filePath}`);

  const cleanNote = String(note).replace(/\s+/g, ' ').replace(/"/g, "'").trim().slice(0, 200);
  const item = `  - { date: ${date}, note: "${cleanNote}"` + (sourceUrl ? `, sourceUrl: "${sourceUrl}" }` : ` }`);

  let block = fm[1];
  block = /^updatedDate:/m.test(block)
    ? block.replace(/^updatedDate:.*$/m, `updatedDate: ${date}`)
    : block + `\nupdatedDate: ${date}`;
  // Strip an inline empty array on the matched line — the generator writes
  // `updates: []` for new posts; appending `\n  - {...}` underneath that is
  // invalid YAML and breaks astro check at build time.
  block = /^updates:/m.test(block)
    ? block.replace(/^updates:.*$/m, (m) => `${m.replace(/\s*\[\s*\]\s*$/, '')}\n${item}`)
    : block + `\nupdates:\n${item}`;

  fs.writeFileSync(filePath, raw.replace(fm[0], `---\n${block}\n---`));
}

// ── Item 2: reviewed dupe collapse (connected components, not seed-anchored) ──
// The `report` clustering is seed-anchored: a central seed pulls in topical
// cousins, so a single component can mix three distinct stories. For an actual
// (destructive) collapse we want a STRICTER edge and TRANSITIVE grouping, so
// every member is genuinely a near-dupe of every other via a chain of strong
// links — not merely close to one central article.
export const STRONG_TXT      = 0.65;  // text-only edge: stricter than the live gate
export const STRONG_COMBINED = 0.62;  // entity regime edge
export const STRONG_ENTITY   = GATE_ENTITY;

/** A strong (collapse-grade) duplicate edge between two scored stories. */
export function isStrongDuplicate(s, { edgeTxt = STRONG_TXT, edgeCombined = STRONG_COMBINED } = {}) {
  return s.entitiesPresent
    ? (s.ent >= STRONG_ENTITY && s.combined >= edgeCombined)
    : (s.txt >= edgeTxt);
}

/** Union-find connected components over the corpus using `edgeFn(scoreObj)`. */
export function connectedComponents(corpus, edgeFn) {
  const n = corpus.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (edgeFn(score(corpus[i], corpus[j]))) union(i, j);
    }
  }
  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(i);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

const pubTime = (s) => { const t = s.publishDate ? new Date(s.publishDate).getTime() : NaN; return Number.isNaN(t) ? Infinity : t; };

/** Build a non-destructive review file of proposed collapses. Writes nothing
 *  to the corpus. Canonical = earliest-published article in the component; the
 *  rest are proposed for folding into its timeline. */
function review(daysBack, edgeTxt) {
  const corpus = loadCorpusWindow(daysBack);
  const opts = edgeTxt ? { edgeTxt } : {};
  const comps = connectedComponents(corpus, (s) => isStrongDuplicate(s, opts));

  const clusters = comps.map((idxs) => {
    const sorted = [...idxs].sort((a, b) => pubTime(corpus[a]) - pubTime(corpus[b]));
    const canonical = corpus[sorted[0]];
    const members = sorted.slice(1).map((i) => {
      const s = score(canonical, corpus[i]);
      return {
        slug: corpus[i].slug,
        file: corpus[i].file,
        title: corpus[i].title,
        publishDate: corpus[i].publishDate,
        score: { txt: +s.txt.toFixed(3), ent: +s.ent.toFixed(3), combined: +s.combined.toFixed(3) },
      };
    });
    return {
      canonical: { slug: canonical.slug, file: canonical.file, title: canonical.title, publishDate: canonical.publishDate },
      members,
    };
  }).sort((a, b) => b.members.length - a.members.length);

  const foldable = clusters.reduce((n, c) => n + c.members.length, 0);
  const outPath = path.join(__dirname, '..', 'dedupe-review.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    windowDays: daysBack,
    edge: edgeTxt ? { edgeTxt } : { edgeTxt: STRONG_TXT, edgeCombined: STRONG_COMBINED, entity: STRONG_ENTITY },
    corpusSize: corpus.length,
    note: 'Review/edit before apply. Delete a cluster or a member to reject it. ' +
      'apply folds each member lede into the canonical updates timeline, then archives the member file.',
    clusters,
  }, null, 2));

  console.log(`Reviewed ${corpus.length} articles (window ${daysBack}d).`);
  console.log(`${clusters.length} collapse clusters; ${foldable} articles proposed for folding.\n`);
  for (const c of clusters.slice(0, 25)) {
    console.log(`# canonical: ${c.canonical.slug}  (${c.members.length} to fold)`);
    console.log(`    ${c.canonical.title}`);
    for (const m of c.members.slice(0, 8)) {
      console.log(`    └ [c=${m.score.combined} t=${m.score.txt} e=${m.score.ent}] ${m.title}`);
    }
    if (c.members.length > 8) console.log(`    └ … +${c.members.length - 8} more`);
  }
  if (clusters.length > 25) console.log(`… +${clusters.length - 25} more clusters`);
  console.log(`\nReview file written: ${outPath}`);
  console.log(`Approve, then: node scripts/dedupe.js apply dedupe-review.json --yes`);
}

/** Destructive: fold each reviewed member into its canonical timeline, then
 *  move the member file out of the collection into archive/news/. Requires
 *  --yes. Re-reads each member's frontmatter so the folded lede is authoritative. */
function applyReview(reviewPath, { yes }) {
  if (!reviewPath) { console.error('usage: node scripts/dedupe.js apply <review.json> --yes'); process.exit(1); }
  const full = path.isAbsolute(reviewPath) ? reviewPath : path.join(process.cwd(), reviewPath);
  const { clusters } = JSON.parse(fs.readFileSync(full, 'utf-8'));
  const foldable = clusters.reduce((n, c) => n + c.members.length, 0);

  if (!yes) {
    console.log(`Would fold ${foldable} articles into ${clusters.length} canonicals and archive them.`);
    console.log('Destructive. Re-run with --yes to execute.');
    return;
  }

  const archiveDir = path.join(__dirname, '..', 'archive', 'news');
  fs.mkdirSync(archiveDir, { recursive: true });
  let folded = 0, archived = 0, missing = 0;

  for (const c of clusters) {
    if (!fs.existsSync(c.canonical.file)) { console.warn(`⚠️  canonical missing, skipping cluster: ${c.canonical.slug}`); continue; }
    for (const m of c.members) {
      if (!fs.existsSync(m.file)) { missing++; console.warn(`⚠️  member already gone: ${m.slug}`); continue; }
      const { data } = matter(fs.readFileSync(m.file, 'utf-8'));
      const date = (m.publishDate ? new Date(m.publishDate) : new Date()).toISOString().split('T')[0];
      appendUpdate(c.canonical.file, {
        date,
        note: data.description || data.title || m.title || m.slug,
        sourceUrl: data.sourceUrl,
      });
      folded++;
      fs.renameSync(m.file, path.join(archiveDir, path.basename(m.file)));
      archived++;
      console.log(`↳ folded ${m.slug} → ${c.canonical.slug}; archived.`);
    }
  }
  console.log(`\n✨ Collapsed: ${folded} folded, ${archived} archived to archive/news/, ${missing} already gone.`);
  console.log('   Member files left the collection; git add -A to stage the moves.');
}

// ── CLI: calibration + clustering report (no API, no writes) ─────────────────
function report(daysBack) {
  const corpus = loadCorpusWindow(daysBack);
  const n = corpus.length;
  const withEnts = corpus.filter(c => c.entities.length > 0).length;
  console.log(`Loaded ${n} articles within ${daysBack}d (TF-IDF).`);
  console.log(`Entities in frontmatter: ${withEnts}/${n} ` +
    `(${n ? Math.round(100 * withEnts / n) : 0}%) — the rest score text-only.\n`);
  if (n < 2) return;

  const bestTxt = new Array(n).fill(0);
  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const txt = cosine(corpus[i]._vec, corpus[j]._vec);
      if (txt > bestTxt[i]) bestTxt[i] = txt;
      if (txt > bestTxt[j]) bestTxt[j] = txt;
      if (txt >= 0.30) pairs.push([txt, i, j]);
    }
  }

  console.log('Articles whose nearest neighbour exceeds a text threshold:');
  for (const th of [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.70, 0.80]) {
    console.log(`   txt >= ${th.toFixed(2)} : ${bestTxt.filter(v => v >= th).length}`);
  }

  pairs.sort((a, b) => b[0] - a[0]);
  console.log(`\nTop ${Math.min(30, pairs.length)} pairs by text similarity:`);
  for (const [txt, i, j] of pairs.slice(0, 30)) {
    console.log(`   ${txt.toFixed(2)}  ${corpus[i].title}`);
    console.log(`         <-> ${corpus[j].title}`);
  }

  // Seed-anchored clusters at active thresholds (approximate — a central seed
  // pulls in topical cousins, so treat sizes as an upper bound, not gospel).
  const seen = new Set();
  const clusters = [];
  for (let i = 0; i < n; i++) {
    if (seen.has(i)) continue;
    const members = [{ idx: i, s: { combined: 1, ent: 1, txt: 1 } }];
    for (let j = i + 1; j < n; j++) {
      if (seen.has(j)) continue;
      const s = score(corpus[i], corpus[j]);
      if (isDuplicate(s)) { members.push({ idx: j, s }); seen.add(j); }
    }
    if (members.length > 1) { seen.add(i); clusters.push(members); }
  }
  clusters.sort((a, b) => b.length - a.length);
  let dupTotal = 0;
  console.log(`\n-- Seed-anchored clusters at active thresholds (approx) --`);
  for (const c of clusters.slice(0, 20)) {
    dupTotal += c.length - 1;
    console.log(`# ${c.length} articles (${c.length - 1} folded):`);
    for (const m of c.slice(0, 8)) {
      const tag = m.s.combined === 1 ? 'KEEP' : `t=${m.s.txt.toFixed(2)}`;
      console.log(`    [${tag}] ${corpus[m.idx].title}`);
    }
    if (c.length > 8) console.log(`    ... +${c.length - 8} more`);
  }
  for (const c of clusters.slice(20)) dupTotal += c.length - 1;
  console.log(`\n${clusters.length} clusters; ${dupTotal} folded of ${n} ` +
    `(${n ? Math.round(100 * dupTotal / n) : 0}%).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  // Collapse over the whole corpus by default; the live gate uses a short window.
  const WHOLE_CORPUS_DAYS = 36500;
  if (cmd === 'report') {
    report(parseInt(argv[1] || DEFAULT_WINDOW_DAYS, 10));
  } else if (cmd === 'review') {
    const daysBack = parseInt(argv[1] || WHOLE_CORPUS_DAYS, 10);
    const edgeTxt = argv[2] ? parseFloat(argv[2]) : undefined;
    review(daysBack, edgeTxt);
  } else if (cmd === 'apply') {
    applyReview(argv[1], { yes: argv.includes('--yes') });
  } else {
    console.error('usage:\n  node scripts/dedupe.js report [daysBack]\n' +
      '  node scripts/dedupe.js review [daysBack] [edgeTxt]\n' +
      '  node scripts/dedupe.js apply <review.json> [--yes]');
    process.exit(1);
  }
}
