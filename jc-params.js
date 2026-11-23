/* Joshi's Corner - logic parameters from the master Google Sheet "JC Logic & Formula Reference" (tab Parameters).
   Order: 1) backend action=params (reads the sheet live, cached 10 min on the server)  2) GitHub copy jc-stock-analyst/data/params.json
   3) the built-in values below (identical to the sheet on 24-Nov-2026), so a page never waits on the sheet or breaks without it.
   Last good set is kept in this browser (jc_params_v1) and used instantly on the next load. Values outside a sane range are ignored. */
(function () {
  if (window.JCP) return;
  const BE = 'https://script.google.com/macros/s/AKfycbzMp82oHzLzKpaE0LrnUqEGGot7jqSw9e9VA1QhJNOPV35vOIYcfIChFL5PCDuD2Ahi5Q/exec';
  const GH = 'https://raw.githubusercontent.com/ssjs1mu/jc-stock-analyst/main/data/params.json';
  const LS = 'jc_params_v1';
  /* key: [default, min, max]  (min/max = sanity range; a sheet value outside it is ignored) */
  const SPEC = {
    IND_RSI_PERIOD: [14, 2, 50], IND_ATR_PERIOD: [14, 2, 50],
    WL_EMA_FAST: [9, 2, 50], WL_EMA_SLOW: [21, 3, 100],
    WL_W_TREND: [25, 0, 60], WL_W_SLOPE: [10, 0, 40], WL_W_LTP_EMA: [10, 0, 40], WL_W_REF: [15, 0, 40], WL_W_RSI: [10, 0, 40],
    RSI_BULL: [55, 50, 70], RSI_BEAR: [45, 30, 50], WL_RSI_HOT: [75, 60, 95], WL_RSI_COLD: [25, 5, 40], WL_W_RSI_X: [8, 0, 30],
    WL_VOL_HI: [1.15, 1, 3], WL_VOL_LO: [0.85, 0.3, 1], WL_W_VOL: [15, 0, 40], WL_W_CROSS: [15, 0, 40], WL_CROSS_BARS: [3, 0, 20], WL_VOL_DAMP: [0.8, 0.3, 1],
    WL_CALL_SCORE: [45, 10, 95], WL_RISK_EXTRA_ATR: [0.25, 0, 2], WL_SL_MIN_ATR: [1, 0.2, 5], WL_SL_MAX_ATR: [3, 0.5, 10],
    CR_IDX_MU: [0.11, 0, 0.3], CR_MKT_MU: [0.12, 0, 0.3], CR_CAGR_W: [0.25, 0, 1], CR_CAGR_MIN: [-0.15, -0.6, 0], CR_CAGR_MAX: [0.30, 0, 1],
    CR_ADJ_STRONG: [0.02, -0.1, 0.1], CR_ADJ_UP: [0.01, -0.1, 0.1], CR_ADJ_SIDE: [-0.01, -0.1, 0.1], CR_ADJ_DOWN: [-0.03, -0.1, 0.1],
    CR_STRETCH: [1.25, 1, 3], CR_STRETCH_PEN: [0.02, 0, 0.1], CR_WL_TILT: [0.02, 0, 0.1],
    CR_MU_MIN: [0.02, -0.2, 0.2], CR_MU_MAX: [0.16, 0, 0.5], CR_VOL_CAP: [0.40, 0.05, 2], CR_RHO: [0.4, 0, 1],
    CR_FD_RATE: [6.25, 0, 15], CR_SB_RATE: [2.5, 0, 10]
  };
  const DATES = { CR_FD_RATE_FROM: '2025-06-15', CR_SB_RATE_FROM: '2025-06-15' };
  const P = {}; Object.keys(SPEC).forEach((k) => { P[k] = SPEC[k][0]; }); Object.assign(P, DATES);
  const st = { src: 'built-in', at: null, bad: [] };
  function apply(obj, src, at) {
    if (!obj || typeof obj !== 'object') return 0; let n = 0; const bad = [];
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (SPEC[k]) { const x = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,%\s]/g, '')); if (isFinite(x) && x >= SPEC[k][1] && x <= SPEC[k][2]) { P[k] = x; n++; } else bad.push(k); }
      else if (DATES[k] && /^\d{4}-\d{2}-\d{2}$/.test(String(v).trim())) { P[k] = String(v).trim(); n++; }
    });
    if (n) { st.src = src; st.at = at || null; st.bad = bad; }
    return n;
  }
  try { const c = JSON.parse(localStorage.getItem(LS) || 'null'); if (c && c.p) apply(c.p, c.src + ' (saved)', c.at); } catch (e) { }
  const getJ = (u, ms) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout')), ms); fetch(u, { cache: 'no-store' }).then((r) => r.json()).then((j) => { clearTimeout(t); ok(j); }, (e) => { clearTimeout(t); no(e); }); });
  async function load() {
    for (const [u, src] of [[BE + '?action=params', 'sheet'], [GH + '?x=' + Math.floor(Date.now() / 600000), 'GitHub copy']]) {
      try { const j = await getJ(u, 7000); if (j && j.params && apply(j.params, src, j.at)) { try { localStorage.setItem(LS, JSON.stringify({ p: j.params, src, at: j.at || null })); } catch (e) { } return st; } } catch (e) { }
    }
    return st;
  }
  const ready = load();
  window.JCP = { P, get: (k) => P[k], ready, state: st, wait: (ms) => Promise.race([ready, new Promise((r) => setTimeout(r, ms || 4000))]) };
})();
