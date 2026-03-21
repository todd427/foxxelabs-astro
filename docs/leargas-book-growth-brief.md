# Léargas — Book Growth Tab Brief
## Phase 0: "The Worm" — writing pipeline visualisation

**Date:** 2026-03-21
**Repo:** todd427/leargas (main branch)
**Target file:** `leargas.html` (add second tab alongside existing memory map)

---

## Concept

A second tab in Léargas showing the growth of each book from first word-count entry to publication. Each book is a dot that grows over time as writing tracker entries accumulate, shifting colour as it moves through the production pipeline.

Data comes entirely from Mnemos — no new backend needed. The tab queries writing_tracker and publication_meta sources at load time and builds the visualisation client-side.

---

## Data Sources (all from Mnemos API)

### 1. Writing tracker entries
```
POST /api/query
{ "query": "word count progress", "type_filter": "all", "top": 50 }
```
Filter results where `sft_tag == "gdrive"` and `type == "writing_tracker"`.

Metadata fields available:
- `book_or_subject` — book title
- `folder_path` — path context
- `modified` — date of entry (YYYY-MM-DD)
- `pen_name` — Todd McCaffrey or Talla Hill

Parse word count from chunk text — patterns to extract:
- `"X,XXX words"`, `"X,XXX wc"`, `"total: X,XXX"`, bare numbers near "word"

### 2. Publication metadata
```
POST /api/query  
{ "query": "KDP cover ISBN publication", "type_filter": "all", "top": 50 }
```
Filter where `type == "publication_meta"`.

Used to detect pipeline milestones:
- Cover art detected: folder_path contains "cover" or "art"
- KDP setup: text contains "KDP", "ISBN", "ingram"
- Published: text contains "published", "live", "went live"

---

## Visualisation

### Layout
Full-width canvas (same container as memory map tab). Tab switcher in header: `[ Memory Map ] [ Book Growth ]`

### Book Growth view
- **X axis:** calendar time (first tracker entry → today)
- **Y axis:** none (or light jitter to separate overlapping books)
- **One circle per book**, positioned at X = first entry date
- **Circle radius:** grows proportionally to word count (log scale, min 8px, max 60px)
- **Colour pipeline:**
  - `#4a9eff` — drafting (writing_tracker entries only)
  - `#f0a500` — cover stage (publication_meta with cover detected)
  - `#e05c5c` — KDP/production (ISBN/KDP detected)
  - `#44cc88` — published
- **Outer ring:** appears when cover art milestone detected (dashed stroke)
- **Second ring:** appears when KDP/ISBN milestone detected (solid stroke)

### Interaction
- Hover → tooltip: book title, pen name, word count, days in production, current stage
- Click → expand panel showing all tracker entries for that book (dates + word counts as mini sparkline)
- Books with no word count data still appear as minimum-size dots (metadata-only)

### Animation
On tab switch, dots grow from radius 0 over 600ms (staggered by book start date, oldest first).

---

## Implementation Notes

### Data loading
All Mnemos queries happen once on tab activation, results cached in memory. No polling.

Use `fetch` with the existing MNEMOS_URL and MNEMOS_API_KEY approach already in leargas.html.

```js
async function loadBookData() {
  const [trackerResp, metaResp] = await Promise.all([
    queryMnemos("word count progress writing tracker", 50),
    queryMnemos("KDP cover ISBN publication release", 50),
  ]);
  return buildBookIndex(trackerResp.hits, metaResp.hits);
}
```

### Word count extraction
```js
function extractWordCount(text) {
  const patterns = [
    /(\d[\d,]+)\s*words?/i,
    /wc[:\s]+(\d[\d,]+)/i,
    /total[:\s]+(\d[\d,]+)/i,
    /(\d[\d,]+)\s*wc/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1].replace(/,/g, ''));
  }
  return null;
}
```

### Book index structure
```js
{
  "Dark Manor": {
    title: "Dark Manor",
    penName: "Talla Hill",
    entries: [
      { date: "2024-03-15", wordCount: 12000 },
      { date: "2024-05-02", wordCount: 28500 },
    ],
    maxWordCount: 28500,
    firstDate: "2024-03-15",
    stage: "drafting" | "cover" | "kdp" | "published",
    milestones: { cover: "2024-06-01", kdp: null, published: null }
  }
}
```

---

## Definition of Done

- [ ] Second tab `Book Growth` appears in Léargas header alongside `Memory Map`
- [ ] Tab switch is smooth, no page reload
- [ ] Dots render for all books with writing_tracker data
- [ ] Word count parsed and radius scales correctly
- [ ] Colour reflects pipeline stage
- [ ] Hover tooltip shows: title, pen name, word count, days in production, stage
- [ ] Click expands entry list with dates and counts
- [ ] Rings appear for cover and KDP milestones where data exists
- [ ] Works with existing Mnemos API key setup in leargas.html
- [ ] Privacy mode toggle (already in leargas.html) hides book titles in this tab too
- [ ] Graceful empty state if no writing_tracker data found

---

## Claude Code Handoff

```
Read CLAUDE.md in todd427/leargas, then read leargas.html in full.
Add a second tab "Book Growth" to the existing Léargas single-file app
following the brief in docs/leargas-book-growth-brief.md in todd427/foxxelabs-astro.
Do not break the existing Memory Map tab. Keep it a single HTML file.
```
