#!/usr/bin/env python3
"""High Net-worth Trade tracker -> hntrack.json (branch `hntrack`).

record: EVERY recommendation of the High Net-worth Trade screen (the 15 set-ups the page lists), all session long
        (09:20-15:20 IST, a run every ~10 minutes), stamped with the date and time it first appeared, its rank and whether it was
        the top pick; one entry per stock and side per day. Exactly the page's rules on the live heat-map feed
        (watchlist calls are per-browser, so tracked picks use the scanners only).
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


BC = {}


def bars5(sym, rng='60d'):
    if (sym, rng) in BC:
        return BC[(sym, rng)]
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=%s&interval=5m&includePrePost=false' % (urllib.parse.quote(sym), rng)
    x = getj(u)['chart']['result'][0]; q = x['indicators']['quote'][0]
    out = []
    for i, t in enumerate(x.get('timestamp') or []):
        if None in (q['high'][i], q['low'][i], q['close'][i]):
            continue
        out.append((t, q['high'][i], q['low'][i], q['close'][i]))
    BC[(sym, rng)] = out
    return out


def follow(tr, now):
    age = (now.timestamp() - tr['ts']) / 86400
    B = bars5(tr['s'], '5d' if age < 3 else '1mo' if age < 25 else '60d')
    t0 = tr['ts']; d = tr['d']; best = tr['entry']; best_day = None
    days = []; nb = 0      # nb = 5-minute bars in the market since the entry (duration in market minutes)
    for t, h, l, c in B:
        if t + 300 <= t0:      # bar closed before the pick was made
            continue
        day = dt.datetime.fromtimestamp(t, IST).strftime('%Y-%m-%d')
        if not days or days[-1] != day:
            days.append(day)
        n = len(days) - 1          # sessions after the entry session (0 = same day)
        hit_stop = l <= tr['stop'] if d > 0 else h >= tr['stop']
        hit_tg = h >= tr['target'] if d > 0 else l <= tr['target']
        if (d > 0 and h > best) or (d < 0 and l < best):
            best = h if d > 0 else l; best_day = n
        nb += 1
        ex = dict(exit_date=day, exit_time=dt.datetime.fromtimestamp(t + 300, IST).strftime('%H:%M'), days=n, best=round(best, 2), best_day=best_day, mins=nb * 5)
        if hit_stop:
            return dict(status='STOP', exit=tr['stop'], both=hit_tg, **ex)
        if hit_tg:
            return dict(status='TARGET', exit=tr['target'], **ex)
        if n >= MAX_SESSIONS:
            return dict(status='EXPIRED', exit=round(c, 2), **ex)
    last = B[-1] if B else None
    return dict(status='OPEN', last=round(last[3], 2) if last else None, last_date=days[-1] if days else None, days=len(days) - 1 if days else 0, best=round(best, 2), best_day=best_day, mins=nb * 5)


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
    # record every recommendation of the screen (first appearance, time-stamped)
    if trading and 560 <= mm <= 920:
        heat = json.load(open(os.environ['HEAT'])) if os.environ.get('HEAT') else getj('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/heat/heat.json?x=%d' % now.timestamp())
        hts = dt.datetime.fromisoformat(heat['ts'].replace('Z', '+00:00'))
        age = (now - hts).total_seconds() / 60
        rows = [r for r in heat['rows'] if r[9] == today]
        if age <= 20 and len(rows) > 200:
            frac = max(((hts.astimezone(IST).hour * 60 + hts.astimezone(IST).minute) - 555) / 375, 0.04)
            have = {(t['date'], t['s'], t['side']) for t in T['trades']}
            new = []
            for rank, c in enumerate(pick(rows, frac)[:15], 1):
                if (today, c['s'], c['side']) in have:
                    continue
                c.pop('score')
                c.update(date=today, time=hts.astimezone(IST).strftime('%H:%M'), ts=int(hts.timestamp()), status='OPEN', rank=rank, top=rank == 1)
                T['trades'].append(c); new.append('%s %s #%d' % (c['s'], c['side'], rank))
            if new:
                T['log'].append('%s %s: recorded %s' % (today, hts.astimezone(IST).strftime('%H:%M'), ', '.join(new)))
        else:
            T['log'].append('%s %02d:%02d: heat feed %.0f min old / %d rows - nothing recorded this run' % (today, now.hour, now.minute, age, len(rows)))
    # follow open picks
    for tr in T['trades']:
        if tr['status'] in ('TARGET', 'STOP', 'EXPIRED'):
            continue
        try:
            tr.update(follow(tr, now))
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
                    'open_mtm': round(sum(t['ret'] or 0 for t in T['trades'] if t['status'] == 'OPEN'), 2),
                    'avg_mins_target': round(sum(t.get('mins') or 0 for t in closed if t['status'] == 'TARGET') / max(1, sum(1 for t in closed if t['status'] == 'TARGET'))),
                    'avg_mins_stop': round(sum(t.get('mins') or 0 for t in closed if t['status'] == 'STOP') / max(1, sum(1 for t in closed if t['status'] == 'STOP'))),
                    'top_picks': sum(1 for t in T['trades'] if t.get('top', True))}
    T['updated'] = now.isoformat(timespec='seconds'); T['log'] = T['log'][-120:]
    json.dump(T, open(os.environ.get('OUT', '/tmp/hntrack.json'), 'w'), indent=1)
    print(json.dumps(T['summary']), '|', T['log'][-3:])


if __name__ == '__main__':
    main()
