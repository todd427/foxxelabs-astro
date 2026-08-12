---
title: "Léargas v2: Memory Map, Book Growth, and the Combined View"
description: "Since the first Léargas experiment, the corpus grew from 33,440 to 56,006 documents, new data sources joined the manifold, and we built three interconnected visualisations — including one that shows a writing career and a cognitive history on the same animated canvas."
publishDate: 2026-03-23
category: "Research"
tags: ["Legion", "Aislinge", "Mnemos", "Léargas", "continual-learning", "latent-space", "information-theory", "writing"]
readingTime: "12 min read"
furtherReading:
  - title: "Experiment Léargas: A Holographic Map of Memory"
    url: "/resources/experiment-leargas-holographic-memory/"
    source: "FoxxeLabs"
  - title: "Experiment Léargas: Memory That Breathes"
    url: "/resources/experiment-leargas-memory-map/"
    source: "FoxxeLabs"
  - title: "Experiment Aislinge: Dream Consolidation for AI Memory"
    url: "/resources/experiment-aislinge-dream-consolidation/"
    source: "FoxxeLabs"
  - title: "UMAP: Uniform Manifold Approximation and Projection"
    url: "https://arxiv.org/abs/1802.03426"
    source: "arXiv"
draft: false
---

## <span style="color:#1F4E79">Three weeks later</span>

The [first Léargas experiment](/resources/experiment-leargas-holographic-memory/) ran on 1,998 documents sampled from a corpus of 33,440. It produced a working proof: a Gaussian Mixture Model over semantic embedding space, animated by time, showing the dominant attractors of accumulated thought — what the mind was occupied with, and what it was letting go.

Three weeks later, the corpus is at 56,006 documents.

The growth is not random. Between March 3 and March 22, three new data sources entered Mnemos that didn't exist before: git commit logs from 13 active repositories (757 commits), a Google Drive file hierarchy (230 files), and spreadsheet data covering book tracking, contracts, and word counts. These sources are structurally different from conversation history and research documents. A git commit is not a sentence. A file hierarchy is not an essay. They're traces of work — functional outputs with their own semantic register.

What happens to a cognitive manifold when you ingest the work alongside the thinking about the work?

That's the question driving this round of experiments. Three new visualisations, one combined view, and an architectural decision about the Aislinge REM system that came from an unexpected direction.

---

## <span style="color:#1F4E79">Memory Map v2: what changed</span>

The v1 memory map sampled 1,998 documents and fit 20 GMM components, coloured by rough category (project, engineering, personal, writing, general). It was a proof of concept.

**v2 targets 5,000 documents, 60 components, and source-type colour encoding.**

The shift from category to source is significant. In v1, a Claude conversation about Anseo architecture and a ChatGPT conversation about the same topic would both be coloured the same — they're both "engineering." In v2, they're distinct colours (purple vs blue), making platform provenance visible as a first-class dimension of the manifold. You can watch how the two streams interact — where they reinforce the same attractors from different angles, and where they diverge.

The new source palette:

| <span style="color:#595959">Source</span> | <span style="color:#595959">Colour</span> | <span style="color:#595959">Meaning</span> |
|---|---|---|
| chatgpt | <span style="color:#4A9EFF">■</span> blue | ChatGPT conversation history |
| claude | <span style="color:#A78BFA">■</span> purple | Claude conversation history |
| sft | <span style="color:#34D399">■</span> green | Structured training data |
| git | <span style="color:#F59E0B">■</span> amber | Git commit logs — 757 commits, 13 repos |
| gdrive_hierarchy | <span style="color:#FB923C">■</span> orange | Drive file tree — what exists |
| gdrive | <span style="color:#E879F9">■</span> pink | Spreadsheet data — word counts, contracts |
| anseo | <span style="color:#60A5FA">■</span> light blue | Anseo platform content |
| doc | <span style="color:#94A3B8">■</span> slate | Research documents |
| aislinge | <span style="color:#FDE68A">■</span> yellow | Bridging documents from REM pass |

The amber git layer is the most visually distinctive addition. 757 commits across 13 repos — anseo, leargas, mnemos, sceal, foxxelabs-astro, sentinel, lorg, aislinge, ga-say, foghlaim, radharc, duel, sionnach — each commit a short functional description of work done. These don't cluster the same way conversation history does. They pull toward the technical attractors but with a different density profile: shorter texts, higher information per token, no hedging or elaboration. The commit history is a skeleton of the work; the conversation history is the reasoning around it.

Together they create a more honest picture of how attention was actually distributed.

The second change is layout. v1 used a D3 force simulation to position blobs — useful for separation and collision avoidance, but the position of a blob had no semantic meaning. v2 uses **UMAP** to project the 384-dimensional GMM centroids into 2D before the force simulation takes over for visual separation. Semantic proximity is now structural. Blobs that are close on screen are close in meaning-space. Blobs that are far apart are genuinely conceptually distant. The map has a geography.

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;border:0.5px solid rgba(255,255,255,0.08);">
  <iframe src="https://leargas.foxxelabs.ie/memory_map_v2.html" width="100%" height="520" style="border:none;background:#0d0d0f;" title="Léargas — Memory Map v2"></iframe>
</div>

What the expanded corpus reveals: the psychological attractors that emerged in v1 — *overwhelm at growing project complexity*, *fear of inadequacy and the need for validation* — are still there, and they have more mass. The git commit layer has created a new cluster of amber attractors in the engineering region that has no equivalent in conversation history alone: a cluster best described as *debugging production deployments under time pressure*. It's the commit messages. They don't describe reasoning — they describe outcomes. The manifold now contains both.

---

## <span style="color:#1F4E79">Book Growth: 70 novels on a timeline</span>

The second visualisation was always planned but kept getting deferred. It answers a different question: not *what were you thinking about* but *what were you making*.

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;border:0.5px solid rgba(255,255,255,0.08);">
  <iframe src="https://leargas.foxxelabs.ie/book_growth.html" width="100%" height="520" style="border:none;background:#0a0a0c;" title="Léargas — Book Growth"></iframe>
</div>

Each blob is a book. Size is word count — radius grows logarithmically as the count climbs toward publication length. Colour is publication stage: blue for drafting, amber for cover design, red for KDP/print preparation, green for published. Two columns: Todd McCaffrey titles on the left, Talla Hill titles on the right.

The scrubber is a timeline from the earliest tracked word-count entry to today. Play it through and watch seventy-plus manuscripts emerge, grow, and reach publication. The force simulation means blobs push each other around as they arrive — a kind of spatial narrative of a writing career.

A few things this makes visible that weren't before:

**The Talla Hill cluster is denser and faster-cycling.** The pen name represents a different production pace — shorter manuscripts, faster turnaround from draft to publication. The two columns don't just separate pen names; they reveal two different working rhythms coexisting.

**There are long fallow periods.** Years where manuscripts stop growing. They're visible as the blobs hovering at a fixed size while the date advances. The timeline is honest about when work stopped.

**The word counts are not uniform.** Some books hit 120,000 words. Some plateau at 60,000. The range is visible in the relative sizes — the large amber and green blobs on the left represent the longer-form McCaffrey work.

The data for this comes from Mnemos `/api/aggregate/books` — a bespoke endpoint that aggregates writing tracker entries from the Google Drive spreadsheet data ingested in March. Getting clean data required filtering aggressively: biography files, pricing sheets, and CV documents had leaked into the same spreadsheet range, and one aggregate row had a word count of 20,261,782 that needed removing before the visualisation was usable.

---

## <span style="color:#1F4E79">The Combined Map: thinking and making on the same canvas</span>

The third visualisation emerged from a question that only became obvious after building the first two separately: *these two things are the same timeline.*

The memory map shows what a mind was occupied with, month by month. The book growth shows what that mind was producing, month by month. They share a time axis. They're both traceable to the same person. What happens if you render them together?

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;border:0.5px solid rgba(255,255,255,0.08);">
  <iframe src="https://leargas.foxxelabs.ie/combined_map.html" width="100%" height="560" style="border:none;background:#0a0a0c;" title="Léargas — Combined Map"></iframe>
</div>

The design rule: **two visually distinct blob types on the same canvas.** Memory blobs (GMM components) are solid filled circles with glow, coloured by source type. Book blobs are rings — no fill, dashed stroke, coloured by publication stage. At a glance you can tell which is which. When you hover, the tooltip identifies the type and gives the appropriate metadata.

They share a D3 force simulation, which means they push each other around naturally. Watch a book manuscript growing in word count — its blob expanding — while the memory blobs nearby shift to accommodate it. The two systems interact physically in the visualisation the same way they interact cognitively: what you're writing about shapes what you're thinking about, and vice versa.

The audio has two distinct timbres to match. Memory blobs emit a triangle oscillator pop when they appear — the same sound as v1, frequency mapped to component weight. Book blobs emit a lower sine wave tone (180–280 Hz, decay 0.3s) — softer, more resonant. When a busy month arrives with both new memory attractors and a new manuscript entering the pipeline, you hear both. The soundscape encodes the activity density.

What the combined view reveals that neither chart alone could show: **the correlation between cognitive and creative output is not what you'd expect.** The months with the densest memory blob activity are not always the months with the highest word-count growth. Sometimes the mind is churning heavily while production slows. Sometimes production accelerates when the memory map shows consolidation rather than expansion — the entropy dropping as familiar territory is reinforced, and a manuscript moving fast in parallel. The relationship is complex. The visualisation makes it observable.

---

## <span style="color:#1F4E79">Aislinge REM: the Duel insight</span>

Building the Léargas visualisation suite in parallel with another tool called **[Duel](/resources/duel-two-claudes-walk-into-a-problem/)** — a dual-pane Claude interface — produced an unexpected architectural insight about the Aislinge REM system.

Duel places two independent Claude instances (α Alpha, β Beta) side by side, each with their own system prompt, both fed the same input. The original motivation was simple: get two independent critical reads on the same document. In practice, something more interesting happens. The two instances diverge. They notice different things, weight different aspects, produce substantially different outputs from the same input — not because one is right and the other wrong, but because they're reasoning independently from different angles.

This is structurally identical to REM sleep.

In the Léargas architecture, REM handles high-entropy embeddings — documents that land equidistant between existing attractors with no clear home. The planned approach was a single LLM generating a bridging statement for each. But a single model will generate a plausible-sounding bridge without necessarily finding the most genuine connection. It fills the gap rather than resolving it.

Running two models independently on the same high-entropy seed — one acting as Associator (finding what the document connects to in existing manifold territory), one acting as Integrator (proposing how those connections should modify the topology) — and then taking the *disagreement* between them as the signal: this is more honest than single-model bridging. Where the two models agree, the connection is robust. Where they disagree, the entropy is real and should not be artificially resolved.

**The Aislinge Phase 8 spec now calls for a Duel-style dual-LLM pass:**

```
For each high-entropy embedding e:
  α (Associator):  "What does this connect to? Which existing attractors are nearest?"
  β (Integrator):  "How should these connections modify the manifold topology?"

  → Agreement   → apply perturbation vector, low dampening
  → Disagreement → flag as unresolved frontier, higher weight in next REM cycle
```

The generated text is still discarded. The perturbation vector is still the only thing that persists. But the quality of the perturbation is better because two independent reasoners had to agree on it before it was applied.

The cost is approximately $1.20/month on Sonnet 4.6 for both roles at current ingest rates. The nightly sleep cycle on Daisy runs in under two minutes.

---

## <span style="color:#1F4E79">The Fly API</span>

All three visualisations are static — Python generates the HTML, the HTML runs client-side with D3. They're snapshots. The Léargas Fly API will make the manifold queryable in real time from Claude sessions.

Five endpoints are specified:

- `probe(seed, hops)` — spreading activation from a concept along the Fisher-Rao geodesic
- `reconstruct(fragment)` — holographic recovery from partial input
- `diff(t1, t2)` — KL divergence between two GMM snapshots, cognitive distance over time
- `frontier()` — highest-entropy clusters, the primary input to Aislinge
- `decay_alerts()` — what's fading below weight threshold

These become MCP tools accessible from Claude.ai. The manifold stops being a visualisation and becomes part of the reasoning context — a persistent, queryable model of what this mind has been thinking about, what it's resolved, and what remains frontier territory.

That's the architecture: Mnemos as hippocampus (episodic store), Léargas as neocortex (semantic field), Aislinge as sleep (consolidation process), Fly API as the thalamus — the relay layer between memory systems and active reasoning.

---

## <span style="color:#1F4E79">What comes next</span>

**<span style="color:#C55A11">Full corpus run.</span>** 5,000 documents is a stratified sample. 56,006 documents is the real thing. The full-corpus run will produce a significantly denser manifold — more stable attractors, more precise probe results, the long-tail of accumulated thought made visible. This requires a longer embedding pass on Daisy but otherwise the same pipeline.

**<span style="color:#C55A11">CLIP photo embedding.</span>** Photographs from walks, embedded via CLIP into the same 384-dimensional space as text, with `spatial_anchor: {lat, lng, timestamp}`. The walk becomes embodied fieldwork — what you notice while moving through physical space reveals what the manifold is reaching toward. This is also Legion's sensory architecture, prototyped without hardware first.

**<span style="color:#C55A11">Lorg integration.</span>** The worldline tracker already records GPS, steps, and biometrics. When Léargas has a daily rhythm — absorb during the day, consolidate at night — the Lorg data becomes contextual: which manifold attractors were active on which walks, in which weather, at which heart rate. The 4D worldline gains a fifth dimension: cognitive state.

---

## <span style="color:#1F4E79">Foxxe Take</span>

The thing that keeps becoming clearer: the most interesting data is not the data you set out to collect.

The git commits were an afterthought — of course commit logs should be in the memory system, they're the most precise record of what was actually built. But once they're in, the manifold changes in ways that weren't predicted. An amber layer of functional, outcome-focused text appears that has no equivalent in the conversational record. The skeleton of the work was always there; the memory system just wasn't looking at it.

The combined visualisation was an afterthought too — the memory map and book growth were separate tools for separate questions. But when you put them on the same canvas, the relationship between thinking and making becomes observable, and it's more complex than intuition suggested.

Aislinge REM getting a dual-LLM pass came from building a completely different tool for a completely different reason. The architecture insight arrived sideways.

This is what a personal manifold should do. Not retrieve what you asked for — surface what you didn't know to ask for, because it sees the shape of the space, not just the contents.

The shape has more resolution now than it did three weeks ago. It will have more still in three weeks' time.

*Experiment Léargas v2 — 23 March 2026. v2 targets 5,000 documents, stratified sample from Mnemos (56,006 total). Model: all-MiniLM-L6-v2 (sentence-transformers). GMM: sklearn BayesianGaussianMixture, 60 components. Layout: UMAP 2D projection of GMM centroids. Hardware: RTX 5060 Ti 16GB (Daisy). Code: [todd427/leargas](https://github.com/todd427/leargas).*
