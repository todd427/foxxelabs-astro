#!/usr/bin/env node
/**
 * dedupe.js — story-identity gate for the news pipeline.
 *
 * The corpus IS the database: every decision is a pure function of the
 * committed markdown in src/content/news/. No external service, no index,
 * no network. Recomputed over a bounded window each run.
 *
 * SIMILARITY (lexical, pure JS):
 *   txt      = cosine(TF over full text: title + description + body)
 *   ent      = Jaccard(entity sets)
 *   combined = W_ENTITY * ent + W_TEXT * txt
 *
 * Full-text, not title-only: in this corpus the TITLES are the most reworded
 * part ("authorities" / "regulators" / "sectoral"), so the signal lives in the
 * body. An aggressive stopword list (English + AI-domain ubiquitous terms)
 * stands in for IDF, killing tokens that would inflate every pair.
 *
 * Two regimes, because the historical corpus has NO entities in frontmatter
 * (they only ever went to Supabase). Both sides have entities -> entity-aware
 * rule; either side lacks them -> higher-bar text-only threshold.
 *
 * Deliberately NOT an embedding model. To go semantic later, replace ONE
 * function — `cosine()` — with an embedding cosine over the same text.
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

// ── Tunable thresholds — calibrate via `node scripts/dedupe.js report` ──────
export const W_ENTITY        = 0.50;
export const W_TEXT          = 0.50;
export const DUP_COMBINED    = 0.50;  // entity regime: combined => duplicate
export const GATE_ENTITY     = 0.34;  // entity regime: AND-gate entity floor
export const GATE_TEXT       = 0.30;  // entity regime: AND-gate text floor
export const GATE_TEXT_ONLY  = 0.40;  // text-only regime: txt => duplicate
export const DEFAULT_WINDOW_DAYS = 120;

// English function words + AI-domain terms so ubiquitous they carry no signal.
const STOPWORDS = new Set((
  'a an the and or but of to in on for with at by from as is are was were be ' +
  'been being it its this that these those new how why what when who will would ' +
  'could should can may might into over under more most less than then them they ' +
  'their there here about after before up down out off your you we our us i ' +
  'has have had not no yes if so such all any one two get also amid via per ' +
  'ai artificial intelligence model models data technology tech news report ' +
  'reports said says year years week weeks month company companies system systems ' +
  'using use used make makes first latest according now today industry development ' +
  'developments launch release announced announces unveils foxxe labs'
).split(/\s+/));

const normText = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ');

function tokens(text) {
  return normText(text).split(/\s+/).filter(t => t && t.length > 1 && !STOPWORDS.has(t));
}

function tf(arr) {
  const m = new Map();
  for (const t of arr) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

const mag = (m) => Math.sqrt([...m.values()].reduce((s, w) => s + w * w, 0));

/** Cosine over two term-frequency maps. SWAP POINT for embeddings. */
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

/** Attach the full-text TF vector to a story object. Idempotent. */
export function makeStory(s) {
  if (s._textTf) return s;
  const text = `${s.title || ''} ${s.description || ''} ${s.content || ''}`;
  return { ...s, entities: Array.isArray(s.entities) ? s.entities : [], _textTf: tf(tokens(text)) };
}

export function score(a, b) {
  const A = a._textTf ? a : makeStory(a);
  const B = b._textTf ? b : makeStory(b);
  const txt = cosine(A._textTf, B._textTf);
  const ent = entityJaccard(A.entities, B.entities);
  const entitiesPresent = (A.entities?.length > 0) && (B.entities?.length > 0);
  const combined = W_ENTITY * ent + W_TEXT * txt;
  return { ent, txt, combined, entitiesPresent };
}

export function isDuplicate(s) {
  return s.entitiesPresent
    ? ((s.ent >= GATE_ENTITY && s.txt >= GATE_TEXT) || s.combined >= DUP_COMBINED)
    : (s.txt >= GATE_TEXT_ONLY);
}

export function findDuplicate(candidate, corpus) {
  const c = makeStory(candidate);
  let best = null;
  for (const existing of corpus) {
    const s = score(c, existing);
    if (isDuplicate(s) && (!best || s.combined > best.score.combined ||
        (best.score.combined === best.score.txt * W_TEXT && s.txt > best.score.txt))) {
      best = { match: existing, score: s };
    }
  }
  return best;
}

// ── Corpus loading (reads body, precomputes TF vectors) ──────────────────────
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
  console.log(`Loaded ${n} articles within ${daysBack}d.`);
  console.log(`Entities in frontmatter: ${withEnts}/${n} ` +
    `(${n ? Math.round(100 * withEnts / n) : 0}%) — the rest score text-only.\n`);
  if (n < 2) return;

  const bestTxt = new Array(n).fill(0);
  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const txt = cosine(corpus[i]._textTf, corpus[j]._textTf);
      if (txt > bestTxt[i]) bestTxt[i] = txt;
      if (txt > bestTxt[j]) bestTxt[j] = txt;
      if (txt >= 0.30) pairs.push([txt, i, j]);
    }
  }

  console.log('Articles whose nearest neighbour exceeds a text threshold:');
  for (const th of [0.30, 0.35, 0.40, 0.45, 0.50, 0.60, 0.70]) {
    console.log(`   txt >= ${th.toFixed(2)} : ${bestTxt.filter(v => v >= th).length}`);
  }

  pairs.sort((a, b) => b[0] - a[0]);
  console.log(`\nTop ${Math.min(25, pairs.length)} pairs by text similarity:`);
  for (const [txt, i, j] of pairs.slice(0, 25)) {
    console.log(`   ${txt.toFixed(2)}  ${corpus[i].title}`);
    console.log(`         <-> ${corpus[j].title}`);
  }

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
  console.log(`\n-- Clusters at active thresholds --`);
  for (const c of clusters.slice(0, 30)) {
    dupTotal += c.length - 1;
    console.log(`# ${c.length} articles (${c.length - 1} redundant):`);
    for (const m of c) {
      const tag = m.s.combined === 1 ? 'KEEP' : `dup t=${m.s.txt.toFixed(2)} e=${m.s.ent.toFixed(2)}`;
      console.log(`    [${tag}] ${corpus[m.idx].title}`);
    }
  }
  for (const c of clusters.slice(30)) dupTotal += c.length - 1;
  console.log(`\n${clusters.length} clusters; ${dupTotal} redundant of ${n} ` +
    `(${n ? Math.round(100 * dupTotal / n) : 0}% redundancy).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === 'report') report(parseInt(process.argv[3] || DEFAULT_WINDOW_DAYS, 10));
  else { console.error('usage: node scripts/dedupe.js report [daysBack]'); process.exit(1); }
}
