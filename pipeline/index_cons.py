"""All Nifty index constituents (NSE archive CSVs) + free-float shares (Yahoo via the shared Apps Script backend, cached between runs).
Sensex = fixed 30-name list. Output json: {ts, indices:{NAME:{y:yahooSymbol,rows:[[sym,company]]}}, floats:{sym:shares}}"""
import json, os, time, requests
from concurrent.futures import ThreadPoolExecutor
UA={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'}
BACKEND='https://script.google.com/macros/s/AKfycbzMp82oHzLzKpaE0LrnUqEGGot7jqSw9e9VA1QhJNOPV35vOIYcfIChFL5PCDuD2Ahi5Q/exec'
# name, nse csv, yahoo index symbol
CAT=[('NIFTY 50','ind_nifty50list','^NSEI'),('NIFTY NEXT 50','ind_niftynext50list','^NSMIDCP'),('NIFTY 100','ind_nifty100list','^CNX100'),('NIFTY 200','ind_nifty200list','^CNX200'),('NIFTY 500','ind_nifty500list',''),
('NIFTY MIDCAP 50','ind_niftymidcap50list',''),('NIFTY MIDCAP 100','ind_niftymidcap100list','NIFTY_MIDCAP_100.NS'),('NIFTY MIDCAP 150','ind_niftymidcap150list','NIFTYMIDCAP150.NS'),
('NIFTY SMALLCAP 50','ind_niftysmallcap50list',''),('NIFTY SMALLCAP 100','ind_niftysmallcap100list',''),('NIFTY SMALLCAP 250','ind_niftysmallcap250list',''),
('NIFTY BANK','ind_niftybanklist','^NSEBANK'),('NIFTY PRIVATE BANK','ind_nifty_privatebanklist','NIFTY_PVT_BANK.NS'),('NIFTY PSU BANK','ind_niftypsubanklist','^CNXPSUBANK'),('NIFTY FIN SERVICE','ind_niftyfinancelist','NIFTY_FIN_SERVICE.NS'),
('NIFTY IT','ind_niftyitlist','^CNXIT'),('NIFTY AUTO','ind_niftyautolist','^CNXAUTO'),('NIFTY METAL','ind_niftymetallist','^CNXMETAL'),('NIFTY PHARMA','ind_niftypharmalist','^CNXPHARMA'),('NIFTY FMCG','ind_niftyfmcglist','^CNXFMCG'),
('NIFTY REALTY','ind_niftyrealtylist','^CNXREALTY'),('NIFTY ENERGY','ind_niftyenergylist','^CNXENERGY'),('NIFTY MEDIA','ind_niftymedialist','^CNXMEDIA'),('NIFTY INFRA','ind_niftyinfralist','^CNXINFRA'),('NIFTY PSE','ind_niftypselist','^CNXPSE'),
('NIFTY MNC','ind_niftymnclist','^CNXMNC'),('NIFTY SERVICES','ind_niftyservicelist','^CNXSERVICE'),('NIFTY CONSUMPTION','ind_niftyconsumptionlist','^CNXCONSUM'),('NIFTY OIL & GAS','ind_niftyoilgaslist','NIFTY_OIL_AND_GAS.NS'),
('NIFTY HEALTHCARE','ind_niftyhealthcarelist','NIFTY_HEALTHCARE.NS'),('NIFTY CONSUMER DURABLES','ind_niftyconsumerdurableslist','NIFTY_CONSR_DURBL.NS'),('NIFTY COMMODITIES','ind_niftycommoditieslist','^CNXCMDT'),
('NIFTY INDIA DIGITAL','ind_niftyindiadigitallist','NIFTY_IND_DIGITAL.NS'),('NIFTY INDIA DEFENCE','ind_niftyindiadefencelist',''),('NIFTY INDIA MANUFACTURING','ind_niftyindiamanufacturinglist',''),('NIFTY CAPITAL MARKETS','ind_niftycapitalmarketslist',''),
('NIFTY ALPHA 50','ind_niftyalpha50list',''),('NIFTY LOW VOLATILITY 50','ind_niftylowvolatility50list',''),('NIFTY HIGH BETA 50','ind_niftyhighbeta50list','')]
SENSEX='RELIANCE HDFCBANK ICICIBANK INFY BHARTIARTL ITC LT TCS SBIN AXISBANK KOTAKBANK M&M HINDUNILVR BAJFINANCE MARUTI SUNPHARMA NTPC TMPV TITAN ULTRACEMCO POWERGRID ASIANPAINT HCLTECH BAJAJFINSV TATASTEEL ADANIPORTS TECHM NESTLEIND INDUSINDBK JSWSTEEL'.split()
def csv(f):
    for base in ('https://nsearchives.nseindia.com/content/indices/','https://www.niftyindices.com/IndexConstituent/'):
        try:
            r=requests.get(base+f+'.csv',headers=UA,timeout=20)
            if r.status_code==200 and 'Symbol' in r.text:
                L=r.text.strip().splitlines(); h=[x.strip() for x in L[0].split(',')]; i=h.index('Symbol'); n=h.index('Company Name')
                return [[l.split(',')[i].strip(),l.split(',')[n].strip()] for l in L[1:] if l.strip()]
        except Exception as e: pass
    return None
out={'ts':int(time.time()),'indices':{},'floats':{}}
for name,f,y in CAT:
    r=csv(f); print(name,'->',len(r) if r else 'none')
    if r: out['indices'][name]={'y':y,'rows':r}
out['indices']['SENSEX']={'y':'^BSESN','rows':[[x,x] for x in SENSEX]}
need=sorted({r[0] for v in out['indices'].values() for r in v['rows']})
old={}
try:
    old=requests.get('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/idx/idx.json',timeout=20).json().get('floats',{})
except Exception as e: print('no previous',str(e)[:60])
monday=time.gmtime().tm_wday==0
def one(x):
    u='https://query2.finance.yahoo.com/v10/finance/quoteSummary/'+requests.utils.quote(x+'.NS',safe='')+'?modules=defaultKeyStatistics'
    for t in range(3):
        try:
            j=requests.get(BACKEND,params={'action':'fetch','url':u},timeout=40).json(); d=j['quoteSummary']['result'][0]['defaultKeyStatistics']
            f=(d.get('floatShares') or {}).get('raw') or (d.get('sharesOutstanding') or {}).get('raw')
            if f: return x,float(f)
        except Exception as e: pass
        time.sleep(2)
    return x,None
todo=[x for x in need if monday or x not in old]; print('symbols',len(need),'to fetch',len(todo))
t0=time.time()
with ThreadPoolExecutor(8) as ex: got=dict(ex.map(one,todo)) if todo else {}
out['floats']={x:(got.get(x) or old.get(x)) for x in need if (got.get(x) or old.get(x))}
print('floats',len(out['floats']),'of',len(need),'in',int(time.time()-t0),'s; missing',[x for x in need if x not in out['floats']][:40])
json.dump(out,open(os.environ.get('OUT','/tmp/idx.json'),'w'))
