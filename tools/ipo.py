#!/usr/bin/env python3
"""NSE past issues (IPOs) -> data/ipo.json for the Portfolio page (Corporate Actions -> IPO details).
One record per listed symbol: s, n (company), ip (issue price, upper end of the band), band (text), op / cl (issue open / close),
ld (listing date), sec (series / security type), sme. Fetched year by year from NSE's own API; a year that fails is skipped
and the previous file's records are kept, so the list only grows ("kept for future reference")."""
import datetime as dt, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from corpact import opener, get, d2
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'ipo.json')

def price(x):
    n = [float(v.replace(',', '')) for v in re.findall(r'[\d,]+(?:\.\d+)?', str(x or '')) if re.search(r'\d', v)]
    n = [v for v in n if v > 0]
    return max(n) if n else None

def main():
    old = {}
    try: old = {r['s']: r for r in json.load(open(OUT)).get('a', [])}
    except Exception: pass
    op = opener(); today = dt.date.today(); got = 0; sample = None
    for y in range(2010, today.year + 1):
        f = dt.date(y, 1, 1); t = min(dt.date(y, 12, 31), today)
        url = 'https://www.nseindia.com/api/public-past-issues?from_date=%s&to_date=%s&security_type=all' % (f.strftime('%d-%m-%Y'), t.strftime('%d-%m-%Y'))
        try: j = get(op, url)
        except Exception as e: print('year', y, 'failed', str(e)[:120]); continue
        L = j if isinstance(j, list) else (j.get('data') or j.get('rows') or [])
        if L and sample is None: sample = L[0]
        for r in L:
            g = lambda *k: next((r[x] for x in k if r.get(x) not in (None, '', '-')), None)
            s = str(g('symbol', 'Symbol') or '').strip().upper()
            if not s: continue
            st = str(g('securityType', 'series', 'security_type') or '')
            rec = {'s': s, 'n': str(g('companyName', 'company', 'name') or '').strip(), 'band': str(g('priceRange', 'issuePrice', 'price') or '').strip(),
                   'ip': price(g('issuePrice', 'finalPrice', 'priceRange', 'price')), 'op': d2(g('issueStartDate', 'startDate') or ''), 'cl': d2(g('issueEndDate', 'endDate') or ''),
                   'ld': d2(g('listingDate', 'listing_date') or ''), 'sec': st, 'sme': 'SME' in st.upper() or 'SME' in str(g('series') or '').upper()}
            if rec['ld'] or rec['cl']: old[s] = {**old.get(s, {}), **{k: v for k, v in rec.items() if v not in (None, '')}}; got += 1
        time.sleep(1.2)
    print('records this run', got, 'total', len(old))
    if not old: print('nothing fetched; sample', sample); sys.exit(1)
    A = sorted(old.values(), key=lambda r: r.get('ld') or r.get('cl') or '', reverse=True)
    json.dump({'asOf': dt.datetime.utcnow().isoformat(timespec='seconds') + 'Z', 'src': 'NSE past issues', 'n': len(A), 'sample': sample, 'a': A},
              open(OUT, 'w'), separators=(',', ':'), ensure_ascii=False)

if __name__ == '__main__': main()
