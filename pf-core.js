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
/* a client's own rate wins; where it has none, the rate worked out from that client's ledger bills (jc_pf_brkled) is used before the default */
const rateOfFrom=R=>c=>{ const L=(LS.get('jc_pf_brkled',{})||{})[c]||{}, o=Object.assign({},R._def), X=R[c]||{}; ['bd','bi'].forEach(k=>{ if(L[k]!=null&&!(X[k]>0)) o[k]=L[k]; }); return Object.assign(o,...Object.keys(X).filter(k=>X[k]!=null&&X[k]!=='').map(k=>({[k]:X[k]}))); };
/* uploaded trade books, client-wise: each upload replaces the trades of the client codes it contains (codes only, never names) */
function tb(){ let t=LS.get('jc_pf_tb',null);
  if(!t){ const o=LS.get('jc_pf_trades',null); t={files:[],trades:[]}; if(o&&o.trades&&o.trades.length){ t.trades=o.trades; t.files=[{name:o.name,at:o.at,clients:[...new Set(o.trades.map(x=>x.c))],n:o.trades.length}]; } LS.set('jc_pf_tb',t); try{ localStorage.removeItem('jc_pf_trades'); }catch(e){} }
  let ch=false; t.trades.forEach(x=>{ if(!x.id){ x.id=nid(); ch=true; } }); if(ch) LS.set('jc_pf_tb',t);
  return t; }
const nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
/* an upload replaces a client's trades only inside the dates the file covers (first to last trade date in it) - files of other
   periods (last year, earlier months) stay, so several files build one date-wise history. Trades entered by hand are kept. */
function addTrades(name,at,rows){ const t=tb(), cs=[...new Set(rows.map(x=>x.c))]; rows.forEach(x=>{ if(!x.id) x.id=nid(); });
  const rg={}; rows.forEach(x=>{ const g=rg[x.c]=rg[x.c]||[x.d,x.d]; if(x.d<g[0]) g[0]=x.d; if(x.d>g[1]) g[1]=x.d; });
  t.trades=t.trades.filter(x=>!(rg[x.c]&&!x.man&&x.d>=rg[x.c][0]&&x.d<=rg[x.c][1])).concat(rows).sort((a,b)=>a.c.localeCompare(b.c)||a.d.localeCompare(b.d));
  t.files=t.files.filter(f=>!(f.name===name&&f.clients.join()===cs.join())).concat([{name,at,clients:cs,n:rows.length,from:Object.values(rg).map(g=>g[0]).sort()[0],to:Object.values(rg).map(g=>g[1]).sort().slice(-1)[0]}]); LS.set('jc_pf_tb',t); return cs; }
function removeTrades(c){ const t=tb(); syncMark('trade',c==null?[...new Set(t.trades.map(x=>x.c))]:[c]); if(c==null){ t.trades=[]; t.files=[]; } else { t.trades=t.trades.filter(x=>x.c!==c); t.files=t.files.map(f=>Object.assign({},f,{clients:f.clients.filter(x=>x!==c)})).filter(f=>f.clients.length); } LS.set('jc_pf_tb',t); }
async function loadTrades(base){ driveLoad().catch(()=>0); /* Drive sync runs in the background - pages refresh on the 'pf-drive' event */ const up=tb();
  if(up.trades.length){ const cs=[...new Set(up.trades.map(x=>x.c))]; return {trades:up.trades,src:'uploaded trade books - '+cs.length+' client'+(cs.length>1?'s':'')+', '+up.trades.length+' fills',up:true}; }
  return {trades:[],src:'no trades yet - upload a trade book or add trades',up:false}; }
/* single trades: add, edit, delete (manual entries are listed as source 'entered') */
function clean(x){ const o={d:String(x.d).slice(0,10),c:String(x.c).trim().toUpperCase(),sym:String(x.sym).trim().toUpperCase().replace(/[-\s]EQ$|\.NS$/,''),side:x.side==='S'?'S':'B',q:Math.abs(+x.q),r:+x.r};
  if(!/^\d{4}-\d\d-\d\d$/.test(o.d)||!o.c||!o.sym||!(o.q>0)||!(o.r>0)) throw new Error('date, client code, symbol, quantity and rate are all needed'); return o; }
function saveTrade(x){ const t=tb(), o=clean(x);
  if(x.id){ const i=t.trades.findIndex(y=>y.id===x.id); if(i<0) throw new Error('trade not found'); o.id=x.id; t.trades[i]=o; }
  else { o.id=nid(); o.man=true; t.trades.push(o); }
  if(!t.files.some(f=>f.clients.includes(o.c))) t.files.push({name:'entered',at:dmy(todayS()),clients:[o.c],n:1});
  LS.set('jc_pf_tb',t); return o; }
function deleteTrade(id){ const t=tb(); t.trades=t.trades.filter(y=>y.id!==id); const cs=new Set(t.trades.map(y=>y.c)); t.files=t.files.map(f=>Object.assign({},f,{clients:f.clients.filter(c=>cs.has(c))})).filter(f=>f.clients.length); LS.set('jc_pf_tb',t); }
/* trade editor (pop-up) shared by Portfolio and Trade Audit; onDone() after save / delete */
function editor(x,onDone){ const old=document.getElementById('pfEd'); if(old) old.remove(); x=x||{};
  const tbx=tb(), codes=[...new Set(tbx.trades.map(y=>y.c))].sort(), syms=[...new Set(tbx.trades.map(y=>y.sym))].sort();
  const m=document.createElement('div'); m.id='pfEd';
  m.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(40,38,10,.55);display:flex;align-items:center;justify-content:center;padding:10px';
  const inp='border:1px solid #CFC9A3;border-radius:8px;padding:7px 9px;font:700 13px Inter,sans-serif;width:100%;box-sizing:border-box;background:#fff;color:#2E2C14';
  const lab='display:block;font:800 10.5px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#6E6A45;margin:8px 0 3px';
  const v=k=>x[k]==null?'':String(x[k]).replace(/"/g,'&quot;');
  m.innerHTML='<div style="background:#F7F4E6;border-radius:16px;width:100%;max-width:440px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35);font:600 13px Inter,sans-serif;color:#2E2C14">'+
    '<div style="background:linear-gradient(180deg,#5f5b00,#3f3c00);color:#F3EFD6;padding:11px 14px;font:900 15px Inter,sans-serif">'+(x.id?'✎ Edit trade':'＋ Add trade')+'</div><div style="padding:6px 16px 14px">'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 10px">'+
    '<div><label style="'+lab+'">Trade date</label><input id="edD" type="date" style="'+inp+'" value="'+v('d')+'"></div>'+
    '<div><label style="'+lab+'">Client code</label><input id="edC" list="edCl" style="'+inp+';text-transform:uppercase" value="'+v('c')+'" placeholder="code, not name"><datalist id="edCl">'+codes.map(c=>'<option value="'+c+'">').join('')+'</datalist></div>'+
    '<div><label style="'+lab+'">Symbol (NSE)</label><input id="edS" list="edSl" style="'+inp+';text-transform:uppercase" value="'+v('sym')+'"><datalist id="edSl">'+syms.map(c=>'<option value="'+c+'">').join('')+'</datalist></div>'+
    '<div><label style="'+lab+'">Buy / Sell</label><select id="edB" style="'+inp+'"><option value="B"'+(x.side!=='S'?' selected':'')+'>Buy</option><option value="S"'+(x.side==='S'?' selected':'')+'>Sell</option></select></div>'+
    '<div><label style="'+lab+'">Quantity</label><input id="edQ" type="number" min="1" step="1" style="'+inp+'" value="'+v('q')+'"></div>'+
    '<div><label style="'+lab+'">Rate (₹)</label><input id="edR" type="number" min="0" step="0.01" style="'+inp+'" value="'+v('r')+'"></div></div>'+
    '<div id="edErr" style="color:#B00000;font-weight:800;margin-top:8px"></div>'+
    '<div style="display:flex;gap:8px;margin-top:12px;align-items:center">'+(x.id?'<button id="edDel" style="border:1px solid #E29A93;background:#FBE3E1;color:#B00000;border-radius:8px;padding:7px 12px;font:800 12.5px Inter,sans-serif;cursor:pointer">🗑 Delete</button>':'')+
    '<span style="flex:1"></span><button id="edX" style="border:1px solid #CFC9A3;background:#fff;border-radius:8px;padding:7px 12px;font:800 12.5px Inter,sans-serif;cursor:pointer;color:#3f3c00">Cancel</button>'+
    '<button id="edOk" style="border:1px solid #676300;background:#676300;color:#fff;border-radius:8px;padding:7px 14px;font:800 12.5px Inter,sans-serif;cursor:pointer">Save</button></div></div></div>';
  document.body.appendChild(m);
  const g=id=>document.getElementById(id), close=()=>m.remove();
  if(!x.d) g('edD').value=todayS();
  m.onclick=e=>{ if(e.target===m) close(); }; g('edX').onclick=close;
  g('edOk').onclick=()=>{ try{ if(/[a-z]{2,}\s+[a-z]{2,}/i.test(g('edC').value)) throw new Error('enter the client code, not the name');
      saveTrade({id:x.id,d:g('edD').value,c:g('edC').value,sym:g('edS').value,side:g('edB').value,q:g('edQ').value,r:g('edR').value}); close(); onDone&&onDone(); }catch(e){ g('edErr').textContent=e.message; } };
  if(g('edDel')) g('edDel').onclick=()=>{ if(!confirm('Delete this trade?')) return; deleteTrade(x.id); close(); onDone&&onDone(); };
  setTimeout(()=>g(x.id?'edQ':'edC').focus(),50); }
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
function kindOf(n,dr,cr,v){ n=String(n||'').toLowerCase(); v=String(v||'').toUpperCase();
  if(/^R\//.test(v)) return cr>0?'in':'out'; if(/^P\//.test(v)) return dr>0?'out':'in';
  if(/interest|int\.?\s*(on|chg)|delay(ed)? pay|dpc\b|late pay/.test(n)) return 'int';
  if(/\bdp\b|demat|cdsl|nsdl|depository|dp\s*chg|dp charges|amc/.test(n)||/^G\//.test(v)) return 'dp';
  if(/^B\//.test(v)||/\b(to|by)\s+bill\b/.test(n)) return 'bill';
  if(/bill|settle|sett\.|stl|contract|trade|purchase|sale\b|sell|buy|nse|bse|cm\b/.test(n)) return 'bill';
  if(/receipt|received|recd|neft|rtgs|imps|upi|cheque|chq|deposit|pay.?in|fund.?in|transfer in|bank/.test(n)) return cr>0?'in':(dr>0?'out':'oth');
  if(/payment|paid|pay.?out|withdraw|fund.?out|transfer out|refund/.test(n)) return dr>0?'out':'in';
  if(/charges?|fee|gst|stamp|penalty/.test(n)) return 'chg';
  return 'oth'; }
function led(){ return LS.get('jc_pf_led2',null)||{files:[],E:{},bal:{}}; }
/* a ledger upload replaces a client's entries only inside its own period (statement From-To, else first to last entry date);
   statements of other years stay, so two years read as one date-wise ledger. A later year's opening balance is dropped when the
   earlier year is present (it is the same money, carried forward). */
function addLedger(name,at,byClient,balOnly,per){ const L=led(), cs=Object.keys(byClient);
  cs.forEach(c=>{ if(balOnly){ L.bal[c]=byClient[c]; delete L.E[c]; return; }
    const E=byClient[c].slice().sort((a,b)=>a.d.localeCompare(b.d)); if(!E.length) return;
    const f=(per&&per.from)||E[0].d, t=(per&&per.to)||E[E.length-1].d, keep=(L.E[c]||[]).filter(e=>e.d<f||e.d>t);
    let all=keep.concat(E).sort((a,b)=>a.d.localeCompare(b.d)||(/opening|b\/f|brought f/i.test(b.n||'')-/opening|b\/f|brought f/i.test(a.n||'')));
    all=all.filter((e,i)=>!(i>0&&/^\s*(opening balance|balance b\/f|brought forward)/i.test(e.n||'')));
    L.E[c]=all; delete L.bal[c]; });
  L.files=L.files.filter(f=>!(f.name===name&&f.clients.join()===cs.join())).concat([{name,at,clients:cs,balOnly:!!balOnly,from:per&&per.from,to:per&&per.to}]);
  LS.set('jc_pf_led2',L); try{ localStorage.removeItem('jc_pf_ledger'); }catch(e){} return cs; }
function removeLedger(c){ const L=led(); syncMark('ledger',c==null?Object.keys(Object.assign({},L.E,L.bal)):[c]); if(c==null){ LS.set('jc_pf_led2',{files:[],E:{},bal:{}}); return; }
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
/* ---------- uploads (CSV / Excel), read in the browser only ---------- */
function xlsxLib(){ return window.XLSX?Promise.resolve():new Promise((ok,no)=>{ const s=document.createElement('script'); s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'; s.onload=ok; s.onerror=()=>no(new Error('Excel reader could not load')); document.head.appendChild(s); }); }
function csvParse(t){ const out=[]; let row=[], f='', q=false; t=t.replace(/^\uFEFF/,'');
  for(let i=0;i<t.length;i++){ const ch=t[i];
    if(q){ if(ch==='"'){ if(t[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=ch; }
    else if(ch==='"') q=true; else if(ch===','||ch===';'||ch==='\t'){ row.push(f); f=''; } else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&t[i+1]==='\n') i++; row.push(f); out.push(row); row=[]; f=''; } else f+=ch; }
  if(f!==''||row.length){ row.push(f); out.push(row); } return out; }
async function readRows(file){ if(/\.(csv|txt)$/i.test(file.name)){ const raw=csvParse(await file.text());
    let hi=raw.findIndex(r=>r.filter(x=>String(x).trim()).length>=3&&r.some(x=>/date/i.test(x))); if(hi<0) hi=0;
    const hd=raw[hi].map(x=>String(x).trim()); return raw.slice(hi+1).filter(r=>r.some(x=>String(x).trim())).map(r=>{ const o={}; hd.forEach((h,i)=>o[h]=r[i]); return o; }); }
  await xlsxLib(); const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false}) /* serial day numbers - no time-zone shift */; const ws=wb.Sheets[wb.SheetNames[0]];
  const raw=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''});
  let hi=raw.findIndex(r=>r.filter(x=>String(x).trim()).length>=3&&r.some(x=>/date/i.test(x))); if(hi<0) hi=0;
  const hd=raw[hi].map(x=>String(x).trim()); return raw.slice(hi+1).filter(r=>r.some(x=>String(x).trim())).map(r=>{ const o={}; hd.forEach((h,i)=>o[h]=r[i]); return o; }); }
const col=(row,re)=>{ const k=Object.keys(row).find(k=>re.test(k)); return k; };
function pdate(v){ if(v instanceof Date){ const t=new Date(Math.round(v.getTime()/36e5)*36e5); /* Excel dates can come back as 23:59:xx of the previous day (or a few minutes off in IST) - snap to the hour first */ return new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,10); }
  if(typeof v==='number'&&v>20000&&v<80000) return new Date(Math.round((v-25569)*864e5)).toISOString().slice(0,10);
  const s=String(v).trim(); let m;
  if((m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
  if((m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/))) return (m[3].length===2?'20'+m[3]:m[3])+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  if((m=s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[A-Za-z]*[-\s,]+(\d{2,4})/))){ const mo='janfebmaraprmayjunjulaugsepoctnovdec'.indexOf(m[2].toLowerCase())/3+1; if(mo>0) return (m[3].length===2?'20'+m[3]:m[3])+'-'+String(mo).padStart(2,'0')+'-'+m[1].padStart(2,'0'); }
  return null; }
const num=v=>{ if(typeof v==='number') return v; const s=String(v).replace(/[,₹\s]/g,''); const n=parseFloat(s); return isFinite(n)?n:0; };
/* client code column: a code / UCC / account column; a name-only column is refused (codes only, never names) */
function codeCol(r0,rows){ const k=Object.keys(r0);
  let c=k.find(h=>/client\s*(code|id|cd|no)|ucc|party\s*code|acc(oun)?t\s*(code|no|id)|^code$|^client$/i.test(h)&&!/name/i.test(h));
  if(c){ const named=rows.slice(0,40).filter(r=>/[a-z]{2,}\s+[a-z]{2,}/i.test(String(r[c]).trim())).length; if(named>rows.slice(0,40).length/2) c=null; }
  return c; }
function askCode(file){ const c=prompt('Client code for '+file.name+' (no client-code column found):',''); if(!c||!c.trim()) throw new Error('no client code given'); if(/\s/.test(c.trim())&&/[a-z]{2,}\s+[a-z]{2,}/i.test(c)) throw new Error('enter the client code, not the name'); return c.trim().toUpperCase(); }
async function importTrades(file){ const rows=await readRows(file); if(!rows.length) throw new Error('no rows found');
  { const r0=rows[0], bq=col(r0,/^\s*buy\s*qty/i), ba=col(r0,/^\s*buy\s*(avg|rate|price)/i), sq=col(r0,/^\s*sell\s*qty/i), sa=col(r0,/^\s*sell\s*(avg|rate|price)/i);
    if(bq&&ba&&sq&&sa) return importNetPos(file,rows,{bq,ba,sq,sa}); }
  const r0=rows[0], cd=col(r0,/date/i), cc=codeCol(r0,rows), cs=col(r0,/^\s*symbol/i)||col(r0,/symbol|scrip(?!\s*code)|security|stock|instrument/i), cb=col(r0,/b\s*\/\s*s|buy.?sell|side|trans.*type|^type$/i), cq=col(r0,/qty|quantity/i), cr=col(r0,/rate|price|avg/i);
  const miss=[['Date',cd],['Symbol',cs],['Buy/Sell',cb],['Qty',cq],['Rate',cr]].filter(x=>!x[1]).map(x=>x[0]); if(miss.length) throw new Error('columns not found: '+miss.join(', '));
  const one=cc?null:askCode(file), cx=col(r0,/^\s*exch/i), csc=col(r0,/scrip\s*code/i), cse=col(r0,/^\s*ser/i), cpt=col(r0,/product/i), cvp=col(r0,/var\s*%/i), cva=col(r0,/var\s*am/i);
  const out=[]; rows.forEach(r=>{ const d=pdate(r[cd]), q=Math.abs(num(r[cq])), rt=num(r[cr]), side=/^s/i.test(String(r[cb]).trim())?'S':/^b/i.test(String(r[cb]).trim())?'B':null, c=one||String(r[cc]).trim().toUpperCase();
    if(d&&q>0&&rt>0&&side&&c){ const o={d,c,sym:String(r[cs]).trim().toUpperCase().replace(/[-\s]EQ$|\.NS$/,''),side,q,r:rt}; if(cx) o.ex=String(r[cx]||'').trim(); if(csc) o.scode=String(r[csc]||'').trim(); if(cse) o.ser=String(r[cse]||'').trim(); if(cpt) o.prod=String(r[cpt]||'').trim(); if(cvp&&num(r[cvp])>0) o.varp=num(r[cvp]); if(cva&&num(r[cva])>0) o.vara=num(r[cva]); out.push(o); } });
  if(!out.length) throw new Error('no valid fills (check dates, quantities, rates and Buy/Sell)');
  const cl=addTrades(file.name,dmy(todayS())+' '+ist().toISOString().slice(11,16),out);
  driveSave('trade',file.name,cl.map(c=>({client:c,csv:tradeCSV(out.filter(x=>x.c===c))})));
  return out.length+' fills for '+cl.join(', '); }
/* back-office / ODIN net-position export: one row per client, scrip and day with Buy Qty / Avg and Sell Qty / Avg.
   Kept: date, client code, exchange, scrip code, symbol, series, product type, buy and sell qty / avg, VAR % and VAR amount.
   Never read: client name (and any other personal column). */
async function importNetPos(file,rows,K){ const r0=rows[0], cd=col(r0,/date/i), cc=codeCol(r0,rows), cs=col(r0,/^\s*symbol|^\s*scrip\s*(name|symbol)|^\s*security/i)||col(r0,/symbol/i),
    cx=col(r0,/^\s*exch/i), csc=col(r0,/scrip\s*code|security\s*id|token/i), cse=col(r0,/ser|series/i), cpt=col(r0,/product/i), cvp=col(r0,/var\s*%|var\s*per|var\s*pct/i), cva=col(r0,/var\s*(amt|amount|value)/i);
  const miss=[['Date',cd],['Symbol',cs]].filter(x=>!x[1]).map(x=>x[0]); if(miss.length) throw new Error('columns not found: '+miss.join(', '));
  const one=cc?null:askCode(file), out=[];
  rows.forEach(r=>{ const d=pdate(r[cd]), c=one||String(r[cc]||'').trim().toUpperCase(), sym=String(r[cs]||'').trim().toUpperCase().replace(/[-\s]EQ$|\.NS$/,''); if(!d||!c||!sym) return;
    const prod=cpt?String(r[cpt]||'').trim():'', ex=cx?String(r[cx]||'').trim().toUpperCase():'', vp=cvp?num(r[cvp]):0, va=cva?num(r[cva]):0;
    const base={d,c,sym,ex,scode:csc?String(r[csc]||'').trim():'',ser:cse?String(r[cse]||'').trim():'',prod,varp:vp>0?vp:null,vara:va>0?va:null,src:'netpos'};
    const b=Math.abs(num(r[K.bq])), br=num(r[K.ba]), s=Math.abs(num(r[K.sq])), sr=num(r[K.sa]);
    if(b>0&&br>0) out.push(Object.assign({},base,{side:'B',q:b,r:br}));
    if(s>0&&sr>0) out.push(Object.assign({},base,{side:'S',q:s,r:sr})); });
  if(!out.length) throw new Error('no buy / sell quantities found');
  const cl=addTrades(file.name,dmy(todayS())+' '+ist().toISOString().slice(11,16),out);
  driveSave('trade',file.name,cl.map(c=>({client:c,csv:tradeCSV(out.filter(x=>x.c===c))})));
  const nv=out.filter(x=>x.varp).length;
  return out.length+' fills ('+rows.length+' day rows) for '+cl.join(', ')+(nv?' · VAR % on '+nv:'')+' · client name not read'; }
/* latest VAR % per symbol from the uploaded trade files - for margin needed on holdings and new trades */
function varMap(){ const m={}; tb().trades.forEach(t=>{ if(!t.varp) return; const o=m[t.sym]; if(!o||t.d>=o.d) m[t.sym]={p:t.varp,d:t.d}; }); return m; }
async function importLedger(file){
  if(/\.pdf$/i.test(file.name)){ const P=parseLedgerPdf(await pdfLines(await file.arrayBuffer()));
    addLedger(file.name,dmy(todayS())+' '+ist().toISOString().slice(11,16),{[P.client]:P.entries},false,{from:P.from,to:P.to});
    driveSave('ledger',file.name,[{client:P.client,csv:ledgerCSV(P.client,P.entries)}]);
    const last=P.entries[P.entries.length-1];
    return 'ledger of '+P.client+' · '+P.entries.length+' entries '+dmy(P.from)+' to '+dmy(P.to)+' · closing '+Math.abs(last.bal).toFixed(2)+(last.bal>0?' Dr':' Cr'); }

  const rows=await readRows(file); if(!rows.length) throw new Error('no rows found');
  const r0=rows[0], cd=col(r0,/date/i), cc=codeCol(r0,rows), cdr=col(r0,/^dr$|debit/i), ccr=col(r0,/^cr$|credit/i), cbal=col(r0,/bal/i), cn=col(r0,/narr|particular|descr|remark|detail/i), cvo=col(r0,/voucher|vch|vr\.?\s*no/i);
  if(!(cdr&&ccr)&&!cbal) throw new Error('need Debit + Credit columns or a Balance column');
  const one=cc?null:askCode(file), by={}, last={};
  if(cdr&&ccr){ if(!cd) throw new Error('Date column not found');
    rows.forEach(r=>{ const c=one||String(r[cc]).trim().toUpperCase(), d=pdate(r[cd]); if(!c||!d) return; const dr=Math.abs(num(r[cdr])), cr=Math.abs(num(r[ccr])), n=cn?String(r[cn]).trim():'';
      if(!dr&&!cr) return; const vo=cvo?String(r[cvo]).trim():''; (by[c]=by[c]||[]).push({d,v:vo,dr,cr,n,k:/opening|b\/f|brought f/i.test(n)?'oth':kindOf(n,dr,cr,vo)}); });
    if(!Object.keys(by).length) throw new Error('no dated debit / credit rows');
    const cl=addLedger(file.name,dmy(todayS())+' '+ist().toISOString().slice(11,16),by,false);
    driveSave('ledger',file.name,cl.map(c=>({client:c,csv:ledgerCSV(c,by[c])})));
    return 'ledger entries for '+cl.join(', '); }
  rows.forEach(r=>{ const c=one||String(r[cc]).trim().toUpperCase(); if(!c) return; const d=cd?pdate(r[cd])||'':''; const s2=String(r[cbal]); let v=num(s2); if(/cr/i.test(s2)) v=-Math.abs(v); else if(/dr/i.test(s2)) v=Math.abs(v); if(!last[c]||d>=last[c]){ last[c]=d; by[c]=v; } });
  const cl=addLedger(file.name,dmy(todayS())+' '+ist().toISOString().slice(11,16),by,true);
  driveSave('ledger',file.name,cl.map(c=>({client:c,csv:ledgerCSV(c,by[c])})));
  return 'balances for '+cl.join(', ')+' (no entries - debit ageing needs Date / Debit / Credit rows)'; }

/* ---------- PDF statements (SSJ back-office format) - read in the browser, nothing but the listed fields is kept ----------
   DP HOLDING:  kept = client code (BackOffice Code), DP account (id in [ ]), holding / rate dates, and per ISIN: ISIN, security,
                holding, rate, value, % and balance type (Pledge / Beneficiary).  Dropped = name, address, phone, joint holders, family,
                group, branch, scheme, client type, status, open date.
   LEDGER:      kept = client code ([CODE]), period, and per entry: date, voucher, particulars, debit, credit, balance.
                Dropped = name, address, compliance officer; the client's name is also removed from any narration that carries it.
   Debit / credit of each entry comes from the change in the running balance (cross-checked with the amount on the line), so
   column positions and wrapped narrations do not matter. The PDF itself is never stored or uploaded. */
function pdfLib(){ return window.pdfjsLib?Promise.resolve(window.pdfjsLib):new Promise((ok,no)=>{ const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload=()=>{ pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(window.pdfjsLib); };
  s.onerror=()=>no(new Error('PDF reader could not load')); document.head.appendChild(s); }); }
async function pdfLines(buf,lib){ lib=lib||await pdfLib(); const doc=await lib.getDocument({data:buf}).promise, out=[];
  for(let p=1;p<=doc.numPages;p++){ const pg=await doc.getPage(p), tc=await pg.getTextContent(), rows=[];
    tc.items.forEach(it=>{ const s=it.str; if(!s||!s.trim()) return; const x=it.transform[4], y=it.transform[5];
      let r=rows.find(r=>Math.abs(r.y-y)<2.5); if(!r){ r={p,y,items:[]}; rows.push(r); } r.items.push({x,s}); });
    rows.sort((a,b)=>b.y-a.y).forEach(r=>{ r.items.sort((a,b)=>a.x-b.x); r.text=r.items.map(i=>i.s).join(' ').replace(/\s+/g,' ').trim(); out.push(r); }); }
  return out; }
const ddmm=s=>{ const m=String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m?m[3]+'-'+m[2]+'-'+m[1]:null; };
const n2=s=>parseFloat(String(s).replace(/,/g,''));
function parseDPpdf(L){ const all=L.map(r=>r.text).join('\n'); const g=re=>{ const m=all.match(re); return m?m[1]:null; };
  const client=(g(/BackOffice\s*Code\s*:\s*([A-Z0-9]+)/i)||'').toUpperCase(), dpac=g(/\[\s*((?:IN[0-9A-Z]{6}\s*)?\d{8,16})\s*\]/);
  if(!client) throw new Error('BackOffice Code (client code) not found in this DP statement');
  const asOf=ddmm(g(/Holding\s+as\s+on\s+(\d{2}\/\d{2}\/\d{4})/i)||''), rateDate=ddmm(g(/Based\s+On\s*\[\s*(\d{2}\/\d{2}\/\d{4})/i)||''), rows=[];
  L.forEach(r=>{ const m=r.text.match(/^(IN[A-Z0-9]{10})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d.]+)\s+([A-Za-z ]+)$/);
    if(m) rows.push({isin:m[1],name:m[2].trim(),q:n2(m[3]),rate:n2(m[4]),value:n2(m[5]),pct:n2(m[6]),type:m[7].trim()}); });
  if(!rows.length) throw new Error('no ISIN rows found in this DP statement');
  const tot=all.match(/\bTotal\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/);
  if(tot){ const tq=rows.reduce((a,x)=>a+x.q,0), tv=rows.reduce((a,x)=>a+x.value,0); if(Math.abs(tq-n2(tot[1]))>0.01||Math.abs(tv-n2(tot[2]))>1) throw new Error('row totals do not match the statement total - not imported'); }
  return {client,dpac:dpac?dpac.replace(/\s+/g,''):'',asOf,rateDate,rows}; }
function parseLedgerPdf(L){ const all=L.map(r=>r.text).join('\n');
  const hm=all.match(/(?:^|\n)([^\n\[]{2,80}?)\s*\[\s*([A-Z0-9]{3,15})\s*\]/), client=hm?hm[2].toUpperCase():'', who=hm?hm[1].replace(/[\[\]]/g,'').trim():'';
  if(!client) throw new Error('client code [CODE] not found in this ledger');
  const per=all.match(/LEDGER\s*\[\s*(\d{2}\/\d{2}\/\d{4})\s*To\s*(\d{2}\/\d{2}\/\d{4})/i);
  const words=who.split(/\s+/).filter(w=>w.length>2);
  const scrub=t=>{ if(who) t=t.split(who).join(' '); words.forEach(w=>{ t=t.replace(new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','gi'),' '); }); return t.replace(/\[\s*[A-Z0-9]{3,15}\s*\]/g,' ').replace(/\s+/g,' ').trim(); };
  const hi=L.findIndex(r=>/^Date\b.*Particular.*Debit.*Credit.*Balance/i.test(r.text)); if(hi<0) throw new Error('ledger columns (Date / Particular / Debit / Credit / Balance) not found');
  const body=L.slice(hi+1).filter(r=>!/^\[.*\]$/.test(r.text)&&!/^(Sub Total|Grand Total|Page \d|Printed|\.$)/i.test(r.text)&&!/LEDGER\s*\[|COMPLIANCE OFFICER|Finance & Securities/i.test(r.text));
  const dated=[], loose=[];
  body.forEach(r=>{ const m=r.text.match(/^(\d{2}\/\d{2}\/\d{4})\s+(?:([A-Z]{1,3}\/\d+)\s+)?(.*?)\s*((?:[\d,]+\.\d{2}\s+){0,2})([\d,]+\.\d{2})\s*(Dr|Cr)$/i);
    if(m) dated.push({r,d:ddmm(m[1]),v:m[2]||'',t:m[3],nums:(m[4]||'').trim().split(/\s+/).filter(Boolean).map(n2),bal:n2(m[5])*(/cr/i.test(m[6])?-1:1)});
    else loose.push(r); });
  if(!dated.length) throw new Error('no dated ledger entries found');
  loose.forEach(r=>{ let best=null, bd=1e9; dated.forEach(d=>{ if(d.r.p!==r.p) return; const dd=Math.abs(d.r.y-r.y); if(dd<bd){ bd=dd; best=d; } }); if(best&&bd<30) (best.extra=best.extra||[]).push(r); });
  const out=[]; let prev=null, bad=0;
  dated.forEach(d=>{ const ex=d.extra||[], parts=[...ex.filter(x=>x.y>d.r.y).sort((a,b)=>b.y-a.y).map(x=>x.text),d.t,...ex.filter(x=>x.y<d.r.y).sort((a,b)=>b.y-a.y).map(x=>x.text)];
    const n=scrub(parts.filter(Boolean).join(' ')), ob=/opening balance/i.test(n);
    let dr=0, cr=0;
    if(ob||prev==null){ if(d.bal>0) dr=d.bal; else cr=-d.bal; }
    else { const dl=d.bal-prev; if(dl>=0) dr=dl; else cr=-dl; const amt=d.nums.length?d.nums[0]:null; if(amt!=null&&Math.abs(amt-Math.abs(dl))>0.05) bad++; }
    prev=d.bal;
    out.push({d:d.d,v:d.v,n:n||d.v,dr:+dr.toFixed(2),cr:+cr.toFixed(2),bal:d.bal,k:ob?'oth':kindOf(n,dr,cr,d.v)}); });
  if(bad) throw new Error(bad+' entr'+(bad>1?'ies do':'y does')+' not agree with the running balance - not imported');
  const gt=all.match(/Grand\s+Total\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*(Dr|Cr)/i);
  if(gt){ const last=out[out.length-1].bal, g2=n2(gt[3])*(/cr/i.test(gt[4])?-1:1); if(Math.abs(last-g2)>0.05) throw new Error('closing balance does not match the Grand Total - not imported'); }
  return {client,from:per?ddmm(per[1]):null,to:per?ddmm(per[2]):null,entries:out}; }

/* ---------- DP holdings (depository statement): client code + symbol / ISIN / security name + quantity ---------- */
let ISIN=null;
async function isinMap(){ if(ISIN) return ISIN; try{ ISIN=await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/main/data/isin.json?x='+Math.floor(Date.now()/864e5),{cache:'no-store'}).then(r=>r.json()); }catch(e){ ISIN={i:{},n:{},b:{}}; } ISIN.b=ISIN.b||{}; return ISIN; }
function dp(){ return LS.get('jc_pf_dp',null)||{files:[],H:{}}; }
function removeDP(c){ const D=dp(); syncMark('dp',c==null?Object.keys(D.H):[c]); if(c==null){ LS.set('jc_pf_dp',{files:[],H:{}}); return; } delete D.H[c]; D.files=D.files.map(f=>Object.assign({},f,{clients:f.clients.filter(x=>x!==c)})).filter(f=>f.clients.length); LS.set('jc_pf_dp',D); }
async function importDP(file){
  if(/\.pdf$/i.test(file.name)){ const P=parseDPpdf(await pdfLines(await file.arrayBuffer())), M=await isinMap(), miss=[];
    const H=P.rows.map(x=>{ const sym=M.i[x.isin]||'', bb=(M.b||{})[x.isin]; if(!sym) miss.push(x.isin+' '+x.name+(bb?' (BSE '+bb[1]+')':' (not on BSE)')); return {sym:sym||(bb&&bb[1])||x.isin,bse:bb?bb[0]:'',isin:x.isin,sec:x.name,q:x.q,rate:x.rate,value:x.value,type:x.type,nse:!!sym}; });
    const D=dp(); D.H[P.client]=H; D.M=D.M||{}; D.M[P.client]={dpac:P.dpac,asOf:P.asOf,rateDate:P.rateDate};
    D.files=D.files.map(f=>Object.assign({},f,{clients:f.clients.filter(c=>c!==P.client)})).filter(f=>f.clients.length).concat([{name:file.name,at:dmy(todayS())+' '+ist().toISOString().slice(11,16),clients:[P.client]}]);
    LS.set('jc_pf_dp',D);
    driveSave('dp',file.name,[{client:P.client,csv:dpCSV(P.client,D)}]);
    return 'DP holdings for '+P.client+(P.dpac?' (DP a/c '+P.dpac+')':'')+' · '+H.length+' ISINs as on '+dmy(P.asOf)+(miss.length?' · not on NSE: '+miss.length+' ('+miss.join(', ')+')':''); }

  const rows=await readRows(file); if(!rows.length) throw new Error('no rows found');
  const r0=rows[0], cc=codeCol(r0,rows), ci=col(r0,/isin/i), cs=col(r0,/^symbol$|nse\s*symbol|scrip\s*code|trading\s*symbol/i), cn=col(r0,/security|scrip|stock|company|instrument|name/i),
    cq=col(r0,/^(holding|qty|quantity|free|free qty|free balance|current balance|total balance|balance)$/i)||col(r0,/free|total.*(qty|bal|holding)|current.*bal|qty|quantity|^holding|balance/i),
    cdp=col(r0,/dp\s*a\/?c|dp\s*id|bo\s*id|demat\s*a|client\s*id\s*\(dp/i), crt=col(r0,/^rate$|price|close/i), cty=col(r0,/balance\s*type|^type$|pledge/i), cas=col(r0,/holding\s*as\s*on|as\s*on/i);
  if(!cq) throw new Error('quantity column not found'); if(!ci&&!cs&&!cn) throw new Error('need a Symbol, ISIN or Security name column');
  const M=await isinMap(), one=cc?null:askCode(file), by={}, meta={}, miss=new Set();
  rows.forEach(r=>{ const c=one||String(r[cc]).trim().toUpperCase(); if(!c) return; const q=Math.abs(num(r[cq])); if(!(q>0)) return;
    const isin=ci?String(r[ci]).trim().toUpperCase():''; let sym=cs?String(r[cs]).trim().toUpperCase().replace(/[-\s]EQ$|\.NS$/,''):'';
    if(!sym&&isin) sym=M.i[isin]||''; if(!sym&&cn){ const k=String(r[cn]).toLowerCase().replace(/\b(limited|ltd)\b/g,'').replace(/[^a-z0-9]/g,''); sym=M.n[k]||''; }
    const bb=isin?(M.b||{})[isin]:null; if(!sym&&bb) sym=bb[1]; if(!sym&&isin) sym=isin; /* BSE ticker when not on NSE; ISIN when on neither (kept, shown as suspended) */
    if(!sym){ miss.add(String(r[cn]||'').trim()); return; } if(!M.i[isin]&&isin&&!cs) miss.add(isin+(bb?' (BSE '+bb[1]+')':' (not on NSE / BSE)'));
    if(cdp||cas){ meta[c]=meta[c]||{}; if(cdp&&String(r[cdp]).trim()) meta[c].dpac=String(r[cdp]).trim(); if(cas){ const d=pdate(r[cas]); if(d) meta[c].asOf=d; } }
    const L=by[c]=by[c]||[]; const x=L.find(y=>y.sym===sym); if(x) x.q+=q; else L.push({sym,isin,bse:bb?bb[0]:'',q,rate:crt?num(r[crt])||null:null,type:cty?String(r[cty]).trim():'',nse:!!(M.i[isin]||(cs&&String(r[cs]).trim())),sec:cn?String(r[cn]).trim():''}); });
  if(!Object.keys(by).length) throw new Error('no holdings read'+(miss.size?' (unmatched: '+[...miss].slice(0,5).join(', ')+')':''));
  const D=dp(), cs2=Object.keys(by); D.M=D.M||{}; cs2.forEach(c=>{ D.H[c]=by[c]; D.M[c]=Object.assign({},D.M[c]||{},meta[c]||{}); });
  D.files=D.files.map(f=>Object.assign({},f,{clients:f.clients.filter(c=>!cs2.includes(c))})).filter(f=>f.clients.length).concat([{name:file.name,at:dmy(todayS())+' '+ist().toISOString().slice(11,16),clients:cs2}]);
  LS.set('jc_pf_dp',D);
  driveSave('dp',file.name,cs2.map(c=>({client:c,csv:dpCSV(c,D)})));
  return 'DP holdings for '+cs2.join(', ')+(miss.size?' · not on NSE: '+[...miss].join(', '):''); }

/* ---------- Google Drive: every upload is saved client-wise through the dashboard backend (admin passcode needed) ----------
   Drive: Joshi's Corner - Client Uploads / Trade files | Ledger | DP holdings / <client code> / <code> <type> <date time> (<file>).csv */
const BE='https://script.google.com/macros/s/AKfycbzMp82oHzLzKpaE0LrnUqEGGot7jqSw9e9VA1QhJNOPV35vOIYcfIChFL5PCDuD2Ahi5Q/exec';
const q2=v=>{ v=String(v==null?'':v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
const csvOf=(head,rows)=>head.join(',')+'\n'+rows.map(r=>r.map(q2).join(',')).join('\n');
function dpCSV(c,D){ const m=(D.M||{})[c]||{}; return csvOf(['Client Code','DP A/c','Holding as on','Rate date','Symbol','ISIN','Security','Holding','Rate','Value','Balance type'],D.H[c].map(x=>[c,m.dpac||'',m.asOf||'',m.rateDate||'',x.sym,x.isin||'',x.sec||'',x.q,x.rate==null?'':x.rate,x.value==null?'':x.value,x.type||''])); }
function tradeCSV(rows){ return csvOf(['Date','Client Code','Exchange','Scrip Code','Symbol','Series','Product Type','Buy/Sell','Qty','Rate','VAR %','VAR Amount'],rows.slice().sort((a,b)=>a.d.localeCompare(b.d)).map(x=>[x.d,x.c,x.ex||'',x.scode||'',x.sym,x.ser||'',x.prod||'',x.side==='S'?'SELL':'BUY',x.q,x.r,x.varp||'',x.vara||''])); }
function ledgerCSV(c,en){ return Array.isArray(en)?csvOf(['Date','Client Code','Voucher','Particulars','Debit','Credit','Balance (Dr +)','Type'],en.map(e=>[e.d,c,e.v||'',e.n||'',e.dr||0,e.cr||0,e.bal==null?'':e.bal,e.k])):csvOf(['Client Code','Balance (Dr +)'],[[c,en]]); }
function toast(t,bad,html){ let d=document.getElementById('pfToast'); if(!d){ d=document.createElement('div'); d.id='pfToast'; document.body.appendChild(d); }
  d.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9990;max-width:420px;padding:10px 14px;border-radius:12px;font:700 12.5px Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2);'+(bad?'background:#FBE3E1;color:#8a1010;border:1px solid #E29A93':'background:#E3F1DF;color:#1C5C0D;border:1px solid #8DC487');
  d[html?'innerHTML':'textContent']=t; clearTimeout(d._t); d._t=setTimeout(()=>d.remove(),bad?12000:7000); }
const akey=()=>{ try{ return localStorage.getItem('jc_admin_key')||''; }catch(e){ return ''; } };
async function driveSave(type,name,files,again,P){ if(!files.length) return null; if(LOADING) return null; P=P||PROG; const sz=files.reduce((a,f)=>a+f.csv.length,0);
  if(P) P.set('drive','run','uploading '+KB(sz)+' for '+esc2(files.map(f=>f.client).join(', '))+' - client codes only');
  let k=akey(); if(!k){ k=prompt('Admin passcode (the one that locks the client watchlists) - needed once on this device to save uploads to Google Drive:','')||''; if(!k){ if(P) P.set('drive','err','no admin passcode - kept in the app only. Use ☁ Save all to Drive later.'); driveLog(type,name,files,false,'no passcode - not saved to Drive'); toast('Not saved to Drive - no passcode. Use ☁ Save all to Drive later.',true); return null; } try{ localStorage.setItem('jc_admin_key',k); }catch(e){} }
  try{ const r=await fetch(BE,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'pf_save',key:k,type,name,files})});
    const j=JSON.parse(await r.text()); if(j.error) throw new Error(j.error);
    driveLog(type,name,files,true,'',j.root); { const SN=LS.get('jc_pf_seen',{}); (j.saved||[]).forEach(x=>{ if(x.id) SN[x.id]=1; }); LS.set('jc_pf_seen',SN); }
    if(P) P.set('drive','ok','saved to Drive · '+esc2(j.type)+' · '+j.saved.map(x=>'<a href="'+x.folder+'" target="_blank" rel="noopener">'+esc2(x.client)+'</a>').join(', '));
    toast('☁ Saved to Drive · '+esc2(j.type)+' · '+j.saved.map(x=>'<a href="'+x.folder+'" target="_blank" rel="noopener">'+esc2(x.client)+'</a>').join(', '),false,true); return j; }
  catch(e){ const m=String(e.message||e);
    if(/bad passcode/.test(m)&&!again){ try{ localStorage.removeItem('jc_admin_key'); }catch(x){} return driveSave(type,name,files,true,P); }
    if(P){ P.set('drive','err','not saved to Drive - '+esc2(m)+' <button data-rt>↻ Retry</button>'); const b=P.el.querySelector('[data-rt]'); if(b) b.onclick=()=>driveSave(type,name,files,true,P); }
    driveLog(type,name,files,false,m); toast('Not saved to Drive - '+m+'. Use ☁ Save all to Drive to retry.',true); return null; } }
/* ---------- Drive -> this device: newest upload of every client and type, so an upload on the phone app shows on the laptop too.
   A Drive file loads when it is newer than this device's own upload / removal of that client (jc_pf_sync). ---------- */
/* ---------- upload progress: every upload shows 3 steps - read the file · saved in the app · backed up to Google Drive ---------- */
const BUILD='2026-11-23f';
let PROG=null;
function progCss(){ if(document.getElementById('pfProgCss')) return; const s=document.createElement('style'); s.id='pfProgCss';
  s.textContent=`#pfProg{position:fixed;inset:0;background:rgba(30,28,10,.45);z-index:10000;display:flex;align-items:center;justify-content:center;font:14px Inter,system-ui,sans-serif}
  #pfProg .bx{background:#FFFDF4;border:2px solid #A7A15D;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.25);width:min(460px,92vw);padding:16px 18px}
  #pfProg h4{margin:0 0 2px;color:#3f3c00;font:800 16px Inter,sans-serif}#pfProg .fn{color:#6E6A45;font-size:12px;margin-bottom:10px;word-break:break-all}
  #pfProg .st{display:grid;grid-template-columns:26px 1fr;gap:6px;align-items:start;padding:7px 0;border-top:1px solid #EEEAD5}
  #pfProg .ic{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 12px Inter;background:#EEEAD5;color:#8a8466}
  #pfProg .run .ic{background:#676300;color:#fff;animation:pfp 1s infinite}#pfProg .ok .ic{background:#1C820D;color:#fff}#pfProg .err .ic{background:#D00000;color:#fff}#pfProg .skip .ic{opacity:.5}
  #pfProg .t b{display:block;color:#2E2C14}#pfProg .t small{color:#6E6A45;display:block;margin-top:1px}#pfProg .err .t small{color:#a01010}
  #pfProg .bar{height:6px;border-radius:4px;background:#EEEAD5;overflow:hidden;margin-top:5px}#pfProg .bar i{display:block;height:100%;width:30%;background:linear-gradient(90deg,#A7A15D,#676300);animation:pfb 1.1s infinite linear}
  #pfProg .ok .bar,#pfProg .err .bar,#pfProg .skip .bar,#pfProg .wait .bar{display:none}
  #pfProg .ft{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}#pfProg button{font:800 12px Inter;padding:7px 14px;border-radius:8px;border:1px solid #A7A15D;background:#FBF8EC;color:#3f3c00;cursor:pointer}#pfProg button.p{background:#3f3c00;color:#fff;border-color:#3f3c00}
  @keyframes pfp{50%{opacity:.55}}@keyframes pfb{0%{transform:translateX(-100%)}100%{transform:translateX(340%)}}`; document.head.appendChild(s); }
function progOpen(title,file,steps){ progCss(); const old=document.getElementById('pfProg'); if(old) old.remove();
  const d=document.createElement('div'); d.id='pfProg';
  d.innerHTML=`<div class="bx"><h4>${esc2(title)}</h4><div class="fn">${file?esc2(file.name)+' · '+(file.size/1024).toFixed(1)+' KB':''}</div>${steps.map((s,i)=>`<div class="st wait" data-k="${s[0]}"><span class="ic">${i+1}</span><span class="t"><b>${esc2(s[1])}</b><small>waiting…</small><span class="bar"><i></i></span></span></div>`).join('')}<div class="ft"><button class="p" data-x>Close</button></div></div>`;
  document.body.appendChild(d); let tm=null;
  const P={ set(k,state,msg){ const r=d.querySelector(`[data-k="${k}"]`); if(!r) return; r.className='st '+state; r.querySelector('.ic').textContent={ok:'✓',err:'!',skip:'–'}[state]||r.querySelector('.ic').textContent; r.querySelector('small').innerHTML=msg||'';
      const all=[...d.querySelectorAll('.st')]; if(all.every(x=>/ok|skip/.test(x.className))){ clearTimeout(tm); tm=setTimeout(P.close,4500); } },
    close(){ clearTimeout(tm); d.remove(); if(PROG===P) PROG=null; }, el:d };
  d.querySelector('[data-x]').onclick=P.close; PROG=P; return P; }
const KB=n=>(n/1024).toFixed(1)+' KB';
/* one entry point for every upload: kind 'trade' | 'ledger' | 'dp' */
async function upload(kind,file){ const L={trade:'Trade file',ledger:'Ledger',dp:'DP holdings'}[kind];
  const P=progOpen('Uploading '+L,file,[['read','Reading the file'],['app','Saving in the app'],['drive','Backing up to Google Drive']]);
  P.set('read','run',/\.pdf$/i.test(file.name)?'reading the PDF statement - only client code and holdings / entries are kept':'reading rows - personal columns are skipped');
  let msg; try{ msg=await (kind==='trade'?importTrades:kind==='ledger'?importLedger:importDP)(file); }
  catch(e){ P.set('read','err',esc2(e.message)); P.set('app','skip','nothing saved'); P.set('drive','skip','nothing sent'); throw e; }
  P.set('read','ok','file read'); P.set('app','ok',esc2(msg));
  return msg; }
/* ---------- corporate actions (NSE, data/corpact.json - refreshed by the corpact workflow) ----------
   Entitlement = shares held at the close before the ex-date (trades dated before the ex-date; T+1 rolling settlement).
   Bonus a:b -> x (a+b)/b shares, split FV from->to -> x from/to shares; earlier trades are restated (qty x k, rate / k) so FIFO,
   holdings and DP checks match the demat. Dividends are income per client (qty x Rs/share). */
let CA=null;
async function corpActs(){ if(CA) return CA; try{ CA=await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/main/data/corpact.json?x='+Math.floor(Date.now()/36e5),{cache:'no-store'}).then(r=>r.json()); }catch(e){ CA={a:[],err:String(e)}; } return CA; }
function caFactor(a){ return a.t==='bonus'&&a.r&&a.r[1]?(a.r[0]+a.r[1])/a.r[1]:a.t==='split'&&a.fv&&a.fv[1]?a.fv[0]/a.fv[1]:1; }
function caAdjust(trades,A){ const S=(A||(CA&&CA.a)||[]).filter(a=>(a.t==='bonus'||a.t==='split')&&caFactor(a)!==1); if(!S.length) return trades;
  const by={}; S.forEach(a=>(by[a.s]=by[a.s]||[]).push(a));
  return trades.map(t=>{ const L=by[t.sym]; if(!L) return t; let k=1; L.forEach(a=>{ if(t.d<a.ex) k*=caFactor(a); }); return k===1?t:Object.assign({},t,{q:t.q*k,r:t.r/k,adj:k,q0:t.q,r0:t.r}); }); }
/* client-wise entitlement rows for every action on a script the client traded or holds in DP */
function caRows(trades,dpH,A){ A=A||(CA&&CA.a)||[]; const out=[], today=todayS(), bySym={};
  A.forEach(a=>(bySym[a.s]=bySym[a.s]||[]).push(a));
  const pos={}; trades.forEach(t=>{ (pos[t.c+'|'+t.sym]=pos[t.c+'|'+t.sym]||[]).push(t); });
  const keys=new Set(Object.keys(pos)); Object.keys(dpH||{}).forEach(c=>(dpH[c]||[]).forEach(x=>keys.add(c+'|'+x.sym)));
  keys.forEach(k=>{ const [c,sym]=k.split('|'), L=bySym[sym]; if(!L) return; const T=(pos[k]||[]).slice().sort((a,b)=>a.d.localeCompare(b.d)), dq=((dpH||{})[c]||[]).filter(x=>x.sym===sym).reduce((a,x)=>a+x.q,0);
    L.forEach(a=>{ let q=0, basis='trade book'; T.forEach(t=>{ if(t.d<a.ex) q+=(t.side==='S'?-1:1)*t.q; });
      /* bonus / split before this action restate the quantity */
      L.filter(b=>b!==a&&(b.t==='bonus'||b.t==='split')&&b.ex<a.ex).forEach(b=>{ if(T.some(t=>t.d<b.ex)) q*=caFactor(b); });
      if(!T.length&&dq>0){ q=dq; basis=a.ex>today?'DP holding':'DP holding now (no trades - check)'; } else if(a.ex>today&&dq>0&&Math.abs(dq-q)>0.0001){ basis='trade book (DP now '+dq+')'; }
      q=Math.round(q*1e4)/1e4; if(q<=0) return;
      const f=caFactor(a); out.push({c,sym,a,q,basis,up:a.ex>today,div:a.t==='div'&&a.amt?q*a.amt:0,newSh:a.t==='bonus'?q*(f-1):0,newQ:(a.t==='bonus'||a.t==='split')?q*f:null}); }); });
  return out.sort((x,y)=>(y.up-x.up)||(x.up?x.a.ex.localeCompare(y.a.ex):y.a.ex.localeCompare(x.a.ex))||x.c.localeCompare(y.c)); }
/* ---------- ledger bills vs trade book: one bill per trade date (narration '... (dd/mm/yy)'); the gap is brokerage + GST,
   so the client's real brokerage rate comes out of the ledger, and any day that does not agree is flagged ---------- */
function ledgerRecon(c,trades,ST){ ST=ST||stat(); const L=(led().E||{})[c]; const T=trades.filter(t=>t.c===c); if(!L||!L.length||!T.length) return null;
  const E=compute(caAdjust(T),ST,()=>({bd:0,bi:0,dp:0})), g={};
  E.parts.forEach(p=>{ const x=g[p.d]=g[p.d]||{d:p.d,net:0,stat:0,tD:0,tI:0,n:0}; x.net+=(p.side==='S'?-1:1)*p.v; x.stat+=p.chg; x[p.type==='I'?'tI':'tD']+=p.v; x.n++; });
  const bills={}, other=[]; L.forEach(e=>{ if(e.k!=='bill') return; const m=String(e.n||'').match(/\((\d\d)\/(\d\d)\/(\d\d)\)/); if(!m){ other.push(e); return; } const d='20'+m[3]+'-'+m[2]+'-'+m[1]; bills[d]=(bills[d]||0)+e.dr-e.cr; });
  const gst=1+ST.gst/100, med=a=>{ a=a.filter(x=>isFinite(x)).sort((x,y)=>x-y); return a.length?a[Math.floor(a.length/2)]:null; };
  const days=Object.values(g).filter(x=>bills[x.d]!=null).map(x=>Object.assign(x,{bill:bills[x.d],brk:(bills[x.d]-x.net-x.stat)/gst}));
  let bd=med(days.filter(x=>!x.tI&&x.tD>0).map(x=>x.brk/x.tD*100)); bd=bd==null?null:Math.round(bd*100)/100;
  let bi=med(days.filter(x=>x.tI>0).map(x=>(x.brk-(bd||0)/100*x.tD)/x.tI*100)); bi=bi==null?null:Math.round(Math.max(0,bi)*1000)/1000;
  const rows=[...new Set([...Object.keys(g),...Object.keys(bills)])].sort().map(d=>{ const x=g[d]||{d,net:0,stat:0,tD:0,tI:0,n:0}, b=bills[d];
    const exp=x.net+x.stat+((bd||0)*x.tD+(bi||0)*x.tI)/100*gst, diff=b==null?null:b-exp, tol=Math.max(3,0.0006*(x.tD+x.tI));
    return {d,bill:b==null?null:b,net:x.net,stat:x.stat,brk:((bd||0)*x.tD+(bi||0)*x.tI)/100*gst,exp,diff,n:x.n,ok:b!=null&&x.n>0&&Math.abs(diff)<=tol,why:b==null?'trades but no bill in the ledger':!x.n?'bill but no trades in the trade book':Math.abs(diff)<=tol?'':'amount differs'}; });
  return {c,bd,bi,rows,nDel:days.filter(x=>!x.tI).length,nInt:days.filter(x=>x.tI).length,bad:rows.filter(r=>!r.ok).length}; }
function brkFromLedgers(trades){ const cs=Object.keys(led().E||{}), M=LS.get('jc_pf_brkled',{})||{}; let ch=false;
  cs.forEach(c=>{ const r=ledgerRecon(c,trades); if(!r||r.bd==null) return; const o={bd:r.bd,bi:r.bi!=null?r.bi:(M[c]||{}).bi,nDel:r.nDel,nInt:r.nInt}; if(JSON.stringify(M[c])!==JSON.stringify(o)){ M[c]=o; ch=true; } });
  if(ch) LS.set('jc_pf_brkled',M); return M; }
let LOADING=false, LOADED=null;
/* 'rm|type|client' = when this device removed that client's data: Drive files older than that are not loaded back */
function syncMark(type,cs,t){ const S=LS.get('jc_pf_sync',{}); cs.forEach(c=>S['rm|'+type+'|'+c]=t||Date.now()); LS.set('jc_pf_sync',S); }
function driveStat(o){ LS.set('jc_pf_dstat',Object.assign({t:Date.now()},o)); try{ window.dispatchEvent(new Event('pf-drive')); }catch(e){} }
function driveLoad(force){ if(LOADED&&!force) return LOADED; return LOADED=(async()=>{ const k=akey(); if(!k){ driveStat({ok:false,why:'passcode'}); return {n:0,why:'no passcode on this device'}; }
  const P=force?progOpen('Loading from Google Drive',null,[['list','Fetching the newest uploads of every client'],['app','Loading into the app']]):null; if(P) P.set('list','run','asking Drive…'); driveStat({busy:true});
  try{
  const ac=new AbortController(); setTimeout(()=>ac.abort(),force?60000:12000);
  const j=await fetch(BE,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'pf_load',key:k}),signal:ac.signal}).then(r=>r.json());
  if(j.error) throw new Error(j.error);
  if(P){ P.set('list','ok',(j.files||[]).length+' files in Drive'); P.set('app','run','loading…'); }
  const S=LS.get('jc_pf_sync',{}), SN=LS.get('jc_pf_seen',{}), done=[], bad=[]; LOADING=true;   /* S = when this device removed a client's data; SN = Drive files already merged here */
  try{ for(const f of (j.files||[]).sort((a,b)=>a.t-b.t)){ const key=f.type+'|'+f.client; if((S['rm|'+key]||0)>=f.t) continue; if(!force&&f.id&&SN[f.id]) continue; if(!force&&!f.id&&(S['up|'+key]||0)>=f.t) continue;
      const file=new File([f.csv],f.name.replace(/^.*\((.*)\)\.csv$/,'$1')+' (Drive).csv',{type:'text/csv'});
      try{ if(f.type==='trade') await importTrades(file); else if(f.type==='ledger') await importLedger(file); else if(f.type==='dp') await importDP(file); if(f.id) SN[f.id]=1; else S['up|'+key]=f.t; LS.set('jc_pf_seen',SN); LS.set('jc_pf_sync',Object.assign(LS.get('jc_pf_sync',{}),{['up|'+key]:Math.max(f.t,S['up|'+key]||0)})); done.push(f.type+' '+f.client+(f.name?' ('+f.name.replace(/^.*\((.*)\)\.csv$/,'$1')+')':'')); }catch(e){ console.warn('drive load',key,e); bad.push(f.type+' '+f.client+': '+e.message); } } }
  finally{ LOADING=false; }
  if(done.length&&!P) toast('☁ Loaded from Drive: '+esc2(done.join(', ')),false,true);
  if(P) P.set('app',bad.length?'err':'ok',(done.length?'loaded: '+esc2(done.join(', ')):'already up to date')+(bad.length?'<br>not loaded: '+esc2(bad.join(' · ')):''));
  driveStat({ok:!bad.length,n:(j.files||[]).length,loaded:done.length,bad}); return {n:done.length,done,bad};
  }catch(e){ if(P){ P.set('list','err',esc2(e.message)); P.set('app','skip',''); } driveStat({ok:false,why:e.name==='AbortError'?'timeout':e.message}); LOADED=null; throw e; } })(); }
const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function driveLog(type,name,files,ok,err,root){ const L=LS.get('jc_pf_drive',[]); L.unshift({t:Date.now(),type,name,clients:files.map(f=>f.client),ok,err:err||'',root:root||''}); LS.set('jc_pf_drive',L.slice(0,60)); }
/* push everything held in this browser (uploads + entered trades) to Drive, client-wise */
async function driveAll(){ const t=tb(), L=led(), D=dp(), cs=[...new Set(t.trades.map(x=>x.c))], out=[];
  if(cs.length) out.push(await driveSave('trade','trade book (all entries)',cs.map(c=>({client:c,csv:tradeCSV(t.trades.filter(x=>x.c===c))}))));
  const lc=[...new Set([...Object.keys(L.E),...Object.keys(L.bal)])]; if(lc.length) out.push(await driveSave('ledger','ledger (all entries)',lc.map(c=>({client:c,csv:ledgerCSV(c,L.E[c]||L.bal[c])}))));
  const dc=Object.keys(D.H); if(dc.length) out.push(await driveSave('dp','DP holdings (all)',dc.map(c=>({client:c,csv:dpCSV(c,D)}))));
  return out; }
/* blank CSV templates - only codes and statement fields; there is deliberately no column for names, addresses, PAN or phone */
const TPL={
  trade:['Date,Client Code,Exchange,Scrip Code,Symbol,Series,Product Type,Buy Qty,Buy Avg,Sell Qty,Sell Avg,VAR %,VAR Amount','20/11/2026,C0001,NSE,3045,SBIN,EQ,Delivery,100,1164.95,,,14.5,16891.78'],
  ledger:['Date,Client Code,Voucher,Particulars,Debit,Credit,Balance','01/04/2026,C0001,,Opening Balance,10000.00,0.00,10000.00 Dr','02/04/2026,C0001,R/101,Receipt by NEFT,0.00,10000.00,0.00 Dr'],
  dp:['Client Code,DP A/c,Holding as on,ISIN,Symbol,Security,Holding,Rate,Value,Balance type','C0001,1203410000000000,21/11/2026,INE062A01020,SBIN,SBI - EQ,125,1164.95,145618.75,Beneficiary']};
function template(t){ const b=new Blob([TPL[t].join('\n')+'\n'],{type:'text/csv'}), a=document.createElement('a'); a.href=URL.createObjectURL(b);
  a.download={trade:'Trade book template.csv',ledger:'Ledger template.csv',dp:'DP holdings template.csv'}[t]; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }
(function verCheck(){ setTimeout(async()=>{ try{ const v=await fetch('version.json?x='+Date.now(),{cache:'no-store'}).then(r=>r.json()); if(v.build&&v.build>BUILD&&!document.getElementById('pfNew')){ const d=document.createElement('div'); d.id='pfNew'; d.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;background:#3f3c00;color:#fff;padding:10px 16px;border-radius:10px;font:800 13px Inter,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);cursor:pointer'; d.textContent='⟳ New version of the app is ready - tap to reload'; d.onclick=()=>location.reload(); document.body.appendChild(d); } }catch(e){} },2500); })();
window.PF={ledgerRecon,brkFromLedgers,corpActs,caAdjust,caRows,caFactor,BUILD,upload,progOpen,driveLoad,syncMark,varMap,isinMap,template,pdfLines,parseDPpdf,parseLedgerPdf,importDP,dp,removeDP,driveSave,driveAll,toast,importTrades,importLedger,tb,addTrades,removeTrades,saveTrade,deleteTrade,editor,led,addLedger,removeLedger,ledBal,kindOf,tdays,ageing,sellNet,liquidate,xirr,ist,todayS,dmy,days,addD,LS,STAT0,stat,rates,rateOfFrom,loadTrades,compute,recovery,roundTrip,qtyFor,marks:()=>new Proxy(LS.get('jc_pf_mark',{}),{get:(o,k)=>typeof k==='string'?(o[k]||'T'):o[k]}) /* every script is Trading unless marked Investment */};
})();
