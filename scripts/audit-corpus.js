#!/usr/bin/env node
/**
 * audit-corpus.js — source-trust triage over the existing claim corpus.
 *
 * The verification gate in generate-content.js only protects NEW articles. This
 * tool triages what is ALREADY published: it groups every claim by its story and
 * classifies each claim's source domain as authoritative or unknown, then ranks
 * stories by whether they have ANY trustworthy leg to stand on.
 *
 * IMPORTANT: a low-authority source is NOT proof of falsehood — a real, recently
 * broken, niche story can rest entirely on small blogs. So there is deliberately
 * NO hard denylist here: a non-authoritative domain is "unknown", not "junk".
 * This tool only SURFACES stories worth re-checking; reverify-corpus.js does the
 * live-web adjudication that actually decides truth. READ-ONLY: never edits files.
 *
 *   node scripts/audit-corpus.js            # print ranked report
 *   node scripts/audit-corpus.js --json     # machine-readable to stdout
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadClaims } from './claims.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const NEWS_DIR = path.join(__dirname, '..', 'src', 'content', 'news');

// Authoritative: primaries (vendors/regulators/researchers on their own turf)
// and established first-hand outlets. Matched as a domain suffix, so
// "digital-strategy.ec.europa.eu" matches "europa.eu". Everything else is
// "unknown" — not condemned, just unproven until the verifier checks it.
export const AUTHORITATIVE = new Set([
  'anthropic.com', 'openai.com', 'deepmind.google', 'google.com', 'microsoft.com',
  'arxiv.org', 'trendmicro.com', 'krebsonsecurity.com', 'thehackernews.com',
  'darkreading.com', 'bleepingcomputer.com', 'securityweek.com', 'irisscert.ie',
  'theverge.com', 'arstechnica.com', 'technologyreview.com', 'wired.com',
  'techcrunch.com', 'fortune.com', 'reuters.com', 'ft.com', 'bloomberg.com',
  'spglobal.com', 'europa.eu', 'gov.ie', 'enterprise.gov.ie', 'ecb.europa.eu',
  'artificialintelligenceact.eu', 'futureoflife.org', 'ainowinstitute.org',
  'siliconrepublic.com', 'irishtimes.com', 'euractiv.com', 'bps.org.uk',
  'cyberpsychology.eu', 'pwc.com', 'pwc.ie', 'genai.owasp.org', 'owasp.org',
  'jmir.org', 'nist.gov', 'cisa.gov', 'mitre.org', 'nvidia.com',
  'insideprivacy.com', 'globalpolicywatch.com', 'stibbe.com',
]);

export function hostOf(u) {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; }
}

// Suffix match so subdomains inherit the parent classification.
export function classifyHost(host) {
  if (!host) return 'unknown';
  for (const d of AUTHORITATIVE) if (host === d || host.endsWith('.' + d)) return 'authoritative';
  return 'unknown';
}

/** Group claims by story and tier each by how shaky its support is. */
export function analyzeCorpus() {
  const byStory = new Map();
  for (const c of loadClaims()) {
    if (!c.story_id) continue;
    if (!byStory.has(c.story_id)) byStory.set(c.story_id, []);
    byStory.get(c.story_id).push(c);
  }

  const reports = [];
  for (const [story, claims] of byStory) {
    const tally = { authoritative: 0, unknown: 0 };
    const conf = { 'single-source': 0, corroborated: 0, official: 0 };
    const domains = new Set();
    for (const c of claims) {
      const host = hostOf(c.source_url);
      domains.add(host);
      tally[classifyHost(host)]++;
      conf[c.confidence] = (conf[c.confidence] ?? 0) + 1;
    }

    const hasAuthoritative = tally.authoritative > 0;
    const hasCorroborated = (conf.corroborated + conf.official) > 0;
    let tier;
    if (hasAuthoritative) tier = 'OK';                 // anchored by a primary/established outlet
    else if (hasCorroborated) tier = 'MED';            // no primary, but multiple sources agree
    else tier = 'HIGH';                                // unknown sources, all single-source

    const file = path.join(NEWS_DIR, `${story}.md`);
    reports.push({
      story, tier, claims: claims.length, tally, conf,
      domains: [...domains], live: fs.existsSync(file),
    });
  }

  const order = { HIGH: 0, MED: 1, OK: 2 };
  reports.sort((a, b) => order[a.tier] - order[b.tier] || b.claims - a.claims);
  return reports;
}

function main() {
  const asJson = process.argv.includes('--json');
  const reports = analyzeCorpus();

  if (asJson) { console.log(JSON.stringify(reports, null, 2)); return; }

  const counts = reports.reduce((m, r) => (m[r.tier] = (m[r.tier] ?? 0) + 1, m), {});
  console.log(`\n📊 Corpus audit: ${reports.length} stories\n`);
  console.log(`   HIGH (no authoritative source, all single-source): ${counts.HIGH ?? 0}`);
  console.log(`   MED  (no authoritative source, some corroboration): ${counts.MED ?? 0}`);
  console.log(`   OK   (anchored by an authoritative source): ${counts.OK ?? 0}\n`);

  for (const tier of ['HIGH', 'MED']) {
    const tierReports = reports.filter((r) => r.tier === tier);
    if (!tierReports.length) continue;
    console.log(`\n── ${tier} (${tierReports.length}) ${'─'.repeat(40)}`);
    for (const r of tierReports) {
      const live = r.live ? '' : ' [no file]';
      console.log(`\n• ${r.story}${live}`);
      console.log(`  claims=${r.claims} auth=${r.tally.authoritative} unknown=${r.tally.unknown}` +
        ` | conf: ${r.conf['single-source']}ss/${r.conf.corroborated}corr/${r.conf.official}off`);
      console.log(`  domains: ${r.domains.join(', ')}`);
    }
  }
  console.log('\nThese are flagged for REVIEW, not condemned. Run reverify-corpus.js to adjudicate against the live web.\n');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
