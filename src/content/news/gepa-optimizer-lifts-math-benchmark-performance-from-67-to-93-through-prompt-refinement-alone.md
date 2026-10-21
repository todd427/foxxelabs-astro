---
title: "GEPA Optimizer Lifts MATH Benchmark Performance from 67% to 93% Through Prompt Refinement Alone"
description: "New DSPy evolutionary optimizer achieves dramatic accuracy gains without fine-tuning, signaling major shift in prompt engineering efficiency."
publishDate: 2026-10-14
category: "Research"
tags: ["prompt-engineering", "DSPy", "GEPA", "language-models"]
source: "Autocomplete AI / Substack"
sourceUrl: "https://acdigest.substack.com/p/prompt-engineering-summer-2026-what"
significance: "high"
entities: ["GEPA", "DSPy", "MATH benchmark", "Wharton Generative AI Labs", "o3-mini", "o4-mini", "Gemini Flash 2.5", "Shopify", "Anthropic", "Claude Opus 4.8"]
irishEuAngle: false
updates:
  - { date: 2026-10-21, note: "GEPA, an ICLR 2026 paper, reports lifting a chain-of-thought program on the MATH benchmark from a 67% baseline to 93% through instruction refinement alone, with no few-shot examples and no fine-tuning", sourceUrl: "https://acdigest.substack.com/p/prompt-engineering-summer-2026-what" }
draft: false
updatedDate: 2026-10-21
---

## GEPA Achieves Dramatic Benchmark Gains Through Instruction Refinement

GEPA, an evolutionary prompt optimizer in the DSPy ecosystem, has lifted a chain-of-thought program on the MATH benchmark from a 67 percent baseline to 93 percent through instruction refinement alone, with no few-shot examples and no fine-tuning. The optimizer was presented as an ICLR 2026 paper.

In a real-world deployment, Shopify moved a single GPT-5 prompt to a small open model optimized with GEPA and reported a solution roughly 75 times cheaper and twice as reliable.

## Chain-of-Thought Performance Varies Significantly Across Models

According to a Wharton Generative AI Labs report, forcing explicit chain-of-thought on reasoning models shows inconsistent results across different architectures. On o3-mini, the approach moved accuracy by 2.9 percent. On o4-mini, accuracy improved by 3.1 percent. However, on Gemini Flash 2.5, forcing explicit chain-of-thought reduced accuracy by 3.3 percent.

The same technique adds 20 to 80 percent to response time across reasoning models, per the Wharton report.

## Anthropic Shifts Claude Opus 4.8 to Adaptive Thinking Only

On Claude Opus 4.8, the fixed budget_tokens approach for thinking has been removed; adaptive thinking is now the only thinking-on mode.

---
**Source:** [Autocomplete AI / Substack](https://acdigest.substack.com/p/prompt-engineering-summer-2026-what)