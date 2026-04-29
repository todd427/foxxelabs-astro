# q-sort-worker

Cloudflare Worker that holds the live tally for `/phones-q-sort/` on foxxelabs.ie. Replaces the jsonbin.io approach. No third-party services, no API key, no signup.

## Live URL

`https://q-sort-api.foxxelabs.ie`

## Endpoints

All accept an optional `?study=<name>` query param (defaults to `phones-q-sort`). The study param namespaces submissions, so the same Worker serves future Q-sorts without redeployment.

| Method | Path | Body / Returns |
|---|---|---|
| `GET`  | `/sorts` | `{ study, sorts: [...] }` — all submissions |
| `GET`  | `/count` | `{ study, count: N }` — running total only (cheaper) |
| `POST` | `/sorts` | Body: `{ ts, sort: { "<n>": <-3..+3> } }` → `{ ok, count }` |

The Worker drops anything in the POST body other than `ts` and `sort` — no IPs, fingerprints, or arbitrary fields land in storage.

## Deploy (one-time, ~3 minutes)

You need `wrangler` installed and logged into the Cloudflare account that owns `foxxelabs.ie`. If you've already deployed `duel-worker`, you have wrangler set up.

```bash
cd worker/q-sort
npm install                                  # installs wrangler locally if not global

# Create the KV namespace (one-time per account)
npx wrangler kv namespace create Q_SORTS
# Output looks like:
#   [[kv_namespaces]]
#   binding = "Q_SORTS"
#   id = "abc123def456..."

# Paste that `id` value into wrangler.toml, replacing REPLACE_WITH_KV_NAMESPACE_ID

# Deploy
npx wrangler deploy
```

That's it. The Worker is live at `q-sort-api.foxxelabs.ie/sorts`. DNS auto-provisions because the zone is already in your Cloudflare account.

Verify with:

```bash
curl https://q-sort-api.foxxelabs.ie/count
# {"study":"phones-q-sort","count":0}
```

## Wiring the frontend

Once the Worker is deployed, the `/phones-q-sort/` and `/phones-q-sort/live/` pages already point at it via `CONFIG.WORKER_URL`. No editing required — that's the "automagic" part. If you ever change the Worker hostname, update `WORKER_URL` in both `public/phones-q-sort/index.html` and `public/phones-q-sort/live/index.html`.

## Adding a new study

Reuse the same Worker for any future Q-sort:

1. Build the new sort page under `public/<new-q-sort>/index.html`.
2. Set `CONFIG.STUDY_NAME = "<new-q-sort>"` and `CONFIG.WORKER_URL = "https://q-sort-api.foxxelabs.ie"`.
3. Deploy. The Worker auto-namespaces under the new study key.

## Operations

```bash
# Live logs
npx wrangler tail

# Reset a study (deletes all submissions)
npx wrangler kv key delete --binding=Q_SORTS "phones-q-sort"

# Export sorts to a file for offline analysis
curl https://q-sort-api.foxxelabs.ie/sorts > phones-sorts-$(date +%Y%m%d).json
```

## GDPR

No personal data is collected. Records contain only an ISO timestamp and the sort positions (statement number → −3..+3). Not personal data under GDPR Article 4(1). The participant page discloses this on the intro screen.

## Cost

Free tier: Workers 100,000 requests/day, KV 100,000 reads/day + 1,000 writes/day. A 30-student classroom session uses roughly 60 writes and a few hundred reads. Nowhere near the limits.

## Concurrency

KV doesn't support native append, so the Worker does read-modify-write. For classroom-scale (≤200 concurrent submissions over a few minutes) this is safe — Workers serialise within an instance, and the eventual-consistency window is shorter than human submission cadence. If you ever needed thousands of simultaneous submissions, swap KV for a Durable Object — same Worker, one-line binding change. Not needed for current use.
