---
title: "Major AI Security Flaws Hit Chrome's Gemini and Microsoft's Copilot"
description: "Critical vulnerabilities in Google Chrome's Gemini AI and Microsoft Copilot expose users to data theft and privilege escalation attacks."
publishDate: 2026-03-13
category: "Security"
tags: ["AI Security", "Vulnerabilities", "Chrome", "Microsoft"]
source: "Multiple Security Reports"
sourceUrl: "https://unit42.paloaltonetworks.com/chrome-gemini-vulnerability/"
draft: false
---

## Key Developments

A series of high-severity AI security vulnerabilities have emerged this week, highlighting critical flaws in mainstream AI integrations. Google patched CVE-2026-0628, a CVSS 8.8 vulnerability in Chrome's Gemini AI integration discovered by Palo Alto Networks Unit 42. The flaw allowed malicious extensions with basic permissions to hijack Gemini Live panels and access local files, cameras, and microphones without user consent.

Microsoft's March Patch Tuesday addressed multiple AI-related vulnerabilities, including CVE-2026-26144 (CVSS 7.5) affecting Copilot Agent mode through cross-site scripting attacks, and CVE-2026-26118 (CVSS 8.8), a server-side request forgery bug in Azure's Model Context Protocol server enabling privilege escalation.

Notably, CVE-2026-21536 represents a security milestone as the first vulnerability discovered by an AI agent (XBOW) and officially recognized with a CVE attribution.

## Industry Context

Recent research analyzing over 30,000 AI skills found that more than 25% contained at least one vulnerability. The CrowdStrike 2026 Global Threat Report revealed adversaries exploited legitimate GenAI tools at over 90 organizations, using malicious prompts to steal credentials and deploy ransomware.

With eCrime breakout times now averaging just 29 minutes—and the fastest recorded at 27 seconds—the stakes for AI security have never been higher. Over 32% of vulnerabilities in 2025 were exploited on or before CVE publication day.

## Practical Implications

For AI builders and users, these developments demand immediate action. Organizations must audit their AI tool integrations, particularly browser-based AI features and enterprise copilots. The Model Context Protocol vulnerabilities show how seemingly benign AI tools can silently exfiltrate entire chat histories.

With the EU AI Act taking full effect in August 2026, European organizations face additional compliance pressures. Ireland's National Digital and AI Strategy 2030 emphasizes documentation and transparency requirements that could help identify these vulnerabilities before exploitation.

## Open Questions

As AI agents begin discovering vulnerabilities autonomously, the security community faces new challenges in vulnerability disclosure and attribution. The effectiveness of AI-generated watermarking requirements under EU regulations remains untested against sophisticated attacks targeting AI infrastructure itself.

---
**Source:** [Multiple Security Reports](https://unit42.paloaltonetworks.com/chrome-gemini-vulnerability/)