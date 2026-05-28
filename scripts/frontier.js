#!/usr/bin/env node
/**
 * frontier.js — item 3 of docs/dedupe-gate.md: a SOTA / state-of-the-frontier
 * tracker built on the same repo-as-store principle as the dedupe gate.
 *
 *   data/frontier.json (committed) holds the current state per axis. A weekly
 *   `reconcile` reads the window's ALREADY-DEDUPED stories (the dedupe gate has
 *   folded near-duplicates upstream), asks per axis whether the frontier moved,
 *   and rewrites ONLY the axes that changed. Git history is the longitudinal
 *   record — each reconcile commit is a dated delta of what advanced.
 *
 * Axes are seeded from scripts/config.json `topics`.
 *
 * Usage:
 *   node scripts/frontier.js init [--force]      # scaffold data/frontier.json
 *   node scripts/frontier.js reconcile [daysBack]        # default 7
 *   node scripts/frontier.js reconcile [daysBack] --dry-run   # no API, preview
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCorpusWindow } from './dedupe.js';
import { MODEL, makeClient, callWithRetry, extractJson } from './anthropic-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
const FRONTIER_PATH = path.join(__dirname, '..', 'data', 'frontier.json');
const DEFAULT_DAYS = 7;

const today = () => new Date().toISOString().split('T')[0];

/** Stable axis order: config topics first, then any extra axes already on file. */
function orderedAxisNames(axes) {
  const seen = new Set();
  const order = [];
  for (const t of CONFIG.topics) if (axes[t] && !seen.has(t)) { order.push(t); seen.add(t); }
  for (const k of Object.keys(axes)) if (!seen.has(k)) { order.push(k); seen.add(k); }
  return order;
}

function loadFrontier() {
  if (!fs.existsSync(FRONTIER_PATH)) {
    console.error(`❌ ${path.relative(process.cwd(), FRONTIER_PATH)} not found. Run: node scripts/frontier.js init`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(FRONTIER_PATH, 'utf-8'));
}

/** Write with axes in stable order so a reconcile diff shows only what changed. */
function writeFrontier(frontier) {
  const ordered = {};
  for (const name of orderedAxisNames(frontier.axes)) ordered[name] = frontier.axes[name];
  const out = { updatedAt: new Date().toISOString(), axes: ordered };
  fs.mkdirSync(path.dirname(FRONTIER_PATH), { recursive: true });
  fs.writeFileSync(FRONTIER_PATH, JSON.stringify(out, null, 2) + '\n');
}

function init(force) {
  if (fs.existsSync(FRONTIER_PATH) && !force) {
    const f = JSON.parse(fs.readFileSync(FRONTIER_PATH, 'utf-8'));
    let added = 0;
    for (const t of CONFIG.topics) if (!f.axes[t]) { f.axes[t] = { state: '', lastUpdated: null, evidence: [] }; added++; }
    writeFrontier(f);
    console.log(`✅ frontier.json exists; added ${added} new axis/axes from config. Use --force to reseed.`);
    return;
  }
  const axes = {};
  for (const t of CONFIG.topics) axes[t] = { state: '', lastUpdated: null, evidence: [] };
  writeFrontier({ axes });
  console.log(`✅ Scaffolded ${path.relative(process.cwd(), FRONTIER_PATH)} with ${CONFIG.topics.length} axes.`);
}

/** Compact view of the window's deduped stories for the model. */
function compactStories(daysBack) {
  return loadCorpusWindow(daysBack).map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.description,
    entities: s.entities,
  }));
}

async function reconcileAxis(client, axisName, axis, stories) {
  const prompt = `You maintain a state-of-the-art tracker. AXIS: "${axisName}".

CURRENT STATE (may be empty if never set):
${axis.state || '(none yet)'}

This period's deduplicated stories (JSON):
${JSON.stringify(stories, null, 2)}

Decide whether the frontier for THIS axis has advanced based ONLY on stories
relevant to it. Ignore unrelated stories. If nothing relevant moved the
frontier, return changed=false and leave the state alone.

Return ONLY minified JSON:
{"changed":true|false,"state":"2-3 sentence current state of the art for this axis","evidence":["story-slug",...],"reason":"one line: what moved"}`;

  const response = await callWithRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 700,
    messages: [{ role: 'user', content: prompt }],
  }));
  const parsed = extractJson(response);
  if (!parsed || parsed.changed !== true) return null;

  const slugs = new Set(stories.map((s) => s.slug));
  const evidence = Array.isArray(parsed.evidence) ? parsed.evidence.filter((s) => slugs.has(s)) : [];
  return {
    state: String(parsed.state || '').trim(),
    evidence,
    reason: String(parsed.reason || '').trim(),
  };
}

async function reconcile(daysBack, dryRun) {
  const frontier = loadFrontier();
  const stories = compactStories(daysBack);
  const names = orderedAxisNames(frontier.axes);

  console.log(`🛰️  Frontier reconcile: ${stories.length} deduped stories in ${daysBack}d, ${names.length} axes.`);

  if (dryRun) {
    console.log('🔎 --dry-run: no API calls. Window stories:');
    stories.forEach((s) => console.log(`   • ${s.slug}`));
    console.log(`\nAxes (lastUpdated):`);
    names.forEach((n) => console.log(`   • ${n} — ${frontier.axes[n].lastUpdated || 'never'}`));
    return;
  }
  if (stories.length === 0) { console.log('Nothing in window; nothing to reconcile.'); return; }

  const client = makeClient();
  const changed = [];
  for (const name of names) {
    try {
      const update = await reconcileAxis(client, name, frontier.axes[name], stories);
      if (update && update.state) {
        frontier.axes[name] = { state: update.state, lastUpdated: today(), evidence: update.evidence };
        changed.push({ name, reason: update.reason });
        console.log(`   ↑ ${name}: ${update.reason || 'advanced'}`);
      } else {
        console.log(`   · ${name}: unchanged`);
      }
    } catch (error) {
      console.error(`   ❌ ${name}: ${error.message}`);
    }
  }

  if (changed.length === 0) {
    console.log('\nNo axis advanced this period; frontier.json left untouched.');
    return;
  }
  writeFrontier(frontier);
  console.log(`\n✨ ${changed.length} axis/axes advanced. Rewrote ${path.relative(process.cwd(), FRONTIER_PATH)}.`);
  console.log('   Commit it — the diff is this period\'s frontier delta (git = longitudinal record).');
}

const argv = process.argv.slice(2);
const cmd = argv[0];
if (cmd === 'init') {
  init(argv.includes('--force'));
} else if (cmd === 'reconcile') {
  const daysBack = parseInt(argv[1] && !argv[1].startsWith('--') ? argv[1] : DEFAULT_DAYS, 10);
  reconcile(daysBack, argv.includes('--dry-run')).catch((e) => { console.error('❌ Fatal:', e); process.exit(1); });
} else {
  console.error('usage:\n  node scripts/frontier.js init [--force]\n' +
    '  node scripts/frontier.js reconcile [daysBack] [--dry-run]');
  process.exit(1);
}
