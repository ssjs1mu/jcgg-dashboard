"""Refine the Trail Board rules for win-rate with an honest walk-forward split: parameters are searched on the FIRST 60% of days only and every
candidate is then scored on the LAST 40% it never saw. Random search over entry filters, target, stop mode and exits."""
import os, json, time, random, math, statistics as st, collections
import numpy as np
exec(open('pipeline/trail_bt.py').read().split("trades = []")[0].replace("print('symbols with data'", "print('symbols with data'"))
def wil(w, n):
    if not n: return [0, 0]
    p = w / n; z = 1.96; den = 1 + z*z/n; c = (p + z*z/(2*n)) / den; hw = z * math.sqrt(p*(1-p)/n + z*z/(4*n*n)) / den; return [round((c-hw)*100), round((c+hw)*100)]
# ---- build global bar arrays + per stock-day info
O=[];H=[];L=[];C=[];Vv=[];MM=[];CHI=[];CLO=[];CV=[];VW=[];RG=[];MEAN3=[];RAT=[];RS=[];OL=[]
SD=[]  # per stock-day: dict(start,end,pc,o,avgR,std,date)
dates=set()
for s, d, m in data:
    D = {ist(b[0]).strftime('%Y-%m-%d'): b for b in d}; dk = sorted(D); days = collections.defaultdict(list)
    for b in m:
        t = ist(b[0]); mm = t.hour * 60 + t.minute
        if 555 <= mm <= 930: days[t.strftime('%Y-%m-%d')].append((mm,) + b[1:])
    for day, bars in sorted(days.items()):
        if day not in D or len(bars) < 30: continue
        k = dk.index(day)
        if k < 22: continue
        pr = [D[x] for x in dk[:k]]; pc = pr[-1][4]; cl = [b[4] for b in pr[-120:]]
        if len(cl) < 16: continue
        dd = [cl[i]-cl[i-1] for i in range(1, len(cl))]; ag = sum(max(x,0) for x in dd[:14])/14; al = sum(max(-x,0) for x in dd[:14])/14
        for x in dd[14:]: ag=(ag*13+max(x,0))/14; al=(al*13+max(-x,0))/14
        avgR = st.mean((b[2]-b[3])/b[1]*100 for b in pr[-20:] if b[1]); std = piv(pr[-1][2], pr[-1][3], pr[-1][4])
        o = bars[0][1]; hi = lo = o; cv = 0; pv = 0.0; V = []; start = len(C)
        for i, (mm, bo, bh, bl, bc, bv) in enumerate(bars):
            hi=max(hi,bh); lo=min(lo,bl); cv+=bv; pv+=(bh+bl+bc)/3*bv; V.append(bv)
            O.append(bo);H.append(bh);L.append(bl);C.append(bc);Vv.append(bv);MM.append(mm);CHI.append(hi);CLO.append(lo);CV.append(cv);VW.append(pv/cv if cv else bc)
            RG.append((hi-lo)/o*100/avgR if avgR else 0); RAT.append(st.mean(V[-3:])/max(st.mean(V[-6:-3]),1) if i>=5 else 0)
            dch = bc-pc; a2=(ag*13+max(dch,0))/14; b2=(al*13+max(-dch,0))/14; RS.append(100.0 if b2==0 else 100-100/(1+a2/b2)); OL.append((o-lo)/o<=0.0005)
        SD.append(dict(a=start,b=len(C),pc=pc,o=o,std=std,date=day,sym=s)); dates.add(day)
A={n:np.array(v) for n,v in dict(O=O,H=H,L=L,C=C,V=Vv,MM=MM,CHI=CHI,CLO=CLO,CV=CV,VW=VW,RG=RG,RAT=RAT,RS=RS,OL=OL).items()}
Cl=A['C']; seg=np.zeros(len(Cl),int); pcA=np.zeros(len(Cl)); oA=np.zeros(len(Cl)); dayi=np.zeros(len(Cl),int); first=np.zeros(len(Cl),bool)
ds=sorted(dates); di={d:i for i,d in enumerate(ds)}; cut=ds[int(len(ds)*0.6)]
for j,x in enumerate(SD): seg[x['a']:x['b']]=j; pcA[x['a']:x['b']]=x['pc']; oA[x['a']:x['b']]=x['o']; dayi[x['a']:x['b']]=di[x['date']]; first[x['a']]=True
kidx=np.arange(len(Cl))-np.array([SD[j]['a'] for j in seg]); print('bars',len(Cl),'stock-days',len(SD),'split date',cut)
def run(p):
    g=A['MM']<=p['tmax']; g&=A['MM']>=p['tmin']; g&=kidx>=5; g&=(oA>pcA*(1+p['gap']/100)); g&=Cl>A['VW']; g&=A['RG']>=p['vE']; g&=A['CV']>=p['qE']; g&=A['RS']>p['rsi']; g&=A['RAT']>p['rise']
    if p['ol']: g&=A['OL']
    idx=np.flatnonzero(g); 
    if not len(idx): return []
    sg=seg[idx]; keep=np.concatenate(([True],sg[1:]!=sg[:-1])); idx=idx[keep]; T=[]
    for k in idx:
        x=SD[seg[k]]; b=x['b']
        if k+1>=b: continue
        ep=A['O'][k+1]; lv=x['std']+piv(A['CHI'][k],A['CLO'][k],Cl[k])
        sl=(below(lv,ep,p['g2']) or ep*0.99) if p['stop']=='pivot' else ep*(1-p['stop']/100); tgt=ep*(1+p['tgt']/100) if p['tgt'] else None; xp=None; why='eod'
        for j in range(k+1,b):
            if A['L'][j]<=sl: xp=min(sl,A['O'][j]); why='stop'; break
            if tgt and A['H'][j]>=tgt: xp=max(tgt,A['O'][j]) if A['O'][j]<tgt else A['O'][j]; why='target'; break
            if p['stop']=='pivot' and p['trail']:
                s2=int(A['RG'][j]>=2.5)+int(A['CV'][j]>=500000)
                if s2:
                    nl=below(x['std']+piv(A['CHI'][j],A['CLO'][j],Cl[j]),Cl[j],0.5 if s2==1 else 0.25)
                    if nl and nl>sl: sl=nl
            if p['vexit'] and j>=k+4 and j-3>=x['a'] and A['V'][j-2:j+1].mean()<A['V'][j-5:j-2].mean() and A['V'][j-3:j].mean()<A['V'][j-6:j-3].mean(): xp=Cl[j]; why='volume'; break
            if A['MM'][j]>=915: xp=Cl[j]; why='eod'; break
        if xp is None: xp=Cl[b-1]
        T.append((x['date'],(xp/ep-1)*100-COST))
    return T
def stats(T):
    n=len(T)
    if n<1: return dict(n=0)
    R=[r for _,r in T]; w=sum(r>0 for r in R); gp=sum(r for r in R if r>0); gl=-sum(r for r in R if r<0)
    return dict(n=n,win=round(w/n*100,1),ci=wil(w,n),avg=round(st.mean(R),3),pf=round(gp/gl,2) if gl else None)
rng=random.Random(7); BASE=dict(rsi=55,vE=1.5,qE=300000,rise=1.0,gap=0,tmin=555,tmax=885,ol=False,g2=0.25,stop='pivot',tgt=None,trail=True,vexit=True)
def sample(): return dict(rsi=rng.choice([55,60,65,70]),vE=rng.choice([1.5,2,2.5,3]),qE=rng.choice([300000,600000,1000000,2000000]),rise=rng.choice([1.0,1.3,1.6,2.0]),gap=rng.choice([0,0.5,1,2]),tmin=rng.choice([555,585,615,660]),tmax=rng.choice([660,720,780,885]),ol=rng.choice([False,True]),g2=0.25,stop=rng.choice(['pivot',0.7,1.2,2.0]),tgt=rng.choice([None,0.5,0.8,1.2,2.0]),trail=rng.choice([True,False]),vexit=rng.choice([True,False]))
def split(T): return [t for t in T if t[0]<=cut],[t for t in T if t[0]>cut]
res=[]; t0=time.time(); N=int(os.environ.get('TRIALS','900'))
b=split(run(BASE)); base=dict(params=BASE,train=stats(b[0]),test=stats(b[1]))
while len(res)<N and time.time()-t0<1200:
    p=sample(); tr,te=split(run(p)); res.append(dict(params=p,train=stats(tr),test=stats(te)))
ok=[r for r in res if r['train'].get('n',0)>=80]
A_=sorted(ok,key=lambda r:-r['train']['win'])[:8]; B_=sorted([r for r in ok if r['train']['avg']>0],key=lambda r:-r['train']['win'])[:8]
C_=sorted([r for r in ok if r['test'].get('n',0)>=30],key=lambda r:-r['test']['win'])[:5]
out=dict(generated=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),trials=len(res),split_after=cut,days=len(ds),baseline=base,best_win_train=A_,best_win_profitable_train=B_,best_on_test_for_reference=C_,
         share_profitable_in_test=round(sum(1 for r in ok if r['test'].get('avg',-9)>0)/max(1,len(ok))*100,1))
json.dump(out,open(os.environ.get('OUT','/tmp/trail_opt.json'),'w'),separators=(',',':'))
print('baseline',base); 
for nm,L_ in (('A',A_),('B',B_)):
    for r in L_[:5]: print(nm,r['params'],'TRAIN',r['train'],'TEST',r['test'])
print('profitable in test share',out['share_profitable_in_test'])
