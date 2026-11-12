#!/usr/bin/env python3
"""Tomorrow's trade calls -> plans.json (branch `plan`).

Built after the close from today's closing data for the Nifty 500, with every indicator the app's calls use:
  * day structure: change, close position in the day range (closing strength), range
  * volume: today's volume vs the 20-day average
  * levels: 1-month high / low, 52-week high / low
  * trend: EMA 9 / EMA 21 (daily), close vs EMA 9, RSI 14, ATR 14
  * scanners today: Big Fish / Tail Fish, Open = Low / Open = High, volume breakouts
  * index movers: the stock's sector money flow (in / out), Nifty heavyweights, quality bounce
Score -> top BUY and SELL set-ups. Each call is a BREAKOUT PLAN for the next session:
  BUY  trigger = today's high + 0.1%   SELL trigger = today's low - 0.1%
  stop = the other side of today's structure, but never more than 1.2 x ATR (and risk <= 3%)
  T1 = 1R, T2 = 2R, T3 = next 1M / 52W level or 3R
  rules: valid 09:15-14:00 · skip if it gaps beyond the trigger by more than 1.5% (don't chase) · exit by 15:15
Usage: OLD=/tmp/old.json OUT=/tmp/plans.json python pipeline/next_day.py
"""
import concurrent.futures as cf, datetime as dt, json, os, urllib.parse, urllib.request
import hn_tracker as H

IST = H.IST
UA = H.UA
getj = H.getj


def daily(sym):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=6mo&interval=1d&includePrePost=false' % urllib.parse.quote(sym)
    for _ in range(2):
        try:
            x = getj(u, 20)['chart']['result'][0]; q = x['indicators']['quote'][0]; out = []
            for i, t in enumerate(x.get('timestamp') or []):
                if None in (q['open'][i], q['high'][i], q['low'][i], q['close'][i]):
                    continue
                out.append((dt.datetime.fromtimestamp(t, IST).strftime('%Y-%m-%d'), q['open'][i], q['high'][i], q['low'][i], q['close'][i], q['volume'][i] or 0))
            return out
        except Exception:
            pass
    return None


def ema(v, n):
    k = 2 / (n + 1); e = v[0]; out = [e]
    for x in v[1:]:
        e = x * k + e * (1 - k); out.append(e)
    return out


def rsi(c, n=14):
    if len(c) <= n:
        return None
    g = l = 0.0
    for i in range(1, n + 1):
        d = c[i] - c[i - 1]; g += max(d, 0); l += max(-d, 0)
    g /= n; l /= n
    for i in range(n + 1, len(c)):
        d = c[i] - c[i - 1]; g = (g * (n - 1) + max(d, 0)) / n; l = (l * (n - 1) + max(-d, 0)) / n
    return 100.0 if l == 0 else 100 - 100 / (1 + g / l)


def atr(B, n=14):
    tr = [max(B[i][2] - B[i][3], abs(B[i][2] - B[i - 1][4]), abs(B[i][3] - B[i - 1][4])) for i in range(1, len(B))]
    if len(tr) < n:
        return None
    a = sum(tr[:n]) / n
    for x in tr[n:]:
        a = (a * (n - 1) + x) / n
    return a


def main():
    now = dt.datetime.now(IST); today = now.strftime('%Y-%m-%d')
    fest = getj('https://raw.githubusercontent.com/ssjs1mu/jc-stock-analyst/main/data/festivals.json')
    hol = {x['date'] for x in fest.get('days', []) if x.get('trading_holiday')}
    trade = lambda d: d.weekday() < 5 and d.isoformat() not in hol
    if not trade(now.date()) or now.hour * 60 + now.minute < 930:
        print('not after a trading session - nothing to plan'); return
    nd = now.date() + dt.timedelta(days=1)
    while not trade(nd):
        nd += dt.timedelta(days=1)
    try:
        P = json.load(open(os.environ.get('OLD', '/tmp/old.json')))
    except Exception:
        P = {'plans': {}}
    heat = json.load(open(os.environ['HEAT'])) if os.environ.get('HEAT') else getj('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/heat/heat.json?x=%d' % now.timestamp())
    rows = [r for r in heat['rows'] if r[9] == today and r[3] and r[4] and r[5] and r[6]]
    if len(rows) < 200:
        print('heat feed has only %d rows for today - not planning' % len(rows)); return
    cons = getj('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/idx/idx.json', 40)
    # index-movers readings on the closing data (full session: frac = 1)
    imc = {(c['s'], c['d']): c['kinds'] for c in H.im_calls(rows, 1.0, cons)}
    Q = {r[0]: r for r in rows}; fl = cons.get('floats', {})
    sector_flow = {}
    for n, I in cons['indices'].items():
        if n in H.BROAD:
            continue
        rs_ = [Q[c[0]] for c in I['rows'] if c[0] in Q and c[0] in fl]
        if len(rs_) < 8:
            continue
        sp = sum(fl[r[0]] * r[2] for r in rs_); sc = sum(fl[r[0]] * r[3] for r in rs_)
        ip = (sp / sc - 1) * 100 if sc else 0; br = sum(1 for r in rs_ if r[2] > r[3]) / len(rs_) * 100
        f = 1 if ip >= 0.5 and br >= 60 else -1 if ip <= -0.5 and br <= 40 else 0
        for r in rs_:
            sector_flow.setdefault(r[0], []).append((n.replace('NIFTY ', ''), f, round(ip, 2)))
    BF = set(heat.get('bf', {})); BS = set(heat.get('bs', {}))
    # first screen on the closing snapshot
    C = []
    for r in rows:
        sy, g, p, pc, o, h, l, v, av = r[:9]; mh, ml, wh, wl, rs = (r + [None] * 15)[10:15]
        if p < 50 or v < 300000 or h <= l:
            continue
        ch = (p / pc - 1) * 100; pos = (p - l) / (h - l); vx = v / av if av else 0
        for d in (1, -1):
            pts = []; why = []
            if d * ch >= 1: pts.append(1); why.append('%+.1f%% today' % ch)
            if (pos >= 0.7 if d > 0 else pos <= 0.3): pts.append(1); why.append('closed near the %s' % ('high' if d > 0 else 'low'))
            if vx >= 1.5: pts.append(1 if vx < 3 else 1.5); why.append('volume %.1fx' % vx)
            if d > 0 and ((mh and p >= mh) or (wh and p >= wh * 0.97)): pts.append(1.5); why.append('at 1-month high' if mh and p >= mh else 'near 52-week high')
            if d < 0 and ((ml and p <= ml) or (wl and p <= wl * 1.03)): pts.append(1.5); why.append('at 1-month low' if ml and p <= ml else 'near 52-week low')
            if rs is not None and (55 <= rs <= 75 if d > 0 else 25 <= rs <= 45): pts.append(1); why.append('RSI %.0f' % rs)
            if (sy in BF and d > 0) or (sy in BS and d < 0): pts.append(1.5); why.append('Big Fish today' if d > 0 else 'Tail Fish today')
            if d > 0 and H.eq2(o, l) and p > pc: pts.append(1); why.append('Open = Low')
            if d < 0 and H.eq2(o, h) and p < pc: pts.append(1); why.append('Open = High')
            fl_ = [x for x in sector_flow.get(sy, []) if x[1] == d]
            if fl_: pts.append(1.5); why.append('%s money %s (%+.1f%%)' % (fl_[0][0], 'flowing in' if d > 0 else 'leaving', fl_[0][2]))
            if (sy, d) in imc: pts.append(1); why.append(' + '.join(H.KIND[k] for k in imc[(sy, d)]))
            sc_ = sum(pts)
            if sc_ >= 4.5 and d * ch > 0:
                C.append({'s': sy, 'd': d, 'sc': sc_, 'why': why, 'r': r})
    C.sort(key=lambda c: -c['sc'])
    C = C[:70]
    # daily bars for the shortlist: EMA 9/21, ATR, RSI on final closes
    with cf.ThreadPoolExecutor(10) as ex:
        D = dict(zip([c['s'] for c in C], ex.map(daily, [c['s'] for c in C])))
    calls = []
    for c in C:
        B = D.get(c['s'])
        if not B or len(B) < 40:
            continue
        if B[-1][0] != today:          # Yahoo has not posted today's bar yet: use the snapshot's numbers for today
            r = c['r']; B = B + [(today, r[4], r[5], r[6], r[2], r[7])]
        cl = [b[4] for b in B]; e9 = ema(cl, 9); e21 = ema(cl, 21); a = atr(B); rs = rsi(cl)
        o_, h_, l_, p_ = B[-1][1], B[-1][2], B[-1][3], B[-1][4]; d = c['d']
        trend = (p_ > e9[-1] > e21[-1]) if d > 0 else (p_ < e9[-1] < e21[-1])
        sc_ = c['sc'] + (1.5 if trend else -1)
        if trend: c['why'].append('EMA 9 %s EMA 21, close %s EMA 9' % ('>' if d > 0 else '<', 'above' if d > 0 else 'below'))
        if not a or sc_ < 5:
            continue
        en = h_ * 1.001 if d > 0 else l_ * 0.999
        st = l_ if d > 0 else h_
        if abs(en - st) > 1.2 * a:
            st = en - d * 1.2 * a
        R = abs(en - st); risk = R / en * 100
        if risk < 0.4 or risk > 3:
            continue
        mh, ml, wh, wl = (c['r'] + [None] * 15)[10:14]
        lv = sorted(x for x in (mh, wh) if x and x > en + 2.2 * R) if d > 0 else sorted((x for x in (ml, wl) if x and x < en - 2.2 * R), reverse=True)
        t3 = lv[0] if lv and abs(lv[0] - en) <= 4 * R else en + d * 3 * R
        calls.append({'s': c['s'], 'side': 'BUY' if d > 0 else 'SELL', 'd': d, 'score': round(sc_, 1), 'why': c['why'],
                      'close': round(p_, 2), 'dh': round(h_, 2), 'dl': round(l_, 2), 'chg': round((p_ / B[-2][4] - 1) * 100, 2),
                      'entry': round(en, 2), 'stop': round(st, 2), 't1': round(en + d * R, 2), 't2': round(en + d * 2 * R, 2), 't3': round(t3, 2),
                      'risk': round(risk, 2), 'atr': round(a, 2), 'rsi': round(rs, 1) if rs else None, 'e9': round(e9[-1], 2), 'e21': round(e21[-1], 2),
                      'sector': (sector_flow.get(c['s']) or [('', 0, 0)])[0][0]})
    calls.sort(key=lambda x: -x['score'])
    longs = [x for x in calls if x['d'] > 0][:12]; shorts = [x for x in calls if x['d'] < 0][:6]
    plan = {'for': nd.isoformat(), 'from': today, 'made': now.isoformat(timespec='seconds'), 'calls': longs + shorts,
            'rules': {'valid_from': '09:15', 'valid_to': '14:00', 'gap_skip_pct': 1.5, 'exit_by': '15:15'}}
    P.setdefault('plans', {})[nd.isoformat()] = plan
    P['plans'] = {k: P['plans'][k] for k in sorted(P['plans'])[-15:]}
    P['latest'] = nd.isoformat(); P['updated'] = now.isoformat(timespec='seconds')
    json.dump(P, open(os.environ.get('OUT', '/tmp/plans.json'), 'w'), separators=(',', ':'))
    print('plan for %s: %d BUY, %d SELL (from %d screened, %d shortlisted)' % (nd, len(longs), len(shorts), len(rows), len(C)))
    for x in longs + shorts:
        print(' ', x['side'], x['s'], x['entry'], x['stop'], x['t1'], x['t2'], x['t3'], x['score'], '|', '; '.join(x['why']))


if __name__ == '__main__':
    main()
