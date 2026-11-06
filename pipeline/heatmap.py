"""Heat-map feed: for every stock in data/universe.json fetch Yahoo daily bars (real data, from the GitHub runner) and write
rows [sym, group, price, prevClose, open, high, low, volume, avgVol20, lastBarDate] to $OUT (default data/heat.json)."""
import os, json, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
U = json.load(open('data/universe.json'))
syms = [(s, 'L') for s in U['large']] + [(s, 'M') for s in U['midsmall']]
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
def rsi14(cl):
    if len(cl) < 16: return None
    d = [cl[i] - cl[i-1] for i in range(1, len(cl))]
    ag = sum(max(x, 0) for x in d[:14]) / 14; al = sum(max(-x, 0) for x in d[:14]) / 14
    for x in d[14:]:
        ag = (ag * 13 + max(x, 0)) / 14; al = (al * 13 + max(-x, 0)) / 14
    return 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
CLOSES = {}; SDAILY = {}
def get(a):
    s, g = a
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=1y&interval=1d&includePrePost=false' % urllib.parse.quote(s)
    for t in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]
            q = x['indicators']['quote'][0]; ts = x['timestamp']
            bars = [(ts[i], q['open'][i], q['high'][i], q['low'][i], q['close'][i], q['volume'][i] or 0) for i in range(len(ts)) if None not in (q['open'][i], q['high'][i], q['low'][i], q['close'][i])]
            if len(bars) < 6: return None
            t, o, h, l, c, v = bars[-1]; pc = bars[-2][4]; pv = [b[5] for b in bars[-21:-1] if b[5]]
            p = x.get('meta', {}).get('regularMarketPrice') or c
            pr = bars[:-1]; mh = max(b[2] for b in pr[-20:]); ml = min(b[3] for b in pr[-20:]); wh = max(b[2] for b in pr[-250:]); wl = min(b[3] for b in pr[-250:])
            CLOSES[s] = [b[4] for b in pr[-120:]]; SDAILY[s] = [[b[0], round(b[1], 2), round(b[2], 2), round(b[3], 2), round(b[4], 2), int(b[5])] for b in bars[-130:]]; rs = rsi14(CLOSES[s] + [p])
            return [s, g, round(p, 2), round(pc, 2), round(o, 2), round(h, 2), round(l, 2), int(v), int(sum(pv) / len(pv)) if pv else 0, datetime.fromtimestamp(t + 19800, timezone.utc).strftime('%Y-%m-%d'), round(mh, 2), round(ml, 2), round(wh, 2), round(wl, 2), round(rs, 1) if rs is not None else None]
        except Exception:
            time.sleep(1 + t)
with ThreadPoolExecutor(14) as ex: rows = [r for r in ex.map(get, syms) if r]
print('symbols', len(syms), 'got', len(rows))
if len(rows) < len(syms) * 0.6: sys.exit('too few rows - keeping the previous heat-map')
ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

# ---- BIG FISH: when did each stock first meet every condition today (replayed on 5-min bars, real data)
ist = datetime.now(timezone.utc) + timedelta(hours=5.5); today = ist.strftime('%Y-%m-%d')
BF_MINVAL, BF_MINVOL, BF_REL, BF_VOLAT, BF_FROMOPEN, BF_RSI = 50, 350000, 1.5, 1.5, 2.0, 55
def fr(mm): return max((mm - 555) / 375, 0.04) if 555 <= mm <= 930 else (1.0 if mm > 930 else 0.04)
BS_REL, BS_FROMOPEN, BS_RSI = 1.2, -1.5, 40

def outcome(x, q, i0, entry, side):
    """Forward-log outcome after a trigger at bar i0: +1.5 % target vs -1.5 % stop, first touch on later 5-min bars (both in one bar = stop first, pessimistic); else mark-to-market at the last bar."""
    T, S = 1.5, 1.5; last = entry
    for j in range(i0 + 1, len(x['timestamp'])):
        if None in (q['high'][j], q['low'][j], q['close'][j]): continue
        last = q['close'][j]
        up, dn = (q['high'][j] - entry) / entry * 100, (entry - q['low'][j]) / entry * 100
        if side == 1:
            if (entry - q['low'][j]) / entry * 100 >= S: return ['S', -S]
            if up >= T: return ['T', T]
        else:
            if up >= S: return ['S', -S]
            if dn >= T: return ['T', T]
    return ['O', round(((last - entry) / entry * 100) * side, 2)]
def bs_replay(r):
    s, g, pp, pc, o, h, l, v, av, d, mh, ml = r[:12]
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=1d&interval=5m&includePrePost=false' % urllib.parse.quote(s)
    for t in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]; q = x['indicators']['quote'][0]
            cv = 0; hi = 0; lo = 1e18
            for i, tt in enumerate(x['timestamp']):
                if None in (q['high'][i], q['low'][i], q['close'][i]): continue
                cv += q['volume'][i] or 0; hi = max(hi, q['high'][i]); lo = min(lo, q['low'][i]); px = q['close'][i]
                e = datetime.fromtimestamp(tt + 300 + 19800, timezone.utc); mm = e.hour * 60 + e.minute
                rs = rsi14(CLOSES[s] + [px])
                if px >= BF_MINVAL and cv >= BF_MINVOL and av and cv / (av * fr(mm)) < BS_REL and (hi - lo) / lo * 100 >= BF_VOLAT and (px - o) / o * 100 <= BS_FROMOPEN and rs is not None and rs < BS_RSI and px < ml:
                    return [s, e.strftime('%H:%M'), round(px, 2)] + outcome(x, q, i, px, -1)
            return None
        except Exception:
            time.sleep(1 + t)
def bf_replay(r):
    s, g, p, pc, o, h, l, v, av, d, mh = r[:11]
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=1d&interval=5m&includePrePost=false' % urllib.parse.quote(s)
    for t in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]; q = x['indicators']['quote'][0]
            cv = 0; hi = 0; lo = 1e18
            for i, tt in enumerate(x['timestamp']):
                if None in (q['high'][i], q['low'][i], q['close'][i]): continue
                cv += q['volume'][i] or 0; hi = max(hi, q['high'][i]); lo = min(lo, q['low'][i]); px = q['close'][i]
                e = datetime.fromtimestamp(tt + 300 + 19800, timezone.utc); mm = e.hour * 60 + e.minute
                rs = rsi14(CLOSES[s] + [px])
                if px >= BF_MINVAL and cv >= BF_MINVOL and av and cv / (av * fr(mm)) >= BF_REL and (hi - lo) / lo * 100 >= BF_VOLAT and (px - o) / o * 100 >= BF_FROMOPEN and rs and rs > BF_RSI and px > mh:
                    return [s, e.strftime('%H:%M'), round(px, 2)] + outcome(x, q, i, px, 1)
            return None
        except Exception:
            time.sleep(1 + t)
cand = [r for r in rows if r[9] == today and r[2] >= BF_MINVAL and r[7] >= BF_MINVOL and (r[5] - r[6]) / r[6] * 100 >= BF_VOLAT and (r[5] - r[4]) / r[4] * 100 >= BF_FROMOPEN and r[5] > r[10]]
with ThreadPoolExecutor(8) as ex: BF = {x[0]: x[1:] for x in ex.map(bf_replay, cand) if x}
candS = [r for r in rows if r[9] == today and r[2] >= BF_MINVAL and r[7] >= BF_MINVOL and (r[5] - r[6]) / r[6] * 100 >= BF_VOLAT and (r[4] - r[6]) / r[4] * 100 >= -BS_FROMOPEN and r[6] < r[11]]
with ThreadPoolExecutor(8) as ex: BS = {x[0]: x[1:] for x in ex.map(bs_replay, candS) if x}
print('bigfish short candidates', len(candS), 'triggered', len(BS))
print('bigfish candidates', len(cand), 'triggered', len(BF))

# ---- forward log: today's trigger outcomes (merged with history by the workflow into branch `track`)
_final = (ist.hour * 60 + ist.minute) >= 935
json.dump({'date': today, 'final': _final, 'ts': ts, 'bf': {k: v for k, v in BF.items()}, 'bs': {k: v for k, v in BS.items()}}, open(os.environ.get('OUT_TRK', 'data/track_today.json'), 'w'), separators=(',', ':'))
json.dump({'ts': ts, 'rows': rows, 'bf': BF, 'bs': BS}, open(os.environ.get('OUT', 'data/heat.json'), 'w'), separators=(',', ':'))

# ---- intraday bars (5d x 5m) for the 40 best-ranked stocks: the technicals panel falls back to these when the live feed is busy
ist = datetime.now(timezone.utc) + timedelta(hours=5.5); m = ist.hour * 60 + ist.minute
frac = max((m - 555) / 375, 0.04) if 555 <= m <= 930 else 1.0; today = ist.strftime('%Y-%m-%d')
def rank(r):
    s, g, p, pc, o, h, l, v, av, d = r[:10]
    live = d == today; ol = live and (o - l) / o * 100 <= 0.05; up = live and p > pc; vp = live and av and v / (av * frac) >= 1.5
    return (-(ol + up + bool(vp)), -(p / pc - 1))
top = [r[0] for r in sorted(rows, key=rank)[:40]]
def bars(sy):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=5d&interval=5m&includePrePost=false' % urllib.parse.quote(sy)
    for t in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]; q = x['indicators']['quote'][0]
            ok = [i for i in range(len(x['timestamp'])) if None not in (q['high'][i], q['low'][i], q['close'][i])]
            return sy, {'t': [x['timestamp'][i] for i in ok], 'o': [round(q['open'][i] if q['open'][i] is not None else q['close'][i], 2) for i in ok], 'h': [round(q['high'][i], 2) for i in ok], 'l': [round(q['low'][i], 2) for i in ok], 'c': [round(q['close'][i], 2) for i in ok], 'v': [int(q['volume'][i] or 0) for i in ok]}
        except Exception:
            time.sleep(1 + t)
    return sy, None
with ThreadPoolExecutor(8) as ex: B = {k: v for k, v in ex.map(bars, top) if v}
print('bars', len(B), 'of', len(top))
json.dump({'ts': ts, 'bars': B}, open(os.environ.get('OUT_BARS', 'data/bars.json'), 'w'), separators=(',', ':'))

json.dump({'ts': ts, 'd': SDAILY}, open(os.environ.get('OUT_STK', 'data/stocks.json'), 'w'), separators=(',', ':'))
