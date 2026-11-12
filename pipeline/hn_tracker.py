#!/usr/bin/env python3
"""High Net-worth Trade tracker -> hntrack.json (branch `hntrack`).

record: once per trading day, between 10:15 and 12:30 IST (first run that finds a fresh feed), take the TOP PICK of the High Net-worth Trade screen
        from the live heat-map feed (heat.json, refreshed every 5 minutes) with exactly the page's rules
        (watchlist calls are per-browser, so the tracked pick uses the scanners only).
update: follow every open pick on 5-minute Yahoo bars from the minute it was recorded:
        TARGET or STOP, whichever is touched first (if one bar touches both, the stop is counted - conservative),
        sessions taken, best price reached (how close it came), exit after 20 sessions at the close if neither.
Usage: OLD=/tmp/old.json OUT=/tmp/hntrack.json python pipeline/hn_tracker.py
"""
import datetime as dt, json, os, urllib.parse, urllib.request

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
MAX_SESSIONS = 20


def getj(u, t=30):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t))


def eq2(a, b):
    return a is not None and b is not None and round(a * 100) == round(b * 100)


def crit(r, frac):
    sy, g, p, pc, o, h, l, v, av = r[:9]
    mh, ml, wh, wl, rs = (r + [None] * 15)[10:15]
    pace = v / (av * frac) if av else None
    rng = (h - l) / l * 100 if l else 0
    fo = (p / o - 1) * 100 if o else 0
    H = set()
    if eq2(o, l): H.add('OL')
    if eq2(o, h): H.add('OH')
    if pace is not None and rs is not None and mh is not None and p >= 50 and v >= 350000 and pace >= 1.5 and rng >= 1.5 and fo >= 2 and rs > 55 and p > mh: H.add('BF')
    if rs is not None and ml is not None and p >= 50 and v >= 350000 and rng >= 1.5 and fo <= -1.5 and rs < 40 and p < ml: H.add('BS')
    if mh is not None and p > mh: H.add('MH')
    if ml is not None and p < ml: H.add('ML')
    if wh is not None and p >= wh: H.add('WH')
    if wl is not None and p <= wl: H.add('WL')
    if pace is not None and pace >= 2 and p > pc and ((mh is not None and p > mh) or p >= h): H.add('VU')
    if pace is not None and pace >= 2 and p < pc and ((ml is not None and p < ml) or p <= l): H.add('VD')
    return H, pace


def pick(rows, frac):
    """the page's hnPick() without the watchlist part"""
    C = []
    for r in rows:
        if not r[3] or not r[4] or not r[5] or not r[6]:
            continue
        sy, g, p, pc, o, h, l = r[:7]
        mh, ml, wh, wl = (r + [None] * 15)[10:14]
        H, pace = crit(r, frac)
        ls = [n for k, n in (('BF', 'Big Fish'), ('VU', 'Vol up breakout'), ('MH', '1-month high'), ('WH', '52-week high')) if k in H]
        if 'OL' in H and p > pc: ls.insert(1, 'Open = Low')
        ss = [n for k, n in (('BS', 'Tail Fish'), ('VD', 'Vol down breakout'), ('ML', '1-month low'), ('WL', '52-week low')) if k in H]
        if 'OH' in H and p < pc: ss.insert(1, 'Open = High')
        for d, src in ((1, ls), (-1, ss)):
            if not src or not any(('Fish' in x or 'Open' in x or 'breakout' in x) for x in src) or pace is None or pace < 1.5:
                continue
            stop = (max(l, o if o < p else l) * 0.998) if d > 0 else (min(h, o if o > p else h) * 1.002)
            risk = abs(p - stop) / p * 100
            if risk <= 0.15 or risk > 3:
                continue
            lv = sorted([x for x in ((mh, '1-month high'), (wh, '52-week high')) if x[0] and x[0] > p * 1.003]) if d > 0 else \
                sorted([x for x in ((ml, '1-month low'), (wl, '52-week low')) if x[0] and x[0] < p * 0.997], reverse=True)
            tg = list(lv[0]) if lv else [p + d * 2 * abs(p - stop), 'past all highs: 2 x risk' if d > 0 else 'past all lows: 2 x risk']
            reach = 1.5 * (h - l)
            if abs(tg[0] - p) > reach:
                tg = [p + d * reach, "1.5 x today's range"]
            room = abs(tg[0] - p) / p * 100
            rr = room / risk
            if rr < 1.5:
                continue
            C.append({'s': sy, 'side': 'BUY' if d > 0 else 'SELL', 'd': d, 'entry': round(p, 2), 'stop': round(stop, 2), 'target': round(tg[0], 2), 'tgN': tg[1],
                      'room': round(room, 2), 'risk': round(risk, 2), 'rr': round(rr, 2), 'pace': round(pace, 1), 'src': src,
                      'score': room * (1 + 0.25 * (len(src) - 1)) * min(pace, 4) / 4 * min(rr, 3) / 3})
    C.sort(key=lambda c: -c['score'])
    return C


def bars5(sym):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=60d&interval=5m&includePrePost=false' % urllib.parse.quote(sym)
    x = getj(u)['chart']['result'][0]; q = x['indicators']['quote'][0]
    out = []
    for i, t in enumerate(x.get('timestamp') or []):
        if None in (q['high'][i], q['low'][i], q['close'][i]):
            continue
        out.append((t, q['high'][i], q['low'][i], q['close'][i]))
    return out


def follow(tr):
    B = bars5(tr['s'])
    t0 = tr['ts']; d = tr['d']; best = tr['entry']; best_day = None
    days = []
    for t, h, l, c in B:
        if t < t0:
            continue
        day = dt.datetime.fromtimestamp(t, IST).strftime('%Y-%m-%d')
        if not days or days[-1] != day:
            days.append(day)
        n = len(days) - 1          # sessions after the entry session (0 = same day)
        hit_stop = l <= tr['stop'] if d > 0 else h >= tr['stop']
        hit_tg = h >= tr['target'] if d > 0 else l <= tr['target']
        if (d > 0 and h > best) or (d < 0 and l < best):
            best = h if d > 0 else l; best_day = n
        if hit_stop:
            return dict(status='STOP', exit=tr['stop'], exit_date=day, days=n, best=round(best, 2), best_day=best_day, both=hit_tg)
        if hit_tg:
            return dict(status='TARGET', exit=tr['target'], exit_date=day, days=n, best=round(best, 2), best_day=best_day)
        if n >= MAX_SESSIONS:
            return dict(status='EXPIRED', exit=round(c, 2), exit_date=day, days=n, best=round(best, 2), best_day=best_day)
    last = B[-1] if B else None
    return dict(status='OPEN', last=round(last[3], 2) if last else None, last_date=days[-1] if days else None, days=len(days) - 1 if days else 0, best=round(best, 2), best_day=best_day)


def main():
    now = dt.datetime.now(IST); today = now.strftime('%Y-%m-%d'); mm = now.hour * 60 + now.minute
    try:
        T = json.load(open(os.environ.get('OLD', '/tmp/old.json')))
    except Exception:
        T = {}
    T.setdefault('trades', []); T.setdefault('log', [])
    fest = getj('https://raw.githubusercontent.com/ssjs1mu/jc-stock-analyst/main/data/festivals.json')
    hol = {x['date'] for x in fest.get('days', []) if x.get('trading_holiday')}
    trading = now.weekday() < 5 and today not in hol
    # record today's pick
    if trading and 615 <= mm <= 750 and not any(t['date'] == today for t in T['trades']) and today not in T.get('none', []):
        heat = getj('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/heat/heat.json?x=%d' % now.timestamp())
        hts = dt.datetime.fromisoformat(heat['ts'].replace('Z', '+00:00'))
        age = (now - hts).total_seconds() / 60
        rows = [r for r in heat['rows'] if r[9] == today]
        if age <= 20 and len(rows) > 200:
            frac = max(((hts.astimezone(IST).hour * 60 + hts.astimezone(IST).minute) - 555) / 375, 0.04)
            C = pick(rows, frac)
            if C:
                c = C[0]; c.pop('score')
                c.update(date=today, time=hts.astimezone(IST).strftime('%H:%M'), ts=int(hts.timestamp()), status='OPEN', alt=[x['s'] + ' ' + x['side'] for x in C[1:4]])
                T['trades'].append(c)
                T['log'].append('%s %s: recorded %s %s at %.2f' % (today, c['time'], c['s'], c['side'], c['entry']))
            else:
                T.setdefault('none', []).append(today)
                T['log'].append('%s: no set-up passed the filters' % today)
        else:
            T['log'].append('%s %02d:%02d: heat feed %.0f min old / %d rows - pick not recorded this run' % (today, now.hour, now.minute, age, len(rows)))
    # follow open picks
    for tr in T['trades']:
        if tr['status'] in ('TARGET', 'STOP', 'EXPIRED'):
            continue
        try:
            tr.update(follow(tr))
        except Exception as e:
            T['log'].append('%s: %s not updated (%s)' % (today, tr['s'], e))
    # returns
    for tr in T['trades']:
        px = tr.get('exit') if tr['status'] != 'OPEN' else tr.get('last')
        tr['ret'] = round((px / tr['entry'] - 1) * 100 * tr['d'], 2) if px else None
        if tr['status'] == 'STOP' and tr.get('best') is not None:
            tr['missed_by'] = round(abs(tr['target'] - tr['best']), 2)
    closed = [t for t in T['trades'] if t['status'] != 'OPEN' and t.get('ret') is not None]
    eq = 1.0
    for t in closed:
        eq *= 1 + t['ret'] / 100
    T['summary'] = {'picks': len(T['trades']), 'closed': len(closed), 'open': sum(1 for t in T['trades'] if t['status'] == 'OPEN'),
                    'targets': sum(1 for t in closed if t['status'] == 'TARGET'), 'stops': sum(1 for t in closed if t['status'] == 'STOP'),
                    'expired': sum(1 for t in closed if t['status'] == 'EXPIRED'),
                    'net_sum': round(sum(t['ret'] for t in closed), 2), 'net_compound': round((eq - 1) * 100, 2),
                    'avg': round(sum(t['ret'] for t in closed) / len(closed), 2) if closed else None,
                    'open_mtm': round(sum(t['ret'] or 0 for t in T['trades'] if t['status'] == 'OPEN'), 2)}
    T['updated'] = now.isoformat(timespec='seconds'); T['log'] = T['log'][-60:]
    json.dump(T, open(os.environ.get('OUT', '/tmp/hntrack.json'), 'w'), indent=1)
    print(json.dumps(T['summary']), '|', T['log'][-3:])


if __name__ == '__main__':
    main()
