/**
 * q-sort-worker — Cloudflare Worker for Q-sort live tally storage.
 *
 * Endpoints (all support ?study=<study-name>; defaults to "phones-q-sort"):
 *   GET  /sorts   → { sorts: [...] }   — full array of submitted sorts
 *   GET  /count   → { count: N }       — just the running total (cheaper)
 *   POST /sorts   ← { ts, sort }       — appends one record. Returns { ok, count }.
 *
 * Storage: Workers KV under key = study name. Value = JSON-serialised array.
 * Reads use eventual-consistency; writes are atomic per Worker instance.
 *
 * No API key needed (the Worker IS the API). CORS open to foxxelabs.ie and
 * localhost (for testing).
 */

const ALLOWED_ORIGINS = [
  "https://foxxelabs.ie",
  "https://www.foxxelabs.ie",
  "http://localhost:4321",   // Astro dev server
  "http://localhost:3000",
  "http://127.0.0.1:4321",
];

const DEFAULT_STUDY = "phones-q-sort";
const MAX_SORTS_PER_STUDY = 5000;       // generous cap — classroom-scale
const MAX_BODY_BYTES = 8 * 1024;        // 8 KB per submission, plenty for 30 statements

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders(origin),
    },
  });
}

function isValidStudyName(s) {
  // alnum, hyphen, underscore, 1-64 chars — keeps KV keys sane
  return typeof s === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(s);
}

function sanitiseRecord(raw) {
  // Accept ONLY: { ts: ISO string, sort: { "<num>": <int -3..+3> } }
  // Drop anything else (no IPs, fingerprints, etc).
  if (!raw || typeof raw !== "object") return null;

  const ts = typeof raw.ts === "string" && /^\d{4}-\d{2}-\d{2}T/.test(raw.ts)
    ? raw.ts
    : null;
  if (!ts) return null;

  if (!raw.sort || typeof raw.sort !== "object") return null;

  const sort = {};
  for (const k of Object.keys(raw.sort)) {
    const n = parseInt(k, 10);
    const v = raw.sort[k];
    if (!Number.isInteger(n) || n < 1 || n > 200) continue;
    if (!Number.isInteger(v) || v < -5 || v > 5) continue;
    sort[String(n)] = v;
  }
  if (Object.keys(sort).length === 0) return null;

  return { ts, sort };
}

async function getSorts(env, study) {
  const raw = await env.Q_SORTS.get(study);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function appendSort(env, study, record) {
  const sorts = await getSorts(env, study);
  if (sorts.length >= MAX_SORTS_PER_STUDY) {
    return { ok: false, error: "study_full", count: sorts.length };
  }
  sorts.push(record);
  await env.Q_SORTS.put(study, JSON.stringify(sorts));
  return { ok: true, count: sorts.length };
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const study = url.searchParams.get("study") || DEFAULT_STUDY;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!isValidStudyName(study)) {
      return jsonResponse({ error: "bad_study_name" }, 400, origin);
    }

    // GET /count
    if (request.method === "GET" && url.pathname === "/count") {
      const sorts = await getSorts(env, study);
      return jsonResponse({ study, count: sorts.length }, 200, origin);
    }

    // GET /sorts
    if (request.method === "GET" && url.pathname === "/sorts") {
      const sorts = await getSorts(env, study);
      return jsonResponse({ study, sorts }, 200, origin);
    }

    // POST /sorts
    if (request.method === "POST" && url.pathname === "/sorts") {
      const lenHeader = request.headers.get("Content-Length");
      if (lenHeader && parseInt(lenHeader, 10) > MAX_BODY_BYTES) {
        return jsonResponse({ error: "body_too_large" }, 413, origin);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "invalid_json" }, 400, origin);
      }
      const record = sanitiseRecord(body);
      if (!record) {
        return jsonResponse({ error: "invalid_record" }, 422, origin);
      }
      const result = await appendSort(env, study, record);
      if (!result.ok) {
        return jsonResponse(result, 503, origin);
      }
      return jsonResponse(result, 200, origin);
    }

    return jsonResponse({ error: "not_found" }, 404, origin);
  },
};
