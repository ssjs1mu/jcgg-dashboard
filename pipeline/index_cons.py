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
BACKEND='https://script.google.com/macros/s/AKfycbzMp82oHzLzKpaE0LrnUqEGGot7jqSw9e9VA1QhJNOPV35vOIYcfIChFL5PCDuD2Ahi5Q/exec'
from concurrent.futures import ThreadPoolExecutor
def one(x):
    u='https://query2.finance.yahoo.com/v10/finance/quoteSummary/'+requests.utils.quote(x+'.NS',safe='')+'?modules=defaultKeyStatistics'
    for t in range(3):
        try:
            j=requests.get(BACKEND,params={'action':'fetch','url':u},timeout=40).json(); d=j['quoteSummary']['result'][0]['defaultKeyStatistics']
            f=(d.get('floatShares') or {}).get('raw') or (d.get('sharesOutstanding') or {}).get('raw')
            if f: return x,float(f)
        except Exception as e: err=str(e)[:60]
        time.sleep(2)
    print('float fail',x); return x,None
def yq(syms):
    with ThreadPoolExecutor(6) as ex: res=dict(ex.map(one,syms))
    res={k:v for k,v in res.items() if v}; print('float shares ok',len(res),'of',len(syms)); return res
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
AR=arch(); AR['SENSEX']=[(x,x) for x in SENSEX]
mc=yq(sorted({a for v in AR.values() for a,_ in v}))
for k,v in AR.items():
    r=[[x,n,mc[x]] for x,n in v if x in mc]
    if len(r)>=len(v)*0.8: out['indices'][k]={'src':'free-float shares x live price','rows':r}
for k in out['indices']: print(k,len(out['indices'][k]['rows']))
json.dump(out,open(os.environ.get('OUT','/tmp/idx.json'),'w'))
