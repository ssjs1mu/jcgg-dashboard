#!/usr/bin/env python3
"""GIFT Nifty (NSE IX) level for the morning reports.
No free official feed exists, so several public quote pages are tried in turn; a reading is accepted only if it is within
4% of Nifty's last close and (when the page states a time) no older than 30 hours. If nothing passes, returns None and the
report says 'not available' rather than showing an old number. The page used is never named in a report."""
import datetime as dt
import re
import urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept-Language": "en-IN,en;q=0.9"}
PAGES = ["https://www.angelone.in/indices/gift-nifty", "https://www.kotaksecurities.com/indices/global-indices/sgx-niftysgx-nifty",
         "https://www.niftytrader.in/sgx-nifty-live", "https://upstox.com/gift-nifty", "https://5paisa.com/share-market-today/sgx-nifty",
         "https://indmoney.com/indices/gift-nifty"]
NUM = r"(\d{2},\d{3}(?:\.\d+)?|\d{5}(?:\.\d+)?)"
MON = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}


def _text(url):
    req = urllib.request.Request(url, headers=UA)
    raw = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")
    raw = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", raw))


def _parse(t, ref):
    i = t.lower().find("gift nifty")
    if i < 0:
        return None
    seg = t[i:i + 1500]
    for m in re.finditer(NUM, seg):
        v = float(m.group(1).replace(",", ""))
        if ref and abs(v / ref - 1) > 0.04:
            continue
        tail = seg[m.end():m.end() + 160]
        ch = re.search(r"([+-]?\d[\d,]*\.?\d*)\s*\(\s*([+-]?\d+\.?\d*)\s*%", tail)
        asof = re.search(r"(\d{1,2})\s+([A-Z][a-z]{2})\s+(\d{4})[ ,]*(\d{1,2}):(\d{2})", seg[m.end():m.end() + 400])
        return dict(last=v, chg=float(ch.group(1).replace(",", "")) if ch else None, pct=float(ch.group(2)) if ch else None,
                    asof=(dt.datetime(int(asof.group(3)), MON[asof.group(2)], int(asof.group(1)), int(asof.group(4)), int(asof.group(5))) if asof else None))
    return None


def fetch(nifty_last=None, now_ist=None):
    now = (now_ist or dt.datetime.now(dt.timezone(dt.timedelta(hours=5, minutes=30)))).replace(tzinfo=None)
    for u in PAGES:
        try:
            g = _parse(_text(u), nifty_last)
        except Exception:
            continue
        if not g:
            continue
        if g["asof"] and (now - g["asof"]).total_seconds() > 30 * 3600:
            continue
        if nifty_last:
            g["premium"] = round(g["last"] - nifty_last, 1)
            g["vs_pct"] = round((g["last"] / nifty_last - 1) * 100, 2)
        if g["pct"] is None and nifty_last:
            g["pct"] = g["vs_pct"]
        return g
    return None


if __name__ == "__main__":
    print(fetch(23000))
