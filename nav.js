// ===== Mobile nav toggle =====
// Shared across all pages. On mobile the topbar-nav is hidden;
// the hamburger reveals a full-width drawer below the topbar.
document.addEventListener('DOMContentLoaded', () => {
  const toggle   = document.getElementById('navToggle');
  const drawer   = document.getElementById('mobileNav');
  if (!toggle || !drawer) return;

  toggle.addEventListener('click', () => {
    const isOpen = !drawer.hidden;
    drawer.hidden = isOpen;
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close drawer when a link is clicked
  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      drawer.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
});
