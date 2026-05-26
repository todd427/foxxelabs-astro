---
title: "The Agentic Pipeline: How One Operator Builds Like a Team"
description: "A backgrounder on the agentic pipeline behind the FoxxeLabs stack — the loop that turned one new project every four months into 2.67 a week, explained for developers and founders alike."
publishDate: 2026-05-22
category: "Research"
tags: ["agentic-pipeline", "MCP", "Mnemos", "git-mcp", "developer-tools", "productivity"]
readingTime: "8 min read"
furtherReading:
  - title: "Does AI Make Us Smarter? The 44× Derivation"
    url: "/does-ai-make-us-smarter"
    source: "FoxxeLabs"
  - title: "The FoxxeLabs Cognitive Stack"
    url: "/resources/the-foxxelabs-cognitive-stack"
    source: "FoxxeLabs"
  - title: "Interactive: The Agentic Pipeline (full screen)"
    url: "/pipeline/"
    source: "FoxxeLabs"
draft: false
---

<div style="width:100%;border-radius:8px;overflow:hidden;margin:0 0 1rem 0;border:0.5px solid rgba(128,128,128,0.15);">
  <iframe src="/pipeline/" width="100%" height="900" style="border:none;background:#0c0d10;" title="The agentic pipeline — clickable flowchart. Each node is a tool that removed a human bottleneck; the loops are the feedback that compounds into 44× throughput."></iframe>
</div>

<p style="text-align:center;margin:0 0 2.5rem 0;font-size:0.9rem;"><a href="/pipeline/">Open the flowchart full screen →</a> &nbsp;(every node is clickable)</p>

## <span style="color:#1F4E79">Why this matters</span>

For most of a fifty-year career in software, I started about one new project every four months. Since I moved my work fully into an agentic environment, that rate is **2.67 new projects a week** — a 44× change, at the same complexity or higher. The diagram above is *how*. It isn't a marketing graphic; it's the actual control loop a piece of work travels through, from the moment it enters as an idea to the moment it folds back into memory and makes the next piece cheaper to start.

The framing that matters most is this: I didn't set out to build a pipeline. I built tools to stop doing tedious things, and the pipeline is what those tools became once they were chained together. Two examples anchor the whole chart. I wrote **Mnemos**, the memory service at the top of the loop, so I would stop re-explaining my own context at the start of every session. And I wrote **git-mcp**, the box in the middle, so the agent could write files directly into my repositories and I could get out of the copy-and-paste business. Those two changes alone moved my throughput across a regime boundary.

## <span style="color:#1F4E79">Walking the loop</span>

A task enters at the top and threads the spine. **Recall** queries the corpus first — *have I solved this before?* Context precedes code. **Decide** turns the answer into a short spec and registers the project. **Build** is where git-mcp drives the repository directly: pull, write, commit, push. I architect and inspect; the agent does the typing.

Off to the side sits **Parallelise** — a worker-orchestration service that forks several investigations at once and merges the results back into Build. Down the spine, **Deploy** ships with a single command, and then the work hits the one node that isn't a rectangle. **Verify** is a diamond because it's a decision: a deploy isn't "done" until five acceptance tests pass. Pass, and the work continues to **Guard** and **Observe**. Fail, and the arrow loops straight back to Build. No deploy reaches production on a hope.

Then the part that earns the headline number. **Consolidate** writes the finished work back into Mnemos and runs an overnight pass that turns the session into durable memory. That's the long arrow on the left of the chart, and it's why the system gets cheaper to use over time rather than more expensive. Each project leaves behind context the next project recalls for free.

## <span style="color:#1F4E79">For the developer</span>

The engineering idea underneath this is unglamorous and load-bearing: **treat your own tooling as MCP servers and let the agent operate them.** Each box on the chart is a small service exposing a handful of typed tools — git operations, deploy commands, memory queries, fleet status. They share one substrate pattern, so a new one is a known shape rather than a blank page: a thin FastAPI service, the MCP SDK, SQLite for state, an HTTP client, a Dockerfile, one deployment target. Standardising the substrate is what makes the marginal service cheap, and cheap services are what let the pipeline grow a new limb whenever a new friction shows up.

Three things make it hold together rather than fall over. The first is **the feedback loops** — the Verify-to-Build arrow and the Consolidate-to-Recall arrow. A pipeline without them is a conveyor belt that happily ships broken work; with them, it's a control system. The second is **the acceptance-test ritual** at Verify, which gives "done" an objective definition the agent can't talk its way past. The third is **the memory loop closing**, because an agentic system with no persistence repeats your context tax on every run — and the tax is the whole problem you were trying to solve.

The honest engineering caveats are on the chart too, if you click through. The memory service is still a single point of failure until its backup story is finished. The orchestration layer once burned several hundred dollars in a weekend before I capped it. None of this is friction-free; it's friction *moved* — from my hands to a system I have to maintain. That trade is worth it, but it's a trade, not a free lunch.

## <span style="color:#1F4E79">For the founder</span>

The commercial reading is simpler and, I think, larger. A competent operator running this configuration produces at a scale that used to require a team, and the constraint on output stops being capital or headcount. In my own case the binding constraint is no longer cognitive — it's sleep.

Two cautions keep that from becoming a pitch deck. The multiplier is a *project-initiation* rate, not raw output, and the credit belongs to the whole augmented stack rather than any single model; I'm also a poor witness to my own productivity and a retiree with a deep back catalogue, both of which flatter the number. So don't read 44× as a guarantee. Read it as evidence that the unit economics of building have shifted, and that the people who feel it first are the ones who've stopped using AI as a chat box and started wiring it into a loop.

The strategic point is the *shape*, not the figure. The advantage doesn't come from any one clever tool — it comes from the loop closing, from work compounding into memory, from each new capability also upgrading the factory that builds the next one. That's defensible in a way a single feature never is. The competitor who has nine of these tools and no loop is still paying the context tax on every task. The one who closes the loop stops paying it.

## <span style="color:#1F4E79">Foxxe Take</span>

This is the current equilibrium, not the final form. The tools will change, the agent's autonomy will deepen, and the human's role inside the loop will keep shifting toward judgement and away from typing. What I'm confident won't change is the architecture: recall, build, verify, consolidate, and a memory loop that closes. If you're building anything serious with agents, that's the part worth copying — not my specific boxes, but the discipline of removing one bottleneck at a time and always closing the loop back into memory. Sixty-five years ago Licklider and Engelbart argued that the interesting thing about a cognitive tool is not what it does on its own but what it lets a person reach. The flowchart above is one working answer.

*Letterkenny, May 2026. The pipeline is live; every node in the diagram is a running service.*
