/* Joshi's Corner - SSJ Finance light theme for pages built dark (Watchlist, Tomorrow's Calls).
   Same palette as the reports: cream page, white cards, olive accents (#676300 / #A7A15D), green #1C820D, red #D00000.
   Every colour of the page's own styles, of inline styles drawn later (tiles, popups, tables) and of the chart is
   re-mapped by its ROLE: background -> cream / white / pale tint of its hue, text -> dark ink or the SSJ accent of its hue,
   border -> soft khaki or accent, glow -> soft olive. The header band stays olive with the gold Joshi's Corner script.
   Load it right after the page's own <style> blocks. */
(function () {
  'use strict';
  var R = document.documentElement;
  R.classList.add('ssj');

  /* ---------- colour helpers ---------- */
  function parse(c) {
    var m;
    c = c.trim().toLowerCase();
    if ((m = c.match(/^#([0-9a-f]{3,8})$/))) {
      var h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map(function (x) { return x + x; }).join('');
      return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16), h.length === 8 ? parseInt(h.substr(6, 2), 16) / 255 : 1];
    }
    if ((m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/))) {
      var a = m[4] == null ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
      return [+m[1], +m[2], +m[3], a];
    }
    if (c === 'white') return [255, 255, 255, 1];
    if (c === 'black') return [0, 0, 0, 1];
    return null;
  }
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function fam(h, s) {          // hue family of a colour
    if (s < 0.22) return 'n';
    if (h >= 75 && h < 170) return 'g';
    if (h >= 320 || h < 20) return 'r';
    if (h >= 20 && h < 75) return 'y';
    return 'b';                 // cyan, blue, violet
  }
  function rgba(hex, a) {
    var p = parse(hex);
    return a >= 0.999 ? hex : 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + (+a.toFixed(3)) + ')';
  }
  var BG = { g: '#E3F1DF', r: '#F8E3E1', y: '#F3ECCF', b: '#EEEAD5' },
      FILL = { g: '#D3EBCD', r: '#F5D3CF', y: '#EFE4B8', b: '#E6E1C2', n: '#ffffff' },
      INK = { g: '#1C820D', r: '#C00000', y: '#7A6200', b: '#676300' },
      LINE = { g: '#8DC487', r: '#E29A93', y: '#C9B66A', b: '#B9B37A' };
  function map(c, role) {
    var p = parse(c);
    if (!p || p[3] === 0) return c;
    var t = hsl(p[0], p[1], p[2]), f = fam(t[0], t[1]), L = t[2], a = p[3];
    if (role === 'bg') {
      if (L < 0.45) {
        if (f !== 'n' && t[1] > 0.35 && L > 0.12) return rgba(BG[f], a);
        return rgba(L < 0.105 ? '#F4F1E1' : L < 0.2 ? '#FFFFFF' : L < 0.3 ? '#F4F1E2' : '#E9E5CB', a);
      }
      return rgba(f === 'n' ? (L > 0.9 ? '#FFFFFF' : '#ECE8D2') : FILL[f], a);
    }
    if (role === 'text') {
      if (L > 0.6) return rgba(f === 'n' ? (L > 0.8 ? '#2E2C14' : '#6E6A45') : INK[f], a);
      if (L < 0.25) return c;
      return rgba(f === 'n' ? '#6E6A45' : INK[f], a);
    }
    if (role === 'line') {
      if (f === 'n' || (L < 0.3 && t[1] < 0.5)) return rgba('#DCD6B4', a);
      return rgba(LINE[f], a);
    }
    if (role === 'glow') {
      if (f === 'n') return rgba('#3b3a20', Math.min(a, 0.18));
      return rgba(INK[f] === '#7A6200' ? '#A7A15D' : INK[f], Math.min(a, 0.3));
    }
    return c;
  }
  var CRX = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b/g;
  function roleOf(prop) {
    if (/^--/.test(prop)) return VARS[prop] || null;
    if (/shadow/.test(prop)) return 'glow';
    if (/^background|^scrollbar-color/.test(prop)) return /^scrollbar/.test(prop) ? 'line' : 'bg';
    if (/border|outline|column-rule|text-decoration-color/.test(prop)) return 'line';
    if (/^(color|caret-color|-webkit-text-fill-color|fill|stroke|accent-color)$/.test(prop)) return 'text';
    return null;
  }
  /* custom properties of the pages: what each one is used as */
  var VARS = { '--bg': 'bg', '--card': 'bg', '--bg0': 'bg', '--bg1': 'bg', '--line': 'line', '--tx': 'text', '--mu': 'text',
               '--up': 'text', '--dn': 'text', '--gold': 'text', '--av': 'text', '--m1': 'line', '--m2': 'line', '--mglow': 'glow' };
  function remapValue(prop, v) {
    var role = roleOf(prop);
    if (!role || !v || v.indexOf('var(') === 0 && v.indexOf('#') < 0 && v.indexOf('rgb') < 0) return null;
    var out = v.replace(CRX, function (c) { return map(c, role); });
    return out === v ? null : out;
  }

  /* ---------- page styles (own <style> blocks only; mobile.css / fonts are left alone) ---------- */
  var KEEP = /(^|[\s,>+~])h1\b|\.tvv|\.tvph|#tvBox|video|\.chw\b|jcThemeB|\.top\b|#pbM|#pbPill|#lrM|#lrPill|#lqM|#lqPill/;  // brand script, TV, header band handled below
  function doRules(rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.cssRules && !r.style) { doRules(r.cssRules); continue; }
      if (r.type === 7 /* keyframes */) { doRules(r.cssRules); continue; }
      if (!r.style) continue;
      if (r.selectorText && KEEP.test(r.selectorText)) continue;
      var st = r.style;
      for (var j = st.length - 1; j >= 0; j--) {
        var p = st[j], v = st.getPropertyValue(p), nv = remapValue(p, v);
        if (nv != null) st.setProperty(p, nv, st.getPropertyPriority(p));
      }
    }
  }
  function doSheets() {
    [].forEach.call(document.querySelectorAll('style'), function (el) {
      if (el.id === 'ssjBase' || el.dataset.ssj) return;
      try { if (el.sheet) { doRules(el.sheet.cssRules); el.dataset.ssj = '1'; } } catch (e) { }
    });
  }

  /* ---------- inline styles drawn by the page (tiles, tables, popups) ---------- */
  function doEl(el) {
    if (!el.getAttribute || el.closest && el.closest('h1,.tvv,.tvph,#tvBox,video,#pbM,#lrM,#lqM')) return;
    var s = el.getAttribute('style');
    if (!s || el.__ssj === s) return;
    var st = el.style, ch = false;
    for (var j = st.length - 1; j >= 0; j--) {
      var p = st[j], v = st.getPropertyValue(p), nv = remapValue(p, v);
      if (nv != null) { st.setProperty(p, nv, st.getPropertyPriority(p)); ch = true; }
    }
    el.__ssj = el.getAttribute('style');
  }
  function doTree(root) {
    if (root.nodeType !== 1) return;
    doEl(root);
    var all = root.querySelectorAll('[style]');
    for (var i = 0; i < all.length; i++) doEl(all[i]);
  }

  /* ---------- chart library: remap colour options by their key ---------- */
  function chartOpts(o, k) {
    if (typeof o === 'string') {
      var role = /background|top|bottom/i.test(k) ? 'bg' : /text/i.test(k) ? 'text' : /grid|line|border|separator|vert|horz/i.test(k) ? 'line' : 'text';
      return o.replace(CRX, function (c) { return map(c, role); });
    }
    if (o && typeof o === 'object' && !Array.isArray(o)) {
      var n = {};
      for (var key in o) n[key] = chartOpts(o[key], key === 'color' ? k : key);
      return n;
    }
    return o;
  }
  function hookCharts() {
    var L = window.LightweightCharts;
    if (!L || L.__ssj) return;
    var cc = L.createChart;
    L.createChart = function (el, opts) {
      var ch = cc.call(L, el, chartOpts(opts || {}, 'chart'));
      var ao = ch.applyOptions;
      ch.applyOptions = function (o) { return ao.call(ch, chartOpts(o, 'chart')); };
      return ch;
    };
    L.__ssj = 1;
  }

  /* ---------- fixed parts: header band, mood aura ---------- */
  var base = document.createElement('style');
  base.id = 'ssjBase';
  base.textContent =
    'html.ssj,html.ssj body{background:#F7F4E6!important;color:#2E2C14}' +
    'html.ssj body::before{opacity:.55}' +
    'html.ssj{--m1:#A7A15D;--m2:#D9D3A6;--mglow:rgba(103,99,0,.10);--bg0:#F7F4E6;--bg1:#EFEBD6}' +
    'html.ssj .top{background:linear-gradient(180deg,#5f5b00,#3f3c00)!important;border:0!important;border-radius:14px;padding:8px 12px!important;color:#F3EFD6}' +
    'html.ssj .top h1{color:#e0c27a!important;text-shadow:0 2px 8px rgba(0,0,0,.35)!important}' +
    'html.ssj .top .st,html.ssj .top .st *,html.ssj .top .mu,html.ssj .top small,html.ssj .top .bmz,html.ssj .top .bmz *{color:#EDE8C8!important}' +
    'html.ssj .top a.sw{background:linear-gradient(180deg,#F3EFD6,#D9D3A6)!important;color:#3f3c00!important;border:0!important}' +
    'html.ssj .top a.sw.on{background:transparent!important;color:#F3EFD6!important;border:1px solid #F3EFD6!important}' +
    'html.ssj th{background:#676300!important;color:#FFFFFF!important}' +
    'html.ssj ::-webkit-scrollbar-thumb{background:#B9B37A}' +
    'html.ssj #jcThemeB{display:none!important}';
  document.head.appendChild(base);

  function run() { doSheets(); doTree(document.body || R); hookCharts(); }
  doSheets();
  document.addEventListener('DOMContentLoaded', function () {
    run();
    var mo = new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'attributes') doEl(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1) { if (n.tagName === 'STYLE') { try { doRules(n.sheet.cssRules); n.dataset.ssj = '1'; } catch (e) { } } else doTree(n); }
        }
      }
      hookCharts();
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
  });
  window.addEventListener('load', run);
  var hk = setInterval(function () { hookCharts(); if (window.LightweightCharts && window.LightweightCharts.__ssj) clearInterval(hk); }, 250);
})();
