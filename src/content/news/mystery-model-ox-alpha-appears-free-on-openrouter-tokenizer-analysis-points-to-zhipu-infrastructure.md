---
title: "Mystery Model Ox Alpha Appears Free on OpenRouter; Tokenizer Analysis Points to Zhipu Infrastructure"
description: "An anonymous model called Ox Alpha launched free on OpenRouter August 20, matching Zhipu's GLM-5 tokenizer perfectly across 95 probes."
publishDate: 2026-08-24
category: "Breaking"
tags: ["Ox Alpha", "Zhipu", "GLM-5", "OpenRouter"]
source: "Implicator.ai"
sourceUrl: "https://www.implicator.ai/ox-alpha-zhipu-glm-tokenizer-match/"
significance: "high"
entities: ["Ox Alpha", "OpenRouter", "Zhipu AI", "GLM-5", "Z.ai", "Joseph W. Elstner", "Chetaslua", "Ben Davis", "Patrick Collison", "Stripe"]
irishEuAngle: true
updates: []
draft: false
---

## Launch and Core Specifications

Ox Alpha appeared on OpenRouter on August 20, 2026, listed as free and anonymous under the provider label 'stealth/ox-alpha'. The model offers a context window of 1,048,576 tokens and supports a maximum of 131,072 completion tokens. It accepts text, image, and video inputs.

The anonymous provider claimed via OpenCode that Ox Alpha could serve 100 trillion tokens per day during a week of near-unlimited use. However, this capacity claim has not been independently audited.

## Tokenizer Identity Match

Researcher Joseph W. Elstner ran 95 tokenizer probes against Ox Alpha on August 22–23, 2026, using 126 API calls at zero cost. Ox Alpha matched Zhipu's released GLM-5 vocabulary on all 95 of 95 tokenizer probes, with a mean absolute error of 0.00.

For comparison, Zhipu's older (pre-GLM-5) vocabulary matched 84 of 95 probes; the best non-GLM candidate matched only 46.

A tokenizer match establishes vocabulary identity but does not prove model ownership, because a third-party host can use a public vocabulary.

## Infrastructure Analysis

Researcher Chetaslua sent malformed input through the Ox Alpha route on August 22 and received a Java stack trace containing the internal class path 'com.wd.paas.api.domain.v4.chat.ChatCompletionRequest', which maps to Zhipu's documented API structure.

A bad-role test against Ox Alpha produced the same code 1214 error envelope returned by Z.ai-hosted GLM models. Based on this evidence, researcher Chetaslua assigned 0.98 confidence to the inference that Ox Alpha is served by Zhipu's Z.ai infrastructure.

## Performance Testing

Developer Ben Davis ran a 10-task subset of DeepSWE on August 21, 2026 and reported an 80% result for Ox Alpha. In a 10-task DeepSWE sample, one task changes the score by 10 percentage points. The 113-task DeepSWE community run result of ~63% is not an official audited leaderboard score.

## Privacy and Attribution

OpenRouter's listing states that the anonymous third-party provider retains prompts and completions but does not use them for training. No company had publicly claimed Ox Alpha as of August 23, 2026.

Stripe CEO Patrick Collison tried Ox Alpha and called it 'very impressive'.

## EU AI Act Context

This launch occurs as new transparency and enforcement obligations take effect across the European Union. From August 2, 2026, the European Commission's AI Office, together with national authorities, began enforcing the AI Act. New AI Act transparency rules began applying on the same date, establishing stricter disclosure requirements for all large language models and AI systems operating in EU territory or serving EU users—potentially affecting Ox Alpha's operations via OpenRouter.

---
**Source:** [Implicator.ai](https://www.implicator.ai/ox-alpha-zhipu-glm-tokenizer-match/)