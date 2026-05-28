---
title: "Anthropic's MCP Tunnels and Agent Sandboxes: Why Enterprise Prompt Engineering Just Became Infrastructure"
description: "Anthropic's Code with Claude London event unveils sandboxed agents and secure internal system access—redefining how enterprises deploy AI without exposing infrastructure."
publishDate: 2026-05-22
category: "Industry"
tags: ["Claude Agents", "Enterprise AI", "MCP Tunnels", "AI Infrastructure"]
source: "Anthropic News"
sourceUrl: "https://anthropic.com/news"
entities: ["Anthropic", "Claude", "MCP tunnels", "Code with Claude London", "EU AI Act", "Article 5", "Article 6", "EDPB", "OpenAI", "Project Prometheus"]
significance: "high"
irishEuAngle: true
draft: false
---

## What Happened

Anthropic held its first dedicated developer event in Europe—Code with Claude London—where it announced two critical infrastructure features for Claude Agents: sandboxes that allow companies to run agents on their own infrastructure, and "MCP tunnels" that enable those agents to reach internal systems without exposing them to the public internet.

These features mark a significant shift in how enterprises think about deploying AI agents: no longer as black-box external services, but as controllable, infrastructure-native systems that respect organizational boundaries.

## Why This Matters

The traditional prompt engineering conversation—crafting the perfect instruction, adding examples, using chain-of-thought reasoning—has become largely obsolete as AI systems move toward agent deployment. What's emerged in its place is **context engineering**: the art of defining not just what an agent should do, but what it should *not* do, when to ask for human approval, what systems it can trust, and what constitutes success.

MCP tunnels represent a maturation of this thinking. By allowing agents to access internal systems securely without public exposure, Anthropic is acknowledging a critical enterprise concern: security and control are non-negotiable requirements for AI adoption, not nice-to-haves.

For European enterprises—particularly those subject to the EU AI Act's high-risk classifications and data residency requirements—this is significant. Sandboxed, internally-deployed agents mean you maintain data sovereignty while gaining AI capabilities.

## Practical Implications for Builders

**For Enterprise Teams:**
- You can now deploy Claude agents against internal APIs, databases, and systems without routing sensitive data through external endpoints
- Sandboxes provide isolation: agents can be constrained to specific operations, reducing blast radius for mistakes or misuse
- MCP tunnels enable secure, authenticated access to legacy systems without architectural refactoring

**For Prompt/Context Engineers:**
- Your job now involves defining guardrails and boundaries as much as writing instructions
- You need to think about failure modes at scale: what happens when an agent has access to production systems?
- Testing frameworks and evaluation become critical—you can't just iterate on examples anymore

**For European Compliance Teams:**
- Infrastructure isolation supports Article 5 and Article 6 compliance (lawful basis, data minimization)
- Internal deployment reduces data residency risks compared to cloud-only alternatives
- Audit trails from sandboxed execution provide evidence of responsible AI deployment

## Open Questions

1. **MCP Tunnel Performance:** How do latency and throughput compare to direct API calls, and what's the overhead for security inspection?
2. **Sandbox Escape Vectors:** What's the threat model? How resistant are sandboxes to prompt injection attacks designed to break containment?
3. **European Regulatory Recognition:** Will EDPB or national regulators formally recognize sandboxed, internal deployment as a sufficient control for high-risk AI systems?
4. **Interoperability:** Can MCP tunnels work with non-Claude tools, or are they Anthropic-specific infrastructure?

## The London Signal

The timing and location matter. London has become central to the European AI ecosystem—OpenAI, Anthropic, and Project Prometheus have all announced substantial presences. Anthropic's inaugural European developer event signals investment in the region and recognition that European enterprises have different compliance and security requirements than US counterparts.

For Irish and European builders, this is a cue: the future of prompt engineering isn't about clever wording—it's about infrastructure, control, and guardrails. If you're building agent-based systems, you need to think like infrastructure engineers, not copywriters.

---
**Source:** [Anthropic News](https://anthropic.com/news)