# <span style="color:#1F618D">Write-Time Dedupe Gate Misses Same-Event Near-Dupes — Fix Brief</span>

<span style="color:#7D3C98">**Audience:** Claude Code.</span> Companion to `docs/intelligence-pipeline-brief.md` (the parent rework, steps 1–6, all landed 2026-06-17). This brief addresses a specific live failure observed on the 2026-06-18 auto-gen run: the upgraded write-time gate published a near-dupe of an existing story. Diagnosed against the actual code and files on 2026-06-19 — do not re-investigate from scratch.

---

## <span style="color:#148F77">1. Symptom — the failing pair</span>

Two published articles, same event (Microsoft June 2026 Patch Tuesday, record ~200 fixes), different framing:

- `src/content/news/microsoft-breaks-its-own-record-with-nearly-200-security-patches-in-june-2026.md` — `publishDate: 2026-06-18`, source Krebs, framed on patch/worm/BitLocker detail. Post-rework (real deep `sourceUrl`, rich `entities`, no template).
- `src/content/news/ai-driven-vulnerability-discovery-reaches-inflection-point-microsoft-posts-record-200-patches-as-u-s-federal-agencies-overhaul-cybersecurity-strategy.md` — `publishDate: 2026-06-13`, source The Hacker News, framed on US federal policy (Trump EO, CISA). Pre-rework (still has the old "Open Questions" template).

The 06-18 candidate should have folded into the existing 06-13 story (or vice-versa under keep-latest). The gate let it through.

---

## <span style="color:#148F77">2. Root cause (numbers, not guesses)</span>

Window is NOT the cause. `loadCorpusWindow` defaults to `DEFAULT_WINDOW_DAYS = 120`; the 06-13 article is 5 days back, well inside. <span style="color:#B9770E">Confirm the live gate's window in `generate-content.js` as step 0</span> — if it passes a short window (1–2 days) a 5-day-old developing story falls outside it, which would be an *additional* cause. But the scoring defect below stands regardless of window.

The miss is structural in `score()` / `isDuplicate()`:

- <span style="color:#B9770E">**Entity Jaccard is structurally tiny for richly-tagged, asymmetric same-event pairs.**</span> Entities here: A (06-18) has 11, B (06-13) has 6; canonical intersection ≈ 1 (`Microsoft`) — `OpenAI`+`Codex` vs `OpenAI Codex` don't even canonicalize together (alias gap). `ent = 1/(11+6−1) ≈ 0.06` (≈0.13 if Codex collapses). Far below `GATE_ENTITY = 0.34`, so the AND-gate `(ent≥0.34 && txt≥0.35)` cannot fire. Jaccard divides by the union, so **the better extraction tags an event, the larger the union and the lower the score** — the entity arm weakens exactly as the rework's extraction improves. Metric defect.
- <span style="color:#B9770E">**The `combined` path can't compensate.**</span> `combined = 0.5·ent + 0.5·txt ≥ DUP_COMBINED (0.55)` with `ent≈0.06` requires `txt ≈ 1.0` (≈0.97 even at ent=0.13). Impossible for genuine reframings. So neither path triggers.
- <span style="color:#B9770E">**Both arms read the whole article.**</span> Same event + divergent framing (policy vs patch-detail) dilutes the TF-IDF cosine and floods each entity set with framing-specific tags (CISA/White House vs Shai-Hulud/BitLocker). The shared core-event identity — the signal that unambiguously says "same story" — is drowned.
- <span style="color:#B9770E">**Regime flip was never recalibrated.**</span> `GATE_*` thresholds were calibrated against the 864-article backlog, which was dominated by the *text-only* regime (historical files had no frontmatter entities). Fresh post-rework articles now carry rich entities, so the *entity* regime applies — and its AND-gate floor (0.34) was inherited, never tuned for rich asymmetric tagging.
- <span style="color:#922B21">**Detection ≠ folding.**</span> `appendUpdates` (claim-folding) is built but only fires *after* `findDuplicate` flags a match. `findDuplicate` is pure TF-IDF + Jaccard and never consults claims. The claim layer (step 2, shipped "CORE — uncalibrated") informs the *write* but not the *decision*. The richer signal that would catch this — shared primary event claim — exists but isn't in the detection path.

---

## <span style="color:#148F77">3. What NOT to do</span>

<span style="color:#922B21">Do not fix this by lowering `GATE_ENTITY` or `DUP_COMBINED`.</span> The 0.45–0.54 text band mixes true dupes with topical cousins on this saturated corpus; dropping the floors reintroduces false merges (burying distinct same-topic stories — e.g. two different Ireland-AI-office sub-events — as updates of each other). False merge remains worse than false miss. The lever is the *signal*, not the threshold.

---

## <span style="color:#148F77">4. The fix</span>

<span style="color:#B9770E">**Primary (architecturally correct): wire event/claim identity into detection.**</span> This is the claim-atom thesis applied to `findDuplicate`, not just to folding.

1. Calibrate step 2 claim extraction (granularity — the open question from the parent brief). Each story exposes its primary event claim(s).
2. Make `findDuplicate` a claim-overlap check first: does the candidate's primary event-claim already exist in a windowed story? Two Patch-Tuesday pieces share "Microsoft June 2026 Patch Tuesday: record ~200 fixes" even when framing diverges. Lexical `score()` becomes a secondary/backstop signal, not the sole gate.

<span style="color:#B9770E">**Secondary (immediate, if claim calibration lags):**</span> two metric fixes that don't wait on step 2 —

- Replace/augment entity Jaccard with an **overlap coefficient** `inter / min(|A|,|B|)` (robust to asymmetric set sizes) or a **core-entity match** restricted to entities appearing in title/description. For this pair the core entities (Microsoft, Patch Tuesday, record-200, Codex) match strongly even though full-set Jaccard is ~0.06.
- Add a **date-windowed event-signature** match: derive a key from primary org + event noun + salient number (`microsoft|patch-tuesday|200`) — exactly the IDF-distinctive tokens the module already prizes — and treat an exact signature collision within the window as a duplicate regardless of body cosine.

<span style="color:#B9770E">**Recalibrate the live entity-regime gate**</span> against the post-rework reality: run `node scripts/dedupe.js report <window>` over the recent rich-entity window and read the distributions; the report harness already exists for this.

<span style="color:#B9770E">**Close the alias gaps**</span> in `scripts/entities.js`: `OpenAI` / `Codex` / `OpenAI Codex` → one canonical; `Patch Tuesday` variants. (Minor — even perfect canonicalization leaves Jaccard ≈0.15 here, so this is necessary but not sufficient; the metric/claim fix is what actually closes it.)

---

## <span style="color:#148F77">5. Acceptance / calibration target</span>

- The 06-18 Microsoft piece folds into the 06-13 story (keep-latest demotes the older, or folds the newer as an update — match the existing collapse policy).
- No regression in false-merge rate on saturated clusters: distinct same-topic stories (different Ireland-AI-office sub-events, different EU-omnibus sub-deals) must stay separate. Verify with the existing `report` / `review` harness before and after.
- Re-run the live gate against the last ~2 weeks of articles; confirm same-event pairs fold and same-topic distinct stories don't.

---

## <span style="color:#148F77">6. Files</span>

- `scripts/dedupe.js` — `findDuplicate`, `score`, `isDuplicate`, `entityJaccard`; threshold constants `W_ENTITY`, `W_TEXT`, `DUP_COMBINED`, `GATE_ENTITY`, `GATE_TEXT`, `GATE_TEXT_ONLY`, `DEFAULT_WINDOW_DAYS`; `report` harness.
- `scripts/generate-content.js` — the live gate call site, the `loadCorpusWindow` window it passes (step 0 check), and the step-2 claim-extraction output to wire into detection.
- `scripts/entities.js` — `aliasCanonical`; alias-dictionary gaps.
- `docs/intelligence-pipeline-brief.md` — parent brief (claim atom, capture-deep/render-from-capture, constraints).
- The two failing files in `src/content/news/` named in §1 — the calibration fixture.
