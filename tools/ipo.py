#!/usr/bin/env python3
"""NSE past issues (IPOs) -> data/ipo.json for the Portfolio page (Corporate Actions -> IPO details).
One record per listed symbol: s, n (company), ip (issue price, upper end of the band), band (text), op / cl (issue open / close),
ld (listing date), sec (series / security type), sme. Fetched year by year from NSE's own API; a year that fails is skipped
and the previous file's records are kept, so the list only grows ("kept for future reference").
Also data/ipo_det.json: per symbol the NSE ipo-detail record - DISCOUNT (retail / employee / shareholder), lot, max retail amount, issue size, subscription by category ..."""
import datetime as dt, json, os, re, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from corpact import opener, get, d2
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'ipo.json')

def price(x):
    n = [float(v.replace(',', '')) for v in re.findall(r'[\d,]+(?:\.\d+)?', str(x or '')) if re.search(r'\d', v)]
    n = [v for v in n if v > 0]
    return max(n) if n else None


DET = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'ipo_det.json')
RE_AMT = re.compile(r'(?:Rs\.?|INR|\u20b9)\s*([\d,]+(?:\.\d+)?)', re.I)
RE_PCT = re.compile(r'([\d.]+)\s*%')
CAT = {'r': re.compile(r'retail|\bRII|individual (?:investor|bidder)', re.I), 'e': re.compile(r'employee', re.I),
       's': re.compile(r'share ?holder|policy ?holder|\bholders?\b', re.I)}

def num0(x):
    try: return float(str(x).replace(',', ''))
    except Exception: return None

def discount(text):
    """NSE 'Discount' line -> {t: text, r: retail Rs/share, e: employee, s: shareholder / policy holder, rp/ep/sp: percent forms}.
    Each amount is attributed to the categories named after it (up to the next amount), else before it."""
    t = re.sub(r'\s+', ' ', str(text or '')).strip(); out = {'t': t[:320]}
    if not t or re.fullmatch(r'(?i)(nil|na|n/a|none|-|not applicable)\.?', t): return out
    for cl in re.split(r';|\.\s+(?=[A-Z])', t):          # ';' or a sentence end: each clause names its own categories
        hits = [(m.start(), m.end(), 'a', num0(m.group(1))) for m in RE_AMT.finditer(cl)] + [(m.start(), m.end(), 'p', num0(m.group(1))) for m in RE_PCT.finditer(cl)]
        hits.sort(); prev_end = 0
        for i, (a, b, kind, v) in enumerate(hits):
            nxt = hits[i + 1][0] if i + 1 < len(hits) else len(cl)
            after, before = cl[b:nxt], cl[prev_end:a]; prev_end = b
            cats = [k for k, rx in CAT.items() if rx.search(after)] or [k for k, rx in CAT.items() if rx.search(before)]
            for k in cats:
                key = k if kind == 'a' else k + 'p'
                if out.get(key) is None and v: out[key] = v
    return out

def first_int(x):
    m = re.search(r'[\d,]+', str(x or '')); return int(m.group(0).replace(',', '')) if m else None

def parse_detail(j):
    """NSE ipo-detail JSON -> compact record (None when NSE has no issue information for it)."""
    info = {str(x.get('title') or '').strip(): x.get('value') for x in ((j.get('issueInfo') or {}).get('dataList') or []) if x.get('title')}
    if not info or not (info.get('Issue Period') or info.get('Price Range')): return None
    clean = lambda v, n=300: re.sub(r'\s+', ' ', str(v or '').strip().strip('"')).strip()[:n]
    mx = re.findall(r'[\d,]+', str(info.get('Maximum Subscription Amount for Retail Investor') or ''))
    rows = ((j.get('activeCat') or {}).get('dataList') or [])[1:] or j.get('bidDetails') or []
    sub, offr, lab = {}, {}, {}
    for r in rows:
        sr = r.get('srNo'); k = {'1': 'qib', '2': 'nii', '2.1': 'bnii', '2.2': 'snii', '3': 'ret', '4': 'emp', '5': 'oth', None: 'tot'}.get(sr)
        if not k: continue
        x = num0(r.get('noOfTotalMeant') if 'noOfTotalMeant' in r else r.get('noOfTime')); o = num0(r.get('noOfShareOffered') if 'noOfShareOffered' in r else r.get('noOfSharesOffered'))
        if x is not None: sub[k] = round(x, 2)
        if o: offr[k] = int(o)
        if k == 'oth': lab[k] = clean(r.get('category'), 40)
    d = {'t': clean(info.get('Issue Type'), 60), 'per': clean(info.get('Issue Period'), 120), 'sz': clean(info.get('Issue Size'), 320), 'band': clean(info.get('Price Range'), 80),
         'fv': num0((re.search(r'\d[\d,]*(?:\.\d+)?', str(info.get('Face Value') or '')) or [None])[0]), 'lot': first_int(info.get('Bid Lot')), 'mq': first_int(info.get('Minimum Order Quantity')),
         'mx': num0(mx[0]) if mx else None, 'disc': discount(info.get('Discount')), 'reg': clean(info.get('Name of the Registrar'), 80), 'lm': clean(info.get('Book Running Lead Managers'), 260),
         'isin': (j.get('metaInfo') or {}).get('isin') or '', 'sub': sub, 'offr': offr, 'othn': lab.get('oth', ''), 'at': clean((j.get('activeCat') or {}).get('updateTime'), 60)}
    rhp = str(info.get('Red Herring Prospectus') or '')
    if rhp.startswith('http'): d['rhp'] = rhp.strip()
    return {k: v for k, v in d.items() if v not in (None, '', {}, [])}

def fetch_detail(op, sym, sme):
    for ser in (['SM', 'EQ'] if sme else ['EQ', 'SM']):
        try: j = get(op, 'https://www.nseindia.com/api/ipo-detail?symbol=%s&series=%s' % (sym, ser))
        except Exception as e: print('detail', sym, ser, str(e)[:100]); continue
        d = parse_detail(j or {})
        if d: return d
    return None

def run_details(op, A, budget_s=900, per_run=320):
    """IPO details (discount, lot, subscription ...) per symbol -> data/ipo_det.json. Newest first; recent issues are refreshed every run
    (subscription moves), older ones once; a symbol NSE has nothing for is remembered (nf) and retried only while it is recent."""
    try: cur = json.load(open(DET)).get('d', {})
    except Exception: cur = {}
    today = dt.date.today().isoformat(); recent = (dt.date.today() - dt.timedelta(days=21)).isoformat(); t0 = time.time(); n = 0
    todo = []
    for r in A:                                               # A is newest first
        k = r['s']; c = cur.get(k); new = r.get('ld') or r.get('cl') or ''
        if c is None or (c.get('nf') and new >= recent) or (new >= recent and c.get('at0') != today): todo.append(r)
    for r in todo[:per_run]:
        if time.time() - t0 > budget_s: break
        d = fetch_detail(op, r['s'], r.get('sme'))
        cur[r['s']] = dict(d, at0=today) if d else {'nf': 1, 'at0': today}
        n += 1; time.sleep(0.6)
    print('ipo details fetched', n, 'of', len(todo), 'waiting; total', len(cur), 'with data', sum(1 for v in cur.values() if not v.get('nf')))
    json.dump({'asOf': dt.datetime.utcnow().isoformat(timespec='seconds') + 'Z', 'src': 'NSE ipo-detail', 'n': len(cur), 'd': cur}, open(DET, 'w'), separators=(',', ':'), ensure_ascii=False)

def main():
    old = {}
    try: old = {r['s']: r for r in json.load(open(OUT)).get('a', [])}
    except Exception: pass
    op = opener(); today = dt.date.today(); got = 0; sample = None
    months = [(y, m) for y in range(2012, today.year + 1) for m in range(1, 13) if dt.date(y, m, 1) <= today]
    for y, m in months:       # month by month: the API returns a capped list per call
        f = dt.date(y, m, 1); t = min((dt.date(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1)), today)
        url = 'https://www.nseindia.com/api/public-past-issues?from_date=%s&to_date=%s&security_type=all' % (f.strftime('%d-%m-%Y'), t.strftime('%d-%m-%Y'))
        try: j = get(op, url)
        except Exception as e: print('month', y, m, 'failed', str(e)[:120]); continue
        L = j if isinstance(j, list) else (j.get('data') or j.get('rows') or [])
        if L and sample is None: sample = L[0]
        for r in L:
            g = lambda *k: next((r[x] for x in k if r.get(x) not in (None, '', '-')), None)
            s = str(g('symbol', 'Symbol') or '').strip().upper()
            if not s: continue
            st = str(g('securityType', 'series', 'security_type') or '')
            rec = {'s': s, 'n': str(g('companyName', 'company', 'name') or '').strip(), 'band': str(g('priceRange', 'issuePrice', 'price') or '').strip(),
                   'ip': price(g('issuePrice', 'finalPrice', 'priceRange', 'price')), 'op': d2(g('ipoStartDate', 'issueStartDate', 'startDate') or ''), 'cl': d2(g('ipoEndDate', 'issueEndDate', 'endDate') or ''),
                   'ld': d2(g('listingDate', 'listing_date') or ''), 'sec': st, 'sme': 'SME' in st.upper() or 'SME' in str(g('series') or '').upper()}
            if rec['ld'] or rec['cl']: old[s] = {**old.get(s, {}), **{k: v for k, v in rec.items() if v not in (None, '')}}; got += 1
        time.sleep(0.7)
    print('records this run', got, 'total', len(old))
    if not old: print('nothing fetched; sample', sample); sys.exit(1)
    A = sorted(old.values(), key=lambda r: r.get('ld') or r.get('cl') or '', reverse=True)
    json.dump({'asOf': dt.datetime.utcnow().isoformat(timespec='seconds') + 'Z', 'src': 'NSE past issues', 'n': len(A), 'sample': sample, 'a': A},
              open(OUT, 'w'), separators=(',', ':'), ensure_ascii=False)
    try: run_details(op, A)
    except Exception as e: print('details failed', str(e)[:200])

if __name__ == '__main__': main()
