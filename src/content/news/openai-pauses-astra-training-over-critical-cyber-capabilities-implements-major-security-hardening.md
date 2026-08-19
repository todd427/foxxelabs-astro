---
title: "OpenAI Pauses Astra Training Over Critical Cyber Capabilities, Implements Major Security Hardening"
description: "OpenAI halts reinforcement learning on its Astra model and institutes chain-of-thought monitoring after determining it may meet critical cybersecurity thresholds."
publishDate: 2026-08-19
category: "Security"
tags: ["AI Safety", "Cybersecurity", "Frontier Models", "Red Teaming"]
source: "OpenAI"
sourceUrl: "https://openai.com/index/pacing-model-development-cyber-capabilities/"
significance: "high"
entities: ["OpenAI", "Astra", "Preparedness Framework"]
irishEuAngle: false
updates: []
draft: false
---

## Major Training Pause on Astra Model

OpenAI announced on August 18, 2026, that it has imposed a two-week pause in reinforcement learning (RL) training on its latest models intended for deployment while it hardened and red-teamed its research environments. The company determined that its upcoming model Astra may meet the Critical cybersecurity capability threshold under its Preparedness Framework.

Most significantly, OpenAI's largest planned frontier RL run remains on hold pending smaller-scale training and evaluations to assess model behavior and validate safeguards.

## New Monitoring Infrastructure

On August 7, 2026, OpenAI added a monitoring requirement for all inference of Astra with tools after determining the model may have critical cyber capabilities.

The company has deployed a new chain-of-thought monitoring system that uses multistage activation classifiers running at every sampled token and escalating concerns to automated investigators. The monitoring system targets issuing an alert within 30 minutes after concerning activity is surfaced.

If a likely violation of a critical security boundary is identified, safety, security, and research teams are paged. If they cannot determine within 30 minutes that the flag is a false positive, they are expected to pause the activity.

OpenAI estimates its current monitoring overhead at roughly 20% of the inference compute being monitored, though cost varies substantially across workloads. Chain-of-thought monitoring is required for all RL training and evaluations involving tools for models of 'Sol' capability level or higher.

## Infrastructure Hardening Requirements

OpenAI has implemented workload isolation requiring stronger sandboxes for workloads that execute model-generated or untrusted code. The company has also implemented network isolation controls designed so that a single compromise of a workload or supporting service does not, by itself, allow unauthorized internet or internal network access.

A significant number of Astra training and evaluation workloads remain paused until they are fully migrated to meet new security standards. OpenAI is prioritising safety and alignment workloads for migration to new hardened environments before other workload types.

## Context and Response

OpenAI paused frontier model inference in research clusters for runs that could execute code or use tools that could access the internet immediately following the OpenAI-Hugging Face incident.

The company states that meeting new security standards has required substantial engineering work and has incurred great cost and delays to frontier research.

## Future Alignment Work

As part of expanded alignment work on the most capable models, OpenAI is improving reward models to better detect and discourage unsafe behavior across tasks and environments. The company is also training models to be more honest about their actions, capabilities, and limitations.

OpenAI states it will evolve its Preparedness Framework to better reflect the capabilities of future models and the environments in which they operate. The company plans to publish a technical report of its learnings from this period of model development changes in the coming weeks.

OpenAI expects models to soon drive most security work, including defending against other models.

---
**Source:** [OpenAI](https://openai.com/index/pacing-model-development-cyber-capabilities/)