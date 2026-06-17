# <span style="color:#1F618D">FoxxeLabs Intelligence Pipeline — Rework Brief</span>

<span style="color:#7D3C98">**Audience:** Claude Code.</span> This brief front-loads findings established in a chat session on 2026-06-17 so CC does not waste a session rediscovering them. Read it fully before touching code.

---

## <span style="color:#148F77">1. Why this is a CC job, not a chat job</span>

The remaining work is tightly-coupled, multi-file, and must be tuned against live output: `generate-content.js` and `dedupe.js` change together, the new fetch-then-extract step has to be calibrated against real fetched articles, and the whole thing only proves out by running `npm run generate-news` against the API and inspecting what comes back. That is an edit–run–inspect loop over local files. It cannot be done blind through git-mcp round-trips. The core change (claim extraction from fetched sources) can *only* be tuned by looking at fetched articles and the claims they yield — that calibration is the whole job.

---

## <span style="color:#148F77">2. Findings already established (do not re-litigate)</span>

- <span style="color:#B9770E">**The generator IS grounded in web search.**</span> `searchForContent()` runs the model with the `web_search_20250305` tool; `generateNewsPost()` replays the full search turn (including `web_search_tool_result` blocks) into the writer, with a hard rule against any figure/name/date/quote not in the results. The pap is *not* hallucination-from-nothing.
- <span style="color:#B9770E">**The pap mechanism is snippet-depth grounding stretched over a fixed template.**</span> The writer sees search *snippets*, never the article body. Snippets anchor a headline and 2–3 hard facts but cannot fill 300–500 words, so the mandated four sections (Key Developments / Industry Context / Practical Implications / Open Questions) force padding. The factual-accuracy rules guard *figures*; they do not guard *framing*, and framing is most of the word count. "Open Questions" literally instructs the model to invent uncertainty. The resource template is worse: seven mandated sections, 1500–2000 words, same shallow grounding.
- <span style="color:#B9770E">**`sourceUrl` is not validated.**</span> The deep article URLs are present in the search results, but nothing binds `sourceUrl` to a returned result URL, so the model frequently emits the publisher homepage (e.g. `https://cyberpsychology.eu`). Validation gap, not a missing capability.
- <span style="color:#B9770E">**The dedupe gate is already wired into the live generator.**</span> `loadCorpusWindow`, `findDuplicate`, `appendUpdate`, `makeStory`, `vectorize` run in the news loop; a hit folds into a timeline via an `updates: []` array instead of writing a new file. The story-linker is NOT greenfield — `appendUpdate` (which writes a shallow one-line note) is the upgrade point.
- <span style="color:#B9770E">**Supabase is dead and optional.**</span> `supabaseEnabled` gates on env vars; missing vars → warn and skip; the write is non-fatal; the code comment says "pipeline still works without it." The project has been paused ~85 days (Supabase pauses free projects after ~7 days of zero API activity), proving no writes for ~3 months. <span style="color:#922B21">Delete the Supabase path — do not revive it.</span>
- <span style="color:#B9770E">**The 570-file backlog predates the working gate**</span> and the entity-Jaccard arm was inert on it (entities were never in frontmatter). Backlog needs entity-backfill before any clustering can work.

---

## <span style="color:#148F77">3. Diagnosis: the binding constraint</span>

<span style="color:#922B21">**Grounding depth is the binding constraint, and it sits upstream of everything else.**</span> The structured fields (`entities`, `significance`) are produced by the same snippet-bound pass that writes the prose, so they inherit the same shallowness — you cannot infer market direction or exploration targets from fields that thin. No format change fixes this; it only relocates the padding. The fix has to deepen capture before anything downstream gets smarter.

---

## <span style="color:#148F77">4. Target architecture</span>

<span style="color:#B9770E">**Atom = the claim**</span> (a single assertion: statement, source URL, dates, entities, confidence), not the article. Articles become a projection over claims.

<span style="color:#B9770E">**Capture deep, render from capture.**</span> Insert a step that `web_fetch`es the real article behind each chosen result URL and extracts grounded claims-with-URLs from the full text, decoupled from presentation. The writer then renders from claims, with structure following claim count — no fixed section skeleton.

<span style="color:#B9770E">**Substrate = in-repo, files-as-truth.**</span> Claims as append-only JSONL (clean diffs, no rewrite of existing lines — correct shape for arithmetic daily growth). Stories as `stories.json`. A canonical entity-alias dictionary as committed JSON. A SQLite + FTS5 reference DB generated from the repo as a **build artifact** (gitignored, rebuilt on demand) — not a hosted DB, not FAISS (corpus is ~150–250 distinct rows after collapse; brute force beats ANN at this scale and avoids a native wheel).

<span style="color:#B9770E">**Smarts fall out of the claim store as queries:**</span> novelty gate (render only when ≥N unseen claims — kills the "no major releases" filler by construction), trajectory (claim volume × significance per entity over time), exploration gaps (entities thin in our coverage), contradictions across sources, and the existing `frontier.json` SOTA tracker as one pinned instance of the trajectory query.

Proposed schemas (starting point, refine empirically):

```
claim (append-only JSONL)
  id, statement, claim_type {announcement|data-point|prediction|regulatory-fact|analysis}
  entities[]            // canonical, FK to alias dict
  source_url            // required, must be a real fetched URL
  source_name, observed_date, event_date
  confidence            // single-source | corroborated | official
  story_id, supersedes  // supersedes = claim id, for moving facts

story (stories.json)
  id, title, entities[], status {developing|settled|dormant}
  current_summary       // rewritten on each attach
  first_seen, last_updated, claim_ids[]
```

---

## <span style="color:#148F77">5. Sequenced work</span>

1. <span style="color:#B9770E">**Quick grounding wins.**</span> Validate `sourceUrl` against the URLs the search actually returned (reject otherwise). Drop the fixed body template; let length track grounded substance. Remove the Supabase path (~50 lines).
2. <span style="color:#B9770E">**Fetch-then-extract claim step.**</span> `web_fetch` the chosen result URL(s), extract claims-with-URLs from full text. This is the core change and the main calibration target.
3. <span style="color:#B9770E">**Evolve `appendUpdate` → claim-folding.**</span> A duplicate hit folds its novel claims into the story instead of appending a one-line note; corroboration raises confidence rather than cluttering.
4. <span style="color:#B9770E">**Entity-alias dictionary + backfill.**</span> Build the controlled vocabulary from existing scattered entity sets; run `backfill-entities.js` to populate frontmatter entities so the entity arm becomes live.
5. <span style="color:#B9770E">**Reviewed backlog clustering.**</span> Connected-component clustering at a high threshold with human approval before any rewrite. Keep-latest-canonical; demote superseded to `draft:true`; hard-delete only where `publishDate` AND title match (true re-emissions). False merge worse than false miss.
6. <span style="color:#B9770E">**SQLite + FTS5 reference DB**</span> generated from the repo as a build artifact.

---

## <span style="color:#148F77">6. Hard constraints (do not drift)</span>

- <span style="color:#922B21">Minimal dependencies. No native binaries.</span> (pgvector, ONNX, FAISS all already rejected on failure-point grounds.) New deps clear a high bar.
- <span style="color:#922B21">Files-as-truth.</span> The repo is the living state. The site is a byproduct; the structured intelligence is the product. Hosted DBs that the build depends on are a failure point — avoid.
- <span style="color:#922B21">False merge is worse than false miss.</span> Bias dedupe/threading thresholds high; open a new story when uncertain.
- Editor is `vi`. Projects directory is `/home/Projects`. Commit directly; do not produce artifacts.
- API throughput: budget real-world at 3–4× floor-latency arithmetic. State estimates explicitly.

---

## <span style="color:#148F77">7. Open questions CC must answer empirically</span>

- **Claim granularity** — what is one claim vs several? Tune against real fetched articles.
- **Novelty threshold** — how many unseen claims justify rendering a new piece vs folding? This is the filler-suppression dial.
- **Dedupe thresholds** — re-tune the combined/entity/text thresholds once the entity arm is live on backfilled frontmatter; current values were set with the entity arm inert.
- **Fetch failures** — paywalls/blocks on `web_fetch`; fallback policy (snippet-only claim with lowered confidence vs skip).
- **Model** — generator is Haiku 4.5 for all tasks; decide whether claim extraction warrants Sonnet.

---

## <span style="color:#148F77">8. Key files</span>

- `scripts/generate-content.js` — generator (search + write loop, Supabase path, collision handling).
- `scripts/dedupe.js` — `loadCorpusWindow`, `findDuplicate`, `appendUpdate`, `makeStory`, `vectorize` (TF-IDF cosine + entity Jaccard).
- `scripts/backfill-entities.js` — entity backfill (step 4).
- `scripts/frontier.js`, `data/frontier.json` — SOTA tracker (becomes a trajectory-query instance).
- `scripts/config.json` — topics, sources, categories, style.
- `docs/dedupe-gate.md` — prior handoff doc.
- `src/content/news/*.md` — the 570-file backlog.
