---
title: "From Copy-Paste to Claude Code — What the Data Shows"
description: "Over eighteen months, the production model for software development at FoxxeLabs changed three times. Each change restructured the relationship between human and machine so fundamentally that the previous era's benchmarks became meaningless."
publishDate: 2026-03-25
category: "Opinion"
tags: ["AI", "Claude Code", "Development", "Productivity", "Opinion"]
readingTime: "5 min read"
author: "Todd McCaffrey"
draft: true
---

In January 2026, building Anseo — a community platform for Irish students — took fourteen days and roughly forty hours. A standard estimate for the same Django project would have been 360 hours over six months.

That gap isn't skill. It's tooling.

Over the past eighteen months, the production model for software development at FoxxeLabs changed three times. Each change restructured the relationship between human and machine so fundamentally that the previous era's benchmarks became meaningless.

## Era one: the clipboard

Describe a problem. Claude generates code. Copy it. Paste it into the right file. Run it. Break it. Paste the error back. Repeat. It works. It's also a strange use of the technology — the human as data bus, shuttling text between a language model and a codebase one clipboard operation at a time. Claude does the reasoning; the developer does the carrying.

Projects got built. Slowly. The bottleneck was always the human in the middle.

## Era two: git-mcp

A Model Context Protocol server gave Claude direct read/write access to GitHub repositories. No clipboard. The model reads files, makes changes, commits, pushes. The developer reviews the diff. The transition is visible in the commit history: the author field changes from a human name to `Claude (git-mcp) <git-mcp@foxxelabs.ie>`. That timestamp — March 2026 — marks where the friction dropped by roughly eighty percent.

## Era three: Claude Code

The terminal. Filesystem access. The ability to run tests, catch errors, and deploy. Claude Code handles execution; the human handles judgment. The commit messages shift style — structured `feat:/fix:/docs:` prefixes, consistent and unsentimental — because they're no longer written by a person under pressure. The system has no reason to cut corners on documentation.

The effect on project creation rate is measurable. Pre-2025: roughly one new project every two weeks. January–February 2026: one every two days. March 2026: nearly two per week. A 3× acceleration coinciding precisely with Claude Code adoption.

---

## The mechanism isn't more ideas

This is the part that gets misread. The tools didn't make anyone more creative. What they did was lower the threshold below which a known-good idea gets executed.

SlamBridge — a bridge bidding trainer — is the example. Handling the ACOL bidding system had been on a list for months. In clipboard-era hours, the implementation cost wasn't worth it. In Claude Code, it was a morning's work. The idea didn't change. The friction did.

GitHub's own data tells the same story at scale. In 2025, the platform added 121 million new repositories — its biggest year ever, more than 230 new repos created every minute. AI-related repositories grew 178% year-on-year. Solo-founded startups surged to 36% of all new companies. Anthropic CEO Dario Amodei put the probability of the first billion-dollar one-person company arriving by 2026 at 70–80%.

The wave isn't coming. It's already here, and most people are still arguing about whether it's real.

---

## The new bottleneck

When implementation friction disappears, what remains? Judgment. Knowing what to build. Knowing when what came back is wrong. Knowing what matters and what doesn't.

That's not a lesser role. It's harder than writing the code was. Code either runs or it doesn't. Judgment has no such clean test. And with the barrier to starting effectively at zero, the question that used to be *can I build this?* has become *should I?*

Completion rate is now the metric that matters. Starting is free. Finishing still costs something.

The tools have changed. The standards haven't.

---

*Todd McCaffrey is a New York Times bestselling author, founder of FoxxeLabs Limited, and an MSc candidate in Cyberpsychology at ATU Letterkenny. This piece was written in collaboration with Claude (Anthropic).*
