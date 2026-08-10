// ===== Mobile nav toggle =====
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('mobileNav');

  function closeDrawer() {
    if (drawer) drawer.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && drawer) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !drawer.hidden;
      drawer.hidden = isOpen;
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close when a link inside drawer is clicked
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeDrawer);
    });
  }

  // Close drawer when clicking anywhere outside the topbar/drawer
  document.addEventListener('click', (e) => {
    if (!drawer || drawer.hidden) return;
    const topbar = document.querySelector('.topbar');
    if (topbar && !topbar.contains(e.target) && !drawer.contains(e.target)) {
      closeDrawer();
    }
  });

  // Also close when the map canvas is touched/clicked
  const mapEl = document.getElementById('map');
  if (mapEl) {
    mapEl.addEventListener('click', closeDrawer);
    mapEl.addEventListener('touchstart', closeDrawer, { passive: true });
  }

  // Explore dropdown
  const dropdown = document.getElementById('exploreDropdown');
  if (dropdown) {
    const btn = dropdown.querySelector('.nav-dropdown-btn');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    dropdown.querySelectorAll('.nav-dropdown-menu a').forEach(a => {
      a.addEventListener('click', () => {
        dropdown.classList.remove('open');
      });
    });
  }
});

// ===== Global search on non-map pages =====
// index.html wires its own search directly in map.js (it can fly the map
// there instead of navigating away). Every other page uses this generic
// version instead — same search engine, but selecting anything just
// navigates to the map page and centers there.
(function() {
  const isMapPage = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname.endsWith('/');
  if (isMapPage) return;

  const searchIconBtn = document.getElementById('searchIconBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  if (!searchIconBtn || !searchOverlay) return;

  const globalSearchInput = document.getElementById('globalSearchInput');
  const globalSearchResults = document.getElementById('globalSearchResults');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  let pizzaFeaturesCache = null;

  const CATEGORY_ICONS = {
    'Pizzerias': '🍕', 'Neighborhoods': '📍', 'Landmarks & Attractions': '🗽',
    'Venues': '🎭', 'Hotels': '🏨', 'Transit': '🚇', 'Shopping & Markets': '🛍️', 'Activities': '⭐',
  };

  function openOverlay() {
    searchOverlay.hidden = false;
    setTimeout(() => globalSearchInput && globalSearchInput.focus(), 50);
    if (!pizzaFeaturesCache) {
      fetch('data.json').then(r => r.json()).then(d => { pizzaFeaturesCache = d.features; }).catch(() => {});
    }
  }
  function closeOverlay() {
    searchOverlay.hidden = true;
    if (globalSearchInput) globalSearchInput.value = '';
    renderResults('');
  }
  function renderResults(query) {
    if (!globalSearchResults) return;
    if (!query.trim()) {
      globalSearchResults.innerHTML = '<p class="search-hint">Search pizzerias, neighborhoods, landmarks, venues, or hotels — start typing above.</p>';
      return;
    }
    if (typeof searchDestinations !== 'function') {
      globalSearchResults.innerHTML = '<p class="search-hint">Search is still loading — try again in a moment.</p>';
      return;
    }
    const groups = searchDestinations(query, {
      includePizzerias: true,
      pizzeriaFeatures: pizzaFeaturesCache || [],
      maxResults: 8,
    });
    if (!groups.length) {
      globalSearchResults.innerHTML = '<p class="search-hint">No matches. Try a different spelling or a nearby landmark.</p>';
      return;
    }
    globalSearchResults.innerHTML = groups.map(g => `
      <div class="search-group-heading">${g.category}</div>
      ${g.items.map(item => `
        <div class="search-result-item" data-type="${item.type}" data-category="${item.category}" data-name="${item.name.replace(/"/g,'&quot;')}" data-lat="${item.lat}" data-lng="${item.lng}">
          <span class="search-result-icon">${CATEGORY_ICONS[item.category] || '📍'}</span>
          <div class="search-result-text">
            <div class="search-result-name">${item.name}</div>
            ${item.subtitle ? `<div class="search-result-subtitle">${item.subtitle}</div>` : ''}
          </div>
        </div>
      `).join('')}
    `).join('');
  }

  searchIconBtn.addEventListener('click', openOverlay);
  if (searchCloseBtn) searchCloseBtn.addEventListener('click', closeOverlay);

  document.addEventListener('click', (e) => {
    if (searchOverlay.hidden) return;
    const inner = searchOverlay.querySelector('.search-overlay-inner');
    const clickedInside = inner && inner.contains(e.target);
    const clickedIcon = e.target === searchIconBtn || searchIconBtn.contains(e.target);
    if (!clickedInside && !clickedIcon) closeOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !searchOverlay.hidden) closeOverlay();
  });

  if (globalSearchInput) {
    let debounce;
    globalSearchInput.addEventListener('input', e => {
      clearTimeout(debounce);
      const val = e.target.value;
      debounce = setTimeout(() => renderResults(val), 120);
    });
  }

  if (globalSearchResults) {
    globalSearchResults.addEventListener('click', e => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      const { type, name, category, lat, lng } = item.dataset;
      if (type === 'pizzeria') {
        window.location.href = 'index.html?pin=' + encodeURIComponent(name);
      } else {
        const isNeighborhood = category === 'Neighborhoods' ? '1' : '0';
        window.location.href = 'index.html?lat=' + lat + '&lng=' + lng +
          '&label=' + encodeURIComponent(name) + '&isNeighborhood=' + isNeighborhood;
      }
    });
  }
})();
