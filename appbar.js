/* Joshi's Corner - ⟳ app refresh button (Android app only, every page).
   The app shows the LIVE site, so a refresh is all it takes to get the latest version - no reinstall.
   Top-right corner; glows "Update" when a newer build has been published since this page opened (version.json, checked every 5 min).
   Click = clear this page's cached copies and reload it fresh. */
(function(){
  if(window.top!==window||window.JCAPPBAR) return; window.JCAPPBAR=1;
  var inApp=/JoshisCornerApp/.test(navigator.userAgent)||/[?&]app=1/.test(location.search); if(!inApp) return;
  var B0=null, b=document.createElement('button'); b.type='button'; b.id='jcRef'; b.title='Refresh - load the latest version of the app'; b.innerHTML='<span>⟳</span><i>Refresh</i>';
  var st=document.createElement('style'); st.textContent='#jcRef{all:unset;box-sizing:border-box;position:fixed;top:6px;right:6px;z-index:2147483000;display:flex;align-items:center;gap:5px;height:30px;padding:0 10px;border-radius:15px;background:#1a1408;border:1.5px solid #e0cd96;color:#e0cd96;font:800 12px Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.45);-webkit-tap-highlight-color:transparent}#jcRef span{font-size:16px;line-height:1}#jcRef i{font-style:normal}#jcRef.spin span{animation:jcR .7s linear infinite}@keyframes jcR{to{transform:rotate(360deg)}}#jcRef.new{background:#f2c14e;color:#1a1030;border-color:#fff;animation:jcRn 1s ease-in-out infinite}@keyframes jcRn{50%{box-shadow:0 0 0 4px rgba(242,193,78,.45),0 0 18px #f2c14e}}@media(max-width:560px){#jcRef i{display:none}#jcRef{padding:0 8px}}';
  function mount(){ document.head.appendChild(st); document.body.appendChild(b); }
  if(document.body) mount(); else addEventListener('DOMContentLoaded',mount);
  function ver(){ return fetch('version.json?x='+Date.now(),{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){ return j.build; }).catch(function(){ return null; }); }
  ver().then(function(v){ B0=v; });
  setInterval(function(){ if(document.hidden) return; ver().then(function(v){ if(v&&B0&&v!==B0){ b.classList.add('new'); b.querySelector('i').textContent='Update'; b.title='A newer version ('+v+') is out - tap to load it'; } }); },300000);
  b.addEventListener('click',function(){ b.classList.add('spin');
    var done=function(){ var u=new URL(location.href); u.searchParams.set('_r',Date.now()); if(!u.searchParams.has('app')) u.searchParams.set('app','1'); location.replace(u.toString()); };
    try{ (window.caches?caches.keys().then(function(k){ return Promise.all(k.map(function(x){ return caches.delete(x); })); }):Promise.resolve()).then(done,done); }catch(e){ done(); } });
})();
