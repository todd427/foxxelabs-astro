#!/usr/bin/env node
/**
 * backfill-entities.js — item 1 of docs/dedupe-gate.md.
 *
 * The historical corpus has NO `entities` in frontmatter (they only ever went
 * to Supabase), so the dedupe gate scores new-vs-historical pairs on the
 * higher-bar text-only regime. This backfill extracts entities / significance /
 * irishEuAngle for each archived article and writes them into frontmatter,
 * engaging the entity-aware regime and tightening precision (two different
 * "Ireland AI Office" stories can split on distinct entities even when prose
 * overlaps).
 *
 * Contract:
 *   - Idempotent: files that already carry `entities:` are skipped (no API
 *     call), so the job is re-runnable after interruption.
 *   - Surgical frontmatter edit: keys are inserted into the raw block, the rest
 *     of the file is byte-for-byte untouched (avoids reformatting the whole
 *     corpus into noisy diffs). Same approach as appendUpdate in dedupe.js.
 *   - Failure-safe: a file whose extraction errors or returns unparseable JSON
 *     is left unwritten and retried on the next run.
 *
 * Usage:
 *   node scripts/backfill-entities.js            # process every file lacking entities
 *   node scripts/backfill-entities.js --limit 3  # smoke-test on the first 3
 *   node scripts/backfill-entities.js --dry-run   # scan + report counts, no API, no writes
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { NEWS_DIR } from './dedupe.js';
import { MODEL, makeClient, callWithRetry, extractJson } from './anthropic-client.js';

const SIGNIFICANCE = new Set(['high', 'medium', 'low']);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

/** Ask Haiku for the intelligence fields. Returns null on unparseable output. */
async function extractIntel(client, { title, description, content }) {
  const prompt = `You are tagging an archived AI-news article for a story-identity deduplication index.
Extract the fields that identify THIS specific story (not generic topic words):

- entities: the specific organisations, people, products, models, standards, laws,
  and the defining numbers or dates named in the article. 4-12 items.
  e.g. ["OpenAI", "GPT-5", "EU AI Act", "CVE-2026-25592", "€7M"].
- significance: "high" | "medium" | "low" — industry impact.
- irishEuAngle: true if the story has direct relevance to Ireland or the EU, else false.

Return ONLY minified JSON, no prose:
{"entities":["..."],"significance":"high|medium|low","irishEuAngle":true}

TITLE: ${title}
DESCRIPTION: ${description}
BODY:
${String(content).slice(0, 8000)}`;

  const response = await callWithRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  }));

  const parsed = extractJson(response);
  if (!parsed) return null;

  const entities = Array.isArray(parsed.entities)
    ? [...new Set(parsed.entities.map((e) => String(e).trim()).filter(Boolean))]
    : [];
  const significance = SIGNIFICANCE.has(parsed.significance) ? parsed.significance : 'medium';
  const irishEuAngle = parsed.irishEuAngle === true;
  return { entities, significance, irishEuAngle };
}

/** Surgically insert the given preformatted YAML lines into a file's
 *  frontmatter block, leaving the body and existing keys untouched. */
function insertFrontmatterKeys(filePath, lines) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) throw new Error(`No frontmatter block in ${filePath}`);
  const insertText = lines.join('\n');
  const block = /^draft:/m.test(fm[1])
    ? fm[1].replace(/^draft:/m, `${insertText}\ndraft:`)
    : `${fm[1]}\n${insertText}`;
  fs.writeFileSync(filePath, raw.replace(fm[0], `---\n${block}\n---`));
}

const yamlEntities = (ents) =>
  `entities: [${ents.map((e) => `"${e.replace(/"/g, "'")}"`).join(', ')}]`;

function hasEntities(filePath) {
  const fm = fs.readFileSync(filePath, 'utf-8').match(/^---\n([\s\S]*?)\n---/);
  return !!fm && /^entities:/m.test(fm[1]);
}

const fmtElapsed = (ms) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
};

async function main() {
  if (!fs.existsSync(NEWS_DIR)) {
    console.error(`❌ News directory not found: ${NEWS_DIR}`);
    process.exit(1);
  }

  const allFiles = fs.readdirSync(NEWS_DIR).filter((f) => f.endsWith('.md')).sort();
  const pending = allFiles.filter((f) => !hasEntities(path.join(NEWS_DIR, f)));
  const done = allFiles.length - pending.length;

  console.log(`📚 ${allFiles.length} articles; ${done} already tagged, ${pending.length} pending.`);

  if (DRY_RUN) {
    console.log('🔎 --dry-run: no API calls, no writes. Sample of pending files:');
    pending.slice(0, 10).forEach((f) => console.log(`   • ${f}`));
    if (pending.length > 10) console.log(`   … +${pending.length - 10} more`);
    return;
  }

  const targets = pending.slice(0, LIMIT);
  if (targets.length === 0) {
    console.log('✅ Nothing to do.');
    return;
  }
  if (Number.isFinite(LIMIT)) console.log(`🎯 --limit ${LIMIT}: processing ${targets.length}.`);

  const client = makeClient();

  const started = Date.now();
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const file = targets[i];
    const full = path.join(NEWS_DIR, file);
    const pos = `[${i + 1}/${targets.length}]`;
    try {
      const { data, content } = matter(fs.readFileSync(full, 'utf-8'));
      const intel = await extractIntel(client, {
        title: data.title || '',
        description: data.description || '',
        content,
      });
      if (!intel) {
        failed++;
        console.warn(`${pos} ⚠️  unparseable extraction, leaving for retry: ${file}`);
        continue;
      }
      insertFrontmatterKeys(full, [
        yamlEntities(intel.entities),
        `significance: "${intel.significance}"`,
        `irishEuAngle: ${intel.irishEuAngle}`,
      ]);
      ok++;
      const elapsed = Date.now() - started;
      const eta = (elapsed / (i + 1)) * (targets.length - (i + 1));
      console.log(`${pos} ✅ ${file}`);
      console.log(`        entities(${intel.entities.length}): ${intel.entities.join(', ')}`);
      console.log(`        sig=${intel.significance} irishEu=${intel.irishEuAngle}  ` +
        `| elapsed ${fmtElapsed(elapsed)} eta ${fmtElapsed(eta)}`);
    } catch (error) {
      failed++;
      console.error(`${pos} ❌ ${file}: ${error.message}`);
    }
  }

  console.log(`\n✨ Backfill pass complete in ${fmtElapsed(Date.now() - started)}: ` +
    `${ok} tagged, ${failed} failed/skipped. ${pending.length - ok} still pending.`);
  if (failed) console.log('   Re-run to retry the failures (idempotent).');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
