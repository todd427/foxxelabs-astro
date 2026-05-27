---
title: "2.7 Million Exposed AI Services: The Infrastructure Crisis Nobody's Talking About"
description: "Security researchers reveal catastrophic misconfigurations across AI infrastructure—arbitrary code execution discovered in hours, not weeks."
publishDate: 2026-05-27
category: "Security"
tags: ["AI infrastructure", "CVE", "code execution", "DevOps"]
source: "The Hacker News / Krebs on Security"
sourceUrl: "https://thehackernews.com"
draft: false
---

## The Scale of Exposure Nobody Expected

When security researchers scanned just over 2 million hosts globally, they uncovered something genuinely alarming: 1 million exposed AI services, configured with security practices so loose they make legacy enterprise infrastructure look fortified by comparison.

The finding isn't theoretical. Within a couple of days of laboratory work, these same researchers achieved arbitrary code execution against a popular AI project. That's not a proof-of-concept buried in academic papers—it's a reproducible attack path that determined adversaries have likely already discovered.

## What Just Happened

Microsoft disclosed two critical vulnerabilities in its Semantic Kernel framework (CVE-2026-25592 and CVE-2026-26030) that weaponise injection attacks to bypass authentication and achieve unauthorised code execution. But these aren't isolated incidents. They're symptoms of a systemic problem: AI infrastructure is being deployed at velocity without the operational security practices that matured software teams consider baseline.

The vulnerability timeline tells the real story. The gap between discovery and exploitation has collapsed from weeks to hours. In 2025 alone, 2,130 AI-related CVEs were disclosed—a 34.6% year-over-year increase. Nearly half scored as high or critical severity.

## Why This Matters for Irish and European Builders

For enterprises across Ireland and the EU navigating both AI adoption and GDPR compliance, this creates an uncomfortable tension. You're under pressure to integrate AI services quickly—for competitiveness, for cost reduction, for automation—but the infrastructure supporting those services is fundamentally unstable.

European organisations under the EU AI Act face additional scrutiny. High-risk AI systems require documented risk assessments and technical documentation. Deploying on exposed, misconfigured infrastructure doesn't just create security debt—it creates compliance liability. An AI system running on compromised infrastructure isn't just vulnerable; it's potentially non-compliant with Article 15 technical documentation requirements.

## The Practical Reality

If you're deploying AI services, this research should trigger an immediate audit:

- **Inventory your AI infrastructure**: Map every AI service, model endpoint, and API integration your organisation runs or consumes
- **Apply fundamental hygiene**: Network segmentation, API authentication enforcement, least-privilege access controls
- **Patch Microsoft Semantic Kernel immediately** if you're using it
- **Monitor exploitation indicators**: Rapid code execution timelines mean detection windows are shrinking
- **Document your risk posture**: For EU AI Act compliance, you need explicit documentation of security decisions

## The Uncomfortable Question

Why did security researchers discover such widespread misconfigurations in AI infrastructure when similar patterns in web applications would be treated as critical? Part of the answer is maturity. AI deployment tooling is young. DevOps practices around containerised inference, model serving, and API security are still crystallising. But that's not an excuse—it's a deadline.

For Irish enterprises and European teams, the implication is clear: rapid AI adoption without operational maturity isn't just a technical risk. It's a competitive and compliance liability you can't afford.

---
**Source:** [The Hacker News / Krebs on Security](https://thehackernews.com)