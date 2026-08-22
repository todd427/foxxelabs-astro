---
title: "I Rebuilt Claude Code Without Knowing It"
description: "An independent path to the same architecture — persistent memory, direct repository access, and a strict division of labour. I got there second, and the parallel is still uncomfortably exact."
publishDate: 2026-03-22
updatedDate: 2026-08-22
category: "Engineering"
tags: ["AI", "Claude Code", "Development", "Methodology", "Mnemos", "git-mcp"]
readingTime: "8 min read"
author: "Todd McCaffrey"
draft: false
---

*An independent path to the same architecture — persistent memory, direct repository access, and a strict division of labour. I got there second, and the parallel is still uncomfortably exact.*

---

> **Correction, 22 August 2026.** This piece originally ran under the title *"I Built Claude Code Before Claude Code Existed"* and claimed priority over Anthropic's product. That claim was wrong and the dates are easy to check: Claude Code shipped as a research preview on 24 February 2025 and reached general availability on 22 May 2025. The first commit to Mnemos is 8 March 2026; git-mcp's is 15 March 2026. I built my stack roughly a year *after* Claude Code was public, without having read how it worked. That is convergence, not precedence, and the argument below never needed the stronger claim. The title and the affected passages have been corrected in place; the URL is unchanged. An incorrect credential in the author biography has also been removed.

---

In September 2024, a software engineer named Boris Cherny joined Anthropic and began building CLI prototypes. He gave Claude filesystem access, watched it traverse a codebase by following imports, and immediately understood what he was looking at. He called it "product overhang" — a model already capable of something, waiting for someone to build the right container around it.

Eighteen months later, in Letterkenny, Co. Donegal, I built the same three things. Not as elegantly. Not as a product. Just as a programmer who'd been doing this for fifty years and could see, plainly, what was broken about the way AI-assisted development worked — and what would fix it.

Claude Code was public by then. I knew it existed; most developers did. What I hadn't done was read how it actually worked, and I wasn't building against it. I was building against my own frustration, and I arrived at Cherny's architecture from the other side without noticing I was doing it.

That's the story I want to tell. Not that I got there first — I didn't — but that the design is convergent enough that an author in Donegal with a terminal and a grievance lands on the same three pillars a frontier lab does.

---

## What Was Broken

The standard pattern for AI-assisted development was painful in a specific way. The AI generated code. You copied it into files. You ran it. You reported back what happened. The AI generated more code. You copied that too.

Every session started from zero. The AI had no memory of the architecture decisions made last week, the dead ends explored last month, the constraints that ruled out the obvious solution two conversations ago. You re-explained everything, every time. The AI was fast but amnesiac. You had the memory but were constantly transcribing.

The other problem was trust in the wrong direction. You couldn't trust that the AI's model of your codebase matched reality, because it had never actually seen your codebase — it had only seen what you'd copied and pasted. So it would confidently generate code that assumed things that weren't true, or missed things that were.

Two problems. Two solutions. Both obvious in retrospect — which is exactly why more than one person found them.

---

## Solution One: Give It Hands

The first fix was direct repository access. Not "here is some code, tell me what's wrong with it" — but actual read/write access to the files, the ability to commit, the ability to push.

I built **git-mcp** for this: a lightweight MCP server that exposes git operations as tools Claude can call directly. Read a file. Write a file. Commit. Push. The AI touches the repository; I pull and run.

This sounds simple. The implications are not.

When the AI can read the actual file — not a copy-pasted excerpt, not a description of the file — it can reason correctly about state. When it writes directly to the repository, there's no transcription error. When it commits with a meaningful message, there's an audit trail. The commit history becomes the collaboration log.

It also enforces a discipline I hadn't fully articulated but had been groping toward: *the human doesn't edit files directly.* If I make a change by hand outside the workflow, the AI's model of the codebase diverges from reality. All changes go through git. The repository is the source of truth, and we both know it.

The rule I eventually settled on: read before writing, always. Verify state before acting on it. Don't assume the file matches the last generated version. This sounds obvious. It requires explicit discipline to maintain.

---

## Solution Two: Give It Memory

The second fix was persistent memory across sessions.

I'd been circling what would become **Mnemos** long before I framed it in those terms — it began as `toddric-rag`, a retrieval system over my own documents. Chat history. Project notes. Emails. Research. Books. Everything I'd thought about and written down, going back years.

The core insight was this: the AI doesn't need to *remember* in the way a human colleague remembers. It needs to be able to *query* a record of what was said, decided, and built. Those are different things, and the second is achievable.

At the close of every substantive session, I reconstruct the conversation as structured Markdown and ingest it. Decisions, dead ends, rationale — not just outcomes. Section headings create chunk boundaries for retrieval. The title format is consistent: `Claude – [topic] – [YYYY-MM-DD]`. At the start of the next session, relevant context is retrieved and surfaced. The AI doesn't start from zero. It starts from a brief that includes what was decided last time and why.

Mnemos held over 33,000 documents when this was written. When I'm working on Anseo, I can retrieve the architectural decisions that shaped it six months ago. When I'm debugging Legion, I can pull the context of what was already tried. The collaboration has memory because I built the memory system.

---

## The Architecture, Compared

When I finally read about how Claude Code works — really works, not the marketing version — the parallel was striking enough to be slightly unsettling.

Boris Cherny's insight was filesystem access: give the model tools to read and write files, and it can reason about codebases the way a developer does. That's git-mcp.

The Claude Code team's approach to iteration is to prototype fast and throw things away — five releases per engineer per day, ten prototypes per feature. The institutional memory for this is built into the product itself; Claude Code reads `CLAUDE.md` files for project context. That's Mnemos, approached differently.

The architect/coder split — the human decides what to build, the AI decides how — is described explicitly in Anthropic's writing about Claude Code. It's also the operating principle I'd arrived at on my own, and written up in my methodology notes, before I'd read theirs.

| Their stack | My stack |
|---|---|
| Filesystem access via built-in tools | git-mcp — read, write, commit, push |
| `CLAUDE.md` for project context | Mnemos — RAG over full history |
| Human supervises, AI codes | Architect/coder split |
| 90% of Claude Code written by Claude Code | Sessions build on sessions |
| Product-market fit via internal dogfooding | Personal fit via daily use on real projects |

The differences are real, and they matter. Claude Code is optimised for velocity — shipping fast, iterating faster, letting the model handle implementation details so the developer can focus on what to build next. My stack is optimised for *continuity* — a system that preserves the full context of decisions, that carries the rationale of a project forward across months, that assumes the developer cares about understanding the system and not just shipping it.

Cherny built for the typical developer. I built for me. Different threat model; same core insight.

---

## The Part That Wasn't Obvious

Here's what Cherny got right that I didn't, and why it matters.

Cherny immediately recognised the "product overhang" frame — the model could already do this, it just needed the container — and moved fast to release it publicly. The internal debate at Anthropic was whether to keep Claude Code as a competitive advantage. They decided to release, on the grounds that releasing teaches you more about safety and capability than hoarding does.

I didn't release. I built for myself, refined for myself, and never thought seriously about the general case.

That's not a criticism of me — I was building a personal tool, not a product, and personal tools don't need to generalise. But it's the key difference between an insight that changes an industry and an insight that changes your own working life. It's also, I suspect, why the priority framing tempted me in the first place: convergence feels less impressive than precedence, right up until you notice that convergence is the more interesting claim.

Cherny's version of this insight is now generating over $500M in annual revenue and has rewritten the productivity curves for most of Anthropic's engineering organisation. Mine has let me build Anseo, Mnemos, Sionnach, and a dozen other projects at a pace and quality I couldn't have managed otherwise. Different scales of impact; both real.

---

## What This Tells You

If you're a developer who hasn't yet structured your AI collaboration around these principles, the gap between what you're doing and what's possible is probably larger than you think.

The model can read your repository. Give it the tools to do so. The model has no memory between sessions. Build the memory system. The model shouldn't be making architectural decisions; you should. Define the split and hold to it.

None of this is magic. It's plumbing. But the plumbing is load-bearing.

The most useful thing Boris Cherny said about Claude Code wasn't about the product. It was the frame: *product overhang*. The capability is already there. The question is whether you've built the container to capture it.

I built mine from first principles, over months, without looking at how anyone else had solved it. The fact that a well-funded team at a frontier AI lab had already converged on the same architecture is, if anything, the point. The design isn't clever. It's just correct, and it's sitting there for anyone who gets annoyed enough to reach for it.

Build the container. The model is ready.

---

*Todd McCaffrey is the founder of FoxxeLabs and holds an MSc in Cyberpsychology from ATU Letterkenny. He has been programming for over fifty years and writing novels for thirty. He built git-mcp and Mnemos in March 2026, roughly a year after Claude Code went generally available, having never read how it worked — which he considers either instructive or embarrassing depending on the day.*
