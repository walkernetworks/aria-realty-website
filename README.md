# Aria Realty Inc. — Website + Self-Hosted IDX

A complete brokerage website for **Aria Realty Inc.** (Peachtree City, GA — Tahir Parvaiz, Broker/Owner) with a built-in IDX engine that syncs listings directly from the MLS's **RESO Web API** (FMLS and/or Georgia MLS).

## What's inside

```
aria-realty-website/
├── public/               ← the website (5 pages, dark luxury theme, fully responsive)
│   ├── index.html          Home: hero search, featured listings, village guide, CTAs
│   ├── listings.html       MLS search: filters, sort, pagination, "Aria exclusives" toggle
│   ├── listing.html        Listing detail: gallery, specs, remarks, showing-request form
│   ├── about.html          Company story + Tahir Parvaiz bio
│   ├── contact.html        Contact / valuation-request form (lead capture)
│   ├── css/ js/ assets/    Styles, page controllers, logo files, placeholder photos
├── server/               ← Node.js app: serves the site + IDX API + MLS sync
│   ├── server.js           Express server (site + REST API + lead capture)
│   ├── store.js            Listing store with search/filter/sort/pagination
│   ├── sync/resoClient.js  RESO Web API (OData) client — zero extra dependencies
│   ├── sync/sync.js        Scheduled sync job: MLS → data/listings.json
│   └── .env.example        All configuration (copy to .env)
├── data/
│   ├── sample-listings.json  Realistic sample data (used until the MLS feed is live)
│   └── leads.jsonl           Lead submissions land here (created on first lead)
├── docs/MLS-IDX-SETUP-GUIDE.md  ← how to get the real MLS feed connected
└── scripts/gen-photos.js        Regenerates placeholder photos
```

## Run it locally

Requires Node.js 18+.

```bash
cd server
npm install
npm start
# → http://localhost:3000
```

The site runs immediately on the bundled sample data (16 realistic Peachtree City–area listings). A blue banner marks demo mode; it disappears automatically once real MLS data is synced.

## Connect the real MLS feed

Follow **docs/MLS-IDX-SETUP-GUIDE.md**. Short version:

1. Tahir (as broker) requests an **IDX data license** from FMLS and/or Georgia MLS.
2. The MLS issues RESO Web API credentials (API URL + OAuth client or token).
3. Put them in `server/.env` (copy from `.env.example`).
4. Restart the server. The sync pulls listings + photos into `data/listings.json`
   on startup and refreshes every `SYNC_INTERVAL_MINUTES` (default 60).

No code changes needed — the sample data is replaced automatically and every
search/filter on the site starts running against live MLS listings.

## Deploying

Any Node.js host works (Render, Railway, Fly.io, DigitalOcean App Platform, a $6 VPS, or cPanel with Node support):

- Deploy the whole folder; run `npm install && npm start` inside `server/`.
- Set the environment variables from `.env.example` in the host's dashboard.
- Point the domain (e.g. `ariarealtyinc.com`) at the app; enable HTTPS (hosts do this automatically).

Static-only hosting (Netlify/Vercel static) also works for previewing `public/` — the site falls back to client-side search over the sample JSON — but the **live MLS sync and lead capture require the Node server**.

## Before launch — fill in the placeholders

- [x] Office **phone and email** — (770) 843-8699 / info@ariarealtyinc.com (contact.html, footers)
- [x] Real photo of Tahir for the About page
- [x] Georgia broker license #255711 in the footers
- [ ] **Florida license number** — issued, number not yet supplied. Each legal
      footer has an `<!-- FL license # ... -->` comment marking where it goes.
      Also in `scripts/build-preview.js`.
- [ ] Georgia **firm** license number, if the brokerage wants it displayed too
- [ ] Google Business profile / social links in the footer

The office is a home office. By decision, the site shows **"Peachtree City, GA 30269"**
only — no street address — to keep a residential address off a public, scraped page.
Leads arrive by phone or the contact form, so nothing is lost. If a Google Business
Profile is set up later, it can be registered as a service-area business with the
address hidden.
- [ ] MLS-required IDX disclosure text — each MLS supplies exact wording at approval

## Leads

Form submissions (contact, valuation, showing requests) are appended to `data/leads.jsonl`. To get them by email instead, forward that file's entries with any cron/email service, or ask your developer to add an SMTP call in `server/server.js` (`/api/leads` route — it's ~20 lines).

## Compliance notes

- IDX display rules (FMLS/GAMLS) require: attribution of the listing brokerage
  (shown on cards + detail pages), a data-reliability disclaimer (in the footer),
  and data refreshed at least every 12 hours (default sync is hourly).
- Equal Housing Opportunity notice is in the footer.
- Each MLS reviews the site before approving the feed; the structure here
  matches what they look for.
