// Google star ratings for NYC Pizza Map.
//
//   <span class="g-rating" data-place-id="ChIJ..."></span>
//
// Static pages: nothing to do, it self-starts on DOMContentLoaded.
// Content built after load: GoogleRating.hydrate(container)
// Long lists: GoogleRating.hydrate(container, { lazy: true })  <- fetches on scroll
// NOTE: assigned to window deliberately. A top-level `const` lives in the
// global lexical scope, not on the window object, so `window.GoogleRating`
// would be undefined and the hydrate() guards on other pages would silently
// never fire.
window.GoogleRating = (() => {
  const CSS = `
.g-rating{--g-star:#c8102e;--g-txt:#6b6660;display:inline-block;min-height:1.2em}
.g-rating-cell{grid-column:1/-1}
.g-rating__link{display:inline-flex;align-items:center;gap:.4em;white-space:nowrap;text-decoration:none;color:var(--g-txt);font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;font-size:.8125rem;line-height:1;border-bottom:1px solid transparent;transition:border-color .15s}
.g-rating__link:hover{border-bottom-color:var(--g-txt)}
.g-rating__stars{display:inline-flex;gap:1px;color:var(--g-star)}
.g-star{width:.9em;height:.9em;display:block}
.g-rating__num{font-weight:600;color:#1a1a1a}
.g-rating__src{font-weight:500}
.g-rating__sep{opacity:.4}
.g-rating__num,.g-rating__count{font-variant-numeric:tabular-nums}
.ticket .g-rating__link,.ps-entry .g-rating__link{font-size:.72rem}
/* On the dark green card header: red stars stay, the number goes cream so it
   reads as sibling to the address, and the attribution sits back quietly. */
.ticket-head .g-rating{margin-top:7px}
.ticket-head .g-rating__stars{color:#DC2225}
.ticket-head .g-rating__num{color:var(--color-parchment,#FDF4E7)}
.ticket-head .g-rating__link,.ticket-head .g-rating__count,.ticket-head .g-rating__src{color:rgba(253,244,231,.72)}
.ticket-head .g-rating__link:hover{border-bottom-color:rgba(253,244,231,.5)}
@media(max-width:480px){.g-rating__link{font-size:.75rem}}`;

  const memo = new Map();
  let uid = 0;

  function styles() {
    if (document.getElementById('g-rating-css')) return;
    const s = document.createElement('style');
    s.id = 'g-rating-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function get(id) {
    if (!memo.has(id)) {
      memo.set(id, fetch(`/api/rating?place_id=${encodeURIComponent(id)}`)
        .then(r => r.ok ? r.json() : null).catch(() => null));
    }
    return memo.get(id);
  }

  function stars(n) {
    const full = Math.floor(n);
    const half = n - full >= 0.25 && n - full < 0.75;
    const bonus = n - full >= 0.75 ? 1 : 0;
    const gid = `gh${uid++}`;
    let out = '';
    for (let i = 0; i < 5; i++) {
      const on = i < full + bonus, h = half && i === full;
      out += `<svg viewBox="0 0 20 20" aria-hidden="true" class="g-star">${h ? `<defs><linearGradient id="${gid}"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs>` : ''}<path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L1.5 7.7l5.9-.9z" fill="${h ? `url(#${gid})` : on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
    }
    return out;
  }

  function load(el) {
    const id = el.dataset.placeId;
    if (!id) return;
    el.classList.add('is-loading');
    get(id).then(d => {
      el.classList.remove('is-loading');
      if (!d || d.rating == null) { (el.closest('.g-rating-cell') || el).remove(); return; }
      const c = d.count.toLocaleString('en-US');
      el.innerHTML = `<a class="g-rating__link" href="${d.url}" target="_blank" rel="noopener nofollow" aria-label="Rated ${d.rating} out of 5 by ${c} Google reviews"><span class="g-rating__stars" aria-hidden="true">${stars(d.rating)}</span><span class="g-rating__num">${d.rating.toFixed(1)}</span><span class="g-rating__sep" aria-hidden="true">·</span><span class="g-rating__count">${c} <span class="g-rating__src">Google</span> reviews</span></a>`;
      el.classList.add('is-loaded');
    });
  }

  // Lazy mode: only fetch a card's rating once it's near the viewport, so a
  // 300-result list doesn't fire 300 requests the moment it renders.
  let io = null;
  function observer() {
    if (!io) {
      io = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          obs.unobserve(e.target);
          load(e.target);
        });
      }, { rootMargin: '300px 0px' });
    }
    return io;
  }

  function hydrate(root = document, opts = {}) {
    styles();
    const els = root.querySelectorAll('.g-rating:not(.is-loaded):not(.is-loading)');
    if (opts.lazy && 'IntersectionObserver' in window) {
      const ob = observer();
      els.forEach(el => ob.observe(el));
    } else {
      els.forEach(load);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hydrate());
  else hydrate();

  return { hydrate };
})();
