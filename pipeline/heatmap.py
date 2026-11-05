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
ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
json.dump({'ts': ts, 'rows': rows}, open(os.environ.get('OUT', 'data/heat.json'), 'w'), separators=(',', ':'))

# ---- intraday bars (5d x 5m) for the 40 best-ranked stocks: the technicals panel falls back to these when the live feed is busy
ist = datetime.now(timezone.utc) + timedelta(hours=5.5); m = ist.hour * 60 + ist.minute
frac = max((m - 555) / 375, 0.04) if 555 <= m <= 930 else 1.0; today = ist.strftime('%Y-%m-%d')
def rank(r):
    s, g, p, pc, o, h, l, v, av, d = r
    live = d == today; ol = live and (o - l) / o * 100 <= 0.05; up = live and p > pc; vp = live and av and v / (av * frac) >= 1.5
    return (-(ol + up + bool(vp)), -(p / pc - 1))
top = [r[0] for r in sorted(rows, key=rank)[:40]]
def bars(sy):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=5d&interval=5m&includePrePost=false' % urllib.parse.quote(sy)
    for t in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]; q = x['indicators']['quote'][0]
            ok = [i for i in range(len(x['timestamp'])) if None not in (q['high'][i], q['low'][i], q['close'][i])]
            return sy, {'t': [x['timestamp'][i] for i in ok], 'h': [round(q['high'][i], 2) for i in ok], 'l': [round(q['low'][i], 2) for i in ok], 'c': [round(q['close'][i], 2) for i in ok], 'v': [int(q['volume'][i] or 0) for i in ok]}
        except Exception:
            time.sleep(1 + t)
    return sy, None
with ThreadPoolExecutor(8) as ex: B = {k: v for k, v in ex.map(bars, top) if v}
print('bars', len(B), 'of', len(top))
json.dump({'ts': ts, 'bars': B}, open(os.environ.get('OUT_BARS', 'data/bars.json'), 'w'), separators=(',', ':'))
