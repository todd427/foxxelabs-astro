# Claude Code Handoff — Léargas Book Growth Tab

## What to build

Add a second tab "Book Growth" to the existing Léargas memory map visualisation.

## Files involved

- **Modify:** `public/leargas/memory_map.html` in `todd427/foxxelabs-astro`
- **Brief:** `docs/leargas-book-growth-brief.md` in `todd427/foxxelabs-astro`
- **Keep untouched:** the existing Memory Map tab and all its functionality

## Data source

Single API call to Mnemos:
```
GET https://mnemos.foxxelabs.ie/api/aggregate/books
X-API-Key: <same key already used in memory_map.html>
```

Returns a JSON array of book objects — see the brief for the full schema.

## Key constraints

- Single HTML file — no separate JS or CSS files
- Must not break the existing Memory Map tab
- Privacy mode toggle (already in the file) must also hide book titles in the new tab
- Deployed via Cloudflare Pages on push to master — no build step needed

## Implementation summary

1. Add `[ Memory Map ] [ Book Growth ]` tab switcher to the header
2. On "Book Growth" tab activation, call `/api/aggregate/books` once and cache
3. Render circles on a canvas/SVG: X=time, radius=word count, colour=stage
4. Hover tooltip: title, pen name, word count, days in production, stage
5. Click: expand entry list with word count sparkline
6. Animate dots growing from 0 on tab switch (600ms, staggered oldest-first)

Full visual spec and colour values are in `docs/leargas-book-growth-brief.md`.
