#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadCorpusWindow, findDuplicate, appendUpdates, makeStory, vectorize, NEWS_DIR } from './dedupe.js';
import {
  resolveSourceUrl, normalizeClaim, appendClaims, loadClaims,
  foldIncomingClaims, raiseConfidence, claimId,
} from './claims.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8')
);

// Check for API key
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
  console.error('   Set it with: export ANTHROPIC_API_KEY="your-key-here"');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

// Model — Haiku for all generation tasks (search + write).
// Switch to claude-sonnet-4-20250514 here if quality needs a boost.
const MODEL = 'claude-haiku-4-5-20251001';

// Rate limiting configuration
const MAX_RETRIES = 3;
const TOKEN_HEADROOM = 5000;
const MIN_DELAY_MS = 1000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function throttleIfNeeded(response) {
  const remaining = parseInt(response.headers?.['x-ratelimit-remaining-tokens'] ?? '999999', 10);
  const resetAt   = response.headers?.['x-ratelimit-reset-tokens'];

  if (remaining < TOKEN_HEADROOM && resetAt) {
    const resetMs = new Date(resetAt).getTime() - Date.now();
    if (resetMs > 0) {
      console.log(`⏳ Nearing token limit (${remaining} remaining). Waiting ${Math.ceil(resetMs / 1000)}s for window reset...`);
      await delay(resetMs + 500);
    }
  } else {
    await delay(MIN_DELAY_MS);
  }
}

async function callWithRetry(apiCall, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await apiCall();
      await throttleIfNeeded(response);
      return response;
    } catch (error) {
      if (error.status === 429 && attempt < retries) {
        const retryAfter = parseInt(error.headers?.['retry-after'] ?? '0', 10);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : 15000 * attempt;
        console.log(`⏳ Rate limited. Waiting ${waitMs / 1000}s before retry (attempt ${attempt}/${retries})...`);
        await delay(waitMs);
      } else {
        throw error;
      }
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const contentType = args[0] || 'news';

const intervalFlagIndex = args.indexOf('--interval');
const intervalArg = intervalFlagIndex !== -1 ? args[intervalFlagIndex + 1] : 'daily';

const INTERVAL_DAYS = { daily: 1, weekly: 7, monthly: 30 };
const daysBack = INTERVAL_DAYS[intervalArg] ?? 1;

if (!INTERVAL_DAYS[intervalArg]) {
  console.warn(`⚠️  Unknown interval "${intervalArg}", defaulting to daily (1 day)`);
}

const specificTopic = args[1] && !args[1].startsWith('--') ? args[1] : undefined;

function getSourcesForTopic(topic) {
  const t = topic.toLowerCase();
  const { sources } = config;
  const relevant = [];

  if (/security|vulnerabilit|exploit|breach|hack|threat/.test(t)) relevant.push(...sources.security);
  if (/research|breakthrough|paper|arxiv|model release|llm|alignment|safety/.test(t)) relevant.push(...sources.research);
  if (/policy|regulation|governance|act|law|compliance|eu ai/.test(t)) relevant.push(...sources.policy);
  if (/cyberpsych|online behaviour|digital psychology|emoji|social media psychology/.test(t)) relevant.push(...sources.cyberpsychology);
  if (/industry|application|startup|investment|product|market/.test(t)) relevant.push(...sources.industry);

  if (relevant.length === 0) relevant.push(...sources.industry, ...sources.research);
  relevant.push(...sources.ireland_eu);

  return [...new Set(relevant)];
}

async function searchForContent(topic, daysBack) {
  console.log(`🔍 Searching for: ${topic}...`);

  // The recency window belongs in the instruction, not the query string —
  // "1 days" appended to every query polluted search terms.
  const searchQuery = specificTopic ? `${specificTopic} AI` : topic;

  const windowPhrase = daysBack === 1 ? '24 hours' : `${daysBack} days`;

  const topicSources = getSourcesForTopic(topic);
  const sourcesHint = topicSources.length
    ? `Prioritise results from these sources where available: ${topicSources.join(', ')}. `
    : '';

  const searchPrompt = `Search for recent developments on: ${searchQuery}. Find credible, significant news from the past ${windowPhrase}. Focus on substantive developments, not hype. ${sourcesHint}Include any relevant Irish or European angle if present.`;

  const response = await callWithRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: searchPrompt }]
  }));

  // Return the prompt alongside the response so the writer stage can replay
  // the full conversation (including web_search_tool_result blocks) instead
  // of a lossy text-only summary.
  return { response, searchPrompt };
}

// ── URL grounding ────────────────────────────────────────────────────────────
// The writer frequently emits a publisher homepage (e.g. https://cyberpsychology.eu)
// instead of the deep article URL the search actually returned. We bind every
// sourceUrl to a real returned/fetched URL; an unmatched link is dropped, not shipped.
function collectSearchResultUrls(searchResponse) {
  const urls = new Set();
  for (const block of searchResponse.content || []) {
    if (block.type !== 'web_search_tool_result') continue;
    const results = Array.isArray(block.content) ? block.content : [];
    for (const r of results) {
      if (r && r.type === 'web_search_result' && r.url) urls.add(r.url);
    }
  }
  return urls;
}

// ── Step 2: fetch-then-extract claims ────────────────────────────────────────
// The binding constraint upstream was grounding DEPTH: the writer only ever saw
// search snippets, never article bodies, so the mandated sections forced padding.
// Here we web_fetch the real article(s) behind the chosen result URLs and extract
// grounded claims-with-URLs from the FULL text. The writer then renders from the
// claims — structure follows claim count, not a fixed template.
//
// web_fetch can only fetch URLs already in the conversation, so we run this as a
// continuation of the search turn: the search-result URLs are in context and thus
// fetchable. web_fetch_20250910 needs no beta header (plain server tool, like
// web_search); if a future API change requires one, add it on the create() call.
// Extraction is the accuracy-critical step — claim fidelity sets the ceiling for
// everything downstream — so it runs on Sonnet while search/write stay on Haiku.
const EXTRACT_MODEL = 'claude-sonnet-4-6';
const MAX_FETCH_URLS = 2;          // fetch the top 1-2 results, not everything
const SERVER_TOOL_CONTINUATIONS = 4;

function collectFetchOutcomes(content) {
  const out = [];
  for (const block of content || []) {
    if (block.type !== 'web_fetch_tool_result') continue;
    const c = block.content || {};
    if (c.type === 'web_fetch_result') out.push({ url: c.url, ok: true });
    else if (c.type === 'web_fetch_tool_error') out.push({ url: null, ok: false, error: c.error_code });
  }
  return out;
}

async function fetchAndExtractClaims(search, topic) {
  console.log(`📄 Fetching sources and extracting claims...`);
  const { response: searchResponse, searchPrompt } = search;
  const returnedUrls = collectSearchResultUrls(searchResponse);

  const extractPrompt = `From the search results above, pick the 1-2 MOST significant and relevant article URLs and use the web_fetch tool to retrieve their full text. Then extract the grounded factual claims from what you fetched.

A claim is ONE self-contained assertion that a reader could fact-check against the source — a specific announcement, a data point, a stated prediction, a regulatory fact, or a piece of named analysis. Split compound sentences into separate claims. Do NOT include framing, transitions, or your own commentary.

Rules:
- Every claim MUST carry the exact source_url you fetched it from.
- Bind every figure to its stated scope; never merge facts from two different stories.
- Prefer fetched article bodies. If a fetch fails (paywall/block), you may extract from the search snippets instead, but only facts that are explicitly stated there.
- confidence: "official" if the source IS the announcing body; "corroborated" if multiple sources in the results state it; otherwise "single-source".

OUTPUT JSON only, no prose:
{
  "claims": [
    {
      "statement": "one self-contained factual assertion",
      "claim_type": "announcement|data-point|prediction|regulatory-fact|analysis",
      "entities": ["Org", "Product", "Standard", "€7M"],
      "source_url": "https://exact-fetched-url",
      "source_name": "Publisher name",
      "event_date": "YYYY-MM-DD or null",
      "confidence": "single-source|corroborated|official"
    }
  ]
}`;

  const tools = [
    { type: 'web_search_20250305', name: 'web_search' },
    { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: MAX_FETCH_URLS, citations: { enabled: false } },
  ];

  let messages = [
    { role: 'user', content: searchPrompt },
    { role: 'assistant', content: searchResponse.content },
    { role: 'user', content: extractPrompt },
  ];

  let response = await callWithRetry(() => client.messages.create({
    model: EXTRACT_MODEL, max_tokens: 4000, tools, messages,
  }));

  // Server-side tools run their loop inside one call, but if web_fetch hits the
  // iteration cap the response pauses — re-send the accumulated turn to resume.
  const fetchOutcomes = [];
  let guard = 0;
  while (response.stop_reason === 'pause_turn' && guard++ < SERVER_TOOL_CONTINUATIONS) {
    fetchOutcomes.push(...collectFetchOutcomes(response.content));
    messages = [...messages, { role: 'assistant', content: response.content }];
    response = await callWithRetry(() => client.messages.create({
      model: EXTRACT_MODEL, max_tokens: 4000, tools, messages,
    }));
  }
  fetchOutcomes.push(...collectFetchOutcomes(response.content));

  const fetchedOkUrls = fetchOutcomes.filter((o) => o.ok && o.url).map((o) => o.url);
  const grounding = fetchedOkUrls.length > 0 ? 'fetched' : 'snippet';

  const text = response.content
    .filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let raw = [];
  if (jsonMatch) {
    try { raw = JSON.parse(jsonMatch[0]).claims || []; }
    catch { console.warn('   ⚠️  claim JSON did not parse; treating as zero claims.'); }
  }

  // A claim's source must resolve to a URL we actually fetched or the search
  // returned; with exactly one fetched URL we can attribute an unlabelled claim.
  const validUrls = new Set([...returnedUrls, ...fetchedOkUrls]);
  const fallbackUrl = fetchedOkUrls.length === 1 ? fetchedOkUrls[0] : null;
  const observedDate = new Date().toISOString().split('T')[0];
  const claims = raw
    .map((c) => normalizeClaim(c, { grounding, validUrls, observedDate, fallbackUrl }))
    .filter(Boolean);

  const okCount = fetchOutcomes.filter((o) => o.ok).length;
  const errCodes = fetchOutcomes.filter((o) => !o.ok).map((o) => o.error);
  console.log(`   fetched ${okCount}/${fetchOutcomes.length} URL(s)` +
    (errCodes.length ? ` (errors: ${errCodes.join(', ')})` : '') +
    ` → ${claims.length} claim(s) [${grounding}].`);

  return { claims, grounding };
}

// ── Step 2.5: independent verification ───────────────────────────────────────
// Grounding proves a claim came from a real URL — it does NOT prove the URL is
// telling the truth. The "Gemini 2.0 = 10M tokens / Claude 3.7" fabrication
// entered exactly here: a junk newsletter STATED those falsehoods and the
// extractor faithfully captured them, so they passed the URL-grounding gate
// identically to a fact from anthropic.com. This pass re-searches each claim for
// INDEPENDENT corroboration on a different domain and drops anything that is
// neither primary-sourced nor independently confirmed. It is deliberately
// conservative: when in doubt, drop — a missing article beats a false one.
const VERIFY_MODEL = MODEL;        // search-and-judge task; Haiku is sufficient
const VERIFY_MAX_SEARCHES = 8;     // bound the web_search fan-out per article
const VERIFY_CONTINUATIONS = 4;

function hostOf(u) {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; }
}

export async function verifyClaims(claims, topic) {
  if (!claims.length) return { kept: [], results: [] };
  console.log(`🔎 Verifying ${claims.length} claim(s) against independent sources...`);

  const review = claims.map((c, i) => ({
    index: i,
    statement: c.statement,
    source_name: c.source_name,
    source_domain: hostOf(c.source_url),
    claim_type: c.claim_type,
  }));

  const verifyPrompt = `You are a fact-checking editor deciding which claims are safe to publish. Below are claims extracted from a single source article, each with an index, the statement, and the domain it came from.

CLAIMS:
${JSON.stringify(review, null, 2)}

For EACH claim, use the web_search tool to look for INDEPENDENT corroboration — a credible source on a DIFFERENT domain than the original that states the same fact — then classify it:

- "primary": the ORIGINAL source is itself the authoritative body for this fact — a company announcing its own product on its own site, a regulator stating its own regulation, researchers describing their own paper, or an established first-hand news outlet reporting it directly. A marketing blog, newsletter, SEO/aggregator site, or "AI tools" listicle is NEVER primary.
- "corroborated": at least one credible, INDEPENDENT source (different organisation AND domain) states the same fact.
- "uncorroborated": you could not find independent confirmation and the original source is not authoritative for this claim.
- "contradicted": a credible independent source conflicts with the claim — a wrong figure, a product/version that does not exist, a wrong date.

For any "contradicted" verdict, also rate its severity:
- "substantive": the contradiction guts the claim — a core fact is false, a named product/event/entity does not exist, or a headline statistic is materially wrong (off by more than a rounding error).
- "minor": the claim is essentially right but a detail is off — a date wrong by a day or two, a name/version imprecision, a figure off by a small margin, or two sources mildly disagreeing.
For any non-contradicted verdict, severity is null.

Be strict. Hallucinated specifics — a model version no primary source confirms, a capability or statistic no one else reports — must be "uncorroborated" or "contradicted". When genuinely uncertain, choose "uncorroborated", never "primary".

OUTPUT JSON only, no prose:
{
  "verdicts": [
    { "index": 0, "verdict": "primary|corroborated|uncorroborated|contradicted", "severity": "substantive|minor|null", "corroborating_url": "https://... or null", "note": "one short reason" }
  ]
}`;

  const tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: VERIFY_MAX_SEARCHES }];
  let messages = [{ role: 'user', content: verifyPrompt }];

  let response = await callWithRetry(() => client.messages.create({
    model: VERIFY_MODEL, max_tokens: 4000, tools, messages,
  }));
  let guard = 0;
  while (response.stop_reason === 'pause_turn' && guard++ < VERIFY_CONTINUATIONS) {
    messages = [...messages, { role: 'assistant', content: response.content }];
    response = await callWithRetry(() => client.messages.create({
      model: VERIFY_MODEL, max_tokens: 4000, tools, messages,
    }));
  }

  const text = response.content
    .filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let verdicts = null;
  if (jsonMatch) {
    try { verdicts = JSON.parse(jsonMatch[0]).verdicts; } catch { /* handled below */ }
  }

  // Graceful degrade: if the verifier output is unusable, neither nuke the whole
  // run nor wave junk through — keep only claims extraction already rated above
  // single-source (i.e. official/corroborated), drop the rest.
  if (!Array.isArray(verdicts)) {
    console.warn('   ⚠️  verification output unparseable — falling back to confidence ≥ corroborated only.');
    const results = claims.map((c) => ({
      claim: c,
      verdict: c.confidence !== 'single-source' ? 'corroborated' : 'unverified',
      note: 'verifier output unparseable — confidence fallback',
      corroborating_url: null,
    }));
    const kept = claims.filter((c) => c.confidence !== 'single-source');
    console.log(`   kept ${kept.length}/${claims.length} (fallback).`);
    return { kept, results };
  }

  const byIndex = new Map(verdicts.map((v) => [v.index, v]));
  const kept = [];
  const results = [];
  let contradicted = 0;
  claims.forEach((c, i) => {
    const v = byIndex.get(i);
    const verdict = v?.verdict ?? 'uncorroborated';
    results.push({
      claim: c, verdict,
      severity: verdict === 'contradicted' ? (v?.severity ?? 'substantive') : null,
      note: v?.note ?? null,
      corroborating_url: v?.corroborating_url ?? null,
    });
    switch (verdict) {
      case 'primary':
        kept.push(c);
        break;
      case 'corroborated':
        // An independent source confirmed it — reflect that in the stored confidence.
        kept.push({ ...c, confidence: raiseConfidence(c.confidence) });
        break;
      case 'contradicted':
        contradicted++;
        console.warn(`   ⚠️  CONTRADICTED & dropped: "${c.statement.slice(0, 90)}"` +
          (v?.note ? ` — ${v.note}` : ''));
        break;
      default: // uncorroborated or missing verdict → drop (conservative)
        break;
    }
  });

  const dropped = claims.length - kept.length;
  console.log(`   kept ${kept.length}/${claims.length}, dropped ${dropped}` +
    (contradicted ? ` (${contradicted} contradicted)` : '') + '.');
  return { kept, results };
}

async function generateNewsPost(claims, topic) {
  console.log(`✍️  Rendering post from ${claims.length} claim(s)...`);

  const topicSources = getSourcesForTopic(topic);
  const sourcesNote = topicSources.length
    ? `Preferred sources where the claims include them: ${topicSources.join(', ')}.`
    : '';

  // Render strictly from the extracted claims — the claims ARE the grounding, so
  // there is no search replay and no way to introduce an ungrounded fact. The
  // dedupe gate downstream (dedupe.js) handles near-duplicate stories.
  const claimsBlock = JSON.stringify(
    claims.map(({ statement, claim_type, entities, source_url, source_name, event_date, confidence }) =>
      ({ statement, claim_type, entities, source_url, source_name, event_date, confidence })),
    null, 2);

  const prompt = `Write a Foxxe Labs news post STRICTLY from the verified claims below. Every figure, name, date, and quote in your post must trace to one of these claims. Do NOT add any fact, figure, or attribution that is not in the claims.

VERIFIED CLAIMS:
${claimsBlock}

REQUIREMENTS:
- Title: clear, specific headline drawn from the most significant claim
- Description: one compelling sentence (120-160 chars)
- Category: choose from: ${config.newsCategories.join(', ')}
- Tags: 2-4 relevant tags
- Significance: "high" | "medium" | "low" by industry impact
- Entities: the canonical orgs/people/products/standards across the claims
- Irish/EU angle: true if the claims show direct Ireland/EU relevance, else false
- sourceUrl: the source_url of the single most significant claim
- Content: structure and length FOLLOW the claims. Many claims → as many ## sections
  as the material warrants; few claims → a tight brief of a paragraph or two. Do NOT
  pad, do NOT manufacture an "Open Questions" or "Implications" section, and do NOT
  speculate beyond the claims. Lead with the most significant claim; keep distinct
  stories clearly separated and never merge their figures or attributions.
- Tone: ${config.style.tone}
- Approach: ${config.style.approach}
- ${sourcesNote}

OUTPUT FORMAT (JSON only, no other text):
{
  "title": "...",
  "description": "...",
  "category": "...",
  "tags": ["tag1", "tag2"],
  "source": "Primary source name",
  "sourceUrl": "https://...",
  "significance": "high|medium|low",
  "entities": ["Entity1", "Entity2"],
  "irish_eu_angle": true,
  "content": "Full markdown content"
}`;

  const response = await callWithRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  }));

  const text = response.content
    .filter((block) => block.type === 'text').map((block) => block.text).join('\n');
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to extract JSON from response');

  const post = JSON.parse(jsonMatch[0]);

  // Bind sourceUrl to a claim's source_url — those are already real fetched URLs.
  const claimUrls = new Set(claims.map((c) => c.source_url));
  const validUrl = resolveSourceUrl(post.sourceUrl, claimUrls)
    ?? (claims[0] ? claims[0].source_url : null);
  if (post.sourceUrl && !resolveSourceUrl(post.sourceUrl, claimUrls)) {
    console.warn(`   ⚠️  sourceUrl "${post.sourceUrl}" not among claim sources — using lead claim's source.`);
  }
  post.sourceUrl = validUrl;

  if (post.sourceUrl) {
    const sourceLabel = post.source || post.sourceUrl;
    post.content += `\n\n---\n**Source:** [${sourceLabel}](${post.sourceUrl})`;
  }

  return post;
}

async function generateResourcePost(topic) {
  console.log(`✍️  Generating resource post on: ${topic}...`);

  const topicSources = getSourcesForTopic(topic);
  const sourcesNote = topicSources.length
    ? `Prioritise and cite these sources where available: ${topicSources.join(', ')}.`
    : '';

  const prompt = `Create a comprehensive resource post on "${topic}" for Foxxe Labs following this structure:

REQUIREMENTS:
- Title: Clear, descriptive
- Description: One compelling sentence
- Category: Choose from: ${config.resourceCategories.join(', ')}
- Tags: 3-5 relevant tags
- Reading time: Estimate (e.g., "12 min read")
- Further reading: 3-5 quality sources with URLs — ${sourcesNote}

CONTENT: Write a substantive guide grounded in the search results. Let the depth of
your sources set the length and the sections — do not pad to a target word count and
do not invent claims to fill a section. These headings are a menu, not a checklist;
use the ones the material supports and drop the rest:
  Why This Matters · The Map (framework/taxonomy) · Practical Uses ·
  Tradeoffs & Failure Modes · What Changed Recently · What to Watch Next · Foxxe Take

TONE: ${config.style.tone}

Output as JSON:
{
  "title": "...",
  "description": "...",
  "category": "...",
  "tags": [...],
  "readingTime": "...",
  "furtherReading": [{"title": "...", "url": "...", "source": "..."}],
  "content": "Full markdown content"
}`;

  const response = await callWithRetry(() => client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }]
  }));

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to extract JSON from response');

  return JSON.parse(jsonMatch[0]);
}

function createMarkdownFile(postData, type) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const slug = postData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let frontmatter = `---
title: "${postData.title}"
description: "${postData.description}"
publishDate: ${dateStr}
category: "${postData.category}"
tags: [${postData.tags.map(t => `"${t}"`).join(', ')}]`;

  if (type === 'news') {
    if (postData.source)    frontmatter += `\nsource: "${postData.source}"`;
    if (postData.sourceUrl) frontmatter += `\nsourceUrl: "${postData.sourceUrl}"`;
    if (postData.significance) frontmatter += `\nsignificance: "${postData.significance}"`;
    if (Array.isArray(postData.entities) && postData.entities.length) {
      const ents = postData.entities.map(e => `"${String(e).replace(/"/g, "'")}"`).join(', ');
      frontmatter += `\nentities: [${ents}]`;
    }
    if (typeof postData.irish_eu_angle === 'boolean') {
      frontmatter += `\nirishEuAngle: ${postData.irish_eu_angle}`;
    }
    frontmatter += `\nupdates: []`;
  } else if (type === 'resource') {
    if (postData.readingTime) frontmatter += `\nreadingTime: "${postData.readingTime}"`;
    if (postData.furtherReading?.length) {
      frontmatter += `\nfurtherReading:`;
      postData.furtherReading.forEach(item => {
        frontmatter += `\n  - title: "${item.title}"`;
        frontmatter += `\n    url: "${item.url}"`;
        if (item.source) frontmatter += `\n    source: "${item.source}"`;
      });
    }
  }

  frontmatter += `\ndraft: false\n---\n\n`;

  const fullContent = frontmatter + postData.content;
  const outputDir = path.join(__dirname, '..', 'src', 'content', type);

  // Deterministic collision handling. With the dedupe gate upstream, a genuine
  // collision here means a distinct story that happens to share a slug — so
  // increment rather than stamping with Date.now() (which silently accumulated
  // near-duplicate twins under the old code).
  let finalSlug = slug;
  let outputPath = path.join(outputDir, `${finalSlug}.md`);
  let n = 2;
  while (fs.existsSync(outputPath)) {
    finalSlug = `${slug}-${n++}`;
    outputPath = path.join(outputDir, `${finalSlug}.md`);
  }

  fs.writeFileSync(outputPath, fullContent);
  console.log(`✅ Created: ${finalSlug}.md`);
  return finalSlug;
}

async function main() {
  console.log('🚀 Foxxe Labs Content Generator\n');
  console.log(`🤖 Model: ${MODEL}\n`);

  if (contentType === 'resource') {
    const topic = specificTopic || 'AI security best practices';
    console.log(`📝 Generating resource post on: ${topic}\n`);

    try {
      const postData = await generateResourcePost(topic);
      const slug = createMarkdownFile(postData, 'resource');

      console.log('\n✨ Done!');
      console.log(`📄 Review the draft at: src/content/resources/${slug}.md`);
    } catch (error) {
      console.error('❌ Error generating resource:', error.message);
      process.exit(1);
    }

  } else if (contentType === 'news') {
    console.log(`📰 Searching for AI news from the past ${daysBack} day(s) [${intervalArg}]...\n`);

    // Story-identity gate: load existing stories within the dedupe window once.
    // Each candidate is checked against this set (plus stories created earlier
    // in THIS run) so persistent slow-moving stories fold into one timeline
    // instead of being regenerated as near-duplicate articles every cycle.
    const corpus = loadCorpusWindow();
    if (corpus.length) {
      console.log(`🗂️  Dedupe window: ${corpus.length} existing stories in scope\n`);
    }

    // Claim-identity index for the dedupe gate: slug -> that story's claims. Built
    // once, kept in sync as this run creates/folds, so the gate can match on shared
    // event-claims (the brief's primary signal) before falling back to lexical.
    const claimsByStory = new Map();
    for (const cl of loadClaims()) {
      if (!cl.story_id) continue;
      if (!claimsByStory.has(cl.story_id)) claimsByStory.set(cl.story_id, []);
      claimsByStory.get(cl.story_id).push(cl);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const topics = specificTopic ? [specificTopic] : config.topics;
    const created = [];
    const folded = [];

    for (const topic of topics) {
      try {
        const searchResults = await searchForContent(topic, daysBack);

        // Capture deep: fetch the real article(s) and extract grounded claims.
        const { claims: rawClaims } = await fetchAndExtractClaims(searchResults, topic);
        if (!rawClaims.length) {
          // Novelty-by-construction: no grounded claims → no article. This is the
          // structural cure for "no major releases" filler — we render only when
          // there is real captured substance, never to fill the cycle.
          console.log(`↳ No grounded claims for "${topic}" — nothing to publish (no padding).`);
          continue;
        }

        // Trust gate: drop claims that are neither primary-sourced nor
        // independently corroborated. This is the gate the fabricated
        // 10M-token / "Claude 3.7" article would never have passed.
        const { kept: claims } = await verifyClaims(rawClaims, topic);
        if (!claims.length) {
          console.log(`↳ No claims survived verification for "${topic}" — nothing to publish.`);
          continue;
        }

        // Render from verified capture.
        const postData = await generateNewsPost(claims, topic);

        const candidate = makeStory({
          title:       postData.title,
          description: postData.description,
          content:     postData.content,
          entities:    Array.isArray(postData.entities) ? postData.entities : [],
        });

        const hit = findDuplicate(candidate, corpus, { claims, claimsByStory });
        if (hit) {
          // Step 3: a hit folds NOVEL claims into the story's timeline; claims the
          // story already states are CORROBORATION — they raise confidence (via an
          // append-only superseding claim) rather than cluttering the timeline.
          const storyClaims = claimsByStory.get(hit.match.slug) || [];
          const { novel, corroborating } = foldIncomingClaims(claims, storyClaims);

          const toPersist = novel.map((c) => ({ ...c, story_id: hit.match.slug }));
          for (const { incoming, matched } of corroborating) {
            const raised = raiseConfidence(matched.confidence);
            if (raised === matched.confidence) continue; // already corroborated/official — no clutter
            toPersist.push({
              ...incoming,
              story_id:   hit.match.slug,
              confidence: raised,
              supersedes: matched.id,
              id:         claimId(incoming.statement, incoming.source_url),
            });
          }
          appendClaims(toPersist);
          // Keep the in-run claim index current so a later topic can match these.
          if (toPersist.length) claimsByStory.set(hit.match.slug, [...storyClaims, ...toPersist]);

          if (novel.length) {
            appendUpdates(
              hit.match.file,
              novel.map((c) => ({ note: c.statement, sourceUrl: c.source_url })),
              todayStr,
            );
          }
          console.log(`↳ Duplicate of "${hit.match.slug}" [${hit.reason}] ` +
            `(c=${hit.score.combined.toFixed(2)} e=${hit.score.ent.toFixed(2)} t=${hit.score.txt.toFixed(2)}) ` +
            `— ${novel.length} novel claim(s) folded, ${corroborating.length} corroborating.`);
          folded.push(hit.match.slug);
          continue;
        }

        const slug = createMarkdownFile(postData, 'news');
        const newClaims = claims.map((c) => ({ ...c, story_id: slug }));
        appendClaims(newClaims);
        claimsByStory.set(slug, newClaims);   // matchable by later topics this run
        created.push(slug);

        // Make this run's new story immediately matchable by later topics
        // (vectorised against the corpus IDF so cosine is comparable).
        corpus.push(vectorize({
          file:        path.join(NEWS_DIR, `${slug}.md`),
          slug,
          title:       postData.title,
          description: postData.description,
          content:     postData.content,
          entities:    candidate.entities,
          publishDate: todayStr,
        }, corpus));
      } catch (error) {
        console.error(`❌ Error with topic "${topic}":`, error.message);
      }
    }

    console.log(`\n✨ Done! ${created.length} new article(s), ${folded.length} folded into existing timelines.`);
    if (created.length) console.log('📄 New drafts in: src/content/news/');

  } else {
    console.error('❌ Invalid content type. Use "news" or "resource"');
    console.log('\nUsage:');
    console.log('  npm run generate-news');
    console.log('  npm run generate-resource "topic name"');
    process.exit(1);
  }
}

// Only run the generator when invoked directly — importing this module (e.g.
// reverify-corpus.js reusing verifyClaims) must not kick off a generation run.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
