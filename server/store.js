// Listing store: in-memory index over a JSON file.
// Uses data/listings.json (written by the RESO sync) when present,
// otherwise falls back to the bundled sample data.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LIVE_FILE = path.join(DATA_DIR, 'listings.json');
const SAMPLE_FILE = path.join(DATA_DIR, 'sample-listings.json');

let cache = { listings: [], source: 'none', loadedAt: null };

function load() {
  const file = fs.existsSync(LIVE_FILE) ? LIVE_FILE : SAMPLE_FILE;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  cache = {
    listings: raw.listings || [],
    source: file === LIVE_FILE ? 'MLS_FEED' : 'SAMPLE_DATA',
    loadedAt: new Date().toISOString(),
  };
  return cache;
}

function reload() { return load(); }

function all() {
  if (!cache.loadedAt) load();
  return cache.listings;
}

function meta() {
  if (!cache.loadedAt) load();
  return { source: cache.source, loadedAt: cache.loadedAt, count: cache.listings.length };
}

function byKey(key) {
  return all().find((l) => l.ListingKey === key) || null;
}

function search(q = {}) {
  const office = process.env.BROKERAGE_OFFICE_NAME || 'Aria Realty Inc.';
  let rows = all().slice();

  if (q.status) {
    const statuses = String(q.status).split(',').map((s) => s.trim().toLowerCase());
    rows = rows.filter((l) => statuses.includes((l.StandardStatus || '').toLowerCase()));
  } else {
    rows = rows.filter((l) => (l.StandardStatus || '') !== 'Closed');
  }
  if (q.city) {
    const cities = String(q.city).split(',').map((s) => s.trim().toLowerCase());
    rows = rows.filter((l) => cities.includes((l.City || '').toLowerCase()));
  }
  if (q.type) {
    const types = String(q.type).split(',').map((s) => s.trim().toLowerCase());
    rows = rows.filter((l) =>
      types.includes((l.PropertyType || '').toLowerCase()) ||
      types.includes((l.PropertySubType || '').toLowerCase()));
  }
  if (q.minPrice) rows = rows.filter((l) => l.ListPrice >= Number(q.minPrice));
  if (q.maxPrice) rows = rows.filter((l) => l.ListPrice <= Number(q.maxPrice));
  if (q.beds) rows = rows.filter((l) => (l.BedroomsTotal || 0) >= Number(q.beds));
  if (q.baths) rows = rows.filter((l) => (l.BathroomsFull || 0) >= Number(q.baths));
  if (q.ours === 'true' || q.ours === '1') rows = rows.filter((l) => l.ListOfficeName === office);
  if (q.featured === 'true' || q.featured === '1') rows = rows.filter((l) => l.Featured);
  if (q.keyword) {
    const kw = String(q.keyword).toLowerCase();
    rows = rows.filter((l) =>
      [l.UnparsedAddress, l.City, l.PostalCode, l.SubdivisionName, l.PublicRemarks]
        .join(' ').toLowerCase().includes(kw));
  }

  const sorters = {
    'price-asc': (a, b) => a.ListPrice - b.ListPrice,
    'price-desc': (a, b) => b.ListPrice - a.ListPrice,
    'newest': (a, b) => (a.DaysOnMarket ?? 999) - (b.DaysOnMarket ?? 999),
    'sqft-desc': (a, b) => (b.LivingArea || 0) - (a.LivingArea || 0),
  };
  rows.sort(sorters[q.sort] || sorters['newest']);

  const page = Math.max(1, Number(q.page) || 1);
  const perPage = Math.min(48, Number(q.perPage) || 12);
  const total = rows.length;
  rows = rows.slice((page - 1) * perPage, page * perPage);

  return { total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)), listings: rows };
}

module.exports = { load, reload, all, byKey, search, meta };
