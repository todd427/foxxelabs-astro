#!/usr/bin/env node
/**
 * spotlight.js — "check this out (Todd)" LLM pick, built on the same
 * repo-as-store / reconcile principle as frontier.js.
 *
 *   data/spotlight.json (committed) holds the current hero pick plus a short
 *   "also moving" list (the rest of the top-6 candidate feed, raw — no blurb).
 *   `reconcile` pulls the HF-direct feed (scripts/hf-models.js), asks the model
 *   whether to swap the HERO, and always refreshes the also-list + live stats.
 *   The hero's surfacedAt only changes when the hero actually changes, so git
 *   history still records what was surfaced and when.
 *
 * Top 6 (Miller's Law): 1 hero + 5 also = six items, the page's full set.
 *
 * Usage:
 *   node scripts/spotlight.js reconcile [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCandidates, fetchModel } from './hf-models.js';
import { MODEL, makeClient, callWithRetry, extractJson } from './anthropic-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPOTLIGHT_PATH = path.join(__dirname, '..', 'data', 'spotlight.json');

const POOL = 6;        // total surfaced: 1 hero + (POOL-1) also
const today = () => new Date().toISOString().split('T')[0];

function loadSpotlight() {
  if (!fs.existsSync(SPOTLIGHT_PATH)) return { updatedAt: null, pick: null, also: [] };
  return JSON.parse(fs.readFileSync(SPOTLIGHT_PATH, 'utf-8'));
}

function writeSpotlight(pick, also) {
  const out = { updatedAt: new Date().toISOString(), pick, also };
  fs.mkdirSync(path.dirname(SPOTLIGHT_PATH), { recursive: true });
  fs.writeFileSync(SPOTLIGHT_PATH, JSON.stringify(out, null, 2) + '\n');
}

// Display record persisted for the page (no _score, no tags). createdAt is
// kept so ageDays can be re-derived when the live record isn't available.
const display = (c) => ({
  id: c.id, url: c.url, author: c.author, name: c.name,
  likes: c.likes, downloads: c.downloads,
  createdAt: c.createdAt ?? null,
  ageDays: c.ageDays == null ? null : Math.round(c.ageDays),
});

// ageDays is a snapshot, and a held hero can outlive its feed slot by weeks;
// whatever else we keep, the age must be today's.
const reage = (rec) => ({
  ...rec,
  ageDays: rec.createdAt
    ? Math.max(0, Math.round((Date.now() - new Date(rec.createdAt).getTime()) / 86_400_000))
    : rec.ageDays ?? null,
});

// Compact view for the model's hero decision.
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
A pick can hold for weeks and the blurb is NOT rewritten while it holds, so no
relative time ("landed yesterday", "1 day ago", "this week") - the page shows
the model's age and the pick date itself.

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
  const candidates = await getCandidates({ top: POOL });
  if (!candidates.length) { console.log('No HF candidates returned; nothing to do.'); return; }

  const { pick: current } = loadSpotlight();
  console.log(`\ud83d\udd26 Spotlight reconcile: ${candidates.length} candidates (top ${POOL}). Current: ${current?.id ?? '(none)'}`);

  if (dryRun) {
    console.log('\ud83d\udd0e --dry-run: no API calls. Candidates:');
    candidates.forEach((c, i) => console.log(`   ${i + 1}. ${c.id}  \u2665${c.likes}`));
    return;
  }

  const d = await decide(makeClient(), current, candidates);

  // Hero: swap on the model's call, else keep current (refreshing live stats).
  let hero = null;
  if (d && d.changed === true) {
    const chosen = candidates.find((c) => c.id === d.id);
    if (chosen) {
      hero = { ...display(chosen), blurb: String(d.blurb || '').trim(), surfacedAt: today() };
      console.log(`\u2728 Spotlight \u2192 ${chosen.id}: ${d.reason || 'swapped'}`);
    } else {
      console.log(`\u26a0\ufe0f  Model picked ${d.id}, not in candidate set; ignoring swap.`);
    }
  }
  if (!hero) {
    if (current) {
      // Off the feed is the normal case for a hero that has held a week or
      // two, so go and get it: stats froze for eight days once when this
      // branch just kept the stored record.
      const live = candidates.find((c) => c.id === current.id) ?? await fetchModel(current.id);
      hero = live
        ? { ...display(live), blurb: current.blurb, surfacedAt: current.surfacedAt }
        : reage(current);  // HF unreachable or model gone; stored stats, today's age
      console.log(`\u00b7 Hero holds: ${current.id}${live ? '' : ' (stored stats)'}`);
    } else {
      console.log('No hero and no current pick; leaving null.');
    }
  }

  const also = candidates.filter((c) => !hero || c.id !== hero.id).slice(0, POOL - 1).map(display);
  writeSpotlight(hero, also);
  console.log(`Wrote spotlight: hero=${hero?.id ?? 'none'}, also=${also.length}.`);
  console.log('   Commit data/spotlight.json if the workflow detects a change.');
}

const cmd = process.argv[2];
if (cmd === 'reconcile') {
  reconcile(process.argv.includes('--dry-run')).catch((e) => { console.error('\u274c Fatal:', e); process.exit(1); });
} else {
  console.error('usage:\n  node scripts/spotlight.js reconcile [--dry-run]');
  process.exit(1);
}
