/* Joshi's Corner - portfolio engine shared by portfolio.html and watchlist.html (same browser data).
   Trades: uploaded trade book (localStorage jc_pf_trades) or the anonymised Trade Audit sample (data/trades.json).
   Charges: brokerage per client (jc_pf_rates) + statutory rates (jc_pf_stat, official defaults below). Marks: jc_pf_mark. */
(function(){
'use strict';
const ist=()=>new Date(Date.now()+19800000);
const todayS=()=>ist().toISOString().slice(0,10);
const dmy=d=>d?d.slice(8,10)+'-'+d.slice(5,7)+'-'+d.slice(0,4):'–';
const days=(a,b)=>Math.round((Date.parse(b)-Date.parse(a))/864e5);
const addD=(d,n)=>new Date(Date.parse(d)+n*864e5).toISOString().slice(0,10);
const LS={get(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
/* statutory: STT delivery 0.1% buy+sell, intraday 0.025% sell; NSE transaction 0.00307%; SEBI Rs 10/crore;
   stamp duty delivery 0.015% buy, intraday 0.003% buy; GST 18% on brokerage + transaction + SEBI + DP (as of Nov 2026) */
const STAT0={sttD:0.1,sttI:0.025,exch:0.00307,sebi:0.0001,stampD:0.015,stampI:0.003,gst:18,int:18};
const stat=()=>Object.assign({},STAT0,LS.get('jc_pf_stat',{}));
const rates=()=>LS.get('jc_pf_rates',{_def:{bd:0,bi:0,dp:0}});
const rateOfFrom=R=>c=>Object.assign({},R._def,R[c]||{});
/* uploaded trade books, client-wise: each upload replaces the trades of the client codes it contains (codes only, never names) */
function tb(){ let t=LS.get('jc_pf_tb',null);
  if(!t){ const o=LS.get('jc_pf_trades',null); t={files:[],trades:[]}; if(o&&o.trades&&o.trades.length){ t.trades=o.trades; t.files=[{name:o.name,at:o.at,clients:[...new Set(o.trades.map(x=>x.c))],n:o.trades.length}]; } LS.set('jc_pf_tb',t); try{ localStorage.removeItem('jc_pf_trades'); }catch(e){} }
  return t; }
function addTrades(name,at,rows){ const t=tb(), cs=[...new Set(rows.map(x=>x.c))]; t.trades=t.trades.filter(x=>!cs.includes(x.c)).concat(rows);
  t.files=t.files.map(f=>Object.assign({},f,{clients:f.clients.filter(c=>!cs.includes(c))})).filter(f=>f.clients.length).concat([{name,at,clients:cs,n:rows.length}]); LS.set('jc_pf_tb',t); return cs; }
function removeTrades(c){ const t=tb(); if(c==null){ t.trades=[]; t.files=[]; } else { t.trades=t.trades.filter(x=>x.c!==c); t.files=t.files.map(f=>Object.assign({},f,{clients:f.clients.filter(x=>x!==c)})).filter(f=>f.clients.length); } LS.set('jc_pf_tb',t); }
async function loadTrades(base){ const up=tb();
  if(up.trades.length){ const cs=[...new Set(up.trades.map(x=>x.c))]; return {trades:up.trades,src:'uploaded trade books - '+cs.length+' client'+(cs.length>1?'s':'')+', '+up.trades.length+' fills',up:true}; }
  if(LS.get('jc_pf_nosample',false)) return {trades:[],src:'no trade book uploaded yet (sample hidden)',up:false};
  const T=await fetch((base||'')+'data/trades.json?x='+Date.now(),{cache:'no-store'}).then(r=>r.json());
  return {trades:T.trades.map(t=>({d:t.d,c:t.c,sym:t.sym,side:t.side,q:+t.q,r:+t.r})),src:'sample trade book from Trade Audit (as of '+dmy(T.asof)+', client names removed)',up:false}; }
function compute(TR,STAT,rateOf){
  const fills=TR.map((t,i)=>Object.assign({i},t)).sort((a,b)=>a.d.localeCompare(b.d)||a.i-b.i);
  /* split each fill into intraday / delivery parts: per client + symbol + day, the offsetting quantity is intraday */
  const grp={}; fills.forEach(f=>{ const k=f.c+'|'+f.sym+'|'+f.d; (grp[k]=grp[k]||{B:[],S:[]})[f.side==='S'?'S':'B'].push(f); });
  const parts=[];
  Object.values(grp).forEach(g=>{ const bq=g.B.reduce((a,f)=>a+f.q,0), sq=g.S.reduce((a,f)=>a+f.q,0); let iq={B:Math.min(bq,sq),S:Math.min(bq,sq)};
    ['B','S'].forEach(s=>g[s].forEach(f=>{ const qi=Math.min(f.q,iq[s]); iq[s]-=qi; if(qi>0) parts.push(Object.assign({},f,{q:qi,type:'I'})); if(f.q-qi>0) parts.push(Object.assign({},f,{q:f.q-qi,type:'D'})); })); });
  parts.sort((a,b)=>a.d.localeCompare(b.d)||(a.side==='B'?-1:1)||a.i-b.i);
  const dpDone={};
  parts.forEach(p=>{ const R=rateOf(p.c), v=p.q*p.r, buy=p.side!=='S', D=p.type==='D';
    p.v=v; p.brk=v*(D?R.bd:R.bi)/100;
    p.stt=D?v*STAT.sttD/100:(buy?0:v*STAT.sttI/100);
    p.exch=v*STAT.exch/100; p.sebi=v*STAT.sebi/100;
    p.stamp=buy?v*(D?STAT.stampD:STAT.stampI)/100:0;
    p.dp=0; if(D&&!buy){ const k=p.c+'|'+p.sym+'|'+p.d; if(!dpDone[k]){ dpDone[k]=1; p.dp=+R.dp||0; } }
    p.gst=(p.brk+p.exch+p.sebi+p.dp)*STAT.gst/100;
    p.chg=p.brk+p.stt+p.exch+p.sebi+p.stamp+p.dp+p.gst;
    p.net=buy?v+p.chg:v-p.chg; p.nr=p.net/p.q; });
  /* delivery: FIFO lots per client + symbol, realised P&L and holding cost (interest from T+1) */
  const lots={}, real=[], warn=[], today=todayS(), IR=STAT.int/100;
  parts.filter(p=>p.type==='D').forEach(p=>{ const k=p.c+'|'+p.sym; const L=lots[k]=lots[k]||[];
    if(p.side!=='S'){ L.push({c:p.c,sym:p.sym,d:p.d,q:p.q,cost:p.nr}); return; }
    let q=p.q; while(q>0&&L.length){ const l=L[0], m=Math.min(q,l.q), dd=Math.max(0,days(addD(l.d,1),p.d)), cst=m*l.cost;
      real.push({c:p.c,sym:p.sym,bd:l.d,sd:p.d,q:m,buy:l.cost,sell:p.nr,pl:m*(p.nr-l.cost),cost:cst,days:dd,hc:0});   // interest only while open
      l.q-=m; q-=m; if(l.q<=1e-9) L.shift(); }
    if(q>0) warn.push(p.c+' sold '+q+' '+p.sym+' on '+dmy(p.d)+' without a holding in this trade book'); });
  const hold=[]; Object.values(lots).forEach(L=>L.forEach(l=>{ if(l.q>1e-9){ const dd=Math.max(0,days(addD(l.d,1),today)); hold.push(Object.assign({},l,{days:dd,hc:l.q*l.cost*IR*dd/365})); } }));
  /* intraday P&L per client + symbol + day */
  const intra={}; parts.filter(p=>p.type==='I').forEach(p=>{ const k=p.c+'|'+p.sym+'|'+p.d; const x=intra[k]=intra[k]||{c:p.c,sym:p.sym,d:p.d,q:0,b:0,s:0,chg:0};
    if(p.side==='S'){ x.s+=p.net; x.q+=p.q; } else x.b+=p.net; x.chg+=p.chg; });
  return {parts,hold,real,intra:Object.values(intra).map(x=>Object.assign(x,{pl:x.s-x.b})),warn};
}
/* Loss recovery per client + script, in date order of booking (delivery lots after holding interest, and intraday):
   a loss adds to the balance to recover; a profit booked AFTER a loss first recovers that balance (only the excess is profit);
   a profit booked before any loss is ordinary profit and does not offset a later loss. */
function recovery(E){ const ev={};
  E.real.forEach(x=>{ (ev[x.c+'|'+x.sym]=ev[x.c+'|'+x.sym]||[]).push({d:x.sd,pl:x.pl,k:'Delivery'}); });
  E.intra.forEach(x=>{ (ev[x.c+'|'+x.sym]=ev[x.c+'|'+x.sym]||[]).push({d:x.d,pl:x.pl,k:'Intraday'}); });
  const out={};
  Object.keys(ev).forEach(k=>{ const [c,sym]=k.split('|'), L=ev[k].sort((a,b)=>a.d.localeCompare(b.d)); let bal=0, loss=0, rec=0, before=0, after=0, last=null, first=null;
    L.forEach(e=>{ if(e.pl<0){ bal+=-e.pl; loss+=-e.pl; last=e.d; if(!first) first=e.d; }
      else if(bal>0){ const r=Math.min(e.pl,bal); bal-=r; rec+=r; after+=e.pl-r; }
      else if(!first) before+=e.pl; else after+=e.pl; });
    out[k]={c,sym,loss,rec,bal,before,after,first,last,events:L}; });
  return out; }
/* net P&L of a delivery round trip for one client (buy and sell on different days), all charges included */
function roundTrip(c,buy,sell,q,STAT,rateOf){ const R=rateOf(c), vb=buy*q, vs=sell*q;
  const side=(v,isBuy)=>{ const brk=v*R.bd/100, stt=v*STAT.sttD/100, ex=v*STAT.exch/100, se=v*STAT.sebi/100, st=isBuy?v*STAT.stampD/100:0, dp=isBuy?0:(+R.dp||0);
    return brk+stt+ex+se+st+dp+(brk+ex+se+dp)*STAT.gst/100; };
  return (vs-side(vs,false))-(vb+side(vb,true)); }
/* quantity that recovers 'need' rupees between entry and target (fast track = in one move) */
function qtyFor(c,need,en,tg,STAT,rateOf){ if(!(tg>en)||!(need>0)) return null; let q=Math.max(1,Math.ceil(need/(tg-en)));
  for(let i=0;i<60&&roundTrip(c,en,tg,q,STAT,rateOf)<need;i++) q=Math.ceil(q*1.02)+1; return roundTrip(c,en,tg,q,STAT,rateOf)>=need?q:null; }
/* ---------- ledger (client-wise, entry by entry) ----------
   entry {d, dr, cr, n(narration), k(kind)}: kind from the narration - in (funds in), out (funds out), int (interest), dp (DP / demat),
   bill (trade bills / settlement), chg (other charges), oth. Balance = sum(dr - cr): positive = Dr (client owes). */
function kindOf(n,dr,cr){ n=String(n||'').toLowerCase();
  if(/interest|int\.?\s*(on|chg)|delay(ed)? pay|dpc\b|late pay/.test(n)) return 'int';
  if(/\bdp\b|demat|cdsl|nsdl|depository|dp\s*chg|dp charges|amc/.test(n)) return 'dp';
  if(/bill|settle|sett\.|stl|contract|trade|purchase|sale\b|sell|buy|nse|bse|cm\b/.test(n)) return 'bill';
  if(/receipt|received|recd|neft|rtgs|imps|upi|cheque|chq|deposit|pay.?in|fund.?in|transfer in|bank/.test(n)) return cr>0?'in':(dr>0?'out':'oth');
  if(/payment|paid|pay.?out|withdraw|fund.?out|transfer out|refund/.test(n)) return dr>0?'out':'in';
  if(/charges?|fee|gst|stamp|penalty/.test(n)) return 'chg';
  return 'oth'; }
function led(){ return LS.get('jc_pf_led2',null)||{files:[],E:{},bal:{}}; }
function addLedger(name,at,byClient,balOnly){ const L=led(), cs=Object.keys(byClient);
  cs.forEach(c=>{ if(balOnly){ L.bal[c]=byClient[c]; delete L.E[c]; } else { L.E[c]=byClient[c].sort((a,b)=>a.d.localeCompare(b.d)); delete L.bal[c]; } });
  L.files=L.files.map(f=>Object.assign({},f,{clients:f.clients.filter(c=>!cs.includes(c))})).filter(f=>f.clients.length).concat([{name,at,clients:cs,balOnly:!!balOnly}]);
  LS.set('jc_pf_led2',L); try{ localStorage.removeItem('jc_pf_ledger'); }catch(e){} return cs; }
function removeLedger(c){ const L=led(); if(c==null){ LS.set('jc_pf_led2',{files:[],E:{},bal:{}}); return; }
  delete L.E[c]; delete L.bal[c]; L.files=L.files.map(f=>Object.assign({},f,{clients:f.clients.filter(x=>x!==c)})).filter(f=>f.clients.length); LS.set('jc_pf_led2',L); }
function ledBal(c){ const L=led(); if(L.E[c]) return L.E[c].reduce((a,e)=>a+e.dr-e.cr,0); if(L.bal[c]!=null) return L.bal[c]; return null; }
/* trading days after a up to b (weekends skipped; exchange holidays are not known here) */
function tdays(a,b){ let n=0, d=Date.parse(a)+864e5; const e=Date.parse(b); while(d<=e){ const w=new Date(d).getUTCDay(); if(w>0&&w<6) n++; d+=864e5; } return n; }
/* debit ageing, FIFO: credits clear the oldest debits first; what is left are unpaid debits with their dates */
function ageing(c,today){ const L=led(), E=L.E[c]; if(!E) return null; const q=[]; let credit=0;
  E.forEach(e=>{ let cr=e.cr; while(cr>0&&q.length){ const m=Math.min(cr,q[0].amt); q[0].amt-=m; cr-=m; if(q[0].amt<=0.005) q.shift(); } credit+=cr; if(e.dr>0){ let dr=e.dr; const use=Math.min(dr,credit); credit-=use; dr-=use; if(dr>0.005) q.push({d:e.d,amt:dr,n:e.n}); } });
  const t=today||todayS(); q.forEach(x=>x.t=tdays(x.d,t));
  const debit=q.reduce((a,x)=>a+x.amt,0), over=q.filter(x=>x.t>=4), overAmt=over.reduce((a,x)=>a+x.amt,0);
  return {debit,unpaid:q,maxT:q.length?Math.max(...q.map(x=>x.t)):0,over4:overAmt,oldest:q.length?q[0].d:null}; }
/* sale value of a delivery sale after all charges */
function sellNet(c,price,q,STAT,rateOf){ const R=rateOf(c), v=price*q, brk=v*R.bd/100, stt=v*STAT.sttD/100, ex=v*STAT.exch/100, se=v*STAT.sebi/100, dp=(+R.dp||0);
  return v-(brk+stt+ex+se+dp+(brk+ex+se+dp)*STAT.gst/100); }
/* liquidation suggestion: Trading holdings with the largest profit first, then Investment holdings, until the sale value covers 'need' */
function liquidate(c,hold,Q,marks,need,STAT,rateOf){ const rows=[];
  hold.filter(h=>h.c===c&&Q[h.sym]).forEach(h=>{ const r=rows.find(x=>x.sym===h.sym); if(r){ r.q+=h.q; r.cost+=h.q*h.cost; r.hc+=h.hc; } else rows.push({sym:h.sym,q:h.q,cost:h.q*h.cost,hc:h.hc}); });
  rows.forEach(r=>{ r.p=Q[r.sym].p; r.mk=marks[r.sym]||''; r.pl=r.q*r.p-r.cost-r.hc; r.plp=r.pl/(r.cost+r.hc)*100; });
  const tier=r=>r.mk==='I'?1:0; rows.sort((a,b)=>tier(a)-tier(b)||b.plp-a.plp);
  let got=0; const pick=[];
  for(const r of rows){ if(got>=need) break; let q=r.q; const full=sellNet(c,r.p,r.q,STAT,rateOf);
    if(got+full>need){ q=Math.min(r.q,Math.ceil((need-got)/(r.p*0.99))); while(q<r.q&&got+sellNet(c,r.p,q,STAT,rateOf)<need) q++; }
    const net=sellNet(c,r.p,q,STAT,rateOf); got+=net; pick.push({sym:r.sym,mk:r.mk,q,of:r.q,p:r.p,net,pl:r.pl*q/r.q,plp:r.plp}); }
  return {pick,got,short:Math.max(0,need-got)}; }
/* XIRR of dated flows (money in negative, money out / value today positive) */
function xirr(fl){ if(fl.length<2||!fl.some(f=>f.v<0)||!fl.some(f=>f.v>0)) return null; const t0=Date.parse(fl[0].d);
  const f=r=>fl.reduce((a,x)=>a+x.v/Math.pow(1+r,(Date.parse(x.d)-t0)/864e5/365),0); let lo=-0.99, hi=10;
  if(f(lo)*f(hi)>0) return null; for(let i=0;i<200;i++){ const m=(lo+hi)/2; if(f(lo)*f(m)<=0) hi=m; else lo=m; } return (lo+hi)/2*100; }
window.PF={tb,addTrades,removeTrades,led,addLedger,removeLedger,ledBal,kindOf,tdays,ageing,sellNet,liquidate,xirr,ist,todayS,dmy,days,addD,LS,STAT0,stat,rates,rateOfFrom,loadTrades,compute,recovery,roundTrip,qtyFor,marks:()=>LS.get('jc_pf_mark',{})};
})();
