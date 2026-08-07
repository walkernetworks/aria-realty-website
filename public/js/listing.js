/* Listing detail page controller */
(async () => {
  document.getElementById("yr").textContent = new Date().getFullYear();
  const wrap = document.querySelector("#detail .container");
  const key = new URLSearchParams(location.search).get("id");
  const l = key ? await Aria.getListing(key) : null;

  if (!l) {
    wrap.innerHTML = `<div class="empty"><h2 class="serif">Listing not found</h2>
      <p>It may have gone under contract or been removed from the market.</p>
      <a class="btn" style="margin-top:20px;" href="listings.html">Back to Search</a></div>`;
    return;
  }

  document.title = `${l.UnparsedAddress}, ${l.City} | Aria Realty Inc.`;
  const ours = l.ListOfficeName === Aria.OFFICE;
  const photos = l.Media && l.Media.length ? l.Media : ["assets/photos/home-01.svg"];
  const side = photos.slice(1, 3).map((p) => `<div class="shot"><img src="${p}" alt="Photo"></div>`).join("");
  const isLand = l.PropertyType === "Land";

  const specs = [
    !isLand && ["Bedrooms", l.BedroomsTotal],
    !isLand && ["Bathrooms", `${l.BathroomsFull} full${l.BathroomsHalf ? " · " + l.BathroomsHalf + " half" : ""}`],
    !isLand && ["Living Area", Aria.num(l.LivingArea) + " sq ft"],
    ["Lot Size", l.LotSizeAcres + " acres"],
    !isLand && ["Year Built", l.YearBuilt],
    !isLand && ["Garage", (l.GarageSpaces || 0) + " car"],
    ["Type", l.PropertySubType || l.PropertyType],
    ["Status", l.StandardStatus],
    ["Days on Market", l.DaysOnMarket],
  ].filter(Boolean).map(([k, v]) => `<div class="spec"><span>${k}</span><b>${v}</b></div>`).join("");

  wrap.innerHTML = `
    <a href="listings.html" style="color:var(--muted); font-size:.9rem;">← Back to search</a>
    <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:20px; flex-wrap:wrap; margin-top:18px;">
      <div>
        <span class="eyebrow">${ours ? "Aria Exclusive" : "Courtesy of " + l.ListOfficeName + " (IDX)"}</span>
        <h1 style="font-size:clamp(1.8rem,3.6vw,2.7rem);">${l.UnparsedAddress}</h1>
        <p style="color:var(--muted);">${l.SubdivisionName && l.SubdivisionName !== "None" ? l.SubdivisionName + " · " : ""}${l.City}, ${l.StateOrProvince} ${l.PostalCode}</p>
      </div>
      <div class="price" style="font-size:2.2rem;">${Aria.money(l.ListPrice)}</div>
    </div>

    <div class="gallery">
      <div class="main"><img src="${photos[0]}" alt="${l.UnparsedAddress}"></div>
      ${side ? `<div class="side">${side}</div>` : ""}
    </div>

    <div class="detail-grid">
      <div>
        <div class="spec-grid">${specs}</div>
        <h2 style="font-size:1.6rem; margin:26px 0 10px;">About this ${isLand ? "property" : "home"}</h2>
        <p style="color:var(--muted);">${l.PublicRemarks || ""}</p>
        <p style="color:#5d6b80; font-size:.8rem; margin-top:26px;">MLS #${l.ListingKey} · Listed by ${l.ListAgentFullName}, ${l.ListOfficeName}</p>
      </div>
      <aside class="sidebar-card">
        <h3 class="serif" style="font-size:1.4rem;">Schedule a private tour</h3>
        <p class="agent">Tahir Parvaiz · Broker, Aria Realty Inc.</p>
        <form id="tourForm">
          <div class="field"><label>Name</label><input name="name" required></div>
          <div class="field"><label>Email</label><input name="email" type="email"></div>
          <div class="field"><label>Phone</label><input name="phone" type="tel"></div>
          <div class="field"><label>Message</label><textarea name="message">I'd like to tour ${l.UnparsedAddress}, ${l.City}.</textarea></div>
          <button class="btn solid" style="width:100%;" type="submit">Request Showing</button>
          <p class="form-note">No obligation. We typically reply within the hour during business hours.</p>
        </form>
      </aside>
    </div>`;

  document.getElementById("tourForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.listingKey = l.ListingKey;
    const ok = await Aria.sendLead(data);
    e.target.outerHTML = ok
      ? `<div class="form-success">Request received — we'll reach out shortly to confirm your tour.</div>`
      : `<div class="form-success">Almost there — email us at <b>info@ariarealty.com</b> or call the office to confirm your tour of ${l.UnparsedAddress}.</div>`;
  });
})();
