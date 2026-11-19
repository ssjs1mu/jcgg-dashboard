/* Joshi's Corner - phone & tablet helper (every page).
   A table wider than the screen is wrapped in its own sideways-scroll box, so the PAGE never scrolls sideways;
   the box's first column stays pinned (mobile.css) with the table's own background colour.
   Only acts on screens up to 1024px wide and only on tables that actually overflow; re-checks when the page redraws. */
(function () {
  var MAXW = 1024, busy = false;
  function bgOf(el) {
    for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
      var c = getComputedStyle(e).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c)) return c;
    }
    return getComputedStyle(document.body).backgroundColor || '#0f1a2b';
  }
  function scroller(el) {
    for (var e = el, i = 0; e && i < 4; e = e.parentElement, i++) {
      var o = getComputedStyle(e).overflowX; if (o === 'auto' || o === 'scroll') return e;
    }
    return null;
  }
  function fix() {
    busy = false;
    if (window.innerWidth > MAXW) return;
    var W = document.documentElement.clientWidth;
    document.querySelectorAll('table').forEach(function (t) {
      if (t.closest('.m-sx') || t.offsetParent === null) return;
      var p = t.parentElement; if (!p) return;
      var r = t.getBoundingClientRect();
      if (r.width <= p.clientWidth + 2 && r.right <= W + 2) return;     // fits
      if (scroller(p)) return;                                           // already scrolls inside a box
      var box = document.createElement('div'); box.className = 'm-sx';
      p.insertBefore(box, t); box.appendChild(t);
      box.style.setProperty('--m-bg', bgOf(t));
    });
  }
  function later() { if (!busy) { busy = true; (window.requestIdleCallback || setTimeout)(fix, 250); } }
  document.addEventListener('DOMContentLoaded', function () {
    var v = document.querySelector('meta[name=viewport]');
    if (!v) { v = document.createElement('meta'); v.name = 'viewport'; v.content = 'width=device-width,initial-scale=1'; document.head.appendChild(v); }
    fix();
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
    addEventListener('resize', later); addEventListener('orientationchange', later);
  });
})();
