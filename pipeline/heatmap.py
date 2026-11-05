"""Heat-map feed: for every stock in data/universe.json fetch Yahoo daily bars (real data, from the GitHub runner) and write
rows [sym, group, price, prevClose, open, high, low, volume, avgVol20, lastBarDate] to $OUT (default data/heat.json)."""
import os, json, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
U = json.load(open('data/universe.json'))
syms = [(s, 'L') for s in U['large']] + [(s, 'M') for s in U['midsmall']]
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
def get(a):
    s, g = a
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=1mo&interval=1d&includePrePost=false' % urllib.parse.quote(s)
    for t in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]
            q = x['indicators']['quote'][0]; ts = x['timestamp']
            bars = [(ts[i], q['open'][i], q['high'][i], q['low'][i], q['close'][i], q['volume'][i] or 0) for i in range(len(ts)) if None not in (q['open'][i], q['high'][i], q['low'][i], q['close'][i])]
            if len(bars) < 6: return None
            t, o, h, l, c, v = bars[-1]; pc = bars[-2][4]; pv = [b[5] for b in bars[-21:-1] if b[5]]
            p = x.get('meta', {}).get('regularMarketPrice') or c
            return [s, g, round(p, 2), round(pc, 2), round(o, 2), round(h, 2), round(l, 2), int(v), int(sum(pv) / len(pv)) if pv else 0, datetime.fromtimestamp(t + 19800, timezone.utc).strftime('%Y-%m-%d')]
        except Exception:
            time.sleep(1 + t)
with ThreadPoolExecutor(14) as ex: rows = [r for r in ex.map(get, syms) if r]
print('symbols', len(syms), 'got', len(rows))
if len(rows) < len(syms) * 0.6: sys.exit('too few rows - keeping the previous heat-map')
json.dump({'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'rows': rows}, open(os.environ.get('OUT', 'data/heat.json'), 'w'), separators=(',', ':'))
