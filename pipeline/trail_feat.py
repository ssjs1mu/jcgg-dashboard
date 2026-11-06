"""Early-entry study: keep conditions 2-7 (volume >= 3 lakh, first trigger from 09:30), run winners with an R-based trail, then look for EXTRA triggers
that raise accuracy. Features are screened on the first 60% of days and scored on the last 40% (never seen during screening)."""
import os, json, time, math, itertools, statistics as st, collections
exec(open('pipeline/trail_bt.py').read().split("trades = []")[0])
def wil(w, n):
    if not n: return [0, 0]
    p = w / n; z = 1.96; den = 1 + z*z/n; c = (p + z*z/(2*n)) / den; hw = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / den; return [round((c-hw)*100), round((c+hw)*100)]
def fnifty():
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=60d&interval=5m&includePrePost=false'
    x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20))['chart']['result'][0]; q = x['indicators']['quote'][0]; out = collections.defaultdict(dict)
    for i, t in enumerate(x['timestamp']):
        if q['close'][i] is None: continue
        d = ist(t); out[d.strftime('%Y-%m-%d')][d.hour*60+d.minute] = (q['open'][i], q['close'][i])
    return out
NF = fnifty(); print('nifty days', len(NF))
def nifty_state(day, mm):
    b = NF.get(day); 
    if not b: return None, None
    ks = sorted(k for k in b if k <= mm)
    if not ks: return None, None
    o = b[min(b)][0]; c = b[ks[-1]][1]; prev = [b[k][1] for k in ks[-7:]]
    return (c / o - 1) * 100, (c / prev[0] - 1) * 100 if prev else None
R_STYLE = dict(min=0.4, max=1.2, be=1.0, trail_at=2.0, trail_k=1.5)
def simulate(bars, j0, ep, lv, vexit):
    d = ep - (below(lv, ep, 0.25) or ep * 0.99); d = min(max(d, ep * R_STYLE['min'] / 100), ep * R_STYLE['max'] / 100); R = d; sl = ep - R; H = ep; V = [b[5] for b in bars]
    for j in range(j0, len(bars)):
        mm, bo, bh, bl, bc, bv = bars[j]
        if bl <= sl: return min(sl, bo), 'stop', R
        H = max(H, bh)
        if H >= ep + R_STYLE['be'] * R: sl = max(sl, ep)
        if H >= ep + R_STYLE['trail_at'] * R: sl = max(sl, H - R_STYLE['trail_k'] * R)
        if vexit and bc > ep + R and j >= j0 + 3 and st.mean(V[j-2:j+1]) < st.mean(V[j-5:j-2]) and st.mean(V[j-3:j]) < st.mean(V[j-6:j-3]): return bc, 'volume', R
        if mm >= 915: return bc, 'eod', R
    return bars[-1][4], 'eod', R
E_ = []
for s, d, m in data:
    D = {ist(b[0]).strftime('%Y-%m-%d'): b for b in d}; dk = sorted(D); days = collections.defaultdict(list)
    for b in m:
        t = ist(b[0]); mm = t.hour * 60 + t.minute
        if 555 <= mm <= 930: days[t.strftime('%Y-%m-%d')].append((mm,) + b[1:])
    for day, bars in sorted(days.items()):
        if day not in D or len(bars) < 30: continue
        k = dk.index(day)
        if k < 22: continue
        pr = [D[x] for x in dk[:k]]; pc = pr[-1][4]; closes = [b[4] for b in pr[-120:]]
        if len(closes) < 16: continue
        avgR = st.mean((b[2]-b[3])/b[1]*100 for b in pr[-20:] if b[1]); av20 = st.mean(b[5] for b in pr[-20:]) or 1; h20 = max(b[2] for b in pr[-20:]); ph = pr[-1][2]; sma20 = st.mean(b[4] for b in pr[-20:])
        std = piv(pr[-1][2], pr[-1][3], pr[-1][4]); o = bars[0][1]; hi = lo = o; cv = 0; pv = 0.0; V = []
        for i, (mm, bo, bh, bl, bc, bv) in enumerate(bars):
            hi = max(hi, bh); lo = min(lo, bl); cv += bv; pv += (bh+bl+bc)/3*bv; V.append(bv)
            if i < 5 or mm < 570 or mm > 885 or i + 1 >= len(bars): continue
            vw = pv / cv if cv else bc; r = rsi14(closes + [bc])
            if not (o > pc and bc > vw and (hi-lo)/o*100 >= 1.5*avgR and cv >= 300000 and r is not None and r > 55 and st.mean(V[-3:]) > st.mean(V[-6:-3])): continue
            ep = bars[i+1][1]; lv = std + piv(hi, lo, bc); res = [l for l in lv if l > ep]; room = (min(res) / ep - 1) * 100 if res else 5.0
            orh = max(b[3] for b in bars[:3]); nd, n30 = nifty_state(day, mm); ef = lambda a: a
            f = dict(ol=int((o-lo)/o <= 0.0005), gap=(o/pc-1)*100, tmin=mm, rngx=(hi-lo)/o*100/avgR, rvol=cv/av20*(375/max(mm-555, 15)), rsi=r, ratv=st.mean(V[-3:])/max(st.mean(V[-6:-3]), 1),
                     dhi=(hi-bc)/bc*100, orb=int(bc > orh), pdh=int(bc > ph), h20=int(bc > h20), trend=int(pr[-1][4] > sma20), strong=(bc-bl)/(bh-bl) if bh > bl else 0.5,
                     up3=int(bars[i][4] > bars[i-1][4] > bars[i-2][4]), room=room, nday=nd if nd is not None else 0, n30=n30 if n30 is not None else 0, vwx=(bc/vw-1)*100, pret=(bc/pc-1)*100, atr=avgR)
            for vexit in (0, 1):
                xp, why, Rr = simulate(bars, i + 1, ep, lv, vexit); rp = (xp/ep-1)*100 - COST; f['r%d' % vexit] = rp; f['R%d' % vexit] = rp / (Rr/ep*100); f['why%d' % vexit] = why
            f.update(sym=s, date=day); E_.append(f); break
print('entries', len(E_))
dates = sorted({e['date'] for e in E_}); cut = dates[int(len(dates)*0.6)]
def S(T, key='r1', RK='R1'):
    n = len(T)
    if n == 0: return dict(n=0)
    w = sum(e[key] > 0 for e in T); gp = sum(e[key] for e in T if e[key] > 0); gl = -sum(e[key] for e in T if e[key] < 0)
    return dict(n=n, win=round(w/n*100, 1), ci=wil(w, n), avg=round(st.mean(e[key] for e in T), 3), avgR=round(st.mean(e[RK] for e in T), 2), pf=round(gp/gl, 2) if gl else None, best=round(max(e[key] for e in T), 2), worst=round(min(e[key] for e in T), 2))
tr = [e for e in E_ if e['date'] <= cut]; te = [e for e in E_ if e['date'] > cut]
out = dict(generated=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), entries=len(E_), split_after=cut, style=R_STYLE, all=dict(vexit0=S(E_, 'r0', 'R0'), vexit1=S(E_), train=S(tr), test=S(te)),
           exits={w: sum(e['why1'] == w for e in E_) for w in ('stop', 'volume', 'eod')})
NUM = ['gap', 'tmin', 'rngx', 'rvol', 'rsi', 'ratv', 'dhi', 'strong', 'room', 'nday', 'n30', 'vwx', 'pret', 'atr']; BIN = ['ol', 'orb', 'pdh', 'h20', 'trend', 'up3']
cands = []
for f in BIN: cands += [(f + '=1', lambda e, f=f: e[f] == 1), (f + '=0', lambda e, f=f: e[f] == 0)]
for f in NUM:
    vs = sorted(e[f] for e in tr)
    for q in (0.33, 0.5, 0.67):
        t = vs[int(len(vs)*q)]; cands += [('%s>=%.2f' % (f, t), lambda e, f=f, t=t: e[f] >= t), ('%s<%.2f' % (f, t), lambda e, f=f, t=t: e[f] < t)]
rows = []
for nm, fn in cands:
    a = [e for e in tr if fn(e)]; b = [e for e in te if fn(e)]
    if len(a) >= 40: rows.append(dict(f=nm, train=S(a), test=S(b)))
out['single'] = sorted(rows, key=lambda r: -r['train']['avgR'])[:14]
# greedy combo: best of train avgR with n>=30, up to 3 filters
sel = []; cur = tr; fns = dict(cands)
for _ in range(3):
    best = None
    for nm, fn in cands:
        if nm in [x[0] for x in sel]: continue
        a = [e for e in cur if fn(e)]
        if len(a) < 30: continue
        sc = st.mean(e['R1'] for e in a)
        if best is None or sc > best[0]: best = (sc, nm, fn, a)
    if not best: break
    sel.append((best[1], best[2])); cur = best[3]
    names = [x[0] for x in sel]; a = [e for e in tr if all(f(e) for _, f in sel)]; b = [e for e in te if all(f(e) for _, f in sel)]
    out.setdefault('combo', []).append(dict(filters=list(names), train=S(a), test=S(b)))
json.dump(out, open(os.environ.get('OUT', '/tmp/trail_feat.json'), 'w'), separators=(',', ':'))
print(json.dumps(out['all'])); print(out['exits'])
for r in out['single']: print(r['f'], r['train'], r['test'])
for r in out.get('combo', []): print(r)
