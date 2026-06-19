---
title: "Over 2 Million Exposed AI Hosts Discovered with Zero Authentication"
description: "Certificate transparency scanning reveals 1 million exposed AI services across 2M+ hosts, many deployed with no security controls."
publishDate: 2026-06-19
category: "Security"
tags: ["AI security", "exposed infrastructure", "authentication gaps"]
source: "The Hacker News"
sourceUrl: "https://thehackernews.com/2026/05/we-scanned-1-million-exposed-ai.html"
significance: "high"
entities: ["Intruder", "ClawdBot", "n8n", "Flowise", "Ollama", "MCP servers"]
irishEuAngle: false
updates: []
draft: false
---

## Massive Scale of Exposed AI Infrastructure

Over 2 million hosts with 1 million exposed AI services have been identified through certificate transparency logs scanning, according to research from Intruder. A significant number of these exposed AI hosts were deployed straight out of the box with no authentication in place—a critical security oversight that leaves them vulnerable to unauthorised access and exploitation.

## Unauthenticated AI Services Operating at Scale

Of 5,200+ Ollama servers queried, 31% responded to a basic prompt without requiring authentication, demonstrating how widespread the authentication gap has become across deployed AI infrastructure.

Over 90 exposed instances of agent management platforms including n8n and Flowise were identified across government, marketing, and finance sectors—sectors that typically handle sensitive data and should maintain strict access controls.

## ClawdBot Vulnerability Pace

ClawdBot, a self-hosted AI assistant, is averaging 2.6 CVEs per day, highlighting the rapid pace of vulnerability discovery in self-hosted AI deployments.

## Context: Growing AI Security Crisis

This discovery arrives amid a broader surge in AI security vulnerabilities. In 2025, 2,130 AI-related CVEs were disclosed, representing a 34.6% year-over-year increase. TrendAI Research analysis identified 6,086 unique vulnerabilities disclosed from 2018 to 2025 that directly affect AI systems, with nearly half of scored AI vulnerabilities categorized as high- or critical-severity.

Trend Micro also discovered 1,467 exposed MCP servers, representing a nearly threefold increase from initial findings. Of particular concern, 1,227 of those 1,467 exposed MCP servers are running the deprecated Server-Sent Events (SSE) transport protocol. An execute_sql tool was available on 70 publicly accessible MCP hosts, allowing unauthorised SQL query execution.

Expectations for 2026 point to further deterioration: between 2,800 and 3,600 AI CVEs are projected for 2026, representing a 31-69% increase from 2025.

---
**Source:** [The Hacker News](https://thehackernews.com/2026/05/we-scanned-1-million-exposed-ai.html)