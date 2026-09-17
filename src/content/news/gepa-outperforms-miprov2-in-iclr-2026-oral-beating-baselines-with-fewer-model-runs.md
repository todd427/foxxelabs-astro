---
title: "GEPA Outperforms MIPROv2 in ICLR 2026 Oral, Beating Baselines with Fewer Model Runs"
description: "New prompt optimization method GEPA reviewed execution traces to improve instructions, outperforming established baselines significantly."
publishDate: 2026-09-13
category: "Research"
tags: ["prompt-engineering", "GEPA", "ICLR 2026", "DSPy"]
source: "The Techy Side"
sourceUrl: "https://www.thetechyside.com.au/posts/a-practical-guide-to-prompt-engineering-in-september-2026"
significance: "high"
entities: ["GEPA", "ICLR 2026", "DSPy", "MIPROv2", "Anthropic", "OpenAI", "Wharton", "USC"]
irishEuAngle: false
updates:
  - { date: 2026-09-17, note: "Anthropic published 'The new rules of context engineering for Claude 5 generation models' on 24 July 2026.", sourceUrl: "https://www.thetechyside.com.au/posts/a-practical-guide-to-prompt-engineering-in-september-2026" }
  - { date: 2026-09-17, note: "Several non-reasoning models made new mistakes on easy questions after being told to reason step by step.", sourceUrl: "https://www.thetechyside.com.au/posts/a-practical-guide-to-prompt-engineering-in-september-2026" }
  - { date: 2026-09-17, note: "GEPA, an ICLR 2026 oral paper, improves prompts by reviewing execution traces and proposing new instructions, reporting better results than MIPROv2 and a reinforcement-learning baseline with far fewer", sourceUrl: "https://www.thetechyside.com.au/posts/a-practical-guide-to-prompt-engineering-in-september-2026" }
draft: false
updatedDate: 2026-09-17
---

## GEPA Advances Prompt Optimization at ICLR 2026

GEPA, an oral paper at ICLR 2026, improves prompts by reviewing execution traces and proposing new instructions. GEPA's authors reported better results than MIPROv2 and a reinforcement-learning baseline with far fewer model runs. The method can start with as few as ten examples and is available through DSPy or as a standalone library.

## Industry Findings Challenge Common Prompting Wisdom

Recent research has questioned the effectiveness of widespread prompting techniques. Wharton's second Prompting Science report found that adding 'think step by step' produced small gains on some reasoning models, worse results on another, and response times 20% to 80% longer.

Wharton's Prompting Science Report 4 (Basil, Shapiro, Mollick, Mollick and Meincke) found no significant factual improvement from in-domain expert personas across almost all of six models tested. A USC study (PRISM) found MMLU accuracy fell as the expert persona in a prompt became longer.

## Industry Guidance Shifts Toward Simplicity

Anthropist favours plain language and headings for its newest models. Meanwhile, Anthropic reported removing more than 80% of Claude Code's system prompt for its Opus 5 and Fable 5 models with no measurable loss on coding evaluations.

OpenAI published a GPT-5.2 prompting guide on GitHub (openai-cookbook) that recommends a loop of: choose model and reasoning effort, run evals, adjust where results fall short, then run evals again.

---
**Source:** [The Techy Side](https://www.thetechyside.com.au/posts/a-practical-guide-to-prompt-engineering-in-september-2026)