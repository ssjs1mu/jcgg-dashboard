#!/usr/bin/env python3
"""NSE corporate actions (equities) -> data/corpact.json for the Portfolio page.
Ex-dates from 1 April four financial years back to 90 days ahead, fetched month by month from NSE's own API.
Each action: s symbol, ex / rec dates (YYYY-MM-DD), sub (NSE text), t type, and the numbers the page needs:
  div  -> amt  rupees per share (all dividends in the text added: final + special ...)
  bonus-> r [a, b]  a new shares for every b held
  split-> fv [from, to] face value before / after (shares x from/to)
  rights / other -> text only.  Nothing is guessed: an action whose numbers cannot be read keeps t='other'."""
import datetime as dt, gzip, http.cookiejar, json, os, re, sys, time, urllib.request
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'corpact.json')

def opener():
    cj = http.cookiejar.CookieJar(); op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.addheaders = [('User-Agent', UA), ('Accept', 'application/json, text/plain, */*'), ('Accept-Language', 'en-US,en;q=0.9'),
                     ('Accept-Encoding', 'gzip'), ('Referer', 'https://www.nseindia.com/companies-listing/corporate-filings-actions')]
    for u in ('https://www.nseindia.com/', 'https://www.nseindia.com/companies-listing/corporate-filings-actions'):
        try: op.open(u, timeout=30).read()
        except Exception as e: print('warm', u, e)
        time.sleep(1)
    return op

def get(op, url):
    err = ''
    for a in range(4):
        try:
            r = op.open(url, timeout=60); raw = r.read()
            if r.headers.get('Content-Encoding') == 'gzip': raw = gzip.decompress(raw)
            return json.loads(raw.decode('utf-8', 'replace'))
        except Exception as e:
            err = str(e); time.sleep(2 + 3 * a)
    raise RuntimeError(url + ' -> ' + err)

def num(x):
    try: return float(str(x).replace(',', ''))
    except ValueError: return None

def parse(sub):
    s = ' '.join(str(sub or '').split()); L = s.lower(); o = {'t': 'other'}
    if 'bonus' in L:
        m = re.search(r'bonus\s*(\d+)\s*:\s*(\d+)', L)
        if m: return {'t': 'bonus', 'r': [int(m.group(1)), int(m.group(2))]}
    if 'split' in L or 'sub-division' in L or 'sub division' in L:
        m = re.search(r'from\s*(?:rs\.?|re\.?|inr)?\s*([\d.]+)\s*/?-?\s*(?:per share)?\s*(?:unit\s*)?to\s*(?:rs\.?|re\.?|inr)?\s*([\d.]+)', L)
        if m and num(m.group(1)) and num(m.group(2)): return {'t': 'split', 'fv': [num(m.group(1)), num(m.group(2))]}
    if 'dividend' in L:
        amts = [num(a) for a in re.findall(r'(?:rs\.?|re\.?|inr|₹)\s*-?\s*([\d]+(?:\.\d+)?)\s*/?-?\s*per\s*(?:equity\s*)?share', L)]
        amts = [a for a in amts if a is not None]
        if amts: return {'t': 'div', 'amt': round(sum(amts), 4)}
        if re.search(r'dividend', L): return {'t': 'div', 'amt': None}
    if 'rights' in L: return {'t': 'rights'}
    return o

def d2(x):
    for f in ('%d-%b-%Y', '%d-%m-%Y', '%Y-%m-%d'):
        try: return dt.datetime.strptime(str(x).strip(), f).date().isoformat()
        except ValueError: pass
    return None

def main():
    today = dt.date.today(); fy = dt.date((today.year if today.month >= 4 else today.year - 1) - 4, 4, 1)   # 4 earlier FYs too: old trade files / ledgers (bonus, split, dividends)
    end = today + dt.timedelta(days=90); op = opener(); rows = []; a = fy
    while a <= end:
        b = min(dt.date(a.year + (a.month == 12), a.month % 12 + 1, 1) - dt.timedelta(days=1), end)
        j = get(op, 'https://www.nseindia.com/api/corporates-corporateActions?index=equities&from_date=%s&to_date=%s' % (a.strftime('%d-%m-%Y'), b.strftime('%d-%m-%Y')))
        part = j if isinstance(j, list) else (j or {}).get('data', [])
        print(a, b, len(part)); rows += part; a = b + dt.timedelta(days=1); time.sleep(1.5)
    seen, out = set(), []
    for r in rows:
        if str(r.get('series', 'EQ')).strip() not in ('EQ', 'BE', 'BZ', 'SM', 'ST', ''): continue
        ex = d2(r.get('exDate'));
        if not ex: continue
        k = (r.get('symbol'), ex, r.get('subject'))
        if k in seen: continue
        seen.add(k); p = parse(r.get('subject'))
        out.append(dict({'s': str(r.get('symbol', '')).strip().upper(), 'ex': ex, 'rec': d2(r.get('recDate')), 'sub': ' '.join(str(r.get('subject', '')).split())[:140]}, **p))
    out.sort(key=lambda x: (x['ex'], x['s']))
    assert len(out) > 50, 'too few actions from NSE: %d' % len(out)
    from collections import Counter
    print('actions', len(out), Counter(x['t'] for x in out))
    json.dump({'note': 'NSE corporate actions (equities) - ex-dates ' + fy.isoformat() + ' to ' + end.isoformat() + '. t: div (amt Rs/share) | bonus (r a:b) | split (fv from,to) | rights | other',
               'asOf': dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ'), 'from': fy.isoformat(), 'to': end.isoformat(), 'a': out},
              open(OUT, 'w'), separators=(',', ':'))

if __name__ == '__main__':
    main()
