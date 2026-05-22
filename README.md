# blkgirlsshoot.net

Marketing site for **Blk Girls Shoot 2026** (campaign + community weekend) and the **BGS Summer Internship**, plus the Cloudflare Worker that backs the email-list signup form.

---

## Live surfaces

| Surface | URL | What it is |
|---|---|---|
| Main site | https://blkgirlsshoot.net | Landing page + Insider list signup |
| Internship page | https://blkgirlsshoot.net/internship/ | 2026 cohort marketing/application page |
| Worker (form backend) | https://bgs-rsvp.meccaclarkepro.workers.dev | Validates form input → Klaviyo |
| Klaviyo list | List ID `WBWVDv` ("blkgirlsshoot-2026") | Where Insider signups land |

---

## Repo layout

```
.
├── index.html                  # Main site
├── internship/
│   └── index.html              # Internship cohort page
├── assets/
│   ├── css/styles.css          # Shared brand tokens + components
│   └── js/
│       ├── rsvp.js             # Main-site form → Worker
│       └── slider.js           # Before/after slider (section currently in <template>)
├── worker/
│   ├── src/index.js            # Cloudflare Worker — form -> Klaviyo
│   ├── wrangler.toml           # Worker config + non-secret env vars
│   ├── package.json
│   └── .gitignore              # excludes node_modules/, .wrangler/, .dev.vars
├── CNAME                       # GitHub Pages custom domain (blkgirlsshoot.net)
├── .nojekyll                   # tells Pages: serve files as-is
└── README.md                   # this file
```

---

## Hosting & DNS

- **Site**: GitHub Pages, repo `blacktagdevs/blkgirlsshoot`, branch `main`, root directory.
  Auto-deploys ~30–60s after every push to `main`.
- **Custom domain**: `blkgirlsshoot.net` (apex), configured via the `CNAME` file in repo root.
  DNS: four A records at the registrar pointing at GitHub Pages IPs
  (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`).
- **HTTPS**: GitHub Pages provisions LetsEncrypt; "Enforce HTTPS" is enabled in repo Settings → Pages.

---

## Frontend stack

No build step. Pages are plain HTML served as-is.

- **Tailwind CSS** via CDN (`https://cdn.tailwindcss.com`)
- **Google Fonts**: DM Serif Display (display) + Poppins (body)
- **Brand tokens** live in [`assets/css/styles.css`](assets/css/styles.css) — change the `:root` variables there to retheme the whole site
- **Images** hosted on Cloudflare Images (origin: `imagedelivery.net/sXd5fHTemojcKJ8hQdNwFA/…`).
  Upload a new image in the Cloudflare dashboard → copy the public delivery URL → paste into HTML.
  No local `/assets/*.jpg` files; references are absolute Cloudflare URLs.

---

## The form pipeline (main site)

```
[index.html #rsvp form]
        │ POST JSON {name, email, phone, message}
        ▼
[Cloudflare Worker: bgs-rsvp]
        │  1) POST /api/profiles/                  (upsert profile + properties)
        │  2) POST /api/profile-subscription-      (subscribe to list w/ consent)
        │     bulk-create-jobs/
        ▼
[Klaviyo list WBWVDv]
```

**Field mapping** (form → Klaviyo):

| Form field | Required | Goes to (Klaviyo) |
|---|---|---|
| `name` | yes (browser) | split → `first_name` + `last_name` |
| `email` | yes (browser + Worker regex) | `email` (subscription identifier) |
| `phone` | optional | `phone_number` if normalizable to E.164 (US default), else `properties.phone_raw` |
| `message` | optional | `properties.message` |

Every profile also gets `properties.source = "blkgirlsshoot.net"`.

---

## The Worker

### Bindings (set in `worker/wrangler.toml`)

| Name | Type | Value | Notes |
|---|---|---|---|
| `ALLOWED_ORIGIN` | env var | `https://blkgirlsshoot.net` | CORS lockdown |
| `KLAVIYO_LIST_ID` | env var | `WBWVDv` | The list to subscribe to |
| `KLAVIYO_API_KEY` | **secret** | (encrypted, set via `wrangler secret put`) | Private API key, never in repo |

### Deploying the Worker

```bash
cd worker
export CLOUDFLARE_API_TOKEN='your-cf-token'    # see "Credentials" below
npx wrangler deploy
```

Secrets update **without** redeploying (live propagation).

### Tailing logs (debug)

```bash
cd worker && npx wrangler tail
```

Then trigger a form submission or curl the endpoint — `console.error` lines stream live.

### Smoke-test the Worker directly

```bash
curl -s -X POST https://bgs-rsvp.meccaclarkepro.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test+'$(date +%s)'@example.com","phone":"4045551234","message":"smoke"}'
# Expect: {"ok":true}
```

---

## Credentials & where they live

All secrets live in encrypted stores **outside this repo**. Nothing sensitive is committed.

| Credential | Lives in | How to rotate |
|---|---|---|
| Klaviyo private API key | Cloudflare Worker secret `KLAVIYO_API_KEY` | See "Rotating the Klaviyo key" below |
| Cloudflare API token (for deploys) | Operator's shell session env var `CLOUDFLARE_API_TOKEN` | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → create with "Edit Cloudflare Workers" template |
| Cloudflare account 2FA | Cloudflare account | Standard 2FA reset |
| GitHub repo write access | GitHub account | Standard GH permissions |

### Rotating the Klaviyo key

1. Klaviyo dashboard → **Settings → API Keys**
2. Revoke the existing private key
3. **Create Private API Key** with scopes: `Profiles: Full`, `Lists: Full`, `Subscriptions: Full`
4. Copy the new key (Klaviyo only shows it once)
5. Pipe it directly into Wrangler — don't paste it into chat, email, or any file:
   ```bash
   cd worker
   printf '%s' 'PASTE_NEW_KEY_HERE' | npx wrangler secret put KLAVIYO_API_KEY
   ```
6. Verify with the smoke-test curl above. No redeploy needed.

---

## Common content edits

### Change brand colors / fonts site-wide
Edit `:root` variables at the top of [`assets/css/styles.css`](assets/css/styles.css). Both pages pick up the change automatically.

### Add a nav link to the main site
Edit the `<nav>` block in [`index.html`](index.html) (around line 43). Use a `#section-id` anchor for in-page nav or a relative path (e.g., `internship/`) for cross-page.

### Swap a hero / gallery / founder image
1. Upload to Cloudflare Images
2. Copy the delivery URL (looks like `https://imagedelivery.net/sXd5fHTemojcKJ8hQdNwFA/<UUID>/public`)
3. Replace the `src` attribute in the HTML — no local files involved

### Unhide the Before/After or Pricing section
Both are wrapped in `<template>` tags in [`index.html`](index.html). Remove the surrounding `<template>` / `</template>` and uncomment the "Schedule" nav link.

---

## Forms

### Main site — Insider signup (`#rsvp`)
Wired to the Worker → Klaviyo (described above).

### Internship — Application form
Currently uses **`mailto:info@blkgirlsshoot.net`** with `enctype="text/plain"`. This opens the visitor's mail client with pre-filled fields. Brittle for users without a configured mail client.

Possible upgrades when ready:
- Route through the existing Worker into a new Klaviyo list (e.g., "Internship 2026 Applicants") with per-field custom properties
- Or use Tally / Typeform / Airtable form embed
- Or Formspree as a simple email-forwarding endpoint

---

## What's currently hidden

- **Before/After slider section** — preserved in `<template>` in [`index.html`](index.html); needs imagery
- **Pricing section** — preserved in `<template>`; needs pricing decisions
- **"Schedule" nav link** — commented out in the main nav, paired with the hidden Pricing section

To restore any of these, unwrap the template tag and uncomment the nav link.

---

## Punch list / known limitations

- **No rate limiting** on the Worker. Form is open to anyone POSTing; bots can mass-submit garbage. Cloudflare WAF rule (rate-limit by IP) or a tiny honeypot field would close this.
- **Internship form** is mailto-based (see Forms section).
- **Cloudflare token** in operator's shell isn't persistent. If you want it across sessions, store via 1Password CLI or a sourced env file (outside the repo).
- **Tailwind via CDN** is fine for marketing pages but blows up bundle size on every visit. If the site grows or perf matters, swap to a built Tailwind step.

---

## Quick command cheat-sheet

```bash
# Deploy Worker
cd worker && export CLOUDFLARE_API_TOKEN='…' && npx wrangler deploy

# Update Klaviyo key
cd worker && printf '%s' 'KEY' | npx wrangler secret put KLAVIYO_API_KEY

# Tail Worker logs
cd worker && npx wrangler tail

# List Worker secrets (names only, no values)
cd worker && npx wrangler secret list

# Smoke-test the live Worker
curl -s -X POST https://bgs-rsvp.meccaclarkepro.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"smoke+'$(date +%s)'@example.com"}'

# Inspect a specific subscriber in Klaviyo (run locally; don't paste KEY)
curl -s -H "Authorization: Klaviyo-API-Key $KEY" \
     -H "revision: 2026-04-15" \
     -H "accept: application/json" \
     'https://a.klaviyo.com/api/profiles/?filter=equals(email,"someone@example.com")'
```
