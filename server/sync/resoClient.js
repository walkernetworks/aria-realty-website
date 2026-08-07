// Minimal RESO Web API (OData) client — no external dependencies.
// Works with FMLS, Georgia MLS, and any RESO-certified Web API feed.
//
// Auth: supports OAuth2 client-credentials (RESO_TOKEN_URL + RESO_CLIENT_ID/SECRET)
// or a pre-issued long-lived bearer token (RESO_ACCESS_TOKEN).

let tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  if (process.env.RESO_ACCESS_TOKEN) return process.env.RESO_ACCESS_TOKEN;
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;

  const res = await fetch(process.env.RESO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.RESO_CLIENT_ID,
      client_secret: process.env.RESO_CLIENT_SECRET,
      scope: 'api',
    }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return tokenCache.token;
}

async function odata(pathAndQuery) {
  const base = process.env.RESO_API_BASE_URL.replace(/\/$/, '');
  const token = await getToken();
  const res = await fetch(`${base}/${pathAndQuery}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`RESO API ${res.status}: ${await res.text()}`);
  return res.json();
}

// Pull every page of the Property resource matching RESO_FILTER.
async function fetchAllListings() {
  const resource = process.env.RESO_RESOURCE || 'Property';
  const pageSize = Number(process.env.RESO_PAGE_SIZE) || 200;
  const filter = encodeURIComponent(process.env.RESO_FILTER || "StandardStatus eq 'Active'");

  let url = `${resource}?$filter=${filter}&$top=${pageSize}&$count=true`;
  const rows = [];
  while (url) {
    const page = await odata(url);
    rows.push(...(page.value || []));
    // Follow OData server-driven paging
    const next = page['@odata.nextLink'];
    url = next ? next.replace(new RegExp(`^.*?/${resource}`), `${resource}`) : null;
    console.log(`  fetched ${rows.length}${page['@odata.count'] ? ' / ' + page['@odata.count'] : ''} listings…`);
  }
  return rows;
}

// Fetch photo URLs for one listing from the Media resource.
async function fetchMedia(listingKey) {
  const filter = encodeURIComponent(
    `ResourceName eq 'Property' and ResourceRecordKey eq '${listingKey}'`
  );
  const page = await odata(`Media?$filter=${filter}&$orderby=Order&$top=50`);
  return (page.value || []).map((m) => m.MediaURL).filter(Boolean);
}

module.exports = { fetchAllListings, fetchMedia };
