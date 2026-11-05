"""Builds data/snapshot.json: real Yahoo quotes for every tile on the trading screen, fetched on the GitHub runner
(no Apps Script quota). The screen uses it whenever the live backend is unavailable and labels it delayed."""
import json, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
SYMS = ['^NSEI','^NSEBANK','^BSESN','^INDIAVIX','^CNXIT','^NSMIDCP','BZ=F','CL=F','USDINR=X','DX-Y.NYB','^TNX','GC=F','^DJI','^GSPC','^IXIC','^N225']
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
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
                    'hi': m.get('regularMarketDayHigh'), 'lo': m.get('regularMarketDayLow')}
        except Exception:
            time.sleep(1 + a)
with ThreadPoolExecutor(8) as ex: rows = [r for r in ex.map(get, SYMS) if r]
print('symbols', len(SYMS), 'got', len(rows))
if len(rows) < len(SYMS) * 0.5: sys.exit('too few rows - keeping the previous snapshot')
json.dump({'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'rows': rows}, open('data/snapshot.json', 'w'), separators=(',', ':'))
