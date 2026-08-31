---
title: "Algorithmic Prompt Tuning Outperforms Human Crafting in VMware Study"
description: "VMware researchers find auto-tuned prompts beat human-crafted ones, raising questions about prompt engineering's future value."
publishDate: 2026-08-31
category: "Research"
tags: ["prompt-engineering", "LLMs", "AI-automation"]
source: "IEEE Spectrum"
sourceUrl: "https://spectrum.ieee.org/prompt-engineering-is-dead"
significance: "high"
entities: ["VMware", "Rick Battle", "Teja Gollapudi", "Intel Labs", "Vasudev Lal", "NeuroPrompts", "Red Hat", "Tim Cramer", "IBM", "OpenAI", "Anthropic", "DeepSeek"]
irishEuAngle: false
updates: []
draft: false
---

## VMware's Systematic Test: Algorithmic Prompts Win

Rick Battle and Teja Gollapudi, researchers at VMware, systematically tested how different prompt-engineering strategies affect an LLM's ability to solve grade-school math questions. The pair tested three different open-source language models with 60 different prompt combinations each.

Their key finding: algorithmically auto-tuned prompts outperformed the best human-crafted prompts found through trial and error in almost every test case. However, the results revealed inconsistency—chain-of-thought prompting sometimes helped and other times hurt LLM performance. The paper concluded that "the only real trend may be no trend."

## Intel Labs' NeuroPrompts: Automation for Image Generation

Intel Labs, led by principal AI research scientist Vasudev Lal, created a tool called NeuroPrompts that automatically enhances simple text prompts to produce higher-quality images from Stable Diffusion XL. The tool used a reinforcement-learning algorithm to tune an LLM to produce prompts that scored higher on the PickScore image-evaluation metric than expert-human prompts.

## The Future of Prompt Engineering Work

Tim Cramer, Senior Vice President of Software Engineering at Red Hat, stated that prompt engineering jobs will persist for "quite some time" because adapting generative AI for industry involves a multistage process beyond prompt crafting alone.

Large companies including IBM and Red Hat are pioneering a job area called LLMOps (large language model operations), which includes prompt engineering in its life cycle alongside other deployment tasks.

## Reasoning Models Change the Game

With the rise of reasoning models including OpenAI's o-series, Anthropic's extended thinking in Claude, and DeepSeek's R1, much of the step-by-step reasoning that prompts previously had to elicit is now handled internally by the model.

## Salary Landscape

Corsera reported a US median salary for prompt engineering roles of approximately $126,000 per year, while ZipRecruiter showed entry-level prompt engineering postings closer to $63,000 per year.

---
**Source:** [IEEE Spectrum](https://spectrum.ieee.org/prompt-engineering-is-dead)