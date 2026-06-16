#!/usr/bin/env node
/**
 * spotlight.js — "check this out (Todd)" LLM pick, built on the same
 * repo-as-store / reconcile principle as frontier.js.
 *
 *   data/spotlight.json (committed) holds the current pick. `reconcile` pulls
 *   the HF-direct candidate feed (scripts/hf-models.js), shows the model the
 *   current pick + candidates, and asks whether to swap — rewriting the file
 *   ONLY when the pick changes. Git history is the record of what you surfaced
 *   and when, exactly like frontier.json.
 *
 * Usage:
 *   node scripts/spotlight.js reconcile [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCandidates } from './hf-models.js';
import { MODEL, makeClient, callWithRetry, extractJson } from './anthropic-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPOTLIGHT_PATH = path.join(__dirname, '..', 'data', 'spotlight.json');

function loadSpotlight() {
  if (!fs.existsSync(SPOTLIGHT_PATH)) return { updatedAt: null, pick: null };
  return JSON.parse(fs.readFileSync(SPOTLIGHT_PATH, 'utf-8'));
}

function writeSpotlight(pick) {
  const out = { updatedAt: new Date().toISOString(), pick };
  fs.mkdirSync(path.dirname(SPOTLIGHT_PATH), { recursive: true });
  fs.writeFileSync(SPOTLIGHT_PATH, JSON.stringify(out, null, 2) + '\n');
}

const compact = (c) => ({
  id: c.id, likes: c.likes, downloads: c.downloads,
  ageDays: c.ageDays == null ? null : Math.round(c.ageDays),
  tags: c.tags.slice(0, 12),
});

async function decide(client, current, candidates) {
  const prompt = `You curate a single "check this out" LLM pick for a software studio's site.
The pick is opinionated and fresh - what a working engineer should look twice at this week.

CURRENT PICK (may be null on first run):
${current ? JSON.stringify({ id: current.id, blurb: current.blurb }, null, 2) : '(none yet)'}

HF-DIRECT CANDIDATES (trending + new text-generation models, deduped, JSON):
${JSON.stringify(candidates.map(compact), null, 2)}

Swap the pick ONLY if a candidate is clearly more interesting/fresher than the
current one; if the current pick still holds, keep it. When you pick, write TWO
sentences, dry and concrete - no hype words ("revolutionary", "game-changing"
banned), no benchmark claims you can't verify. Say what it is and why look twice.

Return ONLY minified JSON:
{"changed":true|false,"id":"author/name","blurb":"two sentences","reason":"one line: why"}`;

  const response = await callWithRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  }));
  return extractJson(response);
}

async function reconcile(dryRun) {
  const candidates = await getCandidates();
  if (!candidates.length) { console.log('No HF candidates returned; nothing to do.'); return; }

  const { pick: current } = loadSpotlight();
  console.log(`\ud83d\udd26 Spotlight reconcile: ${candidates.length} candidates. Current: ${current?.id ?? '(none)'}`);

  if (dryRun) {
    console.log('\ud83d\udd0e --dry-run: no API calls. Top candidates:');
    candidates.forEach((c, i) => console.log(`   ${i + 1}. ${c.id}  \u2665${c.likes}`));
    return;
  }

  const d = await decide(makeClient(), current, candidates);
  if (!d || d.changed !== true) { console.log('\u00b7 Current pick still holds; spotlight.json untouched.'); return; }

  const chosen = candidates.find((c) => c.id === d.id);
  if (!chosen) { console.log(`\u26a0\ufe0f  Model picked ${d.id}, not in candidate set; ignoring.`); return; }

  writeSpotlight({
    id: chosen.id, url: chosen.url, author: chosen.author, name: chosen.name,
    likes: chosen.likes, downloads: chosen.downloads,
    ageDays: chosen.ageDays == null ? null : Math.round(chosen.ageDays),
    blurb: String(d.blurb || '').trim(),
    surfacedAt: new Date().toISOString().split('T')[0],
  });
  console.log(`\u2728 Spotlight \u2192 ${chosen.id}: ${d.reason || 'swapped'}`);
  console.log('   Commit data/spotlight.json - the diff is what you surfaced.');
}

const cmd = process.argv[2];
if (cmd === 'reconcile') {
  reconcile(process.argv.includes('--dry-run')).catch((e) => { console.error('\u274c Fatal:', e); process.exit(1); });
} else {
  console.error('usage:\n  node scripts/spotlight.js reconcile [--dry-run]');
  process.exit(1);
}
