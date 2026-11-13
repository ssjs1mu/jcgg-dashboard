#!/usr/bin/env python3
"""08:45 IST morning re-check of today's next-day plan against the overnight / pre-open picture:
GIFT Nifty, US index futures, Asia, crude, gold, US 10Y yield, dollar index, USD/INR, India VIX.
Each call gets an action: KEEP · WAIT (trigger counts only from 09:45, after the opening noise) · SKIP (not traded today),
with the reason. Result is written into plans.json (plan['morning'], call['adj']) - the page and the tracker follow it.
Usage: OLD=/tmp/old.json OUT=/tmp/plans.json python pipeline/morning_check.py"""
import datetime as dt, json, os, urllib.parse, urllib.request
import gift

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
# symbol, name, weight in the risk score (+ = rise is good for Indian equities), full-strength move %
F = [('ES=F', 'S&P 500 futures', 1, 1.0), ('NQ=F', 'Nasdaq futures', 0.7, 1.4), ('YM=F', 'Dow futures', 0.5, 1.0),
     ('^N225', 'Nikkei 225', 0.6, 1.5), ('^HSI', 'Hang Seng', 0.5, 1.5), ('^KS11', 'KOSPI', 0.4, 1.5),
     ('BZ=F', 'Brent crude', -0.8, 2.5), ('GC=F', 'Gold', -0.2, 1.5), ('^TNX', 'US 10Y yield', -0.5, 2.0),
     ('DX-Y.NYB', 'US $ index', -0.6, 0.6), ('USDINR=X', 'USD / INR', -0.6, 0.35), ('^INDIAVIX', 'India VIX (last close)', -0.5, 6)]
OMC = {'BPCL', 'HINDPETRO', 'IOC', 'ASIANPAINT', 'BERGEPAINT', 'INDIGO', 'PIDILITIND', 'APOLLOTYRE', 'MRF', 'CEATLTD', 'BALKRISIND'}
CRUDE_UP = {'ONGC', 'OIL', 'RELIANCE'}
IT = {'TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM', 'MPHASIS', 'PERSISTENT', 'COFORGE', 'OFSS', 'LTTS', 'KPITTECH', 'TATAELXSI', 'SONATSOFTW', 'CYIENT'}


def q(sym):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s?range=5d&interval=15m&includePrePost=true' % urllib.parse.quote(sym)
    x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20))['chart']['result'][0]
    m = x['meta']; c = [v for v in x['indicators']['quote'][0]['close'] if v is not None]
    last = c[-1] if c else m.get('regularMarketPrice'); pc = m.get('chartPreviousClose') or m.get('previousClose')
    # previous session close for futures / 24h markets: last bar of the previous calendar day (exchange time)
    ts = x.get('timestamp') or []; cl = x['indicators']['quote'][0]['close']
    if ts:
        d_last = dt.datetime.fromtimestamp(ts[-1], IST).date()
        prev = [cl[i] for i, t in enumerate(ts) if cl[i] is not None and dt.datetime.fromtimestamp(t, IST).date() < d_last]
        if prev and sym.endswith('=F'):
            pc = prev[-1]
    return last, pc, dt.datetime.fromtimestamp(ts[-1], IST).strftime('%d %b %H:%M') if ts else ''


def main():
    now = dt.datetime.now(IST); today = now.strftime('%Y-%m-%d')
    P = json.load(open(os.environ.get('OLD', '/tmp/old.json')))
    plan = P.get('plans', {}).get(today)
    if not plan:
        print('no plan for today'); return
    nifty = q('^NSEI'); nl = nifty[0] if nifty[0] else None
    rows, score, wsum = [], 0.0, 0.0
    for s, n, w, full in F:
        try:
            last, pc, at = q(s)
            ch = (last / pc - 1) * 100 if pc else 0
            eff = max(-1, min(1, ch / full)) * w
            score += eff; wsum += abs(w)
            rows.append({'s': s, 'n': n, 'last': round(last, 3), 'chg': round(ch, 2), 'eff': round(eff, 2), 'at': at})
        except Exception as e:
            rows.append({'s': s, 'n': n, 'err': str(e)[:60]})
    g = None
    try:
        g = gift.fetch(nl, now)
    except Exception:
        pass
    gap = g['vs_pct'] if g and g.get('vs_pct') is not None else None
    if gap is not None:
        score += max(-1, min(1, gap / 0.8)) * 2; wsum += 2
    sc = score / wsum * 100 if wsum else 0      # -100 .. +100
    est_gap = gap if gap is not None else round(sum(r.get('eff', 0) for r in rows[:3]) * 0.4, 2)
    bias = 'RISK-ON' if sc >= 20 else 'RISK-OFF' if sc <= -20 else 'NEUTRAL'
    R = {r['s']: r for r in rows if 'chg' in r}
    crude = R.get('BZ=F', {}).get('chg', 0); inr = R.get('USDINR=X', {}).get('chg', 0); nq = R.get('NQ=F', {}).get('chg', 0)
    kept = waits = skips = 0
    for c in plan['calls']:
        d = c['d']; act, why = 'KEEP', 'opening picture supports or is neutral for this call'
        if d > 0 and (est_gap <= -1.0 or sc <= -45):
            act, why = 'SKIP', 'strong gap-down / risk-off open (expected Nifty gap %+.2f%%) - long breakouts usually fail on such days' % est_gap
        elif d < 0 and (est_gap >= 1.0 or sc >= 45):
            act, why = 'SKIP', 'strong gap-up / risk-on open (expected Nifty gap %+.2f%%) - short breakdowns usually fail on such days' % est_gap
        elif d > 0 and (est_gap <= -0.4 or bias == 'RISK-OFF'):
            act, why = 'WAIT', 'weak open expected (%+.2f%%) - take the BUY only if it crosses the trigger after 09:45' % est_gap
        elif d < 0 and (est_gap >= 0.4 or bias == 'RISK-ON'):
            act, why = 'WAIT', 'strong open expected (%+.2f%%) - take the SELL only if it breaks the trigger after 09:45' % est_gap
        # sector overlays
        s = c['s']
        if crude >= 2 and d > 0 and s in OMC: act, why = 'WAIT', 'crude %+.1f%% overnight hurts this stock - BUY only after 09:45 confirmation' % crude
        if crude >= 2 and d < 0 and s in CRUDE_UP: act, why = 'SKIP', 'crude %+.1f%% overnight supports this stock - SELL dropped' % crude
        if crude <= -2 and d < 0 and s in OMC: act, why = 'SKIP', 'crude %+.1f%% overnight supports this stock - SELL dropped' % crude
        if crude <= -2 and d > 0 and s in CRUDE_UP: act, why = 'WAIT', 'crude %+.1f%% overnight hurts this stock - BUY only after 09:45' % crude
        if s in IT and d > 0 and nq <= -1.5: act, why = 'WAIT', 'Nasdaq futures %+.1f%% - IT BUY only after 09:45 confirmation' % nq
        if s in IT and d < 0 and (inr >= 0.4 or nq >= 1.5): act, why = 'SKIP', 'rupee weaker / US tech stronger - IT SELL dropped'
        # likely to open past the trigger already
        if act != 'SKIP':
            exp_open = c['close'] * (1 + est_gap / 100)
            if (d > 0 and exp_open > c['entry'] * 1.015) or (d < 0 and exp_open < c['entry'] * 0.985):
                why += ' · may open beyond the trigger by >1.5% - then it is not chased'
        c['adj'] = {'action': act, 'reason': why, 'from': '09:45' if act == 'WAIT' else '09:15'}
        kept += act == 'KEEP'; waits += act == 'WAIT'; skips += act == 'SKIP'
    plan['morning'] = {'at': now.isoformat(timespec='seconds'), 'score': round(sc, 1), 'bias': bias, 'gap': est_gap, 'gap_src': 'GIFT Nifty' if gap is not None else 'global futures (GIFT Nifty not available)',
                       'gift': g and {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in g.items()}, 'nifty_close': nl, 'factors': rows,
                       'summary': '%s · expected Nifty open %+.2f%% · %d keep, %d wait for 09:45, %d skip' % (bias, est_gap, kept, waits, skips)}
    json.dump(P, open(os.environ.get('OUT', '/tmp/plans.json'), 'w'), separators=(',', ':'))
    print(plan['morning']['summary'])
    for c in plan['calls']:
        print(' ', c['side'], c['s'], c['adj']['action'], '-', c['adj']['reason'])


if __name__ == '__main__':
    main()
