#!/usr/bin/env python3
"""Results board for the Watchlist page -> data/results_board.json

Three lists for the Nifty 500 universe (data/universe.json):
  upcoming  - board meetings with financial results in the next 14 days
  today     - results due today
  prev      - results on the previous trading day (their reaction shows today)

Sources (all real, nothing invented):
  * result dates: NSE event calendar, collected nightly by ssjs1mu/jc-stock-analyst (data/results.json)
  * prices: Yahoo daily bars (1 year)
  * NSE holidays: jc-stock-analyst data/festivals.json

Per stock:
  pre     - trend going into the result: 5-day and 20-day change, position vs 20/50-day averages, RSI 14
  timing  - ESTIMATED from how the stock reacted to its last results (gap next morning = after market,
            gap that morning = before market, move inside the day = during market); NSE publishes dates only
  hist    - past reactions: count, how many were up, average absolute move
  post    - reaction so far (prev-day results: today's move; today's results: move after the expected time)
  expect  - rule-based expected trend (stated in the page), never a price promise
"""
import concurrent.futures as cf, datetime as dt, json, os, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('OUT') or os.path.join(ROOT, 'data', 'results_board.json')
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
ERR = []
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))
RAW = 'https://raw.githubusercontent.com/ssjs1mu/jc-stock-analyst/main/data/'


def getj(u, t=30):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t))


def daily(sym):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s.NS?range=1y&interval=1d&includePrePost=false' % urllib.parse.quote(sym)
    for _ in range(3):
        try:
            x = getj(u, 20)['chart']['result'][0]; q = x['indicators']['quote'][0]
            rows = []
            for i, t in enumerate(x.get('timestamp') or []):
                if None in (q['open'][i], q['high'][i], q['low'][i], q['close'][i]):
                    continue
                rows.append((dt.datetime.fromtimestamp(t, IST).strftime('%Y-%m-%d'), q['open'][i], q['high'][i], q['low'][i], q['close'][i], q['volume'][i] or 0))
            return rows
        except Exception as e:
            if len(ERR) < 3:
                ERR.append('%s: %s' % (sym, e))
            import time; time.sleep(1.5)
    return None


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


def pre_trend(B, upto):
    """trend from the bars before index `upto` (exclusive)"""
    c = [b[4] for b in B[:upto]]
    if len(c) < 55:
        return None
    p = c[-1]; s20 = sum(c[-20:]) / 20; s50 = sum(c[-50:]) / 50
    d5 = (p / c[-6] - 1) * 100; d20 = (p / c[-21] - 1) * 100; r = rsi(c[-60:])
    sc = (1 if p > s20 else -1) + (1 if s20 > s50 else -1) + (1 if d20 > 3 else -1 if d20 < -3 else 0) + (1 if d5 > 1.5 else -1 if d5 < -1.5 else 0)
    lab = 'Strong up' if sc >= 3 else 'Up' if sc >= 1 else 'Strong down' if sc <= -3 else 'Down' if sc <= -1 else 'Sideways'
    return {'d5': round(d5, 2), 'd20': round(d20, 2), 'above20': p > s20, 'above50': p > s50, 'rsi': round(r, 1) if r else None, 'label': lab, 'close': round(p, 2)}


def reactions(B, dates):
    """for each past result date: estimated timing and the price reaction"""
    ix = {b[0]: i for i, b in enumerate(B)}
    out = []
    for d in dates:
        i = ix.get(d)
        if i is None or i < 1 or i + 1 >= len(B):
            continue
        pc, o, c, o2, c2 = B[i - 1][4], B[i][1], B[i][4], B[i + 1][1], B[i + 1][4]
        gd, intra, gn = abs(o / pc - 1), abs(c / o - 1), abs(o2 / c - 1)
        if gn > max(gd, intra) * 1.2:
            out.append({'date': d, 'tm': 'after', 'r': round((c2 / c - 1) * 100, 2)})
        elif gd >= intra:
            out.append({'date': d, 'tm': 'before', 'r': round((c / pc - 1) * 100, 2)})
        else:
            out.append({'date': d, 'tm': 'during', 'r': round((c / pc - 1) * 100, 2)})
    return out


TM = {'after': 'After market (after 3:30 PM)', 'during': 'During market hours', 'before': 'Before market (before 9:15 AM)'}


def expect(pre, hist, post=None):
    """rule-based expected trend; every rule is shown on the page"""
    n = len(hist); up = sum(1 for h in hist if h['r'] > 0); mv = round(sum(abs(h['r']) for h in hist) / n, 1) if n else None
    if post is not None:   # result is out: read the reaction
        if post >= 3:
            return 'Up - follow-through likely', 'up', mv
        if post <= -3:
            return 'Down - further weakness likely', 'dn', mv
        return 'Muted - prior trend likely to continue (%s)' % (pre['label'].lower() if pre else 'n/a'), 'nt', mv
    if n >= 3 and up / n >= 0.75:
        return 'Bullish bias (%d of %d past results up)' % (up, n), 'up', mv
    if n >= 3 and up / n <= 0.25:
        return 'Bearish bias (%d of %d past results down)' % (n - up, n), 'dn', mv
    if pre and pre['d20'] >= 8:
        return 'Ran up into results - sell-on-news risk', 'dn', mv
    if pre and pre['d20'] <= -8:
        return 'Fell into results - relief bounce possible', 'up', mv
    return 'Two-sided - wait for the number', 'nt', mv


def main():
    now = dt.datetime.now(IST); today = now.strftime('%Y-%m-%d')
    uni = json.load(open(os.path.join(ROOT, 'data', 'universe.json')))
    U = set(uni['large']) | set(uni['midsmall'])
    res = getj(RAW + 'results.json'); fest = getj(RAW + 'festivals.json')
    hol = {d['date'] for d in fest.get('days', []) if d.get('trading_holiday')}
    trade = lambda d: dt.date.fromisoformat(d).weekday() < 5 and d not in hol
    p = dt.date.fromisoformat(today) - dt.timedelta(days=1)
    while not trade(p.isoformat()):
        p -= dt.timedelta(days=1)
    prev = p.isoformat(); end = (dt.date.fromisoformat(today) + dt.timedelta(days=14)).isoformat()
    when = {}
    for s, L in res.get('upcoming', {}).items():
        for x in L:
            if s in U and prev <= x['date'] <= end:
                when.setdefault(s, set()).add(x['date'])
    for s, L in res.get('hist', {}).items():
        for d in L:
            d = d[:10]
            if s in U and prev <= d <= end:
                when.setdefault(s, set()).add(d)
    syms = sorted(when)
    with cf.ThreadPoolExecutor(8) as ex:
        bars = dict(zip(syms, ex.map(daily, syms)))
    rows = {'upcoming': [], 'today': [], 'prev': []}
    miss = 0
    for s in syms:
        B = bars.get(s)
        if not B or len(B) < 60:
            miss += 1; continue
        past = sorted({d[:10] for d in res.get('hist', {}).get(s, []) if d[:10] < prev})
        H = reactions(B, past)[-6:]
        tms = [h['tm'] for h in H]
        tm = max(set(tms), key=tms.count) if tms else None
        for d in sorted(when[s]):
            kind = 'prev' if d == prev else 'today' if d == today else 'upcoming' if d > today else None
            if not kind:
                continue
            ix = {b[0]: i for i, b in enumerate(B)}
            # bars before the result session: for an after-market result the result day itself still counts as "before"
            cut = ix.get(d, len(B))
            if kind == 'prev' and tm == 'after':
                cut += 1
            pre = pre_trend(B, min(cut, len(B)))
            post = None
            if kind == 'prev' and pre:
                last = B[-1]
                post = round((last[4] / pre['close'] - 1) * 100, 2) if last[0] >= today or tm != 'after' else None
            ex_txt, ex_dir, mv = expect(pre, H, post)
            rows[kind].append({'s': s, 'date': d, 'timing': TM.get(tm, 'Not enough history') , 'tm': tm, 'tmn': tms.count(tm) if tm else 0, 'n': len(H),
                               'pre': pre, 'hist': H, 'post': post, 'exp': ex_txt, 'ed': ex_dir, 'mv': mv,
                               'last': round(B[-1][4], 2), 'lastd': B[-1][0]})
    rows['upcoming'].sort(key=lambda r: (r['date'], r['s']))
    json.dump({'updated': now.isoformat(timespec='seconds'), 'd_today': today, 'd_prev': prev, 'source': 'NSE event calendar (via jc-stock-analyst results.json, updated %s) + Yahoo daily prices' % res.get('updated', '?'),
               'missing_prices': miss, **rows}, open(OUT, 'w'), separators=(',', ':'))
    print('price errors (first 3):', ERR)
    print('results board: %d upcoming, %d today, %d previous day (%d without prices)' % (len(rows['upcoming']), len(rows['today']), len(rows['prev']), miss))


if __name__ == '__main__':
    main()
