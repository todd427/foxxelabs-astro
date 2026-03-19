---
title: "Experiment Aislinge: Dream Consolidation for AI Memory"
description: "We built a consolidation layer that runs on top of Mnemos and Radharc to synthesise cross-domain memory bridges — the equivalent of what sleep does to human episodic memory. Here's what we found."
publishDate: 2026-03-19
category: "Research"
tags: ["Legion", "Aislinge", "Mnemos", "Radharc", "continual-learning", "RAG", "memory", "consolidation"]
readingTime: "9 min read"
furtherReading:
  - title: "Experiment Radharc v0.2 — Three Models, 2,000 Documents"
    url: "/resources/experiment-radharc-v02-three-models/"
    source: "FoxxeLabs"
  - title: "Experiment Radharc v0.1 — First Look at Episodic Memory Geometry"
    url: "/resources/experiment-radharc-episodic-memory-geometry/"
    source: "FoxxeLabs"
  - title: "todd427/aislinge — open source code"
    url: "https://github.com/todd427/aislinge"
    source: "GitHub"
  - title: "todd427/mnemos — personal RAG system"
    url: "https://github.com/todd427/mnemos"
    source: "GitHub"
draft: false
---

## The Problem

Current AI systems are frozen at deployment. They can accumulate context within a conversation, but between sessions — nothing. Each new conversation starts from the same base weights, with no memory of what came before unless you explicitly feed it back in.

Mnemos was our answer to the retrieval problem: a personal RAG system that stores conversation history, research notes, and project documents, making them searchable across sessions. Radharc was the geometry layer: using frozen language models to map the latent space of the Mnemos collection and find which documents are genuinely adjacent in meaning, regardless of source.

But retrieval isn't consolidation.

A library full of episodic records — raw conversations, half-finished thoughts, the same idea expressed ten times in ten sessions — is useful. A consolidated abstraction layer, built from those records, is more useful. Not a search engine over the past, but a compressed representation of what the past actually means.

That is what sleep does. The hippocampus replays episodic memories during slow-wave sleep, strengthening the connections between them and gradually abstracting repeated patterns into cortical long-term memory. The specifics fade. The insight survives.

Aislinge (*Old Irish: prophetic dream*) is our attempt to build the offline equivalent for AI memory.

---

## The Stack

Aislinge sits in the developmental AI stack between Radharc and Legion:

```
Mnemos (episodic store)
  └── Radharc (geometry mapping)
        └── Aislinge (dream consolidation)
              └── Legion (embodied system)
```

It does not query Mnemos directly and does not retrain any model. It takes the geometry cache that Radharc produces — documents, vectors, UMAP coordinates, and cross-domain similarity pairs — and runs an abstraction pass to produce consolidated memory statements. Those statements are ingested back into Mnemos as a new source layer, distinct from the raw episodic content.

All code at [todd427/aislinge](https://github.com/todd427/aislinge).

---

## Phase 1 — SFT Consolidation

[Radharc v0.2](/resources/experiment-radharc-v02-three-models/) identified SFT as the highest-divergence source category in Mnemos — mean pairwise divergence 0.659 across three models, versus 0.343 for Claude conversations. The SFT layer contains instruction-format documents, email reformatting tasks, and book passage transformations under the same label. Three different models read these as fundamentally different kinds of content, and they are right.

High divergence = high consolidation leverage. We started there.

**Method:** Top 200 SFT documents by mean divergence, clustered into 12 groups via agglomerative clustering (Ward linkage) on normalised UMAP coordinates. Each cluster passed through Phi-3.5-mini Instruct at 4-bit quantisation with a prompt asking it to name the underlying cognitive skill or insight connecting the documents.

**Results:** All 12 clusters produced coherent, non-trivial consolidated statements. A sample:

| Cluster | Type | Consolidated statement |
|---------|------|----------------------|
| 8 | Instruction | *"Attention to detail and critical reading for understanding nuanced communication"* |
| 3 | Instruction | *"Structured information extraction from unstructured communication"* |
| 11 | Content | *"Iterative strategic planning and adaptation in response to challenges"* |
| 7 | Content | *"Discreet, calculated actions with focus on timing and patience"* |
| 2 | NLP task | *"Linguistic modernisation while preserving narrative fidelity"* |
| 5 | NLP task | *"Narrative compression and accurate event sequencing"* |

None of these are obvious paraphrases of document content. They are abstractions — statements about what a *class* of material develops or represents, not descriptions of any individual document. The consolidation loop works.

---

## Phase 2 — Cross-Domain Bridge Generation

Radharc v0.2 had identified the claude↔anseo pair as the most geometrically stable cross-domain connection in the memory store — all three models consistently placing Claude development conversations and Anseo community posts in adjacent neighbourhoods, with similarity scores above 0.97.

This is not a coincidence. The Anseo platform was built through Claude. The development conversations and the platform content they produced are semantically entangled. The question was: can Aislinge name what connects them?

**Method:** Load all adjacency CSVs from a targeted Radharc run (4,842 Claude chunks + 359 Anseo chunks, two models). Deduplicate cross-domain pairs, averaging similarity scores across models. For each pair, generate a bridge statement using one of two prompt modes:

- **Conceptual mode** (default): *"In one sentence, name the insight or conviction that this person is working through."*
- **Emotional mode** (`--emotional`): *"Look past the surface content. What feeling, fear, preoccupation, or unresolved tension runs through both? Describe what they are carrying."*

**Key finding:** The top adjacency pairs are not different ideas that happen to be similar. They are the *same* idea appearing in two registers — once in a private exploration, once in a public expression. The bridge names the insight that moved from private thought to public post.

The highest-scoring pair (similarity 0.9959, agreed by both phi4mini and qwen3b): a Claude conversation about building an Irish language learning module with voice synthesis, adjacent to the corresponding Anseo roadmap entry. The bridge:

> *"The individual is developing a comprehensive Irish language learning module that incorporates voice synthesis, with a focus on user engagement and privacy."*

Not novel — but now retrievable. The implicit connection between the conversation that produced the plan and the plan that resulted from it is made explicit and stored.

---

## Phase 3 — Ingestion and the New Layer

Validated bridges are ingested back into Mnemos as source `aislinge`, with two distinct tags:

- `bridge_conceptual` — what the person thinks
- `bridge_emotional` — what the person carries

IDs are mode-namespaced so the same document pair can have both a conceptual and an emotional bridge without collision.

After all runs through 19 March 2026:

| Run | Corpus | Bridges generated | Ingested |
|-----|--------|------------------|---------|
| Phase 2 v0.1 | 500 claude + 359 anseo | 30 | 30 |
| Phase 2 v0.2 | 4,842 claude + 359 anseo | 37 | 37 (7 duplicate) |
| Phase 5 | 2,500 chatgpt + 2,500 claude + 359 anseo | ~80 | ~80 |

Total aislinge layer: approximately 150 bridges, stored as a consolidated memory layer distinct from the 33,750 raw episodic chunks.

---

## Phase 4 — Evaluation

Does the aislinge layer actually improve retrieval? We built an evaluation harness (`evaluate.py`) that runs test queries twice — once against raw episodic memory only (the `personal` filter: Claude + ChatGPT), and once against the full collection including aislinge bridges (the `all` filter). The difference tells us what the consolidation layer adds.

**Evaluation suite: 23 queries across three categories**

| Category | Purpose |
|----------|---------|
| Semantic (12) | Conceptual queries — tests dense retrieval and consolidated bridge quality |
| FTS (7) | Proper noun queries — tests the hybrid FTS5+dense retrieval layer |
| Emotional (4) | Affective register — tests the emotional bridge layer |

**Results (19 March 2026, 33,750 documents, ~150 bridges):**

| Category | Aislinge surfaced | Notes |
|----------|------------------|-------|
| Semantic | 4/12 | ai_crash rank 1 (0.97), cyberpsychology rank 1 (1.0), anseo rank 1 |
| FTS | 1/7 | Legion FoxxeLabs page at 0.934 via FTS5 — confirms hybrid layer working |
| Emotional | 1/4 | emo_building_alone rank 3 — first confirmed emotional bridge in evaluation |

The cyberpsychology result is worth pausing on. Without the aislinge layer, the top result for *"personality traits cyber-aggression trust disinhibition"* is a ChatGPT dissertation proposal excerpt at a cosine similarity of 0.508. With the aislinge layer, the top result is a consolidated bridge at 1.0 — a perfect retrieval score:

> *"The individual is exploring how AI-related factors such as trust, disinhibition, and familiarity, in conjunction with personality traits, influence the propensity for cyber-aggression."*

That single sentence, synthesised from a Claude↔Anseo bridge, outperforms the raw source document that generated it.

---

## The Emotional Layer

The most unexpected result came from the emotional evaluation category. The query *"building alone exhausted financial pressure no one understands"* surfaced an aislinge bridge at rank 3:

> *"The underlying tension of feeling overwhelmed by the complexity of managing a growing project, despite visible progress."*

Tag: `bridge_emotional`. Consolidated from a pair with similarity 0.9953.

This matters for a reason that goes beyond retrieval quality. The conceptual layer captures what a person thinks — their positions, plans, beliefs. The emotional layer captures what they carry — the preoccupations that don't get resolved just by being named, the things returned to at 2am without quite knowing why.

A knowledge system that only holds propositions doesn't fully represent a person. The emotional signature — the recurring affective patterns across years of conversation — is what makes the difference between a reference document and something that actually knows you.

For the AfterWords/toddBot project, this distinction is foundational. A digital legacy that only preserves intellectual positions isn't the person. The emotional layer is how you get closer.

---

## What the Numbers Don't Show

The current evaluation suite measures whether aislinge bridges appear in retrieval results. It doesn't measure whether they are *more useful* than the raw sources they consolidate.

The cyberpsychology bridge at 1.0 retrieves faster and more precisely than the chatgpt conversation that produced the idea. But is it a better answer? In some cases yes — the bridge is a clear, direct statement of the position. In others, the original conversation contains nuance, context, and counter-argument that the bridge compresses away.

This is exactly the tradeoff sleep consolidation makes in human memory. The insight survives; the conversation doesn't. Whether that's the right tradeoff depends on what you need the memory for.

The evaluation harness will continue to evolve alongside the bridge corpus. Phase 6 will run Aislinge on the aislinge layer itself — second-order consolidation, producing the 15–20 highest-level abstractions from the ~150 bridges. Those are the recurring themes: the belief layer.

---

## What's Next

**Phase 6 — Second-order consolidation.** Run Aislinge on the `aislinge` source itself. At sufficient bridge volume, the consolidation pass will begin to identify which themes recur across multiple bridges — producing not just individual insights but the meta-patterns that connect them. Target: ~200 bridges before this run.

**Phase 7 — Legion integration.** Initialise the Legion swarm with the Phase 6 consolidated belief layer as a prior world model. The swarm doesn't start blank. It starts with inherited convictions — a genetic endowment from the memory of the system that built it. That's where the consciousness question stops being philosophical and becomes an engineering problem.

**Phase 7b — AfterWords integration.** Feed the belief layer and emotional bridge corpus into toddBot as a personality prior. The emotional bridges are the affective signature. That's what makes a legacy avatar more than a reference document.

---

*Experiment Aislinge — Phases 1–5 complete, 19 March 2026. Corpus: Mnemos 33,750 documents (chatgpt 15,552, sft 12,820, claude 4,842+, anseo 359+). Consolidation models: Phi-3.5-mini Instruct, Qwen2.5-3B-Instruct at 4-bit NF4. Hardware: RTX 5060 Ti 16GB (Daisy), Ubuntu native. Code: [todd427/aislinge](https://github.com/todd427/aislinge).*
