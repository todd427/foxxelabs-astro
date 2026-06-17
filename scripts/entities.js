#!/usr/bin/env node
/**
 * entities.js — the canonical entity-alias dictionary (brief §4/§5 step 4).
 *
 * The dedupe entity arm and the claim entity sets only separate stories well if
 * "Model Context Protocol (MCP)", "MCP", and "Model Context Protocol" count as
 * ONE entity. This module builds a controlled vocabulary from the scattered
 * entity sets already in the corpus and exposes a canonicaliser the dedupe gate
 * uses to collapse aliases before scoring.
 *
 * The dictionary is committed JSON (data/entity-aliases.json), human-editable —
 * the build is a deterministic starting point, not the last word. Clustering is
 * deliberately CONSERVATIVE (false merge worse than false miss, per the brief):
 * only two links are ever made —
 *   1. exact normalised-key match  ("OpenAI" == "open ai" == "OpenAI.")
 *   2. explicit parenthetical gloss ("Long Name (ABBR)" links Long Name + ABBR)
 * No fuzzy/semantic merging; that stays a human edit.
 *
 *   data/entity-aliases.json:  { "Canonical Name": ["alias", "alias", ...], ... }
 *
 * CLI:
 *   node scripts/entities.js build            # preview clusters (no write)
 *   node scripts/entities.js build --write    # write data/entity-aliases.json
 *   node scripts/entities.js show [entity]    # show the canonical form of an entity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, '..', 'src', 'content', 'news');
export const DICT_PATH = path.join(__dirname, '..', 'data', 'entity-aliases.json');

/** Normalisation key — the unit aliases collapse to. Same shape as dedupe's
 *  normText so the two agree on what "the same entity" means. */
export function entityKey(e) {
  return String(e).toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// "Long Name (ABBR)" → { expansion, abbrev } only when the gloss is a genuine
// ACRONYM, never a descriptor or a country. The loose version merged "Ireland"
// (a Title-case word) into "Department of Finance" and "eCrime breakout" (a
// multi-word phrase) into "29 minutes" — false merges are the costly error here,
// so the abbreviation must be a single token that looks like an acronym:
//   single token, 2-10 chars, ≥2 capitals OR (≥1 capital AND a digit).
// This admits MCP / DORA / GPAI / A3 / GPT-5 and rejects Ireland / 2026 / phrases.
function isAcronym(s) {
  if (/\s/.test(s) || !/^[A-Za-z0-9][A-Za-z0-9.\-]{1,9}$/.test(s)) return false;
  if (/^\d+$/.test(s) || /(19|20)\d{2}/.test(s)) return false;
  const caps = (s.match(/[A-Z]/g) || []).length;
  const digits = (s.match(/\d/g) || []).length;
  return caps >= 2 || (caps >= 1 && digits >= 1);
}

function parseGloss(form) {
  const m = String(form).match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return null;
  const expansion = m[1].trim();
  const abbrev = m[2].trim();
  const plausibleExpansion = expansion.length > 1 && /[A-Za-z]/.test(expansion) && /\s/.test(expansion);
  return (isAcronym(abbrev) && plausibleExpansion) ? { expansion, abbrev } : null;
}

// ── alias lookup (used by dedupe) ────────────────────────────────────────────
let _lookup = null;
/** Map(entityKey(surfaceForm) -> canonical entityKey). Lazy, memoised. */
export function loadAliasLookup(dictPath = DICT_PATH) {
  if (_lookup) return _lookup;
  _lookup = new Map();
  if (fs.existsSync(dictPath)) {
    let dict = {};
    try { dict = JSON.parse(fs.readFileSync(dictPath, 'utf-8')); } catch { dict = {}; }
    for (const [canonical, aliases] of Object.entries(dict)) {
      const canonKey = entityKey(canonical);
      _lookup.set(canonKey, canonKey);
      for (const a of (Array.isArray(aliases) ? aliases : [])) _lookup.set(entityKey(a), canonKey);
    }
  }
  return _lookup;
}

/** Canonical key for an entity: its alias target if known, else its own key. */
export function aliasCanonical(e, dictPath = DICT_PATH) {
  const k = entityKey(e);
  return loadAliasLookup(dictPath).get(k) ?? k;
}

// ── builder ──────────────────────────────────────────────────────────────────
function collectSurfaceForms(newsDir = NEWS_DIR) {
  const counts = new Map();
  if (!fs.existsSync(newsDir)) return counts;
  for (const f of fs.readdirSync(newsDir)) {
    if (!f.endsWith('.md')) continue;
    try {
      const { data } = matter(fs.readFileSync(path.join(newsDir, f), 'utf-8'));
      for (const e of (Array.isArray(data.entities) ? data.entities : [])) {
        const s = String(e).trim();
        if (s) counts.set(s, (counts.get(s) || 0) + 1);
      }
    } catch { /* unreadable — skip */ }
  }
  return counts;
}

export function buildDictionary(newsDir = NEWS_DIR) {
  const counts = collectSurfaceForms(newsDir);

  // Union-find over normalised keys. Same key ⇒ same node automatically; gloss
  // links merge an expansion + abbreviation into the full form's node.
  const parent = new Map();
  const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  const add = (x) => { if (!parent.has(x)) parent.set(x, x); };
  const union = (a, b) => { add(a); add(b); const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };

  // display(count) per surface form; synthetic gloss parts seed at count 0.
  const display = new Map(); // entityKey -> { text, count, paren, abbrev }
  const seed = (text, count, flags = {}) => {
    const k = entityKey(text);
    add(k);
    const cur = display.get(k);
    if (!cur || count > cur.count) display.set(k, { text, count, paren: !!flags.paren, abbrev: !!flags.abbrev });
    else if (cur) { cur.paren = cur.paren || !!flags.paren; cur.abbrev = cur.abbrev || !!flags.abbrev; }
  };

  for (const [form, count] of counts) {
    seed(form, count, { paren: /\(.+\)/.test(form) });
    const gloss = parseGloss(form);
    if (gloss) {
      seed(gloss.expansion, 0);
      seed(gloss.abbrev, 0, { abbrev: true });
      union(entityKey(form), entityKey(gloss.expansion));
      union(entityKey(form), entityKey(gloss.abbrev));
    }
  }

  // Group keys by root; build a dict entry only where ≥1 alias collapses.
  const groups = new Map();
  for (const k of parent.keys()) {
    const r = find(k);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(k);
  }

  const dict = {};
  for (const keys of groups.values()) {
    const forms = keys.map((k) => display.get(k)).filter(Boolean);
    if (forms.length < 2) continue; // nothing to collapse

    // Canonical: prefer a plain (non-parenthetical, non-abbrev) display; among
    // those the most frequent, then the longest. Fall back to most frequent.
    const plain = forms.filter((f) => !f.paren && !f.abbrev);
    const pool = plain.length ? plain : forms;
    pool.sort((a, b) => b.count - a.count || b.text.length - a.text.length);
    const canonical = pool[0].text;

    const aliases = [...new Set(forms.map((f) => f.text))].filter((t) => t !== canonical).sort();
    if (aliases.length) dict[canonical] = aliases;
  }

  // Stable key order for clean diffs.
  return Object.fromEntries(Object.entries(dict).sort((a, b) => a[0].localeCompare(b[0])));
}

export function writeDictionary(dict, dictPath = DICT_PATH) {
  fs.mkdirSync(path.dirname(dictPath), { recursive: true });
  fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2) + '\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (cmd === 'build') {
    const dict = buildDictionary();
    const entries = Object.entries(dict);
    const collapsed = entries.reduce((n, [, a]) => n + a.length, 0);
    console.log(`Built ${entries.length} canonical groups collapsing ${collapsed} aliases.`);
    console.log('Sample (largest groups):');
    entries.sort((a, b) => b[1].length - a[1].length).slice(0, 20)
      .forEach(([c, a]) => console.log(`  ${c}  ⇐  ${a.join(' | ')}`));
    if (argv.includes('--write')) { writeDictionary(dict); console.log(`\nWrote ${path.relative(process.cwd(), DICT_PATH)}.`); }
    else console.log('\n(dry-run — re-run with --write to commit the dictionary)');
  } else if (cmd === 'show') {
    const e = argv.slice(1).join(' ');
    console.log(`${e}  →  canonical key: "${aliasCanonical(e)}"`);
  } else {
    console.error('usage:\n  node scripts/entities.js build [--write]\n  node scripts/entities.js show <entity>');
    process.exit(1);
  }
}
