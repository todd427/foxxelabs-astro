---
title: "Zero-Day Arms Race: Anthropic's Mythos Model Finds Thousands of Critical Vulnerabilities Across Operating Systems"
description: "Anthropic's autonomous vulnerability-finding model Mythos discovers thousands of zero-days in major OSs and browsers, triggering urgent security response from tech giants."
publishDate: 2026-04-18
category: "Security"
tags: ["vulnerability-disclosure", "ai-security", "zero-day"]
source: "Security Research"
sourceUrl: "https://www.krebsonsecurity.com"
entities: ["Anthropic", "Claude Mythos", "Project Glasswing", "Amazon Web Services", "Apple", "Broadcom", "Cisco", "CrowdStrike", "Google", "JPMorgan Chase", "Linux Foundation", "Microsoft", "NVIDIA", "Palo Alto Networks", "OpenBSD", "MCP", "2025", "34.6%", "2,130"]
significance: "high"
irishEuAngle: false
draft: false
---

## Anthropic's Mythos Model Autonomously Discovers Thousands of Critical Zero-Day Vulnerabilities

Anthropıc has announced a significant breakthrough in AI-assisted security research: its new Claude Mythos model has autonomously identified thousands of high-severity vulnerabilities—including zero-day exploits—across every major operating system and web browser. The discovery includes critical bugs that have remained unpatched for decades, such as a 27-year-old vulnerability in OpenBSD and a 16-year-old flaw in widely-deployed software.

The company has launched **Project Glasswing**, a coordinated vulnerability disclosure and remediation initiative involving some of the world's largest technology firms, including Amazon Web Services, Apple, Broadcom, Cisco, CrowdStrike, Google, JPMorgan Chase, the Linux Foundation, Microsoft, NVIDIA, and Palo Alto Networks.

## Why This Matters: The Vulnerability Disclosure Acceleration

This development signals a fundamental shift in how security vulnerabilities are discovered and addressed. Rather than relying on traditional security researchers, bug bounty programmes, or internal red teams working at human speed, Mythos operates autonomously across vast codebases, identifying patterns and weaknesses that would take human teams months or years to surface.

The timing is critical: 2025 has already seen a 34.6% year-over-year surge in AI-related CVEs, with 2,130 vulnerabilities disclosed in the year to date. Crucially, nearly half of scored AI vulnerabilities are categorised as high- or critical-severity, particularly in emerging domains like agentic AI and MCP (Model Context Protocol) servers, where security hardening remains inconsistent.

## Practical Implications for Builders and Security Teams

**For development teams:** The discovery of vulnerabilities this significant—and this old—underscores the urgent need to audit legacy code, patch aggressively, and assume that existing security assessments may have missed critical flaws. Teams should prepare for a wave of patches from major OS vendors and browser developers.

**For security practitioners:** Project Glasswing's multi-vendor coordination model may become a template for future coordinated disclosures. Security teams should expect to receive notifications for vulnerabilities spanning their entire infrastructure stack and should establish processes to prioritise patching based on exposure and severity.

**For organisations using AI:** The vulnerability discovery capability raises important questions about how organisations are securing their own AI systems. If Mythos can autonomously find thousands of OS-level bugs, what does that mean for the security posture of custom AI deployments, fine-tuned models, and agentic systems?

## Open Questions

- What is Mythos's false-positive rate, and how are vendors prioritising which discovered vulnerabilities to address first?
- Will autonomous vulnerability discovery become a standard offering from other AI labs, and what does that mean for the overall security landscape?
- How will this capability affect the vulnerability disclosure timeline and the window of exposure for zero-days?
- What guardrails are in place to prevent similar models from being used for offensive purposes?

The convergence of advanced AI capabilities and critical infrastructure security is creating both unprecedented opportunity and risk. Project Glasswing appears to be an intentional effort to steer the former toward patching rather than exploitation—but the industry will be watching closely to see if the pace of disclosure outstrips the pace of remediation.

---
**Source:** [Security Research](https://www.krebsonsecurity.com)