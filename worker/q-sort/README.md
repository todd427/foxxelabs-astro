# q-sort-worker

Cloudflare Worker that holds the live tally for `/phones-q-sort/` on foxxelabs.ie. No third-party services, no API key, no signup, no per-user configuration.

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

## Deployment

Auto-deploys via GitHub Actions on any push to master that touches `worker/q-sort/**`. See `.github/workflows/deploy-q-sort-worker.yml`.

### One-time setup (per repo, ~3 min)

In GitHub repo **Settings → Secrets and variables → Actions**:

**Secrets** (sensitive):
- `CLOUDFLARE_API_TOKEN` — create at <https://dash.cloudflare.com/profile/api-tokens>. Use the **Edit Cloudflare Workers** template. The token needs:
  - Account → Workers Scripts → Edit
  - Account → Workers KV Storage → Edit
  - Zone → Workers Routes → Edit (for `foxxelabs.ie`)
- `CLOUDFLARE_ACCOUNT_ID` — visible on any Workers/Pages page in the dashboard, right sidebar.

**Variables** (non-sensitive):
- `KV_NAMESPACE_ID` — created automatically on the first workflow run. After the first deploy, copy the id from the Actions log into this variable so future runs skip the lookup step.

That's the entire setup. Push the repo and the Worker deploys.

### Manual deploy fallback

If you need to deploy from your local machine instead of GitHub Actions:

```bash
cd worker/q-sort
npm install
npx wrangler kv namespace create Q_SORTS   # one-time, copy the printed id
# Paste that id into wrangler.toml, replacing REPLACE_WITH_KV_NAMESPACE_ID
npx wrangler deploy
```

## Verifying

```bash
curl https://q-sort-api.foxxelabs.ie/count
# {"study":"phones-q-sort","count":0}
```

The deploy workflow runs this same check automatically and fails the build if the Worker is unreachable after deploy.

## Adding a new study

Reuse the same Worker for any future Q-sort:

1. Build the new sort page under `public/<new-q-sort>/index.html`.
2. Set `CONFIG.STUDY_NAME = "<new-q-sort>"` and `CONFIG.WORKER_URL = "https://q-sort-api.foxxelabs.ie"`.
3. Push. The Worker auto-namespaces under the new study key — no redeploy needed.

## Operations

```bash
# Live logs (from your local machine, requires wrangler login)
cd worker/q-sort && npx wrangler tail

# Reset a study (deletes all submissions)
npx wrangler kv key delete --namespace-id=$KV_NAMESPACE_ID "phones-q-sort"

# Export sorts to a file for offline analysis
curl https://q-sort-api.foxxelabs.ie/sorts > phones-sorts-$(date +%Y%m%d).json
```

## GDPR

No personal data is collected. Records contain only an ISO timestamp and the sort positions (statement number → −3..+3). Not personal data under GDPR Article 4(1). The participant page discloses this on the intro screen.

## Cost

Free tier: Workers 100,000 requests/day, KV 100,000 reads/day + 1,000 writes/day. A 30-student classroom session uses roughly 60 writes and a few hundred reads. Nowhere near the limits.

## Concurrency

KV doesn't support native append, so the Worker does read-modify-write. For classroom-scale (≤200 concurrent submissions over a few minutes) this is safe — Workers serialise within an instance, and the eventual-consistency window is shorter than human submission cadence. If you ever needed thousands of simultaneous submissions, swap KV for a Durable Object — same Worker, one-line binding change. Not needed for current use.
