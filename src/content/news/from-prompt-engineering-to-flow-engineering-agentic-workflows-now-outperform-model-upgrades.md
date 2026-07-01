---
title: "From Prompt Engineering to Flow Engineering: Agentic Workflows Now Outperform Model Upgrades"
description: "Andrew Ng says agentic workflows drive more progress than next-gen models. GPT-3.5 in workflows hits 95.1% on coding tasks versus 48.1% solo."
publishDate: 2026-07-01
category: "Research"
tags: ["agentic-workflows", "prompt-engineering", "AI-systems", "flow-engineering"]
source: "The AI Agent Economy"
sourceUrl: "https://aiagenteconomy.substack.com/p/ai-prompt-engineering-is-dead-heres"
significance: "high"
entities: ["Andrew Ng", "CodiumAI", "Andrej Karpathy", "Shopify", "Tobi Lütke", "Gartner", "GPT-3.5", "GPT-4", "Google DeepMind", "University of Maryland"]
irishEuAngle: false
updates: []
draft: false
---

## Agentic Workflows Outpace Model Improvements

According to Andrew Ng, agentic workflows will drive more progress than the next generation of foundation models. At Sequoia Capital's AI Ascent conference, Ng stated that "the improvement from GPT-3.5 to GPT-4 is dwarfed by incorporating an iterative agent workflow."

The data backs this claim. On the HumanEval coding benchmark, GPT-3.5 achieved 48.1% accuracy with a single prompt, while GPT-4 reached 67%. But when GPT-3.5 was wrapped in an agentic workflow, it jumped to 95.1% accuracy—far exceeding GPT-4's solo performance.

Similarly dramatic improvements appear in competitive programming tasks. With a single well-designed prompt, GPT-4 achieved 19% accuracy on CodeContests (pass@5). Using the AlphaCodium flow, the same model reached 44% accuracy—more than double the performance.

## Flow Engineering Emerges as New Discipline

CodiumAI researchers coined the term "flow engineering" in their AlphaCodium paper, with the subtitle "From Prompt Engineering to Flow Engineering." This reflects a broader shift in how AI practitioners think about LLM optimization.

In mid-2025, Andrej Karpathy stated he prefers the term "context engineering" over "prompt engineering," describing it as "the delicate art and science of filling the context window with just the right information."

Shopify CEO Tobi Lütke echoed this reframing, stating that "context engineering describes the core skill better: the art of providing all the context for the task to be plausibly solvable by the LLM."

Gartner has identified context engineering as a critical skill for successful AI-enabled processes, with companies already hiring "context designers" alongside ML engineers.

## Traditional Prompt Engineering Techniques Still Show Value

While workflows and context engineering dominate emerging discussions, foundational prompt engineering techniques continue to demonstrate measurable improvements. Chain-of-thought prompting improves accuracy by up to 61% over zero-shot baselines for reasoning tasks.

University of Maryland researchers defined prompt engineering as encompassing 58 distinct techniques for text-based LLMs alone. The Prompt Report survey identified that combining few-shot examples with chain-of-thought reasoning outperforms either approach in isolation for complex tasks. Research suggests 3-5 high-quality examples typically outperform fewer or more numerous examples in few-shot prompting, with diminishing returns beyond 5 examples.

Specialized prompting methods continue to yield gains. EmotionPrompt achieved 8.00% relative improvement on Instruction Induction tasks and 115% improvement on BIG-Bench, according to Microsoft and Chinese institutions research. Optimization by Prompting (OPRO) by Google DeepMind achieved 8% improvement over human-designed prompts on GSM8K and up to 50% improvement on Big-Bench Hard tasks.

---
**Source:** [The AI Agent Economy](https://aiagenteconomy.substack.com/p/ai-prompt-engineering-is-dead-heres)