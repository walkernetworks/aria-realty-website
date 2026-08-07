# Connecting the Live MLS Feed (FMLS / Georgia MLS)

This site ships with its own IDX engine — no monthly IDX-vendor fee required.
It reads listings straight from the MLS's **RESO Web API** (the modern standard
that replaced RETS). What you need from the MLS is a **data license** and API
credentials. Here's the exact path.

## Step 1 — Confirm MLS membership

Peachtree City brokers typically belong to one or both of:

| MLS | Coverage | Data program |
|---|---|---|
| **FMLS (First MLS)** | Metro Atlanta incl. Fayette/Coweta | firstmls.com → API/data services |
| **Georgia MLS (GAMLS)** | Statewide | gamls.com → Membership → Listing Data Distribution |

Tahir's brokerage must be a participant in whichever MLS the feed comes from.
If he belongs to both, start with the one holding most of his market's listings
(FMLS is dominant for metro Atlanta; GAMLS is strong south of the city) — you
can add the second feed later using the same `.env` pattern.

## Step 2 — Request an IDX data license

As the **participating broker**, Tahir requests IDX display access:

- **Georgia MLS:** log in at gamls.com → *Membership → Listing Data Distribution*
  and submit the IDX/data-feed request. GAMLS will send a data license agreement
  for the broker to sign, then issue credentials. (GAMLS also lists approved
  vendors, but a broker may run his own site — that's what this package is.)
- **FMLS:** contact FMLS member services / data licensing and request a
  **RESO Web API IDX feed** for the brokerage's own website. Same flow:
  license agreement → credentials.

There is normally a modest monthly data-access fee billed by the MLS itself
(commonly ~$10–50/mo for broker IDX; confirm current pricing with the MLS).

**What to say:** "We are a participating brokerage and want a RESO Web API IDX
feed to display active listings on our own brokerage website. The site is
built in-house; we are the vendor of record."

## Step 3 — You'll receive

1. **API base URL** — e.g. `https://api.example-mls.com/reso/odata`
2. **Auth** — either an OAuth2 *client id + secret + token URL*, or a
   long-lived *bearer token* (varies by MLS)
3. **IDX display rules** — required disclaimers, attribution wording, and
   refresh interval. Paste their exact disclaimer into the site footers.

## Step 4 — Configure the site

```bash
cd server
cp .env.example .env
# then edit .env:
RESO_API_BASE_URL=https://…      # from the MLS
RESO_TOKEN_URL=https://…         # if OAuth2
RESO_CLIENT_ID=…
RESO_CLIENT_SECRET=…
# or, if they gave you a token instead:
RESO_ACCESS_TOKEN=…
```

Optionally adjust `RESO_FILTER` (which cities/statuses to pull) and
`SYNC_INTERVAL_MINUTES` (default 60 — comfortably within the usual
"refresh at least every 12 hours" rule).

## Step 5 — Restart and verify

```bash
npm start
# watch the log:
# [sync] Pulling listings from RESO Web API…
# [sync] Wrote 312 listings → data/listings.json
```

Open the site — the blue "demo mode" banner disappears, `GET /api/health`
reports `"source": "MLS_FEED"`, and the search page now shows live inventory.

## Step 6 — MLS site review

Most MLSs review the site before (or shortly after) activating the feed.
They check for: brokerage attribution on co-op listings ✓, disclaimer text ✓,
no co-mingling with non-MLS data ✓, refresh cadence ✓ — all already built in.
Send them the URL once deployed and apply any wording tweaks they request.

## Troubleshooting

- **401/403 from the API** — token expired or IP not allow-listed; some MLSs
  require registering your server's IP.
- **Field differences** — both FMLS and GAMLS follow the RESO Data Dictionary,
  which this site consumes natively. If a field arrives under a different name,
  adjust the mapping in `server/sync/sync.js → normalize()`.
- **Photos** — pulled from the `Media` resource per listing. If the MLS gives
  time-limited photo URLs, lower `SYNC_INTERVAL_MINUTES` so they stay fresh.

## Alternative: managed IDX (fallback)

If Tahir prefers zero maintenance, the site can instead embed a managed IDX
vendor approved by GAMLS/FMLS (IDX Broker, iHomefinder, Showcase IDX, Buying
Buddy). The design carries over — the `listings` pages would embed the vendor
widget instead of calling `/api/listings`. The self-hosted route above keeps
full design control and avoids the vendor's monthly fee.
