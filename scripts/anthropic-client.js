/**
 * anthropic-client.js — shared Haiku client for the bulk pipeline jobs
 * (backfill-entities.js, frontier.js). Same rate-limit / retry behaviour as
 * generate-content.js so all jobs share the token budget gracefully.
 */
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-haiku-4-5-20251001';

const MAX_RETRIES = 3;
const TOKEN_HEADROOM = 5000;
const MIN_DELAY_MS = 1000;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export function makeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set.');
    process.exit(1);
  }
  return new Anthropic({ apiKey });
}

async function throttleIfNeeded(response) {
  const remaining = parseInt(response.headers?.['x-ratelimit-remaining-tokens'] ?? '999999', 10);
  const resetAt = response.headers?.['x-ratelimit-reset-tokens'];
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

export async function callWithRetry(apiCall, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await apiCall();
      await throttleIfNeeded(response);
      return response;
    } catch (error) {
      if (error.status === 429 && attempt < retries) {
        const retryAfter = parseInt(error.headers?.['retry-after'] ?? '0', 10);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : 15000 * attempt;
        console.log(`⏳ Rate limited. Waiting ${waitMs / 1000}s before retry (${attempt}/${retries})...`);
        await delay(waitMs);
      } else {
        throw error;
      }
    }
  }
}

/** Pull the first JSON object out of a messages response. Returns null if none. */
export function extractJson(response) {
  const text = (response.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
