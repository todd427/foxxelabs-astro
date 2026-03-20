---
title: "Experiment Léargas: A Holographic Map of Memory"
description: "What if your memory system wasn't a database? We replaced records with a probability distribution over semantic space — a Gaussian Mixture Model that deforms when you think, consolidates while you sleep, and makes connections you didn't program. Here's what we built and what we found."
publishDate: 2026-03-20
category: "Research"
tags: ["Legion", "Aislinge", "Mnemos", "Léargas", "continual-learning", "latent-space", "information-theory"]
readingTime: "10 min read"
furtherReading:
  - title: "Continuous attractors for dynamic memories (eLife)"
    url: "https://elifesciences.org/articles/69499"
    source: "eLife"
  - title: "Back to the Continuous Attractor (NeurIPS 2024)"
    url: "https://openreview.net/forum?id=fvG6ZHrH0B"
    source: "OpenReview"
  - title: "Spreading Activation in an Attractor Network with Latching Dynamics"
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3490422/"
    source: "PMC"
  - title: "Information Geometry (Wikipedia)"
    url: "https://en.wikipedia.org/wiki/Information_geometry"
    source: "Wikipedia"
draft: false
---

## <span style="color:#1F4E79">The problem with databases</span>

[Mnemos](https://mnemos.foxxelabs.ie) is our episodic memory system — 33,440 documents covering years of conversation, research, code, and thought. In [Experiment Radharc](/resources/experiment-radharc-episodic-memory-geometry), we mapped its geometry: how two frozen language models see the same 484 documents, where they agree, where they diverge, and what that divergence reveals about the shape of knowledge.

Radharc was cartography. The map we drew was useful — but it exposed a deeper problem with how we were thinking about memory.

A database stores discrete records in fixed slots. Query in, records out. Document 4,231 has no intrinsic relationship to document 4,232. It doesn't decay. It doesn't consolidate. It doesn't have a shape. It doesn't move. Every document is equally weighted regardless of age, access frequency, or informational surprise.

This is not how memory works.

The question we wanted to ask — *what were you thinking about in February?* — isn't answerable by a database. It would tell you which documents were dated in February. It can't tell you what the dominant attractors were. What was fading. What was being consolidated. What connections were forming in the background.

**<span style="color:#C55A11">Léargas</span>** (*Irish: insight, perception, understanding*) is our answer to that question. Not a database. Not even a retrieval system. A probability distribution over semantic space that lives, decays, consolidates, and reorganises during sleep.

---

## <span style="color:#1F4E79">The substrate: a probability distribution</span>

Instead of storing documents, Léargas stores a **Gaussian Mixture Model** over the embedding space — a set of components, each with:

- `centroid` — mean vector in 384-dimensional semantic space
- `covariance` — the shape of the cluster (tight = precise concept, diffuse = multidisciplinary)
- `weight` — how much mass this component holds, subject to Ebbinghaus decay
- `decay_rate` — the forgetting curve parameter

That's the memory. Documents are evidence that shaped it. After absorption they can be discarded — they've been integrated, the same way experience shapes neural connectivity without storing raw sensory data verbatim.

The topology change *is* the memory. When a new embedding lands near an existing component, that component shifts slightly toward it. When an embedding lands equidistant between multiple components — high entropy, no clear attractor — that's a REM target. The field deforms because attention was paid.

### <span style="color:#2E75B6">Three theoretical pillars</span>

**Shannon entropy as an ingest signal.** Every new document is weighted by its KL divergence against the existing corpus — its informational surprise. High surprise means high initial component weight, new territory, priority for consolidation. Low surprise means the document is reinforcing something you already know: it raises cluster stability rather than creating new structure.

*High entropy = new ideas, unexplored territory. Decreasing entropy = consolidation, familiar ground.* Shannon himself noted that this maps to how scientific fields evolve — the entropy of a journal's vocabulary over time shows whether a field is fragmenting (rising entropy) or consolidating (falling).

**Wiener negative feedback as homeostatic regulator.** Wiener identified the failure mode of memory systems in 1948: *"Certain forms of insanity are caused by circulating memories which have got out of hand — memory impulses go round and round, refusing to be suppressed, until the brain can think of nothing else."* His solution was negative feedback — a mechanism that prevents any attractor from accumulating disproportionate mass.

In Léargas, this falls out of weight normalisation. The sum of all component weights must equal 1. One component gaining mass means others lose it. Homeostasis is structural, not a module bolted on.

**Information geometry for distant connections.** The natural metric on memory space is not Euclidean distance between embedding vectors — it's the Fisher-Rao metric, the geodesic on the statistical manifold. This matters enormously for distant connections.

In flat Euclidean space, *yellow* and *doctor* are far apart. On the information manifold, the geodesic `yellow → colour → fruit → citrus → sour → lemon → taste → health → medicine → doctor` is a valid curved path. Each hop is a short step along the manifold surface. The path *is* the connection — spreading activation flowing along curved semantic space, not a lookup in an index.

---

## <span style="color:#1F4E79">Method</span>

We sampled 1,998 documents from Mnemos — stratified across source types — and embedded them using `all-MiniLM-L6-v2` running on an RTX 5060 Ti (Daisy). The embeddings are 384-dimensional, normalised.

We fit a Bayesian Gaussian Mixture Model (`sklearn.mixture.BayesianGaussianMixture`, 50 components, Dirichlet process prior, `weight_concentration_prior=1e-3`) on the CPU — this is a one-time cost of 2.3 seconds at this scale.

We then absorbed 6 new documents via **online EM** — a fully vectorised update pass running entirely on CUDA that completes in 0.03 seconds. For each new embedding: compute responsibilities against all 50 components simultaneously, update component means and covariances via weighted running average, renormalise weights (Wiener feedback falls out here automatically).

The **component labelling** step assigns each component a human-readable label: we compute responsibilities of all 1,998 seed documents against all components on GPU, then assign each component the unique document with the highest responsibility toward it. Unique assignment ensures high-weight components get first pick; lower-weight components find their next-best document.

All code is open source at [todd427/leargas](https://github.com/todd427/leargas).

---

## <span style="color:#1F4E79">The manifold</span>

The interactive map below shows the top 20 components from the 1,998-document run, positioned by estimated semantic proximity. Bubble size reflects component weight. Hover to read each component's label and the document that best represents it.

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;border:0.5px solid rgba(255,255,255,0.08);">
  <iframe src="/leargas/component_map.html" width="100%" height="520" style="border:none;background:#0d0d0f;" title="Léargas — Cognitive Manifold Explorer"></iframe>
</div>

What you're looking at is a map of the dominant attractors in 33,440 documents of accumulated thought. Not topics assigned by a classifier — attractors that emerged from the geometry of the data.

A few things worth noting:

**Component 23** (largest, teal) — *Legion somatic unity* — the PRD content has its own high-weight cluster. Two years of Legion architecture thinking has consolidated into a stable attractor.

**Component 33** (purple) — *The underlying tension of feeling overwhelmed by the complexity of managing a growing interconnected project*. This is a psychological cluster, not a project cluster. It has significant mass because this pattern appears repeatedly across years of conversation history, in many different contexts, always recognisably the same emotional signature.

**Component 14** (purple, smaller) — *Fear of inadequacy and the need for validation*. Same category. Neither of these were engineered in — they emerged from the geometry of actual experience.

**Component 30** (teal, lower left) — *Bus Éireann ticket options*. This surfaces as the nearest attractor to the query "parking frustration Letterkenny" — not because parking and buses are generically related, but because this manifold is built from *this* person's history, which includes TFI Live App UX/HCI work. The connection between Irish commuter frustration and ATU parking problems exists in this manifold because it exists in this person's thinking. Someone else's Léargas would draw a different map.

That last point is the whole thesis. This is not generic semantic space. It is a personal manifold — shaped by years of specific work, specific conversations, specific preoccupations. The yellow→lemon connection only works in your manifold if you have lemons.

---

## <span style="color:#1F4E79">What absorption looks like</span>

Absorbing 6 new documents into a 1,998-document manifold:

| | |
|---|---|
| **KL divergence (seed → absorbed)** | 0.377 |
| **Component that gained most mass** | [33] *Overwhelm — growing project complexity* (+0.026) |
| **Components that lost mass** | [19] Anseo bugs, [4] file/chunks work, [8] Anseo roadmap |
| **High-entropy embeddings (REM targets)** | 0 — all 6 landed cleanly in existing attractors |

The 6 new documents reinforced an existing attractor rather than creating new structure. This is the healthy case: the manifold recognised familiar territory and deepened that groove. The Wiener renormalisation then reduced the relative weight of less-activated components, creating the small losses in the bug report, file-work, and roadmap clusters.

KL divergence of 0.377 means the manifold changed measurably but not dramatically. As the corpus grows toward 33,440 documents and the manifold matures, we expect this to drop toward 0.01–0.05 for a typical daily ingest. The system becomes more stable as it fills in. New material causes smaller disturbances unless it is genuinely novel.

---

## <span style="color:#1F4E79">Sleep: the Aislinge integration</span>

The most important architectural decision: **Aislinge is not a tool that runs on the manifold — Aislinge *is* the sleep process.**

When a new embedding lands in a high-entropy region — equidistant between existing attractors, no clear home — it becomes a REM target. During the nightly consolidation pass, Aislinge generates a bridging statement for each high-entropy embedding: a sentence that connects the two nearest attractors. That sentence is embedded. The embedding becomes a perturbation vector that nudges the nearby components toward a new equilibrium.

The generated text is discarded. Only the deformation persists.

This is biologically precise. REM sleep doesn't store the dream — it uses the dream to reorganise the structural relationships between existing memories. The content is transient. The topology change is permanent.

The sleep cycle on Daisy runs as:

1. **Slow-wave pass** — absorb queued embeddings via online EM (structural consolidation)
2. **REM pass** — Aislinge processes high-entropy embeddings, applies perturbation vectors
3. **Multiple REM cycles** — effort allocated proportionally to entropy; stable regions untouched
4. **Decay pass** — Ebbinghaus curves applied to component weights
5. **Serialise → push** — updated manifold state pushed to Fly.io, which hot-swaps in-memory state

During waking hours, the manifold on Fly.io is read-only. Ingest goes into a queue. The system is in hippocampal encoding mode. Sleep is when consolidation happens.

---

## <span style="color:#1F4E79">Deployment</span>

The manifold state — GMM parameters, snapshot history — is a few hundred MB of numpy arrays at most. It lives on a Fly.io persistent volume alongside the serving API. Probing the density field is fast matrix operations: sub-100ms at this scale.

The expensive work (nightly consolidation, REM pass, embedding new documents at scale) runs on Daisy, which has an RTX 5060 Ti with 16GB VRAM. Daisy pushes the updated manifold to Tigris (Fly's S3-compatible object store) after each consolidation. Fly pulls and hot-swaps. No downtime.

Rose doesn't touch this. Rose melts.

---

## <span style="color:#1F4E79">What comes next</span>

The proof of concept demonstrates the core loop: ingest, absorb, label, diff, probe. The manifold is real, it's personal, and it's already making connections that are correct even when they're surprising.

Three things to build next:

**<span style="color:#C55A11">Scale to the full corpus.</span>** 1,998 documents is a sample. 33,440 documents will produce a denser manifold with more stable attractors and more precise probe results. The ATU parking survey will have its own attractor. Specific book passages in Killing ELLAY will cluster distinctly. The psychological clusters will have more resolution.

**<span style="color:#C55A11">CLIP photo embedding.</span>** Photographs taken on walks get embedded via CLIP into the same vector space as text — they become nodes on the manifold with `spatial_anchor: {lat, lng, timestamp}`. The walk becomes embodied fieldwork: what you notice while moving through physical space reveals what the manifold is reaching toward. This is also Legion's sensory architecture, prototyped in human form.

**<span style="color:#C55A11">The Fly API service.</span>** Five query modes: `probe(seed, hops)` for spreading activation from a concept; `reconstruct(fragment)` for holographic recovery from partial input; `diff(t1, t2)` for comparing two snapshots; `frontier()` for highest-entropy clusters; `decay_alerts()` for what's fading. These become MCP tools accessible from Claude.ai — the manifold becomes part of the session context, not just a document retrieval layer.

---

## <span style="color:#1F4E79">Foxxe Take</span>

The field is building memory systems. MemGPT, Letta, various RAG+knowledge-graph hybrids. They're all solving the right problem with the wrong substrate. The pattern is: add more metadata, more graph edges, better indexing. More elaborate ways of querying a database.

Léargas starts from a different premise. The memory is not the records — the memory is the shape that the records carved into the space. After absorption, the document can be discarded. What remains is the deformation it caused.

This has a consequence that none of the database approaches can replicate: the manifold has a *history*. Not a log of what was stored, but a geometric record of how the space has been shaped over time. Snapshot diffs are genuine information-geometric measurements of cognitive distance. *What changed between January and March?* is a real question with a real answer: KL divergence between two GMM states.

And because the manifold is personal — built from one person's specific corpus, shaped by their specific patterns of thought — it makes connections that generic semantic space cannot. The Bus Éireann → ATU parking connection is not in any shared knowledge graph. It's in this manifold because it's in this person's thinking. The fear of inadequacy cluster is not labelled by a taxonomy. It emerged from the data.

That's what we mean by insight.

*Experiment Léargas — 20 March 2026. 1,998 documents, stratified sample from Mnemos (33,440 total). Model: all-MiniLM-L6-v2 (sentence-transformers). GMM: sklearn BayesianGaussianMixture, 50 components. Hardware: RTX 5060 Ti 16GB (Daisy). Code: [todd427/leargas](https://github.com/todd427/leargas).*
