---
title: "Critical RCE Vulnerabilities Hit Major AI Automation Platforms"
description: "Multiple critical vulnerabilities in n8n and ServiceNow AI platforms expose organizations to remote code execution attacks."
publishDate: 2026-01-20
category: "Security"
tags: ["vulnerability", "rce", "automation", "supply-chain"]
source: "Multiple Security Advisories"
sourceUrl: "https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2025-68668"
entities: ["n8n", "ServiceNow", "CVE-2025-68668", "CVE-2026-21858", "OpenAI", "Google Drive", "Salesforce", "Microsoft", "npm", "Copilot"]
significance: "high"
irishEuAngle: false
draft: false
---

## Critical Vulnerabilities Strike AI Infrastructure

The past week has delivered a sobering reminder of AI security risks, with multiple critical vulnerabilities discovered in widely-used automation platforms. Two major flaws stand out: CVE-2025-68668 affecting n8n workflow automation (CVSS 9.9) and an unauthenticated RCE vulnerability CVE-2026-21858 that allows complete system takeover.

ServiceNow also patched a critical AI platform flaw enabling unauthenticated user impersonation, while threat actors have begun uploading malicious npm packages masquerading as n8n integrations to steal OAuth credentials.

## Why This Matters Now

These aren't just typical software bugs—they're striking at the heart of AI infrastructure that connects organizational data flows. N8n, for example, typically has access to Google Drive, OpenAI API keys, Salesforce data, payment processors, and customer databases. A successful exploit could compromise entire data ecosystems.

Microsoft's latest research reveals attackers are increasingly leveraging AI tools themselves, with AI-automated phishing achieving 54% click-through rates compared to 12% for traditional attempts—a 4.5x increase in effectiveness.

## Practical Implications for Builders

For organizations using AI automation platforms:

- **Immediate action required**: Update n8n to version 2.0.0+ immediately if running affected versions (1.0.0-1.99.x)
- **Supply chain vigilance**: Verify all npm packages and integrations, especially those claiming n8n compatibility
- **Access review**: Audit which systems your AI workflows can access and implement principle of least privilege
- **Monitoring enhancement**: Implement detection for unusual command execution patterns in automation environments

The vulnerability landscape shows AI systems create broader attack surfaces with potential for cascading failures across business units.

## Open Questions

A concerning divide has emerged between vendors and researchers on what constitutes AI security vulnerabilities. Microsoft recently dismissed several Copilot security issues as "not qualifying as security vulnerabilities," including prompt injection and sandbox bypass techniques.

This raises critical questions about AI security standards and whether traditional vulnerability assessment frameworks adequately address AI-specific risks like prompt injection and model manipulation attacks.
