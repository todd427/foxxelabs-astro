# <span style="color:#1a7f6b">Dedupe Gate — Status & Handoff</span>

Working notes for continuing the news-pipeline dedupe work in Claude Code.
Branch: `dedupe-gate` (not yet merged to master). Run on the box that holds the
real corpus (Lava/Rose), not a GitHub runner.

## <span style="color:#2c6e9c">What exists and is done</span>

A story-identity gate that stops the pipeline regenerating near-duplicate
articles. The corpus *is* the database — every decision is a pure function of
the committed markdown in `src/content/news/`. No external service, no index.

- `scripts/dedupe.js` — TF-IDF cosine over full article text (title + description
  + body), plus an entity-Jaccard term. Two regimes: entity-aware when both
  sides have `entities` in frontmatter, higher-bar text-only fallback otherwise.
  Exports `loadCorpusWindow`, `findDuplicate`, `appendUpdate`, `makeStory`,
  `vectorize`, `connectedComponents`, `isStrongDuplicate`, plus `report` /
  `review` / `apply` CLI subcommands (calibration, collapse review, collapse apply).
- `scripts/backfill-entities.js` — item 1. Idempotent (skips files with
  `entities:`), surgical frontmatter insert, Haiku extraction of
  `entities`/`significance`/`irishEuAngle`. `--limit N` / `--dry-run` flags.
- `scripts/frontier.js` — item 3. `init` scaffolds `data/frontier.json`;
  `reconcile [daysBack]` reconciles the deduped window per axis (Haiku),
  rewriting only changed axes. `--dry-run` previews without the API.
- `scripts/anthropic-client.js` — shared Haiku client (rate-limit/retry/JSON
  extraction) for the two bulk jobs; the generator keeps its own inline copy.
- `scripts/generate-content.js` — gates each generated post before write: a hit
  folds into the matched story's `updates:` timeline (no new file); a miss writes
  a new file with `entities`/`significance`/`irishEuAngle`/`updates` persisted to
  frontmatter. The old title-list "different angle" prompt (the dupe *cause*) and
  the `Date.now()` slug-collision branch (which masked dupes) are both gone.
- `src/content/config.ts` — news schema carries the new fields; `updates[].date`
  is `z.coerce.date()`.
- One dependency added: `gray-matter`.

Calibration on the real 864-article corpus (TF-IDF): neighbours ≥0.50 dropped
701→379 vs raw TF, largest cluster 72→36, clusters now coherent (genuine
rewrites 0.55–0.79, topical cousins 0.40–0.50). `GATE_TEXT_ONLY = 0.55`, biased
high because the costly live-gate error is a false *merge*, not a miss.

## <span style="color:#2c6e9c">Open items, in order</span>

### <span style="color:#1a7f6b">1. Backfill `entities` into the historical files — ✓ done 2026-05-28</span>

Ran `backfill-entities.js` over the whole corpus: **876/876 tagged, 0 failures,
36m50s** (well inside the ~1–2 h estimate). Extractions are crisp — CVEs, named
numbers (`$0.11 per million tokens`, `34.6% YoY`), orgs, standards. Surgical
inserts (keys before `draft:`, bodies byte-untouched); `astro check` passes 0
errors. Engaging the entity regime sharply tightened precision — see item 2.

Notes for re-runs: idempotent (skips files with `entities:`), so safe to re-run
after interruption; uses Haiku; edits frontmatter surgically (no gray-matter
round-trip). `npm run backfill-entities` (or `node scripts/backfill-entities.js`).

### <span style="color:#2c6e9c">2. Reviewed `apply` (collapse existing dupes) — built; apply not yet run</span>

`dedupe.js review` / `apply` implemented. Clustering is now **connected
components** (transitive, union-find) at a stricter edge (`STRONG_TXT=0.65`,
entity regime `STRONG_COMBINED=0.62` AND `ent>=GATE_ENTITY`), not seed-anchored —
so a central seed no longer pulls in cousins.

With entities now backfilled, `review` flipped from the text-only regime
(17 clusters / 43 foldable) to the **entity regime: 7 clusters / 8 foldable** —
high-confidence. The over-merge this doc warned about is gone (Dark Triad,
journal-agenda, and Ireland €7M are now correctly *separate*), and it catches the
legacy `Date.now()`-suffixed slug twins. Canonical = earliest-published.

`review` writes `dedupe-review.json` (gitignored; edit/delete to reject clusters
or members). `apply <file>` refuses without `--yes`; with it, folds each member
lede into the canonical `updates:` timeline and moves the member file to
`archive/news/`. **Not yet run** — destructive, needs human sign-off on the
review file.

### <span style="color:#2c6e9c">3. SOTA tracker — scaffolded; reconcile not yet run</span>

`frontier.js` implemented on the repo-as-store principle. `data/frontier.json`
(committed) holds current state per axis, seeded from `config.json` topics
(12 axes). `reconcile [daysBack]` (default 7) reads the window's deduped stories,
asks Haiku per axis whether the frontier moved, and rewrites **only changed
axes** (stable key order → clean diffs); git history is the longitudinal record.
`reconcile --dry-run` previews (no API) — currently 60 deduped stories in a 7-day
window. The live `reconcile` (API-backed) has not been run yet.

## <span style="color:#b5651d">Gotchas</span>

- ~~Historical files have **no `entities`** yet~~ — resolved 2026-05-28 (item 1):
  all 876 files now carry `entities`, so new-vs-historical matching runs in the
  entity regime.
- `git diff` won't see newly generated untracked files — `git add` first.
- GitHub Action bot pushes need `contents: write`.
- Irreducible lexical floor: on a corpus this topically concentrated, some true
  dupes in the 0.48–0.54 band publish as new articles, and the several "Ireland
  AI Office" seed-clusters are really one meta-story. Entities (item 1) are the
  lever that tightens this; embeddings would *not* help (two same-subject stories
  embed near-identically). Event identity is lexical-distinctive, not semantic.
