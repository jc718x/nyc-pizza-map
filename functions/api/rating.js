/**
 * GET /api/rating?place_id=ChIJ...
 *
 * Returns { rating, count, url } for one place.
 *
 * Why this file exists: the Places API key must never reach the browser, and
 * Google's terms forbid storing rating data for more than 30 days. This
 * Function keeps the key server-side and caches each place's rating for 29
 * days at Cloudflare's edge — so you make roughly one Google call per pizzeria
 * per month regardless of how much traffic the site gets.
 */

const CACHE_SECONDS = 29 * 24 * 60 * 60; // 29 days — under Google's 30-day cap

// Google place IDs are URL-safe base64-ish strings. This is a sanity check,
// not security; the allowlist below is the real guard.
const PLACE_ID_RE = /^[A-Za-z0-9_-]{20,255}$/;

export async function onRequestGet({ request, env, waitUntil }) {
  const url = new URL(request.url);
  const placeId = url.searchParams.get('place_id');

  if (!placeId || !PLACE_ID_RE.test(placeId)) {
    return json({ error: 'bad place_id' }, 400);
  }

  // Only serve place IDs that are actually in your dataset. Without this,
  // anyone who finds the endpoint can use it as a free Places proxy on your
  // billing account.
  if (!(await isKnownPlace(placeId, url.origin, env))) {
    return json({ error: 'unknown place' }, 404);
  }

  // Cache key is derived from the place ID alone, so every visitor asking
  // about Lucali shares one cached response.
  const cacheKey = new Request(`${url.origin}/api/rating?place_id=${placeId}`, request);
  const cache = caches.default;

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  // Field mask keeps the bill down: asking for `rating` puts this in the
  // Enterprise SKU. Asking for reviews would push it to Enterprise+Atmosphere,
  // which is why we don't.
  let res;
  try {
    res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': env.PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,rating,userRatingCount,googleMapsUri'
      }
    });
  } catch (err) {
    return json({ error: 'upstream unreachable' }, 502);
  }

  if (!res.ok) {
    // Don't cache failures — a transient 500 shouldn't stick around for a month.
    return json({ error: 'upstream error', status: res.status }, 502);
  }

  const data = await res.json();

  // A place with no reviews yet has no `rating` field at all.
  const body = {
    rating: data.rating ?? null,
    count: data.userRatingCount ?? 0,
    url: data.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`
  };

  const response = json(body, 200, {
    'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
    'Access-Control-Allow-Origin': url.origin
  });

  // Store in the edge cache without making the visitor wait for it.
  waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}

/**
 * Checks the requested place ID against the place IDs in your data.json.
 * data.json is fetched from your own site and cached for a day, so this costs
 * essentially nothing.
 */
async function isKnownPlace(placeId, origin, env) {
  const cache = caches.default;
  const key = new Request(`${origin}/__place-allowlist`);

  let cached = await cache.match(key);
  let ids;

  if (cached) {
    ids =
