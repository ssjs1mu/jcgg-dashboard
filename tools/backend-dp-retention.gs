/* ===================== Client uploads on Google Drive: keep what matters, trash the rest =====================
   In the "JC_STOCK_URL" Apps Script project (Portfolio backend), at the END of Code.gs.
   Per client folder in  Joshi's Corner - Client Uploads / Trade files | Ledger | DP holdings / <CLIENT CODE>,
   financial year = April to March:
     DP holdings    : previous FYs - the LAST statement of each FY (year-end holding) · current FY - the LAST 3
     Trades, Ledger : previous FYs - the ONE file with the fullest data of that FY  · current FY - the LAST 3 uploads
                      Any other file goes to trash ONLY if newer kept files cover every date it holds (the app merges all
                      trade / ledger files, each replacing its own date range) - so not one trade or entry is ever lost.
                      A file whose dates are not covered stays, and the log says "kept - dates not covered".
     Trash is recoverable for 30 days. App state backups are not touched.
   One time:  select  installPrune  -> Run.   Then it runs every night at about 02:00 IST.
   Dry run (nothing trashed, only the log):  select  prunePreview  -> Run. */
function prunePreview() { return pruneUploads_(true); }
function pruneUploads() { return pruneUploads_(false); }
function pruneDpHoldings() { return pruneUploads_(false); }          // old trigger name still works
function installPrune() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (/^prune(DpHoldings|Uploads)$/.test(t.getHandlerFunction())) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('pruneUploads').timeBased().atHour(2).everyDays(1).inTimezone('Asia/Kolkata').create();
  return pruneUploads();
}
function installDpPrune() { return installPrune(); }
function fyOf_(d) { var y = +d.slice(0, 4), m = +d.slice(5, 7); return m >= 4 ? y : y - 1; }   // 2026-05-10 -> 2026 (FY 2026-27)
function pruneUploads_(dry) {
  var root = pfRoot_(), fyNow = fyOf_(Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd')), out = [];
  [['dp', PF_TYPES.dp], ['trade', PF_TYPES.trade], ['ledger', PF_TYPES.ledger]].forEach(function (T) {
    var it = root.getFoldersByName(T[1]); if (!it.hasNext()) return;
    var cf = it.next().getFolders(), kept = 0, trashed = 0, log = [];
    while (cf.hasNext()) {
      var f = cf.next(), fs = f.getFiles(), all = [];
      while (fs.hasNext()) { var x = fs.next(); if (!x.isTrashed() && /\.csv$/i.test(x.getName())) all.push(T[0] === 'dp' ? { f: x, d: dpAsOf_(x), t: x.getDateCreated().getTime() } : readUp_(x, T[0])); }
      if (!all.length) continue;
      var keep = T[0] === 'dp' ? keepDp_(all, fyNow) : keepRows_(all, fyNow), why = [];
      all.forEach(function (o) {
        if (keep[o.f.getId()]) { kept++; if (keep[o.f.getId()] === 'nc') why.push('kept ' + (o.lo || o.d) + '..' + (o.hi || '') + ' - dates not covered'); }
        else { if (!dry) o.f.setTrashed(true); trashed++; } });
      var nk = Object.keys(keep).length;
      if (nk < all.length || why.length) log.push(f.getName() + ': ' + all.length + ' -> ' + nk + (why.length ? ' (' + why.join('; ') + ')' : ''));
    }
    out.push(T[1] + ': kept ' + kept + ', ' + (dry ? 'would trash ' : 'moved to trash ') + trashed + (log.length ? ' · ' + log.join(' | ') : ''));
  });
  var msg = (dry ? 'PREVIEW - nothing trashed. ' : '') + out.join('\n');
  Logger.log(msg); return msg;
}
/* DP: previous FYs keep the newest statement of each FY, current FY keeps the newest 3 */
function keepDp_(all, fyNow) {
  all.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : b.t - a.t; });
  var keep = {}, cur = 0, byFy = {};
  all.forEach(function (o) { var y = fyOf_(o.d);
    if (y >= fyNow) { if (cur < 3) { keep[o.f.getId()] = 1; cur++; } }
    else if (!byFy[y]) { byFy[y] = 1; keep[o.f.getId()] = 1; } });
  return keep;
}
/* Trade / ledger file -> its rows (date, exchange, entered-by-hand flag) */
function readUp_(file, type) {
  var o = { f: file, t: file.getDateCreated().getTime(), rows: [], bal: false, ex: {}, snap: false, lo: '', hi: '' };
  var a = Utilities.parseCsv(file.getBlob().getDataAsString()); if (!a.length) return o;
  var h = a[0].map(function (v) { return String(v).trim().toLowerCase(); });
  if (type === 'ledger' && h[0] === 'client code') { o.bal = true; return o; }          // balance-only file
  for (var i = 1; i < a.length; i++) { var d = String(a[i][0] || '').trim(); if (!/^\d{4}-\d\d-\d\d$/.test(d)) continue;
    var ex = type === 'trade' ? String(a[i][2] || '').trim().toUpperCase() : '', man = type === 'trade' && String(a[i][12] || '').trim().toLowerCase() === 'entered';
    o.rows.push({ d: d, ex: ex, man: man }); o.ex[ex] = 1; if (man) o.snap = true;
    if (!o.lo || d < o.lo) o.lo = d; if (!o.hi || d > o.hi) o.hi = d; }
  return o;
}
/* the same rule the app uses when it loads the files (oldest first): a later file B replaces row x of the client
   if x.d is in B's date range, on B's exchange(s), and x was not entered by hand unless B is a full trade-book snapshot */
function covers_(B, x) { if (B.bal || !B.lo || x.d < B.lo || x.d > B.hi) return false;
  if (x.man && !B.snap) return false;
  return !!(B.ex[''] || !x.ex || B.ex[x.ex]); }
function keepRows_(all, fyNow) {
  all.sort(function (a, b) { return b.t - a.t; });                                     // newest upload first
  var keep = {}, K = [], cur = 0, best = {};
  all.forEach(function (o) { var y = fyOf_(o.hi || Utilities.formatDate(new Date(o.t), 'Asia/Kolkata', 'yyyy-MM-dd'));
    if (y >= fyNow) { if (cur < 3) { keep[o.f.getId()] = 1; cur++; } }
    else { var n = o.rows.filter(function (r) { return fyOf_(r.d) === y; }).length;      // fullest file of that FY
      if (!best[y] || n > best[y].n) best[y] = { n: n, o: o }; } });
  Object.keys(best).forEach(function (y) { keep[best[y].o.f.getId()] = 1; });
  for (var i = 0; i < all.length; i++) { var o = all[i];
    if (keep[o.f.getId()]) { K.push(o); continue; }
    var later = K.filter(function (k) { return k.t > o.t; }), ok;
    if (o.bal) ok = all.some(function (k) { return k.t > o.t && keep[k.f.getId()]; });       // an older balance-only file is always overridden
    else {
      var older = all.slice(i + 1).filter(function (p) { return !p.bal; }), need = o.rows.slice();
      older.forEach(function (p) { p.rows.forEach(function (x) { if (covers_(o, x)) need.push(x); }); });   // what this file erases must stay erased
      ok = need.every(function (x) { return later.some(function (k) { return covers_(k, x); }); });
    }
    if (!ok) { keep[o.f.getId()] = 'nc'; K.push(o); }
  }
  return keep;
}
/* "Holding as on" date of a saved DP CSV (3rd column of the first data row), else the upload date */
function dpAsOf_(file) {
  try {
    var lines = file.getBlob().getDataAsString().split(/\r?\n/), row = (lines[1] || '').split(',');
    var v = String(row[2] || '').replace(/"/g, '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  } catch (e) { }
  return Utilities.formatDate(file.getDateCreated(), 'Asia/Kolkata', 'yyyy-MM-dd');
}
