---
title: "Research Log #0024 — Léargas: Memory That Breathes"
description: "A self-contained log page for the Léargas memory map — topic blobs rising and falling across three years of conversation history, now with a full Web Audio sound engine. Sound on."
publishDate: 2026-03-20
category: "Research"
tags: ["Léargas", "Mnemos", "temporal-manifold", "memory", "Web-Audio", "D3", "sound-design"]
readingTime: "3 min read"
furtherReading:
  - title: "Experiment Léargas: Memory That Breathes (full write-up)"
    url: "/resources/experiment-leargas-memory-map/"
    source: "FoxxeLabs"
  - title: "Experiment Léargas: Holographic Memory"
    url: "/resources/experiment-leargas-holographic-memory/"
    source: "FoxxeLabs"
  - title: "Web Audio API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API"
    source: "MDN"
draft: false
---

## <span style="color:var(--accent)">Log entry</span>

The [full Léargas write-up](/resources/experiment-leargas-memory-map/) covers the topology, the Bayesian GMM fitting, the Ebbinghaus decay renderer, and the AuthorsOwn pipeline. This entry adds the one thing that was missing: **sound**.

The interactive map below is a standalone page. Hit **Sound** in the top bar before you play — the audio layer is where most of the new work lives.

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;border:1px solid var(--border);box-shadow:0 24px 48px rgba(0,0,0,.28);">
  <iframe src="/leargas/leargas-log.html" width="100%" height="660" style="border:none;background:#0b0f14;display:block;" title="Léargas — Research Log #0024 — Sound-enabled memory map"></iframe>
</div>

---

## <span style="color:var(--accent)">Sound design notes</span>

The sound engine runs entirely in the Web Audio API — no libraries, no CDN. Lazy-initialised on first user gesture to satisfy browser autoplay policy.

**Ambient drone** — two sine oscillators at 55 Hz and 56.2 Hz, producing a slow ~1.2 Hz beating. A low-pass filter at 200 Hz keeps it sub-rumble. Gain scales as `log₁₀(doc_count)` so June 2025 (2,952 documents) has real acoustic weight behind it, while sparse months barely register.

**Harmonic layer** — a triangle wave at 110 Hz fades in for periods exceeding 200 documents, adding harmonic texture to the densest months without overwhelming the drone.

**Empty period breath** — the 13 empty months aren't silent. A bandpass-filtered noise source centred at 80 Hz produces a hollow breath — the sound of forgetting, not the sound of absence.

**Transition whoosh** — filtered noise burst on every period change. Empty transitions use a highpass filter (airy, dissipating); populated transitions use bandpass (warmer, arriving).

**Blob pings** — each category has a distinct pitch:

| Category | Colour | Pitch |
|----------|--------|-------|
| Project / research | <span style="color:#1D9E75">■</span> green | F5 (698 Hz) |
| Engineering | <span style="color:#BA7517">■</span> amber | C5 (523 Hz) |
| Personal | <span style="color:#534AB7">■</span> violet | E♭5 (622 Hz) |
| General | <span style="color:#5F5E5A">■</span> grey | G4 (392 Hz) |

Blobs fire with 0–350 ms random stagger so dense periods like June 2025 (8 components) sound like a chord rather than a click burst.

The result is a piece of data sonification in which pitch encodes category and amplitude encodes cognitive depth. You can listen to the timeline advance without watching it and still hear the shape of the thinking.

---

## <span style="color:var(--accent)">What it shows</span>

The standout moments when you play it with sound on:

- **February 2023** — small, literary. Ad copy for novels. The writing mind.
- **The long silence** — July 2023 to October 2024. Fifteen hollow months. The drone barely registers.
- **March 2025** — a single quiet rupture: *Naturalising as an Irish Citizen*. One chord. Then silence again.
- **May → June 2025** — the arrival. Django, classifiers, Docker. June at 2,952 documents arrives as a full chord of eight blobs staggered across half a second, the low tones of the dominant conversations sitting under the brighter clicks of the smaller ones.
- **December 2025** — the SLAM bridge trainer dominates completely. One loud note, sustained for a month.
- **January 2026** — 10,000 documents. The Mnemos ingestion. A wall of sound.

*Léargas Research Log #0024 · 20 March 2026 · Hardware: Daisy (RTX 5060 Ti 16GB)*
