// ===== NYC Pizza Map =====
// Uses CARTO Voyager basemap (OpenStreetMap data, no API key).
// All markers are HTML Marker elements — full pixel-size control,
// no symbol-layer scaling. No clusters — individual pins always visible.

const BOROUGH_COLORS = {
  Brooklyn:      '#DC2225',
  Manhattan:     '#276E40',
  Queens:        '#D9A441',
  Bronx:         '#8B3A62',
  'Staten Island': '#3C5A80'
};

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      'carto-voyager': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    },
    layers: [{
      id: 'carto-voyager',
      type: 'raster',
      source: 'carto-voyager'
    }]
  },
  center: [-73.96, 40.72],
  zoom: 10.4,
  minZoom: 9,
  maxZoom: 18
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

// ===== Pizza slice icon SVG =====
// Flat pizza slice shape — matches the reference icon style.
// Colored by borough. White cheese bubbles inside.
// 40×44px rendered size — wide enough to read clearly as a slice.
function pinSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="44" viewBox="0 0 100 110">
    <!-- Crust band at top -->
    <path d="M8 22 Q50 0 92 22 L88 36 Q50 16 12 36 Z"
          fill="${color}"/>
    <!-- White gap between crust and slice body -->
    <path d="M12 36 Q50 18 88 36 L86 42 Q50 24 14 42 Z"
          fill="white"/>
    <!-- Main slice body -->
    <path d="M14 42 Q50 26 86 42 L50 108 Z"
          fill="${color}"/>
    <!-- Cheese bubbles -->
    <circle cx="50" cy="62" r="10" fill="white" opacity="0.9"/>
    <circle cx="32" cy="75" r="7"  fill="white" opacity="0.85"/>
    <circle cx="68" cy="72" r="7"  fill="white" opacity="0.85"/>
    <circle cx="44" cy="88" r="5.5" fill="white" opacity="0.8"/>
    <circle cx="62" cy="91" r="4.5" fill="white" opacity="0.8"/>
  </svg>`;
}

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}
function escapeAttr(str) {
  return (str ?? '').replace(/"/g, '&quot;');
}

map.on('load', async () => {
  const res  = await fetch('data.json');
  const geojson = await res.json();

  // Show entry count in the about panel (if element exists)
  const countEl = document.getElementById('entryCount');
  if (countEl) countEl.textContent = geojson.features.length;

  // LABEL_ZOOM: below this zoom, labels are hidden to avoid clutter
  const LABEL_ZOOM = 11;

  function updateLabels() {
    const show = map.getZoom() >= LABEL_ZOOM;
    document.querySelectorAll('.pin-label').forEach(el => {
      el.style.opacity = show ? '1' : '0';
    });
  }

  map.on('zoomend', updateLabels);

  geojson.features.forEach(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    const p   = feature.properties;
    const col = BOROUGH_COLORS[p.borough] || '#DC2225';

    // Wrapper element: pin SVG + label below it
    const wrap = document.createElement('div');
    wrap.className = 'pizza-marker-wrap';

    // Pin
    const pin = document.createElement('div');
    pin.className = 'pizza-pin';
    pin.innerHTML = pinSVG(col);

    // Label
    const label = document.createElement('div');
    label.className = 'pin-label';
    label.textContent = p.name;
    label.style.opacity = map.getZoom() >= LABEL_ZOOM ? '1' : '0';

    wrap.appendChild(pin);
    wrap.appendChild(label);

    // Popup
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const html = `
      <div class="ticket">
        <div class="ticket-head">
          <p class="ticket-name">${escapeHTML(p.name)}</p>
          <p class="ticket-address">${escapeHTML(p.address)}</p>
        </div>
        <div class="ticket-body">
          <span class="style-badge" style="background:${col}">${escapeHTML(p.style)}</span>
          <p class="ticket-blurb">${escapeHTML(p.blurb)}</p>
          <div class="ticket-links">
            ${p.website ? `<a href="${escapeAttr(p.website)}" target="_blank" rel="noopener">Website</a>` : ''}
            <a href="${escapeAttr(directionsUrl)}" target="_blank" rel="noopener">Directions</a>
          </div>
        </div>
      </div>`;

    wrap.addEventListener('click', (e) => {
      e.stopPropagation();
      new maplibregl.Popup({ closeButton: true, maxWidth: '270px', offset: 50 })
        .setLngLat([lng, lat])
        .setHTML(html)
        .addTo(map);
    });

    new maplibregl.Marker({ element: wrap, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map);
  });
});
