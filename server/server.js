// Aria Realty Inc. — website + self-hosted IDX API
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const fs = require('fs');
const path = require('path');
const store = require('./store');
const sync = require('./sync/sync');
const mailer = require('./mailer');

const app = express();
app.use(express.json());

// ── API ───────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, data: store.meta(), mlsConfigured: sync.configured() });
});

// Search listings: /api/listings?city=&minPrice=&maxPrice=&beds=&baths=&type=&status=&keyword=&ours=&featured=&sort=&page=&perPage=
app.get('/api/listings', (req, res) => {
  res.json({ ...store.search(req.query), meta: store.meta() });
});

app.get('/api/listings/:key', (req, res) => {
  const listing = store.byKey(req.params.key);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json({ listing, meta: store.meta() });
});

// Distinct cities for the search dropdown
app.get('/api/cities', (req, res) => {
  const cities = [...new Set(store.all().map((l) => l.City).filter(Boolean))].sort();
  res.json({ cities });
});

// Lead capture (contact / showing requests) → data/leads.jsonl + email notification
app.post('/api/leads', async (req, res) => {
  const { name, email, phone, message, listingKey } = req.body || {};
  if (!name || (!email && !phone)) {
    return res.status(400).json({ error: 'Name and an email or phone number are required.' });
  }
  const lead = {
    receivedAt: new Date().toISOString(),
    name: String(name).slice(0, 200),
    email: String(email || '').slice(0, 200),
    phone: String(phone || '').slice(0, 50),
    message: String(message || '').slice(0, 2000),
    listingKey: String(listingKey || '').slice(0, 50),
  };

  // Write to disk FIRST. Render's free tier wipes this file on redeploy, so it is
  // a short-lived backstop rather than storage — but it means a lead is never lost
  // to an email outage, and it costs nothing.
  const file = path.resolve(__dirname, process.env.LEADS_FILE || '../data/leads.jsonl');
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify(lead) + '\n');
  } catch (err) {
    console.error('[leads] could not write to', file, '—', err.message);
  }

  // Then email. A delivery failure must not fail the request: the visitor has
  // done nothing wrong and the lead is already on disk. Log loudly instead.
  if (mailer.configured()) {
    try {
      await mailer.sendLead(lead);
    } catch (err) {
      console.error('[leads] EMAIL FAILED for', lead.name, '—', err.message);
      console.error('[leads] the lead is saved in', file, '— retrieve it from there');
    }
  } else {
    console.warn('[leads] email not configured — lead saved to', file, 'only.');
    console.warn('[leads] set RESEND_API_KEY and LEAD_EMAIL_TO (see .env.example) to get notified.');
  }

  res.json({ ok: true });
});

// ── Static site ────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/data', express.static(path.join(__dirname, '..', 'data'))); // sample-data fallback for static hosting

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Aria Realty site running → http://localhost:${PORT}`);
  // Kick off MLS sync (no-op until RESO credentials are configured)
  sync.startScheduler(() => store.reload());
});
