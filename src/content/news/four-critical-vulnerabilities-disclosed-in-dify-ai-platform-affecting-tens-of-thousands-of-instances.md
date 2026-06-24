---
title: "Four Critical Vulnerabilities Disclosed in Dify AI Platform Affecting Tens of Thousands of Instances"
description: "Zafran Security researchers disclosed DifyTap—four vulnerabilities in the popular open-source Dify platform, two critical, enabling cross-tenant data exposure."
publishDate: 2026-06-24
category: "Security"
tags: ["AI Security", "Vulnerability Disclosure", "Cloud Security", "DifyTap"]
source: "The Hacker News"
sourceUrl: "https://thehackernews.com/2026/06/researchers-detail-difytap-flaws-in.html"
significance: "high"
entities: ["Dify", "Zafran Security", "Ido Shani", "Gal Zaban", "CVE-2026-41947", "CVE-2026-41948", "CVE-2026-41950", "CVE-2026-41949"]
irishEuAngle: false
updates: []
draft: false
---

## Four Vulnerabilities Disclosed in Popular AI Platform

Zafran Security researchers Ido Shani and Gal Zaban have disclosed four vulnerabilities in Dify, collectively codenamed DifyTap. Dify is an open-source agentic workflow platform with more than 146,000 GitHub stars.

Of the four DifyTap vulnerabilities, two are critical severity. Two require no authentication, and three carry cross-tenant impact on Dify's multi-tenant cloud service.

## CVE-2026-41947: Authorization Bypass

CVE-2026-41947 has a CVSS score of 9.1 and is an authorization bypass vulnerability that allows authenticated editor users to set and enable trace configurations for any application regardless of tenant ownership.

The vulnerability can be exploited by an attacker who creates a Dify account, finds a public-facing application, obtains the application's internal App ID, calls Dify's tracing configuration API, and registers their own tracing back end, establishing a persistent exfiltration channel for all messages and responses.

## CVE-2026-41948: Path Traversal

CVE-2026-41948 has a CVSS score of 9.4 and is a path traversal vulnerability that allows authenticated users to manipulate requests forwarded to the Plugin Daemon's internal REST API by exploiting insufficient URL path sanitization.

CVE-2026-41948's current impact is limited primarily to allowing access to debug/pprof for performance data, but it represents an architectural flaw where any new or changed endpoint in the Plugin Daemon could become a high-severity vulnerability.

## CVE-2026-41950: Cross-Tenant File Access

CVE-2026-41950 has a CVSS score of 6.5 and allows authenticated users to read the full contents of files uploaded by other users within the same tenant by supplying an arbitrary file UUID in the files array of a chat-messages request.

## Scale of Exposure

Dify has more than 10 million pulls of its API image on Docker. Zafran identified tens of thousands of internet-facing Dify instances, highlighting the widespread deployment of the platform.

## Additional Vulnerability: Outdated PDFium

Dify's file parsing stack relied on a version of PDFium vulnerable to CVE-2024-5846 (CVSS score: 8.8), a use-after-free bug disclosed in June 2024 that could allow a remote attacker to exploit heap corruption via a crafted PDF file.

## Available Patches

CVE-2026-41947, CVE-2026-41949, and CVE-2026-41950 have been patched in Dify version 1.14.2.

A fix for CVE-2026-41948 has been merged on GitHub; customers can build and deploy the most recent version on GitHub, which addresses all four flaws at once.

## Interim Mitigation Guidance

Zafran stated that for those operating on version 1.14.2, it is highly recommended to implement Web Application Firewall (WAF) rules specifically designed to mitigate CVE-2026-41948.

## No Known Exploitation to Date

A Zafran spokesperson confirmed to Dark Reading that it is not aware of any real-world exploitation attempts targeting the DifyTap vulnerabilities to date.

## Industry Insights and Recommendations

Zafran noted that DifyTap demonstrates vulnerability visibility challenges specific to container images, where differences between deployments can create visibility gaps that traditional scanners cannot detect.

A Zafran spokesperson stated that a simple authorization flaw can quickly become a cross-tenant data exposure issue, and organizations should assume there may be hidden exposure within their AI stack.

Zafran advised CISOs to treat AI platforms as critical enterprise systems, maintain an inventory of deployed AI applications, ensure they are patched promptly, continuously monitor them, and perform the same level of security assessment as any internet-facing business-critical technology.

---
**Source:** [The Hacker News](https://thehackernews.com/2026/06/researchers-detail-difytap-flaws-in.html)