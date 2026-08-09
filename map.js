// ===== NYC Pizza Map =====
// CARTO Voyager basemap (OpenStreetMap data, no API key).
// HTML Markers for full size control. Labels sit to the RIGHT of the
// icon, Google Maps style. No cluster circles — just pizza slices.

const BOROUGH_COLORS = {
  Brooklyn:        '#DC2225',
  Manhattan:       '#276E40',
  Queens:          '#FF6B00',
  Bronx:           '#8B3A62',
  'Staten Island': '#3C5A80'
};

// Check for ?pin= param before initializing map so we can start at the right location
const _initParams = new URLSearchParams(window.location.search);
const _initPin = _initParams.get('pin');

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
    layers: [{ id: 'carto-voyager', type: 'raster', source: 'carto-voyager' }]
  },
  center: [-73.96, 40.72],
  zoom: _initPin ? 16 : 10.4,
  minZoom: 9,
  maxZoom: 18
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

// ===== Zoom-responsive marker sizing =====
// Shrinks pizza pins when zoomed out so 190+ markers don't overwhelm the city view
function updateZoomMarkerSize() {
  const z = map.getZoom();
  const mapEl = document.getElementById('map');
  mapEl.classList.remove('zoom-far', 'zoom-mid', 'zoom-close', 'zoom-closer');
  if (z < 11.5)      mapEl.classList.add('zoom-far');
  else if (z < 13)   mapEl.classList.add('zoom-mid');
  else if (z < 14.5) mapEl.classList.add('zoom-close');
  else                mapEl.classList.add('zoom-closer');
}
map.on('zoom', updateZoomMarkerSize);
map.on('load', updateZoomMarkerSize);

// ===== Pizza slice icon SVG (flat, 40x44px) =====
function sliceSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="${color}" stroke="white" stroke-width="3.5"/>
    <path d="M27 31 Q50 24 73 31 Q68 37 50 70 Q32 37 27 31 Z" fill="white"/>
    <circle cx="41" cy="38" r="3.6" fill="${color}"/>
    <circle cx="50" cy="50" r="3.6" fill="${color}"/>
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

// Labels show at this zoom and above
const LABEL_ZOOM = 13.2;

function labelsVisible() {
  return map.getZoom() >= LABEL_ZOOM;
}

// ===== Proximity detection for label side =====
// For each feature, check if any other feature is within ~400m.
// If two pins are close, alternate: the first keeps label RIGHT,
// the second flips label LEFT — so they spread away from each other.
// Returns a Set of indices that should have their label on the LEFT.
function computeLeftLabelIndices(features) {
  const R = 6371000; // Earth radius in metres
  const THRESHOLD = 400; // metres — roughly 4–5 blocks

  function dist(a, b) {
    const [lng1, lat1] = a.geometry.coordinates;
    const [lng2, lat2] = b.geometry.coordinates;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const sa = Math.sin(dLat/2)**2 +
               Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
               Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1-sa));
  }

  const leftSet = new Set();
  // Track which indices have already been "paired" so we alternate cleanly
  const paired = new Set();

  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      if (paired.has(i) && paired.has(j)) continue;
      if (dist(features[i], features[j]) < THRESHOLD) {
        // Flip whichever isn't already assigned
        if (!paired.has(i) && !paired.has(j)) {
          // Neither paired yet: keep i right, flip j left
          leftSet.add(j);
          paired.add(i);
          paired.add(j);
        } else if (paired.has(i) && !paired.has(j)) {
          // i already assigned; flip j
          leftSet.add(j);
          paired.add(j);
        } else if (paired.has(j) && !paired.has(i)) {
          // j already assigned; flip i
          leftSet.add(i);
          paired.add(i);
        }
      }
    }
  }
  return leftSet;
}

map.on('load', async () => {
  const res = await fetch('data.json');
  const geojson = await res.json();

  const countEl = document.getElementById('entryCount');
  if (countEl) countEl.textContent = geojson.features.length;

  const leftLabelIndices = computeLeftLabelIndices(geojson.features);
  const labels = [];
  let activePopup = null;  // track the currently open popup

  geojson.features.forEach((feature, idx) => {
    const [lng, lat] = feature.geometry.coordinates;
    const p   = feature.properties;
    const col = BOROUGH_COLORS[p.borough] || '#DC2225';
    const flipLeft = leftLabelIndices.has(idx);

    // Wrapper: row layout — label left or right of pin depending on proximity
    const wrap = document.createElement('div');
    wrap.className = 'pizza-marker-wrap' + (flipLeft ? ' label-left' : '');

    const pin = document.createElement('div');
    pin.className = 'pizza-pin';
    pin.innerHTML = sliceSVG(col);

    const label = document.createElement('div');
    label.className = 'pin-label';
    label.style.opacity = labelsVisible() ? '1' : '0';
    label.innerHTML = `<span class="pin-label-bar" style="background:${col}"></span><span class="pin-label-text">${escapeHTML(p.name)}</span>`;
    labels.push(label);

    if (flipLeft) {
      // Label before pin — renders to the left
      wrap.appendChild(label);
      wrap.appendChild(pin);
    } else {
      wrap.appendChild(pin);
      wrap.appendChild(label);
    }


    // Popup
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    // Find nearest subway stations (safe — won't crash if stations.js missing)
    let subwayHTML = '';
    try {
      if (typeof nearestStations === 'function') {
        const nearby = nearestStations(lat, lng, 2);
        subwayHTML = nearby.map(s => {
          const mins = walkMinutes(s.dist);
          const lines = s.lines.trim().split(/[\s,·\-]+/).filter(Boolean);
          const bullets = lines.slice(0, 4).map(l =>
            `<span class="subway-bullet" style="background:${stationColor(l)};color:${l==='N'||l==='Q'||l==='R'||l==='W'?'#000':'#fff'}">${l}</span>`
          ).join('');
          return `<div class="ticket-subway-row">${bullets}<div class="subway-station-walk"><span class="subway-station-name">${escapeHTML(s.name)}</span><span class="subway-walk">${mins} walk</span></div></div>`;
        }).join('');
      }
    } catch(e) { subwayHTML = ''; }

    const html = `
      <div class="ticket">
        ${p.photo ? `<div class="ticket-photo"><img src="${escapeAttr(p.photo)}" alt="${escapeHTML(p.name)}" loading="lazy" /></div>` : ''}
        ${p.worth_a_trip ? `<div class="ticket-worth-trip">⭐ Worth a special trip</div>` : ''}
        <div class="ticket-head">
          <p class="ticket-name">${escapeHTML(p.name)}</p>
          <p class="ticket-address">📍 ${escapeHTML(p.address)}</p>
        </div>
        <div class="ticket-body">
          <div class="ticket-meta">
            <span class="style-badge">${escapeHTML(p.style)}</span>
            <span class="meta-pill">${p.price || '$'}</span>
            ${p.slices ? `<span class="meta-pill">Slices ✓</span>` : `<span class="meta-pill">Whole pies only</span>`}
            ${p.seating && p.seating !== 'Indoor' ? `<span class="meta-pill">${escapeHTML(p.seating)}</span>` : ''}
          </div>
          <p class="ticket-blurb">${escapeHTML(p.blurb)}</p>
          ${subwayHTML ? `<div class="ticket-subway">
            <div class="ticket-subway-label">🚇 Nearest subway</div>
            ${subwayHTML}
          </div>` : ''}
          <div class="ticket-links">
            ${p.website ? `<a href="${escapeAttr(p.website)}" target="_blank" rel="noopener">Website</a>` : ''}
            <a href="${escapeAttr(directionsUrl)}" target="_blank" rel="noopener">Directions</a>
          </div>
        </div>
      </div>`;

    wrap.addEventListener('click', e => {
      e.stopPropagation();
      if (activePopup) activePopup.remove();
      activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '290px', offset: [20, -22] })
        .setLngLat([lng, lat])
        .setHTML(html)
        .addTo(map);
      activePopup.on('close', () => { activePopup = null; });
    });

    // anchor: 'left' for right-label (pin's left edge at coord)
    // anchor: 'right' for left-label (pin's right edge at coord)
    new maplibregl.Marker({ element: wrap, anchor: flipLeft ? 'right' : 'left' })
      .setLngLat([lng, lat])
      .addTo(map);
  });

  // Show/hide labels based on zoom
  function updateLabels() {
    const show = labelsVisible();
    labels.forEach(l => l.style.opacity = show ? '1' : '0');
  }
  map.on('zoomend', updateLabels);

  // ===== ?pin= URL parameter =====
  const params = new URLSearchParams(window.location.search);
  const pinName = params.get('pin');
  if (pinName) {
    const match = geojson.features.find(
      f => f.properties.name.toLowerCase() === pinName.toLowerCase()
    );
    if (match) {
      const [lng, lat] = match.geometry.coordinates;
      const p   = match.properties;
      const col = BOROUGH_COLORS[p.borough] || '#DC2225';
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      // Find nearest subway stations (safe — won't crash if stations.js missing)
      let subwayHTML = '';
      try {
        if (typeof nearestStations === 'function') {
          const nearby = nearestStations(lat, lng, 2);
          subwayHTML = nearby.map(s => {
            const mins = walkMinutes(s.dist);
            const lines = s.lines.trim().split(/[\s,·\-]+/).filter(Boolean);
            const bullets = lines.slice(0, 4).map(l =>
              `<span class="subway-bullet" style="background:${stationColor(l)};color:${l==='N'||l==='Q'||l==='R'||l==='W'?'#000':'#fff'}">${l}</span>`
            ).join('');
            return `<div class="ticket-subway-row">${bullets}<div class="subway-station-walk"><span class="subway-station-name">${escapeHTML(s.name)}</span><span class="subway-walk">${mins} walk</span></div></div>`;
          }).join('');
        }
      } catch(e) { subwayHTML = ''; }

      const html = `
        <div class="ticket">
          ${p.photo ? `<div class="ticket-photo"><img src="${escapeAttr(p.photo)}" alt="${escapeHTML(p.name)}" loading="lazy" /></div>` : ''}
          ${p.worth_a_trip ? `<div class="ticket-worth-trip">⭐ Worth a special trip</div>` : ''}
          <div class="ticket-head">
            <p class="ticket-name">${escapeHTML(p.name)}</p>
            <p class="ticket-address">📍 ${escapeHTML(p.address)}</p>
          </div>
          <div class="ticket-body">
            <div class="ticket-meta">
              <span class="style-badge">${escapeHTML(p.style)}</span>
              <span class="meta-pill">${p.price || '$'}</span>
              ${p.slices ? `<span class="meta-pill">Slices ✓</span>` : `<span class="meta-pill">Whole pies only</span>`}
              ${p.seating && p.seating !== 'Indoor' ? `<span class="meta-pill">${escapeHTML(p.seating)}</span>` : ''}
            </div>
            <p class="ticket-blurb">${escapeHTML(p.blurb)}</p>
            ${subwayHTML ? `<div class="ticket-subway">
              <div class="ticket-subway-label">🚇 Nearest subway</div>
              ${subwayHTML}
            </div>` : ''}
            <div class="ticket-links">
              ${p.website ? `<a href="${escapeAttr(p.website)}" target="_blank" rel="noopener">Website</a>` : ''}
              <a href="${escapeAttr(directionsUrl)}" target="_blank" rel="noopener">Directions</a>
            </div>
          </div>
        </div>`;

      // Center map on pin (zoom already set to 16 at init) then open popup
      map.setCenter([lng, lat]);
      setTimeout(() => {
        if (activePopup) activePopup.remove();
        activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '290px', offset: [20, -22] })
          .setLngLat([lng, lat])
          .setHTML(html)
          .addTo(map);
        activePopup.on('close', () => { activePopup = null; });
      }, 500);
    }
  }
});

// ===== Near Me button =====
let userMarker = null;

const nearMeBtn = document.getElementById('nearMeBtn');
if (nearMeBtn) {
  nearMeBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    nearMeBtn.textContent = '⏳ Locating…';
    nearMeBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Drop a "you are here" marker
        if (userMarker) userMarker.remove();
        const el = document.createElement('div');
        el.className = 'user-location-dot';
        userMarker = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);

        // Fly to user location at zoom 14
        map.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1000 });

        nearMeBtn.textContent = '📍 Near Me';
        nearMeBtn.disabled = false;
      },
      (err) => {
        nearMeBtn.textContent = '📍 Near Me';
        nearMeBtn.disabled = false;
        if (err.code === 1) {
          alert('Location access denied. Please allow location access in your browser settings.');
        } else {
          alert('Unable to get your location. Please try again.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}
