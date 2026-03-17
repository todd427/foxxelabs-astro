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

## Background

[Mnemos](https://mnemos.foxxelabs.ie) is our personal RAG system — a deployed episodic memory store currently holding 33,440 documents: ChatGPT and Claude conversation history, research documents, SFT training data, emails, and Anseo community content. It is, in the terminology we are developing, the hippocampus of a larger system we are building.

The larger system is **Aislinge** (Irish: *prophetic dream*), a dream consolidation runtime for language models. The core idea: current LLMs are frozen at deployment. They experience the world but learn nothing from it. Aislinge is our attempt to build the offline consolidation process that turns experience into genuine learning — the equivalent of sleep.

Before building the consolidation engine, we needed to understand the geometry we are working with. What does Mnemos actually look like from the inside of a language model? Where does it cluster? Where is it unstable? Where does meaning bleed unexpectedly across categories?

That is what **Experiment Radharc** set out to answer.

*Radharc* (Irish: *a view, a first look, a prospect*) — the survey before the build.

---

## Method

We sampled 484 documents from Mnemos, stratified across five source types: `chatgpt`, `claude`, `doc` (research documents and the Legion PRD), `sft` (structured fine-tuning data), and `anseo` (community platform content). Documents were fetched via the Mnemos `/api/sample` endpoint — no local database required on the inference machine.

Each document was passed through two frozen base models at 4-bit NF4 quantisation:

- **Mistral 7B Instruct v0.3** — broad web corpus, strong factual recall
- **Phi-3.5-mini Instruct** (3.8B) — synthetic/curated data, strong reasoning per parameter

Hidden states were extracted from middle and final transformer layers, mean-pooled over non-padding tokens, and averaged across both layers to produce a single 4096-dimensional (Mistral) or 3072-dimensional (Phi) vector per document.

UMAP projection to 2D gave us the geometry maps. Pairwise cosine similarity gave us the adjacency structure. We then compared the two models' representations to find consensus adjacencies (both agree), model-specific adjacencies (only one sees), and geometry divergence (where the models most disagree on what a document *is*).

All code is open source at [todd427/radharc](https://github.com/todd427/radharc).

---

## What We Found

### The two models see the same memory very differently

Mistral organises Mnemos by **source provenance**. ChatGPT and Claude conversation history forms a dense central cluster. SFT data is completely isolated. Research documents form their own satellite. The geometry is segregated — the model reads source type as a primary signal.

Phi-3.5-mini organises by **semantic content**. Sources bleed into each other. Research documents scatter into proximity with conversation fragments that discuss the same topics. The geometry is more integrated, less categorical.

Neither is correct. They are different models of what similarity means, shaped by different training regimes. That difference *is* the experiment result.

### Your AI conversation history is semantically unified

The highest-consensus adjacencies — pairs both models agree are geometrically close — are almost entirely `claude ↔ chatgpt` pairs, with similarity scores around 0.93. Both models treat your ChatGPT and Claude conversation histories as essentially interchangeable. The two streams have merged into a single semantic space.

This has an interesting implication: from the model's perspective, the *source* of the conversation is invisible. What matters is the content and the conversational register. If Aislinge consolidates this material, it will consolidate across platforms without needing to distinguish them.

### SFT data is the most geometrically unstable

Divergence by source type (mean divergence between Mistral and Phi representations):

| Source   | Mean divergence |
|----------|----------------|
| sft      | 0.957          |
| anseo    | 0.665          |
| doc      | 0.649          |
| chatgpt  | 0.586          |
| claude   | 0.547          |

SFT (structured fine-tuning data: instruction-format documents, email reformatting tasks, book extracts) has nearly double the divergence of Claude conversation history. The two models fundamentally disagree about what SFT material *is*. Mistral reads it as instruction-following content; Phi reads it as something else entirely. This is the most unstable region of the latent space — and therefore where consolidation is most needed and most uncertain.

### Mistral sees a connection Phi doesn't

One of the more striking model-specific adjacencies: Mistral connects a student asking *"Does anyone have notes from last week's Data Structures lecture?"* with a hardware wishlist post. Phi does not see this connection at all.

What Mistral is likely recognising: *requesting information from a community*. Both documents share that pattern at a level of abstraction above their surface content. This kind of cross-domain pattern recognition — invisible to one model, salient to another — is exactly the kind of latent connection the Aislinge dream pass should surface and bridge.

---

## What This Means for Aislinge

Radharc was a cartography exercise. The map now exists. Three things it tells us about what to build next:

**1. Consolidation should focus on SFT first.** The most geometrically unstable region is where the dream pass will have the highest leverage. Documents that two models represent very differently are documents whose meaning is unresolved — the best candidates for consolidation work.

**2. The dream map is not one map, it is an ensemble.** The differences between Mistral and Phi are not noise — they are signal. Model disagreement is a salience indicator. High divergence = high uncertainty = high consolidation value. Aislinge should run at minimum two models and use their disagreement as its primary salience signal, rather than relying on any single model's geometry.

**3. Cross-domain adjacencies are the seeds of novel insight.** The connections both models agree on despite source-type differences — research documents adjacent to conversation fragments, Anseo roadmap entries adjacent to Claude planning sessions — these are the natural bridges. Aislinge's generative replay phase should explicitly target these connections, generating synthetic material that explicitly bridges the two sides.

---

## Foxxe Take

The field is moving. There are papers called "Language Models Need Sleep" being submitted to ICLR 2026. Letta is building continual learning in token space. The direction is clear.

What most of this work lacks is a developmental framing. The papers treat continual learning as an engineering problem to be solved — how do we prevent catastrophic forgetting? We are treating it as a growth process to be cultivated — how do we build a system that *becomes* something through experience?

That framing difference has design consequences at every level. It is why we are starting with geometry mapping rather than immediately building a consolidation pipeline. We want to understand the territory before we start changing it. Radharc is the precondition for building Aislinge responsibly.

The next experiment is Aislinge Phase 1: a salience-weighted consolidation pass over the SFT cluster, with generative replay targeting the high-divergence documents identified here. The dream map is now drawn.

---

*Experiment Radharc was conducted on 17 March 2026 using a 484-document stratified sample from Mnemos (33,440 documents total). Models: Mistral 7B Instruct v0.3, Phi-3.5-mini Instruct. Hardware: RTX 5060 Ti 16GB (Daisy). Code: [todd427/radharc](https://github.com/todd427/radharc).*
