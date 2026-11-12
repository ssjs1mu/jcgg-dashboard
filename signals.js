/* Joshi's Corner - ⚡ Day-trade signal popups on every page of the app.
   The best intraday set-ups of the High Net-worth Trade screen (Big Fish / Tail Fish / Open = Low / Open = High / volume breakouts,
   volume pace ≥ 1.5x, risk ≤ 3%, reward ≥ 1.5 × risk, target capped at 1.5 × today's range). When a stock ENTERS the top 5,
   a popup shows Entry, Exit (stop-loss), T1 and T2 - once per stock and side per day, in every open tab of the app.
   Signals 09:25-14:45 IST on trading days (no fresh day trades in the last 45 minutes).
   One tab does the work (the Watchlist if it is open, it already has live prices); the others just show the popups. */
(function(){
  if(window.top!==window||window.JCSIG) return;   // not inside frames
  const BACKEND='https://script.google.com/macros/s/AKfycbzMp82oHzLzKpaE0LrnUqEGGot7jqSw9e9VA1QhJNOPV35vOIYcfIChFL5PCDuD2Ahi5Q/exec';
  const ME=Math.random().toString(36).slice(2), IS_WL=/watchlist\.html/.test(location.pathname);
  const ist=()=>new Date(Date.now()+19800000), day=()=>ist().toISOString().slice(0,10), mins=()=>{ const n=ist(); return n.getUTCHours()*60+n.getUTCMinutes(); };
  const fx=v=>v==null||!isFinite(v)?'–':Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ld=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }, sv=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  let HOL={}; fetch('https://raw.githubusercontent.com/ssjs1mu/jc-stock-analyst/main/data/festivals.json').then(r=>r.json()).then(j=>(j.days||[]).forEach(d=>{ if(d.trading_holiday) HOL[d.date]=1; })).catch(()=>{});
  const trading=()=>{ const d=ist().getUTCDay(); return d>0&&d<6&&!HOL[day()]; };
  const window_=()=>trading()&&mins()>=565&&mins()<=885;      // 09:25 - 14:45

  /* ---------- the High Net-worth Trade rules (same as the Watchlist page and the tracker) ---------- */
  const eq2=(a,b)=>a!=null&&b!=null&&Math.round(a*100)===Math.round(b*100);
  function pick(rows,frac){ const C=[];
    rows.forEach(r=>{ const [s,,p,pc,o,h,l,v,av,,mh,ml,wh,wl,rs]=r; if(!pc||!o||!h||!l||!p) return;
      const pace=av?v/(av*frac):null, rng=l?(h-l)/l*100:0, fo=(p/o-1)*100, H={};
      if(eq2(o,l)) H.OL=1; if(eq2(o,h)) H.OH=1;
      if(pace!=null&&rs!=null&&mh!=null&&p>=50&&v>=350000&&pace>=1.5&&rng>=1.5&&fo>=2&&rs>55&&p>mh) H.BF=1;
      if(rs!=null&&ml!=null&&p>=50&&v>=350000&&rng>=1.5&&fo<=-1.5&&rs<40&&p<ml) H.BS=1;
      if(mh!=null&&p>mh) H.MH=1; if(ml!=null&&p<ml) H.ML=1; if(wh!=null&&p>=wh) H.WH=1; if(wl!=null&&p<=wl) H.WL=1;
      if(pace!=null&&pace>=2&&p>pc&&((mh!=null&&p>mh)||p>=h)) H.VU=1; if(pace!=null&&pace>=2&&p<pc&&((ml!=null&&p<ml)||p<=l)) H.VD=1;
      const ls=[], ss=[]; if(H.BF) ls.push('Big Fish'); if(H.OL&&p>pc) ls.push('Open = Low'); if(H.VU) ls.push('Vol up breakout'); if(H.MH) ls.push('1-month high'); if(H.WH) ls.push('52-week high');
      if(H.BS) ss.push('Tail Fish'); if(H.OH&&p<pc) ss.push('Open = High'); if(H.VD) ss.push('Vol down breakout'); if(H.ML) ss.push('1-month low'); if(H.WL) ss.push('52-week low');
      [[1,ls],[-1,ss]].forEach(([d,src])=>{ if(!src.length||!src.some(x=>/Fish|Open|breakout/.test(x))||pace==null||pace<1.5) return;
        const stop=d>0?Math.max(l,o<p?o:l)*0.998:Math.min(h,o>p?o:h)*1.002, risk=Math.abs(p-stop)/p*100; if(risk<=0.15||risk>3) return;
        const lv=d>0?[mh,wh].filter(x=>x&&x>p*1.003).sort((a,b)=>a-b):[ml,wl].filter(x=>x&&x<p*0.997).sort((a,b)=>b-a);
        let tg=lv.length?lv[0]:p+d*2*Math.abs(p-stop); const reach=1.5*(h-l); if(Math.abs(tg-p)>reach) tg=p+d*reach;
        const room=Math.abs(tg-p)/p*100, rr=room/risk; if(rr<1.5) return;
        C.push({s,d,p,stop,t1:p+d*Math.abs(p-stop),t2:tg,room,risk,rr,pace,ch:(p/pc-1)*100,src,score:room*(1+0.25*(src.length-1))*Math.min(pace,4)/4*Math.min(rr,3)/3}); }); });
    return C.sort((a,b)=>b.score-a.score); }

  /* ---------- data: the Watchlist's live rows if this is the Watchlist, else the 5-minute snapshot + live quotes ---------- */
  let BASE=null, BASEat=0;
  async function rows(){
    if(IS_WL&&window.OLH&&OLH.rows&&OLH.rows.length>200&&Date.now()-OLH.at<150000)
      return OLH.rows.map(r=>[r.s,'',r.p,r.pc,r.o,r.h,r.l,r.v,r.av,'',r.mh,r.ml,r.wh,r.wl,r.rs!=null?r.rs:r.rsi]);
    if(!BASE||Date.now()-BASEat>300000){ const j=await (await fetch('https://raw.githubusercontent.com/ssjs1mu/jcgg-dashboard/heat/heat.json?x='+Math.floor(Date.now()/60000),{cache:'no-store'})).json(); BASE=j.rows.filter(r=>r[9]===day()); BASEat=Date.now(); }
    if(!BASE.length) return [];
    const syms=BASE.map(r=>r[0]+'.NS'), parts=[]; for(let i=0;i<syms.length;i+=250) parts.push(syms.slice(i,i+250));
    const qs=await Promise.all(parts.map(p=>fetch(BACKEND+'?action=liveq&symbols='+encodeURIComponent(p.join(','))).then(r=>r.json()).catch(()=>null)));
    const Q={}; qs.forEach(j=>{ if(j&&j.q) Object.assign(Q,j.q); });
    return BASE.map(r=>{ const q=Q[r[0]+'.NS']; if(!q||!q[0]) return r; const x=r.slice(); x[2]=q[0]; if(q[1]) x[3]=q[1]; if(q[2]) x[4]=q[2]; if(q[3]) x[5]=q[3]; if(q[4]) x[6]=q[4]; if(q[5]) x[7]=q[5]; return x; }); }

  /* ---------- one tab works, all tabs show ---------- */
  const LK='jc_sig_lead', SK=()=>'jc_sig_'+day();
  function lead(){ const l=ld(LK,null), now=Date.now(); if(IS_WL||!l||l.id===ME||now-l.ts>45000){ sv(LK,{id:ME,ts:now,wl:IS_WL}); return true; } return false; }   // the Watchlist always takes over; otherwise the first tab, until it goes quiet
  async function scan(){ if(!window_()||document.hidden&&!IS_WL) return; if(!lead()) return;
    try{ const R=await rows(); if(R.length<200) return; const frac=Math.max((mins()-555)/375,0.04), top=pick(R,frac).slice(0,5);
      const S=ld(SK(),{list:[],seen:{}}); let added=0;
      top.forEach((c,i)=>{ const k=c.s+'|'+c.d; if(S.seen[k]) return; S.seen[k]=1; added++;
        S.list.unshift({k,t:Date.now(),s:c.s,side:c.d>0?'BUY':'SELL',en:+c.p.toFixed(2),sl:+c.stop.toFixed(2),t1:+c.t1.toFixed(2),t2:+c.t2.toFixed(2),risk:+c.risk.toFixed(2),room:+c.room.toFixed(2),rr:+c.rr.toFixed(2),pace:+c.pace.toFixed(1),ch:+c.ch.toFixed(2),src:c.src,rank:i+1}); });
      if(added){ S.list=S.list.slice(0,60); sv(SK(),S); showNew(S); try{ BC&&BC.postMessage('sig'); }catch(e){} }
    }catch(e){} }
  const BC=window.BroadcastChannel?new BroadcastChannel('jc-sig'):null; if(BC) BC.onmessage=()=>showNew(ld(SK(),{list:[]}));
  addEventListener('storage',e=>{ if(e.key===SK()) showNew(ld(SK(),{list:[]})); });

  /* ---------- the popups ---------- */
  const css=document.createElement('style'); css.textContent=`
  #jcSig{position:fixed;right:14px;bottom:70px;z-index:2147481000;display:flex;flex-direction:column-reverse;gap:8px;width:min(360px,calc(100vw - 28px));pointer-events:none;font-family:Inter,"Segoe UI",Arial,sans-serif}
  .jcs{pointer-events:auto;border-radius:14px;padding:10px 12px 9px;color:#eef3fb;box-shadow:0 14px 34px rgba(0,0,0,.55);border:1px solid;animation:jcsIn .6s cubic-bezier(.2,.9,.2,1);position:relative}
  .jcs.b{background:linear-gradient(145deg,#0c3a2c,#0f1d30 70%);border-color:#35f0a8}.jcs.s{background:linear-gradient(145deg,#45122a,#0f1d30 70%);border-color:#ff6b9d}
  @keyframes jcsIn{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
  .jcs .h{display:flex;align-items:center;gap:7px;padding-right:18px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#e0cd96}.jcs .h i{font-style:normal;margin-left:auto;color:#9fb0c6;font-weight:700;letter-spacing:0}
  .jcs .n{display:flex;align-items:baseline;gap:8px;margin:4px 0 2px}.jcs .n b{font-size:19px;font-weight:900}.jcs .n em{font-style:normal;font-size:12px;font-weight:900;padding:2px 9px;border-radius:6px;color:#0b1220}.jcs.b .n em{background:#35f0a8}.jcs.s .n em{background:#ff6b9d}.jcs .n span{font-size:11.5px;color:#9fb0c6}
  .jcs .w{font-size:11px;color:#c9d4e3;margin-bottom:6px}
  .jcs table{width:100%;border-collapse:collapse;font:800 12.5px ui-monospace,Consolas,monospace}.jcs th{font:800 9.5px Inter,Arial;letter-spacing:.06em;color:#9fb0c6;text-align:left;padding:1px 3px}.jcs td{padding:2px 3px}
  .jcs .en{color:#2fd0ff}.jcs .sl{color:#ff5c7a}.jcs .tg{color:#35f0a8}.jcs .m{font-size:10.5px;color:#9fb0c6;margin-top:5px}
  .jcs .a{display:flex;gap:6px;margin-top:7px}.jcs .a button,.jcs .a a{flex:1;text-align:center;border:1px solid #3a5476;background:#13213a;color:#fff;border-radius:8px;padding:4px 0;font:800 11.5px Inter,Arial;cursor:pointer;text-decoration:none}.jcs .a .c{background:#e0cd96;color:#1a1030;border-color:#e0cd96}
  .jcs .x{position:absolute;top:6px;right:8px;border:0;background:none;color:#9fb0c6;font-size:15px;cursor:pointer}
  #jcSigB{position:fixed;left:12px;bottom:12px;z-index:2147481000;border:1px solid #e0cd96;background:#1a1408;color:#e0cd96;border-radius:999px;padding:6px 12px;font:800 12px Inter,Arial;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.5);display:none}
  #jcSigB.on{display:block}#jcSigB.nw{animation:jcsB 1s ease-in-out 6}@keyframes jcsB{50%{background:#e0cd96;color:#1a1030}}
  #jcSigL{position:fixed;left:12px;bottom:52px;z-index:2147481001;width:min(560px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#0f1a2b;border:1px solid #e0cd96;border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.6);padding:8px 10px;display:none;font:12px Inter,"Segoe UI",Arial,sans-serif;color:#eef3fb}
  #jcSigL.on{display:block}#jcSigL table{width:100%;border-collapse:collapse}#jcSigL th{font:800 10px Inter,Arial;color:#9fb0c6;text-align:left;padding:3px;border-bottom:1px solid #2d4260;position:sticky;top:-8px;background:#0f1a2b}#jcSigL td{padding:3px;border-bottom:1px solid #1d2c44;font:700 12px ui-monospace,Consolas,monospace;white-space:nowrap}
  #jcSigL .B{color:#35f0a8}#jcSigL .S{color:#ff6b9d}#jcSigL .hd{display:flex;justify-content:space-between;align-items:center;color:#e0cd96;font-weight:900;margin-bottom:6px}#jcSigL .hd button{border:0;background:none;color:#9fb0c6;font-size:15px;cursor:pointer}
  @media(prefers-reduced-motion:reduce){.jcs{animation:none}}`;
  document.head.appendChild(css);
  const box=document.createElement('div'); box.id='jcSig'; const bell=document.createElement('button'); bell.id='jcSigB'; bell.type='button'; bell.title="Today's day-trade signals"; const L=document.createElement('div'); L.id='jcSigL';
  const mount=()=>{ document.body.appendChild(box); document.body.appendChild(bell); document.body.appendChild(L); }; if(document.body) mount(); else addEventListener('DOMContentLoaded',mount);
  const shown=new Set(ld('jc_sig_shown_'+day(),[]));
  const tm=t=>new Date(t+19800000).toISOString().slice(11,16);
  const chartHref=s=>IS_WL?'#':'watchlist.html#chart='+encodeURIComponent(s);
  function card(x){ const el=document.createElement('div'); el.className='jcs '+(x.side==='BUY'?'b':'s');
    el.innerHTML=`<button class="x" title="Dismiss">✕</button><div class="h">⚡ DAY-TRADE SIGNAL <i>${tm(x.t)} IST · #${x.rank} of top 5</i></div>
     <div class="n"><b>${esc(x.s)}</b><em>${x.side}</em><span>${x.ch>=0?'+':''}${x.ch}% today · vol ${x.pace}x</span></div><div class="w">${x.src.map(esc).join(' · ')}</div>
     <table><tr><th>ENTRY</th><th>EXIT / SL</th><th>T1</th><th>T2</th></tr><tr><td class="en">${fx(x.en)}</td><td class="sl">${fx(x.sl)}</td><td class="tg">${fx(x.t1)}</td><td class="tg">${fx(x.t2)}</td></tr></table>
     <div class="m">Risk ${x.risk}% · reward ${x.room}% · R:R ${x.rr} : 1 · exit by 15:15 if neither is hit · rule-based, not advice</div>
     <div class="a"><a class="c" href="${chartHref(x.s)}" data-ch="${esc(x.s)}">📈 Live chart</a><button type="button" class="ok">Got it</button></div>`;
    const kill=()=>{ el.style.transition='opacity .4s,transform .4s'; el.style.opacity=0; el.style.transform='translateX(30px)'; setTimeout(()=>el.remove(),420); };
    el.querySelector('.x').onclick=kill; el.querySelector('.ok').onclick=kill;
    el.querySelector('[data-ch]').onclick=e=>{ if(IS_WL&&typeof window.chOpen==='function'){ e.preventDefault(); chOpen(x.s+'.NS',x.s); kill(); } };
    let hover=false; el.onmouseenter=()=>hover=true; el.onmouseleave=()=>hover=false; setTimeout(function t(){ if(hover) setTimeout(t,5000); else kill(); },90000);
    return el; }
  function beep(){ try{ const c=new (window.AudioContext||window.webkitAudioContext)(), o=c.createOscillator(), g=c.createGain(); o.type='triangle'; o.frequency.value=988; g.gain.value=.07; o.connect(g); g.connect(c.destination); o.start(); o.frequency.setValueAtTime(1318,c.currentTime+.12); o.stop(c.currentTime+.28); }catch(e){} }
  function showNew(S){ if(!S||!S.list) return; let n=0;
    S.list.slice().reverse().forEach(x=>{ if(shown.has(x.k)) return; shown.add(x.k); if(Date.now()-x.t<20*60000){ box.appendChild(card(x)); n++; } });
    sv('jc_sig_shown_'+day(),[...shown]); while(box.children.length>3) box.firstChild.remove();
    if(n){ beep(); bell.classList.remove('nw'); void bell.offsetWidth; bell.classList.add('nw'); } paintBell(S); }
  function paintBell(S){ S=S||ld(SK(),{list:[]}); const k=S.list.length; bell.classList.toggle('on',k>0); bell.textContent='⚡ '+k+' day-trade signal'+(k===1?'':'s')+' today';
    L.innerHTML=`<div class="hd">⚡ Today's day-trade signals <button type="button" title="Close">✕</button></div><table><tr><th>Time</th><th>Stock</th><th>Side</th><th>Entry</th><th>Exit / SL</th><th>T1</th><th>T2</th><th>R:R</th><th>Why</th></tr>${S.list.map(x=>`<tr><td>${tm(x.t)}</td><td><b>${esc(x.s)}</b></td><td class="${x.side[0]}">${x.side}</td><td>${fx(x.en)}</td><td>${fx(x.sl)}</td><td>${fx(x.t1)}</td><td>${fx(x.t2)}</td><td>${x.rr}</td><td style="font-family:Inter,Arial;white-space:normal">${x.src.map(esc).join(' · ')}</td></tr>`).join('')}</table><div style="color:#9fb0c6;margin-top:6px">Top-5 High Net-worth Trade set-ups as they appear (09:25–14:45 IST). Rule-based ideas, not personal advice; exit day trades by 15:15.</div>`;
    L.querySelector('button').onclick=()=>L.classList.remove('on'); }
  bell.onclick=()=>{ paintBell(); L.classList.toggle('on'); };
  // a new day starts clean
  try{ Object.keys(localStorage).forEach(k=>{ if(/^jc_sig_(shown_)?\d{4}-/.test(k)&&k.indexOf(day())<0) localStorage.removeItem(k); }); }catch(e){}
  setTimeout(()=>{ const S=ld(SK(),{list:[]}); S.list.forEach(x=>{ if(Date.now()-x.t>=20*60000) shown.add(x.k); }); showNew(S); paintBell(S); },1500);
  setTimeout(scan,IS_WL?8000:4000); setInterval(scan,IS_WL?30000:60000);
  window.JCSIG={scan,pick,test:x=>{ const S=ld(SK(),{list:[],seen:{}}); const k='TEST'+Date.now(); S.list.unshift(Object.assign({k,t:Date.now(),s:'TESTCO',side:'BUY',en:100,sl:98.5,t1:101.5,t2:103.2,risk:1.5,room:3.2,rr:2.13,pace:2.4,ch:2.1,src:['Big Fish','Vol up breakout'],rank:1},x||{})); sv(SK(),S); showNew(S); }};
})();
