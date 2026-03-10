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

// Rate limiting configuration
const RATE_LIMIT_DELAY_MS = 65000; // 65 seconds between requests to stay under 30K tokens/min
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60000; // Wait 60 seconds before retry on rate limit

/**
 * Delay helper
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API call with retry logic for rate limits
 */
async function callWithRetry(apiCall, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.status === 429 && attempt < retries) {
        const waitTime = RETRY_DELAY_MS * attempt; // Exponential backoff
        console.log(`⏳ Rate limited. Waiting ${waitTime / 1000}s before retry (attempt ${attempt}/${retries})...`);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const contentType = args[0] || 'news'; // 'news' or 'resource'

// Extract --interval flag, defaulting to 'daily'
const intervalFlagIndex = args.indexOf('--interval');
const intervalArg = intervalFlagIndex !== -1 ? args[intervalFlagIndex + 1] : 'daily';

const INTERVAL_DAYS = { daily: 1, weekly: 7, monthly: 30 };
const daysBack = INTERVAL_DAYS[intervalArg] ?? 1;

if (!INTERVAL_DAYS[intervalArg]) {
  console.warn(`⚠️  Unknown interval "${intervalArg}", defaulting to daily (1 day)`);
}

// specificTopic is any non-flag arg after the content type
const specificTopic = args[1] && !args[1].startsWith('--') ? args[1] : undefined;

/**
 * Map a topic string to relevant source categories from config.
 * Always appends ireland_eu as a secondary source for the site's angle.
 */
function getSourcesForTopic(topic) {
  const t = topic.toLowerCase();
  const { sources } = config;
  const relevant = [];

  if (/security|vulnerabilit|exploit|breach|hack|threat/.test(t)) {
    relevant.push(...sources.security);
  }
  if (/research|breakthrough|paper|arxiv|model release|llm|alignment|safety/.test(t)) {
    relevant.push(...sources.research);
  }
  if (/policy|regulation|governance|act|law|compliance|eu ai/.test(t)) {
    relevant.push(...sources.policy);
  }
  if (/cyberpsych|online behaviour|digital psychology|emoji|social media psychology/.test(t)) {
    relevant.push(...sources.cyberpsychology);
  }
  if (/industry|application|startup|investment|product|market/.test(t)) {
    relevant.push(...sources.industry);
  }

  // Default to industry + research if nothing matched
  if (relevant.length === 0) {
    relevant.push(...sources.industry, ...sources.research);
  }

  // Always include Ireland & EU sources for the site's regional angle
  relevant.push(...sources.ireland_eu);

  // Deduplicate
  return [...new Set(relevant)];
}

/**
 * Search for recent AI news/developments
 */
async function searchForContent(topic, daysBack) {
  console.log(`🔍 Searching for: ${topic}...`);

  const searchQuery = specificTopic
    ? `${specificTopic} AI ${daysBack} days`
    : `${topic} recent ${daysBack} days`;

  const topicSources = getSourcesForTopic(topic);
  const sourcesHint = topicSources.length
    ? `Prioritise results from these sources where available: ${topicSources.join(', ')}. `
    : '';

  const response = await callWithRetry(() => client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{
      type: 'web_search_20250305',
      name: 'web_search'
    }],
    messages: [{
      role: 'user',
      content: `Search for recent developments on: ${searchQuery}. Find credible, significant news from the past ${daysBack} days. Focus on substantive developments, not hype. ${sourcesHint}Include any relevant Irish or European angle if present.`
    }]
  }));

  return response;
}

/**
 * Generate a news post from search results
 */
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
- Content: 300-500 words covering:
  * Key Developments (what happened)
  * Industry Context (why it matters)
  * Practical Implications (what it means for builders/users)
  * Open Questions (what's still unclear)
- Sources: Include specific URLs and dates
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
      {
        role: 'user',
        content: prompt
      }
    ]
  }));
  
  // Extract JSON from response
  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }

  const post = JSON.parse(jsonMatch[0]);

  // Append source link to bottom of content if available
  if (post.sourceUrl) {
    const sourceLabel = post.source || post.sourceUrl;
    post.content += `\n\n---\n**Source:** [${sourceLabel}](${post.sourceUrl})`;
  }

  return post;
}

/**
 * Generate a resource post on a specific topic
 */
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
Context and relevance (2-3 paragraphs)

## The Map: [Framework/Taxonomy]
Break down the landscape into clear categories

## Practical Uses
Real-world applications with examples

## Tradeoffs & Failure Modes
What can go wrong, limitations

## What Changed Recently
Recent developments with [sources and dates]

## What to Watch Next
Emerging trends (3-5 bullets)

## Foxxe Take
Your strategic perspective and recommendations

TONE: ${config.style.tone}
LENGTH: 1500-2000 words
FORMAT: Use concrete examples and actionable insights

Search for current information and output as JSON:
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
    tools: [{
      type: 'web_search_20250305',
      name: 'web_search'
    }],
    messages: [{
      role: 'user',
      content: prompt
    }]
  }));
  
  // Get the final text response
  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Create a markdown file from post data
 */
function createMarkdownFile(postData, type) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // Create slug from title
  const slug = postData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Build frontmatter
  let frontmatter = `---
title: "${postData.title}"
description: "${postData.description}"
publishDate: ${dateStr}
category: "${postData.category}"
tags: [${postData.tags.map(t => `"${t}"`).join(', ')}]`;

  if (type === 'news') {
    if (postData.source) {
      frontmatter += `\nsource: "${postData.source}"`;
    }
    if (postData.sourceUrl) {
      frontmatter += `\nsourceUrl: "${postData.sourceUrl}"`;
    }
  } else if (type === 'resource') {
    if (postData.readingTime) {
      frontmatter += `\nreadingTime: "${postData.readingTime}"`;
    }
    if (postData.furtherReading && postData.furtherReading.length > 0) {
      frontmatter += `\nfurtherReading:`;
      postData.furtherReading.forEach(item => {
        frontmatter += `\n  - title: "${item.title}"`;
        frontmatter += `\n    url: "${item.url}"`;
        if (item.source) {
          frontmatter += `\n    source: "${item.source}"`;
        }
      });
    }
  }
  
  frontmatter += `\ndraft: false\n---\n\n`;
  
  // Combine frontmatter and content
  const fullContent = frontmatter + postData.content;
  
  // Determine output path
  const outputDir = path.join(__dirname, '..', 'src', 'content', type);
  const outputPath = path.join(outputDir, `${slug}.md`);
  
  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`⚠️  File already exists: ${slug}.md`);
    const timestamp = now.getTime();
    const newSlug = `${slug}-${timestamp}`;
    const newPath = path.join(outputDir, `${newSlug}.md`);
    fs.writeFileSync(newPath, fullContent);
    console.log(`✅ Created: ${newSlug}.md (with timestamp to avoid conflict)`);
    return newSlug;
  }
  
  fs.writeFileSync(outputPath, fullContent);
  console.log(`✅ Created: ${slug}.md`);
  return slug;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Foxxe Labs Content Generator\n');
  
  if (contentType === 'resource') {
    // Generate a resource post
    const topic = specificTopic || 'AI security best practices';
    console.log(`📝 Generating resource post on: ${topic}\n`);
    
    try {
      const postData = await generateResourcePost(topic);
      const slug = createMarkdownFile(postData, 'resource');
      
      console.log('\n✨ Done!');
      console.log(`📄 Review the draft at: src/content/resources/${slug}.md`);
      console.log('💡 Edit as needed, then change "draft: true" to "draft: false" to publish');
    } catch (error) {
      console.error('❌ Error generating resource:', error.message);
      process.exit(1);
    }
    
  } else if (contentType === 'news') {
    // Generate news posts
    console.log(`📰 Searching for AI news from the past ${daysBack} day(s) [${intervalArg}]...\n`);
    
    const topics = specificTopic ? [specificTopic] : config.topics.slice(0, config.maxPosts);
    const posts = [];
    
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      try {
        const searchResults = await searchForContent(topic, daysBack);
        
        // Delay between search and generation to respect rate limits
        console.log(`⏳ Waiting ${RATE_LIMIT_DELAY_MS / 1000}s before generating post...`);
        await delay(RATE_LIMIT_DELAY_MS);
        
        const postData = await generateNewsPost(searchResults, topic);
        const slug = createMarkdownFile(postData, 'news');
        posts.push(slug);
        
        // Delay between topics (if not the last topic)
        if (i < topics.length - 1) {
          console.log(`⏳ Waiting ${RATE_LIMIT_DELAY_MS / 1000}s before next topic...\n`);
          await delay(RATE_LIMIT_DELAY_MS);
        }
      } catch (error) {
        console.error(`❌ Error with topic "${topic}":`, error.message);
        // Still wait before next topic to avoid compounding rate limits
        if (i < topics.length - 1) {
          console.log(`⏳ Waiting before retry/next topic...`);
          await delay(RATE_LIMIT_DELAY_MS);
        }
      }
    }
    
    console.log(`\n✨ Done! Generated ${posts.length} news post(s)`);
    console.log('📄 Review drafts in: src/content/news/');
    console.log('💡 Edit as needed, or commit to post');
    
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
