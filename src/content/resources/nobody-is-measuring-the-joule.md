---
title: "Nobody Is Measuring the Joule: Ireland's Data-Centre Debate Is Looking at the Wrong Scale"
description: "The Oireachtas heard last week that data centres now use nearly a quarter of Ireland's electricity. The debate runs in megawatts per site, and no small business can do anything with a megawatt. The number they need is how much energy one answer costs. I've been measuring that on my own machines, and the biggest lever wasn't the model."
publishDate: 2026-09-28
category: "Opinion"
tags: ["AI", "Energy", "Data Centres", "Ireland", "Sovereign AI", "SMEs", "Opinion"]
readingTime: "7 min read"
author: "Todd McCaffrey"
furtherReading:
  - title: "Data centre expansion 'a runaway train taking Ireland away from climate targets'"
    url: "https://www.irishtimes.com/politics/oireachtas/2026/09/22/data-centre-expansion-a-runaway-train-taking-ireland-away-from-climate-targets/"
    source: "The Irish Times"
  - title: "The data centre dilemma: AI growth and Ireland's energy needs"
    url: "https://www.irishtimes.com/business/2026/09/25/the-data-centre-dilemma-ai-growth-and-irelands-energy-needs/"
    source: "The Irish Times"
  - title: "We need more data on data centres, not spin"
    url: "https://www.irishtimes.com/business/2026/09/27/we-need-more-data-on-data-centres-not-spin/"
    source: "The Irish Times"
draft: false
---

**By Todd McCaffrey**

---

Last Tuesday the Oireachtas Committee on Artificial Intelligence heard that data centres used nearly a quarter of Ireland's electricity last year, up from five per cent a decade earlier. By Sunday, the Irish Times business column was asking for more data and less spin.

It's a fair request, but I think it's aimed at the wrong scale. The debate is conducted in megawatts per site, and no one running a small business can do anything with a megawatt. The number they need is smaller and more useful: how much energy one answer costs. I've been measuring that on my own machines. The biggest surprise wasn't which model I used. It was how long the model spent thinking.

## <span style="color:#1F4E79">The week in Kildare Street</span>

Friends of the Earth's chief executive, Deirdre Duffy, told the committee on 22 September that the industry was a "runaway train" heading away from Ireland's climate objectives, and called for a moratorium. The CSO figure behind it: data centres took almost a quarter of the electricity consumed in the State in 2025, against five per cent in 2015. Rosi Leonard, who runs the group's data-centre campaign, said more than 700 MW is in planning, enough to raise national peak demand by about 11 per cent.

Three days later the same paper set out the other side. IDA Ireland's Matt Kennedy described data centres as part of the country's foreign-investment proposition, and warned that constrained capacity could cost Ireland digital and AI investment. UCD's Patrick Brodie argued that the sector's weight in the economy is badly exaggerated, pointing at the government-commissioned KPMG report's claim that 876,000 jobs depend on it.

## <span style="color:#1F4E79">Article 12 and the transparency gap</span>

There is a law meant to settle some of this. Article 12 of the recast EU Energy Efficiency Directive requires operators of data centres above 500 kW of IT load to report their energy performance, including water use, to a European database. Leonard told the committee Ireland hasn't enforced it, so nobody knows the sustainability figures for Irish sites.

Cantillon's column on 27 September made a related point about the economic side: there is so little real information about the sector's footprint that the best anyone can do is educated estimates, and a vacuum like that gets filled with claims.

Both are right. But notice what even a fully enforced Article 12 would give you: energy per site, per year. That's the right number for grid planning. It can't tell a business what an answer costs.

## <span style="color:#1F4E79">The wrong unit of analysis</span>

A dentist's practice, a solicitor's office or a small manufacturer deciding whether to use AI isn't buying a data centre. It's buying answers. The question it can act on is the energy cost per task, and how much of that is avoidable.

That number exists. Almost nobody publishes it, and the policy debate doesn't ask for it.

## <span style="color:#1F4E79">What per-task metering shows</span>

For the last month I've run a small experiment called Aigne on my own machines. It's a gateway that routes each request to the cheapest model that can handle it, and measures the energy each request actually drew from the graphics card, above the card's idle draw. It's one fleet and an experiment, not a product, and every figure below comes with that caveat.

The design assumes that picking the smaller model is the lever. Between a Qwen3-8B and a 30-billion-parameter Granite model, the bigger one costs roughly three times the energy per token. That holds when measured properly.

Then I sent the 30B the same prompt ten times in a row, one after another so no two runs shared the card's power. Same model, same card, same question. Board power sat flat at about 370 watts throughout.

- Tokens generated ranged from 211 to 2,675: a **12.7-fold** spread.
- Energy per task ranged from 1,535 to 19,868 joules: **12.9-fold**.
- Energy per token barely moved: **1.08-fold**.

The model wasn't less efficient when it ran long. It was doing more work at the same efficiency. All the variance was in how much it chose to think before answering. Ten requests for the same thing cost 85 kilojoules between them.

So the spread inside one model, on one question, dwarfs the threefold gap between model sizes. Choosing a smaller model is the small lever. Controlling how much it thinks is the big one. And a prompt that doesn't give the model enough to go on is an energy cost, not just a quality problem: the worst run I've recorded came from a question about a bug with no code attached, where the model went round in circles because there was nothing to look at.

One more result, because it matters for anyone tempted to throw a bigger model at a problem. I asked both models about a system of mine they'd never been told about. The 8B said it didn't know. The 30B also said it didn't know, and spent 2.8 times the energy doing it. A knowledge gap isn't fixed by size. It's fixed by giving the model the facts.

Ten runs of one prompt on one card isn't a study. It is a measurement, and Irish energy policy on AI currently has almost none at this scale.

## <span style="color:#1F4E79">A federation of small stacks</span>

Here's the contrarian part. I don't think sovereignty or sustainability for Irish SMEs comes from winning the hyperscale argument in either direction. It comes from small, metered, local systems where the energy cost of each answer is known: a modest card on the premises, a small model sized to the job, retrieval over the business's own documents, and a meter.

The extreme version of that is running now at [https://tuiscint.uk](https://tuiscint.uk). It's a 496-million-parameter model, roughly a thousandth the size of a frontier system, on a single GPU. It answers only from sources it has just read, shows the source beside every claim, and says "not stated" rather than guess. It has almost no knowledge of its own, by design. It isn't a general assistant, and when a source is wrong it will quote the error faithfully. But it is the knowledge-gap result above as a working service: don't buy a bigger brain, hand a small one the facts.

Its server meters every answer. Across 38 metered answers in its log, the median was 43 joules and the 90th percentile 134. That's GPU energy only, since fetching the web pages isn't counted, and they're real visitors' questions rather than the one repeated prompt I gave the 30B, so it isn't a like-for-like comparison. But the 30B's median on that single question was about 6,150 joules. The gap is more than a hundredfold.

That has limits I'd rather name. It's still NVIDIA silicon, so it answers the licensing half of sovereignty and not the hardware half. It's one fleet, mine, and the numbers above haven't been replicated anywhere else. And one thing I expected turned out false when I tested it: a smaller card isn't more efficient per token for the same model. It draws less power but takes longer, and the two very nearly cancel. The saving from small hardware is in idle draw and in being able to switch the big card off, not in the work.

## <span style="color:#1F4E79">What to ask for</span>

Two things, one for each side of the table.

For businesses buying AI: ask the vendor for energy per task, reported as a distribution, not a single average. Averages hide exactly the variation above.

For the State: enforce Article 12, and then ask for the unit a user can act on. Megawatts per site tell you whether the grid will cope. Joules per answer tell you whether the thing is worth doing, and which way to make it cheaper.

## <span style="color:#1F4E79">Sources</span>

All checked on 28 September 2026. The Aigne figures are my own measurements, recorded in the project's decision log (1–12 September 2026); they are from one machine fleet and have not been independently replicated.

- Oireachtas committee, CSO figure, planning pipeline and Article 12 claim: [The Irish Times, 22 September 2026](https://www.irishtimes.com/politics/oireachtas/2026/09/22/data-centre-expansion-a-runaway-train-taking-ireland-away-from-climate-targets/)
- IDA Ireland and Patrick Brodie: [The Irish Times, 25 September 2026](https://www.irishtimes.com/business/2026/09/25/the-data-centre-dilemma-ai-growth-and-irelands-energy-needs/)
- Cantillon: [The Irish Times, 27 September 2026](https://www.irishtimes.com/business/2026/09/27/we-need-more-data-on-data-centres-not-spin/)
- Article 12 scope and reporting duty: [European Commission, energy performance of data centres](https://energy.ec.europa.eu/topics/energy-efficiency/energy-efficiency-targets-directive-and-rules/energy-efficiency-directive/energy-performance-data-centres_it) and [CMS, EU publication obligations for data centres](https://cms.law/en/int/blogs/law-now-blog/specification-of-the-european-publication-obligations-for-data-centres)
- Tuiscint, the small grounded reader: [https://tuiscint.uk](https://tuiscint.uk). Energy figures are from its server log, read on 28 September 2026: 38 uncached answers with sampled GPU energy (median 43.2 J, 90th percentile 134.4 J).

---

*Todd McCaffrey is a New York Times bestselling author and holds an MSc in Cyberpsychology from ATU Letterkenny. He builds and writes about AI at foxxelabs.ie. This piece was drafted with Claude from a weekly news brief and checked against the sources above.*
