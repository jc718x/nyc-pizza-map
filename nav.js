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
