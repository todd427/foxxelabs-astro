#!/usr/bin/env node
/**
 * build-refdb.js — the SQLite + FTS5 reference DB (brief §4/§5 step 6).
 *
 * The repo (markdown frontmatter + data/claims.jsonl + data/entity-aliases.json)
 * is the source of truth; this generates a queryable BUILD ARTIFACT from it —
 * data/reference.db, gitignored, rebuilt on demand. Not a hosted DB, not FAISS:
 * the corpus is small enough that SQLite + FTS5 brute force beats ANN, and Node
 * 24's built-in `node:sqlite` (SQLite 3.51 with FTS5) means NO native wheel and
 * NO new dependency — it ships with the runtime.
 *
 * The "smarts" the brief describes fall out as SQL over this DB: full-text
 * search, per-entity trajectory (volume × significance over time), exploration
 * gaps (entities thin in our coverage), and a base for contradiction/novelty
 * queries against the claim store. A few are wired as CLI demos below.
 *
 * Usage:
 *   node scripts/build-refdb.js build           # (re)generate data/reference.db
 *   node scripts/build-refdb.js search <query>  # FTS over articles + claims
 *   node scripts/build-refdb.js trajectory      # top entities by recent weighted activity
 *   node scripts/build-refdb.js gaps            # entities with thin coverage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import matter from 'gray-matter';
import { NEWS_DIR } from './dedupe.js';
import { loadClaims } from './claims.js';
import { aliasCanonical } from './entities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'reference.db');

const SCHEMA = `
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS article_entities;
DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS claim_entities;
DROP TABLE IF EXISTS search;

CREATE TABLE articles (
  slug TEXT PRIMARY KEY, title TEXT, description TEXT,
  publish_date TEXT, updated_date TEXT, category TEXT,
  significance TEXT, irish_eu_angle INTEGER, draft INTEGER, source_url TEXT
);
CREATE TABLE article_entities (slug TEXT, entity TEXT);
CREATE INDEX idx_ae_entity ON article_entities(entity);

CREATE TABLE claims (
  id TEXT PRIMARY KEY, statement TEXT, claim_type TEXT, source_url TEXT,
  source_name TEXT, observed_date TEXT, event_date TEXT, confidence TEXT,
  grounding TEXT, story_id TEXT, supersedes TEXT
);
CREATE TABLE claim_entities (claim_id TEXT, entity TEXT);
CREATE INDEX idx_ce_entity ON claim_entities(entity);

-- Standalone FTS5 index over both articles and claims (kind discriminates).
CREATE VIRTUAL TABLE search USING fts5(kind, ref, title, body);
`;

const SIG_WEIGHT = { high: 3, medium: 2, low: 1 };

function build() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.rmSync(DB_PATH, { force: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);

  const insArticle = db.prepare(`INSERT INTO articles
    (slug, title, description, publish_date, updated_date, category, significance, irish_eu_angle, draft, source_url)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const insAE = db.prepare('INSERT INTO article_entities (slug, entity) VALUES (?, ?)');
  const insClaim = db.prepare(`INSERT OR REPLACE INTO claims
    (id, statement, claim_type, source_url, source_name, observed_date, event_date, confidence, grounding, story_id, supersedes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insCE = db.prepare('INSERT INTO claim_entities (claim_id, entity) VALUES (?, ?)');
  const insSearch = db.prepare('INSERT INTO search (kind, ref, title, body) VALUES (?,?,?,?)');

  const asDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : null);

  let nArticles = 0, nClaims = 0;
  db.exec('BEGIN');

  for (const file of fs.existsSync(NEWS_DIR) ? fs.readdirSync(NEWS_DIR) : []) {
    if (!file.endsWith('.md')) continue;
    let parsed;
    try { parsed = matter(fs.readFileSync(path.join(NEWS_DIR, file), 'utf-8')); }
    catch { continue; }
    const { data, content } = parsed;
    const slug = file.replace(/\.md$/, '');
    insArticle.run(
      slug, data.title || '', data.description || '',
      asDate(data.publishDate), asDate(data.updatedDate), data.category || null,
      data.significance || null, data.irishEuAngle ? 1 : 0, data.draft ? 1 : 0,
      data.sourceUrl || null,
    );
    const ents = new Set((Array.isArray(data.entities) ? data.entities : []).map((e) => aliasCanonical(e)).filter(Boolean));
    for (const e of ents) insAE.run(slug, e);
    insSearch.run('article', slug, data.title || '', `${data.description || ''}\n${content}`);
    nArticles++;
  }

  for (const c of loadClaims()) {
    insClaim.run(
      c.id, c.statement || '', c.claim_type || null, c.source_url || null,
      c.source_name || null, c.observed_date || null, c.event_date || null,
      c.confidence || null, c.grounding || null, c.story_id || null, c.supersedes || null,
    );
    for (const e of new Set((Array.isArray(c.entities) ? c.entities : []).map((e) => aliasCanonical(e)).filter(Boolean))) {
      insCE.run(c.id, e);
    }
    insSearch.run('claim', c.id, c.source_name || '', c.statement || '');
    nClaims++;
  }

  db.exec('COMMIT');
  db.close();
  console.log(`✅ Built ${path.relative(process.cwd(), DB_PATH)}: ${nArticles} articles, ${nClaims} claims indexed (FTS5).`);
  console.log('   Gitignored build artifact — rebuild anytime: npm run build-refdb');
}

function openDb() {
  if (!fs.existsSync(DB_PATH)) { console.error('❌ reference.db not found. Run: node scripts/build-refdb.js build'); process.exit(1); }
  return new DatabaseSync(DB_PATH, { readOnly: true });
}

// FTS5 treats bare input as a query expression (- is NOT, unquoted words can be
// read as column filters). Quote each token so user text is matched literally.
function toFtsQuery(query) {
  const tokens = String(query).toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return tokens.map((t) => `"${t}"`).join(' ');
}

function search(query) {
  if (!query) { console.error('usage: node scripts/build-refdb.js search <query>'); process.exit(1); }
  const fts = toFtsQuery(query);
  if (!fts) { console.error('no searchable terms in query'); process.exit(1); }
  const db = openDb();
  const rows = db.prepare(
    `SELECT kind, ref, title, snippet(search, 3, '«', '»', '…', 12) AS snip
     FROM search WHERE search MATCH ? ORDER BY rank LIMIT 15`).all(fts);
  console.log(`🔎 "${query}" — ${rows.length} hit(s):`);
  for (const r of rows) console.log(`  [${r.kind}] ${r.title || r.ref}\n      ${r.snip.replace(/\s+/g, ' ')}`);
  db.close();
}

// Trajectory: per-entity activity weighted by significance, recent first. This is
// the query the frontier.json SOTA tracker is one pinned instance of.
function trajectory() {
  const db = openDb();
  const rows = db.prepare(`
    SELECT ae.entity AS entity,
           COUNT(*) AS articles,
           SUM(CASE a.significance WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 1 END) AS weight,
           MAX(a.publish_date) AS latest
    FROM article_entities ae JOIN articles a ON a.slug = ae.slug
    WHERE a.draft = 0 AND length(ae.entity) > 2
    GROUP BY ae.entity HAVING articles >= 3
    ORDER BY weight DESC, latest DESC LIMIT 20`).all();
  console.log('📈 Top entities by weighted coverage (volume × significance):');
  for (const r of rows) console.log(`  ${String(r.weight).padStart(4)}  ${r.entity}  (${r.articles} articles, latest ${r.latest})`);
  db.close();
}

// Exploration gaps: entities we have touched but barely — candidates for deeper
// coverage. Excludes one-off noise by requiring the entity to be non-trivial.
function gaps() {
  const db = openDb();
  const thin = db.prepare(`
    SELECT ae.entity AS entity, COUNT(*) AS articles, MAX(a.publish_date) AS latest
    FROM article_entities ae JOIN articles a ON a.slug = ae.slug
    WHERE a.draft = 0 AND length(ae.entity) > 3
    GROUP BY ae.entity HAVING articles = 1
    ORDER BY latest DESC LIMIT 25`).all();
  const total = db.prepare('SELECT COUNT(DISTINCT entity) n FROM article_entities').get().n;
  console.log(`🕳️  Exploration gaps — ${thin.length} of ${total} entities appear in only ONE article (recent first):`);
  for (const r of thin) console.log(`  ${r.entity}  (last seen ${r.latest})`);
  db.close();
}

const argv = process.argv.slice(2);
const cmd = argv[0] || 'build';
if (cmd === 'build') build();
else if (cmd === 'search') search(argv.slice(1).join(' '));
else if (cmd === 'trajectory') trajectory();
else if (cmd === 'gaps') gaps();
else {
  console.error('usage:\n  node scripts/build-refdb.js build\n  node scripts/build-refdb.js search <query>\n' +
    '  node scripts/build-refdb.js trajectory\n  node scripts/build-refdb.js gaps');
  process.exit(1);
}
