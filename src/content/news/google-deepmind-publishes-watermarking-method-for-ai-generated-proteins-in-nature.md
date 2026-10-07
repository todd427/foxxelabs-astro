---
title: "Google DeepMind Publishes Watermarking Method for AI-Generated Proteins in Nature"
description: "Google DeepMind has published peer-reviewed research on SynthID Bio, embedding imperceptible signatures into AI-designed proteins to track their synthetic origin."
publishDate: 2026-10-07
category: "Research"
tags: ["AI protein design", "SynthID Bio", "biosecurity", "watermarking"]
source: "MIXED Reality News"
sourceUrl: "https://mixed-news.com/en/synthid-bio-watermarked-ai-designed-proteins-binders-still-bind/"
significance: "high"
entities: ["Google DeepMind", "Nature", "SynthID Bio", "AlphaFold 3", "AlphaProteo", "ProteinMPNN", "Adaptyv Bio", "Stanford University", "Arc Institute", "Evo 2", "Twist Bioscience", "Science Policy Consulting"]
irishEuAngle: false
updates: []
draft: false
---

## Peer-Reviewed Watermarking for AI Proteins

Google DeepMind has published a peer-reviewed paper in *Nature* titled "Function-preserving watermarking of AI-generated proteins." The work describes SynthID Bio as a proof of concept that embeds an imperceptible signature directly into the biological code of a protein, making the watermark verifiable not just on a digital model but on the synthesized, physical protein itself.

## Protein Binder Testing

For binder design, the SynthID Bio team used AlphaProteo, DeepMind's own binder design method, alongside a SynthID Bio-enabled version of ProteinMPNN. Adaptyv Bio performed the in vitro validation for the binder experiments.

Wet-lab testing of watermarked protein binders was conducted against three target proteins: VEGF-A, the SARS-CoV-2 spike protein receptor-binding domain, and PD-L1. Watermarked protein designs matched the hit rate, binding affinity, and natural sequence diversity of unwatermarked versions across the three tested targets.

Google DeepMind calls the watermarked binders produced in the study "the first-ever watermarked and biologically functional protein binders."

## Technical Approach

SynthID Bio fine-tunes a small part of AlphaFold 3's diffusion network so that predicted 3D coordinates inherently carry a detectable signature regardless of who runs the model.

## Bacteriophage Collaboration

DeepMind collaborated with the Hie lab at Stanford University and the Arc Institute to apply SynthID Bio to the genomic model Evo 2. SynthID Bio was applied to watermark the genome of a bacteriophage designed by Evo 2, and early laboratory testing in bacteria cultures confirmed those phages are functional. The detailed manuscript on these bacteriophage results had not been published at the time of the article.

## Open Science

Google is open-sourcing the SynthID Bio methods, code, in vitro data, and model weights to the research community.

## Industry and Policy Perspectives

Sarah Carter, a biosecurity policy expert and Principal at Science Policy Consulting, reviewed the SynthID Bio work and called it "an important piece of the puzzle for tracking the provenance of biological designs."

James Diggans, Vice President of Policy and Biosecurity at Twist Bioscience, gave early feedback on the SynthID Bio paper and said watermarking offers a promising new addition to the biosecurity toolbox.

## Key Challenges and Considerations

Google states that novel AI protein designs can bypass traditional DNA synthesis screening. The company also states that mislabelled synthetic 3D protein structures risk polluting public databases and misleading downstream research.

Google acknowledged that making the SynthID Bio watermark more robust against deliberate tampering is a key remaining challenge. The company suggests pairing the SynthID Bio watermark with provenance metadata along the lines of C2PA for digital media, or with central repositories of AI-generated biological data.

---
**Source:** [MIXED Reality News](https://mixed-news.com/en/synthid-bio-watermarked-ai-designed-proteins-binders-still-bind/)