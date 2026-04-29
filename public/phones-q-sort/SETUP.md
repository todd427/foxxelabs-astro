# Phones in Schools — Q-Sort Setup

A two-page Q-methodology sort hosted at `/phones-q-sort/` with a live tally at `/phones-q-sort/live/`.

## What this is

- **`index.html`** — the participant page. 30 statements about mobile phones in schools, drag-and-drop onto a forced 7-column quasi-normal grid (2-4-5-8-5-4-2). On submit, computes similarity to five viewpoint templates and shows the closest match.
- **`live/index.html`** — the presenter page. Reads the running tally, refreshes every 10 seconds, shows mean placement and distribution per statement plus stats (most-agreed, most-disagreed, most-divisive). Sortable by mean or variance.

## Wiring the cross-visitor live tally (5 minutes)

Without this step, both pages work but each browser only sees its own sorts (localStorage). To make the live tally aggregate sorts across all visitors:

1. Sign up free at <https://jsonbin.io>.
2. **Create a new bin** with this initial JSON content:
   ```json
   { "sorts": [] }
   ```
   Note its bin ID (looks like `65f1e2a4...`).
3. Get your **Master Key** from your account page (X-Master-Key value).
4. Open `index.html` and `live/index.html`. In the `CONFIG` block at the top of the inline `<script>` tag, fill in:
   ```javascript
   BIN_URL: "https://api.jsonbin.io/v3/b/YOUR_BIN_ID",
   BIN_KEY: "YOUR_MASTER_KEY",
   ```
   **Both files must have the same values.**
5. Commit and deploy as normal.

That's it. The free tier covers 10,000 requests per month, plenty for classroom + casual public use.

## How the data shape works

Each submission is one record:

```json
{
  "ts": "2026-04-29T18:30:00.000Z",
  "sort": { "1": 3, "2": -1, "3": 0, ... "30": 2 }
}
```

The bin holds an array of these under `{ "sorts": [ ... ] }`. Timestamps mean later analysis can compare cohorts (the Friday lesson group vs subsequent visitors).

## GDPR / ethics

**No personal data is collected.** No name, email, IP, fingerprint, or session ID. Each record contains only:
- A timestamp
- The placement of each statement on the −3 to +3 grid

This is aggregate behavioural data, not personal data under GDPR Article 4(1). The intro screen on the participant page discloses what's stored. No consent banner, DPIA, or retention policy required for this scope.

If you ever decide to extend with identifiers (email, demographics), that becomes personal data and the compliance picture changes — at that point handle it as a separate research instrument with proper ATU ethics clearance, not the public quiz.

## Cohort analysis later

Because every record is timestamped, you can later filter by date range to compare cohorts. For example, after the Friday lesson:

```javascript
// In a console on /phones-q-sort/live/
fetch("https://api.jsonbin.io/v3/b/YOUR_BIN_ID/latest", {
  headers: { "X-Master-Key": "YOUR_KEY" },
})
.then(r => r.json())
.then(data => {
  const friday = data.record.sorts.filter(s => s.ts.startsWith("2026-05-01"));
  console.log("Friday cohort:", friday.length, "sorts");
  // ... do whatever with the slice
});
```

For a proper Q-factor-analysis later (people-by-people correlation, Ward linkage, factor extraction), export the full sort array as JSON, run `qmethod` in R or `pyqmethod` in Python.

## Failure modes

- **Bin URL/key blank** — page works locally, but live tally is per-browser only. Useful for testing; not for the live lesson.
- **Bin URL/key set but unreachable** — submission falls back to localStorage, toast shows "Saved locally — live tally unavailable". Page still works.
- **Race condition on simultaneous submissions** — two visitors hitting submit within the same second can each read the bin, both append, both write, last write wins (one record lost). For a 25-student lesson this is unlikely. If it ever matters, swap jsonbin.io for a tiny Cloudflare Worker that does atomic appends.

## Adjusting the Q-set

The 30 statements are defined in the `STATEMENTS` array at the top of both `index.html` and `live/index.html`. **Edit both files together** — they need to stay in sync. The viewpoint templates in `VIEWPOINTS` (in `index.html` only) reference statement numbers; if you change a statement's number, update those references too.

## Adjusting the grid shape

The forced-distribution shape lives in `CONFIG.COL_COUNTS` (currently `[2, 4, 5, 8, 5, 4, 2]` summing to 30). If you change the count, also update `CONFIG.COL_LABELS` and `CONFIG.COL_VALUES` to match the new column count, and ensure the new shape sums to your statement count.
