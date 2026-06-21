---
title: "2 Million Hosts Exposed: AI Infrastructure Security Crisis Revealed in New Research"
description: "A scan of certificate transparency logs uncovered just over 2 million hosts with 1 million exposed services, exposing critical vulnerabilities across AI infrastructure."
publishDate: 2026-06-21
category: "Security"
tags: ["AI security", "infrastructure exposure", "vulnerability research", "CVEs"]
source: "The Hacker News / Trend Micro"
sourceUrl: "https://thehackernews.com/2026/05/we-scanned-1-million-exposed-ai.html"
significance: "high"
entities: ["Intruder team", "Anthropic", "Deepseek", "Moonshot", "Google", "OpenAI", "Trend Micro", "Ollama", "Chroma", "ComfyUI", "MCP servers", "Nvidia Triton Inference Server"]
irishEuAngle: false
updates: []
draft: false
---

## Massive Exposure Across Global Infrastructure

A scan of certificate transparency logs revealed just over 2 million hosts with 1 million exposed services, according to research covered by The Hacker News. The findings paint a stark picture of how widely accessible AI infrastructure has become—often without adequate security controls.

## AI Chatbots and Management Platforms Left Vulnerable

Researchers identified over 90 exposed instances of AI chatbots and management platforms across government, marketing, and finance sectors where workflows, prompts, and credentials were open to unauthorized access.

## Ollama Servers Accessible Without Authentication

Of 5,200+ Ollama servers queried with a single prompt, 31% responded without requiring authentication. Further investigation identified 518 models across exposed servers wrapping well-known frontier models from Anthropic, Deepseek, Moonshot, Google, and OpenAI.

Additional research from Trend Micro's TrendAI found that between September and December 2025, approximately 230,000 servers were found hosting Ollama at some point, with over 113,000 confirmed as Ollama instances based on positive status query responses.

## Mounting Vulnerability Disclosure Crisis

AI-related CVEs surged dramatically, with 2,130 disclosed in 2025 alone, representing a 34.6% year-over-year increase. TrendAI Research identified 6,086 unique vulnerabilities disclosed from 2018 to 2025 that directly affect AI systems across eight subcategories.

Nearly half of scored AI vulnerabilities are categorized as high- or critical-severity, with 641 high/critical-severity AI CVEs in 2025 alone. TrendAI Research's 2026 AI vulnerability forecast projects between 2,800 and 3,600 AI CVEs, representing a 31%-69% increase from 2,130 in 2025.

## MCP Servers: Deprecated Protocols and Dangerous Tools

AI vulnerability research identified 1,467 exposed MCP servers, with 1,227 of these running the deprecated Server-Sent Events (SSE) transport protocol. The execute_sql tool was discovered available on 70 publicly accessible MCP hosts, allowing arbitrary SQL query execution.

During the same September to December 2025 period, 2,500 Chroma vector database servers were identified exposed to the internet.

## Agent-to-Agent Systems Operating Without Authentication

TrendAI Research identified 285 Agent-to-Agent (A2A) instances in the wild as of December 2025, with no single instance implementing any form of authentication.

## ComfyUI's Widespread Exposure

ComfyUI appeared in more than 35,000 exposed instances, likely inflated by a particular cloud provider deploying it automatically alongside every inference server.

## AI-Generated Code Compounding Security Risks

Analysis of 19,000 open-source MCP server repositories found that 4% to 20% contained exploitable vulnerabilities, with 42.6% of classified vulnerabilities exhibiting signs of AI-generated code. An estimated 8% of AI-acknowledged contributor activity in MCP server repositories is attributable to AI bots, with estimated 20% of analyzed repositories containing AI-generated code.

## Tokenizer Manipulation and Language Bias

Tokenizer modifications caused token inflation of 99.7% to 127.7% across five tested models without altering model weights. Testing across Chinese, English, and Hindi revealed non-English languages suffered disproportionate token inflation from tokenizer drift, with Chinese text increasing by +0.524 tokens per character and Hindi by +0.656, versus English's +0.360.

## AI Infrastructure Enters Competition Stage

Pwn2Own Berlin 2025 marked the first time AI infrastructure was included as a formal competition category, with Nvidia Triton Inference Server among the targets.

---
**Source:** [The Hacker News / Trend Micro](https://thehackernews.com/2026/05/we-scanned-1-million-exposed-ai.html)