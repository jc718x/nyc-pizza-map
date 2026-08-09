// Neighborhood picks chosen by checking actual pizzeria coverage against
// the site's data.json (not just name recognition) — see project notes.
// Brooklyn/Manhattan use a 1.2km search radius; Queens/Bronx/Staten Island
// use 2km since those boroughs have far fewer pizzerias overall.
const NEIGHBORHOODS = {
  Brooklyn: [
    { name: "Bay Ridge",    lat: 40.6263, lng: -74.0299 },
    { name: "Park Slope",   lat: 40.6710, lng: -73.9814 },
    { name: "Williamsburg", lat: 40.7081, lng: -73.9571 },
    { name: "Bensonhurst",  lat: 40.5990, lng: -73.9880 },
    { name: "Fort Greene",  lat: 40.6896, lng: -73.9749 },
  ],
  Manhattan: [
    { name: "Midtown",       lat: 40.7549, lng: -73.9840 },
    { name: "SoHo",          lat: 40.7233, lng: -74.0030 },
    { name: "Hell's Kitchen", lat: 40.7638, lng: -73.9918 },
    { name: "West Village",  lat: 40.7343, lng: -74.0059 },
    { name: "East Village",  lat: 40.7265, lng: -73.9815 },
  ],
  Queens: [
    { name: "Ridgewood",     lat: 40.7043, lng: -73.9028 },
    { name: "Astoria",       lat: 40.7644, lng: -73.9235 },
    { name: "Sunnyside",     lat: 40.7433, lng: -73.9196 },
    { name: "Kew Gardens",   lat: 40.7134, lng: -73.8296 },
    { name: "Forest Hills",  lat: 40.7196, lng: -73.8448 },
  ],
  Bronx: [
    { name: "Morris Park",   lat: 40.8496, lng: -73.8600 },
    { name: "Kingsbridge",   lat: 40.8815, lng: -73.9026 },
    { name: "Throggs Neck",  lat: 40.8207, lng: -73.8237 },
    { name: "Riverdale",     lat: 40.8967, lng: -73.9107 },
    { name: "Fordham",       lat: 40.8610, lng: -73.8958 },
  ],
  'Staten Island': [
    { name: "Port Richmond", lat: 40.6362, lng: -74.1293 },
    { name: "Great Kills",   lat: 40.5537, lng: -74.1521 },
    { name: "Grasmere",      lat: 40.6028, lng: -74.0834 },
    { name: "Dongan Hills",  lat: 40.5884, lng: -74.0965 },
    { name: "Annadale",      lat: 40.5433, lng: -74.1780 },
  ],
};

// Search radius per borough — Queens/Bronx/Staten Island get a wider net
// since they have far fewer pizzerias overall in the dataset.
const NEIGHBORHOOD_RADIUS = {
  Brooklyn: 1200,
  Manhattan: 1200,
  Queens: 2000,
  Bronx: 2000,
  'Staten Island': 2000,
};
