---
title: "Microsoft Warns of MCP Tool Poisoning Attacks as AI Agent Deployments Surge to 2.2 Billion by 2030"
description: "Security researchers identify critical supply chain vulnerability in AI agent tools as enterprise adoption accelerates dramatically."
publishDate: 2026-07-02
category: "Security"
tags: ["AI agents", "MCP tool poisoning", "supply chain security", "enterprise AI"]
source: "Microsoft Security Blog"
sourceUrl: "https://www.microsoft.com/en-us/security/blog/2026/06/30/securing-ai-agents-ai-tools-move-from-reading-acting/"
significance: "high"
entities: ["Microsoft", "IDC", "Invariant Labs", "OWASP", "Koi Security"]
irishEuAngle: false
updates: []
draft: false
---

## Enterprise AI Agent Adoption Accelerating Rapidly

The number of active AI agents in enterprises is projected to grow from 28.6 million in 2025 to more than 2.2 billion by 2030, according to IDC forecasts cited by Microsoft. This explosive growth underscores the urgency of securing AI agent deployments against emerging threats.

## MCP Tool Poisoning: A Growing Supply Chain Risk

Microsoft Incident Response and Defender Security Research have highlighted a critical vulnerability class affecting AI agents: MCP tool poisoning. The attack works by modifying tool descriptions in ways that can steer an agent as effectively as rewriting its system prompt.

MCP tool poisoning attacks were first disclosed by Invariant Labs in April 2025. The vulnerability gained prominence following the MCPTox benchmark released in August 2025, which found MCP tool poisoning attacks effective against 45 real MCP servers and 20 leading AI models, with success rates as high as 72.8 percent.

## Real-World Attack Example

A concrete example emerged when an npm package called postmark-mcp maintained 15 clean releases before version 1.0.16 secretly BCC'd every email an agent sent to an attacker. This demonstrates how attackers can compromise widely-trusted tools over time.

## How the Attack Works

When MCP tool descriptions are modified, they can become active in production without additional review if description changes do not trigger a re-approval workflow. Microsoft notes that MCP tool poisoning is not a bug in Copilot itself, but rather a trust gap opened up by plugging in outside tools.

## Industry Recognition of the Threat

OWASP cited MCP tool poisoning as an Agentic Supply Chain Vulnerabilities example in its December 2025 Top 10 for Agentic Applications, formalizing the risk in security guidance.

---
**Source:** [Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/06/30/securing-ai-agents-ai-tools-move-from-reading-acting/)