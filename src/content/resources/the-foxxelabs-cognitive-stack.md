---
title: "The FoxxeLabs Cognitive Stack: Building a Computational Neuroscience of Personal Memory"
description: "We built a full cognitive architecture modelled on the human brain — from biometric homeostasis to embodied swarm intelligence — using Irish-language names, open-source tools, and a theory that memory is topology, not storage."
publishDate: 2026-03-28
category: "Research"
tags: ["Legion", "Léargas", "Mnemos", "Aislinge", "Colainn", "Mothú", "cognitive-architecture", "continual-learning"]
readingTime: "12 min read"
heroImage: "/images/resources/the-foxxelabs-cognitive-stack-hero.jpg"
heroImageAlt: "Gaussian mixture model probability field — the Léargas cognitive manifold visualised as overlapping luminous blobs across semantic space"
furtherReading:
  - title: "Experiment Léargas: A Holographic Map of Memory"
    url: "/resources/experiment-leargas-holographic-memory"
    source: "FoxxeLabs"
  - title: "Experiment Radharc: Episodic Memory Geometry"
    url: "/resources/experiment-radharc-episodic-memory-geometry"
    source: "FoxxeLabs"
  - title: "Experiment Aislinge: Dream Consolidation"
    url: "/resources/experiment-aislinge-dream-consolidation"
    source: "FoxxeLabs"
  - title: "Predictive Coding and the Free Energy Principle (Friston, 2010)"
    url: "https://www.nature.com/articles/nrn2787"
    source: "Nature Reviews Neuroscience"
  - title: "Complementary Learning Systems Theory (McClelland et al., 1995)"
    url: "https://pubmed.ncbi.nlm.nih.gov/7624455/"
    source: "Psychological Review"
  - title: "Research Ireland Frontiers for the Future Programme"
    url: "https://www.researchireland.ie/funding/frontiers/"
    source: "Research Ireland"
draft: false
---

## <span style="color:#1F4E79">The question we kept asking</span>

If you wanted to build a machine that *remembered* — not retrieved, not searched, not matched keywords — how would you do it?

Not *where did I put that document?* but *what was I preoccupied with in February, and how has that changed?* Not *find me things about Legion* but *what does Legion connect to in the dark, when the system is running quietly and nothing is querying it?*

The answer, we kept concluding, was that you would not build a database at all. You would build something that looked a great deal more like a brain.

Over the past two years, working from Dublin and ATU Galway, FoxxeLabs has assembled what we are calling the **cognitive stack** — a layered system of Irish-named AI components, each modelled on a distinct layer of human neuroscience, designed to function collectively as a computational analogue of personal memory and cognition.

This post maps the whole architecture for the first time: where each layer sits, what it does, what neuroscience it draws on, and where it connects to the others. We also look at what it means for Irish AI research — and why we think the timing matters.

---

## <span style="color:#1F4E79">The neurological model</span>

The stack is structured on a vertical axis from homeostatic sensing at the bottom to embodied action at the top, with memory consolidation in the middle. Each layer has a biological counterpart, deliberately chosen to constrain the engineering decisions:

| Layer | Component | Biological analogue | Primary function |
|---|---|---|---|
| Sensing | Lorg, Withings, George, Mothú | Peripheral nervous system | Data ingestion from world and body |
| Homeostasis | **Colainn** | Medulla oblongata | Biometric time-series, anomaly detection |
| Episodic encoding | **Mnemos** | Hippocampus | Document store, RAG retrieval |
| Semantic manifold | **Léargas** | Neocortex | GMM probability field over semantic space |
| Geometry | **Radharc** | Entorhinal cortex | Topology mapping, manifold navigation |
| Consolidation | **Aislinge** | Slow-wave / REM sleep | Nightly structural reorganisation |
| Embodied action | **Legion** | Motor cortex + body | Distributed swarm, agent-to-agent protocol |

The horizontal axis — the infrastructure running alongside this vertical pipeline — includes **Rialú** (key vault, command centre), **Sentinel** (threat monitoring), and **Faire** (desktop integration layer). These are not cognitive components; they are the environmental conditions the stack runs in.

---

## <span style="color:#1F4E79">The bottom of the stack: sensing the body</span>

The system begins with sensing — not document ingestion, but physical state.

**Lorg** (*Irish: track, trace*) is a mobile telemetry application that logs GPS traces, environmental data, and behavioural patterns in the field. It uses a lightweight on-device model and feeds structured data continuously.

**Withings BPM Core** measures blood pressure, heart rate, ECG, and stethoscope audio (valvular assessment) via a single device. ECG sessions, heart sounds, and raw biometric readings flow in through the Withings API.

**George** (*named for Curious George*) is a vision-language memory service running [moondream2](https://github.com/vikhyat/moondream) on local hardware. It watches incoming photograph and video streams, captions them, scores visual novelty against a rolling baseline, and ingests both the caption and the novelty score into the stack.

**Mothú** (*Irish: feeling, sensing, emotion*) is our emotional AI layer — a pipeline of VADER compound scoring, NRC EmoLex categorical emotion extraction (Plutchik's eight primary emotions), and a HuggingFace transformer producing Ekman six-emotion probability distributions across the personal conversation corpus in Mnemos. Mothú's primary signal is *affective distinctiveness* — deviation from personal emotional baseline — not raw sentiment score. A neutral high-effort document is not the same as a brief high-distress entry, even if their raw scores look similar.

All four sensing layers feed structured readings into a single time-series store.

---

## <span style="color:#1F4E79">The medulla: Colainn</span>

**Colainn** (*Irish: body, physical form*) is the biometric homeostatic layer — what we call the medulla of the stack.

The medulla oblongata is among the most ancient parts of the vertebrate brain. It runs the things that cannot be allowed to fail: heart rate, respiration, blood pressure regulation. It does not think. It maintains the conditions under which thinking can occur. It is the part of the brain whose job is to keep the whole system alive.

Colainn does the same thing for the cognitive stack. It ingests structured biometric readings from all four sensing layers, maintains rolling 30-day baselines per metric, detects Z-score anomalies (|z| > 1.5 = mild, > 2.0 = moderate, > 3.0 = severe), and every 15 minutes materialises a **homeostatic snapshot** — a single JSON object capturing the current physiological state of the system.

That snapshot is the integration point. When Mnemos ingests a document, it queries Colainn — *what was the physical state when this was written?* — and attaches the homeostatic snapshot to the document's metadata. Every memory in the hippocampus now carries a physiological tag: heart rate, blood pressure z-score, emotional valence, visual novelty, GPS context.

This is not a novel idea biologically. We know that memory consolidation is state-dependent — material learned under stress is recalled better in stress. Emotional arousal during encoding modulates consolidation strength. Sleep deprivation disrupts hippocampal long-term potentiation. The body's state at encoding time is not incidental noise; it is part of the memory. Colainn makes this computable.

The philosophical premise beneath all of this: **homeostasis may be load-bearing for something like awareness.** A system that tracks its own physiological deviation from baseline is, in some limited but real sense, *noticing itself*. Colainn is the part of the architecture that maintains the preconditions for attention.

---

## <span style="color:#1F4E79">The hippocampus: Mnemos</span>

**Mnemos** (*Greek: memory; also Irish, via the mnemonic tradition*) is the episodic memory store — the hippocampus of the stack.

57,664 documents as of March 2026: years of ChatGPT conversation history, Claude session histories, research notes, book drafts, emails, code, Git commit logs, location traces, photography captions, and Aislinge consolidation statements. Every document is embedded using `all-MiniLM-L6-v2`, stored in ChromaDB with full metadata, and queryable via a FastAPI server at [mnemos.foxxelabs.ie](https://mnemos.foxxelabs.ie) and via a FastMCP endpoint accessible from Claude.ai sessions.

Hippocampal encoding in biological systems has two key properties: *pattern separation* (similar experiences are stored distinctly, not merged) and *pattern completion* (partial cues trigger full recall). Mnemos implements both: ChromaDB's HNSW index provides approximate nearest-neighbour retrieval that degrades gracefully with partial queries, and the embedding space provides the geometric structure for pattern separation.

The hippocampus does not store memories permanently. It holds them in a fast, sparse representation that supports rapid encoding and retrieval. Over time — primarily during sleep — it transfers structural information to the neocortex, where it is integrated into slower, more stable semantic representations. This is the **Complementary Learning Systems** theory (McClelland, McNaughton & O'Reilly, 1995), and it is the theoretical spine of the stack.

Mnemos is the fast layer. It encodes fast, retrieves fast, and does not try to be the site of long-term semantic integration. That is Léargas's job.

---

## <span style="color:#1F4E79">The neocortex: Léargas</span>

**Léargas** (*Irish: insight, perception, understanding*) sits above Mnemos the way the neocortex sits above the hippocampus. It does not store documents. It stores the *shape* that documents carve into semantic space.

The technical implementation is a Bayesian Gaussian Mixture Model over the 384-dimensional sentence-transformer embedding space. Each component carries a centroid (mean vector), covariance (cluster shape), weight (accumulated mass), and decay rate (forgetting curve parameter). New documents are absorbed via online expectation-maximisation — a vectorised update pass on GPU that takes 0.03 seconds. Ebbinghaus decay curves reduce component weights over time, with deeper sleep consolidation cycles capable of temporarily reversing decay for repeatedly activated components.

The topology change *is* the memory. When you read about a new protein folding algorithm and your neocortex adjusts its representation of biology, you don't store the paper — you store the deformation it caused in your conceptual space. Léargas works the same way. After absorption, the source document can be discarded. What remains is the geometric trace it left.

Three theoretical pillars underlie this architecture:

**Shannon entropy as ingest signal.** Every new document is weighted by its KL divergence against the existing manifold — its informational surprise. High entropy means new territory: priority for REM consolidation. Low entropy means reinforcement of existing structure.

**Wiener negative feedback as homeostatic regulator.** Weight normalisation is automatic: one component gaining mass means others losing it. Wiener identified in 1948 that circulating memories that cannot be suppressed — his example was certain forms of psychosis — are a failure of negative feedback. This is structural in Léargas: no component can monopolise the manifold.

**Information geometry for distant connections.** The natural metric over the space of probability distributions is the Fisher-Rao metric — the geodesic on the statistical manifold. In flat Euclidean space, *bus timetable* and *ATU Galway parking* are unrelated. On a personal manifold built from years of Irish transport frustration, a short curved path connects them. This is spreading activation along manifold geometry, not a programmed rule.

Five query modes are implemented in the Léargas API: `probe(seed, hops)` for spreading activation, `reconstruct(fragment)` for holographic partial-cue recovery, `diff(t1, t2)` for snapshot comparison, `frontier()` for highest-entropy clusters (REM targets), and `decay_alerts()` for what is fading.

---

## <span style="color:#1F4E79">Geometry: Radharc</span>

**Radharc** (*Irish: view, sight, vision*) is the geometry layer — a set of UMAP projections, divergence measurements, and topology tools that map the manifold's structure and track how it evolves over time.

Where Léargas is the manifold, Radharc is the cartography of it. Snapshot diffs produce information-geometric measurements of how the shape of thought has changed between two points in time. KL divergence between GMM states is a real measurement: *what was the cognitive distance between January and March?* is a question Radharc can answer.

The biological analogue is the entorhinal cortex and the parahippocampal cortex — the structures that maintain spatial and contextual maps and feed them to the hippocampus. Navigation, pattern recognition, the sense of *where* something is in conceptual space: this is Radharc's territory.

---

## <span style="color:#1F4E79">Sleep: Aislinge</span>

**Aislinge** (*Irish: dream, vision, reverie*) is the consolidation process — the sleep cycle of the stack.

Biological sleep does two distinct things for memory: slow-wave sleep drives hippocampus-to-neocortex transfer (structural consolidation), and REM sleep drives the associative reorganisation that produces creative connection and emotional processing (integrative consolidation). The two phases are not redundant; they are complementary. Disrupting REM specifically disrupts emotional memory processing and creative insight. Disrupting slow-wave specifically disrupts factual consolidation.

Aislinge replicates both. The nightly pipeline on Daisy runs:

1. **Slow-wave pass** — absorb queued embeddings from Mnemos into the Léargas GMM via online EM (fast, structural)
2. **REM pass** — for each high-entropy embedding (Léargas `frontier()` results), use a small language model to generate a bridging statement connecting the two nearest attractors. Embed the bridging statement. Apply it as a perturbation vector to the nearby components.
3. **Ebbinghaus decay** — reduce component weights according to time-elapsed and activation frequency
4. **Serialise → push** — updated manifold serialised and pushed to cloud storage; hot-swapped into the serving API

The REM-generated text is discarded. Only the deformation persists. This is biologically faithful: we do not remember the content of dreams; we retain the reorganisation they enacted on existing memories. The computational cost of the full nightly pipeline, including the dual-model REM pass, is approximately €0.04 per night at current API pricing.

---

## <span style="color:#1F4E79">The body: Legion</span>

**Legion** is the embodied swarm — the action layer that sits above all the cognitive processing and reaches out into the world.

The current development target is the *peekaboo* milestone: a minimal demonstration that Legion agents can detect and respond to a stimulus with appropriate temporal behaviour — appearing, disappearing, and reappearing in ways that demonstrate object permanence and attention. The architecture uses an IRC-based agent-to-agent communication protocol, which allows heterogeneous agents (running on different hardware, in different languages) to coordinate without shared state.

Legion's connection to the cognitive stack is via Léargas's `probe()` endpoint: when an agent needs to act, it queries the manifold for the most activated nearby concepts and uses that context to shape its response. The goal is an embodied system whose behaviour is continuous with the cognitive history of the person who built it — not a general-purpose agent, but a personal one.

This is the endpoint of the whole architecture: sensing → homeostasis → encoding → semantic integration → consolidation → embodied action. The full loop.

---

## <span style="color:#1F4E79">The naming convention</span>

Everything is named in Irish. This is not decoration.

The Irish language is one of the oldest continuously used languages in Europe, with a sophisticated vocabulary for interior experience — emotion, perception, landscape, time — that does not always have clean English equivalents. *Léargas* (insight) is not quite the same as *understanding*; it carries a sense of seeing through something to its nature. *Aislinge* (dream-vision) is the literary form of revelatory dream, cognate with prophecy. *Colainn* (body, physical form) locates the sensing layer in the embodied rather than the digital.

The naming is also a position: this is Irish-built infrastructure, grounded in Irish intellectual tradition, designed to run on Irish compute. At a time when the global AI stack is being consolidated into a very small number of very large American companies, small sovereign stacks matter. The Irish language has survived because communities decided it mattered enough to maintain. We think the same principle applies to cognitive infrastructure.

---

## <span style="color:#1F4E79">Why this is different</span>

The AI memory field right now is building better databases. MemGPT, Letta, various RAG-plus-knowledge-graph hybrids are all solving the right problem with the wrong substrate. More metadata, more graph edges, better indexing, smarter retrieval. Sophisticated engineering on top of a fundamentally record-oriented model.

The FoxxeLabs cognitive stack starts from a different premise, derived from neuroscience rather than database architecture:

**Memory is not storage. Memory is topology.** The memory *is* the deformation that experience causes in semantic space. Documents are evidence that shaped the manifold. After absorption they can be discarded — the way sleep discards the raw sensory data of the day, retaining only the structural reorganisation it triggered.

**Homeostasis is load-bearing.** A system that tracks its own physiological state, correlates it with episodic content, and maintains baseline calibration is doing something qualitatively different from a system that ignores its own substrate. Colainn is the part of the architecture that keeps the whole stack alive, and in doing so, creates the preconditions for something like awareness.

**Affective distinctiveness is the primary salience signal.** Not cognitive effort. Not recency. Emotional deviation from personal baseline — what felt different, what felt like it mattered — is what gets consolidated. A high-effort emotionally neutral document should not outrank a brief high-distress entry. This is what the neuroscience of memory consolidation actually shows, and it is what the Mothú/Léargas integration implements.

**The manifold is personal.** It is built from one person's specific corpus, shaped by their specific patterns of thought and emotional history. It makes connections that generic semantic space cannot, because those connections exist in this person's cognitive history, not in any shared knowledge graph. The Bus Éireann → ATU parking connection is not in Wikipedia. It is in this manifold because it is in this person's thinking.

---

## <span style="color:#1F4E79">Foxxe Take</span>

We are building this because we think it is the right architecture, and because we think the questions it raises are genuinely important: What does it mean for a machine to *consolidate* rather than just *store*? What does emotional state at encoding time contribute to long-term memory stability? Can a personal semantic manifold, shaped by years of a specific person's experience, make qualitatively better predictions about what that person will find meaningful than a generic retrieval system?

We do not know the answers yet. That is the point. This is research in the original sense — following an architecture derived from theory and seeing what it produces when you run it on real data.

The stack is live. Mnemos holds 57,664 documents. Léargas is absorbing and consolidating. Aislinge runs nightly. Colainn is monitoring physiology. George is watching. Mothú is listening.

Legion is waking up.

If this architecture interests you — if you are working on cognitive AI systems, computational neuroscience, or the intersection of personal data and machine learning — we would like to hear from you. The code is at [github.com/todd427/leargas](https://github.com/todd427/leargas) and the other linked repositories. The interactive memory map is live at [foxxelabs.ie/leargas/memory_map_v2.html](https://foxxelabs.ie/leargas/memory_map_v2.html).

*FoxxeLabs Ltd, Dublin. March 2026. All components run on Irish compute. The research is independent, unfunded at present, and ongoing.*
