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
//     <script src="/site-nav.js"></script>
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
      { label: 'Map',           href: '/#map' },
      { label: 'Find Pizza',    href: '/find-pizza/' }
    ],
    groups: [
      {
        label: 'Explore',
        columns: [
          {
            // Boroughs only. Neighborhood guides are reached from their
            // borough page, which is the hierarchy the URLs describe —
            // nesting them here needs a third menu level and reads as clutter.
            heading: 'Boroughs',
            links: [
              { label: 'Manhattan',     href: '/manhattan/' },
              { label: 'Brooklyn',      href: '/brooklyn/' },
              { label: 'Queens',        href: '/queens/' },
              { label: 'Bronx',         href: '/bronx/' },
              { label: 'Staten Island', href: '/staten-island/' }
            ]
          },
          {
            // Live neighborhood guides, listed flat. Add each new one here;
            // once this passes ~8, group them by borough instead.
            heading: 'Neighborhoods',
            links: [
              { label: 'Bay Ridge',    href: '/brooklyn/bay-ridge/' },
              { label: 'West Village', href: '/manhattan/west-village/' },
              { label: 'All Neighborhoods \u2192', href: '/neighborhoods/', viewall: true }
            ]
          },
          {
            heading: 'Guides',
            links: [
              { label: 'Pizza Crawls',   href: '/pizza-crawls/' },
              { label: 'Worth the Trip', href: '/worth-the-trip/' }
            ]
          }
        ]
      },
      {
        // Single-column group — renders as a plain dropdown list on desktop
        // and as a flat labelled section in the mobile drawer.
        label: 'Pizza Culture',
        links: [
          { label: 'How To Make Pizza', href: '/make-pizza/' },
          { label: 'Pizza History',     href: '/pizza-history/' },
          { label: 'Pizza Facts',       href: '/pizza-facts/' }
        ]
      }
    ],
    utility: [
      { label: 'Suggest a Spot', href: '/suggest/' },
      { label: 'Shop',           href: '/shop/' },
      { label: 'About',          href: '/about/' }
    ]
  };

  // Live neighborhood guides, by borough. A borough only becomes a
  // drill-down when it has at least one — otherwise tapping it would open
  // a panel with nothing in it but a link back to the borough page.
  var GUIDES = {
    'Manhattan': [{ label: 'West Village', href: '/manhattan/west-village/' }],
    'Brooklyn':  [{ label: 'Bay Ridge',    href: '/brooklyn/bay-ridge/' }]
  };

  // ---------------------------------------------------------------- helpers
  // Normalised current path, e.g. '/brooklyn/bay-ridge/'. Compared whole —
  // splitting on '/' and taking the last segment yields '' on clean URLs.
  var here = location.pathname.toLowerCase();
  if (here.slice(-1) !== '/') here += '/';

  function isActive(href) {
    var p = href.split('#')[0].split('?')[0].toLowerCase();
    if (!p) return false;
    if (p.slice(-1) !== '/') p += '/';
    return p === here;
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
  // Mobile drawer is a stack of panels, not inline accordions: tapping a
  // section slides to its own panel with a back row. nav.js drives it.
  function mobileNav() {
    var panels = [];

    function drill(label, id) {
      return '<button class="mnav-drill" data-panel="' + id + '">' +
               '<span>' + esc(label) + '</span>' +
               '<span class="mnav-caret">\u203A</span>' +
             '</button>';
    }

    function panel(id, parentId, parentLabel, title, inner) {
      panels.push(
        '<div class="mnav-panel" id="' + id + '" hidden>' +
          '<button class="mnav-back" data-panel="' + parentId + '">' +
            '<span class="mnav-caret">\u2039</span><span>' + esc(parentLabel) + '</span>' +
          '</button>' +
          '<div class="mobile-nav-heading">' + esc(title) + '</div>' +
          inner +
        '</div>'
      );
    }

    // ---- root ----
    var root = '<div class="mobile-nav-heading">Find Pizza</div>' +
               NAV.primary.map(function (l) { return link(l, 'primary'); }).join('');

    NAV.groups.forEach(function (g) {
      root += '<div class="mobile-nav-heading">' + esc(g.label) + '</div>';

      if (g.columns) {
        g.columns.forEach(function (c) {
          // "Neighborhoods" is reachable through each borough now, so it
          // isn't repeated as its own section on mobile.
          if (c.heading === 'Neighborhoods') return;

          var id = 'mnp-' + slug(c.heading);
          root += drill(c.heading, id);

          var inner = c.links.map(function (l) {
            var kids = GUIDES[l.label];
            if (!kids) return link(l);

            var kidId = 'mnp-' + slug(l.label);
            panel(kidId, id, c.heading, l.label,
              link({ label: 'All ' + l.label + ' pizza \u2192', href: l.href, viewall: true }) +
              kids.map(function (k) { return link(k); }).join(''));
            return drill(l.label, kidId);
          }).join('');

          if (c.heading === 'Boroughs') {
            inner += link({ label: 'All Neighborhoods \u2192',
                            href: '/neighborhoods/', viewall: true });
          }
          panel(id, 'mnp-root', 'Menu', c.heading, inner);
        });
      } else {
        root += g.links.map(function (l) { return link(l); }).join('');
      }
    });

    root += '<div class="mobile-nav-divider"></div>' +
            NAV.utility.map(function (l) { return link(l); }).join('');

    return '<div class="mnav-panel is-root" id="mnp-root">' + root + '</div>' +
           panels.join('');
  }

  // ---------------------------------------------------------------- render
  mount.outerHTML =
    '<header class="topbar">' +
      '<button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="siteNav" aria-label="Toggle menu">' +
        '<span></span><span></span><span></span>' +
      '</button>' +
      '<div class="topbar-brand">' +
        '<a href="/"><img class="topbar-logo" src="/assets/logo-header.png" alt="NYC Pizza Map" /></a>' +
        '<a href="/" style="text-decoration:none;">' +
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
