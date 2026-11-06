"""Backtest of the 'Trail Board' rules on real 5-min bars (Yahoo, last 60 days) for the Nifty 100 + MidSmallCap 400 universe.
Entry: conditions 2-7 all true (1 = Open=Low optional, tracked separately). Stop: nearest standard/live pivot; trails on conditions 8/9; exit on 10 or 15:15."""
import os, json, time, urllib.request, urllib.parse, statistics as st, math, collections
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
U = json.load(open('data/universe.json')); syms = list(U['large']) + list(U['midsmall'])
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'}
COST = 0.145  # % round trip: statutory ~0.045 + 0.05 slippage per side (assumption, same as the earlier tests)
P = dict(vol_x_entry=1.5, vol_x_trail=2.5, v_entry=300000, v_trail=500000, rsi=55, gap1=0.5, gap2=0.25, lastEntry=885, eod=915)
def fetch(s, rng, iv):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=%s&interval=%s&includePrePost=false' % (urllib.parse.quote(s), rng, iv)
    for t in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20))['chart']['result'][0]
            q = x['indicators']['quote'][0]; return [(x['timestamp'][i], q['open'][i], q['high'][i], q['low'][i], q['close'][i], q['volume'][i] or 0) for i in range(len(x['timestamp'])) if None not in (q['open'][i], q['high'][i], q['low'][i], q['close'][i])]
        except Exception: time.sleep(1 + t)
    return None
def rsi14(cl):
    if len(cl) < 16: return None
    d = [cl[i] - cl[i-1] for i in range(1, len(cl))]; ag = sum(max(x, 0) for x in d[:14]) / 14; al = sum(max(-x, 0) for x in d[:14]) / 14
    for x in d[14:]: ag = (ag * 13 + max(x, 0)) / 14; al = (al * 13 + max(-x, 0)) / 14
    return 100.0 if al == 0 else 100 - 100 / (1 + ag / al)
def piv(H, L, C):
    p = (H + L + C) / 3; return [2*p - H, p - (H - L), L - 2*(H - p), p, 2*p - L, p + (H - L), H + 2*(p - L)]
def below(levels, ref, gap):
    c = [l for l in levels if l <= ref * (1 - gap / 100)]; return max(c) if c else None
def ist(ts): return datetime.fromtimestamp(ts + 19800, timezone.utc)
def get(s):
    d = fetch(s, '1y', '1d'); m = fetch(s, '60d', '5m')
    return (s, d, m) if d and m else None
with ThreadPoolExecutor(14) as ex: data = [r for r in ex.map(get, syms) if r]
print('symbols with data', len(data), 'of', len(syms))
trades = []
for s, d, m in data:
    D = {ist(b[0]).strftime('%Y-%m-%d'): b for b in d}; dk = sorted(D)
    days = collections.defaultdict(list)
    for b in m:
        t = ist(b[0]); mm = t.hour * 60 + t.minute
        if 555 <= mm <= 930: days[t.strftime('%Y-%m-%d')].append((mm,) + b[1:])
    for day, bars in days.items():
        if day not in D or len(bars) < 30: continue
        k = dk.index(day)
        if k < 22: continue
        pr = [D[x] for x in dk[:k]]; pc = pr[-1][4]; closes = [b[4] for b in pr[-120:]]
        avgR = st.mean((b[2] - b[3]) / b[1] * 100 for b in pr[-20:] if b[1]); std = piv(pr[-1][2], pr[-1][3], pr[-1][4])
        o = bars[0][1]; hi = lo = o; cv = 0; pv = 0.0; V = []; ent = None; sig_ol = None
        for i, (mm, bo, bh, bl, bc, bv) in enumerate(bars):
            hi = max(hi, bh); lo = min(lo, bl); cv += bv; pv += (bh + bl + bc) / 3 * bv; V.append(bv)
            if ent is None:
                if mm > P['lastEntry'] or i < 5 or i + 1 >= len(bars): continue
                vw = pv / cv if cv else bc; r = rsi14(closes + [bc])
                c2 = o > pc; c3 = bc > vw; c4 = (hi - lo) / o * 100 >= P['vol_x_entry'] * avgR; c5 = cv >= P['v_entry']; c6 = r is not None and r > P['rsi']
                c7 = st.mean(V[-3:]) > st.mean(V[-6:-3])
                if c2 and c3 and c4 and c5 and c6 and c7:
                    ep = bars[i+1][1]; lv = std + piv(hi, lo, bc); sl = below(lv, ep, P['gap2']) or ep * 0.99
                    ent = dict(sym=s, date=day, t=bars[i+1][0], ep=ep, sl=sl, ol=(o - lo) / o <= 0.0005, i0=i + 1, strong=0, sl0=sl, pc_gap=round((o/pc-1)*100, 2))
                    cv_at = cv; hi_e, lo_e = hi, lo
                continue
            # ---- in trade, bar i
            if i < ent['i0']: continue
            if bl <= ent['sl']:
                xp = min(ent['sl'], bo); ent.update(xp=xp, why='stop' if ent['strong'] == 0 else 'trail'); break
            c8 = (hi - lo) / o * 100 >= P['vol_x_trail'] * avgR; c9 = cv >= P['v_trail']; ent['strong'] = int(c8) + int(c9)
            if ent['strong']:
                nl = below(std + piv(hi, lo, bc), bc, P['gap1'] if ent['strong'] == 1 else P['gap2'])
                if nl and nl > ent['sl']: ent['sl'] = nl
            dec1 = st.mean(V[-3:]) < st.mean(V[-6:-3]); dec0 = st.mean(V[-4:-1]) < st.mean(V[-7:-4])
            if i >= ent['i0'] + 3 and dec1 and dec0: ent.update(xp=bc, why='volume'); break
            if mm >= P['eod']: ent.update(xp=bc, why='eod'); break
        if ent:
            if 'xp' not in ent: ent.update(xp=bars[-1][4], why='eod')
            # baselines on the same entry: hold to 15:15 with initial stop only / no stop
            h = None
            for j in range(ent['i0'], len(bars)):
                if bars[j][3] <= ent['sl0']: h = min(ent['sl0'], bars[j][1]); break
                if bars[j][0] >= P['eod']: h = bars[j][4]; break
            ent['r'] = round((ent['xp'] / ent['ep'] - 1) * 100 - COST, 3)
            ent['r_hold_stop'] = round(((h if h else bars[-1][4]) / ent['ep'] - 1) * 100 - COST, 3)
            ent['r_hold'] = round((next((b[4] for b in bars[ent['i0']:] if b[0] >= P['eod']), bars[-1][4]) / ent['ep'] - 1) * 100 - COST, 3)
            for kx in ('sl', 'sl0', 'strong'): ent.pop(kx, None)
            trades.append(ent)
def wil(w, n):
    if not n: return [0, 0]
    p = w / n; z = 1.96; den = 1 + z*z/n; c = (p + z*z/(2*n)) / den; hw = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / den; return [round((c-hw)*100), round((c+hw)*100)]
def summ(name, T, key='r'):
    R = [t[key] for t in T]; n = len(R)
    if not n: return dict(name=name, n=0)
    w = sum(r > 0 for r in R); gp = sum(r for r in R if r > 0); gl = -sum(r for r in R if r < 0); byd = collections.defaultdict(list)
    for t in T: byd[t['date']].append(t[key])
    dm = [st.mean(v) for v in byd.values()]; tt = st.mean(dm) / (st.pstdev(dm) / math.sqrt(len(dm))) if len(dm) > 2 and st.pstdev(dm) > 0 else None
    eq = 0; pk = 0; dd = 0
    for dday in sorted(byd): eq += st.mean(byd[dday]); pk = max(pk, eq); dd = min(dd, eq - pk)
    return dict(name=name, n=n, days=len(dm), win=round(w/n*100, 1), ci=wil(w, n), avg=round(st.mean(R), 3), med=round(st.median(R), 3), pf=round(gp/gl, 2) if gl else None, best=round(max(R), 2), worst=round(min(R), 2), daily_t=round(tt, 2) if tt else None, sum_daily_pct=round(eq, 2), max_dd_pct=round(dd, 2))
out = dict(generated=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), symbols=len(data), params=P, cost_pct=COST, from_date=min((t['date'] for t in trades), default=None), to_date=max((t['date'] for t in trades), default=None))
out['results'] = [summ('Trail rule (all entries 2-7)', trades), summ('  with 1 Open=Low (deep green)', [t for t in trades if t['ol']]), summ('  without 1', [t for t in trades if not t['ol']]),
                  summ('Same entries, initial pivot stop, hold to 15:15', trades, 'r_hold_stop'), summ('Same entries, no stop, hold to 15:15', trades, 'r_hold')]
out['exits'] = dict(collections.Counter(t['why'] for t in trades)); out['exit_avg'] = {w: round(st.mean(t['r'] for t in trades if t['why'] == w), 3) for w in out['exits']}
out['trades'] = [[t['sym'], t['date'], t['t'], round(t['ep'], 2), round(t['xp'], 2), t['why'], t['ol'], t['r']] for t in trades]
json.dump(out, open(os.environ.get('OUT', '/tmp/trail_bt.json'), 'w'), separators=(',', ':'))
for r in out['results']: print(r)
print(out['exits'], out['exit_avg'])
