// ===== Mobile nav toggle =====
// Shared across all pages (index, store, how-to-make-pizza, about) —
// collapses the side nav into a hamburger menu on small screens.
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navToggle');
  const masthead = document.querySelector('.masthead');
  if (!toggle || !masthead) return;

  toggle.addEventListener('click', () => {
    const isOpen = masthead.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
});
