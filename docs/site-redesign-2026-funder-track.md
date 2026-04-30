# Site Redesign 2026 — Funder Track

**Status:** brief, ready for Claude Code
**Owner:** delegated; Todd signs off
**Timeline:** no hard deadline; pre-dissertation work capped at infrastructure + planning, full execution post-viva
**Audience target:** funders (research and commercial, ranked TBD)
**Secondary audience:** ATU faculty, industry peers, recruiters

---

## Diagnosis

The site reads "boring" and "might as well not exist" because of three structural issues, not insufficient illustration:

1. **Positioning is wrong.** Hero says *"AI security, applications, and industry insights"* — that's a tech blog, not a research lab. A funder reads it and moves on. The fact that this is an Irish researcher running a working cognitive architecture (Mnemos at 75k+ docs, Léargas live, Aislinge consolidating nightly), holding an MSc dissertation in cyberpsychology, and shipping experiments under a coherent Irish-language naming scheme is invisible above the fold.

2. **Hierarchy is flat.** Every section is a card-shaped rectangle of text. The cognitive-stack post — the single strongest credibility asset — is buried as one of "Latest Resources." The news firehose competes equally with curated research. There is no funnel from landing into the strong work.

3. **Visual rhythm is monotone.** Almost no imagery anywhere; the only real hero image on the site is the cognitive-stack hero. Every section the same shape, weight, and idiom. The Sionnach card uses a different visual language (purple gradient) than the rest, which reads as stitched rather than cohesive.

"More visuals" is a symptom; the disease is positioning + hierarchy + flatness.

---

## Architecture: what stays, what changes

**Stays:**
- Astro + Cloudflare Pages stack
- Three-theme system (dark / light / editorial) with CSS custom property tokens
- Existing content collections (resources, news)
- Existing iframe-based interactive embeds (Léargas manifold, AI timeline, etc.)

**Changes:**
- Landing page: rewrite hierarchy and copy
- Resource template: require hero + ≥1 inline graphic for substantive posts
- New: reusable Astro visual primitives (`<Matrix>`, `<StatCallout>`, `<ProcessFlow>`, `<DataBar>`, `<Timeline>`)
- New: dedicated `/research` or `/lab` page as funder-facing surface
- News collection: demote from landing, paginate aggressively, surface only editor's pick
- Hero image strategy: SVG-first for primitives; AI-generated or photographic for narrative posts

**Constraints:**
- WCAG AAA contrast on all generated visuals (≥7:1 normal text, ≥4.5:1 large text). See `public/images/resources/i-hired-out-my-system-2-matrix.svg` for reference colour palette: `#054b41` primary, `#1a1a1a` text, `#333333` secondary, `#ffffff` bg.
- No tracking-by-default claim must remain truthful. Cloudflare Web Analytics (now scaffolded, env-gated) is cookieless and requires no consent banner — keep the pill copy unchanged.
- All interactive elements must work without JS for theme/legibility (progressive enhancement).

---

## Tickets

Ordered by impact-per-hour. T1, T2, T6 are the spine; T4 is the multiplier; T3, T7, T8 are amplification; T5 is parallel-track infra.

### T1 — Positioning rewrite (1–2 hrs)

Rewrite the landing-page hero copy, meta description, and footer tagline to lead with FoxxeLabs identity, not topic claims.

**Acceptance:**
- Hero answers "who, what, why" in <30 words above the fold
- Identifies the lab (Irish-named cognitive architecture, MSc cyberpsychology, working stack on Fly.io)
- Includes one quantitative anchor (e.g. "75,000-document personal memory system" or "running across 12+ Irish-named services")
- Removes generic "AI security and industry insights" framing
- Updates `description` default in `BaseLayout.astro` to match
- Keep tone: short declarative sentences, no marketing jargon

**Trade-off:** identity-led copy narrows the audience. Casual visitors looking for AI news may bounce faster. Acceptable — this is a funder track.

### T2 — Landing page hierarchy redesign (3–4 hrs)

Restructure `src/pages/index.astro` so a 30-second scan answers four questions: who is this person, what are they building, why does it matter, can they execute.

**Above-fold structure (proposed):**
1. Identity hero (T1 copy + portrait or single strong visual)
2. Flagship: cognitive stack as the centerpiece, not a list item — full-width, with the live Léargas iframe or stack diagram visible
3. Three credibility pills: dissertation status, Mnemos doc count (live or static), Substack/published writing count

**Below fold:**
4. Sionnach product showcase (existing, polish only)
5. Selected resources (top 3, hand-curated — not "latest")
6. Selected news (top 2, editor's pick — not latest)
7. About / contact

**Acceptance:**
- Featured Research band stays but is reframed as flagship, not "research"
- News section demoted below resources
- "Browse by Category" removed from landing (lives in `/resources/`)
- No section is purely a list of links if it can be a card with a visual

**Trade-off:** opinionated curation means manual updates when new flagship work lands. Acceptable for a funder-facing landing.

### T3 — Hero image strategy (4–6 hrs)

Generate or commission hero images for the top 10 resource posts. The cognitive-stack hero is the reference standard.

**Approach (in priority order):**
1. **SVG primitives** for posts where the argument has a clean visual structure (matrices, charts, process flows) — see `i-hired-out-my-system-2-*.svg`
2. **Photographic** for posts about people, places, or physical artefacts (drones, books, biometric devices)
3. **AI-generated** as fallback only — must be visually distinct from generic stock-AI aesthetic; if used, lock to a single style for cohesion

**Acceptance:**
- All flagship posts have heroes
- Hero image specs: 1200×675 (16:9), <500KB, AAA-compliant if text overlaid
- `POST_TEMPLATE.md` updated to require hero for any post >1500 words

**Trade-off:** AI-generated heroes are fast but recognisably generic; photographic is brand-coherent but slower. Recommend defaulting to SVG/photographic, AI only when neither fits.

### T4 — Visual primitives library (1–2 days)

Build a small set of reusable Astro components in `src/components/primitives/`:

- `<Matrix>` — 2x2 with quadrant labels, percentages, AAA palette (props: cells[4], xLabels[2], yLabels[2], title)
- `<StatCallout>` — large number + label + caveat (props: value, label, sub, accent?)
- `<ProcessFlow>` — horizontal step diagram (props: steps[])
- `<DataBar>` — horizontal bar chart with baseline marker (props: bars[], baseline, baselineLabel)
- `<Timeline>` — vertical or horizontal milestone list (props: events[])

Each component must:
- Inherit theme tokens (work on dark / light / editorial)
- Render to inline SVG so they're print-friendly and theme-portable
- Pass AAA contrast using the existing token palette
- Have a single import path

**Acceptance:**
- Components used in at least 3 retrofit posts (T7) before sign-off
- Documented in `docs/components-primitives.md` with one usage example per component

**Trade-off:** building primitives takes a day; hand-rolling SVG per post is faster for any single post but doesn't scale. Build the primitives if there's intent to retrofit ≥5 posts; skip if only 1–2 posts will ever use them.

### T5 — Cloudflare Web Analytics activation (5 min, blocked on Todd)

Already scaffolded in `BaseLayout.astro`. Beacon renders only if `PUBLIC_CF_BEACON_TOKEN` is set.

**To activate:**
1. Cloudflare Dashboard → Web Analytics → Add a site → foxxelabs.ie
2. Copy the token from the JS snippet (the value of `data-cf-beacon` JSON `token` field)
3. Cloudflare Pages → foxxelabs-astro project → Settings → Environment Variables → add `PUBLIC_CF_BEACON_TOKEN` (Production scope)
4. Trigger a deploy

**Why Cloudflare Web Analytics, not Plausible:**
- Free vs €9/mo
- Already in the Cloudflare stack, no new vendor
- Cookieless, no consent banner needed under GDPR
- "No tracking by default" pill on landing remains truthful (CWA does not track individuals)

**Trade-off:** CWA's dashboard is less polished than Plausible. If granular event tracking is needed later (CTA click rates, scroll depth), reassess.

### T6 — Funder-facing /research page (3–4 hrs)

Create `src/pages/research/index.astro` as a digital one-pager for funders.

**Structure:**
1. Lab framing: 1 paragraph, what FoxxeLabs is researching and why it's distinctive
2. Active research programmes: cognitive stack, Macalla, Legion, dissertation — each with status, milestone, link to full write-up
3. Theoretical grounding: BFT, NBH, post-viva track — short framing, link to working papers when available
4. Publications: dissertation (when submitted), Substack pieces, BPS conference (post-viva)
5. Infrastructure / capacity: brief mention of stack (Fly.io services, hardware) as evidence of execution capability
6. Contact: explicit funder-track CTA, separate from general contact

**Acceptance:**
- Linked from landing page hero or primary nav
- Self-contained — works as a forwarded URL with no other context
- One sharp visual per programme (use T4 primitives)

**Trade-off:** maintaining a research page adds maintenance load. Compensate by keeping it append-only — milestones get added, never removed.

### T7 — Retrofit pass (3–4 hrs)

Apply T4 primitives and T3 hero strategy to the top 5 most credibility-relevant existing posts:

1. `the-foxxelabs-cognitive-stack.md` — already strong; add a `<DataBar>` showing component status
2. `does-ai-make-us-smarter.astro` — needs hero + matrix visual
3. `we-have-met-the-ai.md` — needs hero + pull-quote callouts
4. `i-hired-out-my-system-2.md` — already has SVGs; consider migrating to `<Matrix>` and `<DataBar>` once primitives exist
5. One experiment writeup (Léargas, Aislinge, or Radharc) — chosen by impact in analytics after T5 lands

### T8 — News firehose taming (1 hr)

The news collection is hundreds of posts of varying quality. As the landing page deprioritises news (T2), reinforce that:

- Add `featured: true` field to news frontmatter schema
- Landing page surfaces only `featured: true` posts
- News index page paginates more aggressively (24 → 12 per page)
- Consider adding tag filters or category browse on news index

**Trade-off:** flagging featured posts is manual curation work. Could be automated later by LLM scoring, but manual for now.

---

## Sequencing

**Pre-dissertation (before June 12):**
- T5 (5 min, blocked on Todd providing token) — get the analytics baseline running so post-redesign measurement has comparison data
- T1 (1–2 hrs) — copy-only, low risk
- Nothing else; protect dissertation time

**Post-viva (after dissertation defended):**
- T2 (landing rewrite) — week 1
- T4 (primitives) — week 1, parallel to T2 if two-track
- T6 (research page) — week 2
- T3 (hero images) — week 2, ongoing
- T7 (retrofit) — week 3
- T8 (news taming) — sweep alongside T2

**Estimated full execution:** 3–5 days of focused work, parallelisable across two-three CC sessions.

---

## What this brief is NOT asking for

To prevent scope creep:

- ❌ **Full visual rebrand.** Keep the FoxxeLabs name, the three-theme system, the existing colour tokens. The diagnosis is structural, not aesthetic.
- ❌ **Stock illustrations / generic AI hero images everywhere.** That is the failure mode that produces the look the feedback is reacting against. SVG primitives, photographic where appropriate, AI only as fallback with strict style discipline.
- ❌ **Migration to a different platform** (Next.js, Hugo, etc.). Astro is fine; the issue is content/structure, not stack.
- ❌ **Comprehensive analytics** beyond Cloudflare Web Analytics. If event-level tracking becomes necessary post-redesign, evaluate then.
- ❌ **Full retrofit of all news posts.** The news collection is too large; it's a firehose by design. T8 deprioritises it; do not retrofit.

---

## Open questions for sign-off

1. Funder target — research (SFI/IRC/Frontiers), commercial (EI/HPSU), TU RISE PhD, or a mix? T1 and T6 copy lean different directions for each. Default assumption: **research-first, commercial-second**, given the cognitive stack is the lead asset.
2. Hero portrait — yes/no for the landing page identity hero (T2)? If yes, which photo. If no, what's the visual anchor instead.
3. Sionnach prominence — keep at current visual weight, or demote post-T2 since it's a product showcase rather than research?
