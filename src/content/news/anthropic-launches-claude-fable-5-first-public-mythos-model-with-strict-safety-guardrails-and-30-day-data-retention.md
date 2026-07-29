---
title: "Anthropic Launches Claude Fable 5, First Public Mythos Model, with Strict Safety Guardrails and 30-Day Data Retention"
description: "Anthropic released Claude Fable 5 on June 9, 2026, priced at $10/$50 per million tokens with mandatory 30-day traffic retention for all users."
publishDate: 2026-06-23
category: "Breaking"
tags: ["Claude Fable 5", "Anthropic", "AI Safety", "Enterprise AI"]
source: "TechCrunch"
sourceUrl: "https://techcrunch.com/2026/06/09/anthropic-released-claude-fable-5-its-most-powerful-model-publicly-days-after-warning-ai-is-getting-too-dangerous/"
significance: "high"
entities: ["Anthropic", "Claude Fable 5", "Mythos", "Opus 4.8", "Boris Cherny"]
irishEuAngle: false
updates: []
draft: true
---

## Anthropic Releases Claude Fable 5

On June 9, 2026, Anthropic launched Claude Fable 5, marking the first publicly available version of its Mythos model. The new model carries a premium price tag: $10 per million input tokens and $50 per million output tokens—double the price of Opus 4.8.

## Safety Architecture: High-Risk Domain Blocking

Fable 5 implements a defensive fallback system for high-risk areas. The model blocks responses in cybersecurity, biology, chemistry, and distillation, automatically deferring to Claude Opus 4.8 in these domains. Early data shows at least 95% of Fable sessions run entirely on the model's own responses without deferring to Opus 4.8, suggesting the guardrails have a narrow enforcement footprint.

## Security Testing and Retention Requirements

Anthropologic ran an external bug bounty that produced no universal jailbreaks in over 1,000 hours of testing of Fable 5.

All access to Fable 5 and Mythos 5 comes with a mandatory 30-day retention requirement on all traffic. This requirement applies even to enterprises that previously had zero-retention agreements with Anthropic.

## Pricing Model Change

Through June 22, 2026, Fable 5 was included in Pro, Max, Team, and seat-based Enterprise plans at no extra cost. On June 23, Anthropic pulled Fable 5 from those plans, requiring usage credits going forward.

## The Evolution of Applied AI: Loop Engineering

In June 2026, Claude Code builder Boris Cherny observed a fundamental shift in how engineers interact with AI systems. "I don't prompt Claude anymore," Cherny stated. "I have loops running that prompt Claude and figuring out what to do. My job is to write loops."

This reflects a broader shift in applied AI skills. The highest-value skill in the field has been rewritten 4 times in four years: from prompts, to context, to the harness, to the loop. Layer 4—loop engineering—involves systems scheduled and run repeatedly without constant manual prompting. These systems combine triggers, goal and state persistence, scouting tasks, invoking harnessed agents, verifying outputs with a second agent, and writing memory across iterations.

---
**Source:** [TechCrunch](https://techcrunch.com/2026/06/09/anthropic-released-claude-fable-5-its-most-powerful-model-publicly-days-after-warning-ai-is-getting-too-dangerous/)
