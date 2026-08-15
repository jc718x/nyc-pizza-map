// Google ratings + opening hours for NYC Pizza Map.
//
//   <span class="g-rating" data-place-id="ChIJ..."></span>
//   <span class="g-hours"  data-place-id="ChIJ..."></span>          compact status
//   <span class="g-hours"  data-place-id="ChIJ..." data-full="1"></span>   + full week
//
// Static pages self-start. Content built after load: GoogleRating.hydrate(el).
// Long lists: GoogleRating.hydrate(el, { lazy: true }).
//
// Open/closed is computed here from the visitor's own clock, never cached —
// Google's own `openNow` is a request-time value and would be wrong within
// the hour. Holiday closures are not in the weekly pattern, which is why the
// hours link out to Google.
window.GoogleRating = (() => {
  const CSS = `
.g-rating,.g-hours{--g-star:#c8102e;--g-txt:#6b6660;display:inline-block;min-height:1.2em}
.g-rating-cell{grid-column:1/-1}
.g-rating__link,.g-hours__link{display:inline-flex;align-items:center;gap:.4em;white-space:nowrap;text-decoration:none;color:var(--g-txt);font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;font-size:.8125rem;line-height:1;border-bottom:1px solid transparent;transition:border-color .15s}
.g-rating__link:hover,.g-hours__link:hover{border-bottom-color:var(--g-txt)}
.g-rating__stars{display:inline-flex;gap:1px;color:var(--g-star)}
.g-star{width:.9em;height:.9em;display:block}
.g-rating__num{font-weight:600;color:#1a1a1a}
.g-rating__src{font-weight:500}
.g-rating__sep{opacity:.4}
.g-rating__num,.g-rating__count{font-variant-numeric:tabular-nums}
.g-dot{width:.5em;height:.5em;border-radius:50%;flex:0 0 auto;background:#9a948c}
.g-hours--open .g-dot{background:#2e7d32}
.g-hours--open .g-hours__state{color:#2e7d32;font-weight:600}
.g-hours__state{font-weight:600;color:#1a1a1a}
.g-hours__rest{opacity:.75}
.g-hours__toggle{display:inline-flex;align-items:center;gap:.4em;white-space:nowrap;background:none;border:0;padding:0;cursor:pointer;font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;font-size:.8125rem;line-height:1;color:var(--g-txt)}
.g-hours__caret{font-size:.9em;opacity:.6;transition:transform .18s ease}
.g-hours__toggle[aria-expanded="true"] .g-hours__caret{transform:rotate(180deg)}
.g-week{margin:8px 0 0;font-family:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;font-size:.72rem;line-height:1.75;color:var(--g-txt)}
.g-week[hidden]{display:none}
.g-week div{display:flex;justify-content:space-between;gap:16px}
.g-week .is-today{font-weight:600;color:#1a1a1a}
.g-week__src{display:inline-block;margin-top:5px;opacity:.65;font-size:.66rem;color:inherit;text-decoration:none}
.g-week__src:hover{text-decoration:underline}
.ticket .g-rating__link,.ps-entry .g-rating__link,.ticket .g-hours__link,.ps-entry .g-hours__link{font-size:.72rem}
/* Dark green card header: two stacked lines — status first, then rating.
   display:block is what splits them; inline-block would let them sit side by
   side and wrap mid-phrase in a narrow card. */
.ticket-head .g-rating,.ticket-head .g-hours{display:block}
.ticket-head .g-rating{margin-top:9px}
.ticket-head .g-hours{margin-top:4px}
.ticket-head .g-hours__toggle{color:rgba(253,244,231,.72)}
.ticket-head .g-week{color:rgba(253,244,231,.75)}
.ticket-head .g-week .is-today{color:var(--color-parchment,#FDF4E7)}
.ticket-head .g-rating__stars{color:#DC2225}
.ticket-head .g-rating__num,.ticket-head .g-hours__state{color:var(--color-parchment,#FDF4E7)}
.ticket-head .g-hours--open .g-hours__state{color:#8FD3A0}
.ticket-head .g-hours--open .g-dot{background:#8FD3A0}
.ticket-head .g-rating__link,.ticket-head .g-rating__count,.ticket-head .g-rating__src,.ticket-head .g-hours__link{color:rgba(253,244,231,.72)}
.ticket-head .g-rating__link:hover,.ticket-head .g-hours__link:hover{border-bottom-color:rgba(253,244,231,.5)}
@media(max-width:480px){.g-rating__link,.g-hours__link{font-size:.75rem}}`;

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // ---- stars ----
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

  // ---- hours ----
  const mins = t => t.day * 1440 + t.hour * 60 + (t.minute || 0);
  function clock(t) {
    let h = t.hour % 12; if (h === 0) h = 12;
    return t.minute ? `${h}:${String(t.minute).padStart(2, '0')} ${t.hour >= 12 ? 'PM' : 'AM'}`
                    : `${h} ${t.hour >= 12 ? 'PM' : 'AM'}`;
  }

  function status(periods, now) {
    if (!periods || !periods.length) return null;
    if (periods.length === 1 && !periods[0].close) return { open: true, state: 'Open 24 hours', rest: '' };

    const WEEK = 10080;
    const nowMin = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();

    for (const p of periods) {
      if (!p.open || !p.close) continue;
      const start = mins(p.open);
      let end = mins(p.close);
      if (end <= start) end += WEEK;            // closes after midnight
      if ((nowMin >= start && nowMin < end) || (nowMin + WEEK >= start && nowMin + WEEK < end)) {
        return { open: true, state: 'Open now', rest: `until ${clock(p.close)}` };
      }
    }

    let best = null;
    for (const p of periods) {
      if (!p.open) continue;
      let wait = mins(p.open) - nowMin;
      if (wait < 0) wait += WEEK;
      if (best === null || wait < best.wait) best = { wait, p };
    }
    if (!best) return { open: false, state: 'Closed', rest: '' };
    const today = best.p.open.day === now.getDay() && best.wait < 1440;
    return {
      open: false,
      state: 'Closed',
      rest: today ? `opens ${clock(best.p.open)}`
                  : `opens ${DAYS[best.p.open.day]} ${clock(best.p.open)}`
    };
  }

  function renderHours(el, d) {
    const h = d && d.hours;
    const st = h && status(h.periods, new Date());
    if (!st) { (el.closest('.g-rating-cell') || el).remove(); return; }

    const hasWeek = !!(h.week && h.week.length);
    const wid = `gw${uid++}`;

    // The full week hangs off the status line as a disclosure rather than
    // sitting open — the status is what someone needs at a glance, the week is
    // what they need when planning. This panel is also where the attribution
    // for the hours lives.
    let week = '';
    if (hasWeek) {
      const todayIdx = (new Date().getDay() + 6) % 7;   // Google lists Monday first
      week = `<div class="g-week" id="${wid}" hidden>${h.week.map((line, i) => {
        const [day, ...rest] = String(line).split(': ');
        return `<div class="${i === todayIdx ? 'is-today' : ''}"><span>${esc(day)}</span><span>${esc(rest.join(': '))}</span></div>`;
      }).join('')}<a class="g-week__src" href="${esc(d.url)}" target="_blank" rel="noopener nofollow">Hours via Google &#8599;</a></div>`;
    }

    const inner =
      `<span class="g-dot" aria-hidden="true"></span><span class="g-hours__state">${st.state}</span>` +
      // "Open now until 9:30 PM" reads as one phrase; "Closed opens Wed" doesn't,
      // so the separator only appears when it's needed.
      (st.rest ? `<span class="g-hours__rest">${st.open ? '' : '· '}${st.rest}</span>` : '');

    if (st.open) el.classList.add('g-hours--open');
    el.innerHTML = hasWeek
      ? `<button type="button" class="g-hours__toggle" aria-expanded="false" aria-controls="${wid}">` +
        `${inner}<span class="g-hours__caret" aria-hidden="true">&#9662;</span></button>${week}`
      : `<a class="g-hours__link" href="${esc(d.url)}" target="_blank" rel="noopener nofollow">${inner}</a>`;
    el.classList.add('is-loaded');
  }

  // One delegated listener rather than one per card — popups and search results
  // are rebuilt constantly, and per-element handlers would leak with them.
  document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('.g-hours__toggle');
    if (!btn) return;
    e.preventDefault();
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.hidden = open;
  });

  function renderRating(el, d) {
    if (!d || d.rating == null) { (el.closest('.g-rating-cell') || el).remove(); return; }
    const c = d.count.toLocaleString('en-US');
    el.innerHTML = `<a class="g-rating__link" href="${esc(d.url)}" target="_blank" rel="noopener nofollow" aria-label="Rated ${d.rating} out of 5 by ${c} Google reviews"><span class="g-rating__stars" aria-hidden="true">${stars(d.rating)}</span><span class="g-rating__num">${d.rating.toFixed(1)}</span><span class="g-rating__sep" aria-hidden="true">·</span><span class="g-rating__count">${c} <span class="g-rating__src">Google</span> reviews</span></a>`;
    el.classList.add('is-loaded');
  }

  function load(el) {
    const id = el.dataset.placeId;
    if (!id) return;
    const isHours = el.classList.contains('g-hours');
    el.classList.add('is-loading');
    get(id).then(d => {
      el.classList.remove('is-loading');
      isHours ? renderHours(el, d) : renderRating(el, d);
    });
  }

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
    const sel = '.g-rating:not(.is-loaded):not(.is-loading),.g-hours:not(.is-loaded):not(.is-loading)';
    const els = root.querySelectorAll(sel);
    if (opts.lazy && 'IntersectionObserver' in window) {
      const ob = observer();
      els.forEach(el => ob.observe(el));
    } else {
      els.forEach(load);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hydrate());
  else hydrate();

  return { hydrate, _status: status };
})();
