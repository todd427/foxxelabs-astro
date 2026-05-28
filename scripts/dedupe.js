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

// ── Tunable thresholds — RECALIBRATE from `node scripts/dedupe.js report` ────
// NOTE: TF-IDF changes the score scale vs the earlier raw-TF version. Re-read
// the report's nearest-neighbour ladder and top-pairs before trusting these.
export const W_ENTITY        = 0.50;
export const W_TEXT          = 0.50;
export const DUP_COMBINED    = 0.50;  // entity regime: combined => duplicate
export const GATE_ENTITY     = 0.34;  // entity regime: AND-gate entity floor
export const GATE_TEXT       = 0.30;  // entity regime: AND-gate text floor
export const GATE_TEXT_ONLY  = 0.45;  // text-only regime: txt => duplicate (PROVISIONAL)
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
  block = /^updates:/m.test(block)
    ? block.replace(/^updates:.*$/m, (m) => `${m}\n${item}`)
    : block + `\nupdates:\n${item}`;

  fs.writeFileSync(filePath, raw.replace(fm[0], `---\n${block}\n---`));
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
  const cmd = process.argv[2];
  if (cmd === 'report') report(parseInt(process.argv[3] || DEFAULT_WINDOW_DAYS, 10));
  else { console.error('usage: node scripts/dedupe.js report [daysBack]'); process.exit(1); }
}
