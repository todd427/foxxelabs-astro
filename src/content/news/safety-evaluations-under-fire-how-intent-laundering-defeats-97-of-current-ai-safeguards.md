---
title: "Safety Evaluations Under Fire: How Intent Laundering Defeats 97% of Current AI Safeguards"
description: "New research exposes critical fragility in AI safety evaluations, with intent laundering attacks achieving 90–98% success rates against leading models including Claude and Gemini."
publishDate: 2026-05-05
category: "Security"
tags: ["AI safety", "adversarial attacks", "model evaluation"]
source: "arxiv.org/list/cs.AI"
sourceUrl: "https://arxiv.org"
entities: ["intent laundering", "Claude Sonnet 3.7", "Gemini 3 Pro", "EU AI Act", "August 2026", "Anthropic", "Google", "Ireland", "90-98% success rates"]
significance: "high"
irishEuAngle: true
draft: false
---

## Safety Theater Meets Real-World Attacks

A troubling gap has emerged between how AI safety teams evaluate their models and how attackers actually exploit them. Recent arxiv research reveals that intent laundering—a technique that disguises harmful requests through iterative prompt refinement—succeeds at rates between 90% and 98.55% against models widely marketed as among the safest available, including Anthropic's Claude Sonnet 3.7 and Google's Gemini 3 Pro.

The finding strikes at the heart of enterprise AI deployment strategies across Europe. If safety evaluations fail against relatively straightforward attack vectors, the question becomes urgent: what confidence can organizations have in their compliance posture as the EU AI Act's August 2026 enforcement deadline approaches?

## Why Current Safety Evaluations Are Failing

The research identifies a fundamental mismatch: existing safety datasets and evaluation protocols are heavily overfitted to specific triggering cues rather than genuine adversarial scenarios. Safety teams test against stylized, often unrealistic attack patterns—prompt injections with obvious malicious intent, direct requests for harmful outputs. Real attackers, by contrast, work iteratively and contextually, refining requests based on model responses.

Intent laundering exploits this gap. Rather than asking "how do I build a weapon?" an attacker might ask "what historical weapons changed warfare?" then incrementally shift the conversation toward operational details. Fully black-box access—meaning no knowledge of the model's internal safety mechanisms—doesn't impede the attack. The attacker simply adjusts based on what the model allows.

## What This Means for EU Compliance

For European organizations navigating the EU AI Act's high-risk classification framework, this creates a compliance paradox. The Act requires demonstrable safety assurance, yet the primary tool for demonstrating safety—evaluation protocols—appears significantly fragile.

Ireland's distributed 15-authority enforcement model, launching in August 2026, will place responsibility for compliance verification across multiple regulators. If those authorities inherit safety evaluation practices that fail against routine adversarial techniques, enforcement becomes theater rather than protection.

Organizations deploying high-risk AI systems—in recruitment, healthcare, credit assessment, or law enforcement—will face auditors armed with evaluation protocols that may not have caught the safety vulnerabilities their systems harbor.

## Practical Implications for AI Builders

**For enterprises:** Current safety evaluations should not be treated as sufficient. Adversarial testing protocols need to move beyond static, obvious attack patterns toward iterative, contextual refinement scenarios. Red-teaming should assume attacker sophistication.

**For regulators:** Compliance frameworks built on fragile evaluation standards create illusion without substance. The August 2026 deadline pressure may incentivize adoption of standardized—but inadequate—safety evaluation methods.

**For safety teams:** The overfitting problem is solvable. Rather than designing evaluations around known triggering cues, safety protocols must stress-test against adaptive, black-box attack scenarios that reflect real-world attacker behavior.

## Open Questions

How will Anthropic and OpenAI's parallel evaluation initiative (announced for summer 2025) address intent laundering specifically? Will cross-lab evaluations adopt iterative adversarial protocols, or will they inherit the same static cue-matching limitations? And critically: what interim guidance should Irish and European enterprises adopt before August 2026 if existing safety evaluation standards are demonstrably inadequate?

The answer likely points toward supplementary red-teaming and continuous adversarial monitoring—but that burden shouldn't fall entirely on individual organizations. Regulatory bodies preparing enforcement need urgent clarity on evaluation standards themselves.

---
**Source:** [arxiv.org/list/cs.AI](https://arxiv.org)