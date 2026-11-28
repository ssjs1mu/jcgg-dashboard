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
/* ---------- 💾 browser storage (2026-11-27): portfolio keys are stored COMPRESSED (about 9x smaller), and a write that does not fit
   is never silent - old caches are cleared and the write retried; if it still fails, a red bar shows and nothing is synced to Drive
   (a full browser once dropped keys while loading the Drive copy, and the sync then believed the wrong copy was newer) ---------- */
/* lz-string 1.5.0 (MIT, pieroxy) */
var LZString=function(){var r=String.fromCharCode,o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",e={};function t(r,o){if(!e[r]){e[r]={};for(var n=0;n<r.length;n++)e[r][r.charAt(n)]=n}return e[r][o]}var i={compressToBase64:function(r){if(null==r)return"";var n=i._compress(r,6,function(r){return o.charAt(r)});switch(n.length%4){default:case 0:return n;case 1:return n+"===";case 2:return n+"==";case 3:return n+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(n){return t(o,r.charAt(n))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(r){return null==r?"":""==r?null:i._decompress(r.length,16384,function(o){return r.charCodeAt(o)-32})},compressToUint8Array:function(r){for(var o=i.compress(r),n=new Uint8Array(2*o.length),e=0,t=o.length;e<t;e++){var s=o.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null==o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;e<t;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(r){return null==r?"":i._compress(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(o){return t(n,r.charAt(o))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(r,o,n){if(null==r)return"";var e,t,i,s={},u={},a="",p="",c="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<r.length;i+=1)if(a=r.charAt(i),Object.prototype.hasOwnProperty.call(s,a)||(s[a]=f++,u[a]=!0),p=c+a,Object.prototype.hasOwnProperty.call(s,p))c=p;else{if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++),s[p]=f++,c=String(a)}if(""!==c){if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==o-1){d.push(n(m));break}v++}return d.join("")},decompress:function(r){return null==r?"":""==r?null:i._decompress(r.length,32768,function(o){return r.charCodeAt(o)})},_decompress:function(o,n,e){var t,i,s,u,a,p,c,l=[],f=4,h=4,d=3,m="",v=[],g={val:e(0),position:n,index:1};for(t=0;t<3;t+=1)l[t]=t;for(s=0,a=Math.pow(2,2),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 2:return""}for(l[3]=c,i=c,v.push(c);;){if(g.index>o)return"";for(s=0,a=Math.pow(2,d),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(c=s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 2:return v.join("")}if(0==f&&(f=Math.pow(2,d),d++),l[c])m=l[c];else{if(c!==h)return null;m=i+i.charAt(0)}v.push(m),l[h++]=i+m.charAt(0),i=m,0==--f&&(f=Math.pow(2,d),d++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module?module.exports=LZString:"undefined"!=typeof angular&&null!=angular&&angular.module("LZString",[]).factory("LZString",function(){return LZString});
const ZP='\u0007Z1', ZC={};
function lsGetRaw(k){ const v=localStorage.getItem(k); if(v==null||v.slice(0,3)!==ZP) return v; const c=ZC[k]; if(c&&c.z===v) return c.d;
  const d=LZString.decompressFromUTF16(v.slice(3)); if(d==null) return null; ZC[k]={z:v,d}; return d; }
function freeSpace(lv){ let n=0; const today=todayS(), K=[]; try{ for(let i=0;i<localStorage.length;i++) K.push(localStorage.key(i)); }catch(e){ return 0; }
  K.forEach(k=>{ if(/^jc_pf_|^jc_admin|^jcgg[_-](?!news)/.test(k)) return;      /* never: portfolio, passcode, JCGG Suite books */
    const dm=k.match(/(\d{4}-\d{2}-\d{2})/), old=dm&&dm[1]<today&&/^jc/.test(k);
    if(/^jcfc:/.test(k)||old||(lv>0&&/^(jc_calls_v1|jc_sigbase_v1|jc_alog_v1|jc_sigfirst_v1|jc_radar_v1|jcgg-news)$/.test(k))){ try{ localStorage.removeItem(k); n++; }catch(e){} } });
  return n; }
let STORE_FULL=false;
function storeBar(on,k){ STORE_FULL=!!on; if(typeof document==='undefined') return; let b=document.getElementById('jcStoreFull');
  if(!on){ if(b) b.remove(); return; } if(!b){ b=document.createElement('div'); b.id='jcStoreFull'; b.style.cssText='position:fixed;left:0;right:0;top:0;z-index:2147483600;background:#B00000;color:#fff;font:800 13px Inter,Arial,sans-serif;padding:8px 12px;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.4)'; (document.body||document.documentElement).appendChild(b); }
  b.innerHTML='⚠ Browser storage is full - '+(k||'portfolio data')+' could not be saved on this device. Nothing is being saved to Drive until this is fixed (your Drive copy is safe). Close other Joshi\'s Corner tabs and reload this page; if it stays red, tell Claude.'; }
function lsSetRaw(k,v){ const s=(/^jc_pf_/.test(k)&&v.length>4000)?ZP+LZString.compressToUTF16(v):v;
  for(let a=0;a<3;a++){ try{ localStorage.setItem(k,s); if(s.slice(0,3)===ZP) ZC[k]={z:s,d:v}; else delete ZC[k]; return true; }catch(e){ if(!freeSpace(a)&&a>0) break; } }
  try{ localStorage.removeItem(k); }catch(e){} delete ZC[k]; storeBar(true,k); return false; }
const LS={get(k,d){ try{ const v=lsGetRaw(k); return v?JSON.parse(v):d; }catch(e){ return d; } }, set(k,v){ try{ return lsSetRaw(k,JSON.stringify(v)); }catch(e){ return false; } }};
/* existing uncompressed portfolio keys are compressed once, freeing space for everything else */
try{ const K=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(/^jc_pf_/.test(k)) K.push(k); }
  K.forEach(k=>{ const v=localStorage.getItem(k); if(v&&v.length>4000&&v.slice(0,3)!==ZP) lsSetRaw(k,v); }); }catch(e){}
/* statutory: STT delivery 0.1% buy+sell, intraday 0.025% sell; NSE transaction 0.00307%; SEBI Rs 10/crore;
   stamp duty delivery 0.015% buy, intraday 0.003% buy; GST 18% on brokerage + transaction + SEBI + DP (as of Nov 2026) */
const STAT0={sttD:0.1,sttI:0.025,exch:0.00307,sebi:0.0001,stampD:0.015,stampI:0.003,gst:18,int:18,hurdle:8,slab:30,cess:4};
/* exchange transaction charges by date (official circulars; NSE includes the IPFT Rs 10/crore from Apr-2023). Used while the Rates screen
   shows the official rate; a rate you type there is used for every date instead. */
const EXCH_HIST={NSE:[['2000-01-01',0.00325],['2021-01-01',0.00345],['2023-04-01',0.00335],['2024-04-01',0.00332],['2024-10-01',0.00307]],BSE:[['2000-01-01',0.00375]]};
const exchOn=(d,ex)=>{ const H=EXCH_HIST[ex]||EXCH_HIST.NSE; let r=H[0][1]; H.forEach(([f,v])=>{ if(d>=f) r=v; }); return r; };
const stat=()=>Object.assign({},STAT0,LS.get('jc_pf_stat',{}));
const rates=()=>LS.get('jc_pf_rates',{_def:{bd:0,bi:0,dp:0}});
const exOfP=p=>{ const e=String(p.ex||'').toUpperCase(); return /BSE|BOM/.test(e)?'BSE':/MCX|NCD|CDS/.test(e)?e:'NSE'; };   /* exchange of a fill (blank = NSE) */
/* a client's own rate wins; where it has none, the rate worked out from that client's ledger bills (jc_pf_brkled) is used before the default */
/* date-wise rates: RATES[c].hist = [{from:'YYYY-MM-DD', bd, bi, bmin, bdc, bic, bminFrom, dmin, imin, dp, amc, pledge, scheme}, ...];
   every entry dated on or before the trade date is laid over the client's base rates in date order (an entry may carry only
   brokerage or only DP fields). No date = today's rates. */
const rateAt=(X,d)=>{ X=X||{}; if(!X.hist||!X.hist.length) return X; d=d||todayS(); const o=Object.assign({},X); delete o.hist;
  X.hist.filter(e=>e&&e.from&&e.from<=d).sort((a,b)=>a.from.localeCompare(b.from)).forEach(e=>Object.keys(e).forEach(k=>{ if(k!=='from'&&e[k]!=null&&e[k]!=='') o[k]=e[k]; })); return o; };
const rateOfFrom=R=>(c,d)=>{ const L=(LS.get('jc_pf_brkled',{})||{})[c]||{}, o=Object.assign({},R._def), X=rateAt(R[c],d); ['bd','bi','bmin'].forEach(k=>{ if(L[k]!=null&&!(X[k]>0)) o[k]=L[k]; }); return Object.assign(o,...Object.keys(X).filter(k=>X[k]!=null&&X[k]!=='').map(k=>({[k]:X[k]}))); };
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
  const snap={}; rows.forEach(x=>{ if(x.man) snap[x.c]=1; });
  /* a file replaces that client's earlier fills in its own date range - but only on the exchange(s) it covers: an NSE report and a BSE report
     for the same period both stay (a combined NSE+BSE report, a file without exchange or a full re-load still replaces everything in range) */
  const exOf=x=>String(x.ex||'').toUpperCase(), ex={}; rows.forEach(x=>{ (ex[x.c]=ex[x.c]||new Set()).add(exOf(x)); });
  const sameEx=x=>{ const E=ex[x.c]; return !E||E.has('')||!exOf(x)||E.has(exOf(x)); };
  t.trades=t.trades.filter(x=>!(rg[x.c]&&(!x.man||snap[x.c])&&x.d>=rg[x.c][0]&&x.d<=rg[x.c][1]&&sameEx(x))).concat(rows).sort((a,b)=>a.c.localeCompare(b.c)||a.d.localeCompare(b.d));
  t.files=t.files.filter(f=>!(f.name===name&&f.clients.join()===cs.join())).concat([{name,at,clients:cs,n:rows.length,from:Object.values(rg).map(g=>g[0]).sort()[0],to:Object.values(rg).map(g=>g[1]).sort().slice(-1)[0]}]); LS.set('jc_pf_tb',t); return cs; }
function removeTrades(c){ const t=tb(); syncMark('trade',c==null?[...new Set(t.trades.map(x=>x.c))]:[c]); if(c==null){ t.trades=[]; t.files=[]; } else { t.trades=t.trades.filter(x=>x.c!==c); t.files=t.files.map(f=>Object.assign({},f,{clients:f.clients.filter(x=>x!==c)})).filter(f=>f.clients.length); } LS.set('jc_pf_tb',t); }
async function loadTrades(base){ stateSync().catch(()=>0); /* Drive sync runs in the background - pages refresh on the 'pf-drive' event */ const up=tb(); try{ await isinMap(); }catch(e){} try{ await corpActs(); }catch(e){}
  const op=dpOpenRows(up.trades).map(openTrade), nc=[...new Set(op.map(x=>x.c))].length, dpn=op.length?' + '+op.length+' DP holding'+(op.length>1?'s':'')+' not in the trade book ('+nc+' client'+(nc>1?'s':'')+', start position from the DP statement)':'';
  if(up.trades.length){ const cs=[...new Set(up.trades.map(x=>x.c))]; return {trades:up.trades,open:op,src:'uploaded trade books - '+cs.length+' client'+(cs.length>1?'s':'')+', '+up.trades.length+' fills'+dpn,up:true}; }
  if(op.length) return {trades:[],open:op,src:'no trades uploaded'+dpn,up:false};
  return {trades:[],open:[],src:'no trades yet - upload a trade book or add trades',up:false}; }
/* DP holdings not in the trade book (client with no trades, a scrip bought elsewhere / before the trade files, a suspended stock): the part
   of the DP quantity the trade book does not explain gets one start position per scrip so the Portfolio, daily prices and the report can
   track it. Start = the DP statement (its date and rate) unless the real cost / date is entered (jc_pf_dpcost), then that is used.
   Tag DPO: a buy with no brokerage or charges and no holding interest, no id (cannot be edited as a trade - the cost is entered in the
   DP panel). Kept out of the trade book, tally and reconciliations; they are added only to the holdings and totals. */
const dpCost=()=>LS.get('jc_pf_dpcost',{})||{};
function setDpCost(c,sym,o){ const D=dpCost(); D[c]=D[c]||{}; if(!o||(!(+o.r>0)&&!o.d)) delete D[c][sym]; else D[c][sym]={r:+o.r>0?+o.r:null,d:o.d||null}; if(!Object.keys(D[c]).length) delete D[c]; LS.set('jc_pf_dpcost',D); }
function dpOpenRows(trades){ const D=dp(), CO=dpCost(), out=[]; if(!Object.keys(D.H||{}).length) return out;
  let hold=[]; try{ hold=compute(caAdjust(trades||[]),stat(),rateOfFrom(rates())).hold; }catch(e){}
  const bk={}; hold.forEach(h=>{ const k=h.c+'|'+canonSym(h.sym); bk[k]=(bk[k]||0)+h.q; });
  Object.keys(D.H).sort().forEach(c=>{ const M=(D.M||{})[c]||{}, g={};
    (D.H[c]||[]).forEach(x=>{ const k=canonSym(dpKey(x)||x.isin||''); if(!k||!(+x.q>0)) return; const o=g[k]=g[k]||{sym:k,q:0,rate:0}; o.q+=+x.q; if(!o.rate&&+x.rate>0) o.rate=+x.rate; });
    Object.values(g).forEach(o=>{ const have=bk[c+'|'+o.sym]||0, gap=Math.round((o.q-have)*1e4)/1e4; if(!(gap>0.0001)) return;
      const e=(CO[c]||{})[o.sym]||{}, d=e.d||M.asOf||M.rateDate||todayS(), r=e.r||o.rate; if(!(r>0)) return;
      out.push({c,sym:o.sym,q:gap,dpQ:o.q,have,d,r,own:!!(e.r||e.d),dpRate:o.rate,dpDate:M.asOf||M.rateDate||''}); }); });
  return out; }
const openTrade=x=>({d:x.d,c:x.c,sym:x.sym,side:'B',q:x.q,r:x.r,tag:'DPO',src:'dp'});
const withOpening=trades=>(trades||[]).concat(dpOpenRows(trades).map(openTrade));
/* family / referral label per client (jc_pf_grp {CODE:{fam,ref}}) - saved with the portfolio to Drive like every jc_pf_ key */
const grp=()=>LS.get('jc_pf_grp',{})||{};
function setGrp(c,fam,ref){ const G=grp(); fam=String(fam||'').trim(); ref=String(ref||'').trim(); if(!fam&&!ref) delete G[c]; else G[c]={fam,ref}; LS.set('jc_pf_grp',G); }
const grpOk=(c,fam,ref)=>{ const g=grp()[c]||{}; return (!fam||g.fam===fam)&&(!ref||g.ref===ref); };
const grpLabels=k=>[...new Set(Object.values(grp()).map(g=>g[k]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
/* single trades: add, edit, delete (manual entries are listed as source 'entered') */
const isRE=sym=>/-RE\d*$/i.test(String(sym||'').trim());   /* rights entitlement (e.g. ADANI-RE): credited free, so a rate of 0 is valid */
const rateOk=(sym,r)=>+r>0||(isRE(sym)&&r!==''&&r!=null&&+r===0);
function clean(x){ const o={d:String(x.d).slice(0,10),c:String(x.c).trim().toUpperCase(),sym:String(x.sym).trim().toUpperCase().replace(/[-\s]EQ$|\.NS$/,''),side:x.side==='S'?'S':'B',q:Math.abs(+x.q),r:+x.r}; if(x.ex) o.ex=String(x.ex).toUpperCase(); if(x.prod) o.prod=String(x.prod).trim(); if(x.tag==='IPO'&&x.side!=='S') o.tag='IPO';
  if(!/^\d{4}-\d\d-\d\d$/.test(o.d)||!o.c||!o.sym||!(o.q>0)||!rateOk(o.sym,o.r)) throw new Error('date, client code, symbol, quantity and rate are all needed'); return o; }
function saveTrade(x){ const t=tb(), o=clean(x);
  if(x.id){ const i=t.trades.findIndex(y=>y.id===x.id); if(i<0) throw new Error('trade not found'); o.id=x.id; const nt=Object.assign({},t.trades[i],o,{edited:true}); if(!o.tag) delete nt.tag; t.trades[i]=nt; }
  else { o.id=nid(); o.man=true; t.trades.push(o); }
  if(!t.files.some(f=>f.clients.includes(o.c))) t.files.push({name:'entered',at:dmy(todayS()),clients:[o.c],n:1});
  LS.set('jc_pf_tb',t); return o; }
/* a client's whole trade list (uploads + hand entries) saved to Drive as one snapshot file - Source column marks hand entries */
let BKT={};
function backupClient(c,why){ if(!c) return; clearTimeout(BKT[c]); BKT[c]=setTimeout(()=>{ const rows=tb().trades.filter(t=>t.c===c); if(!rows.length) return;
  driveSave('trade',c+' trade book ('+why+')',[{client:c,csv:tradeCSV(rows)}]).catch(()=>0); },1500); }
function deleteTrade(id){ const t=tb(); t.trades=t.trades.filter(y=>y.id!==id); const cs=new Set(t.trades.map(y=>y.c)); t.files=t.files.map(f=>Object.assign({},f,{clients:f.clients.filter(c=>cs.has(c))})).filter(f=>f.clients.length); LS.set('jc_pf_tb',t); }
/* trade editor (pop-up) shared by Portfolio and Trade Audit; onDone() after save / delete */
function editor(x,onDone){ const old=document.getElementById('pfEd'); if(old) old.remove(); x=x||{};
  /* one pop-up for a whole day: Trade Date + Client Code + Exchange once, then as many rows (symbol, buy/sell, qty, rate) as needed.
     Edit mode (x.id) shows that one trade. Paste lines like "SBIN B 25 820.5" (tab, comma or space separated) to fill several rows at once. */
  const tbx=tb(), codes=[...new Set(tbx.trades.map(y=>y.c))].sort(), syms=[...new Set(tbx.trades.map(y=>y.sym))].sort(), one=!!x.id;
  const m=document.createElement('div'); m.id='pfEd';
  m.style.cssText='position:fixed;inset:0;z-index:9900;background:rgba(40,38,10,.55);display:flex;align-items:center;justify-content:center;padding:10px';
  const inp='border:1px solid #CFC9A3;border-radius:8px;padding:7px 9px;font:700 13px Inter,sans-serif;width:100%;box-sizing:border-box;background:#fff;color:#2E2C14';
  const lab='display:block;font:800 10.5px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#6E6A45;margin:8px 0 3px';
  const th='font:800 10.5px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#6E6A45;text-align:left;padding:2px 4px';
  const q=v=>v==null?'':String(v).replace(/"/g,'&quot;');
  const exV=String(x.ex||'').toUpperCase().indexOf('BSE')>=0?'BSE':'NSE';
  m.innerHTML='<div style="background:#F7F4E6;border-radius:16px;width:100%;max-width:'+(one?'560':'720')+'px;max-height:94vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35);font:600 13px Inter,sans-serif;color:#2E2C14">'+
    '<div style="background:linear-gradient(180deg,#5f5b00,#3f3c00);color:#F3EFD6;padding:11px 14px;font:900 15px Inter,sans-serif">'+(one?'✎ Edit Trade':'＋ Add Trades <span style="font:600 12px Inter,sans-serif;opacity:.8">- one client, many dates and stocks</span>')+'</div><div style="padding:6px 16px 14px;overflow:auto">'+
    '<div style="display:grid;grid-template-columns:1fr 90px 110px 130px;gap:0 10px">'+
    '<div><label style="'+lab+'">Client Code</label><input id="edC" list="edCl" style="'+inp+';text-transform:uppercase" value="'+q(x.c)+'" placeholder="code, not name"><datalist id="edCl">'+codes.map(c=>'<option value="'+c+'">').join('')+'</datalist></div>'+
    '<div><label style="'+lab+'">Exchange</label><select id="edE" style="'+inp+'"><option'+(exV==='NSE'?' selected':'')+'>NSE</option><option'+(exV==='BSE'?' selected':'')+'>BSE</option></select></div>'+
    '<div><label style="'+lab+'">Product</label><select id="edP" style="'+inp+'">'+['Delivery','Margin','Intraday'].map(v=>'<option'+((x.prod||'Delivery')===v?' selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
    '<div><label style="'+lab+'">Tag</label><select id="edG" style="'+inp+'"><option value="">Normal trade</option><option value="IPO"'+(x.tag==='IPO'?' selected':'')+'>🆕 IPO allotment</option></select></div></div>'+
    '<div id="edGh" style="display:none;margin-top:6px;padding:6px 9px;border-radius:8px;background:#E3F1DF;color:#1C5C0D;font:700 11.5px Inter,sans-serif">IPO allotment: Trade Date = allotment date, Rate = issue price, Buy only, no brokerage / charges. Listing day details are fetched and kept on record (Corporate Actions → IPO Allotments & Listing).</div>'+
    '<datalist id="edSl">'+syms.map(c=>'<option value="'+c+'">').join('')+'</datalist>'+
    '<table style="width:100%;border-collapse:collapse;margin-top:10px"><thead><tr><th style="'+th+'">#</th><th style="'+th+'">Date</th><th style="'+th+'">Symbol (NSE)</th><th style="'+th+'">Buy / Sell</th><th style="'+th+'">Quantity</th><th style="'+th+'">Rate (₹)</th><th style="'+th+';text-align:right">Value (₹)</th>'+(one?'':'<th></th>')+'</tr></thead><tbody id="edRows"></tbody></table>'+
    (one?'':'<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><button id="edAdd" style="border:1px dashed #676300;background:#fff;color:#3f3c00;border-radius:8px;padding:5px 10px;font:800 12px Inter,sans-serif;cursor:pointer">＋ Add Row</button><span style="font:600 11.5px Inter,sans-serif;color:#6E6A45">Enter on the last rate adds a row · paste several lines into a Symbol box (a date in a line sets the date of that row)</span></div>')+
    '<div id="edTot" style="margin-top:8px;font:800 12.5px Inter,sans-serif;color:#3f3c00"></div>'+
    '<div id="edSv" style="margin-top:3px;font:700 11.5px Inter,sans-serif;color:#1C5C0D"></div>'+
    '<div id="edErr" style="color:#B00000;font-weight:800;margin-top:6px"></div>'+
    '<div style="display:flex;gap:8px;margin-top:12px;align-items:center">'+(one?'<button id="edDel" style="border:1px solid #E29A93;background:#FBE3E1;color:#B00000;border-radius:8px;padding:7px 12px;font:800 12.5px Inter,sans-serif;cursor:pointer">🗑 Delete</button>':'')+
    '<span style="flex:1"></span><button id="edX" style="border:1px solid #CFC9A3;background:#fff;border-radius:8px;padding:7px 12px;font:800 12.5px Inter,sans-serif;cursor:pointer;color:#3f3c00">Cancel</button>'+
    '<button id="edOk" style="border:1px solid #676300;background:#676300;color:#fff;border-radius:8px;padding:7px 14px;font:800 12.5px Inter,sans-serif;cursor:pointer">Save</button></div></div></div>';
  document.body.appendChild(m);
  const g=id=>document.getElementById(id), close=()=>m.remove(), body=g('edRows');
  const fmt=n=>n.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const tot=()=>{ let b=0,s=0,n=0; body.querySelectorAll('tr').forEach(tr=>{ const qq=+tr.querySelector('.q').value||0, rr=+tr.querySelector('.r').value||0, v=qq*rr; tr.querySelector('.v').textContent=v?fmt(v):''; if(v){ n++; if(tr.querySelector('.b').value==='S') s+=v; else b+=v; } });
    g('edTot').textContent=n?n+' row'+(n>1?'s':'')+' · Buy ₹'+fmt(b)+' · Sell ₹'+fmt(s)+' · Net '+(b-s>=0?'pay ₹':'receive ₹')+fmt(Math.abs(b-s)):''; };
  const renum=()=>body.querySelectorAll('tr').forEach((tr,k)=>{ tr.querySelector('.n').textContent=k+1; });
  /* auto-save: a row that is complete (client, date, symbol, quantity, rate all valid) is saved the moment it is left, so closing the box by mistake loses nothing.
     The row remembers its trade id - later edits of the same row update that trade, never add a second one. Edit mode (one trade) keeps the explicit Save. */
  let CHG=false;
  const headV=()=>({c:g('edC').value,ex:g('edE').value,prod:g('edP').value,tag:g('edG').value});
  const rowV=tr=>({sym:tr.querySelector('.s').value,side:tr.querySelector('.b').value,q:tr.querySelector('.q').value,r:tr.querySelector('.r').value,d:tr.querySelector('.d').value});
  const svN=()=>body.querySelectorAll('tr[data-tid]').length;
  const svShow=()=>{ if(one) return; const n=svN(); g('edSv').textContent=n?'✓ '+n+' row'+(n>1?'s':'')+' saved automatically - closing this box keeps them':''; g('edX').textContent=n?'Close':'Cancel'; };
  const auto=tr=>{ if(one||!tr||!tr.isConnected) return; try{ const h=headV(), o=rowV(tr);
      if(/[a-z]{2,}\s+[a-z]{2,}/i.test(h.c)||!h.c.trim()||!o.sym.trim()||!(+o.q>0)||!rateOk(o.sym,o.r)||!o.d) return;
      if(h.tag==='IPO'&&o.side==='S') return;
      clean(Object.assign({},h,o)); const t=saveTrade(Object.assign({id:tr.dataset.tid||undefined},h,o)); tr.dataset.tid=t.id; CHG=true; svShow(); }catch(e){} };
  const autoAll=()=>body.querySelectorAll('tr').forEach(auto);
  const pDate=t=>{ let m; t=String(t).trim();
    if(m=t.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/)) return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');
    if(m=t.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/)) return (m[3].length===2?'20'+m[3]:m[3])+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
    if(m=t.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3})[A-Za-z]*[-\/ ](\d{2,4})$/)){ const i='jan feb mar apr may jun jul aug sep oct nov dec'.split(' ').indexOf(m[2].toLowerCase()); if(i>=0) return (m[3].length===2?'20'+m[3]:m[3])+'-'+String(i+1).padStart(2,'0')+'-'+m[1].padStart(2,'0'); }
    return ''; };
  const addRow=(o,focus)=>{ o=o||{}; const tr=document.createElement('tr');
    tr.innerHTML='<td class="n" style="padding:3px 4px;color:#6E6A45;font-weight:800"></td>'+
      '<td style="padding:3px 4px;width:132px"><input class="d" type="date" style="'+inp+'" value="'+q(o.d||todayS())+'"></td>'+
      '<td style="padding:3px 4px"><input class="s" list="edSl" style="'+inp+';text-transform:uppercase" value="'+q(o.sym)+'"></td>'+
      '<td style="padding:3px 4px;width:86px"><select class="b" style="'+inp+'"><option value="B"'+(o.side!=='S'?' selected':'')+'>Buy</option><option value="S"'+(o.side==='S'?' selected':'')+'>Sell</option></select></td>'+
      '<td style="padding:3px 4px;width:90px"><input class="q" type="number" min="1" step="1" style="'+inp+'" value="'+q(o.q)+'"></td>'+
      '<td style="padding:3px 4px;width:100px"><input class="r" type="number" min="0" step="0.01" style="'+inp+'" value="'+q(o.r)+'"></td>'+
      '<td class="v" style="padding:3px 4px;text-align:right;font-weight:800;white-space:nowrap;width:90px"></td>'+
      (one?'':'<td style="padding:3px 2px;width:26px"><button class="x" title="remove row" style="border:none;background:none;color:#B00000;font:900 15px Inter,sans-serif;cursor:pointer">✕</button></td>');
    body.appendChild(tr); renum();
    tr.querySelectorAll('input,select').forEach(e=>{ e.addEventListener('input',tot); e.addEventListener('change',()=>auto(tr)); });
    if(tr.querySelector('.x')) tr.querySelector('.x').onclick=()=>{ if(tr.dataset.tid){ try{ deleteTrade(tr.dataset.tid); CHG=true; }catch(e){} } tr.remove(); svShow(); if(!body.children.length) addRow(); renum(); tot(); };
    tr.querySelector('.r').addEventListener('keydown',e=>{ if(e.key==='Enter'&&!one&&tr===body.lastElementChild){ e.preventDefault(); auto(tr); addRow({side:tr.querySelector('.b').value,d:tr.querySelector('.d').value,sym:tr.querySelector('.s').value},true); } });
    tr.querySelector('.s').addEventListener('paste',e=>{ if(one) return; const t=(e.clipboardData||window.clipboardData).getData('text'); const L=t.split(/\r?\n/).map(l=>l.trim()).filter(Boolean); if(L.length<2&&!/[\t,]/.test(t)) return;
      e.preventDefault(); let first=true; L.forEach(l=>{ let f=l.split(/[\t,;]+|\s+/).filter(Boolean); const dt=f.map(pDate).find(Boolean)||''; if(dt) f=f.filter(z=>!pDate(z)); const sd=f.find(z=>/^(B|S|BUY|SELL)$/i.test(z)); const nums=f.filter(z=>/^[\d.]+$/.test(z)); const sym=f.find(z=>/[A-Za-z]/.test(z)&&!/^(B|S|BUY|SELL)$/i.test(z));
        const o2={sym:sym||'',side:sd&&/^S/i.test(sd)?'S':'B',q:nums[0]||'',r:nums[1]||'',d:dt||tr.querySelector('.d').value}; 
        if(first&&!tr.querySelector('.s').value){ tr.querySelector('.s').value=o2.sym; tr.querySelector('.b').value=o2.side; tr.querySelector('.q').value=o2.q; tr.querySelector('.r').value=o2.r; if(o2.d&&tr.querySelector('.d')) tr.querySelector('.d').value=o2.d; first=false; } else addRow(o2); }); tot(); autoAll(); });
    if(focus) setTimeout(()=>{ const e=tr.querySelector('.s'); e.focus(); e.select(); },20); tot(); return tr; };
  addRow(one||x.sym||x.q?x:{});   /* a pre-filled suggestion (e.g. a missing buy) lands in the first row */
  
  const ipoH=()=>{ const on=g('edG').value==='IPO'; g('edGh').style.display=on?'block':'none'; if(on){ g('edP').value='Delivery'; body.querySelectorAll('.b').forEach(b=>b.value='B'); } }; g('edG').onchange=ipoH; ipoH();
  const shut=()=>{ close(); if(CHG&&!one) onDone&&onDone(svN()); };
  m.onclick=e=>{ if(e.target===m) shut(); }; g('edX').onclick=shut; ['edC','edE','edP','edG'].forEach(i=>g(i).addEventListener('change',autoAll)); if(g('edAdd')) g('edAdd').onclick=()=>{ const l=body.lastElementChild; auto(l); addRow(l?{side:l.querySelector('.b').value,d:l.querySelector('.d').value,sym:l.querySelector('.s').value}:{},true); }; 
  g('edOk').onclick=()=>{ try{ if(/[a-z]{2,}\s+[a-z]{2,}/i.test(g('edC').value)) throw new Error('enter the client code, not the name');
      const head=headV(), rows=[];
      if(head.tag==='IPO'&&[...body.querySelectorAll('.b')].some(b=>b.value==='S')) throw new Error('an IPO allotment is a buy - set every row to Buy');
      body.querySelectorAll('tr').forEach((tr,k)=>{ const o={sym:tr.querySelector('.s').value,side:tr.querySelector('.b').value,q:tr.querySelector('.q').value,r:tr.querySelector('.r').value}; o.d=tr.querySelector('.d').value;
        if(!one&&!o.sym.trim()&&!o.q&&!o.r) return;   /* blank row - skipped */
        try{ clean(Object.assign({},head,o)); }catch(e){ throw new Error('Row '+(k+1)+': '+e.message); } rows.push({o,tr}); });
      if(!rows.length) throw new Error('add at least one row');
      rows.forEach(r=>{ const t=saveTrade(Object.assign({id:one?x.id:(r.tr.dataset.tid||undefined)},head,r.o)); r.tr.dataset.tid=t.id; }); close(); onDone&&onDone(rows.length); }catch(e){ g('edErr').textContent=e.message; } };
  if(g('edDel')) g('edDel').onclick=()=>{ if(!confirm('Delete this trade?')) return; deleteTrade(x.id); close(); onDone&&onDone(); };
  setTimeout(()=>(one?body.querySelector('.q'):g('edC')).focus(),50); }
/* ---------- broker's statutory charge sheet ("SSJ Finance and SSJ Commodities charges details"), date-wise; rates in % of turnover.
   Stamp duty is levied on the turnover as the sheet says (not only the buy side); GST on brokerage + transaction charges.
   Future sheets: add an entry with its own from-date (Portfolio -> Brokerage, charges & interest -> Statutory Charges). */
const SHEET0=[{from:'2000-01-01',src:'SSJ charges details',
  NSE:{exch:0.00325,sebi:0.00015,stampD:0.01,stampI:0.002,sttD:0.1,sttI:0.025,gst:18},
  BSE:{exch:0.00300,sebi:0.00015,stampD:0.01,stampI:0.002,sttD:0.1,sttI:0.025,gst:18}}];
const sheets=()=>{ const s=LS.get('jc_pf_sheet',null); return Array.isArray(s)&&s.length?s:SHEET0; };
const sheetOn=(d,ex)=>{ let o=null; sheets().filter(x=>x.from<=d).sort((a,b)=>a.from.localeCompare(b.from)).forEach(x=>{ if(x[ex]) o=x[ex]; }); return o||((sheets()[0]||{})[ex])||null; };
function compute(TR,STAT,rateOf){
  const fills=TR.map((t,i)=>Object.assign({i},t)).sort((a,b)=>a.d.localeCompare(b.d)||a.i-b.i);
  /* split each fill into intraday / delivery parts: per client + symbol + day, the offsetting quantity is intraday */
  const grp={}; fills.forEach(f=>{ const k=f.c+'|'+f.sym+'|'+f.d; (grp[k]=grp[k]||{B:[],S:[]})[f.side==='S'?'S':'B'].push(f); });
  const parts=[];
  Object.values(grp).forEach(g=>{ const bq=g.B.reduce((a,f)=>a+f.q,0), sq=g.S.reduce((a,f)=>a+f.q,0); let iq={B:Math.min(bq,sq),S:Math.min(bq,sq)};
    ['B','S'].forEach(s=>g[s].forEach(f=>{ const qi=Math.min(f.q,iq[s]); iq[s]-=qi; if(qi>0) parts.push(Object.assign({},f,{q:qi,type:'I'})); if(f.q-qi>0) parts.push(Object.assign({},f,{q:f.q-qi,type:'D'})); })); });
  parts.sort((a,b)=>a.d.localeCompare(b.d)||((a.side==='S')-(b.side==='S'))||a.i-b.i);   /* same day: buys before sells, and each side in the order the trades were entered (FIFO lots) - the old comparator returned -1 for every pair of buys, so the lot order among same-day buys was arbitrary */
  const dpDone={};
  parts.forEach(p=>{ const R=rateOf(p.c,p.d); p.v=p.q*p.r; p.brk=p.v*(p.type==='D'?R.bd:R.bi)/100; });
  /* minimum brokerage per contract note = client + day + EXCHANGE (NSE and BSE each carry their own minimum, e.g. Rs 50):
     when that exchange's % brokerage for the day is below the minimum, the broker charges the minimum, spread over those trades */
  { const og={}; parts.forEach(p=>{ if(p.tag==='IPO'||p.tag==='DPO') return; const k=p.c+'|'+p.d+'|'+exOfP(p); (og[k]=og[k]||[]).push(p); });
    /* the minimum is tested on brokerage at the card rate (Rate For Minimum, else the charged rate); the shortfall to the minimum is added */
    Object.values(og).forEach(P=>{ const R=rateOf(P[0].c,P[0].d), m=+R.bmin||0, v=P.reduce((a,p)=>a+p.v,0);
      const card=P.reduce((a,p)=>a+p.v*(p.type==='D'?(+R.bdc>0?+R.bdc:+R.bd||0):(+R.bic>0?+R.bic:+R.bi||0))/100,0);
      if(m>card&&v>0&&!(R.bminFrom&&P[0].d<R.bminFrom)) P.forEach(p=>{ p.brk+=(m-card)*p.v/v; p.minB=true; }); }); }   /* bminFrom: date the minimum started */
  parts.forEach(p=>{ const R=rateOf(p.c,p.d), v=p.v, buy=p.side!=='S', D=p.type==='D';
    p.dp=0; if(D&&!buy){ const k=p.c+'|'+p.sym+'|'+p.d; if(!dpDone[k]){ dpDone[k]=1; p.dp=+R.dp||0; } }
    /* official (law) charges - always worked out, for the comparison */
    const oStt=D?v*STAT.sttD/100:(buy?0:v*STAT.sttI/100), oEx=v*(Math.abs(STAT.exch-STAT0.exch)<1e-9?exchOn(p.d,exOfP(p)):STAT.exch)/100, oSe=v*STAT.sebi/100, oSd=buy?v*(D?STAT.stampD:STAT.stampI)/100:0;
    p.off={stt:oStt,exch:oEx,sebi:oSe,stamp:oSd,gst:(p.brk+oEx+oSe+p.dp)*STAT.gst/100}; p.chgOff=p.brk+oStt+oEx+oSe+oSd+p.dp+p.off.gst;
    /* the broker's charge sheet (default basis): its rates per exchange, stamp on the turnover, GST on brokerage + transaction charges (+ DP) */
    const SH=STAT.basis==='official'?null:sheetOn(p.d,exOfP(p));
    if(SH){ p.stt=D?v*SH.sttD/100:(buy?0:v*SH.sttI/100); p.exch=v*SH.exch/100; p.sebi=v*SH.sebi/100; p.stamp=(SH.stampBuyOnly&&!buy)?0:v*(D?SH.stampD:SH.stampI)/100;
      p.gst=(p.brk+p.exch+p.dp+(SH.gstSebi?p.sebi:0))*(SH.gst!=null?SH.gst:STAT.gst)/100; }
    else { p.stt=oStt; p.exch=oEx; p.sebi=oSe; p.stamp=oSd; p.gst=p.off.gst; }
    if((p.tag==='IPO'||p.tag==='DPO')&&buy){ p.brk=p.stt=p.exch=p.sebi=p.stamp=p.dp=p.gst=0; p.off={stt:0,exch:0,sebi:0,stamp:0,gst:0}; p.chgOff=0; }   /* IPO allotment: no exchange trade, no charges */
    p.chg=p.brk+p.stt+p.exch+p.sebi+p.stamp+p.dp+p.gst;
    p.net=buy?v+p.chg:v-p.chg; p.nr=p.net/p.q; });
  /* delivery: FIFO lots per client + symbol, realised P&L and holding cost (interest from T+1) */
  const lots={}, real=[], warn=[], short=[], today=todayS(), IR=STAT.int/100;
  parts.filter(p=>p.type==='D').forEach(p=>{ const k=p.c+'|'+p.sym; const L=lots[k]=lots[k]||[];
    if(p.side!=='S'){ L.push({c:p.c,sym:p.sym,d:p.d,q:p.q,cost:p.nr,tag:p.tag}); return; }
    let q=p.q; while(q>0&&L.length){ const l=L[0], m=Math.min(q,l.q), dd=Math.max(0,days(addD(l.d,1),p.d)), cst=m*l.cost;
      real.push({c:p.c,sym:p.sym,bd:l.d,sd:p.d,q:m,buy:l.cost,sell:p.nr,pl:m*(p.nr-l.cost),cost:cst,days:dd,hc:0});   // interest only while open
      l.q-=m; q-=m; if(l.q<=1e-9) L.shift(); }
    if(q>0){ warn.push(p.c+' sold '+q+' '+p.sym+' on '+dmy(p.d)+' without a holding in this trade book'); short.push({c:p.c,sym:p.sym,d:p.d,q,r:p.r,adj:p.adj||1}); } });
  const hold=[]; Object.values(lots).forEach(L=>L.forEach(l=>{ if(l.q>1e-9){ const dd=Math.max(0,days(addD(l.d,1),today)); hold.push(Object.assign({},l,{days:dd,hc:l.tag==='DPO'?0:l.q*l.cost*IR*dd/365})); } }));   /* DP-only start position: nobody funded it - no holding interest */
  /* intraday P&L per client + symbol + day */
  const intra={}; parts.filter(p=>p.type==='I').forEach(p=>{ const k=p.c+'|'+p.sym+'|'+p.d; const x=intra[k]=intra[k]||{c:p.c,sym:p.sym,d:p.d,q:0,b:0,s:0,chg:0};
    if(p.side==='S'){ x.s+=p.net; x.q+=p.q; } else x.b+=p.net; x.chg+=p.chg; });
  return {parts,hold,real,intra:Object.values(intra).map(x=>Object.assign(x,{pl:x.s-x.b})),warn,short};
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
  if(/outstanding dues|risk adjusted|trf to ap\b|transfer to ap\b/.test(n)) return 'oth';
  if(/deposit amount trf|amount trf (to|from) (trading|dp)|trf (to|from) dp ledger/.test(n)) return 'dp';   /* money moved between the DP deposit and the trading ledger */   /* dues moved to / back from the AP account - a pair that nets out */
  if(/^R(\/|\d{5})/.test(v)) return cr>0?'in':'out'; if(/^P(\/|\d{5})/.test(v)) return dr>0?'out':'in';
  if(/interest|int\.?\s*(on|chg)|delay(ed)? pay|dpc\b|late pay/.test(n)) return 'int';
  if(/\bdp\b|demat|cdsl|nsdl|depository|dp\s*chg|dp charges|amc/.test(n)||/^G(\/|\d{5})/.test(v)) return 'dp';
  if(/^B(\/|\d{5})/.test(v)||/\b(to|by)\s+bill\b/.test(n)) return 'bill';
  /* money received / paid wording wins over exchange words: 'being credit received in hdfc nse 6253 vide ref no ...' is funds in */
  if(/credit received|amount received|received in|recd in|received from|vide ref|ref no|utr\b|neft|rtgs|imps|upi|cheque|chq/.test(n)&&!/\bbill\b/.test(n)) return cr>0?'in':(dr>0?'out':'oth');
  if(/bill|settle|sett\.|stl|contract|trade|purchase|sale\b|sell|buy|nse|bse|cm\b/.test(n)) return 'bill';
  if(/receipt|received|recd|neft|rtgs|imps|upi|cheque|chq|deposit|pay.?in|fund.?in|transfer in|bank/.test(n)) return cr>0?'in':(dr>0?'out':'oth');
  if(/payment|paid|pay.?out|withdraw|fund.?out|transfer out|refund/.test(n)) return dr>0?'out':'in';
  if(/charges?|fee|gst|stamp|penalty/.test(n)) return 'chg';
  return 'oth'; }
const LEDK=2;   /* bump when kindOf changes: saved PDF-ledger entries are sorted again */
function led(){ const L=LS.get('jc_pf_led2',null)||{files:[],E:{},bal:{}}; if(L.kv!==LEDK&&L.E){ let ch=false;
    Object.values(L.E).forEach(A=>(A||[]).forEach(e=>{ if(e.vt||e.k!=='bill'||/^B(\/|\d{5})/i.test(String(e.v||''))) return; const k=kindOf(e.n,e.dr,e.cr,e.v); if(k==='in'||k==='out'){ e.k=k; ch=true; } }));   /* only bills that are really money received / paid (PDF ledgers, non-bill vouchers) */ L.kv=LEDK; try{ LS.set('jc_pf_led2',L); }catch(x){} }
  return L; }
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
/* the periods a client's uploaded ledger files cover (from the file names / statement dates; else first-last entry) */
function ledCover(c){ const L=led(), F=(L.files||[]).filter(f=>(f.clients||[]).includes(c)&&f.from&&f.to).map(f=>[f.from,f.to]); const E=L.E[c]||[];
  if(!F.length&&E.length) F.push([E[0].d,E[E.length-1].d]); F.sort((a,b)=>a[0].localeCompare(b[0])); const M=[]; F.forEach(r=>{ const l=M[M.length-1]; if(l&&r[0]<=dayAfter(l[1])) { if(r[1]>l[1]) l[1]=r[1]; } else M.push(r.slice()); }); return M; }
const inCover=(M,d)=>M.some(r=>d>=r[0]&&d<=r[1]);
/* the ledger is current only if it reaches the client's last trade - else its balance, receipts and payouts are an old period */
function ledFresh(c,trades){ const M=ledCover(c); if(!M.length) return false; const last=(trades||[]).filter(t=>t.c===c).map(t=>t.d).sort().pop(); return !last||M[M.length-1][1]>=last; }
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
/* ---------- Taxation & Returns (listed equity, STT paid; resident individual).
   Intraday = speculative business income at the slab % (STAT.slab). Delivery held <= 12 months = STCG, > 12 months = LTCG.
   Rates by sale date: before 23-07-2024 STCG 15 %, LTCG 10 %; from 23-07-2024 STCG 20 %, LTCG 12.5 % (Budget 2026 unchanged).
   LTCG exemption per FY: Rs 1,00,000 up to FY 2023-24, Rs 1,25,000 from FY 2024-25. Sales before 01-04-2018: LTCG exempt.
   Set-off inside a FY: short-term loss against STCG then LTCG; long-term loss only against LTCG; speculative loss only against
   speculative profit; what is left is shown as loss to carry forward (not carried into later years here). Health & education cess
   STAT.cess % on the tax; surcharge, grandfathering (31-01-2018 FMV) and bonus-share cost rules are not applied. P&L is after
   all charges in the trade book. */
const TAXCUT='2024-07-23';
const fyOf=d=>{ const y=+d.slice(0,4), m=+d.slice(5,7), s=m>=4?y:y-1; return 'FY '+s+'-'+String((s+1)%100).padStart(2,'0'); };
const isLT=(bd,sd)=>{ const b=new Date(bd+'T00:00:00Z'); b.setUTCFullYear(b.getUTCFullYear()+1); return sd>b.toISOString().slice(0,10); };
const stRate=sd=>sd<TAXCUT?15:20, ltRate=sd=>sd<'2018-04-01'?0:sd<TAXCUT?10:12.5, ltEx=fy=>+fy.slice(3,7)>=2024?125000:100000;
function fyTax(L,STAT){ /* L: [{k:'I'|'S'|'L', pl, sd}] of one client in one FY */
  const sum=k=>L.filter(x=>x.k===k).reduce((a,x)=>a+x.pl,0), wr=(k,f)=>{ const G=L.filter(x=>x.k===k&&x.pl>0), g=G.reduce((a,x)=>a+x.pl,0); return g?G.reduce((a,x)=>a+x.pl*f(x.sd),0)/g:f(todayS()); };
  const fy=L.length?fyOf(L[0].sd):fyOf(todayS()), spec=sum('I'); let st=sum('S'), lt=sum('L'), stCF=0, ltCF=0;
  if(st<0){ if(lt>0){ const u=Math.min(lt,-st); lt-=u; st+=u; } stCF=-st; st=0; }
  if(lt<0){ ltCF=-lt; lt=0; }
  const ex=Math.min(lt,ltEx(fy)), ltT=lt-ex, rS=wr('S',stRate), rL=wr('L',ltRate);
  const tS=Math.max(0,spec)*(+STAT.slab||0)/100, tST=st*rS/100, tLT=ltT*rL/100, base=tS+tST+tLT, cess=base*(+STAT.cess||0)/100;
  return {fy,spec,specTax:tS,specCF:Math.max(0,-spec),stNet:sum('S'),stTaxable:st,stRate:rS,stTax:tST,stCF,ltNet:sum('L'),ltExempt:ex,ltTaxable:ltT,ltRate:rL,ltTax:tLT,ltCF,cess,tax:base+cess}; }
function taxCalc(E,Q,STAT,keep){ keep=keep||(()=>true); const today=todayS(), cur=fyOf(today), S={}, R={};
  const row=(c,sym)=>S[c+'|'+sym]=S[c+'|'+sym]||{c,sym,intra:0,st:0,lt:0,q:0,cost:0,val:0,nST:0,nLT:0,priced:true};
  (E.intra||[]).filter(keep).forEach(x=>{ row(x.c,x.sym).intra+=x.pl; (R[x.c]=R[x.c]||[]).push({k:'I',pl:x.pl,sd:x.d}); });
  (E.real||[]).filter(keep).forEach(x=>{ const l=isLT(x.bd,x.sd); row(x.c,x.sym)[l?'lt':'st']+=x.pl; (R[x.c]=R[x.c]||[]).push({k:l?'L':'S',pl:x.pl,sd:x.sd}); });
  const N={}; (E.hold||[]).filter(keep).forEach(h=>{ const r=row(h.c,h.sym), p=Q&&Q[h.sym]&&Q[h.sym].p, c=h.q*h.cost; r.q+=h.q; r.cost+=c;
    if(!p){ r.priced=false; return; } const u=h.q*p-c, l=isLT(h.d,today); r.val+=h.q*p; r[l?'nLT':'nST']+=u; (N[h.c]=N[h.c]||[]).push({k:l?'L':'S',pl:u,sd:today}); });
  const clients=[...new Set(Object.values(S).map(r=>r.c))].sort(), FY=[], CS=[];
  clients.forEach(c=>{ const L=R[c]||[], by={}; L.forEach(x=>(by[fyOf(x.sd)]=by[fyOf(x.sd)]||[]).push(x));
    const rows=Object.keys(by).sort().map(f=>Object.assign({c},fyTax(by[f],STAT))); FY.push(...rows);
    const real=L.reduce((a,x)=>a+x.pl,0), rtax=rows.reduce((a,x)=>a+x.tax,0), curL=by[cur]||[], nl=N[c]||[];
    const base=fyTax(curL.length?curL:[{k:'S',pl:0,sd:today}],STAT).tax, withN=fyTax(curL.concat(nl).length?curL.concat(nl):[{k:'S',pl:0,sd:today}],STAT).tax;
    const notional=nl.reduce((a,x)=>a+x.pl,0), ntax=withN-base, inv=Object.values(S).filter(r=>r.c===c).reduce((a,r)=>a+r.cost,0);
    CS.push({c,real,rtax,realNet:real-rtax,notional,ntax,notNet:notional-ntax,net:real-rtax+notional-ntax,inv}); });
  return {rows:Object.values(S).sort((a,b)=>a.c.localeCompare(b.c)||a.sym.localeCompare(b.sym)),fy:FY,cs:CS,cur,today}; }
/* ---------- Tax-saving suggestions for the current FY (per client), from open holdings at live prices:
   loss  = book a loss to set off gains already booked this FY (short-term loss sets off STCG then LTCG; long-term loss only LTCG)
   pair  = if a profit is booked in a holding, book a loss in another the same day so the gain is set off
   exempt= LTCG still inside this FY's exemption: book long-term gains tax-free and buy back the next trading day (cost resets higher)
   Each holding is taken whole (all lots, FIFO terms); saving = tax before - tax after, incl. cess. */
function taxPlan(E,Q,STAT,keep){ keep=keep||(()=>true); const today=todayS(), cur=fyOf(today), out=[], tx=L=>fyTax(L.length?L:[{k:'S',pl:0,sd:today}],STAT);
  const cs=[...new Set((E.hold||[]).filter(keep).map(h=>h.c))].sort();
  cs.forEach(c=>{ const L=[]; (E.intra||[]).filter(x=>x.c===c&&keep(x)&&fyOf(x.d)===cur).forEach(x=>L.push({k:'I',pl:x.pl,sd:x.d}));
    (E.real||[]).filter(x=>x.c===c&&keep(x)&&fyOf(x.sd)===cur).forEach(x=>L.push({k:isLT(x.bd,x.sd)?'L':'S',pl:x.pl,sd:x.sd}));
    const it={}; (E.hold||[]).filter(h=>h.c===c&&keep(h)).forEach(h=>{ const p=Q&&Q[h.sym]&&Q[h.sym].p; if(!p) return; const o=it[h.sym]=it[h.sym]||{sym:h.sym,q:0,p,lots:[],pl:0,lt:0,ltq:0};
      const u=h.q*(p-h.cost), l=isLT(h.d,today); o.q+=h.q; o.pl+=u; o.lots.push({k:l?'L':'S',pl:u,sd:today}); if(l){ o.lt+=u; o.ltq+=h.q; } });
    const I=Object.values(it), lose=I.filter(o=>o.pl<-1), gain=I.filter(o=>o.pl>1).sort((a,b)=>b.pl-a.pl), used=new Set();
    let base=L.slice(); const t0=tx(base).tax;
    if(t0>1){ for(;;){ let best=null; lose.filter(o=>!used.has(o.sym)).forEach(o=>{ const sv=tx(base).tax-tx(base.concat(o.lots)).tax; if(sv>(best?best.sv:50)) best={o,sv}; }); if(!best) break;
        used.add(best.o.sym); base=base.concat(best.o.lots); out.push({c,kind:'loss',sym:best.o.sym,q:best.o.q,p:best.o.p,pl:best.o.pl,save:best.sv,fy:cur}); } }
    gain.slice(0,5).forEach(g=>{ const tA=tx(base.concat(g.lots)).tax-tx(base).tax; if(tA<100) return; let B=base.concat(g.lots), w=[], sv=0;
      for(;;){ let best=null; lose.filter(o=>!used.has(o.sym)&&!w.includes(o)).forEach(o=>{ const s2=tx(B).tax-tx(B.concat(o.lots)).tax; if(s2>(best?best.s2:50)) best={o,s2}; }); if(!best) break; w.push(best.o); B=B.concat(best.o.lots); sv+=best.s2; }
      if(w.length){ w.forEach(o=>used.add(o.sym)); out.push({c,kind:'pair',sym:g.sym,q:g.q,p:g.p,pl:g.pl,tax:tA,with:w.map(o=>({sym:o.sym,q:o.q,p:o.p,pl:o.pl})),save:sv,fy:cur}); } });
    const f=tx(base); let room=ltEx(cur)-f.ltExempt;
    if(room>1000) gain.filter(o=>o.lt>1).forEach(o=>{ if(room<=1000) return; const per=o.lt/o.ltq, q=Math.min(o.ltq,Math.floor(room/per)); if(q<1) return; const g=q*per; room-=g;
      out.push({c,kind:'exempt',sym:o.sym,q,p:o.p,pl:g,save:g*ltRate(today)/100*(1+(+STAT.cess||0)/100),fy:cur}); }); });
  return out; }
/* ---------- where the profit went: gross profit (booked + notional, before every charge) split into government levies
   (STT, stamp duty, GST, SEBI fee, income tax), stock exchange charges, brokerage (without GST), DP charges and what the client kept.
   ch: {brk,gst,stt,stamp,exch,sebi,dp,turn} ; net: booked + notional P&L after charges ; itax: income tax booked + if sold today.
   show = true only when it supports the client conversation: in profit (after costs and tax) and either government levies above the
   brokerage or brokerage at most 5% of the gross profit; more = government levies above brokerage (the 'x times' line is used only then). */
function chargeSplit(parts,STAT){ const g=(+STAT.gst||0)/100, o={brk:0,gst:0,stt:0,stamp:0,exch:0,sebi:0,dp:0,turn:0};
  (parts||[]).forEach(p=>{ o.brk+=p.brk||0; o.gst+=((p.brk||0)+(p.exch||0)+(p.sebi||0))*g; o.stt+=p.stt||0; o.stamp+=p.stamp||0; o.exch+=p.exch||0; o.sebi+=p.sebi||0; o.dp+=(p.dp||0)*(1+g); o.turn+=p.v||0; }); return o; }
function profitSplit(ch,net,itax){ const it=+ch.int||0, trade=ch.brk+ch.gst+ch.stt+ch.stamp+ch.exch+ch.sebi, G=net+trade+ch.dp+it, gov=ch.stt+ch.stamp+ch.gst+ch.sebi+Math.max(0,itax||0), kept=G-gov-ch.exch-ch.brk-ch.dp-it;   /* ch.int = interest paid on borrowed funds (optional) */
  const small=G>0&&ch.brk/G<=0.05, more=gov>ch.brk, show=G>0&&kept>0&&(more||small);
  const why=G<=0?'not in profit':kept<=0?'costs and tax exceed the profit':!show?'brokerage above govt levies and over 5% of profit':'';
  return Object.assign({},ch,{G,gov,itax:Math.max(0,itax||0),kept,show,more,why,pc:v=>G>0?v/G*100:null}); }
/* sector names as used in the Indian market, from Yahoo's industry (assetProfile.industry); SECTOR_FIX wins for a symbol */
const SECTOR_FIX={ITC:'FMCG',RELIANCE:'Oil & Gas / Conglomerate',IRCTC:'Travel & Tourism',LT:'Infrastructure & Construction',ADANIENT:'Conglomerate',COALINDIA:'Mining',ONGC:'Oil & Gas',IRFC:'Finance - Railways',RVNL:'Infrastructure - Railways',IRCON:'Infrastructure - Railways'};
const SECTOR_RX=[[/aerospace|defen/i,'Defence'],[/auto parts/i,'Auto Ancillary'],[/auto|truck/i,'Auto'],[/resort|casino|lodging/i,'Hotels & Tourism'],[/travel/i,'Travel & Tourism'],[/airline/i,'Aviation'],
  [/^banks/i,'Banking'],[/insurance/i,'Insurance'],[/credit services|mortgage|financial conglomerate/i,'NBFC / Finance'],[/asset management|capital markets|financial data|exchange/i,'Capital Markets'],
  [/information technology|software/i,'IT'],[/drug|biotech|pharma/i,'Pharma'],[/medical care|diagnostic|health information/i,'Healthcare Services'],[/medical (device|instrument)/i,'Medical Equipment'],
  [/tobacco|packaged food|household & personal|beverages|confection|food distribution|farm products/i,'FMCG'],[/steel/i,'Metals - Steel'],[/alumin|copper|industrial metals|gold|silver|precious/i,'Metals & Mining'],[/coal|mining/i,'Mining'],
  [/utilities|power|renewable|solar/i,'Power'],[/oil|gas/i,'Oil & Gas'],[/agricultural inputs/i,'Agro Chemicals & Fertilisers'],[/chemical/i,'Chemicals'],[/building materials/i,'Cement & Building Materials'],
  [/engineering & construction|infrastructure/i,'Infrastructure & Construction'],[/real estate/i,'Realty'],[/telecom/i,'Telecom'],[/electrical equipment|machinery|tools & accessories|industrial distribution|pollution/i,'Capital Goods'],
  [/marine shipping|railroad|trucking|freight|logistics|airport/i,'Logistics & Transport'],[/apparel|textile|footwear/i,'Textiles & Apparel'],[/restaurant/i,'QSR / Restaurants'],[/luxury/i,'Jewellery & Luxury'],
  [/department|specialty retail|internet retail|grocery|discount/i,'Retail'],[/entertainment|broadcast|publishing|advertising|internet content/i,'Media & Entertainment'],[/semiconductor|electronic|computer hardware|communication equipment/i,'Electronics'],
  [/furnishing|appliance|fixtures|recreational|leisure/i,'Consumer Durables'],[/packaging/i,'Packaging'],[/paper|lumber/i,'Paper'],[/conglomerate/i,'Conglomerate'],[/education/i,'Education'],[/rental|staffing|consulting|business services|security/i,'Services']];
const sectorOf=(sym,ind,sec)=>SECTOR_FIX[sym]||((SECTOR_RX.find(([r])=>r.test(ind||''))||[])[1])||sec||'';
/* 🏷 sector of any script: Nifty 500 from idx.json (Yahoo industry, else NSE industry), others looked up once on Yahoo and kept in jc_pf_sec */
let SECM=null, SECP=null; const SECBAD={};
function secLoad(){ if(SECP) return SECP; SECP=(async()=>{ const M={}; try{ const j=await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/idx/idx.json?x='+Math.floor(Date.now()/864e5),{cache:'no-store'}).then(r=>r.json());
    Object.entries(j.yi||{}).forEach(([s,y])=>{ const v=sectorOf(s,y,''); if(v) M[s]=v; }); Object.entries(j.ind||{}).forEach(([s,n])=>{ if(!M[s]) M[s]=sectorOf(s,'',n)||n; }); }catch(e){}
  SECM=Object.assign(M,LS.get('jc_pf_sec',{})); return SECM; })(); return SECP; }
const secOf=sym=>(SECM&&SECM[sym])||SECTOR_FIX[sym]||'';
async function secFill(syms){ await secLoad(); const need=[...new Set(syms)].filter(s=>s&&!SECM[s]&&!SECBAD[s]).slice(0,40); if(!need.length) return 0; const C=LS.get('jc_pf_sec',{}); let n=0;
  for(const s of need){ SECBAD[s]=1; for(const tk of [s+'.NS',s+'.BO']){ try{ const u='https://query2.finance.yahoo.com/v10/finance/quoteSummary/'+encodeURIComponent(tk)+'?modules=assetProfile';
      const j=await fetch(BE+'?action=fetch&url='+encodeURIComponent(u)).then(r=>r.json()), a=j&&j.quoteSummary&&j.quoteSummary.result&&j.quoteSummary.result[0]&&j.quoteSummary.result[0].assetProfile;
      if(a&&(a.industry||a.sector)){ const v=sectorOf(s,a.industry||'',a.sector||''); if(v){ SECM[s]=C[s]=v; n++; } break; } }catch(e){} } }
  if(n) LS.set('jc_pf_sec',C); return n; }
/* Trading / Investment mark is per client + symbol ('S1MU061|ITC'); an old symbol-wide mark ('ITC') still applies to clients
   with no mark of their own until one client's mark is changed - then it is copied to every client holding that symbol and removed */
const markOf=(M,c,sym)=>(M||{})[c+'|'+sym]||(M||{})[sym]||'';
function markSplit(M,sym,trades){ if(!M||!M[sym]) return M; const v=M[sym]; [...new Set((trades||[]).filter(t=>t.sym===sym||canonSym(t.sym)===sym).map(t=>t.c))].forEach(c=>{ if(!M[c+'|'+sym]) M[c+'|'+sym]=v; }); delete M[sym]; return M; }
function liquidate(c,hold,Q,marks,need,STAT,rateOf){ const rows=[];
  hold.filter(h=>h.c===c&&Q[h.sym]).forEach(h=>{ const r=rows.find(x=>x.sym===h.sym); if(r){ r.q+=h.q; r.cost+=h.q*h.cost; r.hc+=h.hc; } else rows.push({sym:h.sym,q:h.q,cost:h.q*h.cost,hc:h.hc}); });
  rows.forEach(r=>{ r.p=Q[r.sym].p; r.mk=markOf(marks,c,r.sym); r.pl=r.q*r.p-r.cost-r.hc; r.plp=r.pl/(r.cost+r.hc)*100; });
  const tier=r=>r.mk==='I'?1:0; rows.sort((a,b)=>tier(a)-tier(b)||b.plp-a.plp);
  let got=0; const pick=[];
  for(const r of rows){ if(got>=need) break; let q=r.q; const full=sellNet(c,r.p,r.q,STAT,rateOf);
    if(got+full>need){ q=Math.min(r.q,Math.ceil((need-got)/(r.p*0.99))); while(q<r.q&&got+sellNet(c,r.p,q,STAT,rateOf)<need) q++; }
    const net=sellNet(c,r.p,q,STAT,rateOf); got+=net; pick.push({sym:r.sym,mk:r.mk,q,of:r.q,p:r.p,net,pl:r.pl*q/r.q,plp:r.plp}); }
  return {pick,got,short:Math.max(0,need-got)}; }
/* liquidation, newest purchase first: open positions ordered by their last buy date (latest first), then by the largest profit;
   Investment-marked stocks only after the rest. Sells until the net sale value covers 'need'. */
function liquidateNew(c,hold,Q,marks,need,STAT,rateOf){ const rows=[];
  hold.filter(h=>h.c===c&&Q[h.sym]&&h.cost!=null).forEach(h=>{ let r=rows.find(x=>x.sym===h.sym); if(!r){ r={sym:h.sym,q:0,cost:0,hc:0,last:''}; rows.push(r); } r.q+=h.q; r.cost+=h.q*h.cost; r.hc+=h.hc||0; if((h.d||'')>r.last) r.last=h.d||''; });
  rows.forEach(r=>{ r.p=Q[r.sym].p; r.mk=markOf(marks,c,r.sym); r.avg=r.cost/r.q; r.pl=r.q*r.p-r.cost-r.hc; r.plp=r.pl/(r.cost+r.hc)*100; });
  rows.sort((a,b)=>((a.mk==='I')-(b.mk==='I'))||b.last.localeCompare(a.last)||b.pl-a.pl);
  let got=0; const pick=[];
  for(const r of rows){ if(got>=need) break; let q=r.q; const full=sellNet(c,r.p,r.q,STAT,rateOf);
    if(got+full>need){ q=Math.min(r.q,Math.ceil((need-got)/(r.p*0.99))); while(q<r.q&&got+sellNet(c,r.p,q,STAT,rateOf)<need) q++; }
    const net=sellNet(c,r.p,q,STAT,rateOf); got+=net; pick.push({sym:r.sym,mk:r.mk,last:r.last,avg:r.avg,q,of:r.q,p:r.p,net,pl:r.pl*q/r.q,plp:r.plp}); }
  return {pick,got,short:Math.max(0,need-got),all:rows}; }
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
  await xlsxLib(); const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false}) /* serial day numbers - no time-zone shift */; const ws=wb.Sheets[file.__sheet&&wb.Sheets[file.__sheet]?file.__sheet:wb.SheetNames[0]];
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
/* the sheets of a workbook that hold rows (a workbook with one sheet per client, or several reports) */
async function sheetsWithRows(file){ if(!/\.xls[xm]?$/i.test(file.name)) return []; await xlsxLib(); const wb=XLSX.read(await file.arrayBuffer(),{type:'array',sheetRows:30});
  return wb.SheetNames.filter(n=>{ const r=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''}); return r.filter(x=>x.filter(v=>String(v).trim()).length>=3).length>=2; }); }
const sheetCode=sh=>sh&&/^[A-Z0-9][A-Z0-9_\-]{3,14}$/i.test(sh.trim())&&!/^sheet\s*\d*$/i.test(sh.trim())&&/\d/.test(sh)?sh.trim().toUpperCase():null;
function askCode(file){ const sc=sheetCode(file.__sheet); if(sc) return sc;   /* sheet named after the client code */
  const c=prompt('Client code for '+file.name+(file.__sheet?' · sheet '+file.__sheet:'')+' (no client-code column found):',''); if(!c||!c.trim()) throw new Error('no client code given'); if(/\s/.test(c.trim())&&/[a-z]{2,}\s+[a-z]{2,}/i.test(c)) throw new Error('enter the client code, not the name'); return c.trim().toUpperCase(); }
/* a workbook with several sheets (e.g. one per client): every sheet is read and all fills are saved together, client-wise */
async function importTrades(file){ const S=await sheetsWithRows(file).catch(()=>[]);
  if(S.length>1){ const all=[], rep=[]; for(const sh of S){ const f={name:file.name,__sheet:sh,__collect:all,arrayBuffer:()=>file.arrayBuffer(),text:()=>file.text()};
      try{ rep.push(sh+': '+(await importTrades1(f))); }catch(e){ rep.push(sh+': '+e.message); } }
    if(!all.length) throw new Error('no valid fills in any sheet - '+rep.join(' · '));
    const cl=addTrades(file.name,dmy(todayS())+' '+ist().toISOString().slice(11,16),all);
    driveSave('trade',file.name,cl.map(c=>({client:c,csv:tradeCSV(all.filter(x=>x.c===c))})));
    return all.length+' fills for '+cl.join(', ')+' · '+S.length+' sheets ('+rep.join(' · ')+') · client name not read'; }
  return importTrades1(file); }
async function importTrades1(file){
  if(/\.pdf$/i.test(file.name)){ const out=parseTradePdf(await pdfLines(await file.arrayBuffer()),await isinMap());
    const cl=addTrades(file.name,dmy(todayS())+' '+ist().toISOString().slice(11,16),out);
    driveSave('trade',file.name,cl.map(c=>({client:c,csv:tradeCSV(out.filter(x=>x.c===c))})));
    const ds=out.map(x=>x.d).sort(); return out.length+' fills for '+cl.join(', ')+' · '+dmy(ds[0])+' to '+dmy(ds[ds.length-1])+' · client name not read'+((out.skipped||[]).length?' · not a trade, left out: '+out.skipped.join(', '):''); }
  const rows=await readRows(file); if(!rows.length) throw new Error('no rows found');
  { const r0=rows[0], bq=col(r0,/^\s*buy\s*qty/i), ba=col(r0,/^\s*buy\s*(avg|rate|price)/i), sq=col(r0,/^\s*sell\s*qty/i), sa=col(r0,/^\s*sell\s*(avg|rate|price)/i);
    if(bq&&ba&&sq&&sa) return importNetPos(file,rows,{bq,ba,sq,sa}); }
  const r0=rows[0], cd=col(r0,/date/i), cc=codeCol(r0,rows), cs=col(r0,/^\s*symbol/i)||col(r0,/symbol|scrip(?!\s*code)|security|stock|instrument/i), cb=col(r0,/b\s*\/\s*s|buy.?sell|side|trans.*type|^type$/i), cq=col(r0,/qty|quantity/i), cr=col(r0,/rate|price|avg/i);
  const miss=[['Date',cd],['Symbol',cs],['Buy/Sell',cb],['Qty',cq],['Rate',cr]].filter(x=>!x[1]).map(x=>x[0]); if(miss.length) throw new Error('columns not found: '+miss.join(', '));
  const one=cc?null:askCode(file), cx=col(r0,/^\s*exch/i), csc=col(r0,/scrip\s*code/i), cse=col(r0,/^\s*ser/i), cpt=col(r0,/product/i), cvp=col(r0,/var\s*%/i), cva=col(r0,/var\s*am/i), csr=col(r0,/^\s*source\s*$/i);
  const out=[]; rows.forEach(r=>{ const d=pdate(r[cd]), q=Math.abs(num(r[cq])), rt=num(r[cr]), side=/^s/i.test(String(r[cb]).trim())?'S':/^b/i.test(String(r[cb]).trim())?'B':null, c=one||String(r[cc]).trim().toUpperCase();
    if(d&&q>0&&rt>0&&side&&c){ const o={d,c,sym:String(r[cs]).trim().toUpperCase().replace(/[-\s]EQ$|\.NS$/,''),side,q,r:rt}; if(cx) o.ex=String(r[cx]||'').trim(); if(csc) o.scode=String(r[csc]||'').trim(); if(cse) o.ser=String(r[cse]||'').trim(); if(cpt) o.prod=String(r[cpt]||'').trim(); if(cvp&&num(r[cvp])>0) o.varp=num(r[cvp]); if(cva&&num(r[cva])>0) o.vara=num(r[cva]); if(csr){ const sv=String(r[csr]||'').trim().toLowerCase(); if(sv==='entered') o.man=true; else if(sv==='edited') o.edited=true; } out.push(o); } });
  if(!out.length) throw new Error('no valid fills (check dates, quantities, rates and Buy/Sell)');
  if(file.__collect){ file.__collect.push(...out); return out.length+' fills'; }
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
  if(file.__collect){ file.__collect.push(...out); return out.length+' fills'; }
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
    tc.items.forEach(it=>{ const s=it.str; if(!s||!s.trim()) return; const T=it.transform, rot=Math.abs(T[1])>Math.abs(T[0]), x=rot?(T[1]>0?T[5]:-T[5]):T[4], y=rot?(T[1]>0?-T[4]:T[4]):T[5];   /* landscape statements printed rotated: turn the text upright */
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
  if(/Party\s*Ledger\s+Code|PartyLedger\s+for/i.test(all)) return parsePartyLedger(L);
  const hm=all.match(/(?:^|\n)([^\n\[]{2,80}?)\s*\[\s*([A-Z0-9]{3,15})\s*\]/), client=hm?hm[2].toUpperCase():'', who=hm?hm[1].replace(/[\[\]]/g,'').trim():'';
  if(!client) throw new Error('client code [CODE] not found in this ledger');
  const per=all.match(/LEDGER\s*\[\s*(\d{2}\/\d{2}\/\d{4})\s*To\s*(\d{2}\/\d{2}\/\d{4})/i)||all.match(/Ledger\s*\[[^\]]*\]\s*from\s*(\d{2}\/\d{2}\/\d{4})\s*to\s*(\d{2}\/\d{2}\/\d{4})/i);
  const words=who.split(/\s+/).filter(w=>w.length>2);
  const scrub=t=>{ if(who) t=t.split(who).join(' '); words.forEach(w=>{ t=t.replace(new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','gi'),' '); }); return t.replace(/\[\s*[A-Z0-9]{3,15}\s*\]/g,' ').replace(/\s+/g,' ').trim(); };
  const hi=L.findIndex(r=>/^Date\b.*Particular.*Debit.*Credit.*Balance/i.test(r.text)); if(hi<0) throw new Error('ledger columns (Date / Particular / Debit / Credit / Balance) not found');
  const body=L.slice(hi+1).filter(r=>!/^\[.*\]$/.test(r.text)&&!/^(Sub Total|Grand Total|Page \d|Printed|\.$)/i.test(r.text)&&!/LEDGER\s*\[|COMPLIANCE OFFICER|Finance & Securities|^Account\s+Of\s*:|TradeplusX|^Totals\s*:|^Schedule\s*\[/i.test(r.text));
  const obl=body.find(r=>/^Opening\s+Balance\s+(?:[\d,]+\.\d{2}\s+)?[\d,]+\.\d{2}\s*(Dr|Cr)?$/i.test(r.text)), ob0=obl?(()=>{ const m=obl.text.match(/([\d,]+\.\d{2})\s*(Dr|Cr)?$/i); return n2(m[1])*(/cr/i.test(m[2]||'')?-1:1); })():null;
  if(obl) body.splice(body.indexOf(obl),1);
  const dated=[], loose=[];
  body.forEach(r=>{ const m=r.text.match(/^(\d{2}\/\d{2}\/(?:\d{4}|\d{2}))\s+(?:([A-Z]{1,3}\/\d+|[A-Z]{1,2}\d{5,7})\s+)?(.*?)\s*((?:[\d,]+\.\d{2}\s+){0,2})([\d,]+\.\d{2})\s*(Dr|Cr)?$/i);
    if(m&&(m[6]||/^0\.00$/.test(m[5]))) dated.push({r,d:ddmmy(m[1]),v:m[2]||'',t:m[3],nums:(m[4]||'').trim().split(/\s+/).filter(Boolean).map(n2),bal:n2(m[5])*(/cr/i.test(m[6])?-1:1)});
    else loose.push(r); });
  if(!dated.length) throw new Error('no dated ledger entries found');
  const tpx=/Ledger\s*\[[^\]]*\]\s*from\s*\d{2}\//i.test(all);   /* TradeplusX: a wrapped narration always continues BELOW its own entry */
  loose.forEach(r=>{ let best=null, bd=1e9; dated.forEach(d=>{ if(d.r.p!==r.p||(tpx&&d.r.y<r.y)) return; const dd=Math.abs(d.r.y-r.y); if(dd<bd){ bd=dd; best=d; } }); if(best&&bd<(tpx?60:30)) (best.extra=best.extra||[]).push(r); });
  const out=[]; let prev=null, bad=0;
  if(ob0!=null){ prev=ob0; out.push({d:(per&&ddmm(per[1]))||dated[0].d,v:'',n:'Opening Balance',dr:ob0>0?ob0:0,cr:ob0<0?-ob0:0,bal:ob0,k:'oth'}); }
  dated.forEach(d=>{ const ex=d.extra||[], parts=[...ex.filter(x=>x.y>d.r.y).sort((a,b)=>b.y-a.y).map(x=>x.text),d.t,...ex.filter(x=>x.y<d.r.y).sort((a,b)=>b.y-a.y).map(x=>x.text)];
    const n=scrub(parts.filter(Boolean).join(' ')), ob=/opening balance/i.test(n);
    let dr=0, cr=0;
    if(ob||prev==null){ if(d.bal>0) dr=d.bal; else cr=-d.bal; }
    else { const dl=d.bal-prev; if(dl>=0) dr=dl; else cr=-dl; const amt=d.nums.length?d.nums[0]:null; if(amt!=null&&Math.abs(amt-Math.abs(dl))>0.05) bad++; }
    prev=d.bal;
    out.push({d:d.d,v:d.v,n:n||d.v,dr:+dr.toFixed(2),cr:+cr.toFixed(2),bal:d.bal,k:ob?'oth':kindOf(n,dr,cr,d.v)}); });
  if(bad) throw new Error(bad+' entr'+(bad>1?'ies do':'y does')+' not agree with the running balance - not imported');
  const gt=all.match(/Grand\s+Total\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*(Dr|Cr)/i)||all.match(/Totals\s*:\s*([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*(Dr|Cr)?/i);
  if(gt){ const last=out[out.length-1].bal, g2=n2(gt[3])*(/cr/i.test(gt[4])?-1:1); if(Math.abs(last-g2)>0.05&&!(Math.abs(g2)<0.005&&Math.abs(last)<0.005)) throw new Error('closing balance does not match the Grand Total - not imported'); }
  return {client,from:per?ddmm(per[1]):null,to:per?ddmm(per[2]):null,entries:out}; }

/* ---------- more SSJ back-office PDF formats (all read in the browser; client code kept, names / addresses dropped) ----------
   LEDGER  · TradeplusX "Ledger [All Exchange/Segment] from .. to .." (dd/mm/yy dates, B000701 vouchers, undated Opening Balance)
           · old "PartyLedger" (landscape; one block per segment CAPITAL - NSE / CAPITAL - BSE / MARGIN ...): segments are merged
             into one running balance; FUNDS TRANSFER between segments cancel out and are kept as 'oth'.
   TRADES  · "Sauda Summary Report - Settlement Wise" (NSE, landscape): one row per scrip and day, buy and sell qty / avg rate.
           · TradeplusX "Settlementwise Summary": per scrip [BSE code], one row per settlement with Bqty/Rate and Sqty/Rate
             (which side a number belongs to comes from its column position); 'Exs. sale' valuation lines are not trades.
   DP      · "Transaction/Holding" statement: only the final "Statement of Holding as on" table is kept (ISIN, qty, rate, value, balance type). */
const ddmmy=s=>{ const m=String(s).match(/(\d{2})\/(\d{2})\/(\d{2,4})\b/); return m?(m[3].length===2?'20'+m[3]:m[3])+'-'+m[2]+'-'+m[1]:null; };
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const mdy=s=>{ const m=String(s).match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/); return m&&MON[m[1].toLowerCase()]?m[3]+'-'+String(MON[m[1].toLowerCase()]).padStart(2,'0')+'-'+m[2].padStart(2,'0'):null; };
const nameScrub=who=>{ const words=String(who||'').split(/\s+/).filter(w=>w.length>2&&!/^\d+$/.test(w)); return t=>{ if(who) t=t.split(who).join(' '); words.forEach(w=>{ t=t.replace(new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','gi'),' '); }); return t.replace(/\[\s*[A-Z0-9]{3,15}\s*\]/g,' ').replace(/\s+/g,' ').trim(); }; };

/* old landscape PartyLedger - every segment, merged */
function parsePartyLedger(L){ const all=L.map(r=>r.text).join('\n');
  const hm=all.match(/Party\s+Ledger\s+Code\s*:\s*([A-Z0-9]{3,15})\s*-\s*([^\n]*?)\s+Page\s+No/i); if(!hm) throw new Error('Party Ledger Code (client code) not found in this ledger');
  const client=hm[1].toUpperCase(), scrub=nameScrub(hm[2].trim()), per=all.match(/PartyLedger\s+for\s*:\s*(\d{2}\/\d{2}\/\d{4})\s*To\s*(\d{2}\/\d{2}\/\d{4})/i);
  const E=[]; let seg='', last=null;
  L.forEach(r=>{ const t=r.text;
    if(/^(CAPITAL|MARGIN|DERIVATIVES|CURRENCY|COMMODITY|FUTURES|F&O|MCX|NCDEX|MARGIN CAPITAL|MARGIN DERIVATIVES)\b.*-\s*(NSE|BSE|MCX|NCDEX)\s*$/i.test(t)){ seg=t.trim(); last=null; return; }
    const m=t.match(/^(\d{2}\/\d{2}\/\d{4})\s+([A-Z]+)\s+(\d{6,})\s+(\S+)\s+(.*?)\s+(-?[\d,]+(?:\.\d+)?)\s+(-?[\d,]+(?:\.\d+)?)\s+(-?[\d,]+(?:\.\d+)?)$/);
    if(m){ let n=m[5].replace(/\s+\S*\d{6,}\S*$/,''); last={d:ddmmy(m[1]),vt:m[2],v:m[2]+' '+m[3],n,dr:Math.abs(n2(m[6])),cr:Math.abs(n2(m[7])),seg}; E.push(last); return; }
    if(last&&!/Opening Balance|^Total\s*:|Net Balance|Voucher Date|PartyLedger|Party Ledger|Report Order|Selection On|SSJ FINANCE|Page No/i.test(t)&&!/^[\d,.\s-]+$/.test(t)&&t.length<60) last.n+=' '+t; else last=null; });
  if(!E.length) throw new Error('no dated ledger entries found');
  const nb=all.match(/Net\s+Balance\s*:\s*(-?[\d,]+(?:\.\d+)?)/i);
  E.sort((a,b)=>a.d.localeCompare(b.d));   // stable: the order inside a day is kept
  let bal=0; const out=E.map(e=>{ bal=+(bal+e.dr-e.cr).toFixed(2); let n=scrub(e.n), k;
    if(/funds?\s+transfer\s+from\s+(nse|bse|mcx)\s+to\s+(nse|bse|mcx)/i.test(n)) k='oth';
    else if(e.vt==='REPBNK'||e.vt==='RECBNK') k=e.cr>0?'in':'out'; else if(e.vt==='PAYBNK') k=e.dr>0?'out':'in';
    else if(e.vt==='BILL'){ const s=n.match(/SETTNO=(\d{7})(NSE|BSE)?/i); n='Bill '+(s?(s[2]||'')+' settlement '+s[1]:n)+' ('+e.d.slice(8,10)+'/'+e.d.slice(5,7)+'/'+e.d.slice(2,4)+')'; k='bill'; }
    else k=kindOf(n,e.dr,e.cr,e.v);
    return {d:e.d,v:e.v,n:n+(e.seg?' · '+e.seg:''),dr:+e.dr.toFixed(2),cr:+e.cr.toFixed(2),bal,k}; });
  if(nb&&Math.abs(-n2(nb[1])-bal)>0.05) throw new Error('entries do not add up to the Net Balance of the ledger - not imported');
  return {client,from:per?ddmm(per[1]):null,to:per?ddmm(per[2]):null,entries:out}; }

/* trades - "Sauda Summary" (NSE) and TradeplusX "Settlementwise Summary" */
function parseTradePdf(L,ISM){ const all=L.map(r=>r.text).join('\n'), out=[];
  if(/Sauda\s+Summary/i.test(all)){ const pm=all.match(/Parties\s*:?\s*:\s*([A-Z0-9]+)\s+To\s+([A-Z0-9]+)/i); if(!pm) throw new Error('client code (Parties) not found in this trade report');
    if(pm[1].toUpperCase()!==pm[2].toUpperCase()) throw new Error('this report covers several clients ('+pm[1]+' to '+pm[2]+') - export one client per file');
    const c=pm[1].toUpperCase(), bse=/-\s*BSE\s*CM|BSECM/i.test(all), rev={}; let pend=[];   /* BSE version: Code = BSE scrip code, Series = BSE */
    Object.entries((ISM&&ISM.b)||{}).forEach(([isin,b])=>{ if(b&&b[0]) rev[String(b[0])]=isin; });
    L.forEach(r=>{ const t=r.text, sd=t.match(/^SUB-TOTAL\s+FOR\s+DATE\s+(.+?\d{4})/i);
      if(sd){ const d=mdy(sd[1]); pend.forEach(p=>{ if(d) out.push(Object.assign(p,{d})); }); pend=[]; return; }
      const m=t.match(/^([A-Z0-9&\-]+)\s+([A-Z][A-Z0-9]{1,3})\s+(.+?)((?:\s+-?[\d.]+){11})$/); if(!m||/^(BROKERAGE|BRKSCR)$/i.test(m[1])||/^BROKERAGE$/i.test(m[3].trim())) return;
      let sym=m[1].toUpperCase(), sc='';
      if(/^\d{5,6}$/.test(sym)){ sc=sym; const isin=rev[sc]; sym=(isin&&ISM.i[isin])||(isin&&(ISM.b[isin]||[])[1])||m[3].trim().toUpperCase().replace(/\b(LTD|LIMITED)\b\.?/g,'').replace(/[^A-Z0-9&]/g,''); }
      const v=m[4].trim().split(/\s+/).map(Number), base={c,sym,ex:bse?'BSE':'NSE',ser:bse?'':m[2],src:'sauda'}; if(sc) base.scode=sc;
      if(v[0]>0&&v[1]>0) pend.push(Object.assign({},base,{side:'B',q:v[0],r:v[1]})); if(v[3]>0&&v[4]>0) pend.push(Object.assign({},base,{side:'S',q:v[3],r:v[4]})); });
    if(!out.length) throw new Error('no buy / sell rows found in this Sauda summary');
    const tt=all.match(/^TOTALS\s+([\d.]+)\s+[\d.]+\s+([\d.]+)\s/m);   /* report TOTALS: buy qty, buy value, sell qty, ... (brokerage rows have qty 0) */
    if(tt){ const bq=out.filter(x=>x.side==='B').reduce((a,x)=>a+x.q,0), sq=out.filter(x=>x.side==='S').reduce((a,x)=>a+x.q,0);
      if(Math.abs(bq-n2(tt[1]))>0.01||Math.abs(sq-n2(tt[2]))>0.01) throw new Error('rows read (buy '+bq+' / sell '+sq+') do not match the report TOTALS (buy '+n2(tt[1])+' / sell '+n2(tt[2])+') - not imported'); }
    return out; }
  if(/Settlementwise\s+Summary/i.test(all)){ const hd=L.find(r=>/End Date.*Stlmnt.*Bqty.*Sqty/i.test(r.text)); if(!hd) throw new Error('columns End Date / Stlmnt / Bqty / Sqty not found');
    const sx=(hd.items.find(i=>/^Sqty$/i.test(i.s.trim()))||{}).x; if(sx==null) throw new Error('Sqty column not found');
    const rev={}; Object.entries((ISM&&ISM.b)||{}).forEach(([isin,b])=>{ if(b&&b[0]) rev[String(b[0])]=isin; });
    let c=null, sym=null, sc='';
    L.forEach(r=>{ const t=r.text, br=t.match(/^(.+?)\s*\[\s*([A-Z0-9]+)\s*\]/);
      if(br&&!/^\d+$/.test(br[2])&&/[A-Z]/.test(br[2])&&/\d/.test(br[2])){ c=br[2].toUpperCase(); return; }   // client line - name dropped, code kept
      if(br&&/^\d{5,6}$/.test(br[2])){ sc=br[2]; const isin=rev[sc]; sym=(isin&&ISM.i[isin])||((ISM.b[isin]||[])[1])||br[1].trim().toUpperCase().replace(/\s+/g,''); return; }
      const dm=t.match(/^(\d{2}\/\d{2}\/\d{4})\s+([A-Z]{1,3}\d{5,})\b/); if(!dm||!c||!sym) return;
      const nums=r.items.filter(i=>/^[\d,]+(\.\d+)?$/.test(i.s.trim())&&i.x>(r.items[1]?r.items[1].x+5:0));
      const B=nums.filter(i=>i.x<sx-25).map(i=>n2(i.s)), S=nums.filter(i=>i.x>=sx-25).map(i=>n2(i.s)), base={d:ddmm(dm[1]),c,sym,scode:sc,stl:dm[2],src:'settlewise'};
      if(B.length>=2&&B[0]>0&&B[1]>0) out.push(Object.assign({},base,{side:'B',q:B[0],r:B[1]})); if(S.length>=2&&S[0]>0&&S[1]>0) out.push(Object.assign({},base,{side:'S',q:S[0],r:S[1]})); });
    if(!out.length) throw new Error('no settlement rows found in this summary');
    const qs=re=>{ const m=all.match(re); if(!m) return null; return m[1].trim().split(/\s+/).map(n2); };   /* summary: Bought / Sold : delivery qty, value, squared-off qty, value, total value */
    const bo=qs(/^Bought\s*:\s*([\d.\s]+)$/m), so=qs(/^Sold\s*:\s*([\d.\s]+)$/m);
    if(bo&&so&&bo.length>=4&&so.length>=4){ const bq=out.filter(x=>x.side==='B').reduce((a,x)=>a+x.q,0), sq=out.filter(x=>x.side==='S').reduce((a,x)=>a+x.q,0);
      if(Math.abs(bq-(bo[0]+bo[2]))>0.01||Math.abs(sq-(so[0]+so[2]))>0.01) throw new Error('rows read (buy '+bq+' / sell '+sq+') do not match the summary (bought '+(bo[0]+bo[2])+' / sold '+(so[0]+so[2])+') - not imported'); }
    return out; }
  if(/ANNUAL\s+GLOBAL\s+TRANSACTION\s+STATEMENT/i.test(all)){   /* AGTS: client code (UCC) + per-day trade rows; name, PAN, address, phone are never read */
    const um=all.match(/UCC\(s\)\s+of\s+the\s+Client\s+([A-Z0-9]+)/i); if(!um) throw new Error('client code (UCC) not found in this AGTS');
    const c=um[1].toUpperCase(), bad=[]; let d=null, stl='', skipped=[];
    const nk=x=>String(x).toLowerCase().replace(/\b(limited|ltd)\b/g,'').replace(/[^a-z0-9]/g,'');
    L.forEach(r=>{ const t=r.text, dm=t.match(/^TRADE\s+DATE:\s*(\d{2}\/\d{2}\/\d{4})\b.*?\(\s*(\d+)\b/i);
      if(dm){ d=ddmm(dm[1]); stl=dm[2]; return; }
      const m=t.match(/^(.+?)\s+(NSE|BSE)\s+CAPITAL\s+((?:-?[\d,]+(?:\.\d+)?\s*){12})$/i); if(!m||!d) return;
      const v=m[3].trim().split(/\s+/).map(n2), ch=v[4]+v[5]+v[6]+v[7]+v[8]+v[9]+v[10], net=v[11];
      const exp=(v[2]>0||v[3]>0?v[3]:0)-(v[1])-ch;   /* net settlement = sale value - purchase value - all charges */
      if(Math.abs(exp-net)>0.1){ bad.push(dmy(d)+' '+m[1].trim()+' (statement '+net+', worked out '+exp.toFixed(2)+')'); return; }
      const nm=m[1].trim();
      if(!(v[0]>0)&&!(v[2]>0)){ skipped.push(nm+' ₹'+(-net).toFixed(2)); return; }   /* brokerage-only adjustment line: no shares */
      const sym=((ISM&&ISM.n)||{})[nk(nm)]||nm.toUpperCase().replace(/\b(LTD|LIMITED)\b\.?/g,'').replace(/[^A-Z0-9&]/g,''), base={d,c,sym,ex:m[2].toUpperCase(),ser:'EQ',stl,src:'agts'};
      if(v[0]>0&&v[1]>0) out.push(Object.assign({},base,{side:'B',q:v[0],r:+(v[1]/v[0]).toFixed(4)}));
      if(v[2]>0&&v[3]>0) out.push(Object.assign({},base,{side:'S',q:v[2],r:+(v[3]/v[2]).toFixed(4)})); });
    if(bad.length) throw new Error('rows do not tie to their net settlement amount - not imported: '+bad.join('; '));
    if(!out.length) throw new Error('no buy / sell rows found in this AGTS');
    out.skipped=skipped; return out; }
  throw new Error('trade PDF not recognised (supported: Sauda Summary - Settlement Wise, Settlementwise Summary, Annual Global Transaction Statement)'); }

/* DP "Transaction/Holding" statement - only the closing holding table */
function parseDPtxn(L){ const all=L.map(r=>r.text).join('\n'), g=re=>{ const m=all.match(re); return m?m[1]:null; };
  const client=(g(/Trading\s*Code\s*:\s*([A-Z0-9]+)/i)||'').toUpperCase(), dpac=g(/BOID\s*:\s*(\d{16})/i), asOf=ddmm(g(/Statement\s+of\s+Holding\s+as\s+on\s+(\d{2}\/\d{2}\/\d{4})/i)||'');
  if(!client) throw new Error('Trading Code (client code) not found in this DP statement');
  const i0=L.findIndex(r=>/Statement\s+of\s+Holding\s+as\s+on/i.test(r.text)); if(i0<0) throw new Error('"Statement of Holding" table not found');
  let type='Beneficiary'; const rows=[];
  L.slice(i0+1).forEach(r=>{ const t=r.text, bt=t.match(/Balance\s*type\s*:\s*(.+)$/i); if(bt){ type=bt[1].trim(); return; }
    const m=t.match(/^(IN[A-Z0-9]{10})\s+(.+?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+\.\d+)\s+([\d,]+\.\d+)$/); if(m) rows.push({isin:m[1],name:m[2].trim(),q:n2(m[3]),rate:n2(m[4]),value:n2(m[5]),type}); });
  if(!rows.length) throw new Error('no ISIN rows in the holding table');
  const tv=rows.reduce((a,x)=>a+x.value,0), tot=all.match(/Total\s+Valuation\s*:\s*([\d,]+\.\d+)/i); if(tot&&Math.abs(tv-n2(tot[1]))>1) throw new Error('holding values do not add up to the Total Valuation - not imported');
  rows.forEach(x=>x.pct=tv?+(x.value/tv*100).toFixed(2):0);
  return {client,dpac:dpac||'',asOf,rateDate:asOf,rows}; }

/* ---------- DP holdings (depository statement): client code + symbol / ISIN / security name + quantity ---------- */
let ISIN=null;
async function isinMap(){ if(ISIN) return ISIN; try{ ISIN=await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/main/data/isin.json?x='+Math.floor(Date.now()/864e5),{cache:'no-store'}).then(r=>r.json()); }catch(e){ ISIN={i:{},n:{},b:{}}; } ISIN.b=ISIN.b||{}; return ISIN; }
function dp(){ return LS.get('jc_pf_dp',null)||{files:[],H:{}}; }
function removeDP(c){ const D=dp(); syncMark('dp',c==null?Object.keys(D.H):[c]); if(c==null){ LS.set('jc_pf_dp',{files:[],H:{}}); return; } delete D.H[c]; D.files=D.files.map(f=>Object.assign({},f,{clients:f.clients.filter(x=>x!==c)})).filter(f=>f.clients.length); LS.set('jc_pf_dp',D); }
async function importDP(file){
  if(/\.pdf$/i.test(file.name)){ const PL=await pdfLines(await file.arrayBuffer()), P=/Transaction\s*\/\s*Holding|Statement\s+of\s+Holding\s+as\s+on/i.test(PL.map(r=>r.text).join(' '))&&!/BackOffice\s*Code/i.test(PL.map(r=>r.text).join(' '))?parseDPtxn(PL):parseDPpdf(PL), M=await isinMap(), miss=[];
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
function tradeCSV(rows){ return csvOf(['Date','Client Code','Exchange','Scrip Code','Symbol','Series','Product Type','Buy/Sell','Qty','Rate','VAR %','VAR Amount','Source'],rows.slice().sort((a,b)=>a.d.localeCompare(b.d)).map(x=>[x.d,x.c,x.ex||'',x.scode||'',x.sym,x.ser||'',x.prod||'',x.side==='S'?'SELL':'BUY',x.q,x.r,x.varp||'',x.vara||'',x.man?'entered':x.edited?'edited':'file'])); }
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
const BUILD='2026-11-28g';
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
/* ---------- one security, one key: trades and DP holdings are matched by ISIN, not by name ----------
   trade symbol -> current symbol via: links saved for this client book (jc_pf_alias), NSE symbol changes (old -> new),
   and the company name on the DP statement (REMEDIUM -> 'REMEDIUM LIFE-EQ1/-' = INE549S01036, now BSE ticker SUPHA).
   DP holding -> key = NSE symbol of its ISIN, else BSE ticker, else the ISIN itself. */
const aliases=()=>LS.get('jc_pf_alias',{})||{};
function canonSym(s){ s=String(s||'').toUpperCase().trim(); const A=aliases(); if(A[s]&&A[s].to) return A[s].to;
  const M=ISIN&&ISIN.chg; let k=s, n=0; while(M&&M[k]&&n<6){ k=M[k]; n++; } return k; }
function dpKey(x){ const M=ISIN||{}, i=x&&x.isin; return (i&&M.i&&M.i[i])||(i&&M.b&&M.b[i]&&M.b[i][1])||(x&&x.sym)||''; }
const nmKey=s=>String(s||'').toUpperCase().replace(/\b(LIMITED|LTD|EQ|EQUITY|RE|RS|INDIA)\b|[^A-Z0-9]/g,'');
function autoAlias(trades,dpH){ const A=aliases(); let ch=false;
  Object.keys(dpH||{}).forEach(c=>{ const book=[...new Set(trades.filter(t=>t.c===c).map(t=>canonSym(t.sym)))], H=(dpH[c]||[]).map(x=>({x,k:dpKey(x)}));
    const ub=book.filter(s=>!H.some(h=>h.k===s)), ud=H.filter(h=>!book.includes(h.k));
    ub.forEach(s=>{ if(s.length<4||A[s]) return; const hit=ud.filter(h=>{ const n=nmKey(h.x.sec); return n&&(n.startsWith(s)||(s.length>=5&&s.startsWith(n.slice(0,Math.min(n.length,8))))); });
      if(hit.length===1){ A[s]={to:hit[0].k,isin:hit[0].x.isin||'',sec:hit[0].x.sec||'',by:'name on DP statement'}; ch=true; } }); });
  if(ch) LS.set('jc_pf_alias',A); return A; }
function setAlias(from,to,isin,sec){ const A=aliases(); from=String(from).toUpperCase(); if(to) A[from]={to,isin:isin||'',sec:sec||'',by:'linked by you'}; else A[from]={to:'',off:true}; LS.set('jc_pf_alias',A); }
let CA=null;
/* corporate actions: the daily NSE file + actions fetched for BSE-only shares (Yahoo, .BO) kept in jc_pf_ca_x = {SYM:{tk,at,a:[...]}} */
const caExtra=()=>LS.get('jc_pf_ca_x',{})||{};
async function corpActs(force){ if(CA&&!force) return CA; try{ CA=await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/main/data/corpact.json?x='+(force?Date.now():Math.floor(Date.now()/36e5)),{cache:'no-store'}).then(r=>r.json()); }catch(e){ CA={a:[],err:String(e)}; }
  const X=caExtra(), have=new Set(CA.a.map(a=>a.s)); Object.entries(X).forEach(([sym,x])=>{ if(!have.has(sym)) CA.a=CA.a.concat(x.a||[]); }); CA.nX=Object.keys(X).length; return CA; }
/* Yahoo chart events for one ticker: splits (a bonus shows as a split, e.g. bonus 9:5 = 14:5) and dividends */
async function caYahoo(sym,tk){ const u='https://query2.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(tk)+'?period1=1262304000&period2='+Math.floor(Date.now()/1000)+'&interval=1mo&events=split%7Cdiv';
  const j=await fetch(BE+'?action=fetch&url='+encodeURIComponent(u)).then(r=>r.json()), x=j&&j.chart&&j.chart.result&&j.chart.result[0]; if(!x) return null; const ev=x.events||{}, out=[], d=t=>new Date((t+19800)*1000).toISOString().slice(0,10);
  Object.values(ev.splits||{}).forEach(e=>{ const n=+e.numerator, m=+e.denominator; if(!(n>0&&m>0)||n===m) return; const bon=Number.isInteger(n-m)&&n>m&&(n-m)%1===0;
    out.push({s:sym,ex:d(e.date),t:'split',f:n/m,sub:'Bonus / split - '+m+' share'+(m>1?'s':'')+' became '+n+' (BSE)',src:'yahoo'}); });
  Object.values(ev.dividends||{}).forEach(e=>{ if(+e.amount>0) out.push({s:sym,ex:d(e.date),t:'div',amt:+e.amount,sub:'Dividend ₹'+(+e.amount)+' / share (BSE)',src:'yahoo'}); });
  return out.sort((a,b)=>a.ex.localeCompare(b.ex)); }
async function yTicker(q){ try{ const j=await fetch(BE+'?action=fetch&url='+encodeURIComponent('https://query1.finance.yahoo.com/v1/finance/search?q='+encodeURIComponent(q)+'&quotesCount=6&newsCount=0')).then(r=>r.json()); return ((j.quotes||[]).find(x=>/\.BO$/.test(x.symbol))||{}).symbol||null; }catch(e){ return null; } }
/* run: shares held in the DP or traded that the NSE file does not cover (BSE-only) get their actions from Yahoo */
async function caRun(trades,onStep){ await corpActs(true); const nse=new Set((CA.a||[]).filter(a=>!a.src).map(a=>a.s)), H=dp().H||{}, want={};
  Object.values(H).flat().forEach(x=>{ const k=dpKey(x); if(x.nse===false||!nse.has(k)) want[k]=want[k]||{bse:x.bse,sec:x.sec}; });
  (trades||[]).forEach(t=>{ if(/BSE|BOM/i.test(t.ex||'')&&!nse.has(t.sym)) want[t.sym]=want[t.sym]||{}; });
  const X=caExtra(), rep=[]; let i=0;
  for(const [sym,w] of Object.entries(want)){ i++; onStep&&onStep(i,Object.keys(want).length,sym); if(/^IN[A-Z0-9]{10}$/.test(sym)) continue;
    let tk=X[sym]&&X[sym].tk, a=null; for(const t of [tk,sym+'.BO',w.bse?w.bse+'.BO':null].filter(Boolean)){ a=await caYahoo(sym,t).catch(()=>null); if(a){ tk=t; break; } }
    if(!a){ tk=await yTicker(sym)||(w.bse?await yTicker(w.bse):null); if(tk) a=await caYahoo(sym,tk).catch(()=>null); }
    if(a){ X[sym]={tk,at:Date.now(),a}; rep.push({sym,tk,n:a.length,list:a.filter(x=>x.t!=='div').map(x=>dmy(x.ex)+' '+x.sub)}); } else rep.push({sym,tk:null,n:0,list:[],miss:true}); }
  LS.set('jc_pf_ca_x',X); CA=null; await corpActs(); return {nse:(CA.a||[]).filter(a=>!a.src).length,asOf:CA.asOf||'',rep}; }
/* ---------- demergers: parent shareholders get child shares; the parent's cost is split as the company's cost-of-acquisition guidance says.
   r = [child shares, per parent shares]; pct = % of the original cost that goes to the child. Child lots keep the parent's buy dates
   (holding period carries over); fractional entitlements (paid in cash by the company) are left out. Add new demergers here. */
const DEMERGERS=[
  {s:'ITC',ex:'2025-01-06',child:'ITCHOTELS',r:[1,10],pct:13.51,note:'ITC guidance: cost 86.49% ITC / 13.51% ITC Hotels'},
  {s:'TMPV',ex:'2025-10-14',child:'TMCV',r:[1,1],pct:31.15,note:'Tata Motors guidance: cost 68.85% TMPV / 31.15% TMCV'},
  /* Vedanta five-way demerger (record date 1 May 2026, ex 30 Apr; 1 share of EACH new company per 1 VEDL; listed 15 Jun 2026).
     Company filing - cost of acquisition: VEDL 52.34%, VOGL (ex Malco Energy) 21.49%, VEDPOWER (ex Talwandi Sabo) 12.23%, VAML 7.15%, VISL 6.79% */
  {s:'VEDL',ex:'2026-04-30',rec:'2026-05-01',child:'VOGL',r:[1,1],pct:21.49,note:'Vedanta filing: cost 52.34% VEDL / 21.49% VOGL / 12.23% VEDPOWER / 7.15% VAML / 6.79% VISL'},
  {s:'VEDL',ex:'2026-04-30',rec:'2026-05-01',child:'VEDPOWER',r:[1,1],pct:12.23,note:'Vedanta filing: cost 52.34% VEDL / 21.49% VOGL / 12.23% VEDPOWER / 7.15% VAML / 6.79% VISL'},
  {s:'VEDL',ex:'2026-04-30',rec:'2026-05-01',child:'VAML',r:[1,1],pct:7.15,note:'Vedanta filing: cost 52.34% VEDL / 21.49% VOGL / 12.23% VEDPOWER / 7.15% VAML / 6.79% VISL'},
  {s:'VEDL',ex:'2026-04-30',rec:'2026-05-01',child:'VISL',r:[1,1],pct:6.79,note:'Vedanta filing: cost 52.34% VEDL / 21.49% VOGL / 12.23% VEDPOWER / 7.15% VAML / 6.79% VISL'}];
const demergers=A=>{ const seen={}; return DEMERGERS.concat(userDm()).concat((A||[]).filter(a=>a.t==='demerger'&&a.child&&a.r&&a.pct!=null)).filter(d=>{ const k=d.s+'>'+d.child; if(seen[k]) return false; seen[k]=1; return true; }); };   /* one entry per parent > child */
/* demergers NSE lists (subject "Demerger") that have no cost split / ratio recorded yet, on scripts a client traded before the ex-date: they change nothing until recorded */
function dmPending(trades,A){ const have=new Set(demergers(A).map(d=>d.s+'|'+d.ex)), by={}; (trades||[]).forEach(t=>{ (by[canonSym(t.sym)]=by[canonSym(t.sym)]||[]).push(t); });
  return (A||[]).filter(a=>/demerg|scheme of arrangement/i.test(a.sub||'')&&a.t!=='demerger'||(a.t==='demerger'&&!(a.child&&a.r&&a.pct!=null))).filter(a=>!have.has(a.s+'|'+a.ex)&&(a.rec||a.ex)<=todayS()&&(by[a.s]||[]).some(t=>t.d<a.ex)).map(a=>({s:a.s,ex:a.ex,rec:a.rec||'',sub:a.sub,clients:[...new Set((by[a.s]||[]).filter(t=>t.d<a.ex).map(t=>t.c))].sort()})); }
function demergeAdjust(trades,A){ const D=demergers(A).filter(d=>(d.rec||d.ex)<=todayS()); if(!D.length) return trades;   /* a demerger not yet effective changes nothing */ let T=trades;
  const cum={};   /* a parent with several children (Vedanta -> 4): each child's % is of the ORIGINAL cost, but the parent rate is already cut by the earlier children, so use pct / (100 - already given away) */
  D.slice().sort((x,y)=>x.ex.localeCompare(y.ex)).forEach(dm0=>{ const ck=dm0.s+'|'+dm0.ex, given=cum[ck]||0, dm=Object.assign({},dm0,{pct:dm0.pct/(100-given)*100}); cum[ck]=given+dm0.pct; const out=[], byC={};
    T.forEach(t=>{ if(t.sym===dm.s&&t.d<dm.ex) (byC[t.c]=byC[t.c]||[]).push(t); });
    const repl=new Map();
    Object.entries(byC).forEach(([c,L])=>{ L=L.slice().sort((a,b)=>a.d.localeCompare(b.d)||(a.side==='S'?1:-1)); const lots=[];
      L.forEach(t=>{ if(t.side!=='S'){ lots.push({t,rem:t.q}); return; } let q=t.q; for(const l of lots){ if(q<=0) break; const m=Math.min(q,l.rem); l.rem-=m; q-=m; } });   /* FIFO up to the ex-date */
      const held=lots.reduce((a,l)=>a+l.rem,0), entitled=Math.floor(held*dm.r[0]/dm.r[1]+1e-9), k=dm.pct/100; if(held<=0||entitled<1) return;   /* no whole child share (e.g. 2 ITC -> 0.2 ITC Hotels): the cost stays with the parent */
      lots.filter(l=>l.rem>0).forEach(l=>{ const t=l.t, sold=t.q-l.rem, pieces=[];
        if(sold>0) pieces.push(Object.assign({},t,{q:sold,id:t.id+'#s'}));   /* sold before the ex-date: full cost */
        pieces.push(Object.assign({},t,{q:l.rem,r:t.r*(1-k),id:t.id+'#p',dm:dm.child,dms:(t.dms||[]).concat(dm.child),dmNote:dm.note}));
        const cq=entitled*l.rem/held;   /* child shares from this lot (whole-number total) */
        if(cq>0) pieces.push(Object.assign({},t,{sym:dm.child,q:cq,r:t.r*k*l.rem/cq,id:t.id+'#c',dmFrom:dm.s,dmNote:dm.note}));
        repl.set(t,pieces); }); });
    T.forEach(t=>{ if(repl.has(t)) out.push(...repl.get(t)); else out.push(t); }); T=out; });
  return T; }
/* ---------- 🆕 listing record (IPO allotments and demerged companies): the first trading day on NSE (else BSE) from Yahoo,
   kept for good in jc_pf_list = {SYM:{ld,o,h,l,c,tk,at,after:[{d,c}...]}} (saved with the portfolio on Drive) ---------- */
const listings=()=>LS.get('jc_pf_list',{})||{};
async function listInfo(sym,from,force){ const L=listings(); if(L[sym]&&!force) return L[sym]; if(!from) return null;   /* needs a date to look from */ const f=Math.floor(Date.parse((from||'2000-01-01')+'T00:00:00Z')/1000)-7*86400;
  for(let att=0;att<3;att++){ if(att) await new Promise(r=>setTimeout(r,2500*att));   /* the backend is busy while live prices load: retry */
  for(const tk of [sym+'.NS',sym+'.BO']){ try{ const u='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(tk)+'?period1='+Math.max(0,f)+'&period2='+(f+75*86400)+'&interval=1d';
      const j=await fetch(BE+'?action=fetch&url='+encodeURIComponent(u)).then(r=>r.json()), x=j&&j.chart&&j.chart.result&&j.chart.result[0], q=x&&x.indicators&&x.indicators.quote&&x.indicators.quote[0]; if(!x||!q||!x.timestamp) continue;
      const D=x.timestamp.map((t,i)=>({d:new Date((t+19800)*1000).toISOString().slice(0,10),o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i],v:q.volume[i]})).filter(b=>b.o>0&&b.c>0&&(!from||b.d>=from));
      if(!D.length) continue; const b=D[0], r=v=>Math.round(v*100)/100;
      L[sym]={ld:b.d,o:r(b.o),h:r(b.h),l:r(b.l),c:r(b.c),v:b.v||0,tk,at:Date.now(),w1:D[4]?r(D[4].c):null,m1:D[20]?r(D[20].c):null}; LS.set('jc_pf_list',L); return L[sym]; }catch(e){} } }
  return null; }
/* NSE past issues (data/ipo.json, refreshed daily): every IPO since 2010 - issue price, issue dates, listing date */
let IPOD=null;
async function ipoData(force){ if(IPOD&&!force) return IPOD; try{ const j=await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/main/data/ipo.json?x='+Math.floor(Date.now()/36e5),{cache:'no-store'}).then(r=>r.json()); IPOD={asOf:j.asOf,by:{}}; (j.a||[]).filter(r=>!/DEBT|INVIT|REIT/i.test(r.sec||'')).forEach(r=>{ IPOD.by[r.s]=r; const k=canonSym(r.s); if(k&&k!==r.s&&!IPOD.by[k]) IPOD.by[k]=Object.assign({},r,{s:k,was:r.s}); }); }   /* renamed later (ZOMATO -> ETERNAL): found under both names */catch(e){ IPOD={by:{},err:String(e)}; } return IPOD; }
/* IPO details from NSE (data/ipo_det.json, daily): retail / employee discount, lot, max retail amount, issue size, subscription by category */
let IPOX=null;
async function ipoDet(force){ if(IPOX&&!force) return IPOX; try{ const j=await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/main/data/ipo_det.json?x='+Math.floor(Date.now()/36e5),{cache:'no-store'}).then(r=>r.json()); IPOX={asOf:j.asOf||'',d:j.d||{}}; }catch(e){ IPOX={asOf:'',d:{},err:String(e)}; } return IPOX; }
const ipoDetOf=sym=>{ const r=((IPOX&&IPOX.d)||{})[sym]; return r&&!r.nf?r:null; };
const ipoUniq=()=>{ const seen=new Set(), L=[]; Object.values((IPOD&&IPOD.by)||{}).forEach(r=>{ if(r.sme||(r.sec&&!/equity/i.test(r.sec))) return;   /* equity shares (main board) only for now - no SME, debt or trusts */
    const k=(r.was||r.s)+'|'+(r.n||''); if(seen.has(k)) return; seen.add(k); L.push(r); }); return L; };
/* search by symbol (old or new) or company name: exact symbol first, then symbol starts / contains, then company name; newest first within a rank */
function ipoFind(q){ q=String(q||'').trim().toUpperCase(); if(!q) return []; const out=[];
  ipoUniq().forEach(r=>{ const s=String(r.s||'').toUpperCase(), w=String(r.was||'').toUpperCase(), n=String(r.n||'').toUpperCase();
    const k=(s===q||w===q)?0:(s.startsWith(q)||w.startsWith(q))?1:(s.includes(q)||w.includes(q))?2:n.startsWith(q)?3:n.includes(q)?4:9; if(k<9) out.push([k,r]); });
  return out.sort((a,b)=>a[0]-b[0]||String(b[1].ld||b[1].cl||'').localeCompare(String(a[1].ld||a[1].cl||''))).slice(0,12).map(x=>x[1]); }
/* every script your clients hold (DP) or traded that came to the market by an IPO: the IPO record + per client how it was got */
function ipoScripts(trades,dpH){ const D=IPOD&&IPOD.by||{}, T=trades||tb().trades, out={};
  T.forEach(t=>{ const k=canonSym(t.sym); if(!D[k]) return; const o=out[k]=out[k]||{s:k,ipo:D[k],cl:{}}; const c=o.cl[t.c]=o.cl[t.c]||{c:t.c,buys:[],sells:[],dp:0}; (t.side==='S'?c.sells:c.buys).push(t); });
  Object.entries(dpH||{}).forEach(([c,L])=>(L||[]).forEach(x=>{ const k=dpKey(x); if(!D[k]) return; const o=out[k]=out[k]||{s:k,ipo:D[k],cl:{}}; const cc=o.cl[c]=o.cl[c]||{c,buys:[],sells:[],dp:0}; cc.dp+=+x.q||0; }));
  return Object.values(out).map(o=>{ o.clients=Object.values(o.cl).map(c=>{ c.buys.sort((a,b)=>a.d.localeCompare(b.d)); const bq=c.buys.reduce((a,t)=>a+t.q,0), sq=c.sells.reduce((a,t)=>a+t.q,0), bv=c.buys.reduce((a,t)=>a+t.q*t.r,0);
      const f=c.buys[0]; c.how=!f?(c.dp?'in DP, no buy in the trade book':'–'):(f.tag==='IPO'||(o.ipo.ld&&f.d<o.ipo.ld))?'IPO allotment':'bought on the market'; c.first=f||null; c.bq=bq; c.sq=sq; c.avg=bq?bv/bq:null; c.held=Math.max(0,bq-sq); return c; });
    return o; }).sort((a,b)=>(b.ipo.ld||'').localeCompare(a.ipo.ld||'')); }
/* IPO allotments in the trade book, client-wise, with the listing record */
function ipoRows(trades){ const L=listings(); return (trades||tb().trades).filter(t=>t.tag==='IPO').map(t=>{ const sold=(trades||tb().trades).filter(y=>y.c===t.c&&y.sym===t.sym&&y.side==='S'&&y.d>=t.d).sort((a,b)=>a.d.localeCompare(b.d));
  return {t,li:L[t.sym]||null,sold}; }).sort((a,b)=>b.t.d.localeCompare(a.t.d)); }
/* demergers you record (future ones) are kept in jc_pf_dm and work exactly like the built-in ones */
const userDm=()=>LS.get('jc_pf_dm',[])||[];
function addDemerger(o){ const L=userDm().filter(x=>!(x.s===o.s&&x.child===o.child)); if(!o.del) L.push({s:String(o.s).toUpperCase(),child:String(o.child).toUpperCase(),ex:o.ex,r:[+o.r[0],+o.r[1]],pct:+o.pct,note:o.note||'',rec:o.rec||'',user:true}); LS.set('jc_pf_dm',L); return L; }
/* full record of every demerger: built-in + yours + the NSE file; per client: parent held on the ex-date, child shares received, cost
   carried over, every later trade in the child, shares still held */
function dmRecords(trades,A){ const all=DEMERGERS.concat(userDm()).concat((A||(CA&&CA.a)||[]).filter(a=>a.t==='demerger'&&a.child&&a.r&&a.pct!=null)), seen={}, out=[];
  const T=trades||tb().trades, adj=demergeAdjust(T.map(t=>Object.assign({},t,{sym:canonSym(t.sym)})),A), L=listings();
  all.forEach(dm=>{ const k=dm.s+'>'+dm.child; if(seen[k]) return; seen[k]=1; const cl={};
    adj.filter(p=>p.dmFrom===dm.s&&p.sym===dm.child).forEach(p=>{ const c=cl[p.c]=cl[p.c]||{c:p.c,got:0,cost:0,par:0,parCost:0,later:[]}; c.got+=p.q; c.cost+=p.q*p.r; });
    adj.filter(p=>(p.dms||[p.dm]).includes(dm.child)&&p.sym===dm.s).forEach(p=>{ const c=cl[p.c]=cl[p.c]||{c:p.c,got:0,cost:0,par:0,parCost:0,later:[]}; c.par+=p.q; c.parCost+=p.q*p.r; });
    T.filter(t=>canonSym(t.sym)===dm.child&&t.d>=dm.ex).forEach(t=>{ const c=cl[t.c]=cl[t.c]||{c:t.c,got:0,cost:0,par:0,parCost:0,later:[]}; c.later.push(t); });
    Object.values(cl).forEach(c=>{ c.later.sort((a,b)=>a.d.localeCompare(b.d)); c.bought=c.later.filter(t=>t.side!=='S').reduce((a,t)=>a+t.q,0); c.sold=c.later.filter(t=>t.side==='S').reduce((a,t)=>a+t.q,0); c.now=Math.round((c.got+c.bought-c.sold)*1e4)/1e4; });
    out.push({dm,li:L[dm.child]||null,clients:Object.values(cl).sort((a,b)=>a.c.localeCompare(b.c))}); });
  return out.sort((a,b)=>b.dm.ex.localeCompare(a.dm.ex)); }
function caFactor(a){ if(a.f&&a.f>0) return a.f; return a.t==='bonus'&&a.r&&a.r[1]?(a.r[0]+a.r[1])/a.r[1]:a.t==='split'&&a.fv&&a.fv[1]?a.fv[0]/a.fv[1]:1; }
function caAdjust(trades,A){ trades=trades.map(t=>{ const k=canonSym(t.sym); return k===t.sym?t:Object.assign({},t,{sym:k,sym0:t.sym}); }); const S=(A||(CA&&CA.a)||[]).filter(a=>(a.t==='bonus'||a.t==='split')&&caFactor(a)!==1&&(a.rec||a.ex)<=todayS());   /* a split / bonus changes the book only once its RECORD date has been reached (holding as on the record date) - before that nothing moves */ if(!S.length) return demergeAdjust(trades,A||(CA&&CA.a));
  const by={}; S.forEach(a=>(by[a.s]=by[a.s]||[]).push(a));
  /* LOT-WISE: only the shares still held AT the record date get the factor. A buy lot (or the part of it) that was sold on or before the record
     date stays in its original quantity / rate - the split or bonus never touches it - so a position closed before the record date shows no
     corporate action at all. A trade is first cut into its intraday part (same-day offset, never held) and its delivery part, as compute() does. */
  const P=trades.map(t=>[t]), K={};
  trades.forEach((t,i)=>{ if(by[t.sym]) (K[t.c+'|'+t.sym]=K[t.c+'|'+t.sym]||[]).push(i); });
  Object.keys(K).forEach(k=>{ const idx=K[k], dayG={};
    idx.forEach(i=>{ const t=trades[i], g=dayG[t.d]=dayG[t.d]||{B:[],S:[]}; g[t.side==='S'?'S':'B'].push(i); });
    Object.values(dayG).forEach(g=>{ const bq=g.B.reduce((a,i)=>a+trades[i].q,0), sq=g.S.reduce((a,i)=>a+trades[i].q,0); let iq={B:Math.min(bq,sq),S:Math.min(bq,sq)};
      ['B','S'].forEach(sd=>g[sd].forEach(i=>{ const t=trades[i], qi=Math.min(t.q,iq[sd]); iq[sd]-=qi; const o=[]; if(qi>0) o.push(Object.assign({},t,{q:qi,_ty:'I'})); if(t.q-qi>1e-9) o.push(Object.assign({},t,{q:t.q-qi,_ty:'D'})); P[i]=o.length?o:[Object.assign({},t,{_ty:'D'})]; })); });
    (by[trades[idx[0]].sym]||[]).slice().sort((a,b)=>a.ex.localeCompare(b.ex)).forEach(a=>{ const R=a.rec||a.ex, f=caFactor(a), ev=[];
      idx.forEach(i=>P[i].forEach(p=>{ if(p._ty==='D') ev.push({p,o:i}); }));
      ev.sort((x,y)=>x.p.d.localeCompare(y.p.d)||(x.p.side==='S'?1:0)-(y.p.side==='S'?1:0)||x.o-y.o);
      const lots=[]; ev.forEach(e=>{ const p=e.p; if(p.d>R) return;
        if(p.side!=='S'){ const L={p,rem:p.d<a.ex?p.q:0}; lots.push(L); e.L=L; return; }
        let q=p.q; for(let j=0;j<lots.length&&q>1e-9;j++){ const L=lots[j]; if(L.rem>1e-9){ const m=Math.min(q,L.rem); L.rem-=m; q-=m; } } });
      idx.forEach(i=>{ const o=[]; P[i].forEach(p=>{ const e=ev.find(x=>x.p===p), L=e&&e.L;
        if(!L||p.side==='S'||L.rem<=1e-9){ o.push(p); return; }
        const held=L.rem, sold=p.q-held; if(sold>1e-9) o.push(Object.assign({},p,{q:sold}));
        o.push(Object.assign({},p,{q:held*f,r:p.r/f,adj:(p.adj||1)*f,q0:p.q0||held,r0:p.r0||p.r})); }); P[i]=o; }); }); });
  return demergeAdjust([].concat(...P.map((o,i)=>by[trades[i].sym]&&K[trades[i].c+'|'+trades[i].sym]?o.map(p=>{ const c=Object.assign({},p); delete c._ty; return c; }):o)),A); }
/* client-wise entitlement rows for every action on a script the client traded or holds in DP */
function caRows(trades,dpH,A){ A=A||(CA&&CA.a)||[]; const out=[], today=todayS(), bySym={};
  const DM=demergers(A).map(d=>Object.assign({t:'demerger',sub:'Demerger - '+d.r[0]+' '+d.child+' per '+d.r[1]+' '+d.s+' ('+d.note.replace(/^.*?cost /,'cost ')+')'},d));
  A=A.filter(a=>!(a.t==='other'&&/demerg/i.test(a.sub||'')&&DM.some(d=>d.s===a.s&&d.ex===a.ex))).concat(DM);
  A.forEach(a=>(bySym[a.s]=bySym[a.s]||[]).push(a));
  const pos={}; trades.forEach(t=>{ const s=canonSym(t.sym); (pos[t.c+'|'+s]=pos[t.c+'|'+s]||[]).push(t); });
  const keys=new Set(Object.keys(pos)); Object.keys(dpH||{}).forEach(c=>(dpH[c]||[]).forEach(x=>keys.add(c+'|'+dpKey(x))));
  keys.forEach(k=>{ const [c,sym]=k.split('|'), L=bySym[sym]; if(!L) return; const T=(pos[k]||[]).slice().sort((a,b)=>a.d.localeCompare(b.d)), dq=((dpH||{})[c]||[]).filter(x=>dpKey(x)===sym).reduce((a,x)=>a+x.q,0);
    L.forEach(a=>{ let q=0, basis='trade book'; T.forEach(t=>{ if(t.side==='S'?t.d<=(a.rec||a.ex):t.d<a.ex) q+=(t.side==='S'?-1:1)*t.q; });   /* holding as on the record date: whatever was sold up to and on that day is not counted; a buy on the ex / record day is not entitled */
      /* bonus / split before this action restate the quantity */
      L.filter(b=>b!==a&&(b.t==='bonus'||b.t==='split')&&b.ex<a.ex).forEach(b=>{ if(T.some(t=>t.d<b.ex)) q*=caFactor(b); });
      if(!T.length&&dq>0){ q=dq; if((a.rec||a.ex)<=today) L.filter(b=>(b.t==='bonus'||b.t==='split')&&b.ex>=a.ex&&b.ex<=today).forEach(b=>{ q/=caFactor(b); }); basis=(a.rec||a.ex)>today?'DP holding':'DP holding (worked back, no trades)'; if(Math.abs(q-Math.round(q))>1e-6) return; }   /* a fraction = the shares came after this action */ else if((a.rec||a.ex)>today&&dq>0&&Math.abs(dq-q)>0.0001){ basis='trade book (DP now '+dq+')'; }
      q=Math.round(q*1e4)/1e4; if(q<=0) return;
      const f=caFactor(a); out.push({c,sym,a,q,basis,up:(a.rec||a.ex)>today,div:a.t==='div'&&a.amt?q*a.amt:0,newSh:a.t==='bonus'?q*(f-1):a.t==='demerger'?Math.floor(q*a.r[0]/a.r[1]+1e-9):0,child:a.child||'',newQ:(a.t==='bonus'||a.t==='split')?q*f:null}); }); });
  return out.sort((x,y)=>(y.up-x.up)||(x.up?x.a.ex.localeCompare(y.a.ex):y.a.ex.localeCompare(x.a.ex))||x.c.localeCompare(y.c)); }
/* ---------- ledger bills vs trade book: one bill per trade date (narration '... (dd/mm/yy)'); the gap is brokerage + GST,
   so the client's real brokerage rate comes out of the ledger, and any day that does not agree is flagged ---------- */
function ledgerRecon(c,trades,ST,RX){ ST=ST||stat(); const L=(led().E||{})[c]; const T=trades.filter(t=>t.c===c); if(!L||!L.length||!T.length) return null;
  const E=compute(caAdjust(T),ST,()=>({bd:0,bi:0,dp:0})), g={};
  E.parts.forEach(p=>{ const x=g[p.d]=g[p.d]||{d:p.d,net:0,stat:0,tD:0,tI:0,n:0,man:0,ex:{}}; x.ex[exOfP(p)]=1; x.net+=(p.side==='S'?-1:1)*p.v; x.stat+=p.chg; x.statOff=(x.statOff||0)+p.chgOff; x[p.type==='I'?'tI':'tD']+=p.v; x.n++; if(p.man||p.edited) x.man++; });
  const bills={}, other=[]; L.forEach(e=>{ if(e.k!=='bill') return; const m=String(e.n||'').match(/\((\d\d)\/(\d\d)\/(\d\d)\)/); if(!m){ other.push(e); return; } const d='20'+m[3]+'-'+m[2]+'-'+m[1]; bills[d]=(bills[d]||0)+e.dr-e.cr; });
  const gst=1+ST.gst/100, med=a=>{ a=a.filter(x=>isFinite(x)).sort((x,y)=>x-y); return a.length?a[Math.floor(a.length/2)]:null; };
  const days=Object.values(g).filter(x=>bills[x.d]!=null&&!x.man).map(x=>Object.assign(x,{bill:bills[x.d],brk:(bills[x.d]-x.net-x.stat)/gst}));
  let bd=med(days.filter(x=>!x.tI&&x.tD>0).map(x=>x.brk/x.tD*100)); bd=bd==null?null:Math.round(bd*100)/100;
  let bi=med(days.filter(x=>x.tI>0).map(x=>(x.brk-(bd||0)/100*x.tD)/x.tI*100)); bi=bi==null?null:Math.round(Math.max(0,bi)*1000)/1000;
  /* minimum per order: days with a single order whose bill shows more brokerage than the % rate gives */
  const mins=days.filter(x=>Object.keys(x.ex).length===1).map(x=>({imp:x.brk,rate:((bd||0)*x.tD+(bi||0)*x.tI)/100})).filter(o=>o.imp>=o.rate*1.3+2).map(o=>o.imp);   /* single-exchange days only: one contract note */
  /* the minimum is the value most of those orders agree on (within Rs 2); fewer than 3 agreeing -> no minimum */
  let bmin=0, sup=0; mins.forEach(m=>{ const n=mins.filter(x=>Math.abs(x-m)<=2).length; if(n>sup){ sup=n; bmin=Math.round(med(mins.filter(x=>Math.abs(x-m)<=2))); } }); if(sup<3) bmin=0;
  /* the client's own setting on the Rates screen wins over what the ledger suggests */
  const RS=RX||rates(), Uat=d=>{ const own=Object.assign({},RS._def||{},rateAt(RS[c],d)); return {bd:own.bd>0?+own.bd:bd, bi:own.bi>0?+own.bi:bi, bmin:own.bmin>0?+own.bmin:bmin, bdc:+own.bdc||0, bic:+own.bic||0, bminFrom:own.bminFrom||'', own:own.bd>0||own.bi>0||own.bmin>0}; }, U=Uat();
  const ordBrk=d=>{ const U=Uat(d), by={}; E.parts.filter(p=>p.d===d).forEach(p=>{ const e=exOfP(p), o=by[e]=by[e]||{ch:0,card:0}, D=p.type==='D';
      o.ch+=p.v*(D?(U.bd||0):(U.bi||0))/100; o.card+=p.v*(D?(U.bdc||U.bd||0):(U.bic||U.bi||0))/100; });
    const mn=U.bminFrom&&d<U.bminFrom?0:(U.bmin||0); return Object.values(by).reduce((a,o)=>a+o.ch+Math.max(0,mn-o.card),0); };   /* per exchange note: charged % + shortfall of card-rate brokerage below the minimum */   /* one contract note per exchange per day, each with the minimum */
  const CV=ledCover(c), TF=T.filter(t=>!t.man), T0=(TF.length?TF:T).map(t=>t.d).sort()[0], T1=(TF.length?TF:T).map(t=>t.d).sort().slice(-1)[0];
  const rows=[...new Set([...Object.keys(g),...Object.keys(bills)])].sort().map(d=>{ const x=g[d]||{d,net:0,stat:0,tD:0,tI:0,n:0}, b=bills[d];
    if(!x.n&&(d<T0||d>T1)) return {d,bill:b,net:0,stat:0,brk:0,exp:0,diff:b,n:0,ok:null,out:true,kind:'bill',why:'outside the trade files ('+dmy(T0)+' to '+dmy(T1)+')'};
    if(x.n&&x.man===x.n&&(d<T0||d>T1)) return {d,bill:b==null?null:b,net:x.net,stat:x.stat,brk:0,exp:null,diff:null,n:x.n,ok:null,out:true,kind:'manual',why:'only your hand entries on this day - the trade file of '+fyOf(d)+' is not uploaded (trade files cover '+dmy(T0)+' to '+dmy(T1)+'), so the bill cannot be checked'};
    if(x.n&&b==null&&CV.length&&!inCover(CV,d)) return {d,bill:null,net:x.net,stat:x.stat,brk:0,exp:null,diff:null,n:x.n,ok:null,out:true,kind:'trade',why:'outside the ledger file'+(CV.length>1?'s':'')+' ('+CV.map(r=>dmy(r[0])+' to '+dmy(r[1])).join(', ')+') - upload the ledger for '+fyOf(d)};
    const bk=x.n?ordBrk(d):0, exp=x.net+x.stat+bk*gst, diff=b==null?null:b-exp, tol=Math.max(5,0.0006*(x.tD+x.tI));
    if(b==null&&x.n&&x.man===x.n) return {d,bill:null,net:x.net,stat:x.stat,brk:0,exp:null,diff:null,n:x.n,ok:true,why:'entered by you (IPO allotment / off-market) - no exchange bill expected'};
    return {d,bill:b==null?null:b,net:x.net,stat:x.stat,statOff:x.statOff||0,brk:bk*gst,exp,expOff:x.net+(x.statOff||0)+bk*gst,diff,n:x.n,tD:x.tD,tI:x.tI,man:x.man,ok:b!=null&&x.n>0&&Math.abs(diff)<=tol,why:b==null?'trades but no bill in the ledger':!x.n?'bill but no trades in the trade book':Math.abs(diff)<=tol?'':'amount differs'}; });
  const IN=rows.filter(r=>!r.out); return {c,bd,bi,bmin,used:U,nMin:bmin?sup:0,rows:IN,outRows:rows.filter(r=>r.out),T0,T1,nDel:days.filter(x=>!x.tI).length,nInt:days.filter(x=>x.tI).length,bad:IN.filter(r=>!r.ok).length}; }
/* ---------- broker's listings (Excel): Brokerage Listing (Cash Segment) and DP Scheme. Only client codes and rates are read - names are skipped.
   Brokerage: Delivery % (+ min Rs/share), Trading 1st / 2nd side %, T2T; the Rs minimum per exchange per day (bmin, default 50) is added.
   DP: AMC, transaction charge per sell (ISIN + day) and pledge charge, all without GST (GST is added in compute).
   from = effective date; 'auto' = fit each client's past contract-note bills: either the listing % is what was charged, or (older
   accounts) a lower % was charged and the minimum was topped up against the listing % - the better fit is kept, with the listing % as
   the charged rate from the day after the last bill. */
async function readListing(file){ await xlsxLib(); const wb=XLSX.read(await file.arrayBuffer(),{type:'array'}), ws=wb.Sheets[wb.SheetNames[0]], A=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:''});
  const hi=A.findIndex(r=>r.some(x=>/^code$/i.test(String(x).trim()))); if(hi<0) throw new Error('No "Code" header row in '+file.name); const H=A[hi].map(x=>String(x).trim().toLowerCase());
  const num=x=>{ const v=parseFloat(String(x).replace(/[^\d.\-]/g,'')); return isFinite(v)?v:null; }, code=x=>String(x).replace(/^'/,'').trim().toUpperCase(), out={};
  if(H.includes('amc')||H.some(h=>/trnx/.test(h))){ const iR=H.findIndex(h=>/inter ref/.test(h)), iA=H.indexOf('amc'), iT=H.findIndex(h=>/trnx/.test(h)), iP=H.indexOf('pledge'), iS=H.indexOf('scheme');
    A.slice(hi+1).forEach(r=>{ const c=code(r[iR]); if(!/^[A-Z0-9]{4,12}$/.test(c)) return; const o={scheme:String(r[iS]||'').trim()}; const t=num(r[iT]), a=num(r[iA]), g=num(r[iP]); if(t!=null) o.dp=t; if(a!=null) o.amc=a; if(g!=null) o.pledge=g; out[c]=o; });
    return {kind:'dp',rows:out}; }
  /* brokerage: two header rows - group names above (Delivery / Trading 1st Side / Trading 2nd Side / T2T), Min / Percent below */
  const G=(A[hi-1]||[]).map(x=>String(x).trim().toLowerCase()); let grp=''; const col={}; H.forEach((h,i)=>{ if(G[i]) grp=G[i]; if(/^min/.test(h)||/percent|%/.test(h)) col[grp+'|'+(/^min/.test(h)?'min':'pct')]=i; });
  const gk=re=>Object.keys(col).find(k=>re.test(k.split('|')[0])), pick=(r,re,t)=>{ const k=Object.keys(col).find(x=>re.test(x.split('|')[0])&&x.endsWith('|'+t)); return k?num(r[col[k]]):null; };
  A.slice(hi+1).forEach(r=>{ const c=code(r[H.indexOf('code')]); if(!/^[A-Z0-9]{4,12}$/.test(c)) return; const bd=pick(r,/deliver/,'pct'); if(bd==null) return;
    out[c]={bd,dmin:pick(r,/deliver/,'min'),bi:pick(r,/1st/,'pct'),imin:pick(r,/1st/,'min'),bi2:pick(r,/2nd/,'pct'),bt:pick(r,/t2t/,'pct'),scheme:String(r[H.indexOf('scheme')]||'').trim()}; });
  return {kind:'brk',rows:out}; }
const dayAfter=d=>{ const x=new Date(d+'T00:00:00Z'); x.setUTCDate(x.getUTCDate()+1); return x.toISOString().slice(0,10); };
/* listing rate (base: bd, bi, bmin, ...) fitted to a client's bills: (A) the listing % is charged, or (B) a lower % (read from the bills)
   was charged with the minimum topped up against the listing %, from the best start date of the minimum, and the listing % from the day
   after the last bill; the better fit wins */
function fitBrk(c,trades,RS,base){ const T=(trades||[]).filter(t=>t.c===c), bmin=base.bmin;
  const tryR=hist=>{ const X=JSON.parse(JSON.stringify(RS)); X[c]=Object.assign({},RS[c]||{}); X[c].hist=(X[c].hist||[]).filter(h=>h.kind!=='brk').concat(hist); const q=T.length?ledgerRecon(c,trades,null,X):null; return q?{ok:q.rows.length-q.bad,n:q.rows.length,q}:{ok:0,n:0}; };
  const A0=[Object.assign({from:'2000-01-01'},base)], sA=tryR(A0); let best={h:A0,s:sA,how:'listing % charged'};
  const q0=sA.q, billDays=q0?q0.rows.filter(x=>x.bill!=null&&x.n).map(x=>x.d):[];
  if(q0&&q0.bd!=null&&q0.bd<base.bd*0.7&&billDays.length){ const last=billDays[billDays.length-1];
    for(const mf of ['',...billDays]){ const H=[Object.assign({},base,{from:'2000-01-01',bd:q0.bd,bi:q0.bi!=null?q0.bi:base.bi,bdc:base.bd,bic:base.bi,bminFrom:mf}),Object.assign({},base,{from:dayAfter(last)})], sB=tryR(H);
      if(sB.ok>best.s.ok) best={h:H,s:sB,how:'charged '+q0.bd+'% / '+(q0.bi!=null?q0.bi:base.bi)+'% with the ₹'+bmin+' minimum topped up against the listing %'+(mf?' from '+dmy(mf):'')+'; listing % from '+dmy(dayAfter(last))}; } }
  return best; }
function applyListing(L,from,trades,bmin){ const RS=rates(), rep=[]; bmin=bmin==null?50:+bmin;
  const put=(c,e)=>{ const X=RS[c]=RS[c]||{}; X.hist=(X.hist||[]).filter(h=>!(h.from===e.from&&h.kind===e.kind)); X.hist.push(e); X.hist.sort((a,b)=>a.from.localeCompare(b.from)); delete X.src; };
  Object.entries(L.rows).forEach(([c,r])=>{
    if(L.kind==='dp'){ if(r.dp==null&&r.amc==null) { rep.push({c,note:'DP scheme '+r.scheme+' - no charges listed, left as is'}); return; }
      put(c,Object.assign({from:from==='auto'?'2000-01-01':from,kind:'dp'},r)); rep.push({c,note:'DP '+r.scheme+': txn ₹'+r.dp+' + GST, AMC ₹'+r.amc+', pledge ₹'+r.pledge}); return; }
    const base={kind:'brk',bd:r.bd,bi:r.bi,bmin,bdc:0,bic:0,bminFrom:'',dmin:r.dmin,imin:r.imin,scheme:r.scheme};
    if(from!=='auto'){ put(c,Object.assign({from},base)); rep.push({c,note:'from '+dmy(from)+': '+r.bd+'% / '+r.bi+'%, min ₹'+bmin}); return; }
    /* auto: fit the client's own bills */
    const best=fitBrk(c,trades,RS,base); RS[c]=RS[c]||{}; RS[c].hist=(RS[c].hist||[]).filter(h=>h.kind!=='brk'); best.h.forEach(e=>put(c,e)); rep.push({c,note:best.how,fit:best.s.n?best.s.ok+'/'+best.s.n+' bill days match':'no bills to check'}); });
  LS.set('jc_pf_rates',RS); return rep; }
/* ---------- charges reconciliation: every bill that does not agree gets a reason, and rate differences are fixed ----------
   reasons: no trades for a bill day / no bill for a trade day / bill far from trades + charges (missing, extra or wrongly dated trades -
   the trade on a nearby day whose value explains it is named) / brokerage on the bill differs from the master rate (rate changed, minimum
   applied or not). Fix: for each run of consecutive rate differences the charged rate is worked out from those bills and tried as a dated
   rate change (with the old rate restored after the run); it is kept only if more bills agree and none that agreed stops agreeing. */
function reconWhy(c,trades,r){ const gst=1+stat().gst/100, T=trades.filter(t=>t.c===c), out=[];
  (r.rows||[]).forEach((x,i)=>{ if(x.ok) return; const t=(x.tD||0)+(x.tI||0);
    if(x.bill==null){ out.push({d:x.d,type:'nobill',why:'Trades of '+fmt(t)+' but no bill in the ledger - the ledger file may not cover this date, or these trades belong to another day or client'}); return; }
    if(!x.n){ out.push({d:x.d,type:'notrades',why:'Bill of '+fmt(Math.abs(x.bill))+' but no trades in the trade book - this day\'s trades are missing: upload the trade file / contract note of '+dmy(x.d)}); return; }
    const imp=(x.bill-x.net-x.stat)/gst;
    if(imp<-1||imp>Math.max(60,0.03*t)){ const cand=T.filter(q=>q.d!==x.d&&Math.abs(days(q.d,x.d))<=4).slice(0,14), want=Math.abs(x.diff), tol=Math.max(10,0.01*want); let near=[];
      /* one, two or three trades dated a few days away whose value explains the gap */
      for(let i=0;i<cand.length&&!near.length;i++){ const a=cand[i].q*cand[i].r; if(Math.abs(a-want)<=tol){ near=[cand[i]]; break; }
        for(let j=i+1;j<cand.length&&!near.length;j++){ const b=a+cand[j].q*cand[j].r; if(Math.abs(b-want)<=tol){ near=[cand[i],cand[j]]; break; }
          for(let k=j+1;k<cand.length;k++){ if(Math.abs(b+cand[k].q*cand[k].r-want)<=tol){ near=[cand[i],cand[j],cand[k]]; break; } } } }
      out.push({d:x.d,type:'trades',why:'Bill is '+fmt(Math.abs(x.diff))+(x.diff>0?' more':' less')+' than trades + charges - not a brokerage difference: '+(near.length?(near.length>1?'the trades ':'the trade ')+near.map(q=>q.sym+' '+(q.side==='S'?'sell':'buy')+' '+q.q+' @ '+q.r+' dated '+dmy(q.d)).join(' + ')+' may belong to this day (date entered wrong)':'trades '+(x.diff>0?'missing':'extra / wrong quantity')+' on this day - check the contract note')}); return; }
    const mb=x.brk/gst; out.push({d:x.d,type:'rate',why:'Brokerage on the bill '+fmt(imp)+(t?' ('+(imp/t*100).toFixed(3)+'%)':'')+' vs master '+fmt(mb)+(t?' ('+(mb/t*100).toFixed(3)+'%)':'')+' - '+(imp<mb?'charged less':'charged more')+' than the master rate'}); });
  return out; }
const fmt=v=>'₹'+(+v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
function reconFix(c,trades,apply){ const RS=JSON.parse(JSON.stringify(rates())), gst=1+stat().gst/100, fixes=[]; RS[c]=RS[c]||{};
  const run=X=>ledgerRecon(c,trades,null,X), okSet=q=>new Set(q.rows.filter(x=>x.ok).map(x=>x.d)), tried=new Set();
  /* 1) the listing rate fitted over the whole bill history (charged % vs minimum checked at the listing %) */
  { const q=run(RS), L=[...((RS[c].hist)||[])].reverse().find(h=>h.kind==='brk'&&h.src!=='bills');
    if(q&&q.bad&&L){ const base={kind:'brk',bd:L.bd,bi:L.bi,bmin:L.bmin!=null?L.bmin:50,bdc:0,bic:0,bminFrom:'',dmin:L.dmin,imin:L.imin,scheme:L.scheme};
      const f=fitBrk(c,trades,RS,base); if(f.s.ok>q.rows.length-q.bad){ RS[c].hist=(RS[c].hist||[]).filter(h=>h.kind!=='brk').concat(f.h); fixes.push({c,from:'',k:base,gain:f.s.ok-(q.rows.length-q.bad),note:'whole history refitted: '+f.how+' - '+f.s.ok+'/'+f.s.n+' bill days agree'}); } } }
  for(let loop=0;loop<12;loop++){ const q=run(RS); if(!q) break; const W=reconWhy(c,trades,q), rateBad=new Set(W.filter(w=>w.type==='rate').map(w=>w.d)), ok0=okSet(q);
    const rows=q.rows.filter(x=>x.bill!=null&&x.n); let seg=null; const segs=[];
    rows.forEach(x=>{ if(rateBad.has(x.d)){ if(!seg) segs.push(seg=[]); seg.push(x); } else if(ok0.has(x.d)) seg=null; });
    const S=segs.find(g=>!tried.has(g[0].d)); if(!S) break; tried.add(S[0].d);
    const med=a=>{ a=a.filter(v=>isFinite(v)).sort((x,y)=>x-y); return a.length?a[Math.floor(a.length/2)]:null; }, imp=x=>(x.bill-x.net-x.stat)/gst;
    const from=S[0].d, after=rows.find(x=>x.d>S[S.length-1].d), prev=rateAt(RS[c],from), cur=Object.assign({},RS._def||{},prev);
    const bdN=med(S.filter(x=>x.tD>0&&!x.tI).map(x=>imp(x)/x.tD*100)), bdU=bdN!=null?Math.round(bdN*100)/100:+cur.bd||0;
    const biN=med(S.filter(x=>x.tI>0).map(x=>(imp(x)-bdU/100*(x.tD||0))/x.tI*100)), biU=biN!=null?Math.max(0,Math.round(biN*1000)/1000):+cur.bi||0;
    const cands=[]; [bdU,+cur.bd||0].forEach(bd=>[biU,+cur.bi||0].forEach(bi=>[+cur.bmin||0,0,50].forEach(bm=>[[+cur.bdc||0,+cur.bic||0],[0,0]].forEach(([dc,ic])=>cands.push({bd,bi,bmin:bm,bdc:dc,bic:ic})))));
    let best=null;
    [[+cur.bd||0,+cur.bi||0]].forEach(([dc,ic])=>[bdU,+cur.bd||0].forEach(bd=>[biU,+cur.bi||0].forEach(bi=>{ if(bd<dc) cands.push({bd,bi,bmin:50,bdc:dc,bic:ic}); })));   /* lower % charged, minimum checked at the current % */
    cands.forEach(k=>{ if(k.bd===+cur.bd&&k.bi===+cur.bi&&k.bmin===+(cur.bmin||0)&&k.bdc===+(cur.bdc||0)) return; if(!(k.bd>=0.01&&k.bd<=1.5&&k.bi>=0&&k.bi<=0.2)) return; { const LB=[...((RS[c].hist)||[])].reverse().find(h=>h.kind==='brk'&&h.src!=='bills'); if(LB&&(k.bd>LB.bd+1e-9||k.bi>LB.bi+1e-9)) return; }   /* only rates a broker would charge, never above the agreed listing (above it = excess billed) */
      const X=JSON.parse(JSON.stringify(RS)); X[c].hist=(X[c].hist||[]).concat([Object.assign({from,kind:'brk',src:'bills'},k,{bminFrom:''})]);
      if(after) X[c].hist.push({from:after.d,kind:'brk',src:'bills',bd:+cur.bd||0,bi:+cur.bi||0,bmin:+cur.bmin||0,bdc:+cur.bdc||0,bic:+cur.bic||0,bminFrom:''});
      const q2=run(X), ok2=okSet(q2), lost=[...ok0].filter(d=>!ok2.has(d)).length, gain=ok2.size-ok0.size;
      if(!lost&&gain>=Math.min(2,S.length)&&(!best||gain>best.gain)) best={X,k,gain}; });
    if(best){ Object.assign(RS,best.X); fixes.push({c,from,to:after?after.d:'',k:best.k,gain:best.gain,note:(best.gain<2?'(1 bill only - confirm with the contract note) ':'')+'from '+dmy(from)+(after?' to '+dmy(S[S.length-1].d):'')+': bills show '+best.k.bd+'% / '+best.k.bi+'%'+(best.k.bmin?', minimum ₹'+best.k.bmin:', no minimum')+' - '+best.gain+' more bill day'+(best.gain>1?'s':'')+' agree'}); } }
  if(apply&&fixes.length){ const cur=rates(); cur[c]=RS[c]; LS.set('jc_pf_rates',cur); }
  const q=run(apply?rates():RS); return {c,fixes,why:q?reconWhy(c,trades,q):[],ok:q?q.rows.length-q.bad:0,n:q?q.rows.length:0}; }
function reconAll(trades,apply){ const out={}; Object.keys(led().E||{}).forEach(c=>{ if(!trades.some(t=>t.c===c)) return; out[c]=Object.assign(reconFix(c,trades,apply),{at:Date.now()}); }); LS.set('jc_pf_recon',out); return out; }
/* ---------- excess billed by the broker: each bill day, charges on the bill (bill - trade value) against the charges the agreed
   rates give - brokerage at the client's master rates + the broker's own charge sheet - and against the official (law) rates.
   Days whose trades are incomplete (no trades / no bill / bill far from the trades) are not counted as excess: they are listed apart. */
function excessReport(trades,only){ const out={};
  Object.keys(led().E||{}).filter(c=>!only||c===only).forEach(c=>{ if(!trades.some(t=>t.c===c)) return; const q=ledgerRecon(c,trades); if(!q) return;
    const W={}; reconWhy(c,trades,q).forEach(w=>W[w.d]=w); let cum=0, cumL=0; const days=[], skip=[];
    q.rows.forEach(x=>{ const w=W[x.d]; if(x.bill==null||!x.n||(w&&w.type!=='rate')){ if(x.bill!=null||x.n) skip.push({d:x.d,why:w?w.why:(x.why||'')}); return; }
      const billC=x.bill-x.net, sheetC=x.stat+x.brk, lawC=(x.statOff||0)+x.brk, xs=x.bill-x.exp, xl=x.bill-x.expOff; cum+=xs; cumL+=xl;
      days.push({d:x.d,turn:(x.tD||0)+(x.tI||0),bill:x.bill,net:x.net,billC,sheetC,lawC,brk:x.brk,xs,xl,cum,cumL}); });
    const sum=k=>days.reduce((a,x)=>a+x[k],0);
    out[c]={c,days,skip,billC:sum('billC'),sheetC:sum('sheetC'),lawC:sum('lawC'),xs:sum('xs'),xl:sum('xl'),over:days.filter(x=>x.xs>=1).reduce((a,x)=>a+x.xs,0),under:days.filter(x=>x.xs<=-1).reduce((a,x)=>a+x.xs,0),nOver:days.filter(x=>x.xs>=1).length}; });
  return out; }
function brkFromLedgers(trades){ const cs=Object.keys(led().E||{}), M=LS.get('jc_pf_brkled',{})||{}; let ch=false;
  cs.forEach(c=>{ const r=ledgerRecon(c,trades); if(!r||r.bd==null) return; const o={bd:r.bd,bi:r.bi!=null?r.bi:(M[c]||{}).bi,bmin:r.bmin||0,nMin:r.nMin||0,nDel:r.nDel,nInt:r.nInt}; if(JSON.stringify(M[c])!==JSON.stringify(o)){ M[c]=o; ch=true; } });
  if(ch) LS.set('jc_pf_brkled',M); return M; }
/* ---------- tally: what keeps the trade book from matching the DP ----------
   gaps = delivery sells with no earlier buy (FIFO), per client + script, in today's share count (after bonus / split),
   with every ledger bill that is not explained by the trade book (days with no trades, or a bill bigger than that day's trades)
   offered as a candidate buy, its rate worked out from the bill (rate = amount / qty / (1 + brokerage + taxes)) and checked
   against that day's NSE low-high. A candidate is only a suggestion - the user confirms it from the contract note. */
const HISTC={};
async function histRange(sym){ if(HISTC[sym]) return HISTC[sym]; const u='https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(sym+'.NS')+'?period1=1577836800&period2='+Math.floor(Date.now()/1000)+'&interval=1d';
  try{ const j=await fetch(BE+'?action=fetch&url='+encodeURIComponent(u)).then(r=>r.json()), x=j.chart.result[0], q=x.indicators.quote[0], m={};
    (x.timestamp||[]).forEach((t,i)=>{ if(q.low[i]!=null) m[new Date((t+19800)*1000).toISOString().slice(0,10)]={l:q.low[i],h:q.high[i],c:q.close[i]}; }); return HISTC[sym]=m; }catch(e){ return HISTC[sym]={}; } }
function tally(trades,dpH,ST,rateOf){ ST=ST||stat(); const A=(CA&&CA.a)||[], E=compute(caAdjust(trades),ST,rateOf||(()=>({bd:0,bi:0,dp:0}))), g={};
  E.short.forEach(s=>{ const k=s.c+'|'+s.sym, x=g[k]=g[k]||{c:s.c,sym:s.sym,q:0,first:s.d,rate:s.r,sells:[]}; x.q+=s.q; x.sells.push(s); if(s.d<x.first){ x.first=s.d; x.rate=s.r; } });
  const gaps=Object.values(g).map(x=>{ x.q=Math.round(x.q*1e4)/1e4; x.acts=A.filter(a=>a.s===x.sym&&(a.t==='bonus'||a.t==='split')&&a.ex<=x.first); return x; });
  /* book vs DP */
  const book={}; E.hold.forEach(h=>{ const k=h.c+'|'+h.sym; book[k]=(book[k]||0)+h.q; });
  const dp={}, info={}; Object.keys(dpH||{}).forEach(c=>(dpH[c]||[]).forEach(x=>{ const k=c+'|'+dpKey(x); dp[k]=(dp[k]||0)+x.q; info[k]=x; }));
  const cs=new Set([...Object.keys(dpH||{})]); const rows=[...new Set([...Object.keys(book).filter(k=>cs.has(k.split('|')[0])),...Object.keys(dp)])].sort().map(k=>{ const [c,sym]=k.split('|'); return {c,sym,book:Math.round((book[k]||0)*1e4)/1e4,dp:dp[k]||0,x:info[k]||{}}; });
  return {gaps,rows,E}; }
/* candidate buys for a gap from the client's unexplained ledger bills (needs histRange(sym) loaded) */
function gapHints(gap,rc,rate,ST){ ST=ST||stat(); if(!rc) return []; const H=HISTC[gap.sym]||{}, gst=ST.gst/100;
  const K=1+(rate.bd||0)/100*(1+gst)+ST.sttD/100+ST.stampD/100+ST.exch/100*(1+gst)+ST.sebi/100*(1+gst);
  const cands=rc.rows.concat(rc.outRows||[]).filter(r=>r.d<gap.first&&r.bill!=null&&(r.out||!r.ok)).map(r=>({d:r.d,amt:r.out?r.bill:r.diff,out:!!r.out})).filter(r=>r.amt>0);
  return cands.map(r=>{ const f=(CA&&CA.a||[]).filter(a=>a.s===gap.sym&&(a.t==='bonus'||a.t==='split')&&a.ex>r.d&&a.ex<=gap.first).reduce((m,a)=>m*caFactor(a),1), q0=gap.q/f, est=r.amt/K/q0, p=H[r.d];
      return Object.assign(r,{q0,est,fit:p?(est>=p.l*0.997&&est<=p.h*1.003):null,lo:p&&p.l,hi:p&&p.h}); })
    .filter(r=>r.fit).sort((a,b)=>b.d.localeCompare(a.d)); }
/* ---------- funding: holding interest only on the part of a client's open holdings that the broker is funding ----------
   ledger in debit (Dr) -> funded share = min(1, debit / cost of open holdings); ledger in credit or nil -> own money, no holding
   interest (the holding is judged against the return benchmark instead, STAT.hurdle % p.a.); no ledger uploaded -> assumed funded. */
function fundAdj(E){ const by={}; E.hold.forEach(h=>{ (by[h.c]=by[h.c]||[]).push(h); }); E.fund={};
  Object.keys(by).forEach(c=>{ const H=by[c], cost=H.filter(h=>h.tag!=='DPO').reduce((a,h)=>a+h.q*h.cost,0), bal=ledBal(c), f=bal==null?1:bal<=0?0:Math.min(1,bal/(cost||1));
    H.forEach(h=>{ h.hcFull=h.hc; h.hc=h.hc*f; h.fund=f; }); E.fund[c]={f,bal,cost,src:bal==null?'no ledger - assumed funded':bal<=0?'ledger in credit - own funds':f<1?'ledger debit covers '+Math.round(f*100)+'% of holdings':'ledger debit covers all holdings'}; });
  return E; }
const hurdleOf=(days,ST)=>((ST||stat()).hurdle||0)*Math.max(days,1)/365;   /* benchmark % for the days held */
/* ---------- whole-app backup to Google Drive ----------
   Everything the Portfolio keeps in this browser (trades incl. hand entries, ledgers, DP, rates, marks, links, settings - never the
   passcode) is saved to Drive as one copy a few seconds after any change, and loaded back when a page opens on any device or after the
   browser data was cleared. Drive keeps the newest copy and 40 earlier ones. */
const SKIP=new Set(['jc_pf_drive','jc_pf_dstat','jc_pf_seen','jc_pf_sync','jc_pf_state_t','jc_pf_state_h','jc_pf_dirty','jc_pf_state_n']);
const stKeys=()=>{ const k=[]; try{ for(let i=0;i<localStorage.length;i++){ const x=localStorage.key(i); if(/^jc_pf_/.test(x)&&!SKIP.has(x)) k.push(x); } }catch(e){} return k.sort(); };
const stRaw=()=>stKeys().map(k=>k+'\u0001'+lsGetRaw(k)).join('\u0002');
const hsh=s=>{ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36)+'.'+s.length; };
const lsRaw=(k,v)=>{ try{ if(v==null){ localStorage.removeItem(k); delete ZC[k]; return true; } return lsSetRaw(k,v); }catch(e){ return false; } };
let ST_BUSY=false, ST_TIMER=null, ST_STARTED=false, ST_READY=false, ST_SHRINK_OK=false;
/* safety (2026-11-26): nothing is saved before this page has finished loading the Drive copy, and a copy less than half the size of
   the last Drive copy is never saved without a yes - a fresh / cleared browser once saved its empty defaults over the real data */
async function stPost(o){ const k=akey(); if(!k) throw new Error('passcode'); const ac=new AbortController(); setTimeout(()=>ac.abort(),60000);
  const j=await fetch(BE,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({key:k},o)),signal:ac.signal}).then(r=>r.json());
  if(j.error){ if(/bad passcode/.test(j.error)) try{ localStorage.removeItem('jc_admin_key'); }catch(e){} throw new Error(j.error); } return j; }
const stSize=st=>{ const D=(st&&st.data)||{}; return Object.keys(D).filter(k=>/^jc_pf_/.test(k)&&!SKIP.has(k)).reduce((a,k)=>a+k.length+String(D[k]).length+2,0); };
async function statePush(force){ if(ST_BUSY) return; const raw=stRaw(), h=hsh(raw); if(h===localStorage.getItem('jc_pf_state_h')){ lsRaw('jc_pf_dirty',null); return; }
  if(!ST_READY&&!force){ if(!akey()){ lsRaw('jc_pf_dirty','1'); driveStat({ok:false,why:'passcode',dirty:true}); } return; }
  const n0=+localStorage.getItem('jc_pf_state_n')||0;
  if(!force&&!ST_SHRINK_OK&&n0>20000&&raw.length<n0*0.5){ lsRaw('jc_pf_dirty','1');
    if(document.hidden||!confirm('Drive backup check\n\nThe data in this browser is much smaller than the last Drive copy ('+Math.round(raw.length/1024)+' KB vs '+Math.round(n0/1024)+' KB).\nSaving now would replace the fuller copy on every device.\n\nOK = save this smaller copy (only if you deleted data on purpose)\nCancel = do not save (reload the page to bring the Drive copy back)')){ driveStat({ok:false,why:'not saved - much smaller than the Drive copy',dirty:true}); return; }
    ST_SHRINK_OK=true; }
  if(!akey()){ lsRaw('jc_pf_dirty','1'); driveStat({ok:false,why:'passcode',dirty:true}); return; }
  ST_BUSY=true; driveStat({busy:true,saving:true});
  if(STORE_FULL){ lsRaw('jc_pf_dirty','1'); driveStat({ok:false,why:'browser storage full - not saved',dirty:true}); return; }
  try{ const data={}; stKeys().forEach(k=>data[k]=lsGetRaw(k)); const j=await stPost({action:'pf_state_save',state:JSON.stringify({v:1,t:Date.now(),data})});
    lsRaw('jc_pf_state_t',String(j.t)); lsRaw('jc_pf_state_h',h); lsRaw('jc_pf_state_n',String(raw.length)); lsRaw('jc_pf_dirty',null); driveStat({ok:true,saved:j.t,mode:'state'}); }
  catch(e){ lsRaw('jc_pf_dirty','1'); driveStat({ok:false,why:e.name==='AbortError'?'timeout':e.message,dirty:true}); }
  finally{ ST_BUSY=false; } }
function stateApply(st){ const D=(st&&st.data)||{}; let ok=true; Object.keys(D).forEach(k=>{ if(/^jc_pf_/.test(k)&&!SKIP.has(k)&&!lsRaw(k,D[k])) ok=false; });
  if(ok) stKeys().forEach(k=>{ if(!(k in D)) lsRaw(k,null); });   /* only after every key of the Drive copy is stored */
  return ok; }
/* open: newest copy from Drive unless this browser holds changes not saved yet (those go up first) */
let ST_LAST='';
async function stateSync(){ if(!ST_STARTED){ ST_STARTED=true;
    /* every 2 s: if the data changed since the last save, save once it has been still for 2 s (a burst of changes = one save) */
    setInterval(()=>{ if(!ST_READY) return; const h=hsh(stRaw()); if(h===localStorage.getItem('jc_pf_state_h')){ ST_LAST=h; return; } if(h!==ST_LAST){ ST_LAST=h; return; } if(!ST_BUSY) statePush(); },2000);
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) stateSync().catch(()=>0); }); window.addEventListener('beforeunload',()=>{ if(hsh(stRaw())!==localStorage.getItem('jc_pf_state_h')) lsRaw('jc_pf_dirty','1'); }); }
  if(!akey()){ driveStat({ok:false,why:'passcode'}); return {n:0}; }
  const sh=localStorage.getItem('jc_pf_state_h'), dirty=localStorage.getItem('jc_pf_dirty')==='1'||(!!sh&&hsh(stRaw())!==sh);
  driveStat({busy:true});
  try{ const j=await stPost({action:'pf_state_load'}), mine=+localStorage.getItem('jc_pf_state_t')||0;
    if(j.none){ ST_READY=true; if(stKeys().length) await statePush(); else { driveStat({ok:true,none:true}); await driveLoad().catch(()=>0); } return {n:0}; }
    const st=JSON.parse(j.state);
    if(st.cleared&&j.t>mine){ /* everything was deleted on another device - deletion wins over unsaved changes here */ }
    ST_READY=true; if(!localStorage.getItem('jc_pf_state_n')||j.t>mine) lsRaw('jc_pf_state_n',String(stSize(st)));
    if(!(st.cleared&&j.t>mine)&&dirty&&mine){
      /* this browser has unsaved changes. If Drive also got a newer copy from another device meanwhile, ask which one wins instead of
         silently overwriting the newer Drive copy */
      const cnt=get=>{ try{ const t=JSON.parse(get('jc_pf_tb')||'{}').trades||[], L=JSON.parse(get('jc_pf_led2')||'{}'); return {n:t.length,c:new Set(t.map(x=>x.c)).size,m:t.filter(x=>!x.src).length,l:Object.keys(L.E||{}).length}; }catch(e){ return {n:0,c:0,m:0,l:0}; } },
        cd=cnt(k=>(st.data||{})[k]), cl=cnt(lsGetRaw), line=x=>x.n+' trades · '+x.c+' clients · '+x.m+' manual · '+x.l+' ledgers';
      const same=cd.n===cl.n&&cd.c===cl.c&&cd.m===cl.m&&cd.l===cl.l;
      if(!(j.t>mine)||document.hidden){ await statePush(); return {n:0}; }
      if(!same||cl.n<cd.n){ if(!confirm('Two different Portfolio copies:\n\nDRIVE   (saved '+new Date(j.t).toLocaleString('en-IN')+'):\n   '+line(cd)+'\nTHIS BROWSER (unsaved changes):\n   '+line(cl)+'\n\nOK = load the Drive copy\nCancel = keep this browser\'s copy and save it over Drive\n\n(the copy with more trades / ledgers is usually the right one)')){ await statePush(); return {n:0}; } }
      else { await statePush(); return {n:0}; } }   /* same trades / clients / ledgers on both sides: just save this browser's small changes, no question */
    if(j.t>mine){ if(!stateApply(st)){ ST_READY=false; driveStat({ok:false,why:'browser storage full - Drive copy not loaded',dirty:false}); return {n:0}; }
      const h=hsh(stRaw()); lsRaw('jc_pf_state_t',String(j.t)); lsRaw('jc_pf_state_h',h); lsRaw('jc_pf_dirty',null);
      driveStat({ok:true,loaded:1,restored:j.t,cleared:!!st.cleared,mode:'state'}); return {n:1}; }
    driveStat({ok:true,saved:mine,mode:'state'}); return {n:0}; }
  catch(e){ driveStat({ok:false,why:e.name==='AbortError'?'timeout':e.message}); return {n:0}; } }
/* delete everything: this browser, every device (empty state) and the Drive uploads (to Drive trash, 30 days) */
async function clearAll(){ const j=await stPost({action:'pf_clear'}); lsRaw('jc_pf_state_n',null); stKeys().forEach(k=>lsRaw(k,null)); lsRaw('jc_pf_state_t',String(j.t)); lsRaw('jc_pf_state_h',hsh(stRaw())); lsRaw('jc_pf_dirty',null); lsRaw('jc_pf_seen',null);
  driveStat({ok:true,saved:j.t,mode:'state'}); return j; }
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

/* Watchlist daily call - the same rules as watchlist.html analyse() (TF Daily): EMA 9/21 and slope, price vs EMA 9 and the 20-day average, RSI 14,
   volume of the last 3 bars vs the 20 before, fresh 9/21 cross; score -100..100, BUY >= 45, SELL <= -45, else AVOID; levels from ATR 14.
   Same code as the client report's copy (parameters from jc-params when loaded). Bars: [{d,c,o,h,l,v}] oldest first, p = live price. */
const wlSig=(()=>{ const q=(k,d)=>window.JCP&&JCP.P&&JCP.P[k]!=null?JCP.P[k]:d;
const ema=(a,n)=>{ const out=Array(a.length).fill(null); if(a.length<n) return out; const k=2/(n+1); let e=a.slice(0,n).reduce((x,y)=>x+y,0)/n; out[n-1]=e; for(let i=n;i<a.length;i++){ e=a[i]*k+e*(1-k); out[i]=e; } return out; };
const tick=x=>Math.round(x*20)/20;
function wlSig(S0,p){ const S=S0.slice(-260).map(x=>Object.assign({},x)); if(S.length<25) return null; if(p){ const z=S[S.length-1]; z.c=p; if(z.h!=null) z.h=Math.max(z.h,p); if(z.l!=null) z.l=Math.min(z.l,p); }
  const c=S.map(x=>x.c), n=c.length, L=n-1, ltp=c[L], e9=ema(c,q('WL_EMA_FAST',9)), e21=ema(c,q('WL_EMA_SLOW',21)), NA=q('IND_ATR_PERIOD',14), NR=q('IND_RSI_PERIOD',14);
  let A=null; for(let i=1;i<n;i++){ const h=S[i].h!=null?S[i].h:c[i], l=S[i].l!=null?S[i].l:c[i], tr=Math.max(h-l,Math.abs(h-c[i-1]),Math.abs(l-c[i-1])); A=A==null?tr:(A*(NA-1)+tr)/NA; }
  let g=0,ls=0; for(let i=1;i<=NR;i++){ const d=c[i]-c[i-1]; if(d>0) g+=d; else ls-=d; } g/=NR; ls/=NR; for(let i=NR+1;i<n;i++){ const d=c[i]-c[i-1]; g=(g*(NR-1)+Math.max(d,0))/NR; ls=(ls*(NR-1)+Math.max(-d,0))/NR; } const R14=ls===0?100:100-100/(1+g/ls);
  const ref=c.slice(-20).reduce((a,x)=>a+x,0)/Math.min(20,n), V=S.map(x=>x.v), hasV=V.slice(-23).every(v=>v!=null&&v>0);
  const av=a=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length), vr=hasV?av(V.slice(-3))/(av(V.slice(-23,-3))||1):null, mv=c[L]-c[Math.max(0,L-3)];
  let cross=null; for(let i=L;i>21&&i>L-30;i--){ if(e9[i]==null||e9[i-1]==null||e21[i-1]==null) break; if((e9[i]>e21[i])!==(e9[i-1]>e21[i-1])){ cross=L-i; break; } }
  const wT=q('WL_W_TREND',25), wS=q('WL_W_SLOPE',10), wE=q('WL_W_LTP_EMA',10), wR=q('WL_W_REF',15), wI=q('WL_W_RSI',10), wX=q('WL_W_RSI_X',8), wV=q('WL_W_VOL',15), wC=q('WL_W_CROSS',15);
  const bull=e9[L]>e21[L]; let sc=bull?wT:-wT; const sl=e21[L]-e21[Math.max(0,L-3)]; sc+=sl>0?wS:sl<0?-wS:0; sc+=ltp>e9[L]?wE:ltp<e9[L]?-wE:0; sc+=ltp>ref?wR:ltp<ref?-wR:0;
  sc+=R14>q('RSI_BULL',55)?wI:R14<q('RSI_BEAR',45)?-wI:0; if(R14>q('WL_RSI_HOT',75)) sc-=wX; if(R14<q('WL_RSI_COLD',25)) sc+=wX; if(vr!=null&&vr>q('WL_VOL_HI',1.15)) sc+=mv>0?wV:mv<0?-wV:0; if(cross!=null&&cross<=q('WL_CROSS_BARS',3)) sc+=bull?wC:-wC; if(vr!=null&&vr<q('WL_VOL_LO',0.85)) sc*=q('WL_VOL_DAMP',0.8);
  sc=Math.max(-100,Math.min(100,Math.round(sc))); const cs=q('WL_CALL_SCORE',45), call=sc>=cs?'BUY':sc<=-cs?'SELL':'AVOID';
  let lv=null; if(call!=='AVOID'&&A){ const dir=call==='BUY'?1:-1, dist=Math.abs(ltp-e21[L])+q('WL_RISK_EXTRA_ATR',0.25)*A, risk=Math.min(q('WL_SL_MAX_ATR',3)*A,Math.max(q('WL_SL_MIN_ATR',1)*A,dist)), en=tick(ltp); lv={en,sl:tick(en-dir*risk),t1:tick(en+dir*risk),t2:tick(en+dir*2*risk),t3:tick(en+dir*3*risk)}; }
  return {score:sc,conv:Math.abs(sc),call,lv,bull,rsi:R14,vr,e21:e21[L],atr:A}; }

return wlSig; })();
window.PF={liquidateNew,secLoad,secOf,secFill,dmPending,isRE,xlsxLib,wlSig,dpCost,setDpCost,dpOpenRows,withOpening,grp,setGrp,grpOk,grpLabels,ipoData,ipoDet,ipoDetOf,ipoDetAt:()=>(IPOX&&IPOX.asOf)||'',ipoFind,ipoUniq,ipoScripts,listInfo,listings,ipoRows,dmRecords,addDemerger,userDm,DEMERGERS,caRun,caExtra,ledCover,ledFresh,excessReport,sheets,sheetOn,SHEET0,reconWhy,reconFix,reconAll,rateAt,readListing,applyListing,chargeSplit,profitSplit,taxPlan,sectorOf,taxCalc,fyOf,isLT,markOf,markSplit,stateSync,statePush,clearAll,canonSym,dpKey,autoAlias,setAlias,aliases,backupClient,fundAdj,hurdleOf,tally,gapHints,histRange,ledgerRecon,brkFromLedgers,corpActs,caAdjust,caRows,caFactor,BUILD,upload,progOpen,driveLoad,syncMark,varMap,isinMap,template,pdfLines,parseDPpdf,parseLedgerPdf,importDP,dp,removeDP,driveSave,driveAll,toast,importTrades,importLedger,tb,addTrades,removeTrades,saveTrade,deleteTrade,editor,led,addLedger,removeLedger,ledBal,kindOf,tdays,ageing,sellNet,liquidate,xirr,ist,todayS,dmy,days,addD,LS,STAT0,stat,rates,rateOfFrom,loadTrades,compute,recovery,roundTrip,qtyFor,marks:()=>new Proxy(LS.get('jc_pf_mark',{}),{get:(o,k)=>typeof k==='string'?(o[k]||'T'):o[k]}) /* every script is Trading unless marked Investment */};
})();
