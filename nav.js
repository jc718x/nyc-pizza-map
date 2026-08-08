// ===== Mobile nav toggle =====
document.addEventListener('DOMContentLoaded', () => {
  // Mobile hamburger drawer
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('mobileNav');
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const isOpen = !drawer.hidden;
      drawer.hidden = isOpen;
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
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

    // Close when clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });

    // Close when a dropdown link is clicked
    dropdown.querySelectorAll('.nav-dropdown-menu a').forEach(a => {
      a.addEventListener('click', () => {
        dropdown.classList.remove('open');
      });
    });
  }
});
