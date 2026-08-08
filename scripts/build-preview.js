// Builds a single-file interactive preview (preview.html) of the whole site:
// all 5 pages via hash routing, with CSS, data, and images inlined.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pub = (...p) => path.join(ROOT, 'public', ...p);

const css = fs.readFileSync(pub('css', 'styles.css'), 'utf8')
  .replace(/url\("\.\.\/assets\/skyline\.svg"\)/, `url("SKYLINE_URI")`);

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sample-listings.json'), 'utf8'));

// Inline all photo SVGs + logo as data URIs
const assets = {};
const photoDir = pub('assets', 'photos');
for (const f of fs.readdirSync(photoDir)) {
  const svg = fs.readFileSync(path.join(photoDir, f), 'utf8');
  assets['assets/photos/' + f] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const logoUri = 'data:image/png;base64,' + fs.readFileSync(pub('assets', 'logo-white.png')).toString('base64');

// Team portraits: prefer real .jpg photos, fall back to placeholder .svg
function teamUri(name) {
  const jpg = pub('assets', 'team', name + '.jpg');
  if (fs.existsSync(jpg)) return 'data:image/jpeg;base64,' + fs.readFileSync(jpg).toString('base64');
  const svg = fs.readFileSync(pub('assets', 'team', name + '.svg'), 'utf8');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const TEAM = { tahir: teamUri('tahir'), tana: teamUri('tana') };
const skylineUri = 'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(fs.readFileSync(pub('assets', 'skyline.svg'), 'utf8'));

// Rewrite listing media paths to data URIs
for (const l of data.listings) l.Media = (l.Media || []).map((m) => assets[m] || m);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aria Realty Inc. — Live Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>${css.replace('SKYLINE_URI', skylineUri)}
.preview-pill{position:fixed;bottom:16px;right:16px;z-index:99;background:rgba(18,35,60,.95);border:1px solid var(--gold);color:var(--gold-2);font-size:.72rem;letter-spacing:1.5px;text-transform:uppercase;padding:8px 16px;border-radius:999px;}
</style>
</head>
<body>
<header class="site-header">
  <div class="container nav-wrap">
    <a class="brand" href="#/home">
      <img src="${logoUri}" alt="Aria Realty Inc. logo">
      <span class="brand-text"><b>ARIA REALTY</b><span>Peachtree City · Georgia</span></span>
    </a>
    <ul class="nav-links">
      <li><a href="#/home" data-nav="home">Home</a></li>
      <li><a href="#/listings" data-nav="listings">Search Homes</a></li>
      <li><a href="#/listings?ours=true" data-nav="ours">Our Listings</a></li>
      <li><a href="#/about" data-nav="about">About</a></li>
      <li><a href="#/contact" data-nav="contact">Contact</a></li>
    </ul>
    <a class="btn nav-cta" href="#/contact">Work With Us</a>
    <button class="nav-toggle" aria-label="Menu">☰</button>
  </div>
</header>

<main id="app"></main>
<div class="preview-pill">Interactive Preview · Sample Data</div>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-logo">
        <img src="${logoUri}" alt="Aria Realty Inc.">
        <p>Aria Realty Inc. — a boutique residential brokerage serving Peachtree City and the south metro Atlanta area.</p>
      </div>
      <div><h4>Explore</h4><ul>
        <li><a href="#/listings">Search Homes</a></li>
        <li><a href="#/listings?ours=true">Our Listings</a></li>
        <li><a href="#/about">About Us</a></li>
        <li><a href="#/contact">Contact</a></li></ul></div>
      <div><h4>Areas</h4><ul>
        <li><a href="#/listings?city=Peachtree City">Peachtree City</a></li>
        <li><a href="#/listings?city=Fayetteville">Fayetteville</a></li>
        <li><a href="#/listings?city=Tyrone">Tyrone</a></li>
        <li><a href="#/listings?city=Senoia">Senoia</a></li>
        <li><a href="#/listings?city=Newnan">Newnan</a></li></ul></div>
      <div><h4>Office</h4><p>Aria Realty Inc.<br>Peachtree City, GA 30269<br><br>Tahir Parvaiz, Broker<br><a href="#/contact">Send us a message →</a></p></div>
    </div>
    <div class="legal">
      <p>Aria Realty Inc. is a licensed Georgia real estate brokerage. Tahir Parvaiz, Broker. Listing data is provided under IDX rules of the participating MLS (FMLS / Georgia MLS); information is deemed reliable but not guaranteed and should be independently verified. Listings identified with partner brokerages are courtesy of cooperating brokers via IDX.</p>
      <p class="eho">⌂ Equal Housing Opportunity · © ${new Date().getFullYear()} Aria Realty Inc. All rights reserved.</p>
    </div>
  </div>
</footer>

<script>
const DATA = ${JSON.stringify(data.listings)};
const OFFICE = "Aria Realty Inc.";
const money = n => n >= 10000 ? "$" + n.toLocaleString("en-US") : "$" + n.toLocaleString("en-US") + "/mo";
const num = n => Number(n || 0).toLocaleString("en-US");

function filterLocal(q) {
  let out = DATA.slice();
  if (q.status) { const st = q.status.toLowerCase().split(","); out = out.filter(l => st.includes((l.StandardStatus||"").toLowerCase())); }
  else out = out.filter(l => l.StandardStatus !== "Closed");
  if (q.city) out = out.filter(l => (l.City||"").toLowerCase() === q.city.toLowerCase());
  if (q.type) { const t = q.type.toLowerCase(); out = out.filter(l => (l.PropertyType||"").toLowerCase() === t || (l.PropertySubType||"").toLowerCase() === t); }
  if (q.minPrice) out = out.filter(l => l.ListPrice >= +q.minPrice);
  if (q.maxPrice) out = out.filter(l => l.ListPrice <= +q.maxPrice);
  if (q.beds) out = out.filter(l => (l.BedroomsTotal||0) >= +q.beds);
  if (q.ours === "true") out = out.filter(l => l.ListOfficeName === OFFICE);
  if (q.featured === "true") out = out.filter(l => l.Featured);
  if (q.keyword) { const kw = q.keyword.toLowerCase(); out = out.filter(l => [l.UnparsedAddress,l.City,l.PostalCode,l.SubdivisionName,l.PublicRemarks].join(" ").toLowerCase().includes(kw)); }
  const sorters = {
    "price-asc": (a,b)=>a.ListPrice-b.ListPrice, "price-desc": (a,b)=>b.ListPrice-a.ListPrice,
    "newest": (a,b)=>(a.DaysOnMarket??999)-(b.DaysOnMarket??999), "sqft-desc": (a,b)=>(b.LivingArea||0)-(a.LivingArea||0) };
  out.sort(sorters[q.sort] || sorters["newest"]);
  return out;
}

function card(l) {
  const ours = l.ListOfficeName === OFFICE;
  const badge = l.StandardStatus === "Coming Soon" ? '<span class="badge">Coming Soon</span>'
    : l.StandardStatus === "Pending" ? '<span class="badge">Pending</span>'
    : ours ? '<span class="badge ours">Aria Exclusive</span>' : "";
  const facts = l.PropertyType === "Land"
    ? '<span><b>'+l.LotSizeAcres+'</b> acres</span><span><b>'+l.City+'</b></span>'
    : '<span><b>'+l.BedroomsTotal+'</b> bd</span><span><b>'+l.BathroomsFull+(l.BathroomsHalf?"½":"")+'</b> ba</span><span><b>'+num(l.LivingArea)+'</b> sq ft</span>';
  return '<a class="card" href="#/listing/'+encodeURIComponent(l.ListingKey)+'">'
    + '<div class="thumb">'+badge+'<img src="'+(l.Media[0]||"")+'" alt=""></div>'
    + '<div class="body"><div class="price">'+money(l.ListPrice)+'</div>'
    + '<div class="addr">'+l.UnparsedAddress+'<small>'+l.City+', '+l.StateOrProvince+' '+l.PostalCode+' · '+(l.SubdivisionName||"")+'</small></div>'
    + '<div class="facts">'+facts+'</div></div></a>';
}

const app = document.getElementById("app");

function pageHome() {
  const featured = filterLocal({ featured: "true" }).slice(0, 3);
  app.innerHTML = \`
  <section class="hero"><div class="container hero-inner">
    <span class="eyebrow">Boutique Brokerage · Est. Peachtree City</span>
    <h1>Find your place in <em>Peachtree City</em> — where every home is a lifestyle.</h1>
    <p class="lead">From golf-cart villages to lakefront estates, Aria Realty pairs deep local knowledge with white-glove service across Fayette and Coweta County.</p>
    <form class="search-bar" id="heroSearch">
      <select name="city"><option value="">All Cities</option><option>Peachtree City</option><option>Fayetteville</option><option>Tyrone</option><option>Senoia</option><option>Newnan</option></select>
      <select name="minPrice"><option value="">Min Price</option><option value="300000">$300k</option><option value="500000">$500k</option><option value="750000">$750k</option><option value="1000000">$1M</option></select>
      <select name="maxPrice"><option value="">Max Price</option><option value="500000">$500k</option><option value="750000">$750k</option><option value="1000000">$1M</option><option value="2000000">$2M+</option></select>
      <select name="beds"><option value="">Beds</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5+</option></select>
      <button class="btn solid" type="submit">Search</button>
    </form>
    <div class="hero-stats">
      <div class="stat"><b>100+</b><span>Miles of cart paths</span></div>
      <div class="stat"><b>#1</b><span>Rated GA schools nearby</span></div>
      <div class="stat"><b>Local</b><span>Broker-owned & operated</span></div>
    </div>
  </div></section>
  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Aria Exclusives</span><h2>Featured Listings</h2>
    <p>Homes represented by Aria Realty Inc. — marketed with professional media, precise pricing, and quiet urgency.</p></div>
    <div class="data-source-note">Demo mode — sample listings shown. Live MLS listings appear automatically once the FMLS / Georgia MLS IDX feed is connected.</div>
    <div class="grid cols-3">\${featured.map(card).join("")}</div>
    <div style="text-align:center;margin-top:40px;"><a class="btn" href="#/listings">Browse All Homes On The Market</a></div>
  </div></section>
  <section class="section" style="background:var(--bg-2);"><div class="container">
    <div class="section-head"><span class="eyebrow">Neighborhood Guide</span><h2>The Villages of Peachtree City</h2>
    <p>Each village has its own schools, parks, and personality — all linked by the city's famous golf-cart path network.</p></div>
    <div class="grid cols-4">
      <a class="tile" href="#/listings?keyword=Kedron"><div class="bg"></div><div class="label"><b>Kedron</b><span>Executive homes · Kedron Village shops</span></div></a>
      <a class="tile" href="#/listings?keyword=Glenloch"><div class="bg"></div><div class="label"><b>Glenloch</b><span>Established charm · Lake Peachtree</span></div></a>
      <a class="tile" href="#/listings?keyword=Braelinn"><div class="bg"></div><div class="label"><b>Braelinn</b><span>Golf & green space · top schools</span></div></a>
      <a class="tile" href="#/listings?keyword=Wilksmoor"><div class="bg"></div><div class="label"><b>Wilksmoor</b><span>New construction · Line Creek</span></div></a>
    </div>
  </div></section>
  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">Why Aria</span><h2>A different standard of representation</h2></div>
    <div class="grid cols-3">
      <div class="feature"><div class="ico">01</div><h3>Broker-Level Service</h3><p>You work directly with the broker on every transaction — not a hand-off. Tahir Parvaiz personally oversees pricing, negotiation, and closing.</p></div>
      <div class="feature"><div class="ico">02</div><h3>Full MLS Reach</h3><p>Search every home on the market through our MLS feed, updated continuously — the same data agents see, without leaving our site.</p></div>
      <div class="feature"><div class="ico">03</div><h3>Local by Design</h3><p>Based in Peachtree City and focused on Fayette & Coweta County. School zones, cart paths, HOA nuances — we know the details that move value.</p></div>
    </div>
  </div></section>
  <section class="section" style="padding-top:0;"><div class="container">
    <div class="cta-band"><div><h2>Thinking of selling? Know what your home is worth.</h2>
    <p>Request a complimentary, no-obligation market analysis prepared personally by our broker.</p></div>
    <a class="btn solid" href="#/contact">Request Home Valuation</a></div>
  </div></section>\`;
  document.getElementById("heroSearch").addEventListener("submit", e => {
    e.preventDefault();
    const qs = new URLSearchParams(new FormData(e.target));
    [...qs.keys()].forEach(k => { if (!qs.get(k)) qs.delete(k); });
    location.hash = "#/listings?" + qs.toString();
  });
}

function pageListings(params) {
  const state = Object.fromEntries(params.entries());
  const rows = filterLocal(state);
  const page = Math.max(1, +state.page || 1), per = 12;
  const totalPages = Math.max(1, Math.ceil(rows.length / per));
  const slice = rows.slice((page-1)*per, page*per);
  const opt = (v, t, cur) => '<option value="'+v+'"'+(cur===v?" selected":"")+'>'+t+'</option>';
  app.innerHTML = \`
  <section class="page-hero"><div class="container">
    <span class="eyebrow">MLS Search</span>
    <h1>\${state.ours==="true" ? "Aria Realty Exclusive Listings" : "Homes On The Market"}</h1>
    <form class="filters" id="filters">
      <select name="city">\${opt("","All Cities",state.city)+["Peachtree City","Fayetteville","Tyrone","Senoia","Newnan"].map(c=>opt(c,c,state.city)).join("")}</select>
      <select name="type">\${opt("","All Types",state.type)+opt("Single Family Residence","Single Family",state.type)+opt("Townhouse","Townhouse",state.type)+opt("Condominium","Condo",state.type)+opt("Land","Land / Lots",state.type)+opt("Residential Lease","For Lease",state.type)}</select>
      <select name="minPrice">\${opt("","Min Price",state.minPrice)+["200000|$200k","300000|$300k","400000|$400k","500000|$500k","750000|$750k","1000000|$1M"].map(s=>{const[v,t]=s.split("|");return opt(v,t,state.minPrice)}).join("")}</select>
      <select name="maxPrice">\${opt("","Max Price",state.maxPrice)+["400000|$400k","500000|$500k","750000|$750k","1000000|$1M","1500000|$1.5M","3000000|$3M"].map(s=>{const[v,t]=s.split("|");return opt(v,t,state.maxPrice)}).join("")}</select>
      <select name="beds">\${opt("","Beds",state.beds)+["2","3","4","5"].map(b=>opt(b,b+"+",state.beds)).join("")}</select>
      <input type="text" name="keyword" placeholder="Neighborhood, ZIP, keyword…" value="\${state.keyword||""}">
      <button class="btn solid" type="submit">Apply</button>
    </form>
  </div></section>
  <section class="section" style="padding-top:34px;"><div class="container">
    <div class="data-source-note">Demo mode — sample listings shown. Live MLS listings appear automatically once the IDX feed is connected.</div>
    <div class="results-bar">
      <div class="count"><b>\${rows.length}</b> \${rows.length===1?"home":"homes"} found</div>
      <label class="toggle"><input type="checkbox" id="oursOnly" \${state.ours==="true"?"checked":""}> Aria Realty exclusives only</label>
      <select id="sort" style="max-width:200px;background:var(--panel);color:var(--text);border:1px solid rgba(147,163,184,.25);border-radius:9px;padding:10px 12px;">
        \${opt("newest","Newest",state.sort)+opt("price-asc","Price · Low to High",state.sort)+opt("price-desc","Price · High to Low",state.sort)+opt("sqft-desc","Largest",state.sort)}
      </select>
    </div>
    <div class="grid cols-3">\${slice.map(card).join("") || '<div class="empty" style="grid-column:1/-1;"><h3 class="serif" style="font-size:1.5rem;">No homes match those filters</h3><p>Try widening your price range or removing a filter.</p></div>'}</div>
    <div class="pagination">\${totalPages>1?Array.from({length:totalPages},(_,i)=>'<button class="'+(i+1===page?"active":"")+'" data-page="'+(i+1)+'">'+(i+1)+"</button>").join(""):""}</div>
  </div></section>\`;
  const nav = st => { const qs = new URLSearchParams(Object.entries(st).filter(([,v])=>v)); location.hash = "#/listings?" + qs.toString(); };
  document.getElementById("filters").addEventListener("submit", e => {
    e.preventDefault();
    const st = { ...state, page: "" };
    for (const el of e.target.elements) if (el.name) st[el.name] = el.value;
    nav(st);
  });
  document.getElementById("sort").addEventListener("change", e => nav({ ...state, sort: e.target.value, page: "" }));
  document.getElementById("oursOnly").addEventListener("change", e => nav({ ...state, ours: e.target.checked ? "true" : "", page: "" }));
  document.querySelectorAll(".pagination button").forEach(b =>
    b.addEventListener("click", () => { nav({ ...state, page: b.dataset.page }); window.scrollTo(0,0); }));
}

function pageDetail(key) {
  const l = DATA.find(x => x.ListingKey === key);
  if (!l) { app.innerHTML = '<section class="section"><div class="container empty"><h2 class="serif">Listing not found</h2><a class="btn" style="margin-top:20px;" href="#/listings">Back to Search</a></div></section>'; return; }
  const ours = l.ListOfficeName === OFFICE;
  const photos = l.Media.length ? l.Media : [];
  const side = photos.slice(1,3).map(p => '<div class="shot"><img src="'+p+'" alt=""></div>').join("");
  const isLand = l.PropertyType === "Land";
  const specs = [
    !isLand && ["Bedrooms", l.BedroomsTotal],
    !isLand && ["Bathrooms", l.BathroomsFull + " full" + (l.BathroomsHalf ? " · " + l.BathroomsHalf + " half" : "")],
    !isLand && ["Living Area", num(l.LivingArea) + " sq ft"],
    ["Lot Size", l.LotSizeAcres + " acres"],
    !isLand && ["Year Built", l.YearBuilt],
    !isLand && ["Garage", (l.GarageSpaces||0) + " car"],
    ["Type", l.PropertySubType || l.PropertyType],
    ["Status", l.StandardStatus],
    ["Days on Market", l.DaysOnMarket],
  ].filter(Boolean).map(([k,v]) => '<div class="spec"><span>'+k+'</span><b>'+v+'</b></div>').join("");
  app.innerHTML = \`
  <section class="section" style="padding-top:40px;"><div class="container">
    <a href="#/listings" style="color:var(--muted);font-size:.9rem;">← Back to search</a>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-top:18px;">
      <div><span class="eyebrow">\${ours ? "Aria Exclusive" : "Courtesy of " + l.ListOfficeName + " (IDX)"}</span>
      <h1 style="font-size:clamp(1.8rem,3.6vw,2.7rem);">\${l.UnparsedAddress}</h1>
      <p style="color:var(--muted);">\${l.SubdivisionName && l.SubdivisionName!=="None" ? l.SubdivisionName + " · " : ""}\${l.City}, \${l.StateOrProvince} \${l.PostalCode}</p></div>
      <div class="price" style="font-size:2.2rem;">\${money(l.ListPrice)}</div>
    </div>
    <div class="gallery"><div class="main"><img src="\${photos[0]||""}" alt=""></div>\${side?'<div class="side">'+side+"</div>":""}</div>
    <div class="detail-grid">
      <div><div class="spec-grid">\${specs}</div>
        <h2 style="font-size:1.6rem;margin:26px 0 10px;">About this \${isLand?"property":"home"}</h2>
        <p style="color:var(--muted);">\${l.PublicRemarks||""}</p>
        <p style="color:#5d6b80;font-size:.8rem;margin-top:26px;">MLS #\${l.ListingKey} · Listed by \${l.ListAgentFullName}, \${l.ListOfficeName}</p></div>
      <aside class="sidebar-card">
        <h3 class="serif" style="font-size:1.4rem;">Schedule a private tour</h3>
        <p class="agent">Tahir Parvaiz · Broker, Aria Realty Inc.</p>
        <form id="tourForm">
          <div class="field"><label>Name</label><input name="name" required></div>
          <div class="field"><label>Email</label><input name="email" type="email"></div>
          <div class="field"><label>Phone</label><input name="phone" type="tel"></div>
          <div class="field"><label>Message</label><textarea name="message">I'd like to tour \${l.UnparsedAddress}, \${l.City}.</textarea></div>
          <button class="btn solid" style="width:100%;" type="submit">Request Showing</button>
          <p class="form-note">Preview mode — on the live site this sends a lead to the office.</p>
        </form>
      </aside>
    </div>
  </div></section>\`;
  document.getElementById("tourForm").addEventListener("submit", e => {
    e.preventDefault();
    e.target.outerHTML = '<div class="form-success">Request received — on the live site the office is notified instantly.</div>';
  });
}

function pageAbout() {
  app.innerHTML = \`
  <section class="page-hero"><div class="container"><span class="eyebrow">Our Story</span><h1>Boutique by choice. Local by heart.</h1></div></section>
  <section class="section"><div class="container split">
    <figure class="portrait"><img src="${TEAM.tahir}" alt="Tahir Parvaiz" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top center;">
      <figcaption><b class="serif" style="font-size:1.3rem;">Tahir Parvaiz</b><br>
      <span style="color:var(--gold);font-size:.8rem;letter-spacing:2px;text-transform:uppercase;">Broker & Owner</span></figcaption></figure>
    <div><span class="eyebrow">Meet the Broker</span>
      <h2 style="font-size:clamp(1.8rem,3vw,2.5rem);">Tahir Parvaiz</h2>
      <p style="color:var(--muted);margin-top:16px;">Aria Realty Inc. was founded on a simple conviction: buying or selling a home deserves the direct attention of a broker, not a hand-off through layers of a big-box firm. As broker and owner, Tahir personally guides every client relationship — from the first market conversation to the closing table.</p>
      <div class="quote">"My name is on the license and on the sign in the yard. That accountability changes everything about how we serve our clients."</div>
      <p style="color:var(--muted);">Based in Peachtree City, Tahir combines sharp negotiation with deep knowledge of the local market — the village school zones, the cart-path connectivity that drives value, the HOA and new-construction landscape across Fayette and Coweta County.</p>
      <a class="btn" style="margin-top:28px;" href="#/contact">Start a Conversation</a></div>
  </div></section>
  <section class="section" style="background:var(--bg-2);"><div class="container">
    <div class="section-head" style="text-align:center;margin-left:auto;margin-right:auto;">
      <span class="eyebrow" style="justify-content:center;">Our People</span><h2>Meet the Team</h2>
      <p>A deliberately small team — so every client gets senior-level attention on every transaction.</p></div>
    <div class="team-grid">
      <div class="team-card"><div class="photo"><img src="${TEAM.tahir}" alt="Tahir Parvaiz"></div>
        <div class="info"><b>Tahir Parvaiz</b><span class="role">Broker & Owner</span>
        <p class="bio">Founder of Aria Realty and the broker of record on every transaction. Tahir leads pricing strategy, negotiation, and closing oversight for buyers and sellers across Fayette & Coweta County.</p>
        <a href="#/contact">Contact Tahir</a></div></div>
      <div class="team-card"><div class="photo"><img src="${TEAM.tana}" alt="Tana Sumner"></div>
        <div class="info"><b>Tana Sumner</b><span class="role">Realtor®</span>
        <p class="bio">Tana brings warm, detail-driven service to buyers and sellers throughout the south metro area — from first tours to closing day, she keeps every step organized and every client informed.</p>
        <a href="#/contact">Contact Tana</a></div></div>
    </div>
  </div></section>
  <section class="section"><div class="container">
    <div class="section-head"><span class="eyebrow">What We Do</span><h2>Services</h2></div>
    <div class="grid cols-3">
      <div class="feature"><div class="ico">B</div><h3>Buyer Representation</h3><p>Full MLS access, private tours, offer strategy, and negotiation — with a broker who knows what homes actually close for in each village.</p></div>
      <div class="feature"><div class="ico">S</div><h3>Listing & Marketing</h3><p>Precision pricing, professional photography and media, MLS syndication to every major portal, and hands-on negotiation to net you more.</p></div>
      <div class="feature"><div class="ico">L</div><h3>Leasing & Investment</h3><p>Rental listings, tenant placement, and investment guidance for owners across the south metro market.</p></div>
    </div>
  </div></section>\`;
}

function pageContact() {
  app.innerHTML = \`
  <section class="page-hero"><div class="container"><span class="eyebrow">Contact</span><h1>Talk to the broker.</h1></div></section>
  <section class="section"><div class="container detail-grid" style="margin:10px auto 40px;">
    <div class="sidebar-card" style="position:static;">
      <h3 class="serif" style="font-size:1.5rem;">Send us a message</h3>
      <p class="agent">We reply personally — usually within the hour during business hours.</p>
      <form id="contactForm">
        <div class="field"><label>Name</label><input name="name" required></div>
        <div class="field"><label>Email</label><input name="email" type="email"></div>
        <div class="field"><label>Phone</label><input name="phone" type="tel"></div>
        <div class="field"><label>I'm interested in</label><select name="interest">
          <option>Buying a home</option><option>Selling my home / valuation</option>
          <option>Renting or leasing</option><option>Investment property</option><option>Something else</option></select></div>
        <div class="field"><label>Message</label><textarea name="message" placeholder="Tell us a little about what you're looking for…"></textarea></div>
        <button class="btn solid" style="width:100%;" type="submit">Send Message</button>
      </form>
    </div>
    <div><span class="eyebrow">Office</span>
      <h2 style="font-size:1.9rem;">Aria Realty Inc.</h2>
      <p style="color:var(--muted);margin:14px 0 26px;">Peachtree City, Georgia 30269<br>Serving Fayette & Coweta County<br><br>
      <b style="color:var(--text);">Tahir Parvaiz</b> — Broker & Owner<br>
      <span style="color:#5d6b80;font-size:.85rem;">(Phone, email & street address added before launch.)</span></p>
      <div class="feature" style="margin-bottom:16px;"><h3>Prefer to talk now?</h3><p>Call or text the office line and you'll reach a licensed broker, not a call center.</p></div>
      <div class="feature"><h3>Selling your home?</h3><p>Ask for a complimentary market analysis — prepared personally by the broker.</p></div>
    </div>
  </div></section>\`;
  document.getElementById("contactForm").addEventListener("submit", e => {
    e.preventDefault();
    e.target.outerHTML = '<div class="form-success">Message received — on the live site this lead goes straight to the office. Thank you!</div>';
  });
}

function route() {
  const hash = location.hash.slice(2) || "home"; // drop "#/"
  const [pathPart, queryPart] = hash.split("?");
  const params = new URLSearchParams(queryPart || "");
  document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("active"));
  const mark = k => { const a = document.querySelector('[data-nav="'+k+'"]'); if (a) a.classList.add("active"); };
  if (pathPart === "home" || pathPart === "") { pageHome(); mark("home"); }
  else if (pathPart === "listings") { pageListings(params); mark(params.get("ours")==="true"?"ours":"listings"); }
  else if (pathPart.startsWith("listing/")) pageDetail(decodeURIComponent(pathPart.split("/")[1]));
  else if (pathPart === "about") { pageAbout(); mark("about"); }
  else if (pathPart === "contact") { pageContact(); mark("contact"); }
  else { pageHome(); mark("home"); }
  const links = document.querySelector(".nav-links"); if (links) links.classList.remove("open");
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);
document.querySelector(".nav-toggle").addEventListener("click", () => document.querySelector(".nav-links").classList.toggle("open"));
route();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'preview.html'), html);
console.log('preview.html written:', (html.length / 1024).toFixed(0), 'KB');
