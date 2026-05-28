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
  `vectorize`, plus a `report` CLI for calibration.
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

### <span style="color:#2c6e9c">1. Backfill `entities` into the 864 historical files</span>

Engages the entity regime for new-vs-historical matching and tightens precision —
two different "Ireland AI Office" stories can be split on distinct entities even
when prose overlaps. For each file: read body, extract `entities` (orgs, people,
products, standards, the defining numbers/dates), plus `significance` and
`irishEuAngle` to match the generator's schema. Write them into frontmatter.

- Use Haiku for extraction. ~864 calls. Floor latency suggests ~15–30 min;
  assume **3–4× that in practice** (~1–2 h) with rate limiting. It's a
  long-running bulk job — track elapsed against wall-clock, recalibrate.
- Make it **idempotent** (skip files that already have `entities`) so it's
  re-runnable after interruption.
- Edit frontmatter **surgically** — insert the keys, don't round-trip the whole
  block through gray-matter (avoids reformatting the entire corpus into noisy
  diffs). `appendUpdate` in `dedupe.js` shows the pattern.
- Do it on the branch; it touches all 864 files.

### <span style="color:#2c6e9c">2. Reviewed `--apply` backfill (collapse existing dupes)</span>

Destructive, so human-in-the-loop. The seed-anchored clustering in `report` still
over-merges (a 36-article cyberpsychology blob mixed the journal-agenda story,
the Dark Triad study, and the Ireland €7M funding story — three distinct things).
For `--apply`:

- Cluster with **connected components at a higher threshold** (or mutual-kNN),
  not seed-anchored, to avoid a central seed pulling in cousins.
- Emit a **review file** (proposed canonical + folded members per cluster) for
  approval. Rewrite nothing until approved.
- On approval: fold each member's lede into the canonical's `updates:` timeline,
  then archive/remove the member files.

### <span style="color:#2c6e9c">3. SOTA tracker</span>

Separate feature. Same repo-as-store principle: a committed `frontier.json` (or a
`frontier` content collection) holding current state per axis; a weekly delta
agent reconciles the week's *deduped* stories against it and rewrites only what
changed; git history is the longitudinal record.

## <span style="color:#b5651d">Gotchas</span>

- Historical files have **no `entities`** yet — that's why item 1 is first.
- `git diff` won't see newly generated untracked files — `git add` first.
- GitHub Action bot pushes need `contents: write`.
- Irreducible lexical floor: on a corpus this topically concentrated, some true
  dupes in the 0.48–0.54 band publish as new articles, and the several "Ireland
  AI Office" seed-clusters are really one meta-story. Entities (item 1) are the
  lever that tightens this; embeddings would *not* help (two same-subject stories
  embed near-identically). Event identity is lexical-distinctive, not semantic.
