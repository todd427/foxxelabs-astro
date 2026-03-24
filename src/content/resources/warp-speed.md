---
title: "Warp Speed"
description: "Fifty years of software development, an AI coding partner, and the question of what the human is actually for."
publishDate: 2026-03-24
category: "Engineering"
tags: ["AI", "Claude", "Development", "Mnemos", "Human-AI Collaboration"]
readingTime: "6 min read"
author: "Todd McCaffrey"
draft: false
---

*Architect and Coder*

---

When I started college at Lehigh, I took an elective — Urban and World Systems Dynamics — built around Jay Forrester's World2 model. FORTRAN IV, running on the university mainframe. Population, industry, pollution, resources, all grinding forward through simulated time toward, usually, collapse.

For my class project the goal was to add what Forrester had left out: how people react. The growth of knowledge as a variable. First came teaching myself BASIC to work through the idea — writing to paper tape — then FORTRAN IV on punch cards to build it. Got an A+.

Then, because it had been so much fun, CDC Assembly language.

---

That was 1974. Fifty years later, same pattern: find a problem, discover the right tool doesn't exist yet, build it.

---

## The problem

Running a small AI research lab in Letterkenny — alongside an MSc in cyberpsychology, novels, and a community platform for Irish students — means twenty-odd active projects at any given moment. For the first several months of working with Claude, something was badly wrong.

Every session started from zero. No memory of the previous day. No access to the codebase. No context for decisions already made. A quarter of every session went on re-establishing the situation — here's the project, here's what happened last week, let me paste the file. The most capable contractor imaginable, showing up every morning with amnesia.

The fix, unsurprisingly, was to build something.

---

## What got built

First: a personal RAG system called Mnemos. Every conversation, every research document, every commit — 56,000 documents going back years. At the start of each session a query surfaces relevant context and drops it in. Claude arrives knowing what we've been working on, why certain decisions were made, what was tried and abandoned.

Second: a Model Context Protocol server called git-mcp. Direct read/write access to GitHub. Claude can read files, write files, commit, push. No copy-paste. No file uploads. The codebase is just there.

Third, and hardest: a discipline. Architect and coder. The human directs; Claude executes within that direction. Ownership of the architecture stays on the human side. Maintaining that boundary under pressure — when it's tempting to just ask Claude what to do next — takes more effort than it sounds.

---

## What changed — and what didn't

*SlamBridge*, a bridge bidding trainer, was built in 12 calendar days: 8 active development days, 16 sessions, 20-odd bugs squashed, live at launch. The original estimate someone ran for *Anseo's* MVP was 360 hours over 24 weeks. The actual trajectory was faster — but not because problems disappeared.

The first architecture was sometimes wrong. What came back was sometimes plausible-looking code that failed. A session that should have taken an hour took four because the approach was wrong — and that failure was as visible as anything else. When Claude is writing and you're not, there's nowhere to hide. Your own thinking becomes clearer, including the gaps in it. The bottleneck moved, but it moved to a harder place. Mechanical execution is easy to fake. Judgment isn't.

---

## An observation

A few weeks ago Anthropic released Claude Code. It has three core components: direct access to your codebase, persistent memory across sessions, and a defined role split where the developer directs and the AI executes.

In technology, simultaneous independent discovery is more common than people acknowledge. The telephone. Calculus. Natural selection. When a problem is real enough and the tools are ready enough, more than one person finds the answer. The problem space doesn't care who gets there first.

---

## What the human is for:

If one person with the right setup can produce several staff-days of output in a session, the obvious question is: what does that mean for teams? For companies? For how software development gets done?

After eighteen months inside it: the human is for judgment. Knowing what to build. Knowing when what came back is wrong. Knowing what matters and what doesn't.

That's not a diminished role. It's the hard part. The part that fifty years of writing code — starting with paper tape and punch cards in 1974 — prepares you for.

It just looks different from the outside than it used to.

---

*Todd McCaffrey is a New York Times bestselling author, founder of FoxxeLabs Limited, and an MSc candidate in Cyberpsychology at ATU Letterkenny. He builds things at [foxxelabs.ie](https://foxxelabs.ie).*
