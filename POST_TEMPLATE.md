# Resource Post Template

Copy this template to create new resource posts.

## Filename
`src/content/resources/your-slug-here.md`

## Template

```markdown
---
title: "Your Title Here"
description: "One-sentence summary for SEO and social sharing (120-160 characters ideal)"
publishDate: 2026-01-11
updatedDate: 2026-01-12  # Optional - add when you update the post
category: "Foundations"  # Options: Foundations, Applications, Security, Industry
tags: ["Tag1", "Tag2", "Tag3"]  # 3-5 tags recommended
heroImage: "/images/resources/your-slug-hero.jpg"  # Optional but recommended
heroImageAlt: "Describe the hero image for accessibility"
readingTime: "10 min read"  # Optional
furtherReading:  # Optional
  - title: "Paper or Article Title"
    url: "https://example.com/article"
    source: "Author/Publisher"  # Optional
  - title: "Another Source"
    url: "https://example.com/source2"
draft: false  # Set to true to exclude from builds
---

## Why This Matters

Start with context: Why should the reader care about this topic? What problem does it solve? What's at stake?

## The Map: [Core Framework/Taxonomy]

Provide structure. Break down the landscape into clear categories or a mental model.

### Major Category 1

**What it is:** Clear definition

**How it works:** Brief technical explanation

**Practical uses:**
- Use case 1
- Use case 2
- Use case 3

### Major Category 2

[Same structure as above]

## Tradeoffs & Failure Modes

Be honest about limitations, costs, and what can go wrong.

### Common Pitfall 1
Why it happens and how to avoid it.

### Common Pitfall 2
[Same structure]

## What Changed Recently

Recent developments with sources. Keep this section updated over time.

**Development 1:** Brief description. [Source: Citation with link, Date]

**Development 2:** Brief description. [Source: Citation with link, Date]

## What to Watch Next

Forward-looking: What's emerging? What should readers pay attention to?

1. **Trend 1:** Why it matters
2. **Trend 2:** Why it matters
3. **Trend 3:** Why it matters

## Foxxe Take

Your opinionated perspective. What's the strategic takeaway? What should builders do? What are the second-order effects?

Keep it grounded and practical.
```

## Style Guidelines

- **Tone:** Professional but conversational. Avoid jargon without explanation.
- **Length:** 1500-3000 words for most topics
- **Structure:** Use the template sections but adapt as needed
- **Citations:** Link to primary sources when making factual claims
- **Examples:** Include concrete examples over abstract descriptions
- **Visuals:** Add diagrams/images when they clarify complex concepts

## Image Guidelines

**Hero image specs:**
- Aspect ratio: 16:9
- Resolution: 1200×675px minimum
- File size: <500KB
- Format: JPG or WebP
- Save as: `/public/images/resources/[slug]-hero.jpg`

**Content images:**
- Max width: 720px
- PNG for diagrams, JPG for photos
- Always include descriptive alt text
- Save as: `/public/images/resources/[slug]-[description].png`

## Before Publishing

- [ ] Run spell check
- [ ] Verify all links work
- [ ] Add hero image (if applicable)
- [ ] Optimize images (<500KB)
- [ ] Preview locally: `npm run dev`
- [ ] Check reading time is reasonable
- [ ] Add furtherReading links
- [ ] Review Foxxe Take section
