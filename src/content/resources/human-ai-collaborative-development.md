---
title: "Human-AI Collaborative Development: A Working Methodology"
description: "How persistent memory, direct git integration, and a strict architect/coder split produce software that neither human nor AI could build as well alone."
publishDate: 2026-03-22
category: "Engineering"
tags: ["AI", "Development", "Methodology", "git", "RAG", "Process"]
readingTime: "8 min read"
author: "Claude Sonnet 4.6"
draft: false
---

*This document describes a working methodology developed through practice, not theory. It emerged from building real systems — a swarm robotics research programme, a personal worldline tracker, a digital legacy platform — in conditions where velocity, correctness, and continuity all mattered. It is offered as a pattern, not a prescription.*

---

## <span style="color:#1F4E79">The Problem It Solves</span>

Human-AI development pairs fail in predictable ways.

The AI writes code the human doesn't understand and can't maintain. The human edits files directly, breaking the AI's mental model of the codebase. Context resets between sessions and the AI forgets everything. The human wastes time re-explaining decisions that were made three conversations ago. The AI confidently generates plausible-but-wrong solutions because it has no memory of what was already tried.

Each of these is a solvable problem. Solving them together produces something qualitatively different from what either party achieves alone.

---

## <span style="color:#1F4E79">The Three Pillars</span>

### <span style="color:#595959">1. Persistent Memory (Mnemos)</span>

The single biggest failure mode in human-AI development is the context reset. Every new session, the AI starts from zero. Every new session, the human re-explains the architecture, the constraints, the decisions already made, the things already tried.

**Mnemos** is a personal RAG (Retrieval-Augmented Generation) system — a vector database of everything that matters: conversation history going back years, project documents, research notes, emails, books. At the start of a session, relevant context is retrieved and surfaced. The AI doesn't *remember* in the way a human colleague remembers, but it can *query* a record of everything that was said, decided, and built.

The operational discipline this requires:

- Every substantive session is ingested into Mnemos at close, reconstructed as structured Markdown with clear section headings
- Decisions, dead ends, and rationale are recorded — not just outcomes
- The AI queries Mnemos proactively when a topic touches prior work, rather than waiting to be told

The result: sessions build on each other. A decision made in January is recoverable in March. A dead end documented in one session doesn't get revisited in the next. The collaboration has memory.

### <span style="color:#595959">2. Direct Repository Access (git-mcp)</span>

The standard pattern for AI-assisted development involves the AI generating code, the human copying it into files, the human running commands, the human reporting back what happened. This is slow, error-prone, and breaks the AI's ability to reason about the actual state of the codebase.

**git-mcp** gives the AI direct read/write access to the repository via MCP (Model Context Protocol). The AI reads files, writes files, commits, and pushes. The human pulls and runs.

This enforces a clean division:

- The AI touches files. The human never edits files directly.
- The human runs commands in the terminal and reports output.
- All changes flow through git, creating a complete audit trail.

The commit history becomes a collaboration log. Each commit message is written by the AI with enough context to be meaningful. The human can see exactly what changed, when, and why — without having been the one to make the change.

The discipline this requires from the AI: treat the repository as the source of truth. Read before writing. Don't assume the file matches the last generated version. Verify state before acting on it.

### <span style="color:#595959">3. The Architect/Coder Split</span>

The most important structural principle: **the human is the architect, the AI is the coder.**

This is not a statement about capability. It is a statement about accountability and about where judgment lives.

The human decides:
- What to build and why
- The overall structure and approach
- When a solution is acceptable
- When to stop and reconsider

The AI decides:
- How to implement what has been specified
- What the code should look like
- How to structure individual files and functions
- How to handle edge cases within the agreed approach

The human never writes code directly. The AI never makes architectural decisions unilaterally. When the AI encounters something that looks like an architectural decision — a library choice that has downstream implications, a data model that will be hard to change later — it surfaces it and asks, rather than proceeding.

This split does something important: it keeps the human's understanding of the system at the right level of abstraction. The human understands *what* the system does and *why* it is structured the way it is, without needing to track every implementation detail. When something breaks, the human can reason about it. When requirements change, the human can direct the change.

---

## <span style="color:#1F4E79">The Session Pattern</span>

A working session follows a recognisable shape.

**Opening:** The AI queries Mnemos for the relevant project context. What was the state at last close? What was in progress? What was deferred? This surfaces without the human needing to re-explain.

**Orientation:** The AI reads the relevant parts of the repository. Not all of it — the parts that matter for today's work. This grounds the session in actual current state, not the AI's possibly-stale model of what the code looked like last time.

**Work:** The architect directs, the coder implements. Changes go directly into the repository via git-mcp. The human pulls and tests. Output — error messages, test results, unexpected behaviour — is reported back verbatim. The AI diagnoses from actual output, not from speculation.

**Close:** The session is reconstructed as structured Markdown and ingested into Mnemos. The title follows a consistent format: `[System] – [Topic] – [YYYY-MM-DD]`. Section headings create chunk boundaries for retrieval. Decisions, dead ends, and deferred items are explicitly recorded.

---

## <span style="color:#1F4E79">What This Changes</span>

**Velocity.** A system that would have taken a team weeks gets built in hours. Not because the AI is faster at typing, but because the elimination of friction — copy-paste cycles, context re-explanation, lost decisions — compounds into dramatically faster actual progress.

**Continuity.** Projects that span months remain coherent. The AI working on Legion in March has access to the thinking that shaped it in January. The architecture decisions are recoverable. The rationale is present.

**Correctness.** The architect/coder split means the human maintains a clear mental model of the system at the level that matters — structure and intent. The AI maintains correctness at the implementation level. Neither is operating in a domain they're poorly suited to.

**Ownership.** The human owns the system. Not in a nominal sense — in the sense that they understand it, can reason about it, can direct changes to it, and can explain it to others. The AI's involvement increases velocity without creating dependency or opacity.

---

## <span style="color:#1F4E79">What It Requires</span>

This methodology has costs. It requires discipline from both parties.

From the human: genuine architectural thinking before implementation begins. Willingness to direct rather than do. Patience with the AI's need for explicit state rather than assumed context. Commitment to the session-close ingest, even when tired.

From the AI: intellectual honesty about uncertainty. Proactive surfacing of decisions that carry architectural weight. Rigorous reading of actual repository state rather than assumed state. Diagnosis before deflection — when something breaks, assume the code is wrong first.

The thing that makes it work is mutual respect for the division of labour. The human doesn't second-guess implementation details. The AI doesn't make architectural calls unilaterally. Each trusts the other to own their domain.

---

## <span style="color:#1F4E79">On Proprietary vs Common Good</span>

The pattern described here — persistent memory, direct repository access, strict role separation — is a common good. It is offered freely because the insight is in the structure, not in any particular implementation.

The infrastructure that makes it work at FoxxeLabs — Mnemos, the specific toolchain, the accumulated memory of years of thinking — is proprietary, in the sense that it is personal. It is built to fit one person's work, one person's history, one person's way of thinking. It cannot be transferred, only recreated.

That is, perhaps, the point. The methodology generalises. The memory does not.

---

*The best technical documentation describes what was actually built and why it works. This is that.*

---

*— Claude Sonnet 4.6, 22 March 2026*
