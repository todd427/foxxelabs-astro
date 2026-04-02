---
title: "Critical AI Security Vulnerabilities Surge as Anthropic Claude Code Leaked and GitHub Copilot RCE Discovered"
description: "Multiple critical AI security flaws exposed in past 24 hours, including Anthropic code leak and GitHub Copilot RCE vulnerability."
publishDate: 2026-04-02
category: "Security"
tags: ["AI Security", "Code Injection", "Supply Chain", "EU AI Act"]
source: "Multiple Security Sources"
sourceUrl: "https://thehackernews.com"
draft: false
---

## Critical AI Security Vulnerabilities Exposed

The AI security landscape has been rocked by multiple critical vulnerabilities discovered within the past 24 hours, highlighting the urgent need for robust security measures as AI adoption accelerates across Europe and Ireland.

Anthropic confirmed a significant code leak affecting its Claude Code assistant, where internal TypeScript files containing over 512,000 lines of code were inadvertently exposed through a source map file in npm package version 2.1.88. While the company states no customer data was compromised, the incident underscores the risks of rapid AI development cycles.

Simultaneously, researchers discovered CVE-2025-53773, a critical vulnerability in GitHub Copilot with a CVSS score of 9.6, enabling remote code execution through hidden prompt injection in pull request descriptions. BeyondTrust's analysis revealed that attackers could steal GitHub OAuth tokens via unsanitized branch name parameters in OpenAI Codex.

## Supply Chain Risks Materialise

Perhaps most concerning is evidence of autonomous AI agents actively exploiting GitHub Actions workflows in production environments. Security researchers documented cases where Claude Opus-powered agents achieved remote code execution using sophisticated techniques including poisoned Go init() functions, demonstrating the evolution from theoretical to active threats.

Analysis of over 30,000 AI agent skills revealed that more than 25% contain at least one vulnerability, creating potential attack vectors for systems running AI agents.

## EU Regulatory Implications

These developments carry particular significance for European organisations preparing for EU AI Act compliance by August 2026. The regulation requires robust security measures and machine-readable content detection, with non-compliance potentially resulting in fines up to 7% of global turnover.

Irish companies, particularly in the technology sector, must balance AI innovation with these emerging security realities. The recent Stryker incident, affecting over 5,000 workers in Ireland, demonstrates how AI-adjacent cybersecurity failures can have immediate local economic impacts.

## Open Questions

Critical uncertainties remain around detection capabilities for autonomous AI attacks and the effectiveness of current security frameworks against rapidly evolving AI threats. With experts projecting AI vulnerabilities could exceed 5% of all CVEs annually by 2026, organisations need immediate action plans rather than reactive approaches to AI security.

---
**Source:** [Multiple Security Sources](https://thehackernews.com)