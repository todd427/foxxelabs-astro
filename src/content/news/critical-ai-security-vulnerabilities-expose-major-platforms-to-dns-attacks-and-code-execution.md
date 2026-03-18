---
title: "Critical AI Security Vulnerabilities Expose Major Platforms to DNS Attacks and Code Execution"
description: "Amazon Bedrock, LangSmith, and SGLang face severe security flaws enabling data exfiltration and remote code execution attacks."
publishDate: 2026-03-18
category: "Security"
tags: ["vulnerabilities", "AI security", "DNS exfiltration", "remote code execution"]
source: "Multiple Security Researchers"
sourceUrl: "https://security-research-disclosure.com"
draft: false
---

## Critical Vulnerabilities Target AI Infrastructure

Security researchers have disclosed multiple severe vulnerabilities affecting major AI platforms, with attacks ranging from DNS-based data exfiltration to remote code execution. The discoveries highlight growing security risks as European organisations increasingly rely on AI infrastructure.

## Key Security Flaws Discovered

**Amazon Bedrock DNS Vulnerability**: BeyondTrust researchers revealed that Amazon Bedrock's AgentCore Code Interpreter allows malicious DNS queries to bypass network isolation, achieving a CVSS score of 7.5. The technique enables attackers to establish covert command-and-control channels even in sandboxed environments.

**LangSmith Token Theft Risk**: Miggo Security disclosed CVE-2026-25750 (CVSS 8.5), affecting both cloud and self-hosted LangSmith deployments. The vulnerability allows account takeover through malicious links or compromised websites, posing significant risks given LangSmith's access to internal data sources.

**SGLang Critical Flaws**: Two unpatched vulnerabilities in the popular open-source framework carry maximum CVSS scores of 9.8. CVE-2026-3059 and CVE-2026-3060 both enable unauthenticated remote code execution through unsafe pickle deserialization in multimodal and disaggregation modules.

## Industry Impact and European Context

These vulnerabilities affect global AI infrastructure that European organisations increasingly depend upon. With 67% of CISOs reporting limited AI visibility according to Pentera's 2026 report, many organisations lack adequate monitoring of these critical systems.

The timing is particularly concerning as European businesses accelerate AI adoption while navigating evolving EU AI Act compliance requirements. Traditional security controls prove inadequate for AI-specific attack vectors like DNS exfiltration from code interpreters.

## Immediate Actions Required

Organisations should prioritise updating LangSmith to version 0.12.71 and review DNS query permissions in AI sandbox environments. SGLang users face immediate risk until patches become available.

Security teams must implement AI-specific monitoring beyond traditional endpoint and API security tools. The discovery of CVE-2026-21536 by an autonomous AI agent also signals the need for enhanced vulnerability management processes.

## Outstanding Questions

Key uncertainties remain around SGLang patch timelines and the broader prevalence of DNS exfiltration techniques across AI platforms. European organisations particularly need clarity on how these vulnerabilities interact with AI Act security requirements and whether existing compliance frameworks adequately address AI infrastructure risks.

---
**Source:** [Multiple Security Researchers](https://security-research-disclosure.com)