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
 *   overlap  = inter / min(|A|,|B|)  — robust to asymmetric set sizes
 *   combined = W_ENTITY * ent + W_TEXT * txt
 *   event    = same-event signature (shared headline org + salient number)
 *
 * Why an event signature, on top of Jaccard: Jaccard divides by the UNION, so the
 * better the extraction tags an event the larger the union and the LOWER the score
 * — the entity arm weakens exactly as extraction improves. A richly-tagged 06-18
 * Patch-Tuesday piece (11 entities) and a sparsely-tagged 06-13 one (6) framed on
 * federal policy share only ~1 canonical entity, so union-Jaccard ≈ 0.06 and the
 * AND-gate cannot fire even though they are plainly the same event. The event
 * signature sidesteps this by reading only the HEADLINE — the core org + the
 * record-scale number that NAME the event — which the divergent bodies otherwise
 * dilute. It is a signal fix, not a threshold drop: false MERGE stays worse than
 * false miss, so it demands a shared org AND a shared record-scale number (plus a
 * weak cosine floor) before it fires.
 *
 * The overlap coefficient (inter / min set size) is also computed and surfaced in
 * the `score()` result as a calibration signal — it exposes the asymmetric pairs
 * Jaccard hides — but it is NOT a gate trigger: on this saturated corpus a high
 * overlap of two small entity sets over-merges distinct same-topic stories.
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
 * CLAIM IDENTITY (the strongest arm, when claims are supplied): findDuplicate
 * consults the claim substrate FIRST. Two stories that share a primary event
 * claim are the same story regardless of lexical score. Same-event is keyed on
 * the claim's own identity fields — (specific entity, event_date) — before its
 * prose (see claims.js sameEventClaim / statementsMatch). The lexical + event
 * arms below remain the backstop for stories without captured claims.
 *
 * IMPORTANT — claim identity is for the LIVE gate only (findDuplicate: pairwise,
 * candidate folds into one best match, no transitivity). It is deliberately NOT
 * used as an edge in the offline connected-components collapse (review): a
 * multi-event roundup article shares one claim with story A and another with B,
 * so a claim edge chains unrelated stories into one component through the hub.
 * The offline collapse edge stays lexical-only; a safe offline same-event mode
 * needs non-transitive pairwise anchoring + a lexical/entity co-floor + a
 * moving-story guard + canonical = folding hub, which is a separate mode.
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
import { aliasCanonical, entityKey } from './entities.js';
import { statementsMatch, sameEventClaim } from './claims.js';

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
export const GATE_ENTITY     = 0.34;  // entity regime: AND-gate entity floor (Jaccard)
export const GATE_TEXT       = 0.35;  // entity regime: AND-gate text floor
// Event-signature arm: a shared core (headline) entity AND a shared record-scale
// headline number fold even when union-Jaccard and full-text cosine both miss.
// SALIENT_NUM_MIN screens out the figures that collide coincidentally on a
// saturated corpus (percentages, journal-volume numbers, small counts): only
// record-scale figures (>= 100) are distinctive enough to co-identify an event.
// EVENT_TXT_FLOOR is a weak cosine guard — the brief's "regardless of body
// cosine" assumed a richer composite signature; with a plain org+number key a
// low floor is the cheap defence against an org+number coincidence (e.g.
// "Anthropic acquires X" vs "Anthropic commits $200M") that would false-merge.
export const SALIENT_NUM_MIN = 100;
export const EVENT_TXT_FLOOR = 0.30;
// Claim arm: a shared primary event claim is strong evidence of the same event,
// but on its own it is not evidence that two ARTICLES are the same story. The arm
// shipped with no similarity floor at all — one shared (entity, event_date) tuple
// folded a candidate into any story in the window regardless of how unrelated the
// bodies were. Because every fold appends its claims to the target, hub stories
// accreted claim sets in the hundreds and each fold widened the net for the next
// candidate: a rich-get-richer loop that drove new-article output to zero.
// This mirrors EVENT_TXT_FLOOR — a weak cosine guard, not a second full gate.
export const CLAIM_TXT_FLOOR = 0.30;
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

// Canonicalise through the alias dictionary so "MCP", "Model Context Protocol",
// and "Model Context Protocol (MCP)" collapse to one entity before Jaccard.
// Unknown entities fall back to their own normalised key (prior behaviour).
function normEntity(e) {
  return aliasCanonical(e);
}

export function entityJaccard(aEnts = [], bEnts = []) {
  const A = new Set(aEnts.map(normEntity).filter(Boolean));
  const B = new Set(bEnts.map(normEntity).filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const e of A) if (B.has(e)) inter++;
  return inter / (A.size + B.size - inter);
}

// Overlap coefficient: intersection over the SMALLER set, not the union. Jaccard
// punishes asymmetry (a richly-tagged story drags every pairing down via the
// union); overlap asks "what fraction of the sparser story's entities does the
// richer one already cover?" Surfaced in the score() result for calibration only
// (see header) — it exposes the asymmetric same-event pairs Jaccard hides, but is
// not a gate trigger.
export function entityOverlap(aEnts = [], bEnts = []) {
  const A = new Set(aEnts.map(normEntity).filter(Boolean));
  const B = new Set(bEnts.map(normEntity).filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const e of A) if (B.has(e)) inter++;
  return inter / Math.min(A.size, B.size);
}

// ── Event signature (date-windowed same-event identity) ──────────────────────
// The headline (title + description) carries the event's identity in two kinds
// of token the body dilutes: the CORE entities (the org/product the story is
// about) and the SALIENT numbers (the record count, the CVE tally — the
// IDF-distinctive figures that name the event). Two windowed stories that share
// a core entity AND a salient headline number are the same event even when their
// bodies frame it differently (policy vs patch-detail) — the exact case full-text
// cosine + union-Jaccard miss. Requiring BOTH a shared org AND a shared number
// keeps distinct same-org stories ("Microsoft buys X", "Microsoft patches 200")
// from collapsing. The window is enforced by the caller's corpus, not here.
//
// NOTE: this arm only fires for events NAMED BY A RECORD-SCALE NUMBER (patch
// counts, CVE tallies, breach sizes). Events named by "what + when" — model
// launches, funding rounds, acquisitions, appointments — carry no headline
// number >= 100, so this arm cannot see them; the claim-identity arm
// (sameEventClaim, keyed on (specific entity, event_date)) covers that class.
const YEAR_RE = /^(?:1[89]|20)\d{2}$/;

/** Record-scale integers in headline text: >= min and not a calendar year.
 *  The default `min` (SALIENT_NUM_MIN) excludes the small numbers and
 *  percentages that recur across unrelated stories and would false-merge. */
export function salientNumbers(text, min = SALIENT_NUM_MIN) {
  const out = new Set();
  for (const m of String(text).matchAll(/\d[\d,]*/g)) {
    const digits = m[0].replace(/,/g, '');
    if (YEAR_RE.test(digits)) continue;
    const n = parseInt(digits, 10);
    if (Number.isFinite(n) && n >= min) out.add(String(n));
  }
  return out;
}

const headline = (s) => `${s.title || ''} ${s.description || ''}`;

/** Canonicalised entities that actually surface in the story's headline (title
 *  or description) — the entities the story is *about*, not every body tag.
 *  Matches whole normalised phrases (space-bounded) so short keys like "iis"
 *  can't match inside unrelated words. */
export function coreEntities(story) {
  const hay = ` ${entityKey(headline(story))} `;
  const out = new Set();
  for (const e of (story.entities || [])) {
    const k = entityKey(e);
    if (k && hay.includes(` ${k} `)) out.add(normEntity(e));
  }
  return out;
}

/** True when a and b are the same event: a shared core (headline) entity AND a
 *  shared salient headline number. Symmetric. */
export function sameEvent(a, b) {
  const aCore = coreEntities(a);
  if (!aCore.size) return false;
  const bCore = coreEntities(b);
  let sharedOrg = false;
  for (const e of aCore) if (bCore.has(e)) { sharedOrg = true; break; }
  if (!sharedOrg) return false;
  const aNum = salientNumbers(headline(a));
  if (!aNum.size) return false;
  const bNum = salientNumbers(headline(b));
  for (const n of aNum) if (bNum.has(n)) return true;
  return false;
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
  const overlap = entityOverlap(a.entities, b.entities);
  const entitiesPresent = (a.entities?.length > 0) && (b.entities?.length > 0);
  const combined = W_ENTITY * ent + W_TEXT * txt;
  // Event arm carries the weak cosine guard so the signature stays a pure check.
  const event = txt >= EVENT_TXT_FLOOR && sameEvent(a, b);
  return { ent, overlap, txt, combined, entitiesPresent, event };
}

export function isDuplicate(s) {
  if (s.event) return true;   // shared headline org + record-scale number, in-window
  return s.entitiesPresent
    ? ((s.ent >= GATE_ENTITY && s.txt >= GATE_TEXT) || s.combined >= DUP_COMBINED)
    : (s.txt >= GATE_TEXT_ONLY);
}

// ── Claim-identity layer (the brief's primary fix) ───────────────────────────
// The strongest "same story" signal is not lexical — it's whether the candidate's
// PRIMARY EVENT CLAIM already exists in a windowed story. Two Patch-Tuesday pieces
// share "Microsoft June 2026 Patch Tuesday: record ~200 fixes" even when their
// bodies diverge. This consults the captured claims, so it sees event identity the
// full-text cosine + union-Jaccard miss. It is high-precision/low-recall (the
// matchers are deliberately strict — false merge worse than false miss), so the
// lexical+event score() stays the backstop, not the sole gate.
//
// Two match modes, tried in order (see claims.js):
//   1. IDENTITY — sameEventClaim: shared (specific entity, event_date). Catches
//      launches / funding / M&A, whose identity is "what + when" and which the
//      lexical and salient-number arms structurally miss.
//   2. PROSE — statementsMatch: near-identical statement text. Catches recurring
//      or undated events that carry no clean date key.
//
// Granularity (which claims count as "primary") is the open calibration question
// from the parent brief; the heuristic is the "what happened" atoms —
// announcements and regulatory facts.
//
// There is deliberately NO fallback to the full claim set. That fallback used to
// fire whenever a candidate carried no announcement/regulatory-fact claim, which
// promoted `data-point` atoms ("the wage premium hit 62%") to event-identity keys
// — figures that recur across unrelated stories and co-identify nothing. A story
// with no primary claim has no event identity to match on, so it should fall
// through to the lexical/event arms rather than key on statistics.
export function primaryEventClaims(claims = []) {
  return claims.filter((c) => c.claim_type === 'announcement' || c.claim_type === 'regulatory-fact');
}

/** True when two claim sets share a primary event claim — by identity first
 *  (shared specific entity + event_date), then by near-identical statement text.
 *  Reuses sameEventClaim + statementsMatch from the claim substrate. */
export function sharePrimaryEventClaim(aClaims = [], bClaims = []) {
  const a = primaryEventClaims(aClaims);
  const b = primaryEventClaims(bClaims);
  // Identity first: a shared (specific entity, event_date) tuple is the same event
  // even when statements are angled differently and bodies diverge — the exact
  // launch / funding / M&A case the lexical and salient-number arms miss.
  for (const x of a) for (const y of b) if (sameEventClaim(x, y)) return true;
  // Prose fallback: near-identical statements (recurring or undated events).
  for (const x of a) for (const y of b) if (statementsMatch(x.statement, y.statement)) return true;
  return false;
}

/** Find the best existing story this candidate duplicates, or null.
 *  When `opts.claims` (the candidate's claims) and `opts.claimsByStory`
 *  (Map slug -> claims[]) are supplied, a shared primary event claim is checked
 *  FIRST and wins regardless of lexical score; otherwise (and as backstop) the
 *  lexical + event-signature gate decides. The result carries a `reason`. */
export function findDuplicate(candidate, corpus, opts = {}) {
  const { claims = null, claimsByStory = null } = opts;
  const c = candidate._vec ? candidate : vectorize(candidate, corpus);

  if (claims && claims.length && claimsByStory) {
    let best = null;
    for (const existing of corpus) {
      const storyClaims = claimsByStory.get(existing.slug);
      if (!storyClaims || !storyClaims.length) continue;
      if (!sharePrimaryEventClaim(claims, storyClaims)) continue;
      const s = score(c, existing);
      // Weak topical guard. Without it a lone shared claim tuple folds two
      // articles that share nothing else — see CLAIM_TXT_FLOOR.
      if (s.txt < CLAIM_TXT_FLOOR) continue;
      if (!best || s.txt > best.score.txt) best = { match: existing, score: s, reason: 'claim' };
    }
    if (best) return best;
  }

  let best = null;
  for (const existing of corpus) {
    const s = score(c, existing);
    if (isDuplicate(s) && (!best || s.txt > best.score.txt)) {
      best = { match: existing, score: s, reason: s.event ? 'event' : 'lexical' };
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
        draft: data.draft === true,
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

// Fold several novel claims into a story's timeline in one surgical write.
// Each item is { note, sourceUrl? }; all share the given date. Mirrors
// appendUpdate's frontmatter handling (set updatedDate, strip inline `[]`).
export function appendUpdates(filePath, items, date) {
  if (!items || !items.length) return;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error(`No frontmatter block in ${filePath}`);

  const rendered = items.map(({ note, sourceUrl }) => {
    const cleanNote = String(note).replace(/\s+/g, ' ').replace(/"/g, "'").trim().slice(0, 200);
    return `  - { date: ${date}, note: "${cleanNote}"` + (sourceUrl ? `, sourceUrl: "${sourceUrl}" }` : ` }`);
  }).join('\n');

  let block = fm[1];
  block = /^updatedDate:/m.test(block)
    ? block.replace(/^updatedDate:.*$/m, `updatedDate: ${date}`)
    : block + `\nupdatedDate: ${date}`;
  block = /^updates:/m.test(block)
    ? block.replace(/^updates:.*$/m, (m) => `${m.replace(/\s*\[\s*\]\s*$/, '')}\n${rendered}`)
    : block + `\nupdates:\n${rendered}`;

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

const pubTime = (s) => { const t = s.publishDate ? new Date(s.publishDate).getTime() : NaN; return Number.isNaN(t) ? -Infinity : t; };
const normTitle = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Surgically set `draft: true` in a file's frontmatter, leaving the body and
 *  every other key byte-identical (same approach as appendUpdate). */
export function demoteToDraft(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error(`No frontmatter block in ${filePath}`);
  const block = /^draft:/m.test(fm[1])
    ? fm[1].replace(/^draft:.*$/m, 'draft: true')
    : `${fm[1]}\ndraft: true`;
  fs.writeFileSync(filePath, raw.replace(fm[0], `---\n${block}\n---`));
}

/** Build a non-destructive review file of proposed collapses. Writes nothing
 *  to the corpus. Canonical = LATEST-published article in the component (the
 *  current state of a moving story); the rest are proposed for demotion. A member
 *  whose title AND publishDate both equal the canonical's is a true re-emission,
 *  flagged for hard delete; everything else is demoted to draft, never deleted.
 *
 *  KNOWN LIMITATION (do not auto-apply blind on a forked-hub corpus): canonical
 *  is chosen by publishDate, which is WRONG when an EARLIER article has become
 *  the folding hub (larger timeline / later updatedDate). It also cannot MERGE
 *  two rival hubs' timelines — it only demotes. A correct same-event collapse
 *  wants canonical = folding hub and a timeline union, not a bare demote. */
function review(daysBack, edgeTxt) {
  const corpus = loadCorpusWindow(daysBack);
  // NOTE: the collapse edge is intentionally LEXICAL-ONLY. A claim-identity edge
  // here over-merges: connected components is transitive, and a multi-event
  // "roundup" article shares one claim with story A and another with story B,
  // chaining unrelated stories into one component through the hub. Claim identity
  // belongs in the LIVE gate (findDuplicate — pairwise, folds into one best match,
  // no transitivity), not in whole-corpus clustering. A safe offline same-event
  // collapse needs non-transitive pairwise anchoring + a lexical/entity co-floor
  // + a moving-story guard + canonical = folding hub (see docs) — a separate mode.
  const opts = edgeTxt ? { edgeTxt } : {};
  const comps = connectedComponents(corpus, (s) => isStrongDuplicate(s, opts));

  const clusters = comps.map((idxs) => {
    const sorted = [...idxs].sort((a, b) => pubTime(corpus[a]) - pubTime(corpus[b]));
    const canonical = corpus[sorted[sorted.length - 1]];   // keep the LATEST
    // Skip members already demoted in a prior run — they're collapsed already, so
    // re-proposing them is noise (the review is idempotent on a stable corpus).
    const members = sorted.slice(0, -1).filter((i) => !corpus[i].draft).map((i) => {
      const s = score(canonical, corpus[i]);
      const reEmission = corpus[i].publishDate === canonical.publishDate
        && normTitle(corpus[i].title) === normTitle(canonical.title);
      return {
        slug: corpus[i].slug,
        file: corpus[i].file,
        title: corpus[i].title,
        publishDate: corpus[i].publishDate,
        action: reEmission ? 'delete' : 'demote',
        score: { txt: +s.txt.toFixed(3), ent: +s.ent.toFixed(3), combined: +s.combined.toFixed(3) },
      };
    });
    return {
      canonical: { slug: canonical.slug, file: canonical.file, title: canonical.title, publishDate: canonical.publishDate },
      members,
    };
  }).filter((c) => c.members.length)              // drop clusters fully collapsed already
    .sort((a, b) => b.members.length - a.members.length);

  const total = clusters.reduce((n, c) => n + c.members.length, 0);
  const deletes = clusters.reduce((n, c) => n + c.members.filter((m) => m.action === 'delete').length, 0);
  const outPath = path.join(__dirname, '..', 'dedupe-review.json');
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    windowDays: daysBack,
    edge: edgeTxt ? { edgeTxt } : { edgeTxt: STRONG_TXT, edgeCombined: STRONG_COMBINED, entity: STRONG_ENTITY },
    corpusSize: corpus.length,
    note: 'Review/edit before apply. Delete a cluster or a member object to reject it; ' +
      'flip a member "action" between "demote" (set draft:true) and "delete" (remove file). ' +
      'Canonical (latest) is always kept and published. apply requires --yes.',
    clusters,
  }, null, 2));

  console.log(`Reviewed ${corpus.length} articles (window ${daysBack}d).`);
  console.log(`${clusters.length} collapse clusters; ${total} members ` +
    `(${total - deletes} demote → draft, ${deletes} delete = true re-emissions).\n`);
  for (const c of clusters.slice(0, 25)) {
    console.log(`# keep (latest): ${c.canonical.slug}  [${c.canonical.publishDate}]  (${c.members.length} member(s))`);
    console.log(`    ${c.canonical.title}`);
    for (const m of c.members.slice(0, 8)) {
      console.log(`    └ ${m.action.toUpperCase()} [c=${m.score.combined} t=${m.score.txt} e=${m.score.ent}] ${m.title}`);
    }
    if (c.members.length > 8) console.log(`    └ … +${c.members.length - 8} more`);
  }
  if (clusters.length > 25) console.log(`… +${clusters.length - 25} more clusters`);
  console.log(`\nReview file written: ${outPath}`);
  console.log(`Approve, then: node scripts/dedupe.js apply dedupe-review.json --yes`);
}

/** Destructive: collapse each reviewed cluster. The canonical (latest) is kept
 *  and published untouched. Each member is demoted to draft:true (kept in-repo,
 *  hidden from the site) UNLESS flagged action:"delete" — a true re-emission
 *  (same title AND publishDate as the canonical) — which is hard-deleted.
 *  Requires --yes. False merge is worse than false miss: nothing is ever merged
 *  blind, and a demote is reversible (flip draft back) where a delete is not. */
function applyReview(reviewPath, { yes }) {
  if (!reviewPath) { console.error('usage: node scripts/dedupe.js apply <review.json> --yes'); process.exit(1); }
  const full = path.isAbsolute(reviewPath) ? reviewPath : path.join(process.cwd(), reviewPath);
  const { clusters } = JSON.parse(fs.readFileSync(full, 'utf-8'));
  const members = clusters.flatMap((c) => c.members);
  const toDelete = members.filter((m) => m.action === 'delete').length;
  const toDemote = members.length - toDelete;

  if (!yes) {
    console.log(`Would keep ${clusters.length} canonicals (latest), demote ${toDemote} to draft:true, ` +
      `and hard-delete ${toDelete} true re-emission(s).`);
    console.log('Destructive. Re-run with --yes to execute.');
    return;
  }

  let demoted = 0, deleted = 0, missing = 0;
  for (const c of clusters) {
    if (!fs.existsSync(c.canonical.file)) { console.warn(`⚠️  canonical missing, skipping cluster: ${c.canonical.slug}`); continue; }
    for (const m of c.members) {
      if (!fs.existsSync(m.file)) { missing++; console.warn(`⚠️  member already gone: ${m.slug}`); continue; }
      if (m.action === 'delete') {
        fs.unlinkSync(m.file);
        deleted++;
        console.log(`✗ deleted re-emission ${m.slug} (dup of ${c.canonical.slug})`);
      } else {
        demoteToDraft(m.file);
        demoted++;
        console.log(`↓ demoted ${m.slug} → draft:true (superseded by ${c.canonical.slug})`);
      }
    }
  }
  console.log(`\n✨ Collapsed: ${demoted} demoted to draft, ${deleted} deleted, ${missing} already gone.`);
  console.log('   git add -A to stage the changes.');
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
