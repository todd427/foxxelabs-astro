---
title: "AI's Double-Edged Sword: How Machine Learning is Both Securing and Weaponising Cybersecurity"
description: "AI models are discovering thousands of zero-days faster than ever, but state actors are weaponising the same tools—collapsing vulnerability disclosure windows from years to days."
publishDate: 2026-06-01
category: "Security"
tags: ["AI Security", "Zero-Day Vulnerabilities", "Threat Intelligence"]
source: "Foxxe Labs Research"
sourceUrl: "https://foxxelabs.com"
significance: "high"
entities: ["Anthropic", "Claude Mythos Preview", "Firefox", "Zero-Day Clock", "China", "North Korea"]
irishEuAngle: false
updates: []
draft: false
---

## The Acceleration Problem: From Years to Hours

The cybersecurity landscape has fundamentally shifted. What once gave organisations months or even years to patch vulnerabilities now leaves them with hours. According to Zero-Day Clock tracking, the mean time between vulnerability discovery and exploitation has collapsed from nearly a year in 2021 to just over a day in 2026.

This isn't coincidence—it's AI-driven. Anthropic's Claude Mythos Preview has identified thousands of zero-day vulnerabilities across every major operating system and web browser, with technical details already available for patched subsets. Firefox 150 alone includes fixes for 271 vulnerabilities discovered through AI analysis.

## The Dual-Use Crisis

Here's the uncomfortable truth: the same AI capabilities helping defenders find vulnerabilities are being weaponised by threat actors. Sophisticated threat clusters linked to China and North Korea have integrated AI-augmented vulnerability discovery into their operational playbooks, employing persona-driven jailbreaking and specialised security datasets to accelerate exploitation.

Meanwhile, the broader attack surface is expanding. AI infrastructure exposes roughly 1 million services from 2 million hosts due to weak defaults, creating a sprawling target-rich environment for adversaries. When combined with AI-generated code containing over 2,000 vulnerabilities and 400+ exposed secrets (discovered in nearly 5,600 applications), the risk vector becomes genuinely alarming.

## What This Means for Builders and Defenders

For organisations operating in Ireland and across Europe, this creates an immediate operational challenge:

**Patch velocity matters more than ever.** A one-day exploitation window renders traditional quarterly patching cycles obsolete. Organisations need automated patch deployment pipelines and real-time vulnerability monitoring.

**AI-generated code needs verification.** If you're using AI coding assistants, treat the output as untrusted input. Security scanning before deployment isn't optional—it's essential.

**Default security configurations are critical.** Weak defaults in AI infrastructure aren't theoretical vulnerabilities; they're actively being exploited. Baseline hardening and continuous configuration auditing should be non-negotiable.

**Third-party risk escalates.** If your supply chain includes organisations using unvetted AI-generated codebases, your exposure increases significantly.

## The Open Questions

Several key uncertainties remain:

- How are state-sponsored actors accessing advanced AI vulnerability discovery tools, and what's the lag between public disclosure and weaponisation?
- What's the cost-benefit equation for patching when exploitation happens within hours of discovery?
- Are current European AI governance frameworks (like the AI Act) adequate for managing the security implications of widely-deployed AI security tools?
- How should organisations balance the defensive benefits of AI-driven vulnerability discovery against the risks of accelerated exploitation timelines?

## The Path Forward

This isn't an argument against AI security tools—they're demonstrably valuable for defenders. It's a call for defensive agility. Organisations must assume that any vulnerability AI finds, adversaries will eventually find too. The competitive advantage now lies in detection speed and patch deployment velocity, not in vulnerability secrecy.

---
**Source:** [Foxxe Labs Research](https://foxxelabs.com)