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

// ===== Pin SVG — teardrop, 36×48px, borough-colored =====
function pinSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
    <path d="M18 2 C9 2 2 9 2 18 C2 30 18 46 18 46 C18 46 34 30 34 18 C34 9 27 2 18 2 Z"
          fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1.2"/>
    <circle cx="18" cy="17" r="10" fill="rgba(255,255,255,0.15)"/>
    <polygon points="18,11 11,24 25,24" fill="white" opacity="0.95"/>
    <path d="M10.5,25 A10,10 0 0 0 25.5,25" stroke="white" stroke-width="2.2"
          fill="none" stroke-linecap="round"/>
    <circle cx="15.5" cy="19" r="1.6" fill="${color}" opacity="0.9"/>
    <circle cx="21"   cy="21" r="1.6" fill="${color}" opacity="0.9"/>
    <circle cx="17"   cy="23" r="1.3" fill="${color}" opacity="0.9"/>
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
  const LABEL_ZOOM = 12;

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
