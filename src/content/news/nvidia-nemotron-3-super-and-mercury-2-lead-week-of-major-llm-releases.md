---
title: "NVIDIA Nemotron 3 Super and Mercury 2 Lead Week of Major LLM Releases"
description: "New diffusion-based models promise 10x speed improvements while NVIDIA's hybrid architecture delivers 2.2x throughput gains over existing systems."
publishDate: 2026-03-13
category: "Industry"
tags: ["model-releases", "performance", "open-source", "inference"]
source: "Multiple Industry Sources"
sourceUrl: "https://nvidia.com"
draft: false
---

## Key Developments

The past week has delivered significant advances in large language model architecture and performance. NVIDIA released **Nemotron 3 Super** on March 10, 2026, featuring a 120-billion-parameter hybrid Mamba-Transformer model with only 12 billion active parameters. The model achieves up to 2.2x higher inference throughput than GPT-OSS-120B while supporting 1M token context lengths.

Meanwhile, Inception's **Mercury 2**, launched February 24, introduces the first commercial-scale diffusion-based LLM (dLLM) architecture. This novel approach processes roughly 1000 tokens per second—dramatically outpacing Claude 4.5 Haiku Reasoning (89 tps) and GPT-5 Mini (71 tps) while achieving strong benchmark scores including 91.1 on AIME 2025.

**DeepSeek V4**, while anticipated for early March launch, remains unreleased despite widespread industry expectations for a trillion-parameter multimodal model.

## Industry Context

These releases highlight two critical trends reshaping the LLM landscape. First, architectural innovation is moving beyond traditional transformers—Mercury 2's diffusion approach generates output by iteratively refining token sequences in parallel, while Nemotron 3 Super's Mixture-of-Experts design activates only essential parameters.

Second, the performance gap between proprietary and open models continues narrowing. Both releases emphasize permissive licensing, with NVIDIA providing full training datasets and Inception targeting 10x cost reductions.

## Practical Implications

For European developers and enterprises, these advances offer immediate deployment opportunities. Nemotron 3 Super's NVFP4 precision enables 4x faster inference on existing Hopper infrastructure, while Mercury 2's speed improvements could transform real-time applications.

Intel's OpenVINO 2026.0 release adds CPU/GPU support for several new models, potentially reducing cloud dependencies for EU organizations prioritizing data sovereignty.

## Open Questions

DeepSeek V4's delayed launch raises questions about Chinese model development timelines amid ongoing US export restrictions. Additionally, while diffusion-based LLMs show promise, their long-term reliability and scaling characteristics remain unproven in production environments.

The week's developments suggest 2026 could mark a turning point where open models genuinely compete with proprietary alternatives—a shift particularly relevant for European AI independence strategies.

---
**Source:** [Multiple Industry Sources](https://nvidia.com)