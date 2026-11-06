"""Index constituents + weights. NSE API gives free-float market cap (ffmc) per constituent - the same basis NSE uses for index weights.
Sensex (BSE) is not on the NSE API: fixed 30-name list, weighted by Yahoo market cap (approximate). Output: $OUT json."""
import json, os, time, requests
H={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36','Accept':'application/json,text/plain,*/*','Accept-Language':'en-US,en;q=0.9','Referer':'https://www.nseindia.com/'}
NSE={'NIFTY 50':'NIFTY 50','NIFTY BANK':'NIFTY BANK','NIFTY NEXT 50':'NIFTY NEXT 50','NIFTY IT':'NIFTY IT'}
SENSEX='RELIANCE HDFCBANK ICICIBANK INFY BHARTIARTL ITC LT TCS SBIN AXISBANK KOTAKBANK M&M HINDUNILVR BAJFINANCE MARUTI SUNPHARMA NTPC TATAMOTORS TITAN ULTRACEMCO POWERGRID ASIANPAINT HCLTECH BAJAJFINSV TATASTEEL ADANIPORTS TECHM NESTLEIND INDUSINDBK JSWSTEEL'.split()
out={'ts':int(time.time()),'indices':{}}
def nse():
    s=requests.Session(); s.headers.update(H)
    try: s.get('https://www.nseindia.com/',timeout=20); s.get('https://www.nseindia.com/market-data/live-equity-market',timeout=20)
    except Exception as e: print('nse warm fail',e)
    for k,v in NSE.items():
        for t in range(3):
            try:
                r=s.get('https://www.nseindia.com/api/equity-stockIndices',params={'index':v},timeout=25); j=r.json(); rows=[]
                for d in j['data']:
                    if d.get('priority') or d['symbol']==v: continue
                    ff=d.get('ffmc')
                    if ff: rows.append([d['symbol'],(d.get('meta') or {}).get('companyName') or d['symbol'],float(ff)])
                if rows: out['indices'][k]={'src':'NSE free-float mcap','rows':rows}; print(k,len(rows),'NSE ok'); break
            except Exception as e: print(k,'try',t,'fail',str(e)[:100]); time.sleep(2)
def yq(syms):
    res={}; s=requests.Session(); s.headers.update({'User-Agent':H['User-Agent']}); now=int(time.time())
    for x in syms:
        try:
            r=s.get('https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/'+x+'.NS',params={'type':'trailingMarketCap,quarterlyOrdinarySharesNumber','merge':'false','period1':now-400*86400,'period2':now},timeout=20).json()
            d={}
            for it in r['timeseries']['result']:
                k=it['meta']['type'][0]; v=[a['reportedValue']['raw'] for a in it.get(k,[]) if a and a.get('reportedValue')]
                if v: d[k]=v[-1]
            if d: res[x]=(x,d.get('trailingMarketCap'),d.get('quarterlyOrdinarySharesNumber'))
        except Exception as e: print('ts fail',x,str(e)[:80])
    print('timeseries ok',len(res),'of',len(syms)); return res
def arch():
    res={}
    for k,f in {'NIFTY 50':'ind_nifty50list','NIFTY BANK':'ind_niftybanklist','NIFTY NEXT 50':'ind_niftynext50list','NIFTY IT':'ind_niftyitlist'}.items():
        for base in ('https://nsearchives.nseindia.com/content/indices/','https://www.niftyindices.com/IndexConstituent/'):
            try:
                r=requests.get(base+f+'.csv',headers={'User-Agent':H['User-Agent']},timeout=20); print(k,base[:30],r.status_code,len(r.text))
                if r.status_code==200 and 'Symbol' in r.text:
                    L=r.text.strip().splitlines(); h=L[0].split(','); i=h.index('Symbol'); n=h.index('Company Name'); res[k]=[(l.split(',')[i].strip(),l.split(',')[n].strip()) for l in L[1:] if l]; break
            except Exception as e: print(k,'arch fail',str(e)[:80])
    return res
nse()
AR=arch(); need=set(SENSEX)
for k,v in AR.items():
    if k not in out['indices']: need|={a for a,_ in v}
mc=yq(sorted(need))
def mk(syms,names=None):
    r=[]
    for x in syms:
        m=mc.get(x)
        if m and m[1]: r.append([x,(names or {}).get(x,x),float(m[1])])
    return r
for k,v in AR.items():
    if k not in out['indices']:
        r=mk([a for a,_ in v],dict(v))
        if len(r)>=len(v)*0.8: out['indices'][k]={'src':'market cap (approx, not free-float)','rows':r}
r=mk(SENSEX)
if len(r)>=24: out['indices']['SENSEX']={'src':'market cap (approx, not free-float)','rows':r}
for k in list(out['indices']): print(k,len(out['indices'][k]['rows']),out['indices'][k]['src'])
json.dump(out,open(os.environ.get('OUT','/tmp/idx.json'),'w'))
