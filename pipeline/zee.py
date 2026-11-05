"""Find the Zee Business programme stream that is live RIGHT NOW (verified by YouTube's own live flag + start date/time, never by view count).
Writes $OUT (default data/zee.json): {ts, id, title, start, candidates:[...]}."""
import os, re, json, time, urllib.request
from datetime import datetime, timezone, timedelta
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Cookie': 'SOCS=CAI; CONSENT=YES+cb', 'Accept-Language': 'en-IN,en;q=0.9'}
def get(u):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20).read().decode('utf8', 'ignore')
    except Exception as e: print('fail', u[:80], e); return ''
IST = timezone(timedelta(hours=5, minutes=30)); now = datetime.now(IST); today = now.date()
h = get('https://www.youtube.com/channel/UCkXopQ3ubd-rnXnStZqCl2w/streams')
pos = [m.start() for m in re.finditer(r'"lockupViewModel":\{', h)] + [len(h)]
cands = []
for i in range(len(pos) - 1):
    seg0 = h[pos[i]:min(pos[i + 1], pos[i] + 9000)]; print('LK', re.findall(r'[\d.,KkMm]+ watching|[\d.,KkMm]+ views|Streamed [^"]{0,25}|Started [^"]{0,25}|Scheduled [^"]{0,25}', seg0)[:3], (re.search(r'i\.ytimg\.com/vi/([\w-]{11})/', seg0) or [0,''])[1])
    seg = h[pos[i]:min(pos[i + 1], pos[i] + 9000)]; cid = re.search(r'i\.ytimg\.com/vi/([\w-]{11})/', seg)
    if cid and 'THUMBNAIL_OVERLAY_BADGE_STYLE_LIVE' in seg[:3000]:
        t = re.search(r'"title":\{"content":"((?:[^"\\]|\\.)*)"', seg); cands.append((cid.group(1), (t.group(1) if t else '')))
PROG = re.compile(r'zee business (24x7 )?live|share market live|first trade|market live|anil singhvi|closing bell|stock market', re.I)
ok = []
for vid, title in cands[:12]:
    w = get('https://www.youtube.com/watch?v=' + vid)
    print('DBG3', vid, re.findall(r'"(?:publishDate|uploadDate|dateText|startDate|liveBroadcastDetails)":(?:"[^"]*"|\{[^}]{0,120}\})', w)[:4], re.findall(r'Started streaming[^"]{0,30}|Streaming started[^"]{0,30}|Premiered[^"]{0,30}|Streamed live[^"]{0,30}', w)[:2])
    print('DBG2', vid, 'lbd' , 'liveBroadcastDetails' in w, 'watching' in w, re.findall(r'[\d.,KkMm]+ watching now|Started streaming [^"]{0,30}|Streamed live [^"]{0,30}|Scheduled for [^"]{0,30}', w)[:3])
    print('DBG', vid, len(w), re.findall(r'"(?:isLiveNow|isLive|isUpcoming|startTimestamp|endTimestamp|isLiveContent)":(?:"[^"]*"|\w+)', w)[:8])
    live = re.search(r'"isLiveNow":true', w); st = re.search(r'"startTimestamp":"([^"]+)"', w); en = re.search(r'"endTimestamp":"', w)
    if not live or en or not st: print('skip', vid, 'live' if live else 'not live', title[:50]); continue
    try: start = datetime.fromisoformat(st.group(1)).astimezone(IST)
    except Exception: continue
    if start.date() != today and (now - start) > timedelta(hours=14): print('skip old start', vid, start); continue   # must have started today (or within the last 14 h for an overnight 24x7 stream)
    prog = bool(PROG.search(title)); ok.append({'id': vid, 'title': title[:90], 'start': start.isoformat(), 'prog': prog}); print('LIVE', vid, start.strftime('%d %b %H:%M'), prog, title[:60])
pick = sorted([c for c in ok if c['prog']] or ok, key=lambda c: c['start'], reverse=True)[:1]
out = {'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'id': pick[0]['id'] if pick else '', 'title': pick[0]['title'] if pick else '', 'start': pick[0]['start'] if pick else '', 'candidates': ok}
print('picked', out['id'], out['title'])
json.dump(out, open(os.environ.get('OUT', 'data/zee.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
