---
title: "Anthropic Launches Memory Tool for Claude, Addresses Context Rot Challenge"
description: "Anthropic releases memory tool in public beta on Claude Developer Platform with Sonnet 4.5 to tackle context window limitations."
publishDate: 2026-07-21
category: "Research"
tags: ["Claude", "context engineering", "LLM memory", "prompt engineering"]
source: "Anthropic Engineering Blog"
sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
significance: "high"
entities: ["Anthropic", "Claude Developer Platform", "Sonnet 4.5", "context engineering"]
irishEuAngle: false
updates:
  - { date: 2026-08-14, note: "Google DeepMind published a research paper titled 'Visual prompt engineering for video models' on July 28, 2026.", sourceUrl: "https://deepmind.google/research/publications/264392/" }
  - { date: 2026-08-14, note: "The paper's arXiv identifier is arXiv:2607.25537.", sourceUrl: "https://deepmind.google/research/publications/264392/" }
  - { date: 2026-08-14, note: "Visual prompt engineering (VIPE) works by automatically modifying the task image to improve model performance.", sourceUrl: "https://deepmind.google/research/publications/264392/" }
  - { date: 2026-08-14, note: "VIPE improves video reasoning performance across tasks.", sourceUrl: "https://deepmind.google/research/publications/264392/" }
  - { date: 2026-08-14, note: "For video models, visual prompt engineering can be more effective than classic text-based prompt engineering.", sourceUrl: "https://deepmind.google/research/publications/264392/" }
  - { date: 2026-08-14, note: "For video models, visual prompt engineering can be more effective than test-time scaling.", sourceUrl: "https://deepmind.google/research/publications/264392/" }
  - { date: 2026-08-14, note: "Visual prompt engineering is described as a compute-efficient approach to elicit better visual reasoning performance from video models.", sourceUrl: "https://deepmind.google/research/publications/264392/" }
  - { date: 2026-08-14, note: "Anthropic's article 'Effective context engineering for AI agents' was published on September 29, 2025.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "Anthropic's Claude Code uses a 'just-in-time' context strategy, maintaining lightweight identifiers and dynamically loading data at runtime rather than pre-loading all relevant data.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "Anthropic describes 'compaction' as the practice of taking a conversation nearing the context window limit, summarising its contents, and reinitiating a new context window with the summary.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "In Claude Code's compaction implementation, the model preserves architectural decisions, unresolved bugs, and implementation details, while discarding redundant tool outputs or messages.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "Claude Code's compaction retains the five most recently accessed files after context compression.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "Tool result clearing — removing raw tool call results from deep in message history — was launched as a feature on the Claude Developer Platform.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "Anthropic released a memory tool in public beta on the Claude Developer Platform as part of the Sonnet 4.5 launch.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "The memory tool uses a file-based system to allow agents to store and consult information outside the context window.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
  - { date: 2026-08-14, note: "Anthropic states that Claude Code uses CLAUDE.md files dropped into context up front, while primitives like glob and grep allow it to navigate its environment and retrieve files just-in-time.", sourceUrl: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" }
draft: false
updatedDate: 2026-08-14
---

## Context Engineering Emerges as Evolution Beyond Prompt Engineering

Anthropc views context engineering as the natural progression of prompt engineering. The company defines context engineering as the set of strategies for curating and maintaining the optimal set of tokens during LLM inference, including all information outside of the prompts.

## Understanding Context Rot

Research into needle-in-a-haystack benchmarking has uncovered a critical challenge known as context rot: as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases. This finding underscores the need for smarter approaches to information management in large language models.

## New Memory Tool Addresses Context Window Limitations

Anthropc has released a memory tool in public beta on the Claude Developer Platform as part of the Sonnet 4.5 launch. The tool is designed to make it easier to store and consult information outside the context window through a file-based system, offering a practical solution to the context rot problem.

---
**Source:** [Anthropic Engineering Blog](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)