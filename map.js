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

// ===== Landmark star icon (dark circle badge, white star) =====
function landmarkStarSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="#241A10" stroke="white" stroke-width="3.5"/>
    <path d="M50 22 L58 40 L78 42 L63 55 L67 75 L50 64 L33 75 L37 55 L22 42 L42 40 Z" fill="white"/>
  </svg>`;
}

// ===== Landmark baseball icon (team-color badge, white ball, red stitching) =====
function landmarkBaseballSVG(badgeColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="${badgeColor}" stroke="white" stroke-width="3.5"/>
    <circle cx="50" cy="46" r="24" fill="white"/>
    <path d="M38 25 Q50 46 38 67" fill="none" stroke="#C8102E" stroke-width="2.2"/>
    <path d="M62 25 Q50 46 62 67" fill="none" stroke="#C8102E" stroke-width="2.2"/>
  </svg>`;
}

// ===== Landmark basketball icon (dark circle badge, orange ball with black seams) =====
function landmarkBasketballSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="#241A10" stroke="white" stroke-width="3.5"/>
    <circle cx="50" cy="46" r="24" fill="#E4691B"/>
    <line x1="50" y1="22" x2="50" y2="70" stroke="#241A10" stroke-width="2.2"/>
    <line x1="26" y1="46" x2="74" y2="46" stroke="#241A10" stroke-width="2.2"/>
    <path d="M31 28 Q46 46 31 64" fill="none" stroke="#241A10" stroke-width="2.2"/>
    <path d="M69 28 Q54 46 69 64" fill="none" stroke="#241A10" stroke-width="2.2"/>
  </svg>`;
}

// ===== Landmark cruise/boat icon (dark circle badge, white boat) =====
function landmarkCruiseSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="#241A10" stroke="white" stroke-width="3.5"/>
    <path d="M27 56 Q30 66 40 66 L60 66 Q70 66 73 56 L64 40 L36 40 Z" fill="white"/>
    <rect x="45" y="24" width="10" height="16" rx="1.5" fill="white"/>
    <line x1="27" y1="56" x2="73" y2="56" stroke="#241A10" stroke-width="2"/>
  </svg>`;
}

// ===== Landmark Statue of Liberty icon (dark circle badge, white silhouette) =====
function landmarkStatueSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="#241A10" stroke="white" stroke-width="3.5"/>
    <path d="M42 78 L39 50 Q39 41 46 37 L46 31 L54 31 L54 37 Q61 41 61 50 L58 78 Z" fill="white"/>
    <circle cx="50" cy="27" r="6.5" fill="white"/>
    <path d="M44 22 L46 15 L48 22 M48 20 L50 12 L52 20 M52 22 L54 15 L56 22" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M59 39 L70 23" stroke="white" stroke-width="4" stroke-linecap="round"/>
    <path d="M67 21 L70 23 L74 21 L72 15 L68 15 Z" fill="white"/>
    <path d="M41 44 L35 51" stroke="white" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

// ===== NYC landmarks — single-point attractions only (not neighborhoods) =====
const LANDMARKS = [
  { name: "Empire State Building",   lat: 40.7484, lng: -73.9857 },
  { name: "Rockefeller Center",      lat: 40.7587, lng: -73.9787 },
  { name: "9/11 Memorial",           lat: 40.7115, lng: -74.0134 },
  { name: "Brooklyn Bridge",         lat: 40.7061, lng: -73.9969 },
  { name: "Central Park",            lat: 40.7851, lng: -73.9683 },
  { name: "Statue of Liberty",       lat: 40.6892, lng: -74.0445, icon: 'statue' },
  { name: "Grand Central Terminal",  lat: 40.7527, lng: -73.9772 },
  { name: "Bronx Zoo",               lat: 40.8506, lng: -73.8770 },
  { name: "Madison Square Garden",   lat: 40.7505, lng: -73.9934, icon: 'basketball', large: true },
  { name: "Flatiron Building",       lat: 40.7411, lng: -73.9897 },
  { name: "Washington Square Park",  lat: 40.7308, lng: -73.9973 },
  { name: "The High Line",           lat: 40.7480, lng: -74.0048 },
  { name: "Met Museum",              lat: 40.7794, lng: -73.9632 },
  { name: "Museum of Natural History", lat: 40.7813, lng: -73.9740 },
  { name: "MoMA",                    lat: 40.7614, lng: -73.9776 },
  { name: "Lincoln Center",          lat: 40.7725, lng: -73.9835 },
  { name: "Yankee Stadium",          lat: 40.8296, lng: -73.9262, icon: 'baseball', badgeColor: '#0C2340', large: true },
  { name: "Citi Field",              lat: 40.7571, lng: -73.8458, icon: 'baseball', badgeColor: '#4169E1', large: true },
  { name: "Coney Island",            lat: 40.5755, lng: -73.9707 },
  { name: "Circle Line Sightseeing", lat: 40.76280655144898, lng: -74.00154982881688, icon: 'cruise' },
];

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}
function escapeAttr(str) {
  return (str ?? '').replace(/"/g, '&quot;');
}

// For map pin labels only: strip a " – Location" suffix so chain
// locations (Joe's Pizza, L&B Spumoni Gardens, etc.) show their base
// name on the map. Full name with location still shows in the popup,
// list page, and everywhere else.
const MAP_LABEL_OVERRIDES = {
  "Paulie Gee's East Village Slice Shop": "Paulie Gee's Slice Shop",
  "Vesuvio Restaurant & Pizzeria": "Vesuvio",
  "Ungaro Coal Fired Pizza Cafe": "Ungaro Coal Fired Pizza",
  "Peppino's Pizza & Restaurant": "Peppino's",
  "Angelo's Coal Oven Pizzeria": "Angelo's Coal Oven",
  "John's Pizzeria of Times Square": "John's – Times Square",
  "Pop's Pizza of East Village": "Pop's – East Village",
  "The Original Little Italy": "Original Little Italy",
  "Mimi's Pizza (3rd Ave & 86th)": "Mimi's Pizza",
};
function mapLabel(name) {
  if (MAP_LABEL_OVERRIDES[name]) return MAP_LABEL_OVERRIDES[name];
  const idx = name.indexOf(' – ');
  return idx === -1 ? name : name.slice(0, idx).trim();
}

// Labels show at this zoom and above
const LABEL_ZOOM = 13.2;

function labelsVisible() {
  return map.getZoom() >= LABEL_ZOOM;
}

// Landmark labels wait until a noticeably closer zoom than pizza labels,
// so pizza labels always appear first and landmarks never compete with them
const LANDMARK_LABEL_ZOOM = 15.3;

function landmarksVisible() {
  return map.getZoom() >= LANDMARK_LABEL_ZOOM;
}

// ===== Proximity detection for label side =====
// For each feature, check if any other feature is within ~400m.
// Greedily assigns each pin a side (left/right) for its label, picking
// whichever side has the least weighted conflict from already-placed
// nearby neighbors. Distance-weighted so extremely close pairs (e.g.
// 30m apart) get prioritized for separation over pairs that are merely
// within range (e.g. 300m apart). With 3+ pins mutually within range of
// each other, some overlap is mathematically unavoidable with only two
// sides — this minimizes it rather than eliminating it entirely.
// Returns an array of 'E'/'W' strings, one per feature index.
function computeLabelDirections(features) {
  const R = 6371000; // Earth radius in metres
  const THRESHOLD = 400; // metres — roughly 4–5 blocks
  const DIRECTIONS = ['E', 'W'];

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

  const neighbors = Array.from({ length: features.length }, () => []);
  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      const d = dist(features[i], features[j]);
      if (d < THRESHOLD) {
        const weight = THRESHOLD - d;
        neighbors[i].push({ idx: j, weight });
        neighbors[j].push({ idx: i, weight });
      }
    }
  }

  const direction = new Array(features.length).fill('E');
  const visited = new Array(features.length).fill(false);

  for (let i = 0; i < features.length; i++) {
    if (neighbors[i].length === 0) { visited[i] = true; continue; }
    const conflictByDir = {};
    DIRECTIONS.forEach(d => conflictByDir[d] = 0);
    neighbors[i].forEach(({ idx: n, weight }) => {
      if (visited[n]) conflictByDir[direction[n]] += weight;
    });
    let best = 'E', bestWeight = Infinity;
    DIRECTIONS.forEach(d => {
      if (conflictByDir[d] < bestWeight) {
        bestWeight = conflictByDir[d];
        best = d;
      }
    });
    direction[i] = best;
    visited[i] = true;
  }

  return direction;
}

map.on('load', async () => {
  const res = await fetch('data.json');
  const geojson = await res.json();

  const countEl = document.getElementById('entryCount');
  if (countEl) countEl.textContent = geojson.features.length;

  const labelDirections = computeLabelDirections(geojson.features);

  // Manual overrides — force a specific pizzeria's label to a side,
  // regardless of what the automatic algorithm picked. Add entries here
  // as you spot individual labels that look wrong: "Exact Pizzeria Name": "E" or "W"
  const LABEL_SIDE_OVERRIDES = {
    "Frankie's of Bay Ridge": "W",
    "Prince Street Pizza": "W",
    "Don Antonio": "W",
    "Lucia Pizza of SoHo": "W",
    "Brooklyn Firefly": "E",
    "DaVinci Pizzeria": "W",
    "J&V Pizzeria": "E",
    "Mano's Pizzeria": "W",
    "APizza – Dyker Heights": "W",
    "Joe & Pat's NYC": "E",
    "Pizza Loves Sauce": "E",
    "Mancini's Wood-Fired Pizza": "E",
    "Espresso Pizzeria": "E",
    "Fermento Pizza NYC": "W",
    "Impasto": "W",
    "Pop's Pizza of East Village": "E",
    "SIMÒ Pizza – Midtown": "E",
    "See No Evil Pizza": "E",
    "NY Pizza Suprema": "W",
    "The Original Little Italy": "E",
    "Piz-zetta Pizzeria": "E",
    "Numero 28 Pizzeria – Park Slope": "E",
  };
  const labels = [];
  let activePopup = null;  // track the currently open popup

  // ===== Reusable pizzeria popup builder (used by pin clicks, ?pin= URL, and landmark popups) =====
  function showPizzeriaPopup(match) {
    const [lng, lat] = match.geometry.coordinates;
    const p = match.properties;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

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

    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15.5), duration: 900 });
    setTimeout(() => {
      if (activePopup) activePopup.remove();
      activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '290px', offset: [20, -22] })
        .setLngLat([lng, lat])
        .setHTML(html)
        .addTo(map);
      activePopup.on('close', () => { activePopup = null; });
    }, 950);
  }

  // Expose for landmark popups (and inline onclick handlers) to call without a page reload
  window.flyToPizzeria = function(name) {
    const match = geojson.features.find(f => f.properties.name === name);
    if (match) showPizzeriaPopup(match);
  };

  geojson.features.forEach((feature, idx) => {
    const [lng, lat] = feature.geometry.coordinates;
    const p   = feature.properties;
    const col = BOROUGH_COLORS[p.borough] || '#DC2225';
    const dir = LABEL_SIDE_OVERRIDES[p.name] || labelDirections[idx];

    // Wrapper: zero-size anchor point — pin and label are both
    // absolutely positioned relative to it (see .dir-* CSS classes)
    const wrap = document.createElement('div');
    wrap.className = 'pizza-marker-wrap';

    const pin = document.createElement('div');
    pin.className = 'pizza-pin';
    pin.innerHTML = sliceSVG(col);

    const label = document.createElement('div');
    label.className = 'pin-label dir-' + dir.toLowerCase();
    label.style.opacity = labelsVisible() ? '1' : '0';
    label.innerHTML = `<span class="pin-label-bar" style="background:${col}"></span><span class="pin-label-text">${escapeHTML(mapLabel(p.name))}</span>`;
    labels.push(label);

    wrap.appendChild(pin);
    wrap.appendChild(label);


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

    new maplibregl.Marker({ element: wrap, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);
  });

  // ===== Landmark star markers =====
  const landmarkLabels = [];
  LANDMARKS.forEach(lm => {
    const wrap = document.createElement('div');
    wrap.className = 'landmark-marker-wrap';

    const pin = document.createElement('div');
    pin.className = 'landmark-pin' + (lm.large ? ' landmark-pin-large' : '');
    pin.innerHTML = lm.icon === 'baseball' ? landmarkBaseballSVG(lm.badgeColor || '#241A10')
                   : lm.icon === 'basketball' ? landmarkBasketballSVG()
                   : lm.icon === 'cruise' ? landmarkCruiseSVG()
                   : lm.icon === 'statue' ? landmarkStatueSVG()
                   : landmarkStarSVG();

    const label = document.createElement('div');
    label.className = 'landmark-label';
    label.textContent = lm.name;
    label.style.opacity = landmarksVisible() ? '1' : '0';
    landmarkLabels.push(label);

    wrap.appendChild(pin);
    wrap.appendChild(label);

    wrap.addEventListener('click', (e) => {
      e.stopPropagation();

      // Center on the landmark — never zoom OUT below the current zoom,
      // only zoom in if currently zoomed out further than 15.5
      const targetZoom = Math.max(map.getZoom(), 15.5);
      map.flyTo({ center: [lm.lng, lm.lat], zoom: targetZoom, duration: 900 });

      // Find nearest pizzerias to this landmark
      const nearby = geojson.features
        .map(f => ({
          ...f.properties,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          d: stationDist(lm.lat, lm.lng, f.geometry.coordinates[1], f.geometry.coordinates[0])
        }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 4);

      const nearbyHTML = nearby.map(p => {
        const mins = walkMinutes(p.d);
        const onclickJS = `window.flyToPizzeria(${JSON.stringify(p.name)})`.replace(/"/g, '&quot;');
        return `<div class="landmark-nearby-row" onclick="${onclickJS}">
          <span class="landmark-nearby-name">${escapeHTML(p.name)}</span>
          <span class="landmark-nearby-walk">🚶 ${mins} walk</span>
        </div>`;
      }).join('');

      const html = `
        <div class="ticket">
          <div class="ticket-head" style="background:#241A10;">
            <p class="ticket-name">${escapeHTML(lm.name)}</p>
          </div>
          <div class="ticket-body">
            <div class="ticket-subway">
              <div class="ticket-subway-label">🍕 Nearest pizza</div>
              ${nearbyHTML}
            </div>
          </div>
        </div>`;

      setTimeout(() => {
        if (activePopup) activePopup.remove();
        activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '270px', offset: [20, -22] })
          .setLngLat([lm.lng, lm.lat])
          .setHTML(html)
          .addTo(map);
        activePopup.on('close', () => { activePopup = null; });
      }, 400);
    });

    new maplibregl.Marker({ element: wrap, anchor: 'left' })
      .setLngLat([lm.lng, lm.lat])
      .addTo(map);
  });

  // Show/hide labels based on zoom
  function updateLabels() {
    const show = labelsVisible();
    labels.forEach(l => l.style.opacity = show ? '1' : '0');
    const showLandmarks = landmarksVisible();
    landmarkLabels.forEach(l => l.style.opacity = showLandmarks ? '1' : '0');
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
      showPizzeriaPopup(match);
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

// ===== Legend neighborhood picker =====
const legend = document.getElementById('legend');
const neighborhoodPanel = document.getElementById('neighborhoodPanel');
const neighborhoodPanelTitle = document.getElementById('neighborhoodPanelTitle');
const neighborhoodChips = document.getElementById('neighborhoodChips');
let activeBoroughBtn = null;

if (legend && typeof NEIGHBORHOODS !== 'undefined') {
  legend.addEventListener('click', (e) => {
    const btn = e.target.closest('.legend-item');
    if (!btn) return;
    const borough = btn.dataset.borough;

    // Toggle off if clicking the already-active borough
    if (activeBoroughBtn === btn) {
      neighborhoodPanel.hidden = true;
      btn.classList.remove('active');
      activeBoroughBtn = null;
      return;
    }

    if (activeBoroughBtn) activeBoroughBtn.classList.remove('active');
    btn.classList.add('active');
    activeBoroughBtn = btn;

    neighborhoodPanelTitle.textContent = `${borough} neighborhoods`;
    neighborhoodChips.innerHTML = '';
    (NEIGHBORHOODS[borough] || []).forEach(n => {
      const chip = document.createElement('button');
      chip.className = 'neighborhood-chip';
      chip.textContent = n.name;
      chip.addEventListener('click', () => {
        map.flyTo({ center: [n.lng, n.lat], zoom: 14.5, duration: 900 });
        neighborhoodPanel.hidden = true;
        btn.classList.remove('active');
        activeBoroughBtn = null;
      });
      neighborhoodChips.appendChild(chip);
    });
    neighborhoodPanel.hidden = false;
  });

  // Close the panel when clicking anywhere outside it or the legend
  document.addEventListener('click', (e) => {
    if (neighborhoodPanel.hidden) return;
    if (neighborhoodPanel.contains(e.target) || legend.contains(e.target)) return;
    neighborhoodPanel.hidden = true;
    if (activeBoroughBtn) activeBoroughBtn.classList.remove('active');
    activeBoroughBtn = null;
  });
}
