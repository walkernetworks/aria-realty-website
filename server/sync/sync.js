// RESO Web API → local listing store sync job.
// Run once:        npm run sync
// Or continuously: started automatically by server.js when credentials exist.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { fetchAllListings, fetchMedia } = require('./resoClient');

const OUT_FILE = path.join(__dirname, '..', '..', 'data', 'listings.json');

function configured() {
  return Boolean(
    process.env.RESO_API_BASE_URL &&
    (process.env.RESO_ACCESS_TOKEN || (process.env.RESO_TOKEN_URL && process.env.RESO_CLIENT_ID))
  );
}

// Map a raw RESO Property record to the shape the site consumes.
// Field names already follow the RESO Data Dictionary, so this is mostly a
// pass-through with a few conveniences.
function normalize(rec, mediaUrls) {
  const office = process.env.BROKERAGE_OFFICE_NAME || 'Aria Realty Inc.';
  return {
    ListingKey: rec.ListingKey || rec.ListingId,
    StandardStatus: rec.StandardStatus,
    ListPrice: rec.ListPrice,
    UnparsedAddress: rec.UnparsedAddress ||
      [rec.StreetNumber, rec.StreetName, rec.StreetSuffix].filter(Boolean).join(' '),
    City: rec.City,
    StateOrProvince: rec.StateOrProvince,
    PostalCode: rec.PostalCode,
    SubdivisionName: rec.SubdivisionName,
    PropertyType: rec.PropertyType,
    PropertySubType: rec.PropertySubType,
    BedroomsTotal: rec.BedroomsTotal,
    BathroomsFull: rec.BathroomsFull ?? rec.BathroomsTotalInteger,
    BathroomsHalf: rec.BathroomsHalf ?? 0,
    LivingArea: rec.LivingArea,
    LotSizeAcres: rec.LotSizeAcres,
    YearBuilt: rec.YearBuilt,
    GarageSpaces: rec.GarageSpaces,
    DaysOnMarket: rec.DaysOnMarket,
    Latitude: rec.Latitude,
    Longitude: rec.Longitude,
    PublicRemarks: rec.PublicRemarks,
    ListOfficeName: rec.ListOfficeName,
    ListAgentFullName: rec.ListAgentFullName,
    Media: mediaUrls,
    Featured: rec.ListOfficeName === office, // our own listings are featured by default
  };
}

async function runSync() {
  if (!configured()) {
    console.log('[sync] RESO credentials not configured — site continues on sample data.');
    console.log('[sync] Fill in server/.env (see .env.example) once your MLS data license is approved.');
    return false;
  }
  console.log('[sync] Pulling listings from RESO Web API…');
  const raw = await fetchAllListings();

  console.log('[sync] Fetching media (photos)…');
  const listings = [];
  for (const rec of raw) {
    let media = [];
    try {
      media = await fetchMedia(rec.ListingKey || rec.ListingId);
    } catch (e) {
      console.warn(`  media fetch failed for ${rec.ListingKey}: ${e.message}`);
    }
    listings.push(normalize(rec, media));
  }

  const payload = {
    meta: { source: 'MLS_FEED', syncedAt: new Date().toISOString(), count: listings.length },
    listings,
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`[sync] Wrote ${listings.length} listings → data/listings.json`);
  return true;
}

function startScheduler(onComplete) {
  const minutes = Number(process.env.SYNC_INTERVAL_MINUTES) || 60;
  const tick = async () => {
    try {
      const ok = await runSync();
      if (ok && onComplete) onComplete();
    } catch (e) {
      console.error('[sync] failed:', e.message);
    }
  };
  tick();
  if (configured()) {
    setInterval(tick, minutes * 60 * 1000);
    console.log(`[sync] Scheduler active — refreshing every ${minutes} min.`);
  }
}

if (require.main === module) {
  runSync().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { runSync, startScheduler, configured };
