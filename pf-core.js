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
async function loadTrades(base){ const up=LS.get('jc_pf_trades',null);
  if(up&&up.trades&&up.trades.length) return {trades:up.trades,src:'uploaded trade book ('+up.name+', '+up.trades.length+' fills, read '+up.at+')',up:true};
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
      real.push({c:p.c,sym:p.sym,bd:l.d,sd:p.d,q:m,buy:l.cost,sell:p.nr,pl:m*(p.nr-l.cost),cost:cst,days:dd,hc:cst*IR*dd/365});
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
  E.real.forEach(x=>{ (ev[x.c+'|'+x.sym]=ev[x.c+'|'+x.sym]||[]).push({d:x.sd,pl:x.pl-x.hc,k:'Delivery'}); });
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
window.PF={ist,todayS,dmy,days,addD,LS,STAT0,stat,rates,rateOfFrom,loadTrades,compute,recovery,roundTrip,qtyFor,marks:()=>LS.get('jc_pf_mark',{})};
})();
