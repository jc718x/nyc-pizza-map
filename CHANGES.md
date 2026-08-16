# NYC Pizza Map — changed files

Drop these into the repo root, keeping the `assets/` folder structure.
Every file here replaces an existing one except `site-nav.js` and
`pizza-crawls.html`, which are new.

## Deploy together (they depend on each other)
- `site-nav.js` — NEW. Renders the topbar, search overlay, and mobile
  drawer from one config object. The menu is edited here and nowhere else.
- `nav.js` — now handles more than one dropdown (Explore + Pizza Culture).
  With the old nav.js, the Pizza Culture menu renders but never opens.

## Nav structure
```
Map · Pizza Near Me · [Explore ▾] · [Pizza Culture ▾] · Suggest a Spot · Shop · About

Explore ▾   Boroughs: Manhattan, Brooklyn, Queens, Bronx, Staten Island, All Neighborhoods
            Guides:   Pizza Crawls, Worth the Trip, West Village, Bay Ridge
Pizza Culture ▾  How To Make Pizza, Pizza History, Pizza Facts
```

## Pages migrated to the shared nav (15)
about, best-pizza-bay-ridge, best-pizza-west-village, how-to-make-pizza,
index, lucali, neighborhood-guides, pizza-crawls, pizza-facts,
pizza-history, pizza-search, pizza-worth-traveling-for, store,
suggest, suggest-thanks

Each now opens with:

    <div id="siteHeader"></div>
    <script src="site-nav.js"></script>

This must stay at the top of `<body>`, not the bottom: `map.js` reads
`#searchIconBtn` and `#searchOverlay` as top-level consts, so the header
has to exist before it runs.

Removed along the way: ~68KB of duplicated markup, two drifted nav
versions, and an orphaned duplicate nav block that was in pizza-facts,
pizza-history, and pizza-worth-traveling-for.

## Content changes
- `best-pizza-bay-ridge.html` — rebuilt. New section order (hero + chips,
  photo, Bay Ridge Picks, map, all 14, crawl teaser, About, Explore
  Nearby). Listings, map pins, counts, and chips are all generated from
  data.json, so nothing can drift.
- `pizza-crawls.html` — NEW. Bay Ridge crawl: 5 stops, 0.9 mi, ~17 min,
  route map, nearest subway at each end (R to 86 St, finish at 95 St).
- `data.json` — 305 features. APizza at 9524 4th Ave renamed to
  "APizza: Bay Ridge"; 8424 13th Ave untouched. Nonno's removed. Bella
  Roma, Bay Ridge Pizza, Rocco's added. All 6 missing place_ids filled.
- `map.js` — one stale "APizza – Dyker Heights" label key updated.
- `index.html` — stale APizza name in the JSON-LD updated.
- `sitemap.xml` — pizza-crawls.html added (14 URLs).
- `assets/bay-ridge-hero.jpg` — 183KB (was 2.6MB).
- `assets/pizzawalking.png` — 68KB (was 2.5MB).

## Still to do
1. Bella Roma, Bay Ridge Pizza, Rocco's have empty `style`, `blurb`,
   `price`, `website`, `slices`, `seating`. Their cards show
   "TODO — blurb" on the live Bay Ridge page.
2. The crawl route line joins stops directly, so it cuts across blocks
   between 5th and 3rd Ave. Trace it once in geojson.io and add a
   `path` array to the JSON block in pizza-crawls.html.
3. Walking times are straight-line estimates with a 1.25x grid
   correction. Worth checking against a real route.
4. `nearby.html` and `list.html` still have old nav but 301 to
   pizza-search.html — delete them from the repo.

## Test before pushing
No staging branch, so open one migrated page locally first —
`about.html` is the simplest — and confirm the menu renders and both
dropdowns open.
