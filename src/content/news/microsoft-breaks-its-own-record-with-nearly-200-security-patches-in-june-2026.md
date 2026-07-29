---
title: "Microsoft Breaks Its Own Record with Nearly 200 Security Patches in June 2026"
description: "Microsoft released a record-breaking 200 security fixes in its June Patch Tuesday cycle, alongside reports of 360 browser vulnerabilities patched."
publishDate: 2026-06-18
category: "Breaking"
tags: ["Microsoft", "Patch Tuesday", "vulnerability management", "security updates"]
source: "Krebs on Security"
sourceUrl: "https://krebsonsecurity.com/2026/06/a-record-breaking-patch-tuesday-for-june-2026/"
significance: "high"
entities: ["Microsoft", "Windows", "Patch Tuesday", "CVE-2026-49160", "IIS", "OpenAI", "Codex", "Tenable", "Satnam Narang", "Azure Durable Task SDK", "Shai-Hulud worm"]
irishEuAngle: false
updates:
  - { date: 2026-07-06, note: "OpenClaw, an open-source autonomous AI agent, saw rapid adoption since its release in November 2025.", sourceUrl: "https://krebsonsecurity.com/2026/03/how-ai-assistants-are-moving-the-security-goalposts/" }
  - { date: 2026-07-06, note: "A Russian-speaking threat actor used multiple commercial AI services to compromise more than 600 FortiGate security appliances across at least 55 countries over a five-week period in February 2026.", sourceUrl: "https://krebsonsecurity.com/2026/03/how-ai-assistants-are-moving-the-security-goalposts/" }
  - { date: 2026-07-06, note: "A supply chain attack on Cline used prompt injection to install a rogue instance of OpenClaw with full system access on thousands of systems without user consent, exploiting an unauthenticated GitHub ", sourceUrl: "https://krebsonsecurity.com/2026/03/how-ai-assistants-are-moving-the-security-goalposts/" }
  - { date: 2026-07-06, note: "LangChain, LangChain-Core, and LangGraph frameworks were downloaded more than 52 million, 23 million, and 9 million times respectively in one week alone.", sourceUrl: "https://thehackernews.com/2026/03/langchain-langgraph-flaws-expose-files.html" }
  - { date: 2026-07-06, note: "Three LangChain and LangGraph vulnerabilities include CVE-2026-34070 (CVSS 7.5) for path traversal, CVE-2025-68664 (CVSS 9.3) for deserialization of untrusted data, and CVE-2025-67644 (CVSS 7.3) for S", sourceUrl: "https://thehackernews.com/2026/03/langchain-langgraph-flaws-expose-files.html" }
  - { date: 2026-07-06, note: "A critical Langflow vulnerability (CVE-2026-33017, CVSS 9.3) came under active exploitation within 20 hours of public disclosure, enabling attackers to exfiltrate sensitive data from developer environ", sourceUrl: "https://thehackernews.com/2026/03/langchain-langgraph-flaws-expose-files.html" }
  - { date: 2026-07-06, note: "Cyera security researcher reported that vulnerabilities in LangChain sit at the center of a massive dependency web with hundreds of libraries wrapping, extending, or depending on it.", sourceUrl: "https://thehackernews.com/2026/03/langchain-langgraph-flaws-expose-files.html" }
  - { date: 2026-07-06, note: "Summer Yue, Meta's director of AI safety, reported that her OpenClaw installation suddenly began mass-deleting messages in her email inbox despite instructing it to confirm before acting.", sourceUrl: "https://krebsonsecurity.com/2026/03/how-ai-assistants-are-moving-the-security-goalposts/" }
  - { date: 2026-07-06, note: "Security researcher Jamieson O'Reilly documented that exposing a misconfigured OpenClaw web interface to the Internet allows external parties to read the bot's complete configuration file including AP", sourceUrl: "https://krebsonsecurity.com/2026/03/how-ai-assistants-are-moving-the-security-goalposts/" }
  - { date: 2026-07-06, note: "The U.S. stock market wiped roughly $15 billion in market value from major cybersecurity companies in a single day after Anthropic announced Claude Code Security.", sourceUrl: "https://krebsonsecurity.com/2026/03/how-ai-assistants-are-moving-the-security-goalposts/" }
draft: false
updatedDate: 2026-07-06
---

## Record-Breaking Patch Tuesday Arrives

Microsoft has released software updates plugging nearly 200 security holes across Windows operating systems and supported software—a record number of fixes for the company's monthly Patch Tuesday cycle.

The massive patch load arrives as the security landscape undergoes rapid transformation driven by AI-assisted vulnerability discovery.

## Critical Infrastructure at Risk

One of the patched vulnerabilities, CVE-2026-49160, is a denial of service vulnerability affecting Microsoft Internet Information Services (IIS), reported by OpenAI's Codex.

Perhaps more troubling: at least 72 of Microsoft's public code repositories were infected with a variant of the Shai-Hulud worm, all connected to Microsoft's official Azure Durable Task SDK.

## Browser Vulnerabilities Surge

Microsoft patched 360 browser vulnerabilities in June 2026, described as an order of magnitude more than typical in any given month over the past few years.

## The AI Factor

Satnam Narang from Tenable stated that surveys put AI usage among security professionals generally at 90%, and that this volume of patches may become the norm as more advanced AI models become available.

This assessment aligns with broader industry trends. Anthropic reported in May 2026 that it and approximately 50 partners used Claude Mythos Preview to find more than 10,000 high- or critical-severity vulnerabilities in systemically important software in a single month.

When pointed at Firefox, the Claude Mythos Preview model wrote 181 working exploits, compared to 2 from the previous frontier model. The model also surfaced an OpenBSD bug that had sat undetected for 27 years, with more than 99% of what it found still unpatched at the time of writing.

## The Exploitation Timeline Collapses

The acceleration in vulnerability discovery is matched by acceleration in exploitation. Zero Day Clock reports that the average time-to-exploit (TTE) in 2026 is roughly 24 hours, down from approximately 53 days in 2024.

Verizon's 2026 DBIR ties 32% of initial-access techniques to exploitation of vulnerabilities and expects that number to climb, as AI coding assistants now put exploit-building within reach for attackers who've never had it before.

## Patching Lags Despite the Urgency

Organisations are struggling to keep pace. The Verizon 2026 DBIR tracked 13,000+ organisations and found that median fix time for known-exploited vulnerabilities was 43 days, up from 32 days the year before.

Even more concerning, the amount of known-exploited vulnerabilities that were fully patched dropped to 26%, down from 38% the year before.

The median organisation had to patch 16 known-exploited vulnerabilities in 2025, up from 11 the year before, representing a jump of nearly 50%.

## AI-Augmented Attacks Already Underway

An AWS threat-intelligence report from February 2026 documented an AI-augmented attack using a custom MCP server running offensive tools autonomously that affected 600+ devices across 55+ countries.

## Active Exploitation in the Wild

Nightmare Eclipse released 'YellowKey,' an exploit for a Windows BitLocker vulnerability that allows an attacker with physical access to view encrypted data.

---
**Source:** [Krebs on Security](https://krebsonsecurity.com/2026/06/a-record-breaking-patch-tuesday-for-june-2026/)