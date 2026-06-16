#!/usr/bin/env node
/**
 * hf-models.js — candidate generator for the LLM spotlight.
 *
 * The HF-direct feed the news corpus can't give you: two pulls (momentum +
 * novelty) off the Hub API, noise-filtered, deduped, scored. No API key, no
 * deps, Node 20 global fetch. This is the spotlight's source the way the news
 * sources in config.json feed generate-content.js.
 *
 * Used by scripts/spotlight.js. Standalone preview:
 *   node scripts/hf-models.js [--json]
 */

const HF_API = 'https://huggingface.co/api/models';

const NOISE_TAGS = new Set([
  'gguf', 'abliteration', 'abliterated', 'obliterated', 'quantized',
  'mlx', 'awq', 'gptq', 'exl2', 'fp4', 'nvfp4', 'lora', 'merge',
]);
const NOISE_NAME = /(gguf|abliter|obliter|quantiz|-(awq|gptq|exl2|mlx|fp4|fp8|int4|int8)\b|distill)/i;

async function feed(sort, perFeed = 40) {
  const url = `${HF_API}?pipeline_tag=text-generation&sort=${sort}&direction=-1` +
    `&limit=${perFeed}&full=true&config=false`;
  const headers = { 'User-Agent': 'foxxelabs-astro/spotlight' };
  if (process.env.HF_TOKEN) headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HF ${sort} feed ${res.status}: ${await res.text()}`);
  return res.json();
}

function normalise(raw) {
  const id = raw.id ?? raw.modelId ?? '';
  const [author, ...rest] = id.split('/');
  const created = raw.createdAt ?? raw.created_at ?? null;
  const ageDays = created
    ? Math.max(0, (Date.now() - new Date(created).getTime()) / 86_400_000)
    : null;
  return {
    id,
    url: `https://hf.co/${id}`,
    author: author ?? '',
    name: rest.join('/') || id,
    likes: raw.likes ?? 0,
    downloads: raw.downloads ?? 0,
    trendingScore: raw.trendingScore ?? 0,
    createdAt: created,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    ageDays,
  };
}

function isNoise(c) {
  if (NOISE_NAME.test(c.name)) return true;
  return c.tags.some((t) => NOISE_TAGS.has(t.toLowerCase()));
}

// Ranking only — never surfaced as a "score". Momentum x recency, soft like-floor
// so a day-old 0-download frontier drop can outrank a week-old viral remix.
function score(c) {
  const recency = c.ageDays == null ? 0.5 : Math.exp(-c.ageDays / 21);
  const momentum = c.trendingScore + Math.log10(1 + c.likes) * 12;
  return momentum * (0.4 + 0.6 * recency);
}

export async function getCandidates({ perFeed = 40, top = 12 } = {}) {
  const [trend, fresh] = await Promise.all([
    feed('trendingScore', perFeed),
    feed('createdAt', perFeed),
  ]);
  const byId = new Map();
  for (const raw of [...trend, ...fresh]) {
    const c = normalise(raw);
    if (!c.id || isNoise(c) || byId.has(c.id)) continue;
    byId.set(c.id, c);
  }
  return [...byId.values()]
    .map((c) => ({ ...c, _score: score(c) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, top);
}

// Standalone preview
if (import.meta.url === `file://${process.argv[1]}`) {
  const json = process.argv.includes('--json');
  getCandidates().then((cs) => {
    if (json) { console.log(JSON.stringify(cs, null, 2)); return; }
    cs.forEach((c, i) =>
      console.log(`${String(i + 1).padStart(2)}. ${c.id}  \u2665${c.likes} \u2193${c.downloads} ` +
        `${c.ageDays == null ? '' : `${Math.round(c.ageDays)}d`}`));
  }).catch((e) => { console.error('\u274c', e.message); process.exit(1); });
}
