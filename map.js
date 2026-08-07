// ===== NYC Pizza Map =====
// Uses CARTO's free Voyager basemap, built on OpenStreetMap data
// (no API key, no Google Places data or tiles — keeps this on the
// right side of Google's ToS and the tile-licensing line from the brief).

const BOROUGH_COLORS = {
  Brooklyn: '#DC2225',
  Manhattan: '#276E40',
  Queens: '#D9A441',
  Bronx: '#8B3A62',
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
    layers: [
      {
        id: 'carto-voyager',
        type: 'raster',
        source: 'carto-voyager'
        // Full color, no filter — closer to the vibrant look you're after.
      }
    ]
  },
  center: [-73.95, 40.72], // roughly centered across the five boroughs
  zoom: 10.4,
  minZoom: 9,
  maxZoom: 18
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

// Build a small colored "pizza slice" wedge icon per borough and register
// it with the map so the symbol layer can reference it by name.
function pizzaSliceSVG(hex) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
      <g transform="translate(26,26) rotate(0)">
        <path d="M0 -22 L18 18 A22 22 0 0 1 -18 18 Z" fill="${hex}" stroke="#241A10" stroke-width="2.5"/>
        <circle cx="-4" cy="-2" r="2.4" fill="#FFFBF3"/>
        <circle cx="6" cy="6" r="2.4" fill="#FFFBF3"/>
        <circle cx="-2" cy="10" r="2.2" fill="#FFFBF3"/>
      </g>
    </svg>`;
}

function loadBoroughIcons() {
  const jobs = Object.entries(BOROUGH_COLORS).map(([borough, hex]) => {
    const id = `pizza-${borough.replace(/\s+/g, '-').toLowerCase()}`;
    const img = new Image(52, 52);
    const svg = pizzaSliceSVG(hex);
    return new Promise((resolve) => {
      img.onload = () => {
        if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
        resolve();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svg);
    });
  });
  return Promise.all(jobs);
}

map.on('load', async () => {
  await loadBoroughIcons();

  const res = await fetch('data.json');
  const geojson = await res.json();

  document.getElementById('entryCount').textContent = geojson.features.length;

  map.addSource('pizzerias', {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 15,
    clusterRadius: 45
  });

  // Cluster circles
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'pizzerias',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#DC2225',
      'circle-stroke-width': 2.5,
      'circle-stroke-color': '#241A10',
      'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 26]
    }
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'pizzerias',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 13
    },
    paint: { 'text-color': '#FFFBF3' }
  });

  // Individual pizzeria markers — icon chosen by borough
  map.addLayer({
    id: 'unclustered-point',
    type: 'symbol',
    source: 'pizzerias',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': [
        'match',
        ['get', 'borough'],
        'Brooklyn', 'pizza-brooklyn',
        'Manhattan', 'pizza-manhattan',
        'Queens', 'pizza-queens',
        'Bronx', 'pizza-bronx',
        'Staten Island', 'pizza-staten-island',
        'pizza-brooklyn'
      ],
      'icon-size': 0.55,
      'icon-allow-overlap': true
    }
  });

  // Click a cluster to zoom in
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('pizzerias').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom });
    });
  });

  // Click an individual pizzeria to open its ticket popup
  map.on('click', 'unclustered-point', (e) => {
    const feature = e.features[0];
    const coords = feature.geometry.coordinates.slice();
    const p = feature.properties;
    const color = BOROUGH_COLORS[p.borough] || '#DC2225';
    const [lng, lat] = coords;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    const html = `
      <div class="ticket">
        <div class="ticket-head">
          <p class="ticket-name">${escapeHTML(p.name)}</p>
          <p class="ticket-address">${escapeHTML(p.address)}</p>
        </div>
        <div class="ticket-body">
          <span class="style-badge" style="background:${color}">${escapeHTML(p.style)}</span>
          <p class="ticket-blurb">${escapeHTML(p.blurb)}</p>
          <div class="ticket-links">
            ${p.website ? `<a href="${escapeAttr(p.website)}" target="_blank" rel="noopener">Website</a>` : ''}
            <a href="${escapeAttr(directionsUrl)}" target="_blank" rel="noopener">Directions</a>
          </div>
        </div>
      </div>`;

    new maplibregl.Popup({ closeButton: true, maxWidth: '270px' })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  });

  map.on('mouseenter', 'unclustered-point', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'unclustered-point', () => (map.getCanvas().style.cursor = ''));
  map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
});

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
function escapeAttr(str) {
  return (str ?? '').replace(/"/g, '&quot;');
}

// ===== About panel toggle =====
const toggle = document.getElementById('aboutToggle');
const panel = document.getElementById('aboutPanel');
toggle.addEventListener('click', () => {
  const isOpen = !panel.hidden;
  panel.hidden = isOpen;
  toggle.setAttribute('aria-expanded', String(!isOpen));
});
