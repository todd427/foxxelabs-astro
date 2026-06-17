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
const EXTRACT_MODEL = MODEL;       // bump to a Sonnet id here if calibration shows Haiku under-extracts
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

    const todayStr = new Date().toISOString().split('T')[0];
    const topics = specificTopic ? [specificTopic] : config.topics;
    const created = [];
    const folded = [];

    for (const topic of topics) {
      try {
        const searchResults = await searchForContent(topic, daysBack);

        // Capture deep: fetch the real article(s) and extract grounded claims.
        const { claims } = await fetchAndExtractClaims(searchResults, topic);
        if (!claims.length) {
          // Novelty-by-construction: no grounded claims → no article. This is the
          // structural cure for "no major releases" filler — we render only when
          // there is real captured substance, never to fill the cycle.
          console.log(`↳ No grounded claims for "${topic}" — nothing to publish (no padding).`);
          continue;
        }

        // Render from capture.
        const postData = await generateNewsPost(claims, topic);

        const candidate = makeStory({
          title:       postData.title,
          description: postData.description,
          content:     postData.content,
          entities:    Array.isArray(postData.entities) ? postData.entities : [],
        });

        const hit = findDuplicate(candidate, corpus);
        if (hit) {
          // Step 3: a hit folds NOVEL claims into the story's timeline; claims the
          // story already states are CORROBORATION — they raise confidence (via an
          // append-only superseding claim) rather than cluttering the timeline.
          const storyClaims = loadClaims().filter((c) => c.story_id === hit.match.slug);
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

          if (novel.length) {
            appendUpdates(
              hit.match.file,
              novel.map((c) => ({ note: c.statement, sourceUrl: c.source_url })),
              todayStr,
            );
          }
          console.log(`↳ Duplicate of "${hit.match.slug}" ` +
            `(c=${hit.score.combined.toFixed(2)} e=${hit.score.ent.toFixed(2)} t=${hit.score.txt.toFixed(2)}) ` +
            `— ${novel.length} novel claim(s) folded, ${corroborating.length} corroborating.`);
          folded.push(hit.match.slug);
          continue;
        }

        const slug = createMarkdownFile(postData, 'news');
        appendClaims(claims.map((c) => ({ ...c, story_id: slug })));
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

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
