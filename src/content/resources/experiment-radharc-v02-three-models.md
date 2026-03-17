---
title: "Experiment Radharc v0.2: Three Models, 2,000 Documents"
description: "We scaled the geometry mapping experiment to 2,000 documents and three models. The results changed in ways we didn't expect — and pointed directly at what Aislinge needs to do first."
publishDate: 2026-03-17
category: "Research"
tags: ["Legion", "Aislinge", "Mnemos", "continual-learning", "latent-space", "Qwen", "geometry"]
readingTime: "7 min read"
furtherReading:
  - title: "Experiment Radharc v0.1 — First Look at Episodic Memory Geometry"
    url: "/resources/experiment-radharc-episodic-memory-geometry/"
    source: "FoxxeLabs"
  - title: "todd427/radharc — open source code"
    url: "https://github.com/todd427/radharc"
    source: "GitHub"
  - title: "Qwen2.5-7B-Instruct"
    url: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct"
    source: "HuggingFace"
draft: false
---

## What Changed

[Radharc v0.1](/resources/experiment-radharc-episodic-memory-geometry/) mapped 484 documents through two models. It was a sketch — enough to establish that the geometry was interesting, that SFT data was the most unstable region, and that model disagreement was a useful salience signal.

v0.2 scales both dimensions: 2,000 documents (from 33,440 in Mnemos) and three models. The third model — Qwen2.5-7B-Instruct — was chosen specifically because its bilingual Chinese/English training produces a fundamentally different semantic geometry from both Mistral and Phi.

The results changed in ways we didn't expect.

---

## Method

**Documents:** 2,000, stratified across five source types with shortfall redistribution to ensure the target count is always met:

| Source   | Count |
|----------|-------|
| chatgpt  | 521   |
| claude   | 521   |
| sft      | 520   |
| anseo    | 354   |
| doc      | 84    |

The `doc` count is low because that's genuinely all the research documents in Mnemos — the allocation correctly fills the shortfall from other sources.

**Models** at 4-bit NF4 quantisation:

- **Mistral 7B Instruct v0.3** — broad web corpus
- **Phi-3.5-mini Instruct** (3.8B) — synthetic/curated reasoning data
- **Qwen2.5-7B-Instruct** — bilingual Chinese/English, distinct training lineage

**Hardware:** RTX 5060 Ti 16GB (Daisy), Ubuntu native. Total runtime: ~9 minutes across all three models.

Hidden states extracted from middle and final layers, mean-pooled, UMAP-projected. Divergence computed as mean pairwise distance across all three model pairs, normalised to [0,1].

All code at [todd427/radharc](https://github.com/todd427/radharc).

---

## The Geometry

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;">
  <iframe src="/radharc/radharc_umap_2k.html" width="100%" height="600" style="border:none;background:#000;" title="Experiment Radharc v0.2 — Latent Space UMAP (3 models)"></iframe>
</div>

<div style="width:100%;border-radius:8px;overflow:hidden;margin:2rem 0;">
  <iframe src="/radharc/radharc_divergence_2k.html" width="100%" height="600" style="border:none;background:#000;" title="Experiment Radharc v0.2 — Geometry Divergence (3 models)"></iframe>
</div>

---

## What We Found

### Qwen is the orthogonal voice

The pairwise divergence breakdown tells the most important story:

| Model pair               | Mean divergence |
|--------------------------|----------------|
| Mistral vs Phi-3.5-mini  | 0.395          |
| Phi-3.5-mini vs Qwen     | 0.400          |
| **Mistral vs Qwen**      | **0.616**      |

Mistral and Phi see Mnemos similarly. Qwen sees it very differently. This asymmetry is the reason Qwen was worth adding — it provides genuine geometric independence, not just a third opinion that happens to agree with the first two. The three-model divergence signal is substantially driven by where Qwen disagrees with the other pair.

### The dominant adjacency shifted

In v0.1, the highest-consensus cross-domain pairs were `claude ↔ chatgpt` — the AI conversation histories merging into one semantic space. With 2,000 documents, the picture settled differently. The dominant consensus pattern is now `claude ↔ anseo`, with similarity scores above 0.97.

This is not surprising in retrospect. The Anseo platform was built in Claude. The development conversations and the platform content they produced are semantically entangled — all three models agree that Claude-assisted development planning and the resulting Anseo community posts belong in the same neighbourhood.

The implication for Aislinge: the claude↔anseo bridge is the most stable cross-domain connection in the entire memory store. It is the natural first target for generative replay — synthesising material that makes the connection explicit rather than leaving it latent.

### The models have distinct cognitive styles

Each model uniquely sees connections the others miss. Three examples:

**Phi-3.5-mini** connects the FoxxeLabs "independent research company" description (a `doc` source) with Anseo community content. It recognises brand identity across categorically different source types — something neither Mistral nor Qwen picks up.

**Mistral** connects WSL drive-mounting questions across separate ChatGPT and Claude conversations. It abstracts at the *developer problem-solving* level, treating the technical register as the primary signal above platform origin.

**Qwen** connects "All hail Todd!" (a Claude greeting exchange) with Anseo's first post and multilingual feature discussions. It picks up on something like *community genesis and persona* — the moment a project acquires an identity.

These aren't noise. They are three different readings of the same material, each surfacing something real that the others don't see.

### Recipes are the most unstable content

The top-divergence documents in v0.2 are all recipes stored in the `anseo` source — Coconut Panna Cotta, Chicken Dijon, Tuna Casserole, Garlic Beef. Divergence scores around 0.83, well above the mean for any source type.

This is a data quality signal as much as a geometry signal. Recipes are structurally anomalous in the `anseo` source — they share none of the community discussion, roadmap, or feature-request structure of the surrounding content. All three models disagree about where they belong because, categorically, they don't belong. They are a misclassification waiting to be corrected.

### SFT remains the most systematically unstable

By source type, mean divergence across the 2,000-document run:

| Source   | Mean divergence | Max  |
|----------|----------------|------|
| sft      | 0.659          | 0.734 |
| anseo    | 0.545          | 0.838 |
| doc      | 0.404          | 0.754 |
| chatgpt  | 0.368          | 0.790 |
| claude   | 0.343          | 0.768 |

SFT has the highest *mean* divergence — systematic instability across the whole category, not just outliers. The `anseo` source has higher *peak* divergence (the recipes) but lower mean. SFT instability is structural: the category contains instruction-format documents, email reformatting tasks, and book extracts under the same label. The models read these as fundamentally different kinds of content, and they are right.

---

## What This Tells Aislinge

Radharc v0.2 gives Aislinge three concrete targets in priority order:

**1. SFT consolidation first.** Highest systematic instability, most leverage for the consolidation pass. The dream should begin here.

**2. Recipe reclassification.** The recipes are the peak-divergence outliers. Before consolidating, they should be moved to a more appropriate source category. This is a data hygiene operation, not a model operation — but Radharc identified it, which is the point.

**3. Claude↔anseo generative replay.** The most stable cross-domain bridge in the memory store. Aislinge's generative replay phase should explicitly target this connection — synthesising material that articulates what planning conversations and the platform they produced have in common.

---

## What's Next

**Aislinge Phase 1** begins immediately. The geometry map is drawn. The targets are identified. The consolidation runtime needs to be built.

Aislinge (*Irish: prophetic dream*) will take the Radharc cache as input, cluster the high-divergence SFT documents by cosine similarity, and run an abstraction pass to produce consolidated memory statements. No ingestion back into Mnemos yet — Phase 1 is about proving the consolidation loop produces coherent, novel output before we trust it with the memory store.

The code will be open source at `todd427/aislinge` when it's ready.

---

*Experiment Radharc v0.2 — 17 March 2026. 2,000 documents, stratified sample from Mnemos (33,440 total). Models: Mistral 7B Instruct v0.3, Phi-3.5-mini Instruct, Qwen2.5-7B-Instruct. Hardware: RTX 5060 Ti 16GB (Daisy). Runtime: ~9 minutes. Code: [todd427/radharc](https://github.com/todd427/radharc).*
