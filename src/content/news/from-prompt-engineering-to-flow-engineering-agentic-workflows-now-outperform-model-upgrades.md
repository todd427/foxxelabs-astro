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
updates:
  - { date: 2026-07-05, note: "In June 2025, Andrej Karpathy posted on X that the term 'prompt engineering' trivialises what practitioners actually do, framing the LLM as a CPU, the context window as RAM, and the job as being the o", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Phil Schmid from Hugging Face stated that most agent failures are not model failures but context failures—incorrect document retrieval, excessive history in the context window, or missing tool definit", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "LangChain formalised four strategies for context engineering: write (persist context externally), select (retrieve what's relevant via RAG), compress (summarise and compact), and isolate (separate con", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Research from Levy, Jacoby, and Goldberg (2024) found that LLM reasoning performance starts degrading around 3,000 tokens, with the practical sweet spot for most tasks being 150–300 words.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Liu et al. (2024) showed a U-shaped performance curve across every model tested: accuracy is highest when relevant information appears at the beginning or end of context, with over 30% accuracy drop f", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Fast Company reported in May 2025 that prompt engineering as a standalone role 'has all but disappeared,' with 68% of firms now providing it as standard training across all roles.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "A Microsoft-commissioned survey of 31,000 workers ranked Prompt Engineer second to last among new roles companies plan to add.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Anthropic's prompt caching can cut costs by up to 90% and latency by 85%.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "OpenAI offers automatic caching with 50–90% discounts depending on the model.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Promptfoo is an open-source tool with over 51,000+ developers that brings CI/CD discipline to prompts with automated testing and red teaming capabilities.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Min et al. (2022) found that the label space and input distribution matter more than whether individual example labels are correct in few-shot prompting, with even randomly labelled examples outperfor", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "In 2026, the key parameter for prompt optimization is reasoning_effort (Low/Med/High), which controls hidden chain-of-thought tokens and drastically improves logic accuracy, replacing temperature tuni", sourceUrl: "https://www.digitalapplied.com/blog/prompt-engineering-advanced-techniques-2026" }
  - { date: 2026-07-05, note: "Manual prompt engineering is becoming 'low-level assembly language' as DSPy 3.0 compiles prompts: define a Signature (Input → Output), provide 10 examples, and DSPy optimizes the prompt for the specif", sourceUrl: "https://www.digitalapplied.com/blog/prompt-engineering-advanced-techniques-2026" }
  - { date: 2026-07-05, note: "Chain-of-Symbol (CoS) beats Chain-of-Thought for spatial tasks, with symbols (↑ ↓ [x]) providing approximately 40% performance improvement over traditional Chain-of-Thought for grid/map/planning logic", sourceUrl: "https://www.digitalapplied.com/blog/prompt-engineering-advanced-techniques-2026" }
  - { date: 2026-07-05, note: "A 'High Effort' reasoning call can consume 10x the tokens of the final output, requiring budgeting for invisible reasoning costs.", sourceUrl: "https://www.digitalapplied.com/blog/prompt-engineering-advanced-techniques-2026" }
  - { date: 2026-07-05, note: "Using a Reasoning Model (GPT-5.2) to write the production prompt for a smaller model (GPT-4.1-mini) provides approximately 20x savings in metaprompt costs while achieving higher adherence.", sourceUrl: "https://www.digitalapplied.com/blog/prompt-engineering-advanced-techniques-2026" }
  - { date: 2026-07-05, note: "The optimal number of few-shot examples typically falls between 2-5, with fewer than two examples often failing to establish a clear pattern and more than five rarely improving performance.", sourceUrl: "https://www.digitalapplied.com/blog/prompt-engineering-advanced-techniques-2026" }
  - { date: 2026-07-05, note: "Organizations that master advanced prompt engineering techniques consistently report 40-60% improvements in task accuracy and significant productivity gains.", sourceUrl: "https://www.digitalapplied.com/blog/prompt-engineering-advanced-techniques-2026" }
  - { date: 2026-07-05, note: "Research shows a 19-point boost on MMLU-Pro with Chain-of-Thought on standard models for hard tasks.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Claude 4.x models follow instructions literally; if you don't ask for something, you won't get it, and the 'above and beyond' behaviour from earlier versions is gone.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "XML tags (<instructions>, <context>, <example>) are the best structuring method for Claude, with measurable performance differences compared to Markdown or numbered lists.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Aggressive language ('CRITICAL!', 'YOU MUST', 'NEVER EVER') actively hurts newer Claude models, with calm, direct instructions producing better results.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "GPT-5 is a router-based system with multiple models behind a single endpoint; explicitly adding 'think step by step' to reasoning tasks can hurt performance.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Gemini's 2M token context window is supported by Google's prompt engineering whitepaper recommendation to always include few-shot examples, with zero-shot explicitly not preferred.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
  - { date: 2026-07-05, note: "Gemini prefers shorter, more direct prompts than either Claude or GPT.", sourceUrl: "https://thomas-wiegold.com/blog/prompt-engineering-best-practices-2026/" }
draft: false
updatedDate: 2026-07-05
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