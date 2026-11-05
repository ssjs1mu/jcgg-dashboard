"""Builds data/snapshot.json: real Yahoo quotes for every tile on the trading screen, fetched on the GitHub runner
(no Apps Script quota). The screen uses it whenever the live backend is unavailable and labels it delayed."""
import os, json, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
SYMS = ['^NSEI','^NSEBANK','^BSESN','^INDIAVIX','^CNXIT','^NSMIDCP','BZ=F','CL=F','USDINR=X','DX-Y.NYB','^TNX','GC=F','^DJI','^GSPC','^IXIC','^N225']
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
def pivots(s):
    """classic pivots from the previous completed session (daily bars): P, S1, S2, R1, R2"""
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s?range=10d&interval=1d&includePrePost=false' % urllib.parse.quote(s)
    try:
        x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]
        q = x['indicators']['quote'][0]; off = x.get('meta', {}).get('gmtoffset', 0) or 0
        bars = [(t, q['high'][i], q['low'][i], q['close'][i]) for i, t in enumerate(x['timestamp']) if None not in (q['high'][i], q['low'][i], q['close'][i])]
        today = time.strftime('%Y-%m-%d', time.gmtime(time.time() + off))
        if len(bars) >= 2 and time.strftime('%Y-%m-%d', time.gmtime(bars[-1][0] + off)) == today: bars = bars[:-1]
        _, h, l, c = bars[-1]; p = (h + l + c) / 3; r = h - l
        return {'P': round(p, 4), 'R1': round(2 * p - l, 4), 'S1': round(2 * p - h, 4), 'R2': round(p + r, 4), 'S2': round(p - r, 4), 'H': h, 'L': l, 'C': c}
    except Exception:
        return None
def get(s):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s?range=1d&interval=5m&includePrePost=false' % urllib.parse.quote(s)
    for a in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]
            m = x.get('meta', {}); q = (x.get('indicators', {}).get('quote') or [{}])[0]
            p = m.get('regularMarketPrice')
            if p is None: return None
            c = [round(v, 4) for v in (q.get('close') or []) if v is not None][-80:]
            return {'s': s, 'p': p, 'pc': m.get('chartPreviousClose', m.get('previousClose')), 't': m.get('regularMarketTime'), 'sp': c,
                    'hi': m.get('regularMarketDayHigh'), 'lo': m.get('regularMarketDayLow'), 'pv': pivots(s)}
        except Exception:
            time.sleep(1 + a)
with ThreadPoolExecutor(8) as ex: rows = [r for r in ex.map(get, SYMS) if r]
print('symbols', len(SYMS), 'got', len(rows))
if len(rows) < len(SYMS) * 0.5: sys.exit('too few rows - keeping the previous snapshot')
json.dump({'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'rows': rows}, open(os.environ.get('OUT', 'data/snapshot.json'), 'w'), separators=(',', ':'))
