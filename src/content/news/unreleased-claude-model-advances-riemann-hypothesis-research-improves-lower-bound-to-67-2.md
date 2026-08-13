---
title: "Unreleased Claude Model Advances Riemann Hypothesis Research, Improves Lower Bound to 67.2%"
description: "An unreleased research version of Claude improved the lower bound for zeros of the Riemann zeta function from 41.6% to 67.2%, validated by external mathematicians."
publishDate: 2026-08-13
category: "Research"
tags: ["AI Mathematics", "Claude", "Riemann Hypothesis", "Formal Verification"]
source: "Anthropic"
sourceUrl: "https://www.anthropic.com/research/riemann-zeta"
significance: "high"
entities: ["Anthropic", "Claude", "Levent Alpöge", "Ralph Furman", "Brian Conrey", "Dan Goldston", "Clay Mathematics Institute"]
irishEuAngle: false
updates: []
draft: false
---

## Breakthrough in Century-Old Mathematical Problem

An unreleased research version of Claude has improved the lower bound for the fraction of zeros of the Riemann zeta function that satisfy the Riemann hypothesis from 41.6% to 67.2%. The Riemann hypothesis, which dates back to 1859, carries a $1 million bounty from the Clay Mathematics Institute that remains unclaimed.

## How Claude Approached the Problem

Anthropologic staff member Jarred Sumner, a non-mathematician, prompted Claude to "take a real stab" at the Riemann hypothesis, leaving subsequent mathematical choices entirely to the model. The Claude run that produced the result used a total of 31 million output tokens across two sessions in Claude Code.

The work was not straightforward. Claude initially generated and tried 650 ideas, none of which worked, before a second session produced the new result. Claude spent approximately a day and a half coordinating around 60 Claude subagents, which together ran 2,400 shell commands and wrote hundreds of Python scripts.

## Division of Labor Among Subagents

Of the 60 subagents, 2 developed the key mathematical ideas, 13 contributed ideas to those agents, 30 attempted but failed to develop new ideas, 13 validated the correctness of arguments, and 2 helped write the initial paper. Claude's subagents downloaded 54 papers from arXiv to check that its finding had not already been made.

The result draws heavily on a series of works by mathematicians Baluyot, Goldston, Suriajaya, and Turnage-Butterbaugh, along with a 2000 paper by Bombieri.

## Validation and Formal Verification

Two Anthropic mathematicians, Levent Alpöge and Ralph Furman, examined and validated Claude's mathematical work. External experts Brian Conrey and Dan Goldston examined Claude's paper on short notice at Anthropic's request.

Claude produced a formally verifiable Lean 4 formalization of its result, published at github.com/anthropics/zeta-23-lean, which passes the standard validation tool comparator.

Anthropic stated it does not expect the techniques Claude used will lead to proving the Riemann hypothesis itself.

---
**Source:** [Anthropic](https://www.anthropic.com/research/riemann-zeta)