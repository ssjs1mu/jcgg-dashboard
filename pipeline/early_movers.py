"""Early-mover study, both directions. Rule: price moves >= M% from previous close (up or down) while cumulative volume pace >= P x the stock's normal pace and
cumulative volume >= 1 lakh shares, before 11:30. Measure what is LEFT after the alert (best move in the same direction before a 1% adverse move), and compare with the
existing Big Fish Short / Big Fish timing (how far had the stock already moved when they fired). Parameters are chosen on the first 60% of days, scored on the last 40%."""
import os, json, collections, statistics as st, math, itertools
exec(open('pipeline/trail_bt.py').read().split("trades = []")[0])
def fr(mm): return max((mm - 555) / 375, 0.04)
ROWS = []; OLD = []; TODAYSIG = {}
for s, d, m in data:
    D = {ist(b[0]).strftime('%Y-%m-%d'): b for b in d}; dk = sorted(D); days = collections.defaultdict(list)
    for b in m:
        t = ist(b[0]); mm = t.hour * 60 + t.minute
        if 555 <= mm <= 930: days[t.strftime('%Y-%m-%d')].append((mm,) + b[1:])
    for day, bars in sorted(days.items()):
        if day not in D or len(bars) < 20: continue
        k = dk.index(day)
        if k < 22: continue
        pr = [D[x] for x in dk[:k]]; pc = pr[-1][4]; av = st.mean(b[5] for b in pr[-20:]) or 1; ml = min(b[3] for b in pr[-20:]); mh = max(b[2] for b in pr[-20:]); closes = [b[4] for b in pr[-120:]]
        if pc < 50 or av < 50000: continue
        o = bars[0][1]; cv = 0; hi = 0; lo = 1e18
        for i, (mm, bo, bh, bl, bc, bv) in enumerate(bars):
            cv += bv; hi = max(hi, bh); lo = min(lo, bl); mv = (bc / pc - 1) * 100; pace = cv / (av * fr(mm + 5))
            if mm > 690 or i + 1 >= len(bars): continue
            if cv >= 100000 and abs(mv) >= 1.5 and abs(mv) <= 6 and pace >= 2:
                sg = 1 if mv > 0 else -1; ep = bars[i+1][1]; best = 0; worst = 0; res = None
                for j in range(i + 1, len(bars)):
                    fav = (bars[j][2] / ep - 1) * 100 * sg if sg > 0 else (ep / bars[j][3] - 1) * 100
                    adv = (1 - bars[j][3] / ep) * 100 if sg > 0 else (bars[j][2] / ep - 1) * 100
                    if res is None and adv >= 1.0: res = ('stop', best)
                    if res is None: best = max(best, fav)
                    worst = max(worst, adv)
                if res is None: res = ('open', best)
                ROWS.append(dict(sym=s, date=day, mm=mm, sg=sg, mv=round(mv, 2), pace=round(pace, 1), best=round(best, 2), stopped=int(res[0] == 'stop'), close=round(((bars[-1][4] / ep - 1) * 100) * sg - COST, 3)))
                break
        # existing Big Fish Short timing for comparison (replicates the live rule)
        cv = 0; hi = 0; lo = 1e18; rs_c = closes
        for i, (mm, bo, bh, bl, bc, bv) in enumerate(bars):
            cv += bv; hi = max(hi, bh); lo = min(lo, bl); r = rsi14(rs_c + [bc])
            if bc >= 50 and cv >= 350000 and cv / (av * fr(mm + 5)) < 1.2 and (hi - lo) / lo * 100 >= 1.5 and (bc - o) / o * 100 <= -1.5 and r is not None and r < 40 and bc < ml:
                OLD.append(dict(sym=s, date=day, mm=mm, fell=round((bc / pc - 1) * 100, 2), left=round((bc / min(b[3] for b in bars[i:]) - 1) * 100, 2))); break
dates = sorted({r['date'] for r in ROWS}); cut = dates[int(len(dates) * 0.6)]
def S(T):
    n = len(T)
    if not n: return dict(n=0)
    w = [t for t in T if t['best'] >= 1.5]; w3 = [t for t in T if t['best'] >= 3]
    return dict(n=n, per_day=round(n / len({t['date'] for t in T}), 1), reach1_5=round(len(w) / n * 100, 1), reach3=round(len(w3) / n * 100, 1), stopped=round(sum(t['stopped'] for t in T) / n * 100, 1), avg_left=round(st.mean(t['best'] for t in T), 2), med_left=round(st.median(t['best'] for t in T), 2), avg_close_net=round(st.mean(t['close'] for t in T), 3), avg_move_at_alert=round(st.mean(abs(t['mv']) for t in T), 2))
out = dict(generated=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), alerts=len(ROWS), days=len(dates), split_after=cut)
out['all'] = S(ROWS); out['up'] = S([r for r in ROWS if r['sg'] > 0]); out['down'] = S([r for r in ROWS if r['sg'] < 0])
out['train'] = S([r for r in ROWS if r['date'] <= cut]); out['test'] = S([r for r in ROWS if r['date'] > cut])
for nm, f in (('pace>=3', lambda r: r['pace'] >= 3), ('pace>=5', lambda r: r['pace'] >= 5), ('move>=2.5', lambda r: abs(r['mv']) >= 2.5), ('before 10:00', lambda r: r['mm'] < 600), ('pace>=3 & move>=2', lambda r: r['pace'] >= 3 and abs(r['mv']) >= 2)):
    out['f ' + nm] = dict(train=S([r for r in ROWS if r['date'] <= cut and f(r)]), test=S([r for r in ROWS if r['date'] > cut and f(r)]))
# top-3 per day by pace*move
bd = collections.defaultdict(list)
for r in ROWS: bd[r['date']].append(r)
top = [t for d, v in bd.items() for t in sorted(v, key=lambda r: -r['pace'] * abs(r['mv']))[:3]]; out['top3_per_day'] = S(top); out['top3_test'] = S([t for t in top if t['date'] > cut])
out['old_bigfish_short'] = dict(n=len(OLD), median_fell_at_alert=round(st.median(o['fell'] for o in OLD), 2) if OLD else None, avg_left=round(st.mean(o['left'] for o in OLD), 2) if OLD else None, median_time=int(st.median(o['mm'] for o in OLD)) if OLD else None)
out['today'] = [r for r in ROWS if r['date'] == max(dates) and r['sym'] in ('WELCORP', 'NETWEB')]
json.dump(out, open(os.environ.get('OUT', '/tmp/early.json'), 'w'), separators=(',', ':'))
for k, v in out.items(): print(k, v)
