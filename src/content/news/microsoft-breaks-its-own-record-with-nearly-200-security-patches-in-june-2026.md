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
updates: []
draft: false
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