/* ============================================================
   FIELD JOURNAL — App
   ============================================================ */

const fmtDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const fmtDateRange = (start, end) => {
  if (!end || start === end) return fmtDate(start);
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const sameYear = a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.toLocaleDateString('en-US',{month:'short'})} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`;
  }
  if (sameYear) {
    return `${a.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${b.toLocaleDateString('en-US',{month:'short',day:'numeric'})}, ${b.getFullYear()}`;
  }
  return `${fmtDate(start)} – ${fmtDate(end)}`;
};

const safeText = (s) => {
  const div = document.createElement('div');
  div.textContent = s ?? '';
  return div.innerHTML;
};

/* ============================================================
   HOME — Trip List
   ============================================================ */

async function renderTripList() {
  const container = document.getElementById('trips');
  const counter = document.getElementById('trips-counter');
  const headerCount = document.getElementById('trip-count');

  try {
    const res = await fetch('data/trips.json');
    if (!res.ok) throw new Error('Could not load trips index');
    const index = await res.json();

    // Sort newest first
    const trips = [...(index.trips || [])].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    if (trips.length === 0) {
      container.innerHTML = '<div class="error-state">No trips logged yet. Add your first trip in <code>data/trips.json</code>.</div>';
      return;
    }

    counter.textContent = `${String(trips.length).padStart(2, '0')} entries`;
    headerCount.textContent = `${String(trips.length).padStart(2, '0')} Trips Logged`;

    container.innerHTML = trips.map((t, i) => {
      const heroBg = t.hero
        ? `style="background-image: url('${safeText(t.hero)}')"`
        : '';
      const noImageClass = t.hero ? '' : 'trip-card-no-image';
      const noImageContent = t.hero ? '' : '<span>No photo yet</span>';

      return `
        <a class="trip-card" href="trip.html?slug=${encodeURIComponent(t.slug)}">
          <div class="trip-card-image ${noImageClass}" ${heroBg}>${noImageContent}</div>
          <div class="trip-card-body">
            <div class="trip-card-date">${fmtDate(t.date)}</div>
            <div class="trip-card-title">${safeText(t.title)}</div>
            <div class="trip-card-location">${safeText(t.subtitle || '')}</div>
            <div class="trip-card-summary">${safeText(t.summary_short || '')}</div>
            <div class="trip-card-footer">
              <span>Entry №${String(trips.length - i).padStart(3, '0')}</span>
              <span>Read →</span>
            </div>
          </div>
        </a>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="error-state">Failed to load trips: ${err.message}</div>`;
  }
}

/* ============================================================
   TRIP DETAIL
   ============================================================ */

async function renderTripDetail() {
  const main = document.getElementById('trip-content');
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    main.innerHTML = '<div class="trip-section"><div class="error-state">No trip specified.</div></div>';
    return;
  }

  try {
    const res = await fetch(`data/trips/${slug}.json`);
    if (!res.ok) throw new Error(`Trip "${slug}" not found`);
    const trip = await res.json();

    document.getElementById('page-title').textContent = `${trip.title} — Field Journal`;

    const heroStyle = trip.hero ? `style="background-image: url('${trip.hero}')"` : '';

    // Build meta stats from trip.stats object
    const statBlocks = [];
    statBlocks.push(`
      <div class="meta-stat">
        <div class="meta-stat-label">Dates</div>
        <div class="meta-stat-value">${fmtDateRange(trip.dates.start, trip.dates.end)}</div>
      </div>
    `);
    if (trip.location?.name) {
      statBlocks.push(`
        <div class="meta-stat">
          <div class="meta-stat-label">Location</div>
          <div class="meta-stat-value">${safeText(trip.location.name)}</div>
        </div>
      `);
    }
    if (trip.stats) {
      const s = trip.stats;
      if (s.distance_miles != null) statBlocks.push(`<div class="meta-stat"><div class="meta-stat-label">Distance</div><div class="meta-stat-value">${s.distance_miles} mi</div></div>`);
      if (s.elevation_ft != null) statBlocks.push(`<div class="meta-stat"><div class="meta-stat-label">Elevation Gain</div><div class="meta-stat-value">${s.elevation_ft.toLocaleString()} ft</div></div>`);
      if (s.nights != null) statBlocks.push(`<div class="meta-stat"><div class="meta-stat-label">Nights</div><div class="meta-stat-value">${s.nights}</div></div>`);
    }

    // Crew
    const crewHtml = (trip.crew || []).length
      ? `
        <section class="trip-section">
          <div class="trip-section-head">
            <span class="num">01</span>
            <h2>The Crew</h2>
          </div>
          <div class="crew">
            ${trip.crew.map(c => `<span class="crew-chip">${safeText(c)}</span>`).join('')}
          </div>
        </section>`
      : '';

    // Map
    const mapHtml = trip.location?.lat
      ? `
        <section class="trip-section">
          <div class="trip-section-head">
            <span class="num">02</span>
            <h2>The Place</h2>
          </div>
          <div id="map"></div>
          <p style="margin-top:1rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--ink-faint); letter-spacing: 0.1em;">
            ${trip.location.lat.toFixed(4)}° N, ${Math.abs(trip.location.lng).toFixed(4)}° W
          </p>
        </section>`
      : '';

    // Checklist
    const checklistHtml = (trip.checklist || []).length
      ? `
        <section class="trip-section">
          <div class="trip-section-head">
            <span class="num">03</span>
            <h2>The Pack List</h2>
          </div>
          <div class="checklist">
            ${trip.checklist.map(cat => `
              <div class="checklist-category">
                <h4>${safeText(cat.category)}</h4>
                <ul class="checklist-items">
                  ${cat.items.map(item => `
                    <li class="${item.checked ? 'checked' : ''}">
                      <span class="box"></span>
                      <span>${safeText(item.name)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </section>`
      : '';

    // Summary / blog
    const blogHtml = trip.summary
      ? `
        <section class="trip-section">
          <div class="trip-section-head">
            <span class="num">04</span>
            <h2>The Story</h2>
          </div>
          <div class="blog">${marked.parse(trip.summary)}</div>
        </section>`
      : '';

    // Gallery
    const galleryHtml = (trip.gallery || []).length
      ? `
        <section class="trip-section">
          <div class="trip-section-head">
            <span class="num">05</span>
            <h2>The Photos</h2>
          </div>
          <div class="gallery">
            ${trip.gallery.map(src => `<img src="${safeText(src)}" alt="" loading="lazy">`).join('')}
          </div>
        </section>`
      : '';

    main.innerHTML = `
      <div class="trip-hero" ${heroStyle}>
        <div class="trip-hero-content">
          <a href="index.html" class="back-link">All Trips</a>
          <div class="eyebrow">${fmtDateRange(trip.dates.start, trip.dates.end)}</div>
          <h1>${safeText(trip.title)}</h1>
          ${trip.subtitle ? `<p class="hero-tagline">${safeText(trip.subtitle)}</p>` : ''}
        </div>
      </div>
      <div class="trip-meta-bar">${statBlocks.join('')}</div>
      ${crewHtml}
      ${mapHtml}
      ${checklistHtml}
      ${blogHtml}
      ${galleryHtml}
    `;

    // Init map
    if (trip.location?.lat) {
      const map = L.map('map', { scrollWheelZoom: false }).setView([trip.location.lat, trip.location.lng], 13);
      L.tileLayer('https://tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map: © OpenTopoMap (CC-BY-SA)'
      }).addTo(map);
      L.marker([trip.location.lat, trip.location.lng]).addTo(map)
        .bindPopup(safeText(trip.location.name || trip.title));
    }

    // Init gallery lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    document.querySelectorAll('.gallery img').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
      });
    });
    lightbox.addEventListener('click', () => lightbox.classList.remove('active'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lightbox.classList.remove('active');
    });

  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="trip-section"><div class="error-state">Failed to load trip: ${err.message}</div></div>`;
  }
}
