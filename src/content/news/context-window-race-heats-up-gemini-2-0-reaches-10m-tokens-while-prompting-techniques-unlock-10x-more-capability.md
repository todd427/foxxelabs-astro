---
title: "Context Windows Hit 1M Tokens — But Context Engineering Is the Real Story"
description: "Frontier models now ship 1M-token context windows at standard pricing. The harder problem isn't how much fits — it's context rot, and curating what goes in."
publishDate: 2026-06-24
updatedDate: 2026-06-24
category: "Research"
tags: ["context engineering", "large language models", "AI capability"]
source: "Anthropic / Google AI for Developers"
sourceUrl: "https://platform.claude.com/docs/en/build-with-claude/context-windows"
significance: "medium"
entities: ["OpenAI", "Anthropic", "Google DeepMind", "Claude Opus 4.6", "Gemini 2.5 Pro", "Gemini 3 Pro"]
irishEuAngle: false
updates:
  - date: 2026-06-24
    note: "Rewritten from an earlier auto-generated draft that contained unverified figures (a fabricated 10M-token Gemini claim and a non-existent 'Claude 3.7'). Figures below are sourced to primary model documentation."
draft: false
---

## Where context windows actually stand

The headline numbers are real, but smaller than the hype suggests. As of mid-2026, the frontier clusters around one to two million tokens — not the ten million figure that circulated in some secondary summaries.

Anthropic's Claude Opus 4.6 through 4.8 and Sonnet 4.6 carry a **1M-token context window** on the Claude API, Amazon Bedrock, and Vertex AI; older models such as Sonnet 4.5 remain at 200k. Google's Gemini 2.5 Pro and 3.x Pro ship a **1M-token default**, with the older Gemini 1.5 Pro reaching **2M** via API — still the largest mainstream window. There is no "Claude 3.7," and no shipping model at 10M tokens.

What changed in 2026 isn't a single record-breaking number — it's that 1M context went *general availability at standard pricing*. Anthropic made the 1M window GA for Opus 4.6 and Sonnet 4.6 on 13 March 2026 with no long-context premium below 200k. That economics shift matters more than the raw ceiling.

## The catch: context rot

Bigger is not automatically better. Anthropic's own documentation is blunt about it: as token count grows, accuracy and recall degrade — a phenomenon now widely called **context rot**. A 1M window you fill with unstructured material will often underperform a well-curated 100k one.

The benchmark evidence backs this up. On a needle-in-a-haystack test at 1M tokens, Opus 4.6 scored 76% — a large jump over its predecessor, but well short of perfect recall at the top of the window. Independent testing of Gemini 2.5 Pro reports reliable retrieval to roughly 800k tokens, with measurable degradation in the final stretch. The window is a ceiling, not a guarantee.

## Why context engineering replaced prompt tricks

This is the legitimate shift the field is converging on, and it's the opposite of the "one weird prompt unlocks 10x" framing. With large windows, the constraint moves from *fitting* information to *curating* it: deciding what belongs in context, in what order, and what to compact or evict.

Concretely, that means front-loading the constraints and failure modes a task actually has, putting the question after the supporting material rather than before it, and using server-side compaction or retrieval to keep the working set lean as a conversation grows. The skill isn't phrasing — it's information architecture for the model's working memory.

## The practical takeaway

For builders, the 1M window plus cheap cache reads changes the math on retrieval pipelines: parking a large codebase or document corpus in cache once, then re-reading it per request, is now a reasonable line item where it used to be prohibitive. But the engineering effort shifts accordingly — toward measuring recall at depth, structuring context deliberately, and treating "how much fits" as the least interesting question in the room.

---
**Primary sources:** [Anthropic — Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) · [Google AI for Developers — Long context](https://ai.google.dev/gemini-api/docs/long-context)
