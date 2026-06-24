#!/usr/bin/env node
/**
 * reverify-corpus.js — adjudicate flagged stories against the LIVE web.
 *
 * audit-corpus.js flags stories by source authority; that is a proxy, not proof.
 * This tool settles it: for every story lacking an authoritative anchor it runs
 * the same verifyClaims pass used on new articles, which web-searches each claim
 * for independent corroboration. The verdict — not a domain list, and not the
 * operator's stale memory — decides.
 *
 * ACTION (per the agreed policy): a story is unpublished (draft:true, reversible)
 * ONLY when the live web actively CONTRADICTS one of its claims. Merely
 * uncorroborated stays published and is reported for human review. Contradicted
 * claims are quarantined out of claims.jsonl so they cannot corroborate or fold
 * into future stories.
 *
 *   node scripts/reverify-corpus.js            # dry run: verify + report, no writes
 *   node scripts/reverify-corpus.js --apply    # also flip draft:true + quarantine
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeCorpus, NEWS_DIR } from './audit-corpus.js';
import { loadClaims, CLAIMS_PATH } from './claims.js';
import { verifyClaims } from './generate-content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUARANTINE_PATH = path.join(__dirname, '..', 'data', 'claims-quarantine.jsonl');
const REPORT_PATH = path.join(__dirname, '..', 'data', 'reverify-report.json');

const APPLY = process.argv.includes('--apply');

// Even with no substantive contradiction, a story whose claims are contradicted
// at or above this share is too riddled to stand — unpublish it.
const SHARE_THRESHOLD = 0.34;

// Optional explicit story slugs after the flags; otherwise use the audit's
// flagged tiers (everything without an authoritative anchor).
const slugArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));

function unpublish(file) {
  const md = fs.readFileSync(file, 'utf-8');
  if (/^draft:\s*true/m.test(md)) return false;          // already unpublished
  const next = md.replace(/^draft:\s*false/m, 'draft: true');
  if (next === md) return false;                         // no draft line to flip
  fs.writeFileSync(file, next);
  return true;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set — verification needs the live web.');
    process.exit(1);
  }

  // Group all claims by story once.
  const byStory = new Map();
  for (const c of loadClaims()) {
    if (!c.story_id) continue;
    if (!byStory.has(c.story_id)) byStory.set(c.story_id, []);
    byStory.get(c.story_id).push(c);
  }

  // Targets: explicit slugs, else every flagged (non-OK) story.
  const flagged = analyzeCorpus().filter((r) => r.tier !== 'OK');
  const targets = slugArgs.length
    ? slugArgs.map((s) => ({ story: s, live: fs.existsSync(path.join(NEWS_DIR, `${s}.md`)) }))
    : flagged;

  console.log(`🔬 Re-verifying ${targets.length} flagged stor${targets.length === 1 ? 'y' : 'ies'} against the live web` +
    `${APPLY ? ' [APPLY]' : ' [dry run]'}\n`);

  const report = [];
  const quarantineIds = new Set();

  for (const t of targets) {
    const claims = byStory.get(t.story) || [];
    if (!claims.length) { console.log(`• ${t.story} — no claims on record, skipping`); continue; }

    console.log(`\n• ${t.story}  (${claims.length} claims)`);
    const { results } = await verifyClaims(claims, t.story);

    const contradicted = results.filter((r) => r.verdict === 'contradicted');
    const uncorroborated = results.filter((r) => r.verdict === 'uncorroborated');
    const supported = results.filter((r) => r.verdict === 'primary' || r.verdict === 'corroborated');

    // Severity-aware unpublish: only pull a whole story when a contradiction is
    // SUBSTANTIVE (false core fact / non-existent entity / materially wrong
    // headline figure) or when contradictions swamp the story. A lone date/name
    // slip ("minor") is a fix-the-claim case — the story stays published and is
    // flagged for a body correction instead of being killed.
    const substantive = contradicted.filter((r) => r.severity === 'substantive');
    const share = claims.length ? contradicted.length / claims.length : 0;
    const shouldUnpublish = substantive.length > 0 || share >= SHARE_THRESHOLD;

    // Every contradicted claim is wrong regardless of severity — quarantine it
    // out of the substrate so it can't corroborate or fold into future stories.
    for (const r of contradicted) {
      quarantineIds.add(r.claim.id);
      console.log(`    ✗ CONTRADICTED [${r.severity}]: "${r.claim.statement.slice(0, 90)}"${r.note ? `\n        ↳ ${r.note}` : ''}`);
    }

    const file = path.join(NEWS_DIR, `${t.story}.md`);
    const exists = fs.existsSync(file);
    let action = 'kept';
    if (shouldUnpublish) {
      action = APPLY && exists ? 'UNPUBLISHED' : 'would-unpublish';
      if (APPLY && exists) {
        const flipped = unpublish(file);
        console.log(`    → ${flipped ? 'set draft:true' : 'already draft/no flag'}`);
      }
    } else if (contradicted.length) {
      action = 'needs-fix';   // minor contradiction(s) only — stays live, fix the body
    }
    console.log(`    verdicts: ${supported.length} supported, ${uncorroborated.length} uncorroborated, ` +
      `${contradicted.length} contradicted (${substantive.length} substantive) → ${action}`);

    report.push({
      story: t.story,
      action,
      counts: { supported: supported.length, uncorroborated: uncorroborated.length, contradicted: contradicted.length, substantive: substantive.length },
      contradicted: contradicted.map((r) => ({ id: r.claim.id, severity: r.severity, statement: r.claim.statement, note: r.note, source_url: r.claim.source_url })),
      uncorroborated: uncorroborated.map((r) => ({ id: r.claim.id, statement: r.claim.statement, source_url: r.claim.source_url })),
    });
  }

  // Quarantine contradicted claims: rewrite claims.jsonl without them, append the
  // removed lines (with reason) to a quarantine file so nothing is silently lost.
  if (APPLY && quarantineIds.size) {
    const all = loadClaims();
    const removed = all.filter((c) => quarantineIds.has(c.id));
    const kept = all.filter((c) => !quarantineIds.has(c.id));
    fs.writeFileSync(CLAIMS_PATH, kept.map((c) => JSON.stringify(c)).join('\n') + '\n');
    fs.appendFileSync(QUARANTINE_PATH,
      removed.map((c) => JSON.stringify({ ...c, quarantined_reason: 'contradicted by live-web reverify' })).join('\n') + '\n');
    console.log(`\n🗑️  Quarantined ${removed.length} contradicted claim(s) → ${path.relative(process.cwd(), QUARANTINE_PATH)}`);
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  const unpublished = report.filter((r) => r.action === 'UNPUBLISHED' || r.action === 'would-unpublish');
  const needsFix = report.filter((r) => r.action === 'needs-fix');
  console.log(`\n✨ Done. ${unpublished.length}/${report.length} stor${unpublished.length === 1 ? 'y' : 'ies'} ${APPLY ? 'unpublished' : 'would be unpublished'} (substantive contradiction or >${Math.round(SHARE_THRESHOLD * 100)}% contradicted).`);
  if (needsFix.length) console.log(`   ${needsFix.length} stor${needsFix.length === 1 ? 'y' : 'ies'} kept live with MINOR contradictions to fix in the body (see report).`);
  console.log(`📄 Full report: ${path.relative(process.cwd(), REPORT_PATH)}`);
  if (!APPLY && unpublished.length) console.log('   Re-run with --apply to unpublish + quarantine.');
}

main().catch((e) => { console.error('❌ Fatal:', e); process.exit(1); });
