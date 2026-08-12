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

// Populated once data.json loads (see map.on('load') below) — lets code
// outside that closure (like the search feature) access pizzeria data.
window.pizzaGeojsonFeatures = [];

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
    <path class="slice-fill" d="M27 31 Q50 24 73 31 Q68 37 50 70 Q32 37 27 31 Z" fill="white"/>
    <circle cx="41" cy="38" r="3.6" fill="${color}"/>
    <circle cx="50" cy="50" r="3.6" fill="${color}"/>
  </svg>`;
}

// ===== Landmark badge color =====
// Muted charcoal/gray — reads as a location marker without competing
// visually with the pizza markers, which should own the map.
const LANDMARK_BADGE_COLOR = '#7a7a7a';

// ===== Landmark star icon (dark circle badge, white star) =====
function landmarkStarSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="${LANDMARK_BADGE_COLOR}" stroke="white" stroke-width="3.5"/>
    <path class="star-fill" d="M50 22 L58 40 L78 42 L63 55 L67 75 L50 64 L33 75 L37 55 L22 42 L42 40 Z" fill="white"/>
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
    <circle cx="50" cy="46" r="42" fill="${LANDMARK_BADGE_COLOR}" stroke="white" stroke-width="3.5"/>
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
    <circle cx="50" cy="46" r="42" fill="${LANDMARK_BADGE_COLOR}" stroke="white" stroke-width="3.5"/>
    <path d="M27 56 Q30 66 40 66 L60 66 Q70 66 73 56 L64 40 L36 40 Z" fill="white"/>
    <rect x="45" y="24" width="10" height="16" rx="1.5" fill="white"/>
    <line x1="27" y1="56" x2="73" y2="56" stroke="#241A10" stroke-width="2"/>
  </svg>`;
}

// ===== Landmark Statue of Liberty icon (dark circle badge, white silhouette) =====
function landmarkStatueSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 100 100">
    <circle cx="50" cy="46" r="42" fill="${LANDMARK_BADGE_COLOR}" stroke="white" stroke-width="3.5"/>
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
  { name: "Lincoln Center",          lat: 40.7725, lng: -73.9835 },
  { name: "Prospect Park",           lat: 40.6618, lng: -73.9711 },
  { name: "Yankee Stadium",          lat: 40.8296, lng: -73.9262, icon: 'baseball', badgeColor: '#0C2340', large: true },
  { name: "Citi Field",              lat: 40.7571, lng: -73.8458, icon: 'baseball', badgeColor: '#4169E1', large: true },
  { name: "Coney Island",            lat: 40.5755, lng: -73.9707 },
  { name: "Circle Line Sightseeing", lat: 40.76280655144898, lng: -74.00154982881688, icon: 'cruise' },
  { name: "Staten Island Ferry – Whitehall Terminal", lat: 40.701409, lng: -74.013131, icon: 'cruise' },
  { name: "Staten Island Ferry – St. George Terminal", lat: 40.643330, lng: -74.074170, icon: 'cruise' },
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

// Landmark names are intentionally NOT shown as permanent map labels —
// only the small badge icon is always visible; the name reveals on
// hover (desktop) or tap/click (via the popup), so pizza labels are
// the only text that visually competes for attention on the map.

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
  window.pizzaGeojsonFeatures = geojson.features;

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
    "Briciola Pizza Bar": "E",
    "Juliana's": "N",
  };
  const labels = [];
  let activePopup = null;  // track the currently open popup
  let pizzaMarkerEls = {};       // name -> marker wrapper element, rebuilt on every render
  let selectedPizzeriaName = null;

  // Apply the "selected" highlight to a pizzeria's marker (yellow slice +
  // slightly larger), removing it from whichever marker had it before.
  // No animation flourish beyond the CSS transition already on the pin —
  // the color + size change alone is enough to connect the card to its
  // marker without adding a glow, pulse, or motion effect.
  function setSelectedPizzeria(name) {
    if (selectedPizzeriaName && pizzaMarkerEls[selectedPizzeriaName]) {
      pizzaMarkerEls[selectedPizzeriaName].classList.remove('selected');
    }
    selectedPizzeriaName = name;
    const el = name && pizzaMarkerEls[name];
    if (el) el.classList.add('selected');
  }

  function clearSelectedPizzeria() {
    if (selectedPizzeriaName && pizzaMarkerEls[selectedPizzeriaName]) {
      pizzaMarkerEls[selectedPizzeriaName].classList.remove('selected');
    }
    selectedPizzeriaName = null;
  }
  window.clearSelectedPizzeria = clearSelectedPizzeria;

  // Same idea for landmarks — gray badge stays, star turns blue while its
  // popup is open. Only one at a time, cleared when the popup closes.
  let landmarkMarkerEls = {};
  let selectedLandmarkName = null;

  function setSelectedLandmark(name) {
    if (selectedLandmarkName && landmarkMarkerEls[selectedLandmarkName]) {
      landmarkMarkerEls[selectedLandmarkName].classList.remove('selected');
    }
    selectedLandmarkName = name;
    const el = name && landmarkMarkerEls[name];
    if (el) el.classList.add('selected');
  }

  function clearSelectedLandmark() {
    if (selectedLandmarkName && landmarkMarkerEls[selectedLandmarkName]) {
      landmarkMarkerEls[selectedLandmarkName].classList.remove('selected');
    }
    selectedLandmarkName = null;
  }

  // ===== Smart popup placement =====
  // A fixed diagonal offset used to regularly let the card cover the
  // marker, or spill off the edge of the screen. Instead: measure the
  // popup's real rendered size first, then try candidate placements in
  // priority order — beside the marker (whichever side has more room),
  // then above, then below, then the opposite side — each checked against
  // the marker's actual pixel position with a small protected gap so the
  // card never sits directly on top of the marker. Only as a last resort
  // (and never on mobile, where there's no space to spare) do we nudge the
  // map to make room.
  function openSmartPopup(lng, lat, html, maxWidth, forLandmarkName) {
    if (activePopup) { activePopup.remove(); activePopup = null; }

    const container = map.getContainer();
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const isMobile = window.innerWidth <= 900;

    // Measure real rendered height off-screen at the same width the
    // popup will actually use, so the fit-check below is accurate.
    const measurer = document.createElement('div');
    measurer.className = 'maplibregl-popup-content';
    measurer.style.cssText = `position:absolute; visibility:hidden; left:-9999px; top:-9999px; width:${maxWidth}px;`;
    measurer.innerHTML = html;
    document.body.appendChild(measurer);
    const popupHeight = measurer.offsetHeight;
    document.body.removeChild(measurer);
    const popupWidth = maxWidth;

    const pt = map.project([lng, lat]);
    const gap = 14;        // protected zone between marker and card
    const margin = 8;      // minimum distance from the map edge
    const markerHalf = 18; // approx marker footprint to clear

    const preferRight = pt.x < cw / 2;
    const nearSide = preferRight
      ? { anchor: 'left',  x: pt.x + markerHalf + gap }
      : { anchor: 'right', x: pt.x - markerHalf - gap - popupWidth };
    const farSide = preferRight
      ? { anchor: 'right', x: pt.x - markerHalf - gap - popupWidth }
      : { anchor: 'left',  x: pt.x + markerHalf + gap };

    const candidates = [
      { anchor: nearSide.anchor, x: nearSide.x, y: pt.y - popupHeight / 2 },       // beside (preferred side)
      { anchor: 'bottom', x: pt.x - popupWidth / 2, y: pt.y - markerHalf - gap - popupHeight }, // above
      { anchor: 'top',    x: pt.x - popupWidth / 2, y: pt.y + markerHalf + gap },  // below
      { anchor: farSide.anchor, x: farSide.x, y: pt.y - popupHeight / 2 },         // opposite side
    ];

    const fits = c => c.x >= margin && c.y >= margin &&
      c.x + popupWidth <= cw - margin && c.y + popupHeight <= ch - margin;

    let chosen = candidates.find(fits);

    if (!chosen && !isMobile) {
      // Nudge the map just enough to make the first-choice (beside) placement fit.
      const best = candidates[0];
      const dx = best.x < margin ? best.x - margin : Math.max(0, (best.x + popupWidth) - (cw - margin));
      const dy = best.y < margin ? best.y - margin : Math.max(0, (best.y + popupHeight) - (ch - margin));
      if (dx || dy) map.panBy([dx, dy], { duration: 300 });
      chosen = best;
    }

    activePopup = new maplibregl.Popup({
      closeButton: true,
      maxWidth: maxWidth + 'px',
      // Falling back to no explicit anchor (mobile, nothing fit) lets
      // MapLibre's own edge-clamping keep the card fully on-screen —
      // imperfect relative to the marker, but never cut off.
      anchor: chosen ? chosen.anchor : undefined,
      offset: 16,
    })
      .setLngLat([lng, lat])
      .setHTML(html)
      .addTo(map);
    activePopup.on('close', () => {
      activePopup = null;
      // Only clear if this closing popup's landmark is still the current
      // selection — if the user already clicked a different landmark,
      // that landmark was set as selected before this old popup's removal
      // even fires, and this closure would otherwise wipe it right back out.
      if (forLandmarkName && selectedLandmarkName === forLandmarkName) {
        clearSelectedLandmark();
      }
    });

    // Keep the name on one line: shrink its font size step by step rather
    // than truncating, so the full name stays readable.
    requestAnimationFrame(() => {
      const el = activePopup && activePopup.getElement && activePopup.getElement();
      fitNameToOneLine(el && el.querySelector('.ticket-name'));
    });

    return activePopup;
  }

  // ===== Shared pizzeria card HTML (bottom sheet detail view, used by
  // marker clicks, list selections, search results, ?pin= URL, and
  // landmark "nearest pizza" rows) =====
  function buildPizzeriaCardHTML(p, lng, lat) {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    let fromYouHTML = '';
    const userLoc = window.userActualLocation;
    if (userLoc) {
      const d = stationDist(userLoc.lat, userLoc.lng, lat, lng);
      const miles = (d / 1609.34).toFixed(1);
      fromYouHTML = `<div class="ticket-from-you">🚶 <span class="ticket-from-you-label">From You</span> — <span class="ticket-from-you-time">${walkMinutes(d)} · ${miles} mi</span></div>`;
    }

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

    // A handful of the closest other pizzerias, so the detail view isn't
    // a dead end — tapping one swaps the card directly to it, same as
    // tapping a different marker on the map would.
    const nearbyPizzas = geojson.features
      .filter(f => f.properties.name !== p.name)
      .map(f => ({
        name: f.properties.name,
        borough: f.properties.borough,
        d: stationDist(lat, lng, f.geometry.coordinates[1], f.geometry.coordinates[0]),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
    const nearbyHTML = nearbyPizzas.length ? `
      <div class="ticket-nearby">
        <div class="ticket-nearby-label">🍕 Other Pizza Nearby...</div>
        ${nearbyPizzas.map(n => `<div class="ticket-nearby-item" data-name="${escapeAttr(n.name)}">
          <span class="ticket-nearby-name">${escapeHTML(n.name)}</span>
          <span class="ticket-nearby-meta">${walkMinutes(n.d)} walk</span>
        </div>`).join('')}
      </div>` : '';

    return `
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
          ${fromYouHTML}
          ${subwayHTML ? `<div class="ticket-subway">
            <div class="ticket-subway-label">🚇 Nearest subway</div>
            ${subwayHTML}
          </div>` : ''}
          <div class="ticket-links">
            ${p.website ? `<a href="${escapeAttr(p.website)}" target="_blank" rel="noopener">Website</a>` : ''}
            <a href="${escapeAttr(directionsUrl)}" target="_blank" rel="noopener">Directions</a>
          </div>
        </div>
      </div>${nearbyHTML}`;
  }

  // ===== Selecting a pizzeria now shows its card in the bottom sheet
  // (replacing the old floating popup entirely) =====
  // Why: a floating card could land anywhere depending on where the marker
  // sat on screen, sometimes covering the marker itself or spilling off
  // the edge. The bottom sheet is a single, predictable place for it —
  // enough room for the full card, and the selected marker stays visible
  // on the map above it.
  function showPizzeriaInSheet(match) {
    const [lng, lat] = match.geometry.coordinates;
    const p = match.properties;
    const html = buildPizzeriaCardHTML(p, lng, lat);

    ensureListBacking();
    enterDetailMode(html);
    setSelectedPizzeria(p.name);

    // Center the marker in the space that's actually free of the sheet —
    // above it on mobile (bottom sheet), to the right of it on desktop
    // (left sidebar). Measuring scrollHeight instead of the panel's own
    // animating box height avoids grabbing a mid-transition value, since
    // scrollHeight reflects the content's real size immediately,
    // regardless of the CSS expand animation still playing.
    const isMobile = window.innerWidth <= 900;
    let offset = [0, 0];
    if (isMobile) {
      const header = document.querySelector('.near-me-panel-header');
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const contentH = Math.min(nearMePanelDetail ? nearMePanelDetail.scrollHeight : 0, window.innerHeight * 0.36);
      offset = [0, -((headerH + contentH) / 2)];
    } else {
      offset = [150, 0]; // desktop sidebar is a fixed 300px wide when open
    }

    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 15.5),
      duration: 700,
      offset,
    });
  }

  // Expose for landmark popups (and inline onclick handlers) to call without a page reload
  window.flyToPizzeria = function(name) {
    const match = geojson.features.find(f => f.properties.name === name);
    if (match) showPizzeriaInSheet(match);
  };

  // Shared results panel — powers three modes:
  //   'nearme'  — anchored to the user's real location, stays fixed as they pan
  //   'search'  — anchored to a destination picked from global search
  //   'area'    — anchored to nothing; shows whatever's in the current map bounds
  // Exposed globally since the Near Me button / search handlers live
  // outside this load callback but need access to geojson via this closure.
  window.buildResultsPanel = function(opts) {
    const panel = document.getElementById('nearMePanel');
    const list = document.getElementById('nearMePanelList');
    const title = document.getElementById('nearMePanelTitle');
    if (!panel || !list || !title) return;

    // Rebuilding the list means we're leaving any pizzeria detail view —
    // without this, list.hidden could still be true from a prior
    // selection, so the freshly-built list would render but stay
    // invisible behind the (now-cleared) detail view.
    exitDetailMode();

    let results = [], heading = '🍕 Where are we getting pizza?';

    try {
      if (opts.mode === 'area') {
        // Bounds-based: whatever pizzerias are actually visible right now
        const bounds = map.getBounds();
        const userLoc = window.userActualLocation;
        results = geojson.features
          .filter(f => bounds.contains(f.geometry.coordinates))
          .map(f => ({
            ...f.properties,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            d: userLoc ? stationDist(userLoc.lat, userLoc.lng, f.geometry.coordinates[1], f.geometry.coordinates[0]) : null,
          }))
          .sort((a, b) => {
            if (a.d !== null && b.d !== null) return a.d - b.d;
            const c = map.getCenter();
            return stationDist(c.lat, c.lng, a.lat, a.lng) - stationDist(c.lat, c.lng, b.lat, b.lng);
          })
          .slice(0, 20);
        heading = results.length === 0
          ? `🍕 ${zeroResultMessage()}`
          : `🍕 ${results.length} ${pizzaWord(results.length)} in This Area`;
        // Even in area mode, keep an anchor (the center of the area that
        // was just searched) so panning further away can still trigger
        // the button again — without this, it would never reappear.
        const center = map.getCenter();
        window.panelAnchor = { lat: center.lat, lng: center.lng };
        window.panelAnchorZoom = map.getZoom();
      } else {
        // 'nearme' or 'search' — distance-sorted from a fixed anchor point
        const { lat, lng } = opts;
        results = geojson.features
          .map(f => ({
            ...f.properties,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            d: stationDist(lat, lng, f.geometry.coordinates[1], f.geometry.coordinates[0]),
          }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 12);

        if (results.length === 0) {
          heading = `🍕 ${zeroResultMessage()}`;
        } else if (opts.mode === 'nearme') {
          heading = `🍕 ${results.length} ${pizzaWord(results.length)} Near You`;
        } else {
          heading = opts.isNeighborhood
            ? `🍕 ${results.length} ${pizzaWord(results.length)} in ${opts.label}`
            : `🍕 ${results.length} ${pizzaWord(results.length)} Near ${opts.label}`;
        }
        window.panelAnchor = { lat, lng };
        window.panelAnchorZoom = map.getZoom();
      }
    } catch (err) {
      // Whatever went wrong, don't leave the header/list frozen on stale
      // text with no visible sign anything failed — log it so it's
      // actually diagnosable, and fall back to a a plain heading.
      console.error('buildResultsPanel failed:', err);
      heading = '🍕 Pizzerias Near You';
      results = [];
    }

    title.textContent = heading;
    // Cached so detail mode can show "← Back to N Pizzerias" and so
    // backing out of detail mode restores the exact right-hand text,
    // rather than either mode having to guess at the other's phrasing.
    window.lastListHeading = heading;
    window.lastListResultCount = results.length;

    list.innerHTML = results.length
      ? results.map(p => {
          const metaText = p.d !== null
            ? `${walkMinutes(p.d)} walk · ${(p.d / 1609.34).toFixed(1)} mi`
            : p.borough;
          return `<div class="near-me-item" data-name="${escapeAttr(p.name)}">
            <span class="near-me-item-name">${escapeHTML(p.name)}</span>
            <span class="near-me-item-meta">${metaText}</span>
          </div>`;
        }).join('')
      : `<p class="near-me-empty-hint">Try zooming out, panning somewhere else, or searching a different spot.</p>`;

    panel.hidden = false;
    setNearMePanelCollapsed(!!opts.collapsed);
    hideSearchThisAreaBtn();
  };

  // Kept as an alias since other code still calls this name
  window.buildNearMePanel = function(userLat, userLng) {
    window.buildResultsPanel({ lat: userLat, lng: userLng, mode: 'nearme' });
  };

  // If location was already granted on a previous visit, locate and show
  // nearby pizzerias automatically — this check never triggers a new
  // permission prompt itself. Deliberately placed here (inside the map's
  // 'load' callback, after buildResultsPanel exists) rather than at the
  // top level: geolocation can resolve near-instantly when a cached
  // position is available (see maximumAge below), which was winning the
  // race against the map still loading — the marker/flyTo would work
  // since those don't depend on this closure, but window.buildResultsPanel
  // didn't exist yet, so the list-building call silently no-op'd and the
  // panel stayed stuck on the idle "Where are we getting pizza?" message.
  if (navigator.permissions && navigator.geolocation) {
    navigator.permissions.query({ name: 'geolocation' }).then(status => {
      if (status.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (pos) => activateNearMeOnMap(pos.coords.latitude, pos.coords.longitude, { showList: true, collapsed: true }),
          () => {},
          { timeout: 8000, maximumAge: 60000 }
        );
      }
    }).catch(() => {});
  }

  // All pizza markers use one consistent brand red — geography (the map itself)
  // already communicates which borough a spot is in, so per-borough marker
  // colors weren't adding useful information, just visual clutter.
  const PIZZA_MARKER_COLOR = '#DC2225';

  // ===== Marker clustering =====
  // Set to false to instantly disable clustering and always show individual
  // markers (exactly today's behavior) — no other changes needed.
  const CLUSTERING_ENABLED = true;
  // Clustering only applies below this zoom (city/borough-wide views).
  // At this zoom and above — matching "neighborhood level," where Near Me
  // typically lands — individual markers always show, never clustered.
  const CLUSTER_ZOOM_THRESHOLD = 13;

  function createPizzaMarker(feature, idx) {
    const [lng, lat] = feature.geometry.coordinates;
    const p   = feature.properties;
    const col = PIZZA_MARKER_COLOR;
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
    pizzaMarkerEls[p.name] = wrap;

    wrap.addEventListener('click', e => {
      e.stopPropagation();
      showPizzeriaInSheet(feature);
    });

    return new maplibregl.Marker({ element: wrap, anchor: 'center' }).setLngLat([lng, lat]);
  }

  function createClusterMarker(cluster) {
    const el = document.createElement('div');
    el.className = 'cluster-marker';
    el.textContent = cluster.count;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      map.flyTo({
        center: [cluster.lng, cluster.lat],
        zoom: Math.min(map.getZoom() + 2.5, CLUSTER_ZOOM_THRESHOLD + 0.5),
        duration: 600
      });
    });
    return new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([cluster.lng, cluster.lat]);
  }

  // Groups pizzerias by on-screen pixel proximity at the current zoom/pan —
  // so clustering reflects actual visual overlap, not a fixed real-world distance.
  function computeClusters() {
    const CELL_SIZE = 60; // pixels
    const cells = {};

    geojson.features.forEach((feature, idx) => {
      const [lng, lat] = feature.geometry.coordinates;
      let point;
      try {
        point = map.project([lng, lat]);
      } catch (e) {
        return; // skip if projection fails for any reason
      }
      const gx = Math.floor(point.x / CELL_SIZE);
      const gy = Math.floor(point.y / CELL_SIZE);
      const key = gx + ',' + gy;
      if (!cells[key]) cells[key] = [];
      cells[key].push({ feature, idx });
    });

    const clusters = [];
    const singles = [];
    Object.values(cells).forEach(group => {
      if (group.length === 1) {
        singles.push(group[0]);
      } else {
        let sumLng = 0, sumLat = 0;
        group.forEach(g => {
          sumLng += g.feature.geometry.coordinates[0];
          sumLat += g.feature.geometry.coordinates[1];
        });
        clusters.push({ lng: sumLng / group.length, lat: sumLat / group.length, count: group.length });
      }
    });

    return { clusters, singles };
  }

  let pizzaMarkersOnMap = [];
  let clusteringCurrentlyActive = false;

  function renderPizzaMarkers() {
    pizzaMarkersOnMap.forEach(m => m.remove());
    pizzaMarkersOnMap = [];
    labels.length = 0;
    pizzaMarkerEls = {};

    const zoom = map.getZoom();
    const shouldCluster = CLUSTERING_ENABLED && zoom < CLUSTER_ZOOM_THRESHOLD;
    clusteringCurrentlyActive = shouldCluster;

    if (!shouldCluster) {
      geojson.features.forEach((feature, idx) => {
        const marker = createPizzaMarker(feature, idx);
        marker.addTo(map);
        marker.getElement().style.zIndex = '5'; // always above landmark markers (z-index 1)
        pizzaMarkersOnMap.push(marker);
      });
    } else {
      const { clusters, singles } = computeClusters();
      clusters.forEach(c => {
        const marker = createClusterMarker(c);
        marker.addTo(map);
        marker.getElement().style.zIndex = '5';
        pizzaMarkersOnMap.push(marker);
      });
      singles.forEach(s => {
        const marker = createPizzaMarker(s.feature, s.idx);
        marker.addTo(map);
        marker.getElement().style.zIndex = '5';
        pizzaMarkersOnMap.push(marker);
      });
    }

    // Markers were just rebuilt from scratch — if a pizzeria is currently
    // selected, its old marker element is gone, so re-apply the highlight
    // to the new one rather than losing it.
    if (selectedPizzeriaName) setSelectedPizzeria(selectedPizzeriaName);
  }

  renderPizzaMarkers();

  // Re-render only when clustering mode actually flips (not on every zoom
  // tick) — avoids needlessly rebuilding 200+ markers during normal zooming
  // within individual-marker range, which already works fine as-is.
  let clusterRenderTimer = null;
  map.on('zoomend', () => {
    const zoom = map.getZoom();
    const shouldCluster = CLUSTERING_ENABLED && zoom < CLUSTER_ZOOM_THRESHOLD;
    if (shouldCluster !== clusteringCurrentlyActive) {
      clearTimeout(clusterRenderTimer);
      clusterRenderTimer = setTimeout(renderPizzaMarkers, 120);
    }
  });

  // While clustered, panning changes which markers visually overlap —
  // recompute cluster groupings (debounced) so they stay accurate.
  map.on('moveend', () => {
    if (clusteringCurrentlyActive) {
      clearTimeout(clusterRenderTimer);
      clusterRenderTimer = setTimeout(renderPizzaMarkers, 150);
    }
  });

  // ===== Landmark star markers =====
  LANDMARKS.forEach(lm => {
    const wrap = document.createElement('div');
    wrap.className = 'landmark-marker-wrap';

    const pin = document.createElement('div');
    pin.className = 'landmark-pin' + (lm.large ? ' landmark-pin-large' : '');
    pin.innerHTML = lm.icon === 'baseball' ? landmarkBaseballSVG(lm.badgeColor || LANDMARK_BADGE_COLOR)
                   : lm.icon === 'basketball' ? landmarkBasketballSVG()
                   : lm.icon === 'cruise' ? landmarkCruiseSVG()
                   : lm.icon === 'statue' ? landmarkStatueSVG()
                   : landmarkStarSVG();

    const label = document.createElement('div');
    label.className = 'landmark-label';
    label.textContent = lm.name;
    // No initial opacity set here — CSS keeps it at 0 by default and
    // reveals it only on hover; tap/click instead opens the popup below.

    wrap.appendChild(pin);
    wrap.appendChild(label);
    landmarkMarkerEls[lm.name] = wrap;

    wrap.addEventListener('click', (e) => {
      e.stopPropagation();
      setSelectedLandmark(lm.name);

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
          <div class="ticket-head" style="background:${LANDMARK_BADGE_COLOR};">
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
        openSmartPopup(lm.lng, lm.lat, html, 270, lm.name);
      }, 400);
    });

    const landmarkMarker = new maplibregl.Marker({ element: wrap, anchor: 'left' })
      .setLngLat([lm.lng, lm.lat])
      .addTo(map);
    // MapLibre gives each marker its own stacking context (via its transform),
    // so CSS z-index on inner elements alone won't control ordering between
    // markers reliably — set it directly on the marker's own root element.
    // This keeps landmarks behind pizza markers/clusters at all times, even
    // after clustering toggles re-adds pizza markers later in the DOM.
    landmarkMarker.getElement().style.zIndex = '1';
  });

  // Show/hide pizza labels based on zoom (landmark labels are hover/click-only, not zoom-based)
  function updateLabels() {
    const show = labelsVisible();
    labels.forEach(l => l.style.opacity = show ? '1' : '0');
  }
  map.on('zoomend', updateLabels);

  // ===== ?pin= URL parameter (pizzeria) =====
  const params = new URLSearchParams(window.location.search);
  const pinName = params.get('pin');
  if (pinName) {
    const match = geojson.features.find(
      f => f.properties.name.toLowerCase() === pinName.toLowerCase()
    );
    if (match) {
      showPizzeriaInSheet(match);
    }
  }

  // ===== ?lat=&lng=&label= URL params (destination — from search on another page) =====
  const destLat = params.get('lat');
  const destLng = params.get('lng');
  const destLabel = params.get('label');
  if (destLat && destLng) {
    const latNum = parseFloat(destLat), lngNum = parseFloat(destLng);
    map.flyTo({ center: [lngNum, latNum], zoom: 14.5, duration: 900 });
    if (window.buildResultsPanel) {
      window.buildResultsPanel({
        lat: latNum, lng: lngNum, mode: 'search',
        label: destLabel || 'This Spot', isNeighborhood: params.get('isNeighborhood') === '1',
      });
    }
  }
});

// ===== Near Me button =====
let userMarker = null;

function activateNearMeOnMap(latitude, longitude, opts) {
  opts = opts || {};

  // Drop a "you are here" marker
  if (userMarker) userMarker.remove();
  const el = document.createElement('div');
  el.className = 'user-location-dot';
  userMarker = new maplibregl.Marker({ element: el })
    .setLngLat([longitude, latitude])
    .addTo(map);

  // Fly to user location at zoom 14
  map.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1000 });

  // Persists even after later searches, so "Search This Area" can still
  // show real walk-time-from-user if that's still meaningful
  window.userActualLocation = { lat: latitude, lng: longitude };

  // Both the manual location button and the one-time auto-locate on a
  // returning visit build the nearby list — opts.collapsed controls
  // whether it lands expanded (manual click — high intent, show results
  // immediately) or peeked (auto-locate on load — a quieter, ambient
  // update rather than something the user explicitly asked for).
  if (opts.showList && window.buildResultsPanel) {
    window.buildResultsPanel({ lat: latitude, lng: longitude, mode: 'nearme', collapsed: !!opts.collapsed });
  }
}

const nearMeBtn = document.getElementById('nearMeBtn');
if (nearMeBtn) {
  nearMeBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    nearMeBtn.classList.add('locating');
    nearMeBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          activateNearMeOnMap(pos.coords.latitude, pos.coords.longitude, { showList: true, collapsed: true });
        } catch (err) {
          console.error('activateNearMeOnMap failed:', err);
        } finally {
          // Always re-enable, even if something above threw — otherwise
          // an unhandled error here permanently disables the button, and
          // every future click silently does nothing at all.
          nearMeBtn.classList.remove('locating');
          nearMeBtn.disabled = false;
        }
      },
      (err) => {
        nearMeBtn.classList.remove('locating');
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

// Toggle the near-me panel — collapses the list content on mobile,
// shrinks to the header-only strip on desktop (see CSS media query)
const nearMePanelHeader = document.getElementById('nearMePanelHeader');
const nearMePanelLeftZone = document.getElementById('nearMePanelLeftZone');
const nearMePanelRightZone = document.getElementById('nearMePanelRightZone');
const nearMePanelArrow = document.getElementById('nearMePanelArrow');
const nearMeReopenTab = document.getElementById('nearMeReopenTab');

function pizzaWord(n) {
  return n === 1 ? 'Pizzeria' : 'Pizzerias';
}

// A little personality instead of a sterile "0 Pizzerias" — picked
// randomly so it doesn't feel exactly the same every time you wander
// into a pizza-free patch of the map.
const ZERO_RESULT_MESSAGES = [
  'No Pizza Here — Keep Exploring',
  'Uh Oh. Pizza Desert.',
  'We Gotta Get You Outta Here 😂',
];
function zeroResultMessage() {
  return ZERO_RESULT_MESSAGES[Math.floor(Math.random() * ZERO_RESULT_MESSAGES.length)];
}

function setNearMePanelCollapsed(collapsed) {
  const panel = document.getElementById('nearMePanel');
  if (!panel) return;
  panel.classList.toggle('collapsed', collapsed);

  // Desktop: shift the Near Me button and sync the floating tab
  const btn = document.getElementById('nearMeBtn');
  if (btn) btn.classList.toggle('sidebar-collapsed', collapsed);

  const tab = document.getElementById('sidebarTab');
  if (tab) {
    const isDesktop = window.innerWidth >= 901;
    tab.hidden = !isDesktop;
    tab.classList.toggle('open', !collapsed);
    tab.textContent = collapsed ? '›' : '‹';
    tab.setAttribute('aria-label', collapsed ? 'Open pizzeria list' : 'Close pizzeria list');
  }
}

function currentPanelMode() {
  const panel = document.getElementById('nearMePanel');
  return panel && panel.dataset.mode === 'detail' ? 'detail' : 'list';
}

// Left zone: "← 🍕 N Pizzerias in This Area" as one big tap target in
// detail mode (goes back to the list); the same zone toggles collapse in
// list mode (previously the whole header did this — now it's just this
// side, since the right side has its own distinct job below).
if (nearMePanelLeftZone) {
  nearMePanelLeftZone.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentPanelMode() === 'detail') {
      exitDetailMode();
    } else {
      const panel = document.getElementById('nearMePanel');
      setNearMePanelCollapsed(!panel.classList.contains('collapsed'));
    }
  });
}

// Right zone: always toggles collapse/expand — ↑ when collapsed, ↓ when
// expanded (rotated on desktop to ← / → since that sidebar rolls in and
// out horizontally instead of vertically). No separate "close" action
// anymore now that the bar is a permanent piece of the map UI rather
// than something that needs a way to fully dismiss.
if (nearMePanelRightZone) {
  nearMePanelRightZone.addEventListener('click', (e) => {
    e.stopPropagation();
    const panel = document.getElementById('nearMePanel');
    setNearMePanelCollapsed(!panel.classList.contains('collapsed'));
  });
}

if (nearMePanelHeader) {
  // Swipe up/down anywhere on the header row to expand/collapse — kept
  // independent of the click zones above, and independent of mode, so
  // dragging always just resizes the sheet regardless of what the tap
  // targets underneath it currently do.
  let touchStartY = null;
  nearMePanelHeader.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  nearMePanelHeader.addEventListener('touchend', (e) => {
    if (touchStartY === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    touchStartY = null;
    if (deltaY > 40) setNearMePanelCollapsed(true);
    else if (deltaY < -40) setNearMePanelCollapsed(false);
  }, { passive: true });
}

if (nearMeReopenTab) {
  nearMeReopenTab.addEventListener('click', () => setNearMePanelCollapsed(false));
}

// ===== Bottom sheet: list ↔ pizzeria-detail state =====
// Selecting a pizzeria (marker tap, list item, search result, ?pin= URL)
// swaps the sheet's body from the list to that pizzeria's card, keeping
// the "N Pizzerias Near You" context in the header as a back target —
// tapping ← or swiping the card down returns to the list. Tapping a
// different marker while a card is showing just swaps the card content;
// no need to go back to the list first.
const nearMePanelDetail = document.getElementById('nearMePanelDetail');
const nearMePanelBack = document.getElementById('nearMePanelBack');

function fitNameToOneLine(el) {
  if (!el) return;
  let size = 1.12;
  let guard = 0;
  while (el.scrollWidth > el.clientWidth && size > 0.85 && guard < 12) {
    size -= 0.03;
    el.style.fontSize = size.toFixed(2) + 'rem';
    guard++;
  }
}

function enterDetailMode(html) {
  const panel = document.getElementById('nearMePanel');
  const list = document.getElementById('nearMePanelList');
  const title = document.getElementById('nearMePanelTitle');
  if (!panel || !list || !nearMePanelDetail) return;
  nearMePanelDetail.innerHTML = html;
  nearMePanelDetail.scrollTop = 0;
  list.hidden = true;
  nearMePanelDetail.hidden = false;
  if (nearMePanelBack) nearMePanelBack.hidden = false;
  panel.hidden = false;
  panel.dataset.mode = 'detail';
  setNearMePanelCollapsed(false); // always show the card, never land collapsed
  if (nearMePanelLeftZone) nearMePanelLeftZone.setAttribute('aria-label', 'Back to pizzeria list');
  // Reuse the list's actual heading rather than a generic "Back to N
  // Pizzerias" — that already has the right mode-specific phrasing
  // ("Near You", "in This Area", "Near Madison Square Garden", "in
  // Williamsburg"...), so just insert "Back to" right after the emoji
  // rather than rebuilding a separate, context-free string.
  if (title) {
    const base = window.lastListHeading || '🍕 Where are we getting pizza?';
    title.textContent = base.startsWith('🍕 ') ? base.replace('🍕 ', '🍕 Back to ') : base;
  }
  requestAnimationFrame(() => fitNameToOneLine(nearMePanelDetail.querySelector('.ticket-name')));
}

function exitDetailMode() {
  const panel = document.getElementById('nearMePanel');
  const list = document.getElementById('nearMePanelList');
  const title = document.getElementById('nearMePanelTitle');
  if (!panel || !list || !nearMePanelDetail) return;
  nearMePanelDetail.hidden = true;
  nearMePanelDetail.innerHTML = '';
  list.hidden = false;
  if (nearMePanelBack) nearMePanelBack.hidden = true;
  panel.dataset.mode = 'list';
  if (nearMePanelLeftZone) nearMePanelLeftZone.setAttribute('aria-label', 'Toggle pizzeria list');
  // Restore whatever the list's real heading was — "Back to N Pizzerias"
  // is detail-mode-only text, not what should stick around once you're
  // actually looking at the list again.
  if (title) title.textContent = window.lastListHeading || '🍕 Where are we getting pizza?';
  if (window.clearSelectedPizzeria) window.clearSelectedPizzeria();
}

// If a pizzeria is selected with no real list backing it yet — either a
// fresh page load still showing the idle prompt, or the panel got fully
// reset somehow — quietly build one from the current map view first, so
// "back" always has somewhere real to return to instead of an empty list.
function ensureListBacking() {
  const panel = document.getElementById('nearMePanel');
  if (panel && (panel.hidden || !window.panelAnchor) && window.buildResultsPanel) {
    window.buildResultsPanel({ mode: 'area' });
  }
}

// ===== Permanent one-line bar =====
// The sheet is no longer something that only appears once results exist —
// it's part of the map UI from the moment the page loads, starting
// collapsed to a single line with a friendly prompt instead of staying
// invisible until a search happens.
function showIdleState() {
  const panel = document.getElementById('nearMePanel');
  const list = document.getElementById('nearMePanelList');
  const title = document.getElementById('nearMePanelTitle');
  if (!panel || !list || !title) return;
  const heading = '🍕 Where are we getting pizza?';
  title.textContent = heading;
  window.lastListHeading = heading;
  window.lastListResultCount = 0;
  list.innerHTML = `<p class="near-me-empty-hint">Tap a pizzeria on the map, search, or use your location to get started.</p>`;
  panel.hidden = false;
  // Desktop starts collapsed so the full map is visible at load —
  // the floating tab invites the user to open it when ready.
  // Mobile starts collapsed to show just the one-line peek bar.
  setNearMePanelCollapsed(true);
}
showIdleState();

// ===== Landing page: smooth scroll to map section =====
const exploreMapBtn = document.getElementById('exploreMapBtn');
if (exploreMapBtn) {
  exploreMapBtn.addEventListener('click', (e) => {
    const target = document.getElementById('map-section');
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ===== Hero mini-map (fallback when pizza-chef-hero.png is missing) =====
// Only initializes on desktop after the main map has loaded its data.
function initHeroMiniMap() {
  const el = document.getElementById('heroMapPreview');
  if (!el || window.innerWidth < 901) return;
  const miniMap = new maplibregl.Map({
    container: 'heroMapPreview',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    center: [-73.98, 40.73],
    zoom: 11,
    interactive: false,
    attributionControl: false,
  });
  miniMap.on('load', () => {
    // Add a few representative markers
    const spots = [
      [-74.0022, 40.7307], [-74.0004, 40.6818], [-73.9916, 40.7638],
      [-73.9571, 40.7081], [-73.9440, 40.6582], [-73.8448, 40.7196],
    ];
    spots.forEach(([lng, lat]) => {
      const el = document.createElement('div');
      el.innerHTML = `<svg viewBox="0 0 100 100" width="18" height="18"><circle cx="50" cy="46" r="42" fill="#DC2225" stroke="white" stroke-width="4"/><path d="M27 31 Q50 24 73 31 Q68 37 50 70 Q32 37 27 31 Z" fill="white"/></svg>`;
      new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(miniMap);
    });
  });
}

map.on('load', () => {
  // Small delay so the hero art onerror has time to fire
  setTimeout(initHeroMiniMap, 500);
});

// ===== Floating sidebar tab (desktop only) =====
// The tab is the sole way to open/close the sidebar on desktop —
// no blank rail, no in-panel toggle button. Only shown on wide screens;
// on mobile the panel is a bottom sheet with its own header controls.
const sidebarTab = document.getElementById('sidebarTab');
if (sidebarTab) {
  const isDesktop = () => window.innerWidth >= 901;

  function syncSidebarTab() {
    if (!sidebarTab) return;
    sidebarTab.hidden = !isDesktop();
    const panel = document.getElementById('nearMePanel');
    const collapsed = !panel || panel.classList.contains('collapsed');
    sidebarTab.classList.toggle('open', !collapsed);
    sidebarTab.textContent = collapsed ? '›' : '‹';
  }

  sidebarTab.addEventListener('click', () => {
    const panel = document.getElementById('nearMePanel');
    if (!panel) return;
    setNearMePanelCollapsed(!panel.classList.contains('collapsed'));
  });

  syncSidebarTab();
  window.addEventListener('resize', syncSidebarTab);
}

if (nearMePanelDetail) {
  // Swipe the card downward (from the top of its scroll position) to go
  // back to the list — separate from the header's own swipe, which just
  // collapses/expands the sheet.
  let detailTouchStartY = null;
  let detailStartAtTop = true;
  nearMePanelDetail.addEventListener('touchstart', (e) => {
    detailTouchStartY = e.touches[0].clientY;
    detailStartAtTop = nearMePanelDetail.scrollTop <= 0;
  }, { passive: true });
  nearMePanelDetail.addEventListener('touchend', (e) => {
    if (detailTouchStartY === null) return;
    const deltaY = e.changedTouches[0].clientY - detailTouchStartY;
    detailTouchStartY = null;
    if (detailStartAtTop && deltaY > 40) exitDetailMode();
  }, { passive: true });

  // Tapping a row in "Other Pizza Nearby..." swaps the card directly to
  // that pizzeria — same as tapping its marker on the map would.
  nearMePanelDetail.addEventListener('click', (e) => {
    const item = e.target.closest('.ticket-nearby-item');
    if (!item) return;
    const name = item.dataset.name;
    if (window.flyToPizzeria) window.flyToPizzeria(name);
  });
}

// Clicking a pizzeria in the panel selects it on the map
const nearMePanelList = document.getElementById('nearMePanelList');
if (nearMePanelList) {
  nearMePanelList.addEventListener('click', (e) => {
    const item = e.target.closest('.near-me-item');
    if (!item) return;
    const name = item.dataset.name;
    if (window.flyToPizzeria) window.flyToPizzeria(name);
    // The sheet now shows the pizzeria's card in place of the list (see
    // enterDetailMode), so it stays open on mobile too — no more collapsing
    // it to reveal a separate floating popup underneath.
  });
}

// ===== Global search (pizzerias + neighborhoods + landmarks + venues) =====
const searchIconBtn = document.getElementById('searchIconBtn');
const searchOverlay = document.getElementById('searchOverlay');
const globalSearchInput = document.getElementById('globalSearchInput');
const globalSearchResults = document.getElementById('globalSearchResults');
const searchCloseBtn = document.getElementById('searchCloseBtn');

const CATEGORY_ICONS = {
  'Pizzerias': '🍕',
  'Neighborhoods': '📍',
  'Landmarks & Attractions': '🗽',
  'Venues': '🎭',
  'Hotels': '🏨',
  'Transit': '🚇',
  'Shopping & Markets': '🛍️',
  'Italian Markets & Delis': '🧀',
  'Italian-American Heritage': '🇮🇹',
  'Colleges & Universities': '🎓',
  'Hospitals & Medical Centers': '🏥',
  'Event & Convention Spaces': '🎪',
  'Activities': '⭐',
};

function openSearchOverlay() {
  if (!searchOverlay) return;
  searchOverlay.hidden = false;
  setTimeout(() => globalSearchInput && globalSearchInput.focus(), 50);
}

function closeSearchOverlay() {
  if (!searchOverlay) return;
  searchOverlay.hidden = true;
  if (globalSearchInput) globalSearchInput.value = '';
  renderSearchResults('');
}

// Third way to close: clicking the search icon again while the overlay is
// already open (in addition to clicking outside, and Escape).
function toggleSearchOverlay() {
  if (!searchOverlay) return;
  if (searchOverlay.hidden) openSearchOverlay();
  else closeSearchOverlay();
}

function renderSearchResults(query) {
  if (!globalSearchResults) return;

  if (!query.trim()) {
    globalSearchResults.innerHTML = '<p class="search-hint">Search pizzerias, neighborhoods, landmarks, venues, or hotels — start typing above.</p>';
    return;
  }

  if (typeof searchDestinations !== 'function') {
    globalSearchResults.innerHTML = '<p class="search-hint">Search is still loading — try again in a moment.</p>';
    return;
  }

  const groups = searchDestinations(query, {
    includePizzerias: true,
    pizzeriaFeatures: window.pizzaGeojsonFeatures || [],
    maxResults: 8,
  });

  if (!groups.length) {
    globalSearchResults.innerHTML = '<p class="search-hint">No matches. Try a different spelling or a nearby landmark.</p>';
    return;
  }

  globalSearchResults.innerHTML = groups.map(g => `
    <div class="search-group-heading">${g.category}</div>
    ${g.items.map(item => `
      <div class="search-result-item" data-type="${item.type}" data-category="${escapeAttr(item.category)}" data-name="${escapeAttr(item.name)}" data-lat="${item.lat}" data-lng="${item.lng}">
        <span class="search-result-icon">${CATEGORY_ICONS[item.category] || '📍'}</span>
        <div class="search-result-text">
          <div class="search-result-name">${escapeHTML(item.name)}</div>
          ${item.subtitle ? `<div class="search-result-subtitle">${escapeHTML(item.subtitle)}</div>` : ''}
        </div>
      </div>
    `).join('')}
  `).join('');
}

if (searchIconBtn) searchIconBtn.addEventListener('click', toggleSearchOverlay);
if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeSearchOverlay);

// The map stays interactive behind the search panel now (it's a dropdown,
// not a full modal), so "click outside to close" needs to check against
// the actual panel and the icon that opened it, rather than a backdrop.
document.addEventListener('click', (e) => {
  if (!searchOverlay || searchOverlay.hidden) return;
  const inner = searchOverlay.querySelector('.search-overlay-inner');
  const clickedInsidePanel = inner && inner.contains(e.target);
  const clickedIcon = searchIconBtn && (e.target === searchIconBtn || searchIconBtn.contains(e.target));
  if (!clickedInsidePanel && !clickedIcon) closeSearchOverlay();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && searchOverlay && !searchOverlay.hidden) closeSearchOverlay();
});

if (globalSearchInput) {
  let searchDebounce = null;
  globalSearchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    const val = e.target.value;
    searchDebounce = setTimeout(() => renderSearchResults(val), 120);
  });
}

if (globalSearchResults) {
  globalSearchResults.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (!item) return;
    const { type, name, category, lat, lng } = item.dataset;
    closeSearchOverlay();
    if (type === 'pizzeria') {
      if (window.flyToPizzeria) window.flyToPizzeria(name);
    } else {
      const latNum = parseFloat(lat), lngNum = parseFloat(lng);
      map.flyTo({ center: [lngNum, latNum], zoom: 14.5, duration: 900 });
      if (window.buildResultsPanel) {
        window.buildResultsPanel({
          lat: latNum, lng: lngNum, mode: 'search',
          label: name, isNeighborhood: category === 'Neighborhoods',
        });
      }
    }
  });
}

// ===== "Search This Area" — third map state =====
// Near Me and search results stay anchored to their original point even
// as the user pans (per spec: never auto-refresh on drag). Once they've
// panned far enough that the anchor point is no longer visible on screen,
// show a floating button to manually re-query for the current view.
const searchThisAreaBtn = document.getElementById('searchThisAreaBtn');

function hideSearchThisAreaBtn() {
  if (searchThisAreaBtn) searchThisAreaBtn.hidden = true;
}
function showSearchThisAreaBtn() {
  if (searchThisAreaBtn) searchThisAreaBtn.hidden = false;
}

let panDetectTimer = null;
// 'move' (not 'moveend') so this reacts while still panning/mid-momentum,
// rather than waiting for the whole scroll to settle before checking —
// that wait was the main source of the button feeling slow to reappear.
map.on('move', () => {
  clearTimeout(panDetectTimer);
  panDetectTimer = setTimeout(() => {
    const anchor = window.panelAnchor;
    const panel = document.getElementById('nearMePanel');
    if (!anchor || !panel || panel.hidden) {
      hideSearchThisAreaBtn();
      return;
    }
    // Shrink the bounds inward before checking — requires a meaningfully
    // clear pan away, not just barely-at-the-edge. Kept fairly tight so
    // the button reappears promptly after a real pan, rather than making
    // the user drag most of a screen-width away first.
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
    const latPad = (ne.lat - sw.lat) * 0.08;
    const lngPad = (ne.lng - sw.lng) * 0.08;
    const inView = anchor.lat > sw.lat + latPad && anchor.lat < ne.lat - latPad &&
                   anchor.lng > sw.lng + lngPad && anchor.lng < ne.lng - lngPad;

    // Zooming out around the same center point never moves the anchor
    // out of bounds (it's usually still smack in the middle), but it
    // does reveal a lot of area the current results never covered —
    // so treat a meaningful zoom-out as its own trigger too.
    const anchorZoom = window.panelAnchorZoom;
    const zoomedOut = typeof anchorZoom === 'number' && (anchorZoom - map.getZoom() > 0.6);

    if (!inView || zoomedOut) {
      showSearchThisAreaBtn();
    } else {
      hideSearchThisAreaBtn();
    }
  }, 50);
});

if (searchThisAreaBtn) {
  searchThisAreaBtn.addEventListener('click', () => {
    if (window.buildResultsPanel) window.buildResultsPanel({ mode: 'area' });
  });
}

