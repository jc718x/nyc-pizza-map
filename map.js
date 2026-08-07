// ===== NYC Pizza Map =====
// Uses CARTO's free Voyager basemap (OpenStreetMap data, no API key).
// Individual markers use maplibregl.Marker (HTML elements) instead of
// symbol layers — this gives direct pixel-size control so pins are
// exactly as large as specified, no MapLibre icon-size scaling games.

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

// ===== Pizza pin SVG =====
// Teardrop pin, 36×48px rendered size — same proportions as Google Maps.
// Borough color fills the pin; white pizza slice icon inside.
function makePinEl(color) {
  const el = document.createElement('div');
  el.className = 'pizza-pin';
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <path d="M18 2 C9 2 2 9 2 18 C2 30 18 46 18 46 C18 46 34 30 34 18 C34 9 27 2 18 2 Z"
            fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="1.2"/>
      <circle cx="18" cy="17" r="10" fill="rgba(255,255,255,0.18)"/>
      <!-- pizza slice: tip at center, crust at bottom of circle -->
      <polygon points="18,11 11,24 25,24" fill="white" opacity="0.92"/>
      <path d="M10.5,25.5 A10,10 0 0 0 25.5,25.5" stroke="white" stroke-width="2.2"
            fill="none" stroke-linecap="round"/>
      <!-- pepperoni -->
      <circle cx="16" cy="19" r="1.6" fill="${color}" opacity="0.85"/>
      <circle cx="21" cy="21" r="1.6" fill="${color}" opacity="0.85"/>
      <circle cx="17.5" cy="23" r="1.3" fill="${color}" opacity="0.85"/>
    </svg>`;
  return el;
}

// ===== Cluster helpers =====
// We use a GeoJSON source + circle layer just for clusters.
// Individual points are added as HTML Marker elements for full size control.

function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}
function escapeAttr(str) {
  return (str ?? '').replace(/"/g, '&quot;');
}

function popupHTML(p) {
  const color = BOROUGH_COLORS[p.borough] || '#DC2225';
  const [lng, lat] = [p._lng, p._lat];
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return `
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
}

map.on('load', async () => {
  const res = await fetch('data.json');
  const geojson = await res.json();

  // ===== Individual markers (HTML Markers — full size control) =====
  const allMarkers = [];

  geojson.features.forEach(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    const p = feature.properties;
    const color = BOROUGH_COLORS[p.borough] || '#DC2225';

    const el = makePinEl(color);
    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map);

    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // Stash coords so popup HTML can build directions link
      p._lng = lng;
      p._lat = lat;
      new maplibregl.Popup({ closeButton: true, maxWidth: '270px', offset: 46 })
        .setLngLat([lng, lat])
        .setHTML(popupHTML(p))
        .addTo(map);
    });

    allMarkers.push({ marker, lng, lat });
  });

  // ===== Cluster circles (GeoJSON source + circle layer) =====
  // These show a "N+" badge when markers are close together at low zoom.
  map.addSource('pizzerias-clusters', {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 55
  });

  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'pizzerias-clusters',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#FFFBF3',
      'circle-stroke-width': 3,
      'circle-stroke-color': '#DC2225',
      'circle-radius': ['step', ['get', 'point_count'], 20, 5, 24, 15, 28]
    }
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'pizzerias-clusters',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 13
    },
    paint: { 'text-color': '#DC2225' }
  });

  // Click cluster to zoom in
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('pizzerias-clusters').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom });
    });
  });

  map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');

  // Hide individual HTML markers when a cluster covers them,
  // show them again when zoomed in enough
  function syncMarkerVisibility() {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    // At low zoom, clusters take over — hide individual markers to avoid
    // them showing through cluster circles
    const showIndividual = zoom >= 13;
    allMarkers.forEach(({ marker }) => {
      marker.getElement().style.display = showIndividual ? 'block' : 'none';
    });
  }

  map.on('zoomend', syncMarkerVisibility);
  syncMarkerVisibility();
});
