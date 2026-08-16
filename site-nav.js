// ===== NYC Pizza Map — site header (single source of truth) =====
//
// Renders the topbar, search overlay, and mobile drawer from ONE config.
// Before this, the nav was hand-copied into 19 pages and had already
// drifted into two different versions.
//
// HOW TO USE — in each page, replace the whole hand-written block
// (<header class="topbar">…</header>, the search overlay div, and the
// <div class="mobile-nav-drawer">…</div>) with these two lines, placed
// immediately after <body …>:
//
//     <div id="siteHeader"></div>
//     <script src="site-nav.js"></script>
//
// This script MUST run synchronously at that point in the body, not at
// DOMContentLoaded: map.js grabs #searchIconBtn and #searchOverlay as
// top-level consts, so those elements have to exist before map.js runs.
//
// nav.js (behavior: toggles, accordions, dropdown, generic search) is
// unchanged and still loads at the end of the body.
//
// SAFE TO ROLL OUT ONE PAGE AT A TIME: if #siteHeader isn't on the page,
// this does nothing and the existing hand-written markup keeps working.

(function () {
  var mount = document.getElementById('siteHeader');
  if (!mount) return;   // page not migrated yet — leave its markup alone

  // ---------------------------------------------------------------- config
  // Edit the menu HERE and nowhere else.
  var NAV = {
    primary: [
      { label: 'Map',           href: 'index.html#map' },
      { label: 'Pizza Near Me', href: 'pizza-search.html' }
    ],
    groups: [
      {
        label: 'Explore',
        columns: [
          {
            heading: 'Boroughs',
            links: [
              { label: 'Manhattan',     href: 'neighborhood-guides.html#manhattan' },
              { label: 'Brooklyn',      href: 'neighborhood-guides.html#brooklyn' },
              { label: 'Queens',        href: 'neighborhood-guides.html#queens' },
              { label: 'Bronx',         href: 'neighborhood-guides.html#bronx' },
              { label: 'Staten Island', href: 'neighborhood-guides.html#staten-island' },
              { label: 'All Neighborhoods \u2192', href: 'neighborhood-guides.html', viewall: true }
            ]
          },
          {
            heading: 'Guides',
            links: [
              { label: 'Pizza Crawls',   href: 'pizza-crawls.html' },
              { label: 'Worth the Trip', href: 'pizza-worth-traveling-for.html' },
              { label: 'West Village',   href: 'best-pizza-west-village.html' },
              { label: 'Bay Ridge',      href: 'best-pizza-bay-ridge.html' }
            ]
          }
        ]
      },
      {
        // Single-column group — renders as a plain dropdown list on desktop
        // and as a flat labelled section in the mobile drawer.
        label: 'Pizza Culture',
        links: [
          { label: 'How To Make Pizza', href: 'how-to-make-pizza.html' },
          { label: 'Pizza History',     href: 'pizza-history.html' },
          { label: 'Pizza Facts',       href: 'pizza-facts.html' }
        ]
      }
    ],
    utility: [
      { label: 'Suggest a Spot', href: 'suggest.html' },
      { label: 'Shop',           href: 'store.html' },
      { label: 'About',          href: 'about.html' }
    ]
  };

  // ---------------------------------------------------------------- helpers
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function isActive(href) {
    return href.split('#')[0].toLowerCase() === here;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function link(l, extraClass) {
    var cls = [];
    if (extraClass) cls.push(extraClass);
    if (l.viewall) cls.push('nav-dropdown-viewall');
    if (isActive(l.href)) cls.push('active');
    var c = cls.length ? ' class="' + cls.join(' ') + '"' : '';
    return '<a href="' + esc(l.href) + '"' + c + '>' + esc(l.label) + '</a>';
  }

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // ---------------------------------------------------------------- desktop
  function desktopNav() {
    var out = NAV.primary.map(function (l) { return link(l); }).join('\n    ');

    NAV.groups.forEach(function (g) {
      var id = 'dropdown-' + slug(g.label);
      var inner, wide;

      if (g.columns) {
        wide = ' nav-dropdown-menu--wide';
        inner = '<div class="nav-dropdown-cols">' + g.columns.map(function (c) {
          return '<div class="nav-dropdown-col">' +
                   '<div class="nav-dropdown-heading">' + esc(c.heading) + '</div>' +
                   c.links.map(function (l) { return link(l); }).join('') +
                 '</div>';
        }).join('') + '</div>';
      } else {
        wide = '';
        inner = g.links.map(function (l) { return link(l); }).join('');
      }

      out += '\n    <div class="nav-dropdown" id="' + id + '">' +
               '<button class="nav-dropdown-btn" aria-haspopup="true" aria-expanded="false">' +
                 esc(g.label) + '</button>' +
               '<div class="nav-dropdown-menu' + wide + '">' + inner + '</div>' +
             '</div>';
    });

    out += '\n    ' + NAV.utility.map(function (l) { return link(l); }).join('\n    ');
    return out;
  }

  // ---------------------------------------------------------------- mobile
  function mobileNav() {
    var out = '<div class="mobile-nav-heading">Find Pizza</div>' +
              NAV.primary.map(function (l) { return link(l, 'primary'); }).join('');

    NAV.groups.forEach(function (g) {
      if (g.columns) {
        // Nested accordion — nav.js wires #mobileExploreToggle and the
        // generic .mobile-nav-sub-accordion buttons.
        out += '<button class="mobile-nav-accordion" id="mobileExploreToggle" ' +
                 'aria-expanded="false" aria-controls="mobileExplorePanel">' +
                 '<span class="mobile-nav-accordion-label">' + esc(g.label) + '</span>' +
                 '<span class="mobile-nav-accordion-caret">\u203A</span>' +
               '</button>' +
               '<div class="mobile-nav-accordion-panel" id="mobileExplorePanel" hidden>';

        g.columns.forEach(function (c) {
          var key = slug(c.heading);
          out += '<button class="mobile-nav-sub-accordion" data-sub="' + key + '" aria-expanded="false">' +
                   '<span>' + esc(c.heading) + '</span>' +
                   '<span class="mobile-nav-sub-caret">\u203A</span>' +
                 '</button>' +
                 '<div class="mobile-nav-sub-panel" id="mobile-sub-' + key + '" hidden>' +
                   c.links.map(function (l) { return link(l); }).join('') +
                 '</div>';
        });

        out += '</div>';
      } else {
        // Flat section — three links don't need a tap to reveal.
        out += '<div class="mobile-nav-heading">' + esc(g.label) + '</div>' +
               g.links.map(function (l) { return link(l); }).join('');
      }
    });

    out += '<div class="mobile-nav-divider"></div>' +
           NAV.utility.map(function (l) { return link(l); }).join('');
    return out;
  }

  // ---------------------------------------------------------------- render
  mount.outerHTML =
    '<header class="topbar">' +
      '<button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="siteNav" aria-label="Toggle menu">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
      '<div class="topbar-brand">' +
        '<a href="index.html"><img class="topbar-logo" src="assets/logo-header.png" alt="NYC Pizza Map" /></a>' +
        '<a href="index.html" style="text-decoration:none;">' +
          '<span class="topbar-name"><span class="h1-red">NYC</span> <span class="h1-green">Pizza Map</span></span>' +
        '</a>' +
      '</div>' +
      '<nav class="topbar-nav" id="siteNav" aria-label="Site">' + desktopNav() + '</nav>' +
      '<button class="search-icon-btn" id="searchIconBtn" ' +
        'aria-label="Search pizzerias, neighborhoods, landmarks, or addresses">\uD83D\uDD0D</button>' +
    '</header>' +

    '<div class="search-overlay" id="searchOverlay" hidden>' +
      '<div class="search-overlay-inner">' +
        '<div class="search-input-row">' +
          '<span class="search-input-icon">\uD83D\uDD0D</span>' +
          '<input type="text" id="globalSearchInput" ' +
            'placeholder="Search pizzerias, neighborhoods, landmarks\u2026" autocomplete="off" />' +
          '<button class="search-close-btn" id="searchCloseBtn" aria-label="Close search">\u2715</button>' +
        '</div>' +
        '<div class="search-results" id="globalSearchResults">' +
          '<p class="search-hint">Search pizzerias, neighborhoods, landmarks, venues, or hotels \u2014 start typing above.</p>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="mobile-nav-drawer" id="mobileNav" hidden>' + mobileNav() + '</div>';
})();
