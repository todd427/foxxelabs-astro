---
title: "The Accidental Revolution: How Claude Code Rewrote the Rules"
description: "It started with a command-line hack to change the music. Eighteen months later, Claude Code is generating half a billion dollars a year and redefining what software development looks like."
publishDate: 2026-03-22
category: "Engineering"
tags: ["AI", "Claude Code", "Anthropic", "Development", "Tools"]
readingTime: "7 min read"
author: "Todd McCaffrey"
draft: false
---

*It started with a command-line hack to change the music. Eighteen months later, Claude Code is generating half a billion dollars a year and redefining what software development looks like.*

---

In September 2024, a software engineer named Boris Cherny joined Anthropic with no particular mandate other than to explore. He began building command-line prototypes using the Claude API — getting familiar with the model, poking at edges, seeing what fell over. One early experiment connected Claude to AppleScript so it could report what music was playing in the office and change tracks on request. Cute, but trivial. Cherny moved on.

What changed everything was a conversation with product researcher Cat Wu, who was investigating how AI agents interact with computers. Cherny had a thought: what if the terminal could do more than play DJ? What if Claude could actually *read* files?

He gave the prototype filesystem access. And then — in a moment he later described as "mindblowing" — he watched Claude explore a codebase autonomously. It read a file. Followed an import. Read that file. Followed another import. Chained through the dependency graph until it had enough context to answer. No hand-holding. No scaffolding. Just a model that already knew how to do this, finally given the tools to do it.

"In AI, we talk about 'product overhang'," Cherny explained. "A model able to do something specific, but the product it runs in doesn't capture that capability. What I discovered was pure product overhang. The model could already do this. There just wasn't a product built around it."

---

## Two People and No Process

In November 2024 — exactly two months after Cherny's first prototype — a dogfooding-ready version was released internally at Anthropic. Day one: 20% of the engineering team was using it. Day five: 50%. There was no marketing, no launch strategy. Engineers just told other engineers.

By then, Sid Bidasaria had joined as engineer number two. The team had, by design, no formal processes. "We could work on pretty much whatever we wanted," Bidasaria said, "and so we just kept choosing the most promising ideas." He would go on to build Claude Code's subagents feature — a capability that took three days to ship, two of which were thrown away and rebuilt from scratch.

The internal debate about whether to release at all is perhaps the most interesting footnote in the product's history. The argument for keeping it internal was straightforward: if Claude Code gives Anthropic a measurable engineering advantage, why hand it to competitors? The counter-argument was philosophical. Anthropic is, at its core, a model safety company. It learns about safety and capability by putting tools in front of real users. Claude Code, if it was as compelling as the internal adoption suggested, would be one of the most information-rich safety experiments imaginable. Release won.

> *"We weren't even sure if we wanted to launch it publicly. We thought it could be our secret sauce."*
> — Boris Cherny, Founding Engineer, Claude Code

---

## The People Behind the Terminal

**Boris Cherny — Founding Engineer.** Joined Anthropic September 2024. Built the first prototype in weeks. Recognised the "product overhang" insight that made the tool real. The music-changing demo was a dead end; the filesystem demo was everything.

**Sid Bidasaria — Engineer #2, Subagents.** Arrived November 2024 and immediately saw what Cherny had built. Built the subagents feature — parallel Claude instances working a shared codebase — in three days, including two days' work scrapped and rebuilt. The "throw it away" instinct is a feature, not a bug.

**Cat Wu — Founding Product Manager.** Was researching AI agent computer use when a conversation with Cherny sparked the filesystem access idea. The product might not exist in its current form without that exchange — a reminder that the best PM work often looks like a conversation, not a roadmap.

---

## A Tool That Builds Itself

The technical choices are worth noting. Claude Code runs on TypeScript, React (using the Ink framework for terminal rendering), Yoga for layout, and Bun as the runtime. The stack was chosen deliberately to be "on distribution" — playing to the model's existing strengths rather than working around them.

The headline stat: approximately **90% of Claude Code's own codebase is written by Claude Code.** This is not a marketing claim. The team ships roughly five releases per engineer per day, iterating through ten or more prototypes before committing to any new feature. At that velocity, the only way to keep up is to let the tool eat its own tail.

**By the numbers:**

- $500M+ annualised revenue run rate by mid-2025
- 10× usage growth in three months post-GA launch (May 2025)
- 90% of Claude Code's own code written by Claude Code
- ~5 releases per engineer per day
- 67% increase in Anthropic PR throughput as headcount doubled
- 80%+ of Anthropic engineers use it daily — including the data scientists
- 2,000 Claude Code sessions to build a 100,000-line C compiler from scratch

---

## The Compiler That Proved the Point

The most dramatic demonstration of what Claude Code can do at scale came from Anthropic researcher Nicholas Carlini. He tasked 16 parallel Claude instances — an "agent team" — with a single goal: build a Rust-based C compiler capable of compiling the Linux kernel, from scratch, with no internet access.

The result, across nearly 2,000 Claude Code sessions and $20,000 in API costs: a clean-room 100,000-line compiler that builds Linux 6.9 on x86, ARM, and RISC-V. It compiles QEMU, FFmpeg, SQLite, PostgreSQL, and Redis. It passes 99% of the GCC torture test suite. And — the developer's true litmus test — it compiles and runs Doom.

No human wrote that compiler. A human designed the harness, supervised the process, and made architectural calls. But the code itself emerged from parallel agents negotiating a shared codebase, specialising roles, coalescing duplicates, and critiquing each other's design decisions. Carlini's term for this: "agent teams." His conclusion: we are early, and fully autonomous development comes with real risks, but the scope of what's achievable has expanded by an order of magnitude.

---

## Not Just for Developers

Cherny conceived Claude Code for software engineers — hence the name. The reality turned out broader. Anthropic's own legal team used it to prototype an internal phone-tree system to route queries to the right lawyers. Marketers generated hundreds of ad variations in minutes. Data scientists ran SQL queries without writing SQL. Designers made state management changes that, in Cherny's words, "you typically wouldn't see a designer making."

The pattern is consistent with what happens when you give a sufficiently capable tool to a sufficiently varied population: the use cases you didn't design for outnumber the ones you did. The name is already slightly wrong. That might be the best sign of all.

---

*Claude Code is available via the Claude Pro, Max, Team, and Enterprise plans, and through the Anthropic API. The Claude Code team is still hiring.*

*— Todd McCaffrey, FoxxeLabs, March 2026*
