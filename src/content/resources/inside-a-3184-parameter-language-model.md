---
title: "Inside a 3,184-Parameter Language Model"
description: "A one-layer transformer you can take apart in the browser. Attention, the MLP, a logit lens, sampling and ablations, all computed live from weights trained for the purpose, and what those weights turned out to contain."
publishDate: 2026-10-02
category: "Foundations"
tags: ["Transformers", "Interpretability", "Attention", "Mathematics", "Interactive"]
readingTime: "5 min read"
furtherReading:
  - title: "Attention Is All You Need"
    url: "https://arxiv.org/abs/1706.03762"
    source: "Vaswani et al., 2017"
  - title: "A Mathematical Framework for Transformer Circuits"
    url: "https://transformer-circuits.pub/2021/framework/"
    source: "Elhage et al., Anthropic, Transformer Circuits Thread, 2021"
  - title: "interpreting GPT: the logit lens"
    url: "https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru"
    source: "nostalgebraist, LessWrong, 2020"
  - title: "Eliciting Latent Predictions from Transformers with the Tuned Lens"
    url: "https://arxiv.org/html/2303.08112v5"
    source: "Belrose et al."
draft: false
---

Most explanations of how a language model arrives at an answer are drawings. This one is a working model small enough to take apart. It has 3,184 parameters, two attention heads and a vocabulary of 28 words, and every number on its page is computed live, in your browser, from the weights.

**[Open the simulator](/transformer-simulator/)**

The question behind it was whether the breakthroughs still to come in language models live in the mathematics. A toy can't answer that. What it can do is put the mathematics in front of you at a scale where you can see every term.

## <span style="color:#1F4E79">What's inside</span>

It is a single transformer block in the architecture introduced by [Attention Is All You Need](https://arxiv.org/abs/1706.03762), with layer normalisation applied before each sub-layer: a 16-number embedding for each word plus a position vector, two attention heads of eight dimensions each, a 32-unit MLP with a GELU, and an unembedding matrix that turns the final vector into one score per word. The context is eight words.

It was trained on 225 tokens of synthetic sentences about cats, dogs, mice and birds, written for the purpose and published with the source. Cross-entropy loss fell from 3.337 at the first step to 0.496 over the whole corpus, against 3.332 for a uniform guess over 28 words. Run greedily from "the big", it produces "the big dog chased the mouse . the dog saw", which is about what you'd expect from a model that has seen one small grammar.

The training code is plain numpy with the backward pass written by hand, because the environment it was built in had no deep learning framework. That makes the gradients checkable: central differences on random entries of every parameter tensor agree with the analytic gradients to a worst relative error of 7.9 × 10⁻⁷. The page runs the same forward pass in JavaScript and checks itself against the numpy reference logits every time it loads, on nine prompts that between them use all 28 words and all eight positions. The worst disagreement is 5 × 10⁻⁷. Re-running the published trainer (numpy 2.4.4) reproduced the shipped weights exactly.

## <span style="color:#1F4E79">What you can do with it</span>

The page walks one forward pass in order. **Embed** shows the word and position vectors as heatmaps. **Attend** shows each head's scores and weights, and clicking any cell opens the arithmetic: the eight products that sum to the query-key dot product, the division by √8, and the softmax over that row. **Think** shows the 32 MLP activations. **Read out** applies the unembedding and then temperature, top-k and top-p, with entropy and the number of effective choices, and a seeded sampler that shows the raw random draw that picked each word.

Then there are knobs. You can switch either head off, switch off the MLP or the position embeddings, and rescale the attention scores by a factor β. The page reports how far the output distribution moves, as KL divergence in nats, and generation uses the modified model too. A last section shows the singular values of each head's query-key and output-value matrices.

## <span style="color:#1F4E79">What the weights turned out to contain</span>

These are measurements on this model, from seven test prompts, not claims about anything larger.

**The two heads are not interchangeable.** Switching off head 1 collapses the prediction for five of the seven prompts to the same default, "mouse" at 92%, with KL divergences from 2 to 25 nats across all seven. Switching off head 0 does damage that depends on the prompt: 0.35 nats for "the cat and the dog sat on the", 12.5 for "the black cat saw the". In the windows examined, head 1's later positions often point back at the verb, "chased" or "sat".

**The attention is already close to a hard choice.** Setting β to 0 makes every word average evenly over everything it can see, and that wrecks the output: for "the big dog chased the", the answer goes from mouse, small and cat at 26 to 28% each to "dog" at 85%. Turning β up to 3 does almost nothing for most prompts (KL at most 0.02, with one exception at 0.40), because the trained rows were nearly one-hot already.

**Attention does most of the work, and the MLP refines.** Read the unembedding off the stream after embedding alone and the guess is flat and prompt-independent: for "the cat sat on the" it is mouse 5%, cheese 4%, bone 4%. After attention it is mat 35%, white 29%, rug 21%, and the MLP then moves the distribution by only 0.6 nats. Across the seven prompts, switching off the MLP cost between 0.5 and 1.4 nats.

**The circuits are low-rank.** Each head's query-key and output-value matrix is 16 by 16 but has rank at most 8. In three of the four, the top three singular values hold 96.5 to 98.8% of the squared mass; the exception is head 1's output-value matrix, at 86.7%. The decomposition into a query-key circuit that decides where to look and an output-value circuit that decides what to write is the one set out in [A Mathematical Framework for Transformer Circuits](https://transformer-circuits.pub/2021/framework/), and a toy this small is a convenient place to see it.

## <span style="color:#1F4E79">What it can't tell you</span>

It is one layer, so heads can't compose across layers, and none of the structure that depends on that can appear. Its vocabulary is 28 words, so there is no polysemy to untangle and nothing like the pressure on a real model's capacity. A pattern in these weights illustrates a mechanism; it is not evidence that a large model uses the same one.

The logit lens carries a caveat of its own. [nostalgebraist's original post](https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru) applied it to GPT-2, and the [tuned lens paper](https://arxiv.org/html/2303.08112v5) found the plain version works reasonably well there but is unreliable on some other models. Here it is on firm ground, because the unembedding is applied directly to the residual stream with no final normalisation, so the last readout is the actual output and the earlier two are the same readout applied part-way through.

If you find something in it that you didn't expect, the trainer, the reference script, the forward pass and the weights are all on the [simulator page](/transformer-simulator/), in the source links at the foot.

---

*Todd McCaffrey is a New York Times bestselling author, researcher and solo developer, with an MSc in Cyberpsychology from ATU Letterkenny. The model, the training code and the simulator were built with Claude, which is made by Anthropic; the paper by Elhage et al. cited above is also from Anthropic.*
