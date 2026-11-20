/* review.js - Trade-audit engine, shared by review.html (Trade Audit) and calculator.html (Advisory panel).
   Pure client-side maths on daily bars {d,o,h,l,c,v}. No prices are invented: every figure comes from the bars it is given.
   An entry is judged ONLY with what was known before the entry day (previous completed bar) plus the fill price itself. */
(function(g){
'use strict';
const sum=a=>a.reduce((x,y)=>x+y,0), mx=a=>Math.max.apply(null,a), mn=a=>Math.min.apply(null,a);
const pct=(a,b)=>(a/b-1)*100;
function ema(a,n){ const k=2/(n+1), o=[]; let e=null; a.forEach(x=>{ e=e==null?x:x*k+e*(1-k); o.push(e); }); return o; }
function rsi(c,n){ n=n||14; const o=new Array(c.length).fill(null); if(c.length<=n) return o; let G=0,L=0; for(let i=1;i<=n;i++){ const d=c[i]-c[i-1]; if(d>=0) G+=d; else L-=d; } G/=n; L/=n; o[n]=L===0?100:100-100/(1+G/L);
  for(let i=n+1;i<c.length;i++){ const d=c[i]-c[i-1]; G=(G*(n-1)+(d>0?d:0))/n; L=(L*(n-1)+(d<0?-d:0))/n; o[i]=L===0?100:100-100/(1+G/L); } return o; }
function atr(B,n){ n=n||14; const tr=B.map((b,i)=>i?Math.max(b.h-b.l,Math.abs(b.h-B[i-1].c),Math.abs(b.l-B[i-1].c)):b.h-b.l), o=new Array(B.length).fill(null); if(B.length<n) return o; let a=sum(tr.slice(0,n))/n; o[n-1]=a; for(let i=n;i<B.length;i++){ a=(a*(n-1)+tr[i])/n; o[i]=a; } return o; }
function prep(B){ const c=B.map(b=>b.c); const e12=ema(c,12), e26=ema(c,26), M=e12.map((x,i)=>x-e26[i]), sg=ema(M,9);
  return {B:B,c:c,e:{20:ema(c,20),50:ema(c,50),100:ema(c,100),200:ema(c,200)},rsi:rsi(c,14),atr:atr(B,14),hist:M.map((x,i)=>x-sg[i])}; }
const wkKey=d=>{ const t=new Date(d+'T00:00:00Z'), w=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-w); return t.toISOString().slice(0,10); };
function prevWeek(B,i){ const cur=wkKey(B[i]?B[i].d:'9999-12-31'); let k=null, out=[]; for(let j=Math.min(i,B.length)-1;j>=0;j--){ const w=wkKey(B[j].d); if(w===cur) continue; if(k==null) k=w; if(w!==k) break; out.push(B[j]); } if(!out.length) return null; return {h:mx(out.map(b=>b.h)),l:mn(out.map(b=>b.l)),c:out[0].c}; }

/* one snapshot of every parameter at entry bar i, for a fill at `price` (i may equal B.length: today's bar not yet in the data) */
function snap(X,i,price,dayVol,openPx){
  const B=X.B, p=i-1; if(p<30) return null;
  const S={i:i,date:B[i]?B[i].d:null,price:price,prev:B[p].c,prevDate:B[p].d};
  const o=openPx!=null?openPx:(B[i]?B[i].o:price);
  S.gap=pct(o,S.prev); S.day=pct(price,S.prev);
  [20,50,100,200].forEach(n=>{ S['e'+n]=p>=n-1?X.e[n][p]:null; });
  S.rsi=X.rsi[p]; S.hist=X.hist[p]; S.histPrev=X.hist[p-1]; S.atr=X.atr[p]; S.atrp=S.atr?S.atr/price*100:null;
  const w20=B.slice(Math.max(0,i-20),i), w10=B.slice(Math.max(0,i-10),i), w52=B.slice(Math.max(0,i-250),i);
  S.hi20=mx(w20.map(b=>b.h)); S.lo20=mn(w20.map(b=>b.l)); S.lo10=mn(w10.map(b=>b.l)); S.hi52=mx(w52.map(b=>b.h)); S.lo52=mn(w52.map(b=>b.l));
  S.rpos=S.hi20>S.lo20?(price-S.lo20)/(S.hi20-S.lo20)*100:50; S.pos52=S.hi52>S.lo52?(price-S.lo52)/(S.hi52-S.lo52)*100:50;
  const v20=B.slice(Math.max(0,i-20),i).map(b=>b.v).filter(v=>v>0); S.vav=v20.length?sum(v20)/v20.length:null; S.vr=(dayVol&&S.vav)?dayVol/S.vav:null;
  S.ret20=B[i-21]?pct(price,B[i-21].c):null; S.bounce10=pct(price,S.lo10);
  const q=B[p], P=(q.h+q.l+q.c)/3; S.P=P; S.R1=2*P-q.l; S.S1=2*P-q.h; const W=prevWeek(B,i); S.WP=W?(W.h+W.l+W.c)/3:null; S.Wl=W?W.l:null; S.Wh=W?W.h:null;
  const over=[['20-DMA',S.e20],['50-DMA',S.e50],['100-DMA',S.e100],['200-DMA',S.e200],['20-day high',S.hi20],['52-week high',S.hi52]].filter(x=>x[1]!=null&&x[1]>price*1.0005).sort((a,b)=>a[1]-b[1]);
  S.wall=over[0]||null; S.room=over[0]?pct(over[0][1],price):99;
  const pl=plan(S,price); S.stop=pl.stop; S.R=pl.R; S.t1=pl.t1; S.t2=pl.t2;
  return S; }


/* trade plan for an entry price: stop under the nearest structure 1.5-4% below (else 4% cap), T1 = 1.5R, T2 = 3R, rough sessions from ATR (distance/ATR squared) */
function plan(S,entry){
  const c=[['20-DMA',S.e20],['50-DMA',S.e50],['10-day low',S.lo10],['last week\'s low',S.Wl],['daily S1',S.S1]].filter(x=>x[1]!=null&&x[1]<=entry*0.985&&x[1]>=entry*0.96).sort((a,b)=>b[1]-a[1]);
  let stop,why; if(c.length){ stop=c[0][1]*0.997; why='just under '+c[0][0]+' '+c[0][1].toFixed(2); } else { stop=entry*0.96; why='4% cap (no structure nearby)'; }
  const R=entry-stop, atr=S.atr||entry*0.02, ses=d=>Math.max(3,Math.ceil(Math.pow(d/atr,2)));
  return {entry:entry,stop:stop,why:why,R:R,rp:R/entry*100,t1:entry+1.5*R,t2:entry+3*R,s1:ses(1.5*R),s2:ses(3*R)}; }
/* when the check fails: the exact price levels at which a buy would become acceptable */
function triggers(S,E){
  const f=k=>E.rows.some(r=>r.k===k&&r.ok===false), out=[], walls=[S.e20,S.e50,S.e100,S.e200,S.hi20,S.hi52].filter(x=>x!=null);
  const clear=L=>{ for(let k=0;k<4;k++){ const w=walls.filter(x=>x>L&&x<L*1.02).sort((a,b)=>a-b)[0]; if(!w) break; L=w*1.003; } return L; };
  let L=null, why=''; const fx=[]; if(f('trend')||f('relief')) fx.push(S.e50); if(f('align')) fx.push(Math.max(S.e20||0,S.e50||0));
  if(fx.length){ L=clear(Math.max.apply(null,fx)*1.003); why='closes above the 50-DMA'+(f('align')?' and 20-DMA':'')+' and clears the walls above'; }
  else if(f('room')&&S.wall){ L=clear(S.wall[1]*1.003); why='closes above the '+S.wall[0]+' '+S.wall[1].toFixed(2)+' wall'; }
  else if(f('range')&&S.price<=S.hi20){ L=S.hi20*1.003; why='breaks the 20-day high on 1.3x volume'; }
  if(L&&L>S.price*1.0005) out.push({label:'Buy only on a close above '+L.toFixed(2),why:why,vol:true,p:plan(S,L)});
  if((f('chase')||f('range'))&&S.e20&&!f('trend')&&S.price>S.e20*1.02){ const e=S.e20*1.005; out.push({label:'Or buy a pullback to the 20-DMA zone '+S.e20.toFixed(2)+' – '+(S.e20*1.01).toFixed(2),why:'pullback after the spike / at the range top',vol:false,p:plan(S,e)}); }
  return out; }

/* the 11 entry rules. crit = a failure here alone makes the entry RISKY; trend failure or two crit failures = WRONG */
const RULES=[
 {k:'trend',crit:1,name:'Price above 50-DMA',      t:S=>S.e50==null?null:S.price>S.e50,                                  v:S=>S.e50==null?'–':'CMP '+S.price.toFixed(2)+' vs 50-DMA '+S.e50.toFixed(2)+' ('+(pct(S.price,S.e50)>=0?'+':'')+pct(S.price,S.e50).toFixed(1)+'%)',   need:S=>'Close above '+S.e50.toFixed(2),   fix:'Buy only above the 50-DMA. Below it the stock is in a downtrend - wait.'},
 {k:'align',name:'20 > 50 DMA, price above 20',     t:S=>S.e20==null||S.e50==null?null:(S.price>S.e20&&S.e20>S.e50), v:S=>S.e20==null?'–':'CMP '+S.price.toFixed(2)+' · 20-DMA '+S.e20.toFixed(2)+' · 50-DMA '+S.e50.toFixed(2),  need:S=>'Close above '+Math.max(S.e20,S.e50).toFixed(2)+' and 20-DMA must rise above 50-DMA',  fix:'Wait for the averages to line up: price > 20-DMA > 50-DMA.'},
 {k:'long',name:'Price above 200-DMA',             t:S=>S.e200==null?null:S.price>S.e200,                                v:S=>S.e200==null?'–':'CMP '+S.price.toFixed(2)+' vs 200-DMA '+S.e200.toFixed(2)+' ('+(pct(S.price,S.e200)>=0?'+':'')+pct(S.price,S.e200).toFixed(1)+'%)', need:S=>'Close above '+S.e200.toFixed(2), fix:'Long-term trend should be up - prefer stocks above the 200-DMA.'},
 {k:'rsi',name:'RSI 14 between 50 and 70',         t:S=>S.rsi==null?null:(S.rsi>=50&&S.rsi<=70),                         v:S=>S.rsi==null?'–':S.rsi.toFixed(1),                need:S=>S.rsi<50?'RSI to climb above 50 (now '+S.rsi.toFixed(1)+')':'RSI is above 70 - let it cool to 50-70 (now '+S.rsi.toFixed(1)+')',                fix:'RSI under 50 = weak momentum, over 70 = stretched. Buy in 50-70.'},
 {k:'macd',name:'MACD histogram positive',         t:S=>S.hist==null?null:S.hist>=0,                                     v:S=>S.hist==null?'–':(S.hist>=0?'+':'')+S.hist.toFixed(2)+(S.histPrev!=null?(S.hist>S.histPrev?' ↑':' ↓'):''), need:S=>'MACD histogram to turn positive (now '+S.hist.toFixed(2)+')', fix:'MACD histogram should be above zero (momentum turning up).'},
 {k:'piv',name:'Above daily and weekly pivot',     t:S=>S.WP==null?null:(S.price>S.P&&S.price>S.WP),                     v:S=>S.WP==null?'–':'CMP '+S.price.toFixed(2)+' · daily pivot '+S.P.toFixed(2)+' · weekly pivot '+S.WP.toFixed(2),  need:S=>'Close above '+Math.max(S.P,S.WP).toFixed(2),  fix:'Carry only when price is above both the daily and the weekly pivot.'},
 {k:'chase',crit:1,name:'Not chasing a gap / spike', t:S=>!(S.day>3.5||S.gap>2),                                          v:S=>'gap '+(S.gap>=0?'+':'')+S.gap.toFixed(1)+'% · day '+(S.day>=0?'+':'')+S.day.toFixed(1)+'% (prev close '+S.prev.toFixed(2)+')', need:S=>'Do not buy today: wait for a pullback toward '+(S.e20!=null?S.e20.toFixed(2)+' (20-DMA)':S.prev.toFixed(2)+' (prev close)'), fix:'Never buy a gap-up above 2% or a day move above 3.5% (results-day spikes): wait for the pullback.'},
 {k:'range',crit:1,name:'Not at the range top without a breakout', t:S=>S.price>S.hi20?(S.vr==null?null:S.vr>=1.3):!(S.rpos>85), v:S=>'CMP '+S.price.toFixed(2)+' in 20-day range '+S.lo20.toFixed(2)+' – '+S.hi20.toFixed(2)+' ('+S.rpos.toFixed(0)+'%)'+(S.price>S.hi20?' · breakout'+(S.vr!=null?' vol '+S.vr.toFixed(1)+'x':''):''), need:S=>S.price>S.hi20?'Breakout needs 1.3x average volume':'Close above '+S.hi20.toFixed(2)+' on 1.3x volume, or buy a pullback to '+(S.e20!=null?S.e20.toFixed(2):S.lo20.toFixed(2)), fix:'Top of a 20-day range: buy only on a close above the high with 1.3x+ volume, or on a pullback to the 20-DMA.'},
 {k:'room',crit:1,name:'At least 2% room to next resistance', t:S=>S.room>=2,                                        v:S=>S.wall?'Next wall '+S.wall[0]+' '+S.wall[1].toFixed(2)+' is only '+S.room.toFixed(1)+'% above CMP '+S.price.toFixed(2):'clear air above',  need:S=>S.wall?'Buy only above '+(S.wall[1]*1.003).toFixed(2)+' (wall cleared), or below '+(S.wall[1]/1.02).toFixed(2)+' (2% room)':'',  fix:'Need 2%+ room to the next wall (averages, 20-day / 52-week high) before buying.'},
 {k:'relief',crit:1,name:'Not a relief bounce in a downtrend', t:S=>!(S.e50!=null&&S.price<S.e50&&(S.bounce10>=6||(S.ret20!=null&&S.ret20<=-12))), v:S=>'CMP +'+S.bounce10.toFixed(1)+'% above 10-day low '+S.lo10.toFixed(2)+' · 20-day '+(S.ret20==null?'–':(S.ret20>=0?'+':'')+S.ret20.toFixed(1)+'%'), need:S=>'Close above 50-DMA '+(S.e50!=null?S.e50.toFixed(2):'–'), fix:'A bounce while still under the 50-DMA is a trap: let it close above the 50-DMA first.'},
 {k:'vol',name:'Volume at least average',            t:S=>S.vr==null?null:S.vr>=1,                                         v:S=>S.vr==null?'–':S.vr.toFixed(2)+'x 20-day avg',  need:S=>'Volume at least the 20-day average',  fix:'Buy on average-or-better volume.'}
];
function evaluate(S){ const rows=RULES.map(r=>{ const ok=r.t(S); return {k:r.k,name:r.name,crit:!!r.crit,ok:ok,val:r.v(S),fix:r.fix,need:(ok===false&&r.need)?r.need(S):''}; });
  const ev=rows.filter(r=>r.ok!==null), pass=ev.filter(r=>r.ok).length, cf=rows.filter(r=>r.crit&&r.ok===false), nf=rows.filter(r=>!r.crit&&r.ok===false), tr=rows.find(r=>r.k==='trend');
  let v='RIGHT'; if((tr&&tr.ok===false)||cf.length>=2) v='WRONG'; else if(cf.length===1||nf.length>=3) v='RISKY';
  return {rows:rows,pass:pass,total:ev.length,score:ev.length?Math.round(pass/ev.length*100):0,verdict:v,fails:rows.filter(r=>r.ok===false)}; }

/* what happened after the entry */
function outcome(B,i,rate,S){ if(i>=B.length) return null; const aft=B.slice(i), last=B[B.length-1];
  const mae=pct(mn(aft.map(b=>b.l)),rate), mfe=pct(mx(aft.map(b=>b.h)),rate); let sd=null, td=null;
  for(let j=i;j<B.length;j++){ if(sd==null&&B[j].l<=S.stop) sd=B[j].d; if(td==null&&B[j].h>=S.t1) td=B[j].d; if(sd&&td) break; }
  return {days:B.length-1-i,last:last.c,lastDate:last.d,pl:pct(last.c,rate),mae:mae,mfe:mfe,stopDate:sd,t1Date:td,
          first:(sd&&td)?(sd<=td?'stop':'target'):sd?'stop':td?'target':'open'}; }

/* audit one buy lot: {d,sym,r(avg rate),q,n clients} on bars B */
function auditEntry(X,lot){ const B=X.B; let i=B.findIndex(b=>b.d>=lot.d); if(i<0) return null; if(B[i].d!==lot.d&&B[i].d>lot.d&&i===0) return null;
  const px=lot.r, bar=B[i]; const fillIn=px>=bar.l*0.995&&px<=bar.h*1.005; const S=snap(X,i,px,bar.v,bar.o); if(!S) return {err:'not enough history before '+lot.d};
  const E=evaluate(S); return {S:S,E:E,out:outcome(B,i,px,S),fillIn:fillIn,bar:bar}; }

/* audit a stop-out (sell) of an earlier buy, and the later re-entry */
function auditExit(X,sell,buy){ const B=X.B, i=B.findIndex(b=>b.d>=sell.d); if(i<0) return null; const S=snap(X,i,sell.r,B[i].v,B[i].o); if(!S) return {err:'not enough history'};
  const loss=pct(sell.r,buy.r), held=i-B.findIndex(b=>b.d>=buy.d);
  const broke=[]; if(S.e20!=null&&sell.r<S.e20) broke.push('below 20-DMA '+S.e20.toFixed(2)); if(S.e50!=null&&sell.r<S.e50) broke.push('below 50-DMA '+S.e50.toFixed(2)); if(sell.r<S.lo10) broke.push('under 10-day low '+S.lo10.toFixed(2)); if(S.Wl!=null&&sell.r<S.Wl) broke.push('under last week\'s low '+S.Wl.toFixed(2));
  const after=B.slice(i+1,i+11), post=after.length?{hi:mx(after.map(b=>b.h)),lo:mn(after.map(b=>b.l)),c:after[after.length-1].c,n:after.length}:null;
  const v=broke.length>=2?'VALID':broke.length===1?'DEBATABLE':'WEAK';
  return {S:S,loss:loss,held:held,broke:broke,post:post,verdict:v,bar:B[i]}; }
function auditReentry(X,sell,re){ const B=X.B, iS=B.findIndex(b=>b.d>=sell.d), i=B.findIndex(b=>b.d>=re.d); if(i<0||iS<0) return null; const S=snap(X,i,re.r,B[i].v,B[i].o); if(!S) return {err:'not enough history'};
  const gap=i-iS, vsExit=pct(re.r,sell.r), brk=re.r>S.hi20&&(S.vr==null||S.vr>=1.3), retest=S.rpos<=20&&S.hist>=S.histPrev, ok=(brk||retest)&&gap>=3&&!(S.day>3.5||S.gap>2);
  return {S:S,gap:gap,vsExit:vsExit,brk:brk,retest:retest,verdict:ok?'VALID':'NO TRIGGER',E:evaluate(S)}; }

/* advisory for a stock being searched right now: treat "buy at CMP today" as the entry */
function advisory(B,cmp,todayStr,liveVol,openPx){ if(!B||B.length<60) return null; const hasToday=B[B.length-1].d===todayStr; const X=prep(B); const i=hasToday?B.length-1:B.length;
  let S; if(hasToday){ S=snap(X,i,cmp,(liveVol===undefined?B[i].v:liveVol),openPx!=null?openPx:B[i].o); } else { const BB=B.concat([{d:todayStr,o:cmp,h:cmp,l:cmp,c:cmp,v:0}]); S=snap(prep(BB),i,cmp,null,openPx!=null?openPx:cmp); }
  if(!S) return null; const E=evaluate(S); return {S:S,E:E,now:plan(S,cmp),trig:triggers(S,E)}; }

g.JCR={plan:plan,triggers:triggers,RULES:RULES,prep:prep,snap:snap,evaluate:evaluate,outcome:outcome,auditEntry:auditEntry,auditExit:auditExit,auditReentry:auditReentry,advisory:advisory,pct:pct};
})(typeof window!=='undefined'?window:globalThis);
