#!/usr/bin/env node
/**
 * claims.js — the claim substrate for the intelligence pipeline.
 *
 * The atom is the CLAIM (a single grounded assertion with its source URL), not
 * the article. Articles are a projection over claims. Claims live in an
 * append-only JSONL file so daily growth is a clean diff — existing lines are
 * never rewritten (correct shape for arithmetic accumulation; see the brief
 * §4 "Substrate = in-repo, files-as-truth").
 *
 * This module is pure file/string logic — no network, no API. The fetch +
 * extraction that PRODUCES claims lives in generate-content.js; persistence,
 * validation, and loading live here so step 3 (claim-folding) and step 6 (the
 * SQLite build artifact) share one definition.
 *
 *   claim shape (see brief §4):
 *     id            // sha1(statement|source_url)[:12] — stable, dedupe-friendly
 *     statement     // one self-contained assertion
 *     claim_type    // announcement | data-point | prediction | regulatory-fact | analysis
 *     entities[]    // canonical org/person/product/standard names
 *     source_url    // required — a real fetched/returned URL
 *     source_name
 *     observed_date // when WE captured it (ISO date)
 *     event_date    // when the thing happened, if stated (ISO date | null)
 *     confidence    // single-source | corroborated | official
 *     grounding     // fetched | snippet  (snippet = fetch failed, lower trust)
 *     story_id      // slug of the article/story this claim belongs to
 *     supersedes    // claim id this one replaces (moving facts), or null
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CLAIMS_PATH = path.join(__dirname, '..', 'data', 'claims.jsonl');

export const CLAIM_TYPES = new Set(['announcement', 'data-point', 'prediction', 'regulatory-fact', 'analysis']);
export const CONFIDENCE  = new Set(['single-source', 'corroborated', 'official']);
export const GROUNDING    = new Set(['fetched', 'snippet']);

/** Loose URL match: ignore scheme, leading www., trailing slash; keep query. */
export function normalizeUrl(u) {
  try {
    const url = new URL(String(u));
    const host = url.host.replace(/^www\./, '');
    const pathName = url.pathname.replace(/\/+$/, '');
    return `${host}${pathName}${url.search}`.toLowerCase();
  } catch {
    return String(u).trim().toLowerCase();
  }
}

/** Resolve a model-emitted source_url to a real URL from `validUrls`.
 *  Returns the canonical (returned) form, or null if it can't be verified. */
export function resolveSourceUrl(sourceUrl, validUrls) {
  if (!sourceUrl) return null;
  const target = normalizeUrl(sourceUrl);
  for (const u of validUrls) if (normalizeUrl(u) === target) return u;
  return null;
}

const isoDate = (d) => {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t.toISOString().split('T')[0];
};

export function claimId(statement, sourceUrl) {
  return crypto.createHash('sha1')
    .update(`${String(statement).trim()}|${String(sourceUrl).trim()}`)
    .digest('hex').slice(0, 12);
}

/**
 * Sanitise a raw model-emitted claim into the committed shape, or return null
 * if it can't be grounded. `validUrls` is the set of URLs the run actually
 * fetched/returned; a claim whose source can't be resolved to one is dropped
 * unless exactly one URL was fetched (then we attribute to it).
 */
export function normalizeClaim(raw, { grounding, validUrls, observedDate, fallbackUrl = null }) {
  if (!raw || typeof raw.statement !== 'string' || !raw.statement.trim()) return null;

  let sourceUrl = resolveSourceUrl(raw.source_url, validUrls);
  if (!sourceUrl) sourceUrl = fallbackUrl;        // single fetched URL → attribute to it
  if (!sourceUrl) return null;                    // unverifiable source → drop

  const claim_type = CLAIM_TYPES.has(raw.claim_type) ? raw.claim_type : 'announcement';
  let confidence   = CONFIDENCE.has(raw.confidence) ? raw.confidence : 'single-source';
  // Snippet-grounded claims never outrank single-source — we never saw the body.
  if (grounding === 'snippet' && confidence !== 'single-source') confidence = 'single-source';

  const entities = Array.isArray(raw.entities)
    ? [...new Set(raw.entities.map((e) => String(e).trim()).filter(Boolean))]
    : [];

  const statement = raw.statement.trim();
  return {
    id: claimId(statement, sourceUrl),
    statement,
    claim_type,
    entities,
    source_url: sourceUrl,
    source_name: raw.source_name ? String(raw.source_name).trim() : null,
    observed_date: observedDate,
    event_date: isoDate(raw.event_date),
    confidence,
    grounding: GROUNDING.has(grounding) ? grounding : 'snippet',
    story_id: raw.story_id || null,
    supersedes: raw.supersedes || null,
  };
}

/** Append claims to the JSONL store (one object per line). Creates the file. */
export function appendClaims(claims, claimsPath = CLAIMS_PATH) {
  if (!claims || !claims.length) return 0;
  fs.mkdirSync(path.dirname(claimsPath), { recursive: true });
  const lines = claims.map((c) => JSON.stringify(c)).join('\n') + '\n';
  fs.appendFileSync(claimsPath, lines);
  return claims.length;
}

/** Load all claims from the JSONL store (skips blank/corrupt lines). */
export function loadClaims(claimsPath = CLAIMS_PATH) {
  if (!fs.existsSync(claimsPath)) return [];
  const out = [];
  for (const line of fs.readFileSync(claimsPath, 'utf-8').split('\n')) {
    const s = line.trim();
    if (!s) continue;
    try { out.push(JSON.parse(s)); } catch { /* skip corrupt line */ }
  }
  return out;
}

/** Claims already in the store, keyed by id — for novelty checks (step 3). */
export function loadClaimIndex(claimsPath = CLAIMS_PATH) {
  const byId = new Map();
  for (const c of loadClaims(claimsPath)) byId.set(c.id, c);
  return byId;
}

// ── Step 3: claim folding (novelty + corroboration) ──────────────────────────
// On a dedupe hit, an incoming claim is either NOVEL (a new fact for the story →
// fold into its timeline) or CORROBORATING (the story already states it, from a
// different source → raise confidence, don't clutter the timeline). Matching is
// on the statement text, not the id — corroboration comes from a different
// source_url, so the ids differ even when the assertion is the same.
const normStatement = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

const stmtTokens = (s) => new Set(normStatement(s).split(' ').filter((w) => w.length > 2));

function stmtJaccard(a, b) {
  const A = stmtTokens(a), B = stmtTokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

// Bias high: a false "same claim" merge buries a genuinely new fact (the costly
// error), so only near-identical statements corroborate. Tune in calibration.
export const STATEMENT_MATCH = 0.7;

export function statementsMatch(a, b) {
  return normStatement(a) === normStatement(b) || stmtJaccard(a, b) >= STATEMENT_MATCH;
}

/** Confidence only ever rises by corroboration up to "corroborated"; "official"
 *  is reserved for the announcing body and is not reachable by corroboration. */
export function raiseConfidence(level) {
  return level === 'single-source' ? 'corroborated' : level;
}

/** Split incoming claims against a story's existing claims into novel vs
 *  corroborating (each corroborating entry carries the matched existing claim). */
export function foldIncomingClaims(incoming, existing) {
  const novel = [];
  const corroborating = [];
  for (const c of incoming) {
    const matched = existing.find((e) => statementsMatch(e.statement, c.statement));
    if (matched) corroborating.push({ incoming: c, matched });
    else novel.push(c);
  }
  return { novel, corroborating };
}
