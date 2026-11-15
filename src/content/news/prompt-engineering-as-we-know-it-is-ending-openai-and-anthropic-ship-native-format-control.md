---
title: "Prompt Engineering as We Know It Is Ending: OpenAI and Anthropic Ship Native Format Control"
description: "OpenAI's Structured Outputs API and Anthropic's context engineering guides signal the shift from prompt craft to schema-driven development."
publishDate: 2026-11-15
category: "Industry"
tags: ["OpenAI", "Anthropic", "API", "Developer Tools"]
source: "The Whiteboard (Substack / Anubhav Goyal)"
sourceUrl: "https://anubhavgoyal10.substack.com/p/the-end-of-prompt-engineering-what"
significance: "high"
entities: ["OpenAI", "Anthropic", "Structured Outputs API", "Pydantic", "DSPy 3.0"]
irishEuAngle: false
updates: []
draft: false
---

## The End of Format Instructions in Prompts

OpenAI's Structured Outputs API has fundamentally changed how developers enforce response formats. Instead of embedding format instructions in natural language prompts, developers can now pass a strict JSON schema directly to the API, which enforces the response format at the model level. This eliminates the need for format guidance in the prompt text itself.

The implementation uses OpenAI's `responses.parse()` method with a text_format parameter, which enforces valid JSON output matching an exact Pydantic schema—again, without requiring any format instruction in the prompt.

## Anthropic's Context Engineering Framework

Anthropic has published detailed guides on context engineering and compaction to explain how to manage long-term memory and edit context windows dynamically. This represents a parallel shift toward explicit, documented patterns for memory and state management.

## Tool Use as a First-Class API Primitive

Tool use has become a first-class primitive in modern AI APIs, with state and memory patterns becoming explicit features in official SDKs from both OpenAI and Anthropic. This marks a move away from improvised patterns toward standardized, production-ready features.

## Automated Prompt Compilation: DSPy 3.0

DSPy 3.0 takes automation further by compiling prompts automatically. A developer defines a Signature (Input → Output) and provides 10 examples, and DSPy 3.0 optimizes the prompt for the specific model—whether GPT-5.2 or Llama 4. This removes the manual tuning step entirely.

## Market Shifts

ChatGPT fell below 50% AI assistant market share for the first time, reaching 46.4% of AI assistant users in May 2026. Meanwhile, Claude Opus 4.7 beats GPT-5.4 on the SWE-bench Pro benchmark for agentic coding tasks, signaling meaningful competition in high-stakes workloads.

---
**Source:** [The Whiteboard (Substack / Anubhav Goyal)](https://anubhavgoyal10.substack.com/p/the-end-of-prompt-engineering-what)