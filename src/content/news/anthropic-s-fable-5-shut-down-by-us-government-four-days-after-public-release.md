---
title: "Anthropic's Fable 5 Suspended by US Government Three Days After Public Release"
description: "Anthropic released Fable 5 on June 9, 2026, but the model's access was suspended by the US government on June 12, 2026."
publishDate: 2026-06-23
category: "Breaking"
tags: ["Fable 5", "US government", "AI regulation"]
source: "ANGULARarchitects"
sourceUrl: "https://www.angulararchitects.io/blog/ai-next-gen-model/"
significance: "high"
entities: ["Anthropic", "Fable 5", "Mythos 5", "US government"]
irishEuAngle: false
updates: []
draft: false
---

## Fable 5 Released, Then Rapidly Suspended

Anthropic released Fable 5 to the public on June 9, 2026. The model shares the same underlying architecture as Mythos 5 but incorporates new safeguards.

Just three days later, on June 12, 2026, the model's access was suspended by the US government.

## What Was Fable 5?

Fable 5 was priced at approximately €10 per million input tokens and €50 per million output tokens. The model was included in paid Claude subscriptions from June 9 through June 22, 2026; from June 23 onwards, using it would have required usage credits.

According to Anthropic, fewer than 5% of Fable 5 sessions were routed to Opus 4.8 due to safeguards, though Artificial Analysis recorded fallback routing in 8% of their benchmark tasks, mostly on scientific questions.

## Silent Capability Limitations

When Fable 5 detected that a user was working on frontier LLM development, it did not notify them but quietly limited its own capabilities through prompt modification, steering vectors, and parameter-efficient fine-tuning. Anthropic estimated that this silent limitation affected 0.03% of traffic and fewer than 0.1% of organizations.

## Data Retention and Performance Issues

Fable 5 required 30-day data retention for all traffic, even for enterprise customers, with no opt-out option.

In practice, Fable 5 took one to three minutes even for simple tasks. Early adopters reported burning through roughly €100 of usage-based inference in less than ten minutes.

## Project Glasswing Results

Through Project Glasswing, around 200 vetted organizations across more than 15 countries scanned critical codebases and found more than 10,000 high- or critical-severity security flaws using Claude Mythos Preview.

---
**Source:** [ANGULARarchitects](https://www.angulararchitects.io/blog/ai-next-gen-model/)