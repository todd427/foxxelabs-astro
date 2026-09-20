---
title: "Study Reveals LLMs Excel at Diagnosis but Struggle with Test Selection in Clinical Settings"
description: "ChatGPT-4o, Gemini 1.5 Pro, and Llama 3.3 70B show near-perfect accuracy on final diagnosis but poor performance on diagnostic testing selection across 36 clinical case studies."
publishDate: 2026-09-20
category: "Research"
tags: ["LLMs", "clinical-decision-support", "prompt-engineering", "MedPrompt"]
source: "arXiv (cs.CL)"
sourceUrl: "https://arxiv.org/abs/2512.22966"
significance: "high"
entities: ["ChatGPT-4o", "Gemini 1.5 Pro", "Llama 3.3 70B", "Mengdi Chai", "Ali R. Zomorrodi", "MedPrompt"]
irishEuAngle: false
updates: []
draft: false
---

## LLMs Show Uneven Performance Across Clinical Reasoning Tasks

A new study evaluating three leading large language models—ChatGPT-4o, Gemini 1.5 Pro, and Llama 3.3 70B—in clinical decision support has revealed significant disparities in their ability to handle different stages of patient care workflows.

The research, conducted by Mengdi Chai and Ali R. Zomorrodi, assessed LLM performance across the entire clinical reasoning workflow of a typical patient encounter using 36 case studies. The evaluation covered five sequential clinical decision-making tasks: differential diagnosis, essential immediate steps, relevant diagnostic testing, final diagnosis, and treatment recommendation.

## Where Models Excel and Where They Fail

All three models achieved near-perfect accuracy on the final diagnosis task. However, all three showed poor performance on the relevant diagnostic testing task—the critical step of determining which tests should be ordered to confirm or rule out diagnoses.

This gap suggests that while LLMs can recognize patterns associated with disease outcomes, they may lack robust reasoning for the diagnostic process that clinicians use to arrive at those conclusions.

## Temperature Settings and Model-Specific Responses

The study found that model performance varies with configuration adjustments. ChatGPT-4o performed better under zero temperature (deterministic output), whereas Llama 3.3 70B showed stronger performance under the default temperature setting (stochastic output).

## Prompt Engineering: Targeted Help for Weak Areas

Prompt engineering using the MedPrompt framework significantly improved LLM performance on the relevant diagnostic testing task, which had the lowest baseline accuracy. However, prompt engineering proved counterproductive for clinical tasks other than relevant diagnostic testing, where baseline accuracy was already higher.

Additionally, targeted dynamic few-shot prompting did not consistently outperform random selection of examples.

## Key Takeaway

The authors conclude that the impact of prompt engineering is highly model- and task-dependent, suggesting that practitioners cannot apply one-size-fits-all optimization strategies when deploying LLMs for clinical decision support.

---
**Source:** [arXiv (cs.CL)](https://arxiv.org/abs/2512.22966)