// ===== NYC Pizza Map — shared search engine =====
// One ranked search function used by both the main map's global search
// and Pizza Near Your Plans. Each interface decides which categories to
// include (see includePizzerias option) and how to render results —
// this file only handles matching, scoring, and grouping.

// Strips apostrophes, curly quotes, and periods before comparison so
// "joes" matches "Joe's", "st george" matches "St. George", etc. Only
// affects matching — the original name is still what gets displayed.
function normalize(str) {
  return str.toLowerCase().replace(/['’.]/g, '').trim();
}

function matchScore(query, name, aliases) {
  const q = normalize(query);
  if (!q) return 0;

  const candidates = [name, ...(aliases || [])];
  let best = 0;

  candidates.forEach((raw, i) => {
    const c = normalize(raw);
    const aliasPenalty = i === 0 ? 1 : 0.9; // primary name slightly outranks an alias match
    let score = 0;

    if (c === q) score = 1000;
    else if (c.startsWith(q)) score = 700;
    else if (new RegExp('\\b' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(c)) score = 500;
    else if (c.includes(q)) score = 300;

    score *= aliasPenalty;
    if (score > best) best = score;
  });

  return best;
}

/**
 * Search the shared destination set (and optionally pizzerias) for a query.
 * @param {string} query - what the user typed
 * @param {object} options
 *   - includePizzerias: boolean — pull in geojson.features too (main map only)
 *   - pizzeriaFeatures: array — geojson.features, required if includePizzerias
 *   - maxResults: number — total results across all groups (default 8)
 * @returns {Array<{category: string, items: Array}>} grouped, ranked results
 */
function searchDestinations(query, options = {}) {
  const { includePizzerias = false, pizzeriaFeatures = [], maxResults = 8 } = options;
  const q = query.trim();
  if (!q || typeof SEARCH_DESTINATIONS === 'undefined') return [];

  const scored = [];

  SEARCH_DESTINATIONS.forEach(d => {
    const s = matchScore(q, d.name, d.aliases);
    if (s <= 0) return;
    const priorityBonus = d.priority === 1 ? 50 : d.priority === 2 ? 25 : 0;
    scored.push({
      type: 'destination',
      category: d.category,
      name: d.name,
      subtitle: d.neighborhood ? `${d.neighborhood}, ${d.borough}` : d.borough,
      lat: d.lat,
      lng: d.lng,
      score: s + priorityBonus,
    });
  });

  if (includePizzerias && pizzeriaFeatures.length) {
    pizzeriaFeatures.forEach(f => {
      const p = f.properties;
      const s = matchScore(q, p.name, []);
      if (s <= 0) return;
      const priorityBonus = p.worth_a_trip ? 50 : 0;
      scored.push({
        type: 'pizzeria',
        category: 'Pizzerias',
        name: p.name,
        subtitle: p.borough,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        score: s + priorityBonus,
      });
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, maxResults);

  // Group while preserving rank order within each group
  const groups = [];
  const groupIndex = {};
  top.forEach(item => {
    if (!(item.category in groupIndex)) {
      groupIndex[item.category] = groups.length;
      groups.push({ category: item.category, items: [] });
    }
    groups[groupIndex[item.category]].items.push(item);
  });

  // Reorder groups to match the intended display hierarchy: exact/strong
  // pizzeria matches lead, then neighborhoods, then everything else —
  // rather than letting one high-scoring landmark push its whole
  // category ahead of neighborhoods.
  const CATEGORY_ORDER = [
    'Pizzerias', 'Neighborhoods', 'Landmarks & Attractions', 'Venues',
    'Hotels', 'Transit', 'Shopping & Markets', 'Activities',
  ];
  groups.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  return groups;
}
