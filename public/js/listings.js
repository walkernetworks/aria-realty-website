/* Listings search page controller */
(() => {
  const form = document.getElementById("filters");
  const grid = document.getElementById("resultsGrid");
  const count = document.getElementById("count");
  const pag = document.getElementById("pagination");
  const sortSel = document.getElementById("sort");
  const oursCb = document.getElementById("oursOnly");
  const title = document.getElementById("pageTitle");

  const state = Object.fromEntries(new URLSearchParams(location.search).entries());
  state.page = state.page || 1;

  // Reflect URL params into controls
  for (const el of form.elements) if (el.name && state[el.name]) el.value = state[el.name];
  if (state.sort) sortSel.value = state.sort;
  if (state.ours === "true") { oursCb.checked = true; title.textContent = "Aria Realty Exclusive Listings"; }

  async function loadCities() {
    const sel = document.getElementById("f-city");
    let cities = [];
    try {
      const res = await fetch("/api/cities");
      cities = (await res.json()).cities;
    } catch {
      cities = ["Peachtree City", "Fayetteville", "Tyrone", "Senoia", "Newnan", "Sharpsburg"];
    }
    for (const c of cities) {
      const o = document.createElement("option");
      o.textContent = c; o.value = c;
      if (state.city === c) o.selected = true;
      sel.appendChild(o);
    }
  }

  function syncUrl() {
    const qs = new URLSearchParams(Object.entries(state).filter(([, v]) => v !== "" && v != null));
    history.replaceState(null, "", "listings.html?" + qs.toString());
  }

  async function run() {
    grid.innerHTML = '<p class="empty">Loading…</p>';
    const r = await Aria.search({ ...state, perPage: 12 });
    count.innerHTML = `<b>${r.total}</b> ${r.total === 1 ? "home" : "homes"} found`;
    grid.innerHTML = r.listings.length
      ? r.listings.map(Aria.card).join("")
      : '<div class="empty" style="grid-column:1/-1;"><h3 class="serif" style="font-size:1.5rem;">No homes match those filters</h3><p>Try widening your price range or removing a filter.</p></div>';

    pag.innerHTML = "";
    if (r.totalPages > 1) {
      for (let p = 1; p <= r.totalPages; p++) {
        const b = document.createElement("button");
        b.textContent = p;
        if (p === Number(r.page)) b.classList.add("active");
        b.addEventListener("click", () => { state.page = p; syncUrl(); run(); window.scrollTo({ top: 0, behavior: "smooth" }); });
        pag.appendChild(b);
      }
    }
    syncUrl();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    for (const el of form.elements) if (el.name) state[el.name] = el.value;
    state.page = 1;
    run();
  });
  sortSel.addEventListener("change", () => { state.sort = sortSel.value; state.page = 1; run(); });
  oursCb.addEventListener("change", () => {
    state.ours = oursCb.checked ? "true" : "";
    title.textContent = oursCb.checked ? "Aria Realty Exclusive Listings" : "Homes On The Market";
    state.page = 1; run();
  });

  document.getElementById("yr").textContent = new Date().getFullYear();
  const note = document.getElementById("dataNote");
  note.hidden = false;
  Aria.dataSourceNote(note);
  loadCities().then(run);
})();
