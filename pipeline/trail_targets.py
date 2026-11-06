"""Intraday target-achievement study: for every trigger of conditions 2-7 (volume >= 3 lakh, 09:30-14:45), did price reach +X% (or the next pivot) before the stop, same day?"""
import os, json, collections, statistics as st
exec(open('pipeline/trail_bt.py').read().split("trades = []")[0])
TG = [0.5, 1.0, 1.5, 2.0, 3.0]
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
        avgR = st.mean((b[2]-b[3])/b[1]*100 for b in pr[-20:] if b[1]); std = piv(pr[-1][2], pr[-1][3], pr[-1][4]); o = bars[0][1]; hi = lo = o; cv = 0; pv = 0.0; V = []
        for i, (mm, bo, bh, bl, bc, bv) in enumerate(bars):
            hi = max(hi, bh); lo = min(lo, bl); cv += bv; pv += (bh+bl+bc)/3*bv; V.append(bv)
            if i < 5 or mm < 570 or mm > 885 or i + 1 >= len(bars): continue
            vw = pv / cv if cv else bc; r = rsi14(closes + [bc])
            if not (o > pc and bc > vw and (hi-lo)/o*100 >= 1.5*avgR and cv >= 300000 and r is not None and r > 55 and st.mean(V[-3:]) > st.mean(V[-6:-3])): continue
            ep = bars[i+1][1]; lv = std + piv(hi, lo, bc); sd = ep - (below(lv, ep, 0.25) or ep*0.99); sd = min(max(sd, ep*0.004), ep*0.012); sl = ep - sd
            ups = sorted(l for l in lv if l > ep*1.002); e = dict(sym=s, date=day, mm=mm, ol=int((o-lo)/o <= 0.0005), stop_pct=round(sd/ep*100, 2), pivT=round((ups[0]/ep-1)*100, 2) if ups else None)
            stop_i = None; mfe = 0.0; hit = {}
            for j in range(i+1, len(bars)):
                if stop_i is None and bars[j][3] <= sl: stop_i = j
                up = (bars[j][2]/ep-1)*100
                for tgt in TG:
                    if tgt not in hit and up >= tgt: hit[tgt] = j
                mfe = max(mfe, up)
            e['mfe'] = round(mfe, 2); e['close'] = round((bars[-1][4]/ep-1)*100, 2); e['stopped'] = int(stop_i is not None)
            for tgt in TG:
                h = hit.get(tgt); e['t%s' % tgt] = int(h is not None); e['tb%s' % tgt] = int(h is not None and (stop_i is None or h < stop_i or (h == stop_i and False))); e['tm%s' % tgt] = (bars[h][0] - mm) if h is not None else None
            if e['pivT']: 
                h = next((j for j in range(i+1, len(bars)) if (bars[j][2]/ep-1)*100 >= e['pivT']), None); e['pv'] = int(h is not None); e['pvb'] = int(h is not None and (stop_i is None or h < stop_i))
            E_.append(e); break
N = len(E_); alld = sorted({e['date'] for e in E_}); out = dict(entries=N, signal_days=len(alld), generated=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), symbols=len(data))
def pct(a, n): return round(a / n * 100, 1) if n else None
def table(T):
    n = len(T); r = dict(n=n, stop_pct_avg=round(st.mean(e['stop_pct'] for e in T), 2) if n else None)
    for tgt in TG:
        k = 't%s' % tgt; kb = 'tb%s' % tgt; tm = [e['tm%s' % tgt] for e in T if e['tm%s' % tgt] is not None]
        byday = collections.defaultdict(list)
        for e in T: byday[e['date']].append(e[kb])
        r['T%s' % tgt] = dict(reach=pct(sum(e[k] for e in T), n), before_stop=pct(sum(e[kb] for e in T), n), days_with_hit=pct(sum(1 for v in byday.values() if any(v)), len(byday)), med_min=int(st.median(tm)) if tm else None)
    pv = [e for e in T if e.get('pivT')]; r['next_pivot'] = dict(n=len(pv), avg_dist=round(st.mean(e['pivT'] for e in pv), 2) if pv else None, reach=pct(sum(e['pv'] for e in pv), len(pv)), before_stop=pct(sum(e['pvb'] for e in pv), len(pv)))
    r['stopped'] = pct(sum(e['stopped'] for e in T), n); r['avg_mfe'] = round(st.mean(e['mfe'] for e in T), 2) if n else None; r['avg_close'] = round(st.mean(e['close'] for e in T), 2) if n else None
    r['days_with_signal'] = len({e['date'] for e in T}); return r
out['all'] = table(E_); out['open_low'] = table([e for e in E_ if e['ol']]); out['not_open_low'] = table([e for e in E_ if not e['ol']])
out['entry_before_1030'] = table([e for e in E_ if e['mm'] < 630]); out['entry_1030_1200'] = table([e for e in E_ if 630 <= e['mm'] < 720]); out['entry_after_1200'] = table([e for e in E_ if e['mm'] >= 720])
per = collections.Counter(e['date'] for e in E_); out['signals_per_day_avg'] = round(st.mean(per.values()), 1); out['trading_days_in_data'] = len({ist(b[0]).strftime('%Y-%m-%d') for _, _, m in data[:1] for b in m})
json.dump(out, open(os.environ.get('OUT', '/tmp/trail_targets.json'), 'w'), separators=(',', ':')); print(json.dumps(out, indent=0)[:3000])
