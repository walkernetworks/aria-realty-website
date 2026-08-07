/* Shared helpers: API access with static-hosting fallback, card rendering, nav. */
const Aria = (() => {
  const OFFICE = "Aria Realty Inc.";
  let staticCache = null;

  const money = (n) =>
    n >= 10000
      ? "$" + Number(n).toLocaleString("en-US")
      : "$" + Number(n).toLocaleString("en-US") + "/mo";

  const num = (n) => Number(n || 0).toLocaleString("en-US");

  async function fetchStatic() {
    if (staticCache) return staticCache;
    const res = await fetch("data/sample-listings.json");
    staticCache = (await res.json()).listings;
    return staticCache;
  }

  // Client-side filtering mirror of the server API (used on static hosting).
  function filterLocal(rows, q) {
    let out = rows.slice();
    if (q.status) {
      const st = q.status.toLowerCase().split(",");
      out = out.filter((l) => st.includes((l.StandardStatus || "").toLowerCase()));
    } else out = out.filter((l) => l.StandardStatus !== "Closed");
    if (q.city) out = out.filter((l) => (l.City || "").toLowerCase() === q.city.toLowerCase());
    if (q.type) {
      const t = q.type.toLowerCase();
      out = out.filter((l) => (l.PropertyType || "").toLowerCase() === t || (l.PropertySubType || "").toLowerCase() === t);
    }
    if (q.minPrice) out = out.filter((l) => l.ListPrice >= +q.minPrice);
    if (q.maxPrice) out = out.filter((l) => l.ListPrice <= +q.maxPrice);
    if (q.beds) out = out.filter((l) => (l.BedroomsTotal || 0) >= +q.beds);
    if (q.baths) out = out.filter((l) => (l.BathroomsFull || 0) >= +q.baths);
    if (q.ours === "true") out = out.filter((l) => l.ListOfficeName === OFFICE);
    if (q.featured === "true") out = out.filter((l) => l.Featured);
    if (q.keyword) {
      const kw = q.keyword.toLowerCase();
      out = out.filter((l) => [l.UnparsedAddress, l.City, l.PostalCode, l.SubdivisionName, l.PublicRemarks].join(" ").toLowerCase().includes(kw));
    }
    const sorters = {
      "price-asc": (a, b) => a.ListPrice - b.ListPrice,
      "price-desc": (a, b) => b.ListPrice - a.ListPrice,
      "newest": (a, b) => (a.DaysOnMarket ?? 999) - (b.DaysOnMarket ?? 999),
      "sqft-desc": (a, b) => (b.LivingArea || 0) - (a.LivingArea || 0),
    };
    out.sort(sorters[q.sort] || sorters["newest"]);
    const page = Math.max(1, +q.page || 1), perPage = Math.min(48, +q.perPage || 12);
    return {
      total: out.length, page, perPage,
      totalPages: Math.max(1, Math.ceil(out.length / perPage)),
      listings: out.slice((page - 1) * perPage, page * perPage),
      meta: { source: "SAMPLE_DATA" },
    };
  }

  async function search(params = {}) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null));
    try {
      const res = await fetch("/api/listings?" + qs.toString());
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return filterLocal(await fetchStatic(), params);
    }
  }

  async function getListing(key) {
    try {
      const res = await fetch("/api/listings/" + encodeURIComponent(key));
      if (!res.ok) throw new Error();
      return (await res.json()).listing;
    } catch {
      return (await fetchStatic()).find((l) => l.ListingKey === key) || null;
    }
  }

  async function sendLead(payload) {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false; // static hosting: no API — caller shows mailto fallback
    }
  }

  function card(l) {
    const ours = l.ListOfficeName === OFFICE;
    const statusBadge =
      l.StandardStatus === "Coming Soon" ? `<span class="badge">Coming Soon</span>`
      : l.StandardStatus === "Pending" ? `<span class="badge">Pending</span>`
      : ours ? `<span class="badge ours">Aria Exclusive</span>` : "";
    const photo = (l.Media && l.Media[0]) || "assets/photos/home-01.svg";
    const isLease = l.PropertyType === "Residential Lease";
    const facts =
      l.PropertyType === "Land"
        ? `<span><b>${l.LotSizeAcres}</b> acres</span><span><b>${l.City}</b></span>`
        : `<span><b>${l.BedroomsTotal}</b> bd</span>
           <span><b>${l.BathroomsFull}${l.BathroomsHalf ? "½" : ""}</b> ba</span>
           <span><b>${num(l.LivingArea)}</b> sq ft</span>`;
    return `
      <a class="card" href="listing.html?id=${encodeURIComponent(l.ListingKey)}">
        <div class="thumb">${statusBadge}<img src="${photo}" alt="${l.UnparsedAddress}" loading="lazy"></div>
        <div class="body">
          <div class="price">${money(l.ListPrice)}${isLease ? "" : ""}</div>
          <div class="addr">${l.UnparsedAddress}<small>${l.City}, ${l.StateOrProvince} ${l.PostalCode} · ${l.SubdivisionName || ""}</small></div>
          <div class="facts">${facts}</div>
        </div>
      </a>`;
  }

  function initNav() {
    const t = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (t) t.addEventListener("click", () => links.classList.toggle("open"));
    const here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((a) => {
      if (a.getAttribute("href") === here) a.classList.add("active");
    });
  }

  async function dataSourceNote(el) {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const h = await res.json();
        if (h.data.source === "MLS_FEED") { el.remove(); return; }
      }
    } catch { /* static hosting */ }
    el.innerHTML =
      "Demo mode &mdash; showing sample listings. Live MLS listings appear here automatically once the FMLS / Georgia MLS IDX feed is connected (see docs/MLS-IDX-SETUP-GUIDE.md).";
  }

  document.addEventListener("DOMContentLoaded", initNav);
  return { money, num, search, getListing, sendLead, card, dataSourceNote, OFFICE };
})();
