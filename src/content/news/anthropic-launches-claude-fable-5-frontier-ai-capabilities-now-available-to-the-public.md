---
title: "Anthropic Launches Claude Fable 5: Frontier AI Capabilities Now Available to the Public"
description: "Anthropic releases Claude Fable 5 on June 9, bringing Mythos-class capabilities to public markets with novel safety safeguards and enterprise pricing."
publishDate: 2026-06-12
category: "Breaking"
tags: ["Claude", "LLM releases", "AI safety", "enterprise AI"]
source: "Anthropic"
sourceUrl: "https://www.anthropic.com/news/claude-fable-5-mythos-5"
significance: "high"
entities: ["Anthropic", "Claude Fable 5", "Claude Mythos 5", "Project Glasswing"]
irishEuAngle: false
updates: []
draft: false
---

## Anthropic Launches Claude Fable 5: Frontier AI Capabilities Now Public

### Key Development

AnthropicReleased Claude Fable 5 on June 9, 2026, making Mythos-class capabilities available to the general public for the first time. The release pairs a general-access model (Fable 5) with a restricted variant (Mythos 5) reserved for vetted cybersecurity and critical infrastructure operators.

Fable 5 represents a deliberate split: the same underlying model, but with safety classifiers that automatically route high-risk queries to Claude Opus 4.8 instead. Mythos 5, offered through Project Glasswing in collaboration with the US government, removes those safeguards for trusted defenders.

### Capability Benchmarks

Fable 5 leads across nearly all measured domains. On SWE-Bench Pro—solving real software engineering tasks from public repositories—it scores 80.3%, compared to Claude Opus 4.8 at 69.2%, GPT 5.5 at 58.6%, and Gemini 3.1 Pro at 54.2%. The model excels at extended, multi-day autonomous tasks, with early testing showing Stripe used Fable 5 to compress months of engineering into days.

Performance gaps widen on complex, long-horizon work. For shorter, straightforward prompts, the advantage over Opus 4.8 narrows—but for ambitious projects spanning days and requiring sustained reasoning, Fable 5's lead is material.

### Safety Design and Trade-offs

AnthropicTook an unusual approach: ship the same model twice, split by access controls rather than capability caps. Fable 5 blocks requests in cybersecurity, biology, chemistry, and model distillation—falling back to Opus 4.8 silently. In internal testing, these safeguards trigger in fewer than 5% of sessions, meaning 95% of Fable 5 interactions run entirely on the model's own responses.

All Fable 5 and Mythos 5 traffic requires 30-day retention for safety monitoring. Anthropic says the data is not used for training, only to identify novel attacks and reduce false positives.

During red-teaming, Mythos Preview (the predecessor) identified and exploited zero-day vulnerabilities in every major operating system and web browser when directed to do so. That capability exists in Fable 5 too—but only Mythos 5 can exercise it openly.

### Pricing and Availability

Both models cost $10 per million input tokens and $50 per million output tokens—less than half the price of Mythos Preview. Fable 5 is available immediately via the Claude API, AWS Bedrock, Vertex AI, and Microsoft Foundry. Subscription access rolls out in stages: through June 22, Pro, Max, Team, and seat-based Enterprise plans include Fable 5 at no extra cost. From June 23, usage credits apply.

### Industry Context

The launch comes as Anthropic prepares for an expected IPO and signals a shift in AI release strategy: frontier models can ship publicly if engineered carefully. It also underscores the coding-first competition among labs. Anthropic has reclaimed the #1 spot on major coding benchmarks—a market segment worth billions in enterprise spend.

### Open Questions

How effectively will Fable 5's classifiers hold against novel jailbreaks in production? Will competitors match the two-model split strategy, or maintain single-track releases? And how will the 30-day retention requirement affect enterprise contracts in jurisdictions with strict data localization rules?

For builders, the practical question is simpler: does Fable 5's edge on your specific workload justify the cost premium over Opus 4.8? Early testing suggests the answer is yes for complex coding and long-context reasoning—but less clear for simpler tasks.

---
**Source:** [Anthropic](https://www.anthropic.com/news/claude-fable-5-mythos-5)