# NYC Pizza Map — full deployable site

This is the **complete site**, assembled against your repo. It replaces
everything at the repo root. See "Files to delete" at the bottom.

## Structure — clean directory URLs, no `.html`

    /                       /brooklyn/              /brooklyn/bay-ridge/
    /manhattan/             /manhattan/west-village/
    /queens/  /bronx/  /staten-island/
    /neighborhoods/         /pizza-crawls/          /pizza-history/
    /pizza-facts/           /make-pizza/            /pizzerias/lucali/
    /find-pizza/            /worth-the-trip/        /shop/
    /suggest/               /suggest/thanks/        /about/

Every path is root-absolute (`/style.css`, `/data.json`, `/assets/...`),
which is required once pages sit at different depths. `_redirects` maps
every old `.html` URL to its new home.

## What's in here
- **All 20 pages** as `<dir>/index.html`
- **Shared nav** — `site-nav.js` renders the topbar, search overlay, and
  mobile drawer from one config. `nav.js` handles both dropdowns.
- **Breadcrumbs** on all 19 pages below the root, plus `BreadcrumbList`
  JSON-LD. Static HTML, no JS dependency.
- **5 borough pages**, Brooklyn built out as the phase-2 hub
- **`assets/`** — your full 23-file folder, with my optimised
  `bay-ridge-hero.jpg` (183KB) and `pizzawalking.png` (68KB) kept
- **`functions/api/rating.js`**, **`google-rating.js`** — carried over
  untouched
- **`coordinate-checker.html`, `audit.html`** — kept at the root as plain
  files. They're local tools, not linked from the site, and `robots.txt`
  now disallows both.

## Verified before packaging
- Every `/assets/...`, `.js`, `.css`, and `.json` reference resolves
- Div balance and one breadcrumb + one schema block per page
- All 19 `BreadcrumbList` blocks parse as JSON
- Nav active-state renders correctly at `/`, `/brooklyn/bay-ridge/`,
  `/pizza-facts/`

## Files to delete from the repo
All the flat `.html` pages (now directories), plus:

    files.zip                      stray archive
    bay-ridge.html                 old scratch file, never linked
    list.html, nearby.html         already 301'd to /find-pizza/
    pizzawalking.png               duplicate of assets/ copy (2.5MB)
    poster-*.jpg, shirt-*.png      duplicates of assets/ copies (~11MB)
    assets/bay-ridge-hero.png      superseded by the .jpg (540KB)

That's ~14MB of duplicates and dead files.

## Unused assets (not deleted — your call)
`pizza-chef-hero.png`, `poster-bronx-web.jpg`, `poster-queens-web.jpg`,
`poster-staten-island-web.jpg`, `shirt-brooklyn-club.jpg`,
`shirt-nyc-logo.jpg`, `shirt-oven-fresh.jpg`, `shirt-tried-the-rest.jpg`.
The shop page only shows 6 shirts and 2 posters — these look like designs
you haven't listed yet, so I left them alone.

## Still to do
1. Three Bay Ridge entries — Rocco's, Bella Roma, Bay Ridge Pizza — have
   no `style`, `blurb`, or `price`. They show "TODO — blurb" on
   `/brooklyn/bay-ridge/` and sit under "Not yet tagged" on `/brooklyn/`.
2. Brooklyn's intro and About are DRAFTS in my words, marked in the page
   text. Rewrite before launch.
3. The other four borough pages still have TODO copy blocks.
4. The crawl route line joins stops directly and cuts across blocks
   between 5th and 3rd Ave. Trace it once in geojson.io and add a `path`
   array to the JSON block in `/pizza-crawls/index.html`.
5. Walking times are straight-line estimates with a 1.25x grid correction.
6. Sicilian in Brooklyn is only 3 records — likely a tagging gap, since
   `style` is one value per pizzeria and squares get hidden behind
   whatever a shop is better known for.
7. `/pizzerias/` has no index page, so that breadcrumb segment is plain
   text rather than a link.

## Deploy note
No staging branch. Unzip, then open `/brooklyn/bay-ridge/` and `/about/`
locally and confirm the nav renders, both dropdowns open, and the search
icon works before pushing.
