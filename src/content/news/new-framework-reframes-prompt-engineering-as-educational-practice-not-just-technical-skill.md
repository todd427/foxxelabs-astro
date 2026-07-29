---
title: "New Framework Reframes Prompt Engineering as Educational Practice, Not Just Technical Skill"
description: "Epistemic prompting framework presented on arXiv redefines prompt engineering in STEM education as continuous epistemic practice rather than technical competence alone."
publishDate: 2026-07-18
category: "Research"
tags: ["prompt engineering", "STEM education", "epistemic prompting", "AI literacy"]
source: "arXiv"
sourceUrl: "https://arxiv.org/abs/2607.11680"
significance: "medium"
entities: ["arXiv", "Matteo Tuveri"]
irishEuAngle: false
updates: []
draft: false
---

## Epistemic Prompting Reframes Prompt Engineering in Education

A paper submitted to arXiv on July 13, 2026 introduces **epistemic prompting**, a new framework that repositions prompt engineering in STEM education as a continuous epistemic practice rather than only a technical competence.

The framework proposes a **Framing-Prompting Loop**, a multi-turn interaction model where an initial prompt establishes a provisional macro-frame. Subsequent learner turns can then maintain, specify, challenge, repair, or transform that organizational structure, treating prompt refinement as an iterative knowledge-building process.

This approach shifts the focus from treating prompts as static instructions to viewing them as dynamic tools for epistemic development—relevant for educators and researchers designing AI-assisted learning environments.

## Agent Stack: Four Distinct Engineering Layers

Separately, analysis from explainx.ai Blog (July 1, 2026) clarifies that **prompt, context, loop, and harness engineering** represent four different layers of the agent stack with distinct units of work and failure modes—not synonymous terms.

**Context engineering** designs the full context package per model call, including RAG chunks, tool lists, and history prune rules. It is used in multi-turn agents and RAG systems.

**Loop engineering** designs entire autonomous runs with trigger, goal, actions, verification, and memory components, applied in autonomous coding and scheduled agents.

**Harness engineering** builds or configures the orchestration code that executes loops, encompassing tool execution, sandbox management, retries, checkpoints, and logging.

Understanding these layers as distinct enables practitioners to diagnose failures and optimize performance at the appropriate level of the agent stack.

---
**Source:** [arXiv](https://arxiv.org/abs/2607.11680)