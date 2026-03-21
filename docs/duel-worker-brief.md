# Duel — Claude Code Brief
## Secure deployment of the dual-Claude session tool

**Date:** 2026-03-21  
**Repo:** todd427/foxxelabs-astro (for the frontend)  
**New repo needed:** todd427/duel-worker (Cloudflare Worker)

---

## The Problem

Duel (`public/tools/duel/index.html`) calls the Anthropic API directly from the browser. This requires exposing an API key in the browser — a security risk. The tool needs to be accessible from anywhere Todd has internet access, but must not expose his API key or allow anyone else to use it.

---

## The Solution

Three components:

1. **Cloudflare Worker** — proxies requests to Anthropic, holds the API key as a secret, never exposes it to the browser
2. **Cloudflare Access** — gates the Worker to Todd's email only (documented steps, not code)
3. **Updated Duel frontend** — removes the API key input field, points at the Worker instead of `api.anthropic.com` directly

---

## Component 1: Cloudflare Worker

### New repo: `todd427/duel-worker`

Simple proxy Worker. Receives POST `/v1/messages` from the browser, forwards to Anthropic with the key from environment secrets, returns the response.

```
duel-worker/
  src/
    index.js        ← Worker entry point
  wrangler.toml     ← Cloudflare Worker config
  package.json
  README.md
```

### `src/index.js`

```js
export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://foxxelabs.ie',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Forward to Anthropic
    const body = await request.text();
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://foxxelabs.ie',
      },
    });
  },
};
```

### `wrangler.toml`

```toml
name = "duel-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
# ANTHROPIC_API_KEY is set as a secret via: wrangler secret put ANTHROPIC_API_KEY
# Never put it here.

[[routes]]
pattern = "duel-api.foxxelabs.ie/*"
zone_name = "foxxelabs.ie"
```

### Deploy steps (document in README):

```bash
npm install -g wrangler
wrangler login
wrangler secret put ANTHROPIC_API_KEY   # paste the key when prompted
wrangler deploy
```

The Worker will be live at `duel-api.foxxelabs.ie/v1/messages`.

---

## Component 2: Cloudflare Access (documented steps, not code)

After the Worker is deployed, add a Zero Trust policy in the Cloudflare dashboard:

1. Go to **Zero Trust → Access → Applications → Add an application**
2. Type: **Self-hosted**
3. Application domain: `duel-api.foxxelabs.ie`
4. Policy name: "Todd only"
5. Rule: **Emails** → `l00196908@atu.ie` (and any personal email Todd wants to add)
6. Identity provider: Google (or GitHub — whatever Todd uses)

This means: anyone who hits `duel-api.foxxelabs.ie` gets a Cloudflare login challenge first. Only Todd's email(s) pass. The Anthropic API key is never reachable by anyone else.

Document this process clearly in the Worker README so Todd can configure it without help.

---

## Component 3: Updated Duel frontend

Update `public/tools/duel/index.html` in `todd427/foxxelabs-astro`:

### Changes:

1. **Remove** the API key input field and label from the header entirely
2. **Change** the API endpoint from:
   ```js
   'https://api.anthropic.com/v1/messages'
   ```
   to:
   ```js
   'https://duel-api.foxxelabs.ie/v1/messages'
   ```
3. **Remove** the `x-api-key` header from fetch calls — the Worker handles auth
4. **Remove** the `anthropic-dangerous-direct-browser-access` header — no longer needed
5. **Remove** the sessionStorage API key persistence logic
6. **Update** the header to remove the API key input, reclaim that space for a cleaner layout
7. **Keep** everything else exactly as-is: themes, routing, cross-send, export, all four themes

### The fetch call becomes:

```js
const resp = await fetch('https://duel-api.foxxelabs.ie/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // No x-api-key — Worker handles it
  },
  body: JSON.stringify(body),
});
```

### Add a subtle auth-status indicator:

In the header, where the API key field was, add a small status element:

```html
<span id="authStatus" class="auth-status">● connected</span>
```

If a fetch returns 401/403 (Cloudflare Access rejected), update it to show "● sign in required" with a link to `duel-api.foxxelabs.ie` (visiting that URL will trigger the CF Access login flow, then redirect back).

---

## Definition of Done

- [ ] `duel-worker` repo created, Worker deployed at `duel-api.foxxelabs.ie`
- [ ] `ANTHROPIC_API_KEY` set as a Wrangler secret (not in code)
- [ ] CORS allows requests from `foxxelabs.ie` only
- [ ] README documents the Cloudflare Access setup steps clearly
- [ ] `foxxelabs-astro/public/tools/duel/index.html` updated — no API key field, calls Worker
- [ ] Auth status indicator in header shows connected/sign-in state
- [ ] Duel tested end-to-end: sends a message, gets a response, both panes work
- [ ] Deployed and live at `foxxelabs.ie/tools/duel/`

---

## Context

- Cloudflare account: manages foxxelabs.ie DNS and Pages
- foxxelabs-astro deploys via Cloudflare Pages (auto-deploys on push to master)
- Todd's email for CF Access: check with Todd before setting the policy
- The Duel frontend HTML is already written and working — the Worker + updated fetch is the only change needed
