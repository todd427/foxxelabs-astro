#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Supabase configuration (optional — pipeline still works without it)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!supabaseEnabled) {
  console.warn('⚠️  Supabase env vars not set — intelligence records will not be saved.');
}

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

/**
 * Save an intelligence record to Supabase.
 * Non-fatal — logs a warning if it fails so the pipeline keeps running.
 */
async function saveToSupabase(postData, topic, slug) {
  if (!supabaseEnabled) return;

  const record = {
    topic,
    category:       postData.category     ?? null,
    interval:       intervalArg,
    title:          postData.title         ?? null,
    summary:        postData.description   ?? null,
    significance:   postData.significance  ?? 'medium',
    irish_eu_angle: postData.irish_eu_angle ?? false,
    entities:       postData.entities      ?? [],
    sources:        postData.sourceUrl
      ? [{ url: postData.sourceUrl, title: postData.source ?? postData.sourceUrl }]
      : [],
    slug,
    tags:           postData.tags          ?? [],
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/intelligence_records`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`⚠️  Supabase write failed (${res.status}): ${body}`);
    } else {
      console.log(`🗄️  Saved to Supabase: ${slug}`);
    }
  } catch (err) {
    console.warn(`⚠️  Supabase error: ${err.message}`);
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

  const searchQuery = specificTopic
    ? `${specificTopic} AI ${daysBack} days`
    : `${topic} recent ${daysBack} days`;

  const topicSources = getSourcesForTopic(topic);
  const sourcesHint = topicSources.length
    ? `Prioritise results from these sources where available: ${topicSources.join(', ')}. `
    : '';

  return await callWithRetry(() => client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `Search for recent developments on: ${searchQuery}. Find credible, significant news from the past ${daysBack} days. Focus on substantive developments, not hype. ${sourcesHint}Include any relevant Irish or European angle if present.`
    }]
  }));
}

async function generateNewsPost(searchResults, topic) {
  console.log(`✍️  Generating news post...`);

  const topicSources = getSourcesForTopic(topic);
  const sourcesNote = topicSources.length
    ? `Preferred sources for citation: ${topicSources.join(', ')}. Cite these where the search results include them.`
    : '';

  const prompt = `Based on the search results, write a news post for Foxxe Labs following this format:

REQUIREMENTS:
- Title: Clear, specific headline
- Description: One compelling sentence (120-160 chars)
- Category: Choose from: ${config.newsCategories.join(', ')}
- Tags: 2-4 relevant tags
- Significance: Rate as "high", "medium", or "low" based on industry impact
- Entities: List key organisations, people, products, or standards mentioned (e.g. ["OpenAI", "GPT-5", "NIST"])
- Irish/EU angle: true if the story has direct relevance to Ireland or the EU, false otherwise
- Content: 300-500 words covering:
  * Key Developments (what happened)
  * Industry Context (why it matters)
  * Practical Implications (what it means for builders/users)
  * Open Questions (what's still unclear)
- Tone: ${config.style.tone}
- Approach: ${config.style.approach}
- ${sourcesNote}

OUTPUT FORMAT (JSON):
{
  "title": "Post title",
  "description": "One-sentence description",
  "category": "Category",
  "tags": ["tag1", "tag2"],
  "source": "Primary source name",
  "sourceUrl": "https://...",
  "significance": "high|medium|low",
  "entities": ["Entity1", "Entity2"],
  "irish_eu_angle": true,
  "content": "Full markdown content with ## headings"
}

Search results context: ${topic}

Generate the post as JSON only, no additional text.`;

  const response = await callWithRetry(() => client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: searchResults.content.map(block =>
          block.type === 'text' ? block.text : ''
        ).join('\n')
      },
      { role: 'user', content: prompt }
    ]
  }));

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to extract JSON from response');

  const post = JSON.parse(jsonMatch[0]);

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

CONTENT STRUCTURE:
## Why This Matters
## The Map: [Framework/Taxonomy]
## Practical Uses
## Tradeoffs & Failure Modes
## What Changed Recently
## What to Watch Next
## Foxxe Take

TONE: ${config.style.tone}
LENGTH: 1500-2000 words

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
    model: 'claude-sonnet-4-20250514',
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
  const outputPath = path.join(outputDir, `${slug}.md`);

  if (fs.existsSync(outputPath)) {
    console.log(`⚠️  File already exists: ${slug}.md`);
    const newSlug = `${slug}-${now.getTime()}`;
    fs.writeFileSync(path.join(outputDir, `${newSlug}.md`), fullContent);
    console.log(`✅ Created: ${newSlug}.md (with timestamp to avoid conflict)`);
    return newSlug;
  }

  fs.writeFileSync(outputPath, fullContent);
  console.log(`✅ Created: ${slug}.md`);
  return slug;
}

async function main() {
  console.log('🚀 Foxxe Labs Content Generator\n');

  if (contentType === 'resource') {
    const topic = specificTopic || 'AI security best practices';
    console.log(`📝 Generating resource post on: ${topic}\n`);

    try {
      const postData = await generateResourcePost(topic);
      const slug = createMarkdownFile(postData, 'resource');
      await saveToSupabase(postData, topic, slug);

      console.log('\n✨ Done!');
      console.log(`📄 Review the draft at: src/content/resources/${slug}.md`);
    } catch (error) {
      console.error('❌ Error generating resource:', error.message);
      process.exit(1);
    }

  } else if (contentType === 'news') {
    console.log(`📰 Searching for AI news from the past ${daysBack} day(s) [${intervalArg}]...\n`);

    const topics = specificTopic ? [specificTopic] : config.topics;
    const posts = [];

    for (const topic of topics) {
      try {
        const searchResults = await searchForContent(topic, daysBack);
        const postData = await generateNewsPost(searchResults, topic);
        const slug = createMarkdownFile(postData, 'news');
        await saveToSupabase(postData, topic, slug);
        posts.push(slug);
      } catch (error) {
        console.error(`❌ Error with topic "${topic}":`, error.message);
      }
    }

    console.log(`\n✨ Done! Generated ${posts.length} news post(s)`);
    console.log('📄 Review drafts in: src/content/news/');

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
