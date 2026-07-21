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
updates: []
draft: false
---

## Context Engineering Emerges as Evolution Beyond Prompt Engineering

Anthropc views context engineering as the natural progression of prompt engineering. The company defines context engineering as the set of strategies for curating and maintaining the optimal set of tokens during LLM inference, including all information outside of the prompts.

## Understanding Context Rot

Research into needle-in-a-haystack benchmarking has uncovered a critical challenge known as context rot: as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases. This finding underscores the need for smarter approaches to information management in large language models.

## New Memory Tool Addresses Context Window Limitations

Anthropc has released a memory tool in public beta on the Claude Developer Platform as part of the Sonnet 4.5 launch. The tool is designed to make it easier to store and consult information outside the context window through a file-based system, offering a practical solution to the context rot problem.

---
**Source:** [Anthropic Engineering Blog](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)