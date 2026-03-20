---
title: "Experiment Léargas: Memory That Breathes"
description: "We gave the temporal manifold a body — blobs that grow and fade with sound, Ebbinghaus decay, and a decade of an author's publishing life flowing in from 474 Google Sheets. Here's what emerged."
publishDate: 2026-03-20
category: "Research"
tags: ["Léargas", "Mnemos", "temporal-manifold", "memory", "Ebbinghaus", "AuthorsOwn", "ingest"]
readingTime: "8 min read"
furtherReading:
  - title: "Ebbinghaus Forgetting Curve (Wikipedia)"
    url: "https://en.wikipedia.org/wiki/Forgetting_curve"
    source: "Wikipedia"
  - title: "D3 Force Simulation"
    url: "https://d3js.org/d3-force"
    source: "D3.js"
  - title: "Web Audio API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API"
    source: "MDN"
  - title: "Bayesian Gaussian Mixture Models"
    url: "https://scikit-learn.org/stable/modules/mixture.html#variational-bayesian-gaussian-mixture"
    source: "scikit-learn"
draft: false
---

## <span style="color:#1F4E79">The problem with snapshots</span>

[Experiment Léargas](/resources/experiment-leargas-holographic-memory) introduced the idea of memory as a probability distribution — a Gaussian Mixture Model that deforms when you think, consolidates during sleep, and makes connections you didn't program. The GMM was real. The manifold was personal.

But the first visualisation was static. A moment in time. A photograph of a landscape with no sense of how the landscape grew.

What we wanted was something different: *memory that breathes.* A visualisation that shows not just what you're thinking now, but the accumulated weight of everything you've ever thought — present thoughts blazing, older thoughts fading to ghosts, the whole arc of a cognitive life building in real time as time advances.

That's what we built today.

---

## <span style="color:#1F4E79">The temporal manifold</span>

The underlying data structure is a timeline of periods — each period a GMM snapshot of the documents active in that window. For each period, we fetch documents from Mnemos by date range, embed them with `all-MiniLM-L6-v2`, and fit a Bayesian GMM. Each component becomes a labelled attractor: a cognitive cluster dominant in that period.

The full run covers **38 months** from February 2023 to March 2026, producing:

- 15 normal periods (dense enough for GMM fitting)
- 4 sparse periods (too few documents; listed directly)
- 19 empty periods (no documents)

The gaps are as informative as the data. A 15-month silence from July 2023 to October 2024 marks the period when ChatGPT was set aside in favour of reading — Django 5 by Example, learning Python properly, building the foundations that would later produce the June 2025 explosion.

---

## <span style="color:#1F4E79">Conversation heat</span>

A GMM component label looks like this: *"[Django Image Classifier App] User: save all those instructions..."* — a snippet from a conversation. But a conversation that dominated two months of intense work is different from a single-session query, and that difference should be visible.

We compute a **heat score** per conversation title across all periods:

```
heat(title) = Σ  component.weight × log₁₀(period.doc_count + 2)
              all periods where title appears
```

Normalised to [0, 1]. The logarithm prevents June 2025's 2,952-document explosion from swamping everything — we want cognitive depth, not raw volume.

The top conversations by heat from the full dataset reveal the shape of the work:

| Heat | Conversation |
|------|-------------|
| 1.00 | SLAM bridge opening-bid trainer |
| 0.96 | Todd McCaffrey Books List |
| 0.87 | Writing session — The Rocket City Boys — 2024-12 |
| 0.74 | Create Ad Copy: "The Devil May Cry" by Talla Hill |
| 0.64 | Naturalizing as an Irish Citizen |
| 0.57 | Dragonriders of Pern: F'lon's Demise |

The SLAM bridge trainer at 1.0 is interesting — a December 2025 deep-dive on bridge bidding that dominated that month completely. The Rocket City Boys writing sessions at 0.87 reflect 19 tracked sessions from November to December 2024, totalling 84,181 words. The Pern work in mid-2023 is still scoring — a ghost of old engagement that hasn't fully decayed.

---

## <span style="color:#1F4E79">Ebbinghaus in the renderer</span>

The core insight driving the visualisation: blobs should never die. They should *fade*.

Ebbinghaus's forgetting curve describes memory decay as exponential: retention falls fast then stabilises. We implement this in the D3 renderer using a **persistent blob registry** — no hard exits, only opacity transitions.

```javascript
const DECAY       = 0.62;   // opacity multiplier per absent non-empty period
const MIN_OPACITY = 0.04;   // prune below this — ghost is gone

// Active blob: full opacity, full size, labels visible, strong forces
// Absent blob: opacity × DECAY each non-empty period, 75% size, labels hidden
// Empty periods: decay clock does not advance — silence doesn't age memories
```

The decay clock advances only on non-empty periods. A month with no data doesn't erode what came before — there simply wasn't anything to remember. Only active periods of thought create the passage of time in the manifold.

The visual result: watch the 2023 ad copy blobs — *LA Witch Book Ad*, *Space Adventure Awaits* — appear in February 2023, then slowly become ghosts as the months advance. By the time the June 2025 Django explosion arrives, those 2023 blobs are still there, dim and drifting, behind the blazing current work. The past accumulates rather than disappearing.

This is what we mean when we say memory breathes.

---

## <span style="color:#1F4E79">Sound as information</span>

A blob appearing carries information: a thought arriving, a topic becoming salient. That event deserves an acoustic marker.

We use the Web Audio API to synthesise a distinct sound per blob entry:

- **Frequency**: `800 × (110/800)^heat` — high heat maps to deep resonant tones (~110Hz), low heat to bright clicks (~800Hz). The SLAM bridge trainer arrives as a bass note. A brief ad-copy session arrives as a click.
- **Decay**: `0.06 + heat × 0.49` seconds — brief for small thoughts, half-second resonant tail for large ones.
- **Timbre**: triangle wave for normal blobs (body + pop transient), sine for sparse/first-appearance blobs (softer, questioning).
- **Stagger**: 60ms between blobs so June 2025's 8-component entry sounds like a chord, not a click.

No audio libraries. Pure Web Audio API, lazily initialised on first user gesture (browser autoplay policy). A 🔊/🔇 toggle in the controls bar.

The result is a piece of data sonification that encodes cognitive depth in pitch. Listening to the timeline advance without watching it tells you something about the shape of the thinking.

---

## <span style="color:#1F4E79">A decade of publishing data</span>

The visualisation was compelling. Then we connected it to real data.

474 Google Sheets were found across the Drive archive — a complete record of a professional author's career spanning 20+ years. We wrote a Claude-powered classifier that exports the first 30 rows of each sheet, asks Claude to identify what it is, and returns structured JSON:

```json
{
  "type": "royalties",
  "confidence": 0.95,
  "book_or_subject": "Pern series books",
  "date_column": "Month",
  "value_columns": ["Units", "Royalties", "Ad Spend"],
  "summary": "Monthly royalty earnings for Pern eBook series",
  "skip": false
}
```

The classification across 474 sheets:

| Type | Count |
|------|-------|
| sales_data | 88 |
| marketing | 87 |
| general_notes | 60 |
| royalties | 57 |
| writing_tracker | 50 |
| financial | 49 |
| unknown | 23 |
| contacts | 23 |
| publication_meta | 20 |
| reading_list | 17 |

The writing trackers alone span from **2004 to 2024** — word count logs for Pern novels being written alongside Anne McCaffrey, through to The Rocket City Boys in 2024. The earliest tracker found is dated 2004-10-11.

We ingested the royalties, sales data, financial, writing tracker, and publication meta sheets — 264 sheets — into Mnemos with dated documents. When the temporal manifold re-runs, it will show royalty income mapped against writing sessions, ad spend against sales velocity, the full financial and creative arc of a 20-year publishing career visible as a single animated field.

---

## <span style="color:#1F4E79">What this points toward</span>

Three products are visible in this work.

**<span style="color:#C55A11">AuthorsOwn</span>** — a personal intelligence layer for authors. Their sheets, their manuscripts, their conversation history, their royalties — all ingested, temporally indexed, visualised. The memory map as the front door to understanding your own career. Not another analytics dashboard. A mirror that shows you the shape of your thinking across time.

**<span style="color:#C55A11">A direct sales bookstore</span>** — built on the Anseo white-label architecture. The author owns the customer relationship. The store is the distribution channel; the intelligence layer is what makes it different from Shopify. Coming separately.

**<span style="color:#C55A11">Léargas++</span>** — a conversational interface to your own temporal intelligence. You describe a situation — "I'm six books into a series and momentum is fading" — and the response is grounded in what your own history shows. Not generic AI advice. Advice from someone who has read every conversation you've ever had about your career, every royalty statement, every word count log, and can see the patterns you can't.

The technology is domain-agnostic. Authors are the first vertical because authors — meticulous, data-generating, long-horizon — produce the richest possible substrate for this kind of system. But the architecture works for anyone who generates structured data about themselves over time.

---

## <span style="color:#1F4E79">Foxxe Take</span>

The memory map is not a visualisation of data. It is a visualisation of *attention* — what held cognitive weight, when, and for how long. The blobs that persist are the thoughts that kept coming back. The ghosts are what was set down but not forgotten. The explosions are the phases when everything changed.

What surprised us most: the 2004 Pern writing sessions, tracked in a spreadsheet two decades ago in the same format as the 2024 Rocket City Boys sessions, showing up as ghosts behind the current work. The continuity is real. The system just made it visible.

The June 2025 Django explosion — 2,952 documents, the largest single month — produces a sound when it arrives in the animation that feels right: a chord of eight blobs firing in staggered succession, the low tones of the dominant conversations sitting underneath the brighter clicks of the smaller ones. You hear the weight of it before you see it.

That's the thing we didn't expect to build: something that sounds like thinking.

*Experiment Léargas Memory Map — 20 March 2026. 38 months (2023-02 → 2026-03), 25,104 documents in Mnemos. 474 Google Sheets classified. Writing trackers spanning 2004–2024. Model: all-MiniLM-L6-v2. GMM: BayesianGaussianMixture per period. Hardware: RTX 5060 Ti 16GB (Daisy). Code: [todd427/leargas](https://github.com/todd427/leargas), [todd427/mnemos](https://github.com/todd427/mnemos).*
