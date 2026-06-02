# blkgirlsshoot.net

Marketing site for **Blk Girls Shoot 2026** (campaign + community weekend) and the **BGS Summer Internship**, plus the Cloudflare Worker that backs the email-list signup form.

---

## Live surfaces

| Surface | URL | What it is |
|---|---|---|
| Main site | https://blkgirlsshoot.net | Landing page + Insider list signup |
| Internship page | https://blkgirlsshoot.net/internship/ | 2026 cohort marketing page · application modal currently **closed** |
| Worker (form backend) | https://bgs-rsvp.meccaclarkepro.workers.dev | `POST /` → Klaviyo · `POST /apply` → Airtable (route live, UI disabled) |
| Klaviyo list | List ID `WBWVDv` ("blkgirlsshoot-2026") | Where Insider signups land |
| Airtable base | Base `appNZw4xbiqvXIhLS` · Table `tblGjNHVdoeWhfZOl` ("INTERN APPLICATIONS — Master View") | Where internship applications land (dormant until next cohort) |

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
│       ├── rsvp.js             # Main-site Insider form → Worker /
│       ├── apply.js            # Internship modal form → Worker /apply
│       └── slider.js           # Before/after slider (section currently in <template>)
├── worker/
│   ├── src/index.js            # Cloudflare Worker — routes / -> Klaviyo, /apply -> Airtable
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

## Form pipelines

The same Worker (`bgs-rsvp`) handles both forms, dispatching on the URL path.

### Main site — Insider signup → Klaviyo

```
[index.html #rsvp form]
        │ POST JSON {name, email, phone, message}
        ▼
[Cloudflare Worker: bgs-rsvp · path = / ]
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

### Internship page — Application modal → Airtable

> ⚠️ **Currently closed.** The application modal is removed from the page; the `#apply`
> section shows an "Applications Closed" message redirecting visitors to the Insider list.
> The Worker `/apply` route and the Airtable wiring are still live (anyone can still POST
> to the endpoint directly), so re-enabling next year is just: restore the form markup,
> re-add the `apply.js` `<script>` tag, and revert the closed-state copy in `#apply`.
> Reference: [`assets/js/apply.js`](assets/js/apply.js) still in repo, Worker route
> [`worker/src/index.js`](worker/src/index.js) `handleApply()` untouched.

```
[internship/index.html  <dialog id="apply-modal">]
        │ POST JSON {first_name, last_name, email, ..., social_platforms[], tools[], ...}
        ▼
[Cloudflare Worker: bgs-rsvp · path = /apply ]
        │ POST https://api.airtable.com/v0/{base}/{table}
        │   { fields: { "First Name": "...", ... }, typecast: true }
        ▼
[Airtable Master View — one row per submission]
```

`typecast: true` tells Airtable to auto-create new multi-select options and coerce types,
so a slightly off value (e.g. a new tool the form doesn't list yet) doesn't 422 the request.

**Field mapping** (form → Airtable column):

| Form field | Airtable column | Type |
|---|---|---|
| `first_name` *(required)* | First Name | Single line text |
| `last_name` *(required)* | Last Name | Single line text |
| `pronouns` | Pronouns | Single line text |
| `email` *(required)* | Email | Email |
| `phone` | Phone | Phone |
| `city_state` | City + State | Single line text |
| `school_year` | School / Year | Single line text |
| `instagram` | Instagram Handle | Single line text |
| `portfolio` | Portfolio / LinkedIn | URL |
| `work_sample` | Work Sample URL | URL |
| `sample_caption` | Sample Caption | Long text |
| `why_bgs` | Why BGS | Long text |
| `marketing_experience` | Marketing Experience | Single select (Yes/No) |
| `social_platforms[]` | Social Platforms Used | Multi-select |
| `tools[]` | Tools Familiar With | Multi-select |
| `available_shoot_week` | Available Shoot Week (Sept 5-7) | Single select (Yes/Maybe/No) |
| `hours_per_week` | Hours / Week Available | Single line text |
| `location_type` | Location Type | Single select (Remote/Hybrid/In-person) |
| `heard_about_us` | Heard About Us | Single line text |

Internal-only Airtable columns (Application Status, Date Applied, Mecca's Rating, Strengths,
Concerns, Interview Date, Notes) are left blank on submission and filled in by Mecca.

---

## The Worker

### Bindings (set in `worker/wrangler.toml`)

| Name | Type | Value | Notes |
|---|---|---|---|
| `ALLOWED_ORIGIN` | env var | `https://blkgirlsshoot.net` | CORS lockdown |
| `KLAVIYO_LIST_ID` | env var | `WBWVDv` | The list to subscribe to |
| `KLAVIYO_API_KEY` | **secret** | encrypted, set via `wrangler secret put` | Klaviyo private API key |
| `AIRTABLE_BASE_ID` | env var | `appNZw4xbiqvXIhLS` | Internship applications base |
| `AIRTABLE_TABLE_ID` | env var | `tblGjNHVdoeWhfZOl` | Master View table |
| `AIRTABLE_TOKEN` | **secret** | encrypted, set via `wrangler secret put` | Airtable PAT, scope `data.records:write` |

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
# Klaviyo subscribe path
curl -s -X POST https://bgs-rsvp.meccaclarkepro.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test+'$(date +%s)'@example.com","phone":"4045551234","message":"smoke"}'
# Expect: {"ok":true}

# Airtable apply path
curl -s -X POST https://bgs-rsvp.meccaclarkepro.workers.dev/apply \
  -H 'Content-Type: application/json' \
  -d '{"first_name":"Smoke","last_name":"Test","email":"apply+'$(date +%s)'@example.com","phone":"4045551234","city_state":"Atlanta, GA","why_bgs":"smoke","marketing_experience":"Yes","social_platforms":["Instagram"],"tools":["Canva"],"available_shoot_week":"Yes","hours_per_week":"8-10","location_type":"Remote"}'
# Expect: {"ok":true}
```

---

## Credentials & where they live

All secrets live in encrypted stores **outside this repo**. Nothing sensitive is committed.

| Credential | Lives in | How to rotate |
|---|---|---|
| Klaviyo private API key | Cloudflare Worker secret `KLAVIYO_API_KEY` | See "Rotating the Klaviyo key" below |
| Airtable Personal Access Token | Cloudflare Worker secret `AIRTABLE_TOKEN` | See "Rotating the Airtable token" below |
| Cloudflare API token (for deploys) | Operator's shell session env var `CLOUDFLARE_API_TOKEN` | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → create custom token with **Account → Workers Scripts → Edit** |
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

### Rotating the Airtable token

1. [airtable.com/create/tokens](https://airtable.com/create/tokens) → revoke the old token
2. **Create token** → name `bgs-apply-worker` → scope `data.records:write` → restrict to the one base
3. Copy the token (Airtable only shows it once)
4. Pipe it into Wrangler:
   ```bash
   cd worker
   printf '%s' 'PASTE_NEW_PAT' | npx wrangler secret put AIRTABLE_TOKEN
   ```
5. Verify with the `/apply` smoke-test curl above. No redeploy needed.

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
Posts to Worker root (`POST /`) → Klaviyo list `WBWVDv`. See pipeline diagram above.

### Internship — Application modal *(currently closed)*
The application modal is **disabled for this cohort**. The `#apply` section on
[`internship/index.html`](internship/index.html) shows a closed-state message that links
to the Insider list (`../#rsvp`). The Apply buttons in the header and hero now scroll to
that closed message instead of opening a modal.

**When applications were live** (still applies once re-enabled): the modal posted to
`POST /apply` → Airtable Master View. Field names matched the Airtable schema; submission
JSON preserved multi-valued checkboxes as arrays so multi-select columns landed correctly.
If you add/remove form fields or rename Airtable columns, update **both** the `<form>`
markup in [`internship/index.html`](internship/index.html) **and** the field-mapping object
in [`worker/src/index.js`](worker/src/index.js) `handleApply()` (the Airtable column names
are string keys in that object and must match exactly).

**To re-open applications next year:**
1. Restore the `<dialog id="apply-modal">` markup, the open/close `<script>`, and the
   `<script src="../assets/js/apply.js">` include (git history has the last live version)
2. Revert the `#apply` section copy from the closed message back to "Send us your shot" +
   the "Open application" CTA
3. Flip the header and hero `<a href="#apply">` back to `<button data-open-apply>`
4. (Optional) Re-add the `.apply-modal*` styles in the inline `<style>` block
5. Smoke-test with the `/apply` curl in the cheat sheet

---

## What's currently hidden

- **Before/After slider section** — preserved in `<template>` in [`index.html`](index.html); needs imagery
- **Pricing section** — preserved in `<template>`; needs pricing decisions
- **"Schedule" nav link** — commented out in the main nav, paired with the hidden Pricing section

To restore any of these, unwrap the template tag and uncomment the nav link.

---

## Punch list / known limitations

- **No rate limiting** on the Worker. Both routes are open to anyone POSTing; bots can mass-submit garbage. Cloudflare WAF rule (rate-limit by IP) or a tiny honeypot field would close this.
- **No application dedupe**. `/apply` creates a new Airtable row every submit; a determined applicant can submit ten times. Consider adding an email-existence check before insert, or relying on Airtable views to flag dupes.
- **Cloudflare token** in operator's shell isn't persistent. If you want it across sessions, store via 1Password CLI or a sourced env file (outside the repo).
- **Tailwind via CDN** is fine for marketing pages but blows up bundle size on every visit. If the site grows or perf matters, swap to a built Tailwind step.

---

## Quick command cheat-sheet

```bash
# Deploy Worker
cd worker && export CLOUDFLARE_API_TOKEN='…' && npx wrangler deploy

# Update Klaviyo key
cd worker && printf '%s' 'KEY' | npx wrangler secret put KLAVIYO_API_KEY

# Update Airtable token
cd worker && printf '%s' 'PAT' | npx wrangler secret put AIRTABLE_TOKEN

# Tail Worker logs
cd worker && npx wrangler tail

# List Worker secrets (names only, no values)
cd worker && npx wrangler secret list

# Smoke-test the Klaviyo path
curl -s -X POST https://bgs-rsvp.meccaclarkepro.workers.dev \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"smoke+'$(date +%s)'@example.com"}'

# Smoke-test the Airtable apply path
curl -s -X POST https://bgs-rsvp.meccaclarkepro.workers.dev/apply \
  -H 'Content-Type: application/json' \
  -d '{"first_name":"Smoke","last_name":"Test","email":"apply+'$(date +%s)'@example.com","phone":"4045551234","city_state":"Atlanta, GA","why_bgs":"smoke","marketing_experience":"Yes","social_platforms":["Instagram"],"tools":["Canva"],"available_shoot_week":"Yes","hours_per_week":"8-10","location_type":"Remote"}'

# Inspect a specific subscriber in Klaviyo (run locally; don't paste KEY)
curl -s -H "Authorization: Klaviyo-API-Key $KEY" \
     -H "revision: 2026-04-15" \
     -H "accept: application/json" \
     'https://a.klaviyo.com/api/profiles/?filter=equals(email,"someone@example.com")'

# List recent Airtable applications (run locally; don't paste PAT)
curl -s -H "Authorization: Bearer $PAT" \
     'https://api.airtable.com/v0/appNZw4xbiqvXIhLS/tblGjNHVdoeWhfZOl?maxRecords=10&sort[0][field]=Date%20Applied&sort[0][direction]=desc'
```
