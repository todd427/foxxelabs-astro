---
title: "New Algorithms RESGA and SAEGA Enable Precise LLM Persona Alignment While Preserving Sparse Internal Structure"
description: "Researchers propose gradient ascent algorithms that optimize prompts to align LLMs with specific personas while maintaining the model's internal sparse topology."
publishDate: 2026-08-21
category: "Research"
tags: ["LLM alignment", "prompt optimization", "sparse autoencoders", "persona steering"]
source: "arXiv (cs.LG)"
sourceUrl: "https://arxiv.org/pdf/2601.02896"
significance: "high"
entities: ["RESGA", "SAEGA", "IIT (ISM) Dhanbad", "National University of Singapore", "Llama 3.1 8B Instruct", "Qwen 2.5 7B Instruct", "Gemma 3 4B Instruct"]
irishEuAngle: false
updates: []
draft: false
---

## Dual Algorithm Approach to Prompt Optimization

Researchers at IIT (ISM) Dhanbad and the National University of Singapore have proposed two algorithms—RESGA (RESidual Gradient Ascent) and SAEGA (Sparse Autoencoder Gradient Ascent)—that optimize randomly initialized prompts to achieve better alignment with an identified persona direction in LLMs. The paper was revised on 22 April 2026 (arXiv:2601.02896v2).

## Maintaining Sparse Model Topology

A critical distinction between the approaches emerges in how they handle the model's internal sparse feature activation. When a dense steering vector is injected, the number of active Sparse Autoencoder (SAE) features explodes beyond 150, compared to the baseline model's approximately 50 active features per token.

SAEGA, by contrast, maintains active SAE feature sparsity of 50–60 features per token, comparable to the baseline model, demonstrating it respects the model's internal sparse topology.

## Experimental Validation Across Model Families

Experiments were conducted on three model families: Llama 3.1 8B Instruct, Qwen 2.5 7B Instruct, and Gemma 3 4B Instruct.

## Measuring Perfect Neutralization

An error rate of 50% on the sycophancy benchmark corresponds to perfect neutralization, indicating the model neither systematically agrees nor disagrees with the user.

---
**Source:** [arXiv (cs.LG)](https://arxiv.org/pdf/2601.02896)