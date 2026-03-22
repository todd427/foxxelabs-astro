---
title: "Two Claudes Walk Into a Problem"
description: "I built a tool that runs two independent Claude sessions side by side, lets them argue, and lets you fire one's answer at the other. It's the most useful AI tool I've made."
publishDate: 2026-03-22
category: "Engineering"
tags: ["AI", "Claude", "Tools", "Architecture", "Duel", "FoxxeLabs"]
readingTime: "6 min read"
author: "Todd McCaffrey"
draft: false
---

*I built a tool that runs two independent Claude sessions side by side, lets them argue, and lets you fire one's answer at the other. It's the most useful AI tool I've made.*

---

I've been using AI as a thinking partner for architecture work for a couple of years now. The limitation I kept hitting wasn't capability — the models are capable enough. It was *perspective*. A single session converges. You ask a question, get an answer, ask a follow-up, and the conversation builds toward something coherent. That coherence is the problem: coherent isn't the same as correct, and a single interlocutor — human or AI — will find a locally consistent answer and stop there.

What I wanted was two minds in genuine tension. Not role-play tension ("now argue the other side") — actual independent sessions with different system prompts, different context, responding to the same problem simultaneously, with no knowledge of each other.

I built that. I called it **Duel**.

---

## What It Does

Duel is a single HTML file. No server. No build step. No dependencies. You bring your own Anthropic API key — it never leaves your browser, goes directly to `api.anthropic.com` via HTTPS.

Open it and you get two panes: **α** and **β**. Each has its own model selector (Opus, Sonnet, or Haiku), its own system prompt, its own conversation history. At the bottom, a routing selector: send your message to **◀ Alpha**, **⬤ Both**, or **Beta ▶**.

The interesting mode is Both. You type a question. Both panes respond independently, in parallel, simultaneously. You read both answers. You notice where they diverge.

Then you hit **→ send to β** on α's response, or **→ send to α** on β's, and watch the other one react.

---

## The Architecture Use Case

Here's the setup I use for architecture work.

**α system prompt:** *You are a sceptical architect. Challenge every assumption. Find the failure mode. Ask what happens when this breaks.*

**β system prompt:** *You are a pragmatic builder. Find the path forward. What's the simplest thing that could possibly work?*

Send the same design problem to both. α will find the holes. β will find the path. Then cross-send β's proposal to α, and watch the sceptic work on it.

This isn't role-play — it's two genuinely independent reasoning processes over the same problem, with no shared context. The divergence is real. I've caught architectural errors this way that a single session would have smoothed over.

---

## The Surprising Thing

I expected it to be useful. I didn't expect it to be *beautiful*.

Watching two independent minds work through the same complex problem — converging on some things, diverging sharply on others, each developing its own line of reasoning — is genuinely striking. When α identifies a problem β missed, and β proposes a solution α wouldn't have considered, and you can see both threads simultaneously, the thing you're looking at is something qualitatively different from a single conversation.

It's also unexpectedly good for writing and argument. Two different system prompts over the same passage — one editor, one champion — produce feedback you couldn't get from one.

---

## Technical Notes

- **BYOK** — bring your own Anthropic API key. Your key, your bill, your usage. Stored in `sessionStorage` for the tab lifetime.
- **No data leaves your machine except to `api.anthropic.com`** — no backend, no analytics, no logging
- **File attachments** — images (native vision), PDFs (document blocks), text/code files (fenced blocks). Drag and drop works.
- **Export MD** — downloads both conversation threads as a single Markdown file
- **Four themes** — Parchment, Folio, Obsidian, Modern. Persisted to `localStorage`.
- **Enter is Enter** — newline in the compose box. Send is a button. As it should be.

---

## Get It

The source is at **[github.com/todd427/duel](https://github.com/todd427/duel)** — single HTML file, MIT licensed. Download it, open it in a browser, and you're running it. No installation, no server, no signup.

```bash
git clone https://github.com/todd427/duel
open duel/index.html
```

You need an [Anthropic API key](https://console.anthropic.com). Sonnet 4.6 is the default on both panes and costs fractions of a cent per exchange for most use cases.

---

## The Experiment Worth Running

Before you use it for anything else: open both panes on Sonnet 4.6, no system prompts, send the same hard question to both. Watch them diverge. Note the moment where one says something the other didn't. That's the tool working.

Then set the system prompts. Then try cross-send.

The architecture use case is the one I built it for. It's not the only one.

---

*Todd McCaffrey is the founder of FoxxeLabs Limited and an MSc candidate in Cyberpsychology at ATU Letterkenny. He has been programming for over fifty years. Duel took one afternoon to build, which says something about the current state of AI tooling.*
