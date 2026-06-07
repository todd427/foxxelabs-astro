---
title: "Anthropic's Managed Agents Now Support Self-Hosted Sandboxes and Private MCP Servers"
description: "Anthropic expands Claude Managed Agents with public beta self-hosted sandboxes, enabling enterprises to execute tools in controlled environments while maintaining data sovereignty."
publishDate: 2026-06-07
category: "Industry"
tags: ["Claude", "Managed Agents", "Enterprise AI", "MCP"]
source: "Anthropic"
sourceUrl: "https://anthropic.com/news"
significance: "high"
entities: ["Anthropic", "Claude", "Model Context Protocol", "Claude Partner Network"]
irishEuAngle: true
updates: []
draft: false
---

## Anthropic Advances Enterprise AI Control with Self-Hosted Agent Sandboxes

### Key Developments

AnthropIC has announced that Claude Managed Agents can now operate within self-hosted sandboxes in public beta, a significant step forward for enterprises requiring strict control over tool execution environments. The update allows organisations to connect agents to private Model Context Protocol (MCP) servers, with both the execution environment and services running within enterprise-defined boundaries.

This development separates the agent orchestration layer—which remains on Anthropic's infrastructure—from the tool execution layer, which can now run on customer infrastructure. The approach balances Anthropic's managed service benefits with the control and data sovereignty requirements of larger organisations.

### Why This Matters for European Enterprises

For Irish and EU organisations, this development carries particular weight given the region's stringent data protection requirements. Under GDPR and emerging AI regulations, many enterprises have been hesitant to deploy agent-based systems without guarantees that sensitive data processing remains within their control. Self-hosted sandboxes address this friction point directly.

The ability to run tool execution in private environments while maintaining orchestration on Anthropic's platform creates a hybrid model that satisfies both regulatory compliance needs and operational efficiency. This is especially relevant for regulated industries—financial services, healthcare, and public sector—where data residency requirements are non-negotiable.

### Practical Implications for Builders

Developers and organisations can now:

- **Execute tools in controlled environments**: Connect agents to internal APIs, databases, and services without exposing them through public channels
- **Maintain data sovereignty**: Process sensitive information within enterprise infrastructure while leveraging Claude's agent capabilities
- **Reduce compliance friction**: Satisfy GDPR, HIPAA, and sectoral regulations by keeping data processing local
- **Build hybrid architectures**: Orchestrate complex workflows that combine Anthropic's managed service with custom infrastructure

For prompt engineers and AI builders, this means designing agents with clear separation between what happens on Anthropic's platform versus what executes locally—a consideration that should inform prompts, error handling, and service design.

### Open Questions

Several aspects remain to be clarified:

- **Pricing model**: How will self-hosted sandboxes affect billing compared to fully managed execution?
- **Latency and performance**: What are realistic expectations for tool execution speed across hybrid architectures?
- **MCP server maturity**: Which private MCP integrations are currently stable and supported?
- **Scaling patterns**: How do these sandboxes perform under high-concurrency agent deployments?

Anthropic also announced the Claude Partner Hub and Services Track on June 6, 2026, expanding certification pathways for service providers—potentially beneficial for Irish and EU consultancies building Claude-based solutions.

### What's Next

The public beta status suggests continued refinement is likely. Organisations should monitor release notes for performance improvements and expanded integration options. For EU enterprises particularly, this represents a meaningful step toward production-grade agentic AI systems that respect regional regulatory frameworks.

---
**Source:** [Anthropic](https://anthropic.com/news)