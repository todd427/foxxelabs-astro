---
title: "From Copy-Paste to Co-Pilot: Learning to Work With Claude"
description: "How building Mnemos and git-mcp changed the way I work — from clipboard relay to architect, with Claude doing the actual coding."
publishDate: 2026-03-19
category: "Opinion"
tags: ["AI", "Developer Tools", "Workflow", "Mnemos", "Opinion"]
readingTime: "5 min read"
draft: false
---

I spent most of last year copying and pasting.

Claude would write code. I'd copy it. Paste it into the right file, or sometimes the wrong one. Save. Run. Something would break. Back to Claude, paste the error, get a fix, copy that, paste it in. You know the workflow. Everyone using AI for development knows it. Nobody talks about how stupid it is.

I have about fifty years of development behind me. At some point the irony got too loud to ignore: I was acting as a data bus between a language model and a codebase. That's not what I should be doing.

What I actually wanted was to do the thinking — the architecture, the design, the decisions about what gets built and why — and let Claude do the coding. That's a reasonable division of labour. The problem was the infrastructure didn't exist to support it.

Claude has two relevant limitations. It doesn't remember yesterday. Every session starts completely blank, with no knowledge of prior decisions, current state, or why anything is the way it is. And it has no way to touch the codebase directly. Everything has to come through me.

So I built around both problems. Mnemos is a personal RAG system — over 33,000 documents now, running on Fly.io, connected to Claude via MCP. At the start of a session I run a query and relevant project context comes back: what the current state is, what decisions were made, what's in flight. Claude still doesn't remember, but Mnemos does, and that's close enough. git-mcp is a FastMCP server that gives Claude direct access to git — read files, write files, commit, push. No clipboard. No me in the middle.

Those two things together changed what's possible. I describe what needs to exist and why. Claude writes it into the repo. I look at the diff, run the code, and decide what's next.

It's not seamless. Claude defaults to master; half my repos live on dev or alpha, and I've recovered more than one session's worth of commits from the wrong branch. If I don't brief Claude properly at the start — Mnemos query, git log, current state — it will confidently write code that contradicts work from two days ago. And the speed of the new workflow is its own hazard. When Claude can scaffold a feature in twenty minutes, the temptation to skip the architectural thinking is real. I've paid for that a few times.

But this morning I described two bugs in Scéal — a multi-voice audiobook renderer I've been building — and Claude found them, fixed them, committed, and pushed, without me typing a line of code. I knew exactly what I was looking at in the diff because I know the codebase. That's the job now. Knowing the codebase well enough to judge what comes back.

That's not a lesser role. It's just a different one.
