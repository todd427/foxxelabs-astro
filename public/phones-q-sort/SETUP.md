# Phones in Schools — Q-Sort

A Q-methodology sort hosted at `/phones-q-sort/` with a presenter live tally at `/phones-q-sort/live/`.

## How it works

- **`index.html`** — participant page. 30 statements about mobile phones in schools, drag-and-drop onto a forced 7-column quasi-normal grid (2-4-5-8-5-4-2). On submit, computes similarity to five viewpoint templates and shows the closest match, then POSTs the sort to the Worker.
- **`live/index.html`** — presenter page. Polls the Worker every 5 seconds, shows mean placement and distribution per statement, sortable by mean or variance, plus most-agreed/disagreed/divisive stats.

Both pages talk to a Cloudflare Worker at `q-sort-api.foxxelabs.ie` for cross-visitor aggregation. **The Worker auto-deploys via GitHub Actions on every push to master that touches `worker/q-sort/**`.** No manual deploy step.

## First-time bring-up

The Worker needs two repo-level Cloudflare credentials before its first auto-deploy can run. See `worker/q-sort/README.md` for the 3-minute setup.

If the Worker isn't deployed yet, the participant page still works — sorts cache in localStorage and the user sees their result — but the live tally page will show "Worker offline" until the Worker is up.

## GDPR

No personal data is collected. Each submitted record is `{ ts: <ISO timestamp>, sort: { "1": -3..+3, ... "30": -3..+3 } }`. No identifier, no IP, no fingerprint. The Worker validates and drops anything else from the body before storage. This is aggregate behavioural data, not personal data under GDPR Article 4(1). The intro screen on the participant page discloses what's stored.

## Cohort analysis

Every record is timestamped, so post-hoc cohort filtering is one fetch:

```bash
curl -s "https://q-sort-api.foxxelabs.ie/sorts?study=phones-q-sort" \
  | jq '.sorts | map(select(.ts | startswith("2026-05-01")))'
```

For proper Q-factor analysis later (people-by-people correlation, Ward linkage, factor extraction), export the array as JSON and feed it to `qmethod` in R or `pyqmethod` in Python.

## Adjusting the Q-set

The 30 statements are defined in the `STATEMENTS` array at the top of both `index.html` and `live/index.html`. **Edit both files together** — they need to stay in sync. The viewpoint templates in `VIEWPOINTS` (in `index.html` only) reference statement numbers; if you renumber, update those too.

## Adjusting the grid shape

The forced-distribution shape lives in `CONFIG.COL_COUNTS` (currently `[2, 4, 5, 8, 5, 4, 2]` summing to 30). Change the count, also update `CONFIG.COL_LABELS` and `CONFIG.COL_VALUES`, and ensure the new shape sums to your statement count.

## Adding a new study

Reuse the same Worker. In a new participant page, set:

```js
CONFIG.WORKER_URL = "https://q-sort-api.foxxelabs.ie";
CONFIG.STUDY_NAME = "your-new-study-name";   // alnum/-/_, ≤64 chars
```

Push to master. The Worker auto-namespaces under the new study key. No worker redeploy required (no `worker/q-sort/**` files changed, so the deploy workflow doesn't even run).
