---
title: "Open Recipe, Closed Door: What MiMo-V2.6 Actually Gives a Small Lab"
description: "Xiaomi has released the highest-scoring open-weight model anyone has measured, under the MIT licence, and almost nobody can run it. The weights are the least useful part of the release. The recipe, the graded environments and a 9B student model are the parts that fit on a desk."
publishDate: 2026-09-28
category: "Opinion"
tags: ["AI", "Open Weights", "Reinforcement Learning", "Small Models", "Sovereign AI", "Opinion"]
readingTime: "6 min read"
author: "Todd McCaffrey"
furtherReading:
  - title: "MiMo-V2.6-Pro-RL model card"
    url: "https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL"
    source: "Hugging Face"
  - title: "MiMo-V2.6-Distill-Qwen-9B model card"
    url: "https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Distill-Qwen-9B"
    source: "Hugging Face"
  - title: "Xiaomi's MiMo-V2.6 tops the open-weight rankings"
    url: "https://thenextweb.com/news/xiaomi-mimo-v2-6-open-weight-model-anthropic-distillation"
    source: "The Next Web"
draft: true
---

**By Todd McCaffrey**

---

On the evening of 21 September, Irish time, Xiaomi released the strongest open-weight model anyone has scored, under the MIT licence, and I can't run it. Nor can you, probably. MiMo-V2.6-Pro has 1.02 trillion parameters. Only 42 billion of them fire for any given token, but all of them have to sit in memory waiting their turn. The model card's own deployment examples use eight GPUs at the least, and sixteen across two nodes for the full configuration.

That isn't a complaint. The more interesting thing Xiaomi shipped wasn't the weights at all. It was the reinforcement-learning framework, more than seven thousand graded task environments, and a nine-billion-parameter student model trained on the big one's output. That's the part that fits on a desk, and the part worth taking seriously.

## <span style="color:#1F4E79">What was released, precisely</span>

Four things, and they are worth separating.

The weights: MiMo-V2.6-Pro and a smaller sibling, Flash (about 310 billion total, 15 billion active). Both are omnimodal, take text, images, video and audio, and claim a million-token context. Artificial Analysis puts Pro at 46 on its Intelligence Index, the highest figure an open-weight model has reached.

The recipe: a technical report, and an end-to-end RL framework covering environment interaction, trajectory collection, reward evaluation and policy optimisation. Xiaomi says the RL stage took under six days and cost about $2.62 million for Pro.

The environments: more than 7,000 of them, each with an automatic grader, spanning software engineering, vulnerability reproduction, knowledge work, and web design.

The distill: MiMo-V2.6-Distill-Qwen-9B, a supervised fine-tune of Alibaba's Qwen3.5-9B on 77.4 billion tokens of MiMo-generated data. The mix is 29.9% code, 14.2% cybersecurity, 28.5% general agent work and 27.4% visual.

Most coverage led with the first item. For anyone running their own hardware, it's the last three that matter.

## <span style="color:#1F4E79">The memory arithmetic</span>

"42 billion active" sounds like a model you could serve at home. It isn't. A mixture-of-experts model routes each token to a handful of experts, but it doesn't know in advance which ones, so every expert has to be resident. The published checkpoint is in FP8, which puts the weights at roughly a terabyte. Even at 4-bit it is around half a terabyte. Those are my figures, from the parameter count; the card itself just lists the parallelism.

My largest card is a 32 GB RTX 5090. No Irish SME is going to buy the rack this needs, and neither am I.

So "open weights" is quietly becoming a category that includes things almost nobody can run. That is still a real good, because a lab or a cloud provider can host it without Xiaomi's permission. But it's not the same good as a model you can put on your own machine, and the two get reported as if they were.

## <span style="color:#1F4E79">Open weights versus open recipe</span>

What does travel down to a single card is the method. Seven thousand environments with graders is the expensive, unglamorous part of reinforcement learning: someone has to write the tasks, write the checks, and harden the checks against a model that will happily learn to game them. Xiaomi's report spends a good deal of its length on exactly that, including freezing the MoE router during RL to keep training stable and a layered defence against reward hacking.

A one-person lab cannot pay for a trillion-parameter RL run. It can reuse a graded environment. That is the durable contribution here, and it is the part that will still matter when Pro has been overtaken.

## <span style="color:#1F4E79">The distill is the real product</span>

The model card for the 9B distill reports it against the Qwen3.5-9B it started from. Some of the gains are small: SWE-bench Verified goes from 60.0 to 61.1. Some are not. SWE-bench Pro goes from 32.0 to 44.6. AutomationBench, a general agent benchmark, goes from 5.0 to 30.3. Xiaomi's own cybersecurity set goes from 5.7 to 31.3, though that one is internal and should be read as such.

Xiaomi's stated purpose for it is modest. They call it an SFT checkpoint and a starting point for open agentic-RL research, not a finished assistant. That framing is honest, and it's also the useful one: the distill is the flagship's behaviour poured into something a single card can hold. A 4-bit quantisation of it is under 6 GB.

## <span style="color:#1F4E79">A single-card test</span>

This is where it touches my own work. Gléas, my agent harness, serves Macalla LoRA adapters, which are small per-purpose fine-tunes, over a frozen Qwen3-8B base. The question MiMo raises for me is concrete: is a 9B student of a trillion-parameter teacher a better base for that kind of per-person adaptation than a general-purpose 8B?

It is testable on one card. Swap the base, retrain the same adapters on the same data, and measure what the adapters were built for rather than what the leaderboards measure: tool-use reliability in the harness, how often retrieval gets used when it should, and the energy per completed task. If the student's agentic habits survive a LoRA on top, that is a real gain. If the adapter washes them out, the distill is a better general assistant and a worse base.

There is a wrinkle I'd rather state than hide. The distill is still a Qwen underneath. I've been looking for a European base for Gléas, and this release doesn't move that question at all. It moves the other one: whether a small base can carry agentic behaviour it learned from something much bigger.

## <span style="color:#1F4E79">What this means for sovereign AI</span>

The phrase usually means owning the weights. This release suggests that's the wrong thing to count. The useful openness is the kind you can reproduce and extend on hardware you control: the environments, the graders, the training framework, and a student small enough to run. The trillion-parameter checkpoint is a fine thing to have in the world. It is not what changes what a small lab can do on Monday morning.

## <span style="color:#1F4E79">Sources</span>

All checked on 28 September 2026. Benchmark figures are Xiaomi's own unless stated; Artificial Analysis's index is the one independent score.

- Release, licence, parameter counts and deployment configuration: [MiMo-V2.6-Pro-RL model card](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Pro-RL)
- Distill data mix and benchmark table: [MiMo-V2.6-Distill-Qwen-9B model card](https://huggingface.co/XiaomiMiMo/MiMo-V2.6-Distill-Qwen-9B)
- Environments, RL cost and training time: [Xiaomi MiMo release notes](https://mimo.mi.com/docs/en-US/news/latest/v2-6) and [The Next Web](https://thenextweb.com/news/xiaomi-mimo-v2-6-open-weight-model-anthropic-distillation)
- Artificial Analysis score and Flash parameter counts: [Trending Topics](https://www.trendingtopics.eu/xiaomi-mimo-v26-pro-open-weight-model/)
- Router freezing and reward-hacking defences: [VentureBeat](https://venturebeat.com/technology/better-than-deepseek-xiaomis-mimo-v2-6-pro-debuts-as-the-top-open-weights-model-in-the-world-alongside-cheaper-v2-6-flash)
- 4-bit size of the distill: [bartowski's GGUF quantisations](https://huggingface.co/bartowski/MiMo-V2.6-Distill-Qwen-9B-GGUF)

---

*Todd McCaffrey is a New York Times bestselling author and holds an MSc in Cyberpsychology from ATU Letterkenny. He builds and writes about AI at foxxelabs.ie. This piece was drafted with Claude from a weekly news brief and checked against the sources above.*
