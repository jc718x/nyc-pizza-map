// GET /api/rating?place_id=ChIJ...  ->  { rating, count, url }
//
// Three layers in front of Google, so a page full of ratings costs almost nothing:
//   1. Cache API  - per-datacenter, instant, 29 days
//   2. KV         - global, 29 days. This is what bounds the Google call count.
//   3. Google     - only on a genuine miss, and only under the monthly ceiling.
//
// Needs a KV namespace bound as RATINGS, and PLACES_API_KEY as a secret.

const TTL = 2505600;              // 29 days, under Google's 30-day cap
const MAX_CALLS_PER_MONTH = 800;  // ceiling; free allowance is 1000
const PLACE_ID_RE = /^[A-Za-z0-9_-]{20,255}$/;

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('place_id');
  if (!id || !PLACE_ID_RE.test(id)) return json({ error: 'bad place_id' }, 400);

  // 1. edge cache
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/rating?place_id=${id}`, request);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  if (!(await isKnownPlace(id, url.origin, env))) return json({ error: 'unknown place' }, 404);

  // 2. KV
  let body = await env.RATINGS.get(`p2:${id}`, { type: 'json' });

  // 3. Google, if we're still under the monthly ceiling
  if (!body) {
    const month = new Date().toISOString().slice(0, 7);   // "2026-08"
    const key = `calls:${month}`;
    const used = parseInt(await env.RATINGS.get(key) || '0', 10);

    if (used >= MAX_CALLS_PER_MONTH) {
      // Ceiling reached: return nothing rather than spend money. The front-end
      // renders no stars, which is the same as a place with no rating.
      return json({ rating: null, count: 0, url: mapsUrl(id), capped: true }, 200,
                  { 'Cache-Control': 'public, max-age=3600' });
    }

    let res;
    try {
      res = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
        headers: {
          'X-Goog-Api-Key': env.PLACES_API_KEY,
          'X-Goog-FieldMask': 'id,rating,userRatingCount,googleMapsUri,regularOpeningHours'
        }
      });
    } catch (e) {
      return json({ error: 'upstream unreachable' }, 502);
    }
    if (!res.ok) return json({ error: 'upstream error', status: res.status }, 502);

    const d = await res.json();
    const oh = d.regularOpeningHours;
    body = {
      rating: d.rating ?? null,
      count: d.userRatingCount ?? 0,
      url: d.googleMapsUri ?? mapsUrl(id),
      // Only the weekly pattern is cacheable. `openNow` is computed by Google
      // at request time and would be a lie within the hour, so it is dropped
      // here and recomputed in the browser from the visitor's own clock.
      hours: oh ? { periods: oh.periods || [], week: oh.weekdayDescriptions || [] } : null
    };

    // Count the call, then store. Not transactional — concurrent requests can
    // undercount slightly. It's a safety net, not a billing ledger.
    waitUntil(env.RATINGS.put(key, String(used + 1), { expirationTtl: 5356800 })); // 62 days
    waitUntil(env.RATINGS.put(`p2:${id}`, JSON.stringify(body), { expirationTtl: TTL }));
  }

  const response = json(body, 200, {
    'Cache-Control': `public, max-age=${TTL}`,
    'Access-Control-Allow-Origin': url.origin
  });
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

// Only serve place IDs that are in your own data.json.
async function isKnownPlace(id, origin, env) {
  let ids = await env.RATINGS.get('allowlist', { type: 'json' });
  if (!ids) {
    const res = await fetch(`${origin}/data.json`);
    if (!res.ok) return false;
    const geo = await res.json();
    ids = (geo.features || []).map(f => f.properties?.place_id).filter(Boolean);
    await env.RATINGS.put('allowlist', JSON.stringify(ids), { expirationTtl: 86400 });
  }
  return ids.includes(id);
}

function mapsUrl(id) {
  return `https://www.google.com/maps/place/?q=place_id:${id}`;
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
