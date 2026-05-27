#!/usr/bin/env node
/**
 * dedupe.js — story-identity gate for the news pipeline.
 *
 * The corpus IS the database: every decision is a pure function of the
 * committed markdown in src/content/news/. No external service, no index,
 * no network. Recomputed over a bounded window each run.
 *
 * SIMILARITY PRIMITIVE (lexical, pure JS):
 *   combined = W_ENTITY * entityJaccard + W_TEXT * tokenCosine
 *   A candidate is a duplicate of an existing story when it clears the
 *   entity + text gates, OR the combined score clears DUP_COMBINED.
 *
 * This is deliberately NOT an embedding model. The duplicates in this corpus
 * are lexical (shared entities, shared hard tokens, reworded headlines), so a
 * deterministic pure-JS measure catches them with zero native deps. To upgrade
 * to semantic matching later, replace ONE function — `textSimilarity()` — with
 * an embedding cosine behind the same signature. Nothing else changes.
 *
 * CLI:
 *   node scripts/dedupe.js report [daysBack]   # cluster the corpus, print scores
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const NEWS_DIR = path.join(__dirname, '..', 'src', 'content', 'news');

// ── Tunable thresholds ────────────────────────────────────────────────────
// Calibrate against `node scripts/dedupe.js report` before trusting these.
// The existing corpus is a labelled goldmine of known-dup clusters.
export const W_ENTITY      = 0.55;  // weight: entity-set Jaccard
export const W_TEXT        = 0.45;  // weight: title+description token cosine
export const DUP_COMBINED  = 0.60;  // combined score => duplicate
export const GATE_ENTITY   = 0.34;  // entity overlap floor for the AND-gate
export const GATE_TEXT     = 0.45;  // text similarity floor for the AND-gate
export const DEFAULT_WINDOW_DAYS = 120; // slow stories persist for months

const STOPWORDS = new Set((
  'a an the and or but of to in on for with at by from as is are was were be ' +
  'been being it its this that these those new how why what when who will would ' +
  'could should can may might into over under more most less than then them they ' +
  'their there here about after before up down out off your you we our us i'
).split(' '));

// ── Normalisation ──────────────────────────────────────────────────────────
const normToken = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ');

function tokens(text) {
  return normToken(text)
    .split(/\s+/)
    .filter(t => t && t.length > 1 && !STOPWORDS.has(t));
}

function normEntity(e) {
  return normToken(String(e)).trim().replace(/\s+/g, ' ');
}

// ── Similarity components ────────────────────────────────────────────────────
export function entityJaccard(aEnts = [], bEnts = []) {
  const A = new Set(aEnts.map(normEntity).filter(Boolean));
  const B = new Set(bEnts.map(normEntity).filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const e of A) if (B.has(e)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Token-frequency cosine over the candidate's title+description text.
 * SWAP POINT: replace the body with an embedding cosine to go semantic.
 */
export function textSimilarity(aText = '', bText = '') {
  const a = tokens(aText);
  const b = tokens(bText);
  if (!a.length || !b.length) return 0;
  const tf = (arr) => {
    const m = new Map();
    for (const t of arr) m.set(t, (m.get(t) || 0) + 1);
    return m;
  };
  const va = tf(a);
  const vb = tf(b);
  let dot = 0;
  for (const [t, w] of va) if (vb.has(t)) dot += w * vb.get(t);
  const mag = (m) => Math.sqrt([...m.values()].reduce((s, w) => s + w * w, 0));
  const denom = mag(va) * mag(vb);
  return denom ? dot / denom : 0;
}

const candText = (c) => `${c.title || ''}. ${c.description || ''}`;

export function score(a, b) {
  const ent = entityJaccard(a.entities, b.entities);
  const txt = textSimilarity(candText(a), candText(b));
  const combined = W_ENTITY * ent + W_TEXT * txt;
  return { ent, txt, combined };
}

export function isDuplicate({ ent, txt, combined }) {
  return (ent >= GATE_ENTITY && txt >= GATE_TEXT) || combined >= DUP_COMBINED;
}

/**
 * Find the best-matching existing story for a candidate.
 * Returns { match, score } or null. `corpus` is an array of story objects
 * ({ file, title, description, entities, publishDate }).
 */
export function findDuplicate(candidate, corpus) {
  let best = null;
  for (const existing of corpus) {
    const s = score(candidate, existing);
    if (isDuplicate(s) && (!best || s.combined > best.score.combined)) {
      best = { match: existing, score: s };
    }
  }
  return best;
}

// ── Corpus loading ───────────────────────────────────────────────────────────
export function loadCorpusWindow(daysBack = DEFAULT_WINDOW_DAYS, newsDir = NEWS_DIR) {
  if (!fs.existsSync(newsDir)) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);

  const out = [];
  for (const file of fs.readdirSync(newsDir)) {
    if (!file.endsWith('.md')) continue;
    const full = path.join(newsDir, file);
    try {
      const { data } = matter(fs.readFileSync(full, 'utf-8'));
      const pub = data.publishDate ? new Date(data.publishDate) : null;
      if (pub && pub < cutoff) continue;
      out.push({
        file: full,
        slug: file.replace(/\.md$/, ''),
        title: data.title || '',
        description: data.description || '',
        entities: Array.isArray(data.entities) ? data.entities : [],
        publishDate: data.publishDate || null,
      });
    } catch { /* unreadable — skip */ }
  }
  return out;
}

// ── Timeline append (surgical: preserve existing frontmatter formatting) ─────
/**
 * Append a dated entry to an existing story's `updates:` array and bump
 * `updatedDate`, WITHOUT reformatting the rest of the frontmatter (keeps git
 * diffs clean). Reads with gray-matter for safety; writes by inserting only
 * the changed lines into the original frontmatter block.
 */
export function appendUpdate(filePath, { date, note, sourceUrl }) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error(`No frontmatter block in ${filePath}`);

  const cleanNote = String(note).replace(/\s+/g, ' ').replace(/"/g, "'").trim().slice(0, 200);
  const item = `  - { date: ${date}, note: "${cleanNote}"` +
               (sourceUrl ? `, sourceUrl: "${sourceUrl}" }` : ` }`);

  let block = fm[1];

  // updatedDate: replace if present, else add.
  if (/^updatedDate:/m.test(block)) {
    block = block.replace(/^updatedDate:.*$/m, `updatedDate: ${date}`);
  } else {
    block += `\nupdatedDate: ${date}`;
  }

  // updates: append item if the key exists, else create the block.
  if (/^updates:/m.test(block)) {
    // insert the new item immediately after the `updates:` line
    block = block.replace(/^updates:.*$/m, (m) => `${m}\n${item}`);
  } else {
    block += `\nupdates:\n${item}`;
  }

  const updated = raw.replace(fm[0], `---\n${block}\n---`);
  fs.writeFileSync(filePath, updated);
}

// ── CLI: corpus clustering report (no API, no writes) ─────────────────────────
function report(daysBack) {
  const corpus = loadCorpusWindow(daysBack);
  console.log(`Loaded ${corpus.length} articles within ${daysBack}d.\n`);
  const seen = new Set();
  const clusters = [];
  for (let i = 0; i < corpus.length; i++) {
    if (seen.has(i)) continue;
    const members = [{ idx: i, s: { combined: 1, ent: 1, txt: 1 } }];
    for (let j = i + 1; j < corpus.length; j++) {
      if (seen.has(j)) continue;
      const s = score(corpus[i], corpus[j]);
      if (isDuplicate(s)) { members.push({ idx: j, s }); seen.add(j); }
    }
    if (members.length > 1) { seen.add(i); clusters.push(members); }
  }
  clusters.sort((a, b) => b.length - a.length);
  let dupTotal = 0;
  for (const c of clusters) {
    dupTotal += c.length - 1;
    console.log(`■ cluster of ${c.length} (${c.length - 1} redundant):`);
    for (const m of c) {
      const tag = m.s.combined === 1 ? 'KEEP' :
        `dup c=${m.s.combined.toFixed(2)} e=${m.s.ent.toFixed(2)} t=${m.s.txt.toFixed(2)}`;
      console.log(`    [${tag}] ${corpus[m.idx].title}`);
    }
    console.log('');
  }
  console.log(`${clusters.length} clusters; ${dupTotal} redundant of ${corpus.length} ` +
              `(${corpus.length ? Math.round(100 * dupTotal / corpus.length) : 0}% redundancy).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === 'report') report(parseInt(process.argv[3] || DEFAULT_WINDOW_DAYS, 10));
  else { console.error('usage: node scripts/dedupe.js report [daysBack]'); process.exit(1); }
}
