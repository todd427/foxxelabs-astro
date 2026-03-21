# Léargas — Book Growth Tab Brief
## Phase 0: "The Worm" — writing pipeline visualisation

**Date:** 2026-03-21
**Repo:** todd427/leargas (main branch)
**Target file:** `leargas.html` (add second tab alongside existing memory map)

---

## Concept

A second tab in Léargas showing the growth of each book from first word-count entry to publication. Each book is a dot that grows over time as writing tracker entries accumulate, shifting colour as it moves through the production pipeline.

Data comes from a dedicated Mnemos aggregate endpoint — `/api/aggregate/books` — which does all parsing and grouping server-side. The client gets clean structured data and just renders.

---

## Data Source

### Single endpoint call
```
GET /api/aggregate/books
X-API-Key: <key>
```

Returns a JSON array of book objects:
```json
[
  {
    "title": "Dark Manor",
    "pen_name": "Talla Hill",
    "first_entry": "2024-03-15",
    "last_entry": "2024-11-02",
    "max_word_count": 87500,
    "entries": [
      { "date": "2024-03-15", "word_count": 12000 },
      { "date": "2024-05-02", "word_count": 28500 }
    ],
    "stage": "drafting",
    "milestones": {
      "cover": "2024-06-01",
      "kdp": null,
      "published": null
    }
  }
]
```

See Mnemos server for endpoint implementation.

---

## Visualisation

### Layout
Full-width canvas. Tab switcher in header: `[ Memory Map ] [ Book Growth ]`

### Book Growth view
- **X axis:** calendar time (earliest first_entry → today)
- **Y axis:** light jitter to separate overlapping books
- **One circle per book**, X position = first_entry date
- **Circle radius:** proportional to max_word_count (log scale, min 8px, max 60px)
- **Colour pipeline:**
  - `#4a9eff` — drafting
  - `#f0a500` — cover stage
  - `#e05c5c` — KDP/production
  - `#44cc88` — published
- **Outer ring:** dashed, appears when cover milestone set
- **Second ring:** solid, appears when kdp milestone set

### Interaction
- Hover → tooltip: title, pen name, word count, days in production, stage
- Click → expand side panel with entry list (dates + word counts as sparkline)
- Books with no word count still appear as minimum-size dots

### Animation
Dots grow from 0 over 600ms on tab activation, staggered oldest-first.

---

## Claude Code Handoff

```
Read CLAUDE.md in todd427/leargas, then read leargas.html in full.
Add a second tab "Book Growth" to Léargas following the brief at
docs/leargas-book-growth-brief.md in todd427/foxxelabs-astro.
Data comes from GET /api/aggregate/books on the Mnemos API (same base URL
and API key already used in leargas.html). Do not break the Memory Map tab.
Keep it a single HTML file.
```

---

## Definition of Done

- [ ] Second tab `Book Growth` in header, smooth switch, no reload
- [ ] Calls `/api/aggregate/books` once on tab activation
- [ ] Circles render for all books with entries
- [ ] Radius scales to word count, colour to stage
- [ ] Rings for cover and KDP milestones
- [ ] Hover tooltip: title, pen name, word count, days, stage
- [ ] Click expands entry list with sparkline
- [ ] Privacy mode (already in leargas.html) hides book titles here too
- [ ] Graceful empty state if endpoint returns []
