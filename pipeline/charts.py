"""Builds charts.json: real Yahoo OHLCV candles for every macro tile (5-min ~5 days, daily ~8 months), fetched on the GitHub runner.
{ts, c:{symbol:{m5:[[t,o,h,l,c,v],...], d:[[t,o,h,l,c,v],...]}}}  (t = unix seconds, UTC)"""
import os, json, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
SYMS = ['^NSEI','^NSEBANK','^BSESN','^INDIAVIX','^CNXIT','^NSMIDCP','BZ=F','CL=F','USDINR=X','DX-Y.NYB','^TNX','GC=F','^DJI','^GSPC','^IXIC','^N225',
        'YM=F','ES=F','NQ=F','ZN=F','^HSI','^TWII','XIN9.FGI','^GDAXI','^FTSE','^STOXX50E','SI=F','HG=F','NG=F']
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': '*/*'}
def bars(s, rng, iv, keep):
    u = 'https://query1.finance.yahoo.com/v8/finance/chart/%s?range=%s&interval=%s&includePrePost=false' % (urllib.parse.quote(s), rng, iv)
    for a in range(3):
        try:
            x = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15))['chart']['result'][0]; q = x['indicators']['quote'][0]
            out = []
            for i, t in enumerate(x['timestamp']):
                o, h, l, c = q['open'][i], q['high'][i], q['low'][i], q['close'][i]
                if None in (o, h, l, c): continue
                out.append([t, round(o, 4), round(h, 4), round(l, 4), round(c, 4), int(q['volume'][i] or 0)])
            return out[-keep:]
        except Exception:
            time.sleep(1 + a)
def get(s):
    m5 = bars(s, '5d', '5m', 420); d = bars(s, '8mo', '1d', 170)
    return s, {'m5': m5 or [], 'd': d or []}
with ThreadPoolExecutor(8) as ex: C = {k: v for k, v in ex.map(get, SYMS) if v['m5'] or v['d']}
print('symbols', len(SYMS), 'got', len(C))
if len(C) < len(SYMS) * 0.5: sys.exit('too few - keeping previous charts')
json.dump({'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'c': C}, open(os.environ.get('OUT_CH', 'data/charts.json'), 'w'), separators=(',', ':'))
