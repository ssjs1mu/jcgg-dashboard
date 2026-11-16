/* Joshi's Corner - 📊 call performance by period (today / week / month / YTD / all) and by trigger.
   Used by the HNT tracker (Watchlist) and the Tomorrow's Calls page. Input: hntrack.json trades.
   A call with several triggers counts under each of them (so the trigger rows can add up to more than the source total). */
(function(){
  const SRC={HNT:['💎','High Net-worth Trade'],IM:['🌐','Index-movers day trade'],PLAN:['📅','Next-day plan']};
  const PLANF=[[/closed near the/i,'Closing strength'],[/^volume/i,'Volume surge'],[/1-month high/i,'1-month high breakout'],[/1-month low/i,'1-month low breakdown'],[/52-week high/i,'Near 52-week high'],[/52-week low/i,'Near 52-week low'],
    [/^RSI/i,'RSI in zone'],[/Big Fish|Tail Fish/i,'Big Fish / Tail Fish'],[/Open = (Low|High)/i,'Open = Low / High'],[/money (flowing in|leaving)/i,'Sector money flow'],
    [/Sector leader|Sector laggard|Index heavyweight|Quality bounce/i,'Index-mover call'],[/EMA 9/i,'EMA 9 / 21 trend'],[/% today/i,'Day move ≥ 1%']];
  function triggers(t){ const k=t.src_kind||'HNT', src=t.src||[];
    if(k==='PLAN'){ const s=new Set(); src.forEach(w=>{ const f=PLANF.find(([re])=>re.test(w)); if(f) s.add(f[1]); }); return [...s]; }
    return [...new Set(src.map(x=>String(x).replace(/^Watchlist (BUY|SELL).*/,'Watchlist call')))]; }
  const ist=()=>new Date(Date.now()+19800000), today=()=>ist().toISOString().slice(0,10);
  function range(p){ const t=today(), d=new Date(t+'T00:00:00Z');
    if(p==='day') return [t,t]; if(p==='week'){ const w=(d.getUTCDay()+6)%7; return [new Date(d-w*864e5).toISOString().slice(0,10),t]; }
    if(p==='month') return [t.slice(0,7)+'-01',t]; if(p==='ytd') return [t.slice(0,4)+'-01-01',t]; return ['0000',t]; }
  function stats(L){ const c=L.filter(t=>t.status!=='OPEN'&&t.ret!=null), o=L.filter(t=>t.status==='OPEN'), win=c.filter(t=>t.ret>0), tg=c.filter(t=>t.status==='TARGET'), sl=c.filter(t=>t.status==='STOP');
    const net=c.reduce((a,t)=>a+t.ret,0), mins=c.filter(t=>t.mins!=null);
    return {n:L.length,closed:c.length,open:o.length,tg:tg.length,sl:sl.length,t1:L.filter(t=>t.t1_hit).length,wr:c.length?win.length/c.length*100:null,avg:c.length?net/c.length:null,net,
      best:c.length?Math.max(...c.map(t=>t.ret)):null,worst:c.length?Math.min(...c.map(t=>t.ret)):null,mtm:o.reduce((a,t)=>a+(t.ret||0),0),dur:mins.length?Math.round(mins.reduce((a,t)=>a+t.mins,0)/mins.length):null}; }
  const pc=v=>v==null?'–':`<span style="color:${v>=0?'#35f0a8':'#ff6b9d'}">${v>=0?'+':''}${v.toFixed(2)}%</span>`;
  const dur=m=>m==null?'–':m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' m';
  const css=`.jp{margin:6px 0 10px;border:1px solid #2d4260;border-radius:12px;background:#0f1a2b;padding:8px 10px}.jp .jh{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:6px}
   .jp .jh b{color:#e0cd96;font:800 14px Inter,Arial}.jp .jh button{border:1px solid #3a5476;background:#13213a;color:#e8eef8;border-radius:999px;padding:3px 11px;font:800 11.5px Inter,Arial;cursor:pointer}.jp .jh button.on{background:#e0cd96;color:#1a1030;border-color:#e0cd96}
   .jp .jh .mu{color:#9fb0c6;font:600 11px Inter,Arial}.jp table{width:100%;border-collapse:collapse;font:700 12px ui-monospace,Consolas,monospace}.jp th{position:sticky;top:0;background:#1a2b45;color:#c9d4e3;font:800 10px Inter,Arial;letter-spacing:.04em;text-transform:uppercase;padding:4px 6px;text-align:right;white-space:nowrap}
   .jp th:first-child,.jp td:first-child{text-align:left}.jp td{padding:3px 6px;text-align:right;border-bottom:1px solid #1d2c44;white-space:nowrap}.jp tr.src td{background:#16243a;font:900 12.5px Inter,Arial;color:#fff;border-top:2px solid #2d4260}
   .jp tr.sub td:first-child{padding-left:22px;font:700 12px Inter,Arial;color:#d9e2ee}.jp .star{color:#e0cd96}.jp .wk{color:#ff8fb8}.jp .wrap{overflow:auto;max-height:520px}.jp .nt{color:#9fb0c6;font:11.5px/1.45 Inter,Arial;margin-top:6px}
   .jp tr.ck{cursor:pointer}.jp tr.ck:hover td{background:#22385a}
   #jpDrill{position:fixed;inset:0;z-index:2147482500;background:rgba(3,8,16,.72);display:none;align-items:flex-start;justify-content:center;padding:4vh 10px;overflow:auto}#jpDrill.on{display:flex}
   #jpDrill .jpc{position:relative;width:min(1150px,100%);background:#0f1a2b;border:1px solid #e0cd96;border-radius:14px;padding:12px 14px;box-shadow:0 20px 50px rgba(0,0,0,.6);color:#eef3fb;font:12.5px Inter,Arial,sans-serif}
   #jpDrill .jpx{position:absolute;top:8px;right:10px;border:0;background:#d81f26;color:#fff;border-radius:999px;width:30px;height:30px;font:900 14px Arial;cursor:pointer}
   #jpDrill .jpt{font:900 15px Inter,Arial;color:#e0cd96;padding-right:40px;margin-bottom:8px}#jpDrill .jpt>span{display:block;font:600 12px Inter,Arial;color:#c9d4e3;margin-top:3px}
   #jpDrill .jpw{max-height:72vh;overflow:auto}#jpDrill table{width:100%!important;min-width:0!important;border-collapse:collapse;table-layout:auto!important}#jpDrill th{position:sticky;top:0;background:#1a2b45;color:#c9d4e3;font:800 10px Inter,Arial;text-transform:uppercase;padding:4px 6px;text-align:left;width:auto!important}
   #jpDrill td{padding:3px 6px;border-bottom:1px solid #1d2c44;font:700 12px ui-monospace,Consolas,monospace;white-space:nowrap;width:auto!important;text-align:left;overflow:visible!important}#jpDrill tr.dh td{background:#16243a;color:#e0cd96;font:900 12px Inter,Arial;padding-top:6px}
   .jp .wr{display:inline-block;height:6px;border-radius:3px;background:#35f0a8;vertical-align:middle;margin-left:4px}`;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
  let PER=(()=>{ try{ return localStorage.getItem('jc_perf_p')||'month'; }catch(e){ return 'month'; } })();
  const RES={TARGET:['🎯 Target','#35f0a8'],STOP:['🛑 Stop-loss','#ff6b9d'],EXPIRED:['⌛ Expired','#c9d4e3'],OPEN:['● Open','#f2c14e']};
  function drill(title,X,a,b){ let m=document.getElementById('jpDrill'); if(!m){ m=document.createElement('div'); m.id='jpDrill'; document.body.appendChild(m); m.addEventListener('click',e=>{ if(e.target===m||e.target.closest('.jpx')) m.classList.remove('on'); }); document.addEventListener('keydown',e=>{ if(e.key==='Escape') m.classList.remove('on'); }); }
    const days=[...new Set(X.map(t=>t.date))].sort().reverse(), S=stats(X);
    const by=days.map(dte=>{ const Y=X.filter(t=>t.date===dte).sort((p,q)=>(q.ts||0)-(p.ts||0)), Sd=stats(Y);
      return `<tr class="dh"><td colspan="11">${dte} · ${Y.length} call${Y.length>1?'s':''} · 🎯 ${Sd.tg} · 🛑 ${Sd.sl} · open ${Sd.open} · day net ${Sd.closed?pc(Sd.net):'–'}</td></tr>`+Y.map(t=>{ const r=t.dayend?['⏹ Day end 15:15','#c9d4e3']:RES[t.status]||['–','#fff'], px=t.status==='OPEN'?t.last:t.exit;
        return `<tr><td>${t.time||''}</td><td><b>${t.s}</b></td><td style="color:${t.side==='BUY'?'#35f0a8':'#ff6b9d'}">${t.side}</td><td>${SRC[t.src_kind||'HNT'][0]}</td><td>${fx2(t.entry)}</td><td>${fx2(t.stop)}</td><td>${fx2(t.target)}</td><td style="color:${r[1]}">${r[0]}</td><td>${fx2(px)}</td><td><b>${pc(t.ret)}</b></td><td>${dur(t.mins)}${t.days?' · '+t.days+' d':''}</td></tr>`; }).join(''); }).join('');
    m.innerHTML=`<div class="jpc"><button class="jpx" title="Close">✕</button><div class="jpt">${title} <span>${a.replace('0000','start')} → ${b} · ${X.length} calls · 🎯 ${S.tg} · 🛑 ${S.sl} · win ${S.wr==null?'–':S.wr.toFixed(0)+'%'} · net ${S.closed?pc(S.net):'–'} · open ${S.open} (${pc(S.mtm)})</span></div>
      <div class="jpw"><table><thead><tr><th>Time</th><th>Stock</th><th>Side</th><th>Src</th><th>Entry</th><th>Exit / SL</th><th>Target</th><th>Result</th><th>Exit / now</th><th>Return</th><th>Duration</th></tr></thead><tbody>${by||'<tr><td colspan="11">No calls</td></tr>'}</tbody></table></div></div>`;
    m.classList.add('on'); }
  const fx2=v=>v==null||!isFinite(v)?'–':Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
  window.jcPerf=function(el,trades,opt){ opt=opt||{}; const kinds=opt.sources||['HNT','IM','PLAN'];
    const draw=()=>{ const BK=[]; const keep=(lab,X)=>{ BK.push([lab,X]); return BK.length-1; }; const [a,b]=range(PER), L=(trades||[]).filter(t=>t.date>=a&&t.date<=b&&kinds.includes(t.src_kind||'HNT'));
      const row=(label,S,cls,mark,X)=>`<tr class="${cls} ck" data-bk="${keep(label.replace(/<[^>]+>/g,''),X||[])}" title="Click for day-wise and stock-wise detail"><td>${label}${mark||''}</td><td>${S.n}</td><td>${S.closed}</td><td>${S.tg}</td><td>${S.sl}</td><td>${S.t1||'–'}</td><td>${S.wr==null?'–':S.wr.toFixed(0)+'%<span class="wr" style="width:'+Math.round(S.wr/2.5)+'px"></span>'}</td><td>${pc(S.avg)}</td><td><b>${pc(S.closed?S.net:null)}</b></td><td>${pc(S.best)}</td><td>${pc(S.worst)}</td><td>${dur(S.dur)}</td><td>${S.open?S.open+' · '+pc(S.mtm):'–'}</td></tr>`;
      let body='';
      kinds.forEach(k=>{ const LK=L.filter(t=>(t.src_kind||'HNT')===k); if(!LK.length&&kinds.length>1){ body+=row(SRC[k][0]+' '+SRC[k][1],stats([]),'src'); return; }
        body+=row(SRC[k][0]+' '+SRC[k][1],stats(LK),'src','',LK);
        ['BUY','SELL'].forEach(sd=>{ const X=LK.filter(t=>t.side===sd); if(X.length) body+=row(SRC[k][0]+' All '+sd,stats(X),'sub','',X); });
        const T={}; LK.forEach(t=>triggers(t).forEach(g=>(T[g]=T[g]||[]).push(t)));
        const R=Object.entries(T).map(([g,X])=>[g,stats(X)]).sort((x,y)=>(y[1].closed?y[1].net:-1e9)-(x[1].closed?x[1].net:-1e9)||y[1].n-x[1].n);
        const withC=R.filter(r=>r[1].closed>=1), top=withC.length>1?withC[0][0]:null, bot=withC.length>1?withC[withC.length-1][0]:null;
        R.forEach(([g,S])=>{ body+=row(g,S,'sub',g===top&&S.net>0?' <span class="star" title="Best trigger in this period">★ best</span>':g===bot&&S.net<0?' <span class="wk" title="Weakest trigger in this period">▼ weakest</span>':'',T[g]); }); });
      el.innerHTML=`<div class="jp"><div class="jh"><b>📊 Performance by trigger</b>${[['day','Today'],['week','This week'],['month','This month'],['ytd','YTD'],['all','All']].map(([k,l])=>`<button type="button" data-pp="${k}" class="${k===PER?'on':''}">${l}</button>`).join('')}<span class="mu">${a===b?a:a.replace('0000','start')+' → '+b} · ${L.length} call${L.length===1?'':'s'}</span></div>
       <div class="wrap"><table><thead><tr><th>Source / trigger</th><th>Calls</th><th>Closed</th><th>🎯 Target</th><th>🛑 SL</th><th>T1 hit</th><th>Win %</th><th>Avg / call</th><th>Net</th><th>Best</th><th>Worst</th><th>Avg time</th><th>Open · MTM</th></tr></thead><tbody>${body}</tbody></table></div>
       <div class="jh" style="margin-top:10px"><b>📅 Day-wise</b><span class="mu">click a day for every stock that day</span></div>
       <div class="wrap" style="max-height:340px"><table><thead><tr><th>Date</th>${kinds.map(k=>`<th>${SRC[k][0]} calls</th><th>${SRC[k][0]} net</th>`).join('')}<th>All calls</th><th>Closed</th><th>🎯</th><th>🛑</th><th>Win %</th><th>Day net</th><th>Open · MTM</th></tr></thead><tbody>${
        [...new Set(L.map(t=>t.date))].sort().reverse().map(dte=>{ const X=L.filter(t=>t.date===dte), S=stats(X);
          return `<tr class="ck" data-bk="${keep(dte,X)}"><td>${dte}</td>${kinds.map(k=>{ const Y=X.filter(t=>(t.src_kind||'HNT')===k), Sy=stats(Y); return `<td>${Y.length||'–'}</td><td>${Sy.closed?pc(Sy.net):'–'}</td>`; }).join('')}<td>${S.n}</td><td>${S.closed}</td><td>${S.tg}</td><td>${S.sl}</td><td>${S.wr==null?'–':S.wr.toFixed(0)+'%'}</td><td><b>${S.closed?pc(S.net):'–'}</b></td><td>${S.open?S.open+' · '+pc(S.mtm):'–'}</td></tr>`; }).join('')||'<tr><td colspan="20">No calls in this period</td></tr>'}</tbody></table></div>
       <div class="nt">Closed calls only for win %, average and net (open calls shown separately as mark-to-market). Win % = closed in profit. A call with several triggers counts under each of them, so trigger rows can add up to more than the source total. ★ best / ▼ weakest = highest / lowest net among the triggers with closed calls in this period - focus on what keeps showing ★ and tighten or drop what keeps showing ▼.</div></div>`;
      el.querySelectorAll('[data-bk]').forEach(tr=>tr.onclick=()=>drill(BK[+tr.dataset.bk][0],BK[+tr.dataset.bk][1],a,b));
      el.querySelectorAll('[data-pp]').forEach(btn=>btn.onclick=()=>{ PER=btn.dataset.pp; try{ localStorage.setItem('jc_perf_p',PER); }catch(e){} draw(); }); };
    draw(); };
})();
