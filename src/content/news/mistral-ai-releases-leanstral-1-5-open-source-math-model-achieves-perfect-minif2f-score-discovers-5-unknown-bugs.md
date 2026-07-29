---
title: "Mistral AI Releases Leanstral 1.5: Open-Source Math Model Achieves Perfect miniF2F Score, Discovers 5 Unknown Bugs"
description: "Leanstral 1.5, a 6B-parameter mixture-of-experts model, saturates miniF2F at 100%, solves 587 PutnamBench problems, and uncovered critical bugs in open-source code."
publishDate: 2026-07-15
category: "Research"
tags: ["formal-verification", "open-source-ai", "mathematical-reasoning", "bug-discovery"]
source: "Mistral AI"
sourceUrl: "https://mistral.ai/news/leanstral-1-5/"
significance: "high"
entities: ["Mistral AI", "Leanstral 1.5", "miniF2F", "PutnamBench", "Apache-2.0", "Hugging Face"]
irishEuAngle: false
updates: []
draft: false
---

## Breakthrough Performance on Mathematical Benchmarks

Mistral AI has released Leanstral 1.5, an open-source formal verification model that achieves perfect saturation on the miniF2F benchmark, reaching 100% on both validation and test sets. The model solves 587 out of 672 PutnamBench problems and achieves state-of-the-art results of 87% on FATE-H and 34% on FATE-X algebra benchmarks.

The model is built as a mixture-of-experts architecture with 119 billion total parameters and 6 billion active parameters, offering a 256,000-token context window.

## Cost-Effective Formal Proof Generation

Leanstral 1.5 demonstrates dramatic cost efficiency in generating formal proofs. Each PutnamBench solution costs roughly $4 with Leanstral 1.5, compared to approximately $300 or more for Seed-Prover 1.5 and $54-68 for Aleph Prover.

The model shows strong test-time scaling on PutnamBench, improving from 44 problems solved at 50k tokens to 244 at 200k, 493 at 1M, and 587 at 4M tokens.

## Superior Performance Over Competing Models

On FLTEval, Leanstral 1.5 improves pass@1 from 21.9% to 28.9% and pass@8 from 31.9% to 43.2% compared to the original Leanstral. The model surpasses Anthropic's Claude Opus 4.6's FLTEval pass@8 score of 39.6 at one-seventh the cost.

## Real-World Bug Discovery

In practical testing across 57 open-source repositories, Leanstral 1.5 uncovered 5 previously unknown bugs. One notable discovery was a sign-function overflow on input Std.U64.MAX in the datrs/varinteger Rust library that caused crashes in debug mode and silent data corruption in release mode.

The model also proved O(log n) time complexity for AVL tree insertion and deletion across 2.7 million tokens and 22 compaction cycles.

## Availability and Training

Leanstral 1.5 is released under the Apache-2.0 license as a free model. The model was trained through mid-training, supervised fine-tuning, and reinforcement learning with CISPO. Weights are available on Hugging Face and as a free API endpoint.

---
**Source:** [Mistral AI](https://mistral.ai/news/leanstral-1-5/)