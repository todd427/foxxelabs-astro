# <span style="color:#26215C">Phones Q-Sort — build spec for Claude Code</span>

**Status:** ready to build
**Companion to:** `docs/phones-q-sort-prd.md` (requirements / rationale)
**Audience:** Claude Code working in `todd427/foxxelabs-astro`
**Date:** 2026-04-30

---

## <span style="color:#534AB7">0. Read this first</span>

This spec replaces the existing `/p/` implementation. It is **not** an additive change.

The current `public/p/index.html` is a drag-chips-onto-a-pyramid sort. The product decision is to switch to a **card-by-card 5-point Likert** that gets **snapped server-side** onto the conventional 2-4-5-8-5-4-2 Q-grid. Same analysis layer (five viewpoint templates), different participant interaction.

There is also a duplicate at `public/phones-q-sort/`. Delete it as part of this work — the canonical path is `/p/`.

The Worker at `worker/q-sort/src/index.js` has a real lost-update race in its KV write path. Fix it as part of this work; it is not optional. Detailed below.

The five viewpoint definitions and the 30 statements are good and stay as-is. Lift them from the current `index.html` to JSON data files; do not re-author them.

Out of scope for this build: demographics, multi-study UI, factor analysis, Astro routing for `/p/`. `/p/` stays in `public/` as static HTML.

---

## <span style="color:#534AB7">1. File manifest</span>

### <span style="color:#0C447C">New files</span>

```
public/p/index.html                       # rewrite — participant flow (card-by-card Likert)
public/p/live/index.html                  # rewrite — presenter live tally (divisiveness sort)
public/studies/phones-q-sort.json         # data: 30 statements + 5 viewpoint templates
worker/q-sort/src/snap.js                 # server-side Likert→Q-grid snap algorithm
worker/q-sort/src/score.js                # server-side viewpoint similarity scoring
worker/q-sort/test/snap.test.js           # acceptance tests for snap
worker/q-sort/test/score.test.js          # acceptance tests for similarity
worker/q-sort/test/api.test.js            # endpoint contract tests (miniflare)
docs/phones-q-sort-build-spec.md          # this file
```

### <span style="color:#0C447C">Files modified</span>

```
worker/q-sort/src/index.js                # refactor: per-submission KV keys + new endpoints
worker/q-sort/wrangler.toml               # add Durable Object binding (only if DO route chosen)
worker/q-sort/package.json                # add miniflare/vitest dev deps
.github/workflows/deploy-q-sort-worker.yml # add test step before deploy
```

### <span style="color:#0C447C">Files deleted</span>

```
public/phones-q-sort/                     # entire directory — duplicate of /p/
```

### <span style="color:#0C447C">Files NOT touched</span>

The Astro layouts, the news/resources content, the existing tools at `/tools/*`. This work is fully scoped to `/p/`, the worker, and the build/test plumbing.

---

## <span style="color:#534AB7">2. The data file</span>

`public/studies/phones-q-sort.json` is the single source of truth for statements and viewpoints. The frontend fetches it once on page load. The worker also reads it (bundled at build time — see §6) so similarity scoring uses the exact same templates.

### <span style="color:#0C447C">Schema</span>

```json
{
  "study": "phones-q-sort",
  "version": 1,
  "title": "Phones in Schools",
  "intro": {
    "headline": "What do you actually think about phones in schools?",
    "subhead": "30 quick reactions. About 3 minutes. Anonymous — no account, no name, no tracking.",
    "tail": "At the end you'll see which of five viewpoints your answers most resemble."
  },
  "likertLabels": ["strongly disagree", "disagree", "neutral", "agree", "strongly agree"],
  "likertFaces": ["😞", "🙁", "😐", "🙂", "😄"],
  "qGrid": {
    "columns": [-3, -2, -1, 0, 1, 2, 3],
    "capacities": [2, 4, 5, 8, 5, 4, 2]
  },
  "statements": [
    { "n": 1, "text": "Mobile phones should be banned from school grounds entirely." },
    ...
  ],
  "viewpoints": [
    {
      "id": "restrictionist",
      "name": "The pragmatic restrictionist",
      "description": "Phones are addictive by design...",
      "target": { "1": 3, "10": 3, "18": 2, ... }
    },
    ...
  ]
}
```

### <span style="color:#0C447C">Population</span>

Lift the existing `STATEMENTS` array and `VIEWPOINTS` object from the current `public/p/index.html` verbatim. The wording is finalised. Do not paraphrase, do not "improve". The five viewpoint IDs are: `restrictionist`, `autonomy`, `connection`, `pedagogical`, `equity`.

The `likertFaces` use the symmetric valence ramp (😞 disappointed / 🙁 mildly displeased / 😐 neutral / 🙂 pleased / 😄 happy) — not the original PRD's anger-joy mismatch.

---

## <span style="color:#534AB7">3. The snap algorithm</span>

Server-side. Pure function. No randomness. Implemented in `worker/q-sort/src/snap.js` and exported as `snap(likert, qGrid) → snapped`.

### <span style="color:#0C447C">Inputs</span>

- `likert`: object mapping statement number (1..30) to integer Likert response (-2..+2 — internal encoding; UI shows faces, but stored values are -2 to +2).
- `qGrid.columns`: `[-3, -2, -1, 0, 1, 2, 3]`
- `qGrid.capacities`: `[2, 4, 5, 8, 5, 4, 2]`

### <span style="color:#0C447C">Output</span>

- `snapped`: object mapping statement number to Q-grid position (-3..+3), respecting capacities exactly. Sum of values across all keys is therefore zero.

### <span style="color:#0C447C">Algorithm</span>

1. Group statement numbers by Likert response. Five buckets: -2, -1, 0, +1, +2.
2. Map each Likert bucket to a *primary* Q column:
   - Likert -2 → column -3
   - Likert -1 → column -2
   - Likert  0 → column 0
   - Likert +1 → column +2
   - Likert +2 → column +3
3. For each Likert bucket in order [-2, +2, -1, +1, 0] (extremes first, neutral last — the centre column has the most slack):
   - Sort the statement numbers in the bucket ascending (deterministic tie-break).
   - Try to place each into its primary column. If full, overflow to the *less extreme* adjacent column (e.g. -3 full → -2; +3 full → +2). If that's also full, continue moving toward zero.
   - Likert 0 statements that overflow column 0 spill outward symmetrically: alternate between column -1 and column +1 in statement-number order.
4. After all five buckets are placed, every column count must equal its capacity. If not, throw `SnapError` — this is a bug, not a runtime condition.

### <span style="color:#0C447C">Determinism</span>

Two participants with identical Likert responses must produce identical snapped grids. The "sort by statement number ascending" tie-break is the contract. Document this in the function's JSDoc.

### <span style="color:#0C447C">Edge cases the tests must cover</span>

- All 30 statements at Likert 0 → spread across all 7 columns according to capacities, alternating outward from centre.
- All at Likert +2 → 2 in column +3, 4 in column +2, 5 in column +1, 8 in column 0, 5 in column -1, 4 in column -2, 2 in column -3 (extreme overflow case).
- Realistic mix: capacities exactly satisfied with no overflow.
- One missing statement number → `SnapError`. Submission is rejected at the API layer before reaching `snap()`.

---

## <span style="color:#534AB7">4. The similarity score</span>

Server-side. Implemented in `worker/q-sort/src/score.js` and exported as `score(snapped, viewpoint) → number` returning a value in `[0, 100]`.

### <span style="color:#0C447C">Formula</span>

Cosine similarity on mean-centred vectors over the subset of statements the viewpoint defines, then mapped from `[-1, 1]` to `[0, 100]`.

```
1. Let S = keys of viewpoint.target  (e.g. 16 of the 30 statements)
2. v1 = [snapped[k]    for k in S]    (participant placements on -3..+3)
3. v2 = [target[k]     for k in S]    (viewpoint targets on -3..+3)
4. v1 -= mean(v1);  v2 -= mean(v2)
5. cos = dot(v1, v2) / (|v1| * |v2|)
6. return round((cos + 1) * 50)
```

If either vector has zero norm after mean-centring (degenerate flat response on the defining subset), return 50.

### <span style="color:#0C447C">Why this and not MAE</span>

Mean-absolute-distance similarity (the current implementation in `index.html`) compresses the score range badly. Real classroom samples cluster in the 60-85% band across all five viewpoints, making the "closest match" feel arbitrary. Cosine on mean-centred vectors is sensitive to *shape* of agreement rather than absolute level, which is what we want when comparing a participant's pattern to a viewpoint's pattern.

### <span style="color:#0C447C">Result payload</span>

The participant gets back, from the POST response:

```json
{
  "ok": true,
  "submissionId": "01HW...",
  "snapped": { "1": 3, ... },
  "scores": [
    { "id": "autonomy",        "score": 82, "rank": 1 },
    { "id": "equity",          "score": 71, "rank": 2 },
    { "id": "pedagogical",     "score": 64, "rank": 3 },
    { "id": "connection",      "score": 58, "rank": 4 },
    { "id": "restrictionist",  "score": 41, "rank": 5 }
  ],
  "distinctive": [
    { "n": 25, "likert":  2, "delta": 2.4 },
    { "n":  3, "likert": -2, "delta": 2.1 },
    { "n": 29, "likert":  1, "delta": 1.8 }
  ],
  "totalSubmissions": 23
}
```

### <span style="color:#0C447C">Distinctive statements</span>

For each statement `n` in the participant's response, compute:

```
delta(n) = | snapped[n] - mean_over_other_viewpoints(target[n]) |
```

…using the four viewpoints **other than** the closest match. Higher delta = more distinctive. Return the top 3 by delta with the participant's actual Likert response (not the snapped value — Likert is what the UI rendered).

This replaces "show top 3 strongest agreements" from the original PRD. It avoids surfacing absolute admissions in a classroom context (e.g. "I check my phone more often than I want to") while keeping the personalised feel.

---

## <span style="color:#534AB7">5. The Worker — refactor</span>

### <span style="color:#0C447C">The problem with current code</span>

`worker/q-sort/src/index.js` `appendSort()` does:

```javascript
const sorts = await getSorts(env, study);   // KV read
sorts.push(record);                          // mutate
await env.Q_SORTS.put(study, JSON.stringify(sorts));  // KV write
```

KV has no atomic compare-and-swap. Two concurrent submissions both read the array, both append, both write — one write wins, the other submission is silently lost. At classroom scale (30 students all hitting submit within 60 seconds when the lesson ends) this loses real data.

### <span style="color:#0C447C">Fix: per-submission KV keys</span>

Choose this over Durable Objects. DO is overkill for the read pattern, costs more, and the migration is more invasive. Per-submission keys with `list({ prefix })` for reads scales fine through low-thousands of submissions per study.

Schema change:

```
OLD:  KV key "phones-q-sort"  →  JSON array of all submissions
NEW:  KV keys "phones-q-sort/<submissionId>"  →  individual submission JSON
      KV key  "phones-q-sort/_meta"  →  { "count": N, "updatedAt": "..." }
```

`submissionId` is a ULID (monotonic, sortable, no collision in practice — use the `ulid` package or a 16-byte crypto-random hex if you want zero deps).

### <span style="color:#0C447C">Endpoints</span>

```
GET  /count?study=<name>
       → { study, count }
       Reads "<study>/_meta" key; falls back to list().count if meta missing.

GET  /sorts?study=<name>&since=<ulid>&limit=200
       → { study, sorts: [...], cursor: "<ulid>" | null }
       List with prefix "<study>/", filter out "_meta", paginate.
       `since` is exclusive; the live tally polls with the last-seen ULID.

POST /sorts?study=<name>
       Body: { ts: ISO, likert: {n: -2..+2} }
       Validates, runs snap() and score(), writes "<study>/<ulid>", increments meta.
       Returns the full result payload (see §4).

GET  /tally?study=<name>
       → {
           study,
           count,
           updatedAt,
           statements: [
             { n, mean, distribution: [strongly_dis, dis, neutral, agr, strongly_agr], divisiveness }
           ]
         }
       This is what the live tally page polls. Computed on demand by reading
       all submissions and aggregating. Cache result in KV under "<study>/_tally"
       with a 5-second freshness window — most polls hit the cache.
```

The `_meta` increment is **not** atomic either, but unlike the array-append pattern, *losing the count update doesn't lose a submission*. The submission KV write happens first; if the meta write fails or races, recompute on next read.

### <span style="color:#0C447C">Sanitisation</span>

Stricter than current. Drop everything in the POST body except `ts` and `likert`. Reject if:

- `ts` not ISO-8601
- `likert` is missing any of statements 1..30
- any `likert` value is not an integer in `[-2, 2]`
- body > 4 KB

Never store IP, User-Agent, country, or anything CF gives you in `request.cf`. The worker writes only `{ts, likert, snapped, scores, submissionId, study}`.

### <span style="color:#0C447C">CORS</span>

Keep the existing allow-list pattern. Add `https://foxxelabs.ie/p/` origin handling — currently scoped to the bare hostname which is fine. No change needed unless tests reveal one.

### <span style="color:#0C447C">Rate limiting</span>

Add a Cloudflare rate-limit rule on the Worker route: 10 POSTs per minute per IP. Not in code — set up via the dashboard or Terraform if there's IaC. Document the manual setup step in `worker/q-sort/README.md`.

### <span style="color:#0C447C">Migration</span>

There is existing data in KV under the old `phones-q-sort` key (single JSON array). Migrate once, manually:

1. `wrangler kv:key get phones-q-sort --binding Q_SORTS` → save to disk.
2. Write a one-shot script `worker/q-sort/scripts/migrate-v1.js` that reads that file and posts each record (with synthetic `likert` derived from the snapped values: `clamp(snapped, -2, 2)`) to the new KV layout.
3. After verification, delete the old key.

If the existing data is empty or test data, skip migration entirely and just clear the key.

---

## <span style="color:#534AB7">6. Frontend — `public/p/index.html`</span>

Single static HTML file. No build step. Vanilla JS, no framework. Inline CSS. Mobile-first.

### <span style="color:#0C447C">Visual design</span>

Match the wireframe in `docs/phones-q-sort-prd.md` §13 follow-on (rendered to the user as the Visualizer artefact in the chat that produced this spec). Key points:

- Light surface, no dark theme. Foxxelabs brand neutrals.
- Inter or system sans. No external font CDN — use system stack to avoid the FOUT and the dependency.
- One statement per screen. ~19px statement font on mobile, ~22px on tablet+.
- Five face buttons in a row, ~50px diameter on a 320px viewport, larger on bigger screens. Coloured ramp red→amber→neutral→green-light→green-strong.
- Progress bar + "N / 30" counter at top. Back button left of bar, no skip.
- Pinch-zoom enabled (no `maximum-scale=1` in viewport meta).
- No `localStorage` use. Single-session by design.

### <span style="color:#0C447C">Flow</span>

1. **Welcome screen.** Headline, subhead, tail (per the data file). Single "Let's go →" button.
2. **Sort screen.** 30 statements, one at a time, tap a face → next. Back button undoes the last response by one. No skip. Counter and progress bar.
3. **Submission state.** After the 30th tap, show a transient "All 30 done. Working out which viewpoint you're closest to…" screen. POST to the worker. On response, transition to result.
4. **Result screen.** Hero card (closest viewpoint name + description). Five similarity bars sorted by score, with only the top one coloured. "What made your viewpoint distinctive" — three rows showing the participant's actual face response and the statement text. Snapshot disclaimer. Two buttons: "See the whole class →" (links `/p/live/`) and "Sort again" (resets state, returns to welcome).

### <span style="color:#0C447C">Data flow</span>

```
On page load:
  fetch('/studies/phones-q-sort.json')  → populate STATEMENTS, VIEWPOINTS, intro text

On submit:
  POST https://q-sort-api.foxxelabs.ie/sorts?study=phones-q-sort
       { ts: <ISO>, likert: { 1: 2, 2: -1, ..., 30: 1 } }
  → returns full result payload (§4)
  → render result screen from the response

If POST fails:
  Show toast "Couldn't save your response — your sort is shown below but isn't in the live tally."
  Compute viewpoint scores client-side as a fallback (re-implement scoring in JS;
  acceptable since the data file already has the templates).
  Render result screen with that fallback.
```

### <span style="color:#0C447C">Accessibility</span>

- Each face button has both visible label and `aria-label` ("strongly disagree" etc.).
- Keyboard nav: 1-5 keys map to the five faces. Backspace = back. Enter on welcome = start.
- Focus rings preserved. No `outline: none` without replacement.
- Statement text is in a live region updated on each transition so screen readers announce it.

### <span style="color:#0C447C">No-`<form>` rule</span>

Per house rules (also Anthropic Artifacts rules), do not use a `<form>` element. Buttons with `onClick` only.

---

## <span style="color:#534AB7">7. Frontend — `public/p/live/index.html`</span>

Presenter view. Projected on a classroom screen, the teacher's laptop URL.

### <span style="color:#0C447C">Layout</span>

- Header: "foxxelabs.ie/p/live" eyebrow, "Phones in Schools — live" title, large "Submissions" and "In progress" counts on the right.
- Sort controls: pill buttons for "Most divisive" (default), "Strongest agreement", "Strongest disagreement", "Statement #".
- Statement rows: 30 rows, each showing `#N`, statement text, and a 5-segment stacked horizontal bar showing the response distribution (segments coloured red→amber→neutral→green-light→green-strong, widths proportional to count in each Likert bucket).
- Footer: "Showing 30 of 30 · auto-refresh 5s".

### <span style="color:#0C447C">Polling</span>

`GET /tally?study=phones-q-sort` every 5 seconds. Replace state, re-render.

If the polled count hasn't changed since last poll, do nothing (no DOM thrash).

### <span style="color:#0C447C">Divisiveness measure</span>

Don't use raw variance. Use the proportion of responses at the extremes:

```
divisiveness(stmt) = (count[-2] + count[+2]) / total
                     - 0.5 * |count[-2] - count[+2]| / total
```

This is high when responses are bimodally split between the two extremes, low when responses cluster at one end. Document the formula in the source.

### <span style="color:#0C447C">Empty state</span>

Before any submissions arrive: "Waiting for the first sort. URL: foxxelabs.ie/p/" centred. Optionally a QR code (statically generated in the HTML — use a tiny QR library or pre-rendered SVG, your call).

---

## <span style="color:#534AB7">8. The /studies route</span>

`public/studies/phones-q-sort.json` is fetched as `/studies/phones-q-sort.json` from the participant page. Cloudflare Pages serves `public/` at root, so this path works without any Astro routing change.

Future studies drop a new JSON file in the same directory. The `/p/` page reads `?study=<id>` from the URL and fetches `/studies/<id>.json` accordingly. Default if the param is absent: `phones-q-sort`. This mechanism is in scope for *implementation* but the second study is not — only `phones-q-sort.json` exists at end of this work.

---

## <span style="color:#534AB7">9. Acceptance tests</span>

CC must write and pass these. They are the definition of done.

### <span style="color:#0C447C">snap.test.js</span>

```javascript
test('all-neutral fills capacities outward from centre')
test('all-strongly-agree overflows correctly into all 7 columns')
test('realistic mix produces capacity-exact grid')
test('determinism: same input twice gives same output')
test('determinism: tie-break by statement number ascending')
test('missing statement throws SnapError')
test('out-of-range Likert value throws SnapError')
```

### <span style="color:#0C447C">score.test.js</span>

```javascript
test('participant matching viewpoint exactly scores 100')
test('participant inverting viewpoint scores 0')
test('participant on flat-zero subset scores 50 (degenerate case)')
test('score is order-invariant within the target subset')
test('rank order matches expected for the autonomy-advocate fixture')
```

### <span style="color:#0C447C">api.test.js</span>

Use miniflare. Spin up the worker with a mock KV binding.

```javascript
test('POST /sorts with valid body returns 200 and full result payload')
test('POST /sorts with missing statement returns 422')
test('POST /sorts with bad Likert value returns 422')
test('POST /sorts with no body returns 400')
test('GET /count returns 0 for empty study')
test('GET /count after 3 POSTs returns 3')
test('GET /sorts paginates with `since` cursor')
test('GET /tally returns per-statement distributions matching submitted Likerts')
test('two concurrent POSTs both succeed and both appear in /sorts')   // <-- the race fix test
```

The last test is the one that proves the lost-update bug is gone. Run two `fetch()` calls without awaiting either, then `await Promise.all([p1, p2])`, then assert `count === 2`. Repeat 20 times. Should never fail.

### <span style="color:#0C447C">Manual smoke test</span>

After deploy, before declaring done:

1. Open `https://foxxelabs.ie/p/` on a phone. Complete the sort. Verify result screen renders. Verify `/p/live/` shows the submission within 5s.
2. Open three browser tabs. Submit all three sorts within a 5-second window. Verify count is 3 (not 1 or 2).
3. Open `/p/live/` on a desktop. Verify divisiveness sort puts polarised statements at the top.
4. Lighthouse mobile run on `/p/`: performance ≥ 90, accessibility ≥ 95.

---

## <span style="color:#534AB7">10. Deploy and CI</span>

Existing `.github/workflows/deploy-q-sort-worker.yml` runs `wrangler deploy` on push. Add a `test` job that runs first and gates the deploy:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd worker/q-sort && npm ci && npm test
  deploy:
    needs: test
    ...existing deploy job
```

Pages auto-deploy from main is unchanged; static HTML and JSON files just appear at their paths.

---

## <span style="color:#534AB7">11. What CC should NOT do</span>

- Do not refactor the Astro layouts or any unrelated content.
- Do not change the brand styling, the navigation, or anything outside `/p/`, the worker, and the new `docs/`/`tests/` files.
- Do not "improve" the statement wording or the viewpoint descriptions. They are finalised pending the dissertation defence.
- Do not add demographics, cookies, analytics, or any third-party script.
- Do not add a build step to the static HTML. No bundler. No npm install in `public/`.
- Do not migrate the existing KV data without confirming with Todd that the data is real (not test data).
- Do not change the URL structure. `/p/` and `/p/live/` are the contract. Old `/phones-q-sort/` gets deleted, not redirected.

---

## <span style="color:#534AB7">12. Build order suggestion</span>

Roughly the order CC should tackle this. None of these are hard dependencies on each other except where noted, but this order minimises rework.

1. **Data file.** Lift statements + viewpoints into `public/studies/phones-q-sort.json`.
2. **Snap algorithm + tests.** Pure function, easy to TDD.
3. **Score algorithm + tests.** Same.
4. **Worker refactor.** Per-submission keys, new endpoints, sanitisation, response payload. API tests in miniflare. The race-condition test is the gate.
5. **Frontend `/p/`.** Builds against the new worker. Use the data file. Hand-test the full flow on a phone.
6. **Frontend `/p/live/`.** Builds against `/tally` endpoint.
7. **CI test step.** Add to the existing workflow.
8. **Delete `public/phones-q-sort/`.**
9. **Migration of old KV data**, only if Todd confirms it matters.
10. **Manual smoke test.** Deploy and run through §9's manual list.

---

## <span style="color:#534AB7">13. Open questions for Todd</span>

Surface these to Todd in the CC session before starting the work, not after.

1. The existing KV data under the `phones-q-sort` key — real or test? (Determines whether step 9 above happens.)
2. QR code on `/p/live/` empty state — render in HTML or pre-rendered SVG? (No strong opinion either way; pre-rendered is simpler and there's no library cost.)
3. The 5-second tally cache freshness — tighter for a more reactive feel, looser for KV cost? Default 5s is fine; flag if you want different.
4. The deploy gate — block on test failures, or warn-only for the first iteration? Recommend block.

---

*End of build spec.*
