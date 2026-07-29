---
title: "Critical vulnerabilities in Amazon Q Developer allow arbitrary code execution through malicious workspaces"
description: "CVE-2026-12957 and CVE-2026-12958 enable attackers to execute code and steal cloud credentials when developers open untrusted repositories."
publishDate: 2026-06-30
category: "Security"
tags: ["Amazon Q", "code execution", "supply chain", "credential theft"]
source: "AWS Security Bulletins"
sourceUrl: "https://aws.amazon.com/security/security-bulletins/2026-047-aws/"
significance: "high"
entities: ["Amazon Q Developer", "AWS", "Wiz Research", "CVE-2026-12957", "CVE-2026-12958", "Language Servers for AWS", "Maor Dokhanian"]
irishEuAngle: false
updates: []
draft: false
---

## Two Critical Vulnerabilities Disclosed

AWS has disclosed CVE-2026-12957 and CVE-2026-12958, two serious vulnerabilities affecting Amazon Q Developer across multiple IDE integrations.

CVE-2026-12957 is an improper trust boundary enforcement issue in Language Servers for AWS before version 1.65.0. If a local user opens a maliciously crafted workspace, any commands within the project configuration files may be automatically executed. The vulnerability required the user to trust the workspace when prompted.

CVE-2026-12958 is a missing symlink-validation issue in Language Servers for AWS before version 1.69.0.

Both vulnerabilities are remediated in Language Servers for AWS version 1.69.0, and no workarounds are available.

## Affected Products and Versions

The vulnerabilities impact Amazon Q Developer across several platforms:

- **Visual Studio Code**: versions before 2.20
- **JetBrains**: versions before 4.3
- **Eclipse**: versions before 2.7.4
- **AWS Toolkit with Amazon Q for Visual Studio**: versions before 1.94.0.0

## Attack Mechanism

According to Wiz Research, the Amazon Q Developer Extension for Visual Studio Code automatically loaded MCP server configurations from workspace files without user consent. Spawned MCP server processes inherited the user's complete environment including AWS credentials, cloud CLI authentication tokens, API keys and secrets, and SSH agent sockets.

This enabled attackers to achieve arbitrary code execution and cloud credential theft by having a developer open a malicious repository. The vulnerability could be exploited through:

- Malicious pull requests to popular repositories
- Typosquatted package names
- Compromised dependencies with added config files
- Fake job interviews where candidates are asked to clone and run attacker-controlled repositories, a known DPRK tactic

## Timeline and Discovery

The vulnerability was discovered by Maor Dokhanian of Wiz Research on April 17, 2026. An initial vulnerability report was submitted to Amazon Security on April 20, 2026, and Amazon acknowledged receipt the same day.

A fix was deployed via Language Server update on May 12, 2026, resolving the issue in the Amazon Q VS Code Extension. CVE-2026-12957 was assigned on June 23, 2026, with public disclosure occurring on June 26, 2026.

## Industry-Wide Pattern

Similar vulnerabilities have been independently discovered across the AI coding tool ecosystem, including CVE-2025-59536 and CVE-2026-21852 in Claude Code, CVE-2025-54136 in Cursor, and CVE-2026-30615 in Windsurf.

## Remediation

Amazon Q now displays a consent prompt before loading MCP servers from workspace configurations. The AWS Language Server updates automatically unless the customer's network configuration prevents it.

---
**Source:** [AWS Security Bulletins](https://aws.amazon.com/security/security-bulletins/2026-047-aws/)