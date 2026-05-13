---
title: "AI Infrastructure at Scale: 2 Million Hosts Exposed, 90+ Instances Compromised Across EU Sectors"
description: "Investigation reveals unprecedented vulnerability in AI services: 1M exposed instances across government, finance, and marketing with open access to chatbots, workflows, and user data."
publishDate: 2026-05-13
category: "Security"
tags: ["AI Security", "Infrastructure Vulnerability", "Data Exposure"]
source: "Security Research Investigation"
sourceUrl: "https://krebsonsecurity.com"
draft: false
---

## AI Infrastructure at Scale: 2 Million Hosts Exposed, 90+ Instances Compromised Across EU Sectors

### Key Developments

A comprehensive investigation of exposed AI infrastructure has uncovered a crisis of scale: researchers scanned just over 2 million hosts and discovered more than 1 million exposed AI services. The findings are stark—**AI infrastructure is more vulnerable, exposed, and misconfigured than any other software category previously investigated**.

The scan identified over 90 exposed instances across government, marketing, and finance sectors within Europe. These weren't minor misconfigurations. Researchers found that chatbots, workflows, prompts, and outbound access were entirely open to potential attackers who could:

- Modify workflows and automation pipelines
- Redirect traffic to malicious endpoints
- Extract sensitive user data
- Poison AI responses with false or harmful information

The timing is critical: this discovery arrives just months before the EU AI Act's August 2026 enforcement deadline for high-risk systems, which includes many of these exposed AI services.

### Industry Context

The vulnerability landscape is expanding faster than defenses can keep pace. In 2025 alone, AI-related CVEs surged to 2,130 disclosures—a 34.6% year-over-year increase. Nearly half of scored AI vulnerabilities are categorized as high- or critical-severity, with emerging attack vectors in agentic AI systems and MCP (Model Context Protocol) servers.

Parallel research validates the severity: on January 27, 2026, OpenSSL announced 12 new zero-day vulnerabilities, and AISLE's AI system discovered every single one. Firefox 150, released this week, includes fixes for 271 vulnerabilities identified using an early version of Claude Mythos Preview—demonstrating both the breadth of vulnerability discovery and the potential for AI-powered security tooling.

### Practical Implications for Irish and European Builders

For organisations across Ireland and the EU operating AI services:

1. **Immediate audit required**: If your organisation exposes AI services—chatbots, workflow engines, or prompt management systems—conduct an urgent inventory of what's publicly accessible. The 2 million host scan suggests most organisations haven't completed this exercise.

2. **Configuration hardening**: Assume default configurations are vulnerable. Access controls, API authentication, and network segmentation must be revisited as baseline controls.

3. **Compliance acceleration**: The August 2026 AI Act deadline now carries concrete security implications. High-risk AI systems must demonstrate adequate security controls or face enforcement action.

4. **Supply chain visibility**: The exposed instances spanned government, finance, and marketing—suggesting vulnerabilities exist across sectors and supply chains. Third-party AI service audits are now essential.

### Open Questions

- How many organisations in Ireland and the EU are aware their AI infrastructure is exposed?
- What enforcement mechanisms will the EU Commission deploy when it discovers government or regulated sector AI systems remain misconfigured after August 2026?
- Will the AI Act's high-risk classification trigger mandatory security certification requirements?
- How will liability frameworks evolve as AI security breaches scale?

The investigation underscores a fundamental gap: AI deployment velocity has outpaced security maturity across Europe. Remediation must begin immediately.

---
**Source:** [Security Research Investigation](https://krebsonsecurity.com)