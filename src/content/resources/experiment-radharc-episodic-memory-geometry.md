---
title: "Experiment Radharc: First Look at Episodic Memory Geometry"
description: "What does an AI model's internal representation of your personal memory actually look like? We ran 484 documents through two frozen models and mapped the geometry. Here's what we found."
publishDate: 2026-03-17
category: "Research"
tags: ["Legion", "Aislinge", "Mnemos", "continual-learning", "latent-space"]
readingTime: "8 min read"
furtherReading:
  - title: "Language Models Need Sleep (OpenReview ICLR 2026)"
    url: "https://openreview.net/forum?id=iiZy6xyVVE"
    source: "OpenReview"
  - title: "Self-Adapting Language Models (SEAL)"
    url: "https://arxiv.org/abs/2506.10943"
    source: "arXiv"
  - title: "Continual Learning for Generative AI"
    url: "https://arxiv.org/abs/2506.13045"
    source: "arXiv"
draft: false
---

## <span style="color:#1F4E79">Background</span>

[Mnemos](https://mnemos.foxxelabs.ie) is our personal RAG system — a deployed episodic memory store currently holding 33,440 documents: ChatGPT and Claude conversation history, research documents, SFT training data, and Anseo community content. In the architecture we are building, it is the hippocampus.

The larger system is **<span style="color:#C55A11">Aislinge</span>** (Irish: *prophetic dream*), a dream consolidation runtime for language models. Current LLMs are frozen at deployment: they experience the world but learn nothing from it. Aislinge is the offline consolidation process that turns experience into genuine learning — the equivalent of sleep.

Before building the consolidation engine, we needed to understand the geometry we are working with. What does Mnemos actually look like from inside a language model? Where does it cluster? Where is it unstable? Where does meaning bleed unexpectedly across source types?

That is what **<span style="color:#C55A11">Experiment Radharc</span>** set out to answer. *Radharc* (Irish: *a view, a first look*) — the survey before the build.

---

## <span style="color:#1F4E79">Method</span>

We sampled 484 documents from Mnemos, stratified across five source types: `chatgpt`, `claude`, `doc` (research documents and the Legion PRD), `sft` (structured fine-tuning data: instruction-format documents, email tasks, book extracts), and `anseo` (community platform content). Documents were fetched via the Mnemos `/api/sample` endpoint — no local database required on the inference machine.

Each document was passed through two frozen base models at 4-bit NF4 quantisation:

- **<span style="color:#595959">Mistral 7B Instruct v0.3</span>** — broad web corpus training, strong factual recall
- **<span style="color:#595959">Phi-3.5-mini Instruct</span>** (3.8B) — synthetic/curated data, strong reasoning per parameter

Hidden states were extracted from middle and final transformer layers, mean-pooled over non-padding tokens, and averaged across both layers to produce a single vector per document (4096-dimensional for Mistral, 3072-dimensional for Phi). UMAP projection to 2D gave us the geometry maps. Pairwise cosine similarity gave us the adjacency structure.

All code is open source at [todd427/radharc](https://github.com/todd427/radharc).

---

## <span style="color:#1F4E79">Visualisations</span>

The UMAP plots below show the same 484 documents as seen by each model. Each dot is one document, coloured by source type. Position reflects the model's internal representation of semantic similarity — closer means the model considers the documents more alike.

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;">
  <iframe src="/radharc/radharc_umap.html" width="100%" height="500" style="border:none;background:#000;" title="Experiment Radharc — Latent Space UMAP"></iframe>
</div>

The divergence chart below shows the 40 documents where Mistral and Phi-3.5-mini disagree most about representation — the most geometrically unstable region of Mnemos.

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;">
  <iframe src="/radharc/radharc_divergence.html" width="100%" height="600" style="border:none;background:#000;" title="Experiment Radharc — Geometry Divergence"></iframe>
</div>

---

## <span style="color:#1F4E79">What We Found</span>

### <span style="color:#2E75B6">The two models see the same memory very differently</span>

Mistral organises Mnemos by **source provenance**. ChatGPT and Claude conversation history forms a dense central cluster; SFT data is completely isolated; research documents form their own satellite. The geometry is segregated — the model treats source type as a primary signal of meaning.

Phi-3.5-mini organises by **semantic content**. Sources bleed into each other. Research documents scatter into proximity with conversation fragments that discuss the same topics. The geometry is more integrated, less categorical.

Neither is wrong. They are different models of what similarity means, shaped by different training regimes. That difference is the experiment result.

### <span style="color:#2E75B6">Your AI conversation history is semantically unified</span>

The highest-consensus adjacencies — pairs both models agree are geometrically close — are almost entirely `claude ↔ chatgpt` pairs, with similarity scores around 0.93. Both models treat ChatGPT and Claude conversation histories as essentially interchangeable. The two streams have merged into one semantic space.

The implication: from the model's perspective, the source platform is invisible. What matters is content and conversational register. When Aislinge consolidates this material, it will consolidate across platforms without needing to distinguish them.

### <span style="color:#2E75B6">SFT data is the most geometrically unstable</span>

Divergence by source type (mean divergence between Mistral and Phi representations):

| <span style="color:#595959">Source</span> | <span style="color:#595959">Mean divergence</span> |
|----------|----------------|
| sft      | 0.957          |
| anseo    | 0.665          |
| doc      | 0.649          |
| chatgpt  | 0.586          |
| claude   | 0.547          |

SFT data has nearly double the divergence of Claude conversation history. The reason is structural: the `sft` category is a mixed bag — instruction-format documents, email reformatting tasks, and book extracts all live under the same label. Mistral reads this as a unified instruction-following register; Phi, trained on more curated reasoning data, reads the same material as three distinct content types. The models are both right, and their disagreement exposes a real fault line in how this data was ingested.

### <span style="color:#2E75B6">Mistral sees a connection Phi misses entirely</span>

One model-specific adjacency stands out: Mistral connects a student post asking *"Does anyone have notes from last week's Data Structures lecture?"* with a hardware wishlist fragment. Phi does not see this connection at all.

What Mistral is recognising: *community resource request* — an abstract pattern above the surface content of both documents. This kind of cross-domain pattern recognition — present in one model's geometry, invisible in another's — is precisely what the Aislinge dream pass should surface and bridge. The connection is real but latent. It takes two models to find it.

---

## <span style="color:#1F4E79">What This Means for Aislinge</span>

Radharc was a cartography exercise. Three things the map tells us about what to build:

**<span style="color:#C55A11">Focus consolidation on SFT first.</span>** The most geometrically unstable region is where the dream pass will have the highest leverage. Unresolved meaning is the best candidate for consolidation work.

**<span style="color:#C55A11">Use model disagreement as the salience signal.</span>** The differences between Mistral and Phi are not noise — they are the signal. High divergence means high uncertainty means high consolidation value. Aislinge should run at minimum two models and use their disagreement to prioritise what gets consolidated, rather than relying on any single model's geometry.

**<span style="color:#C55A11">Target the cross-domain adjacencies for generative replay.</span>** The connections both models agree on despite source-type differences — research documents adjacent to conversation fragments, Anseo roadmap entries adjacent to Claude planning sessions — are the natural bridges. Aislinge's generative replay phase should explicitly generate synthetic material that bridges these pairs. That is where novel insight is most likely to emerge.

---

## <span style="color:#1F4E79">Foxxe Take</span>

The field is moving. There are papers called "Language Models Need Sleep" being submitted to ICLR 2026. Letta is building continual learning in token space. The direction is clear and the competition is real.

What most of this work lacks is a developmental framing. The papers treat continual learning as an engineering problem — how do we prevent catastrophic forgetting? We are treating it as a growth process — how do we build a system that *becomes* something through experience?

That framing difference has design consequences at every level. It is why we started with geometry mapping rather than immediately building a consolidation pipeline. Radharc is the precondition for building Aislinge responsibly. You do not reshape a landscape you have not first learned to read.

The next experiment is Aislinge Phase 1: a salience-weighted consolidation pass over the SFT cluster, targeting the high-divergence documents identified here.

<span style="color:#C55A11">The dream map is drawn.</span>

---

*Experiment Radharc — 17 March 2026. 484 documents, stratified sample from Mnemos (33,440 total). Models: Mistral 7B Instruct v0.3, Phi-3.5-mini Instruct. Hardware: RTX 5060 Ti 16GB (Daisy). Code: [todd427/radharc](https://github.com/todd427/radharc).*
