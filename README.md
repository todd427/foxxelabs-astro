# Foxxe Labs Resources + News System

A static site built with Astro for publishing in-depth resources and curated news about AI security, applications, and industry developments.

## Features

- 📝 **Content Collections**: Structured resources and news with full frontmatter validation
- 🏷️ **Taxonomy**: Categories and tags with automatic index pages
- 🎨 **Distinctive Design**: Custom dark theme with Crimson Pro + IBM Plex Mono
- 🖼️ **Hero Images**: First-class image support with consistent styling
- 📚 **Further Reading**: Structured citation and source links
- 🔍 **SEO Ready**: OpenGraph, Twitter Cards, canonical URLs, sitemap
- 📡 **RSS Feed**: Combined feed for resources and news
- ⚡ **Performance**: Static output, optimized for speed
- 🎭 **Animations**: Subtle fade-ins and staggered reveals

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
/
├── public/
│   └── images/
│       ├── resources/
│       └── news/
├── src/
│   ├── content/
│   │   ├── config.ts          # Content collection schemas
│   │   ├── resources/          # Resource markdown files
│   │   └── news/               # News markdown files
│   ├── layouts/
│   │   ├── BaseLayout.astro    # Site-wide layout
│   │   └── PostLayout.astro    # Individual post layout
│   ├── pages/
│   │   ├── resources/
│   │   │   ├── index.astro     # Resources index
│   │   │   ├── [slug].astro    # Individual resource
│   │   │   ├── tags/[tag].astro
│   │   │   └── categories/[category].astro
│   │   ├── news/
│   │   │   ├── index.astro     # News index
│   │   │   └── [slug].astro    # Individual news item
│   │   └── rss.xml.js          # RSS feed
│   └── components/             # Reusable components (add as needed)
└── astro.config.mjs
```

## Creating Content

### Resource Post

Create a new file in `src/content/resources/my-post.md`:

```markdown
---
title: "Your Title Here"
description: "Brief summary for SEO and social sharing"
publishDate: 2026-01-11
updatedDate: 2026-01-12  # Optional
category: "Foundations"
tags: ["Machine Learning", "Security", "Applications"]
heroImage: "/images/resources/my-post-hero.jpg"
heroImageAlt: "Description of hero image"
readingTime: "10 min read"  # Optional
furtherReading:
  - title: "Source Title"
    url: "https://example.com"
    source: "Author/Publisher"  # Optional
draft: false
---

## Your Content Here

Write your post content in Markdown...
```

### News Post

Create a new file in `src/content/news/my-news.md`:

```markdown
---
title: "News Title"
description: "Brief summary"
publishDate: 2026-01-11
category: "Industry"
tags: ["Breaking", "Security"]
heroImage: "/images/news/my-news-hero.jpg"
heroImageAlt: "Description"
source: "TechCrunch"  # Optional
sourceUrl: "https://techcrunch.com/article"  # Optional
draft: false
---

Your news content here...
```

## Content Guidelines

### Recommended Post Structure (Resources)

Following the PRD template:

1. **Why This Matters** - Context and relevance
2. **The Map** - Taxonomy/framework
3. **Practical Uses** - Real-world applications
4. **Tradeoffs & Failure Modes** - What can go wrong
5. **What Changed Recently** - Latest developments with sources
6. **What to Watch Next** - Emerging trends
7. **Foxxe Take** - Your perspective

### Categories

Suggested categories (customize as needed):
- **Resources**: Foundations, Applications, Security, Industry
- **News**: Breaking, Research, Industry, Security

## Image Guidelines

### Hero Images

**Specifications:**
- Aspect ratio: 16:9 (recommended)
- Minimum resolution: 1200×675px
- Maximum file size: 500KB (optimize with tools like TinyPNG)
- Format: JPG or WebP

**Naming convention:**
```
/public/images/resources/[slug]-hero.jpg
/public/images/news/[slug]-hero.jpg
```

**Content guidelines:**
- Abstract, conceptual imagery preferred over literal representations
- Dark or muted color palettes that complement site theme
- Avoid text overlays (will be handled by layout)
- Consider how image looks with gradient overlay

### Inline Images

```markdown
![Alt text description](/images/resources/diagram-name.png)
```

**Specifications:**
- Maximum width: 720px (content width)
- Format: PNG for diagrams, JPG for photos
- Add descriptive alt text for accessibility

## Styling & Customization

### Color Variables

Edit in `BaseLayout.astro`:

```css
:root {
  --color-bg: #0f0f0f;
  --color-surface: #1a1a1a;
  --color-accent: #d4a574;
  /* ... */
}
```

### Typography

Current fonts:
- **Display/Body**: Crimson Pro (Google Fonts)
- **Monospace**: IBM Plex Mono (Google Fonts)

To change fonts, update the Google Fonts link in `BaseLayout.astro` and the CSS variables.

## Content Callouts

Use HTML in markdown for styled callouts:

```html
<div class="callout">
  <h4>Gotcha</h4>
  <p>Important warning or caveat...</p>
</div>
```

## Deployment

### Cloudflare Pages (Recommended)

1. Connect your Git repository to Cloudflare Pages
2. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 18+

### Other Platforms

Works with any static hosting:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## Development Workflow

### Creating a New Post

1. Create markdown file in appropriate content folder
2. Add frontmatter with all required fields
3. Write content following recommended structure
4. Add hero image to `/public/images/`
5. Preview locally: `npm run dev`
6. Commit and push (triggers deployment)

### Draft Posts

Set `draft: true` in frontmatter to exclude from production builds.

## Analytics

Ready for analytics integration. Recommended options:

- **Cloudflare Web Analytics**: Zero-config, privacy-focused
- **Plausible**: Privacy-focused, lightweight
- **Google Analytics**: If detailed tracking needed

Add script tags to `BaseLayout.astro` `<head>`.

## Performance

Current optimizations:
- Static HTML generation
- No JavaScript by default (except animations via CSS)
- Image optimization recommended (use tools or Astro image optimization)
- Grain texture via inline SVG (minimal overhead)

## Maintenance

### Regular Tasks

1. **Content updates**: Review "What Changed Recently" sections quarterly
2. **Link checking**: Verify external links remain valid
3. **Image optimization**: Compress new images before adding
4. **Dependency updates**: `npm outdated` and update regularly

### Monitoring

Track:
- Build times (should be <2 min for 50 posts)
- Page load speed (aim for LCP <2.5s)
- RSS feed subscriber count
- Top-performing content

## Troubleshooting

### Build fails with "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Images not showing

- Verify path starts with `/images/`
- Check file exists in `/public/images/`
- Ensure filename matches exactly (case-sensitive)

### Styling looks broken

- Clear browser cache
- Check for console errors
- Verify all CSS variables defined

## Future Enhancements

Potential additions (not in MVP):

- Search functionality
- Related posts algorithm
- Newsletter integration
- Comment system (Giscus/Disqus)
- Reading progress indicator
- Table of contents for long posts
- Dark/light mode toggle
- Author profiles

## License

[Your license here]

## Questions?

[Your contact information]
