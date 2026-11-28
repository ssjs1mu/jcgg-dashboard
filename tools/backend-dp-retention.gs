/* ===================== DP holdings on Google Drive: keep what matters, trash the rest =====================
   Add this block at the END of Code.gs in the "JC_STOCK_URL" Apps Script project (the Portfolio backend).
   Rule, per client folder in  Joshi's Corner - Client Uploads / DP holdings / <CLIENT CODE>:
     - previous years : only the LAST statement of each year (by its "Holding as on" date)
     - current year   : the LAST 3 statements
     - everything else: moved to Drive trash (recoverable for 30 days)
   Ledgers and trade files are NOT touched - each covers its own dates and the app merges all of them.
   One time:  select  installDpPrune  in the function list  -> Run  (allow access when asked).
              It cleans up now and then every night at about 02:00 IST. */
function pruneDpHoldings() {
  var root = pfRoot_(), it = root.getFoldersByName(PF_TYPES.dp); if (!it.hasNext()) return 'no DP holdings folder';
  var yNow = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy'), cf = it.next().getFolders(), kept = 0, trashed = 0, log = [];
  while (cf.hasNext()) {
    var f = cf.next(), fs = f.getFiles(), all = [];
    while (fs.hasNext()) { var x = fs.next(); if (!x.isTrashed() && /\.csv$/i.test(x.getName())) all.push({ f: x, d: dpAsOf_(x), t: x.getDateCreated().getTime() }); }
    all.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : b.t - a.t; });      // newest statement first
    var keep = {}, cur = 0, byYear = {};
    all.forEach(function (o) {
      var y = o.d.slice(0, 4);
      if (y === yNow) { if (cur < 3) { keep[o.f.getId()] = 1; cur++; } }
      else if (!byYear[y]) { byYear[y] = 1; keep[o.f.getId()] = 1; }
    });
    all.forEach(function (o) { if (keep[o.f.getId()]) kept++; else { o.f.setTrashed(true); trashed++; } });
    if (all.length) log.push(f.getName() + ': ' + all.length + ' -> ' + Object.keys(keep).length);
  }
  var msg = 'DP holdings kept ' + kept + ', moved to trash ' + trashed + ' · ' + log.join(' | ');
  Logger.log(msg); return msg;
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
function installDpPrune() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'pruneDpHoldings') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('pruneDpHoldings').timeBased().atHour(2).everyDays(1).inTimezone('Asia/Kolkata').create();
  return pruneDpHoldings();
}
