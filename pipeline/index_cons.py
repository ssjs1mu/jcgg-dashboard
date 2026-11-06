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
    s=requests.Session(); s.headers.update({'User-Agent':H['User-Agent']}); res={}
    try:
        s.get('https://fc.yahoo.com',timeout=15); cr=s.get('https://query1.finance.yahoo.com/v1/test/getcrumb',timeout=15).text
        for i in range(0,len(syms),40):
            r=s.get('https://query1.finance.yahoo.com/v7/finance/quote',params={'symbols':','.join(x+'.NS' for x in syms[i:i+40]),'crumb':cr},timeout=20).json()
            for q in r['quoteResponse']['result']: res[q['symbol'][:-3]]=(q.get('longName') or q.get('shortName') or q['symbol'],q.get('marketCap'))
    except Exception as e: print('yahoo fail',str(e)[:120])
    return res
nse()
mc=yq(SENSEX)
rows=[[s,mc[s][0],float(mc[s][1])] for s in SENSEX if s in mc and mc[s][1]]
if rows: out['indices']['SENSEX']={'src':'Yahoo market cap (approx, not free-float)','rows':rows}; print('SENSEX',len(rows))
for k in list(out['indices']): print(k,len(out['indices'][k]['rows']),out['indices'][k]['src'])
json.dump(out,open(os.environ.get('OUT','/tmp/idx.json'),'w'))
