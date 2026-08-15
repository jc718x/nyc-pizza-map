const CACHE_SECONDS = 2505600; // 29 days, under Google's 30-day cap
const PLACE_ID_RE = /^[A-Za-z0-9_-]{20,255}$/;

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const placeId = url.searchParams.get('place_id');
  if (!placeId || !PLACE_ID_RE.test(placeId)) return json({ error: 'bad place_id' }, 400);
  if (!(await isKnownPlace(placeId, url.origin))) return json({ error: 'unknown place' }, 404);

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/rating?place_id=${placeId}`, request);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let res;
  try {
    res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': env.PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,rating,userRatingCount,googleMapsUri'
      }
    });
  } catch (e) {
    return json({ error: 'upstream unreachable' }, 502);
  }
  if (!res.ok) return json({ error: 'upstream error', status: res.status }, 502);

  const d = await res.json();
  const response = json({
    rating: d.rating ?? null,
    count: d.userRatingCount ?? 0,
    url: d.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`
  }, 200, {
    'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
    'Access-Control-Allow-Origin': url.origin
  });

  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function isKnownPlace(placeId, origin) {
  const cache = caches.default;
  const key = new Request(`${origin}/__place-allowlist`);
  let cached = await cache.match(key);
  let ids;
  if (cached) {
    ids = await cached.json();
  } else {
    const res = await fetch(`${origin}/data.json`);
    if (!res.ok) return false;
    const geo = await res.json();
    ids = (geo.features || []).map(f => f.properties?.place_id).filter(Boolean);
    await cache.put(key, json(ids, 200, { 'Cache-Control': 'public, max-age=86400' }));
  }
  return ids.includes(placeId);
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
