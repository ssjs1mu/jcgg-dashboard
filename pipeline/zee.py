"""Find the Zee Business programme stream that is live RIGHT NOW.
Rules (view counts are ignored): the streams-tab tile must show "N watching" (not "Streamed ... ago"), the watch page must say
"Started streaming N minutes/hours ago" (today's start - an old link says "Started streaming on 25 Oct 2026" and is rejected),
and among those the most recently STARTED programme wins. Writes $OUT: {ts,id,title,started_min_ago,candidates}."""
import os, re, json, urllib.request
from datetime import datetime, timezone, timedelta
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Cookie': 'SOCS=CAI; CONSENT=YES+cb', 'Accept-Language': 'en-IN,en;q=0.9'}
def get(u):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=20).read().decode('utf8', 'ignore')
    except Exception as e: print('fail', u[:80], e); return ''
h = get('https://www.youtube.com/channel/UCkXopQ3ubd-rnXnStZqCl2w/streams')
pos = [m.start() for m in re.finditer(r'"lockupViewModel":\{', h)] + [len(h)]
cands = []
for i in range(len(pos) - 1):
    seg = h[pos[i]:min(pos[i + 1], pos[i] + 9000)]; cid = re.search(r'i\.ytimg\.com/vi/([\w-]{11})/', seg)
    if cid and re.search(r'[\d.,]+[KkMm]? watching', seg) and not re.search(r'Streamed [^"]{0,20} ago', seg):
        t = re.search(r'"title":\{"content":"((?:[^"\\]|\\.)*)"', seg); cands.append((cid.group(1), t.group(1) if t else ''))
PROG = re.compile(r'zee business|share market|first trade|market live|anil singhvi|closing bell|market radar|stock market', re.I)
ok = []
for vid, title in cands[:12]:
    w = get('https://www.youtube.com/watch?v=' + vid); m = re.search(r'"dateText":\{"simpleText":"Started streaming (\d+) (minute|hour|day)s? ago"\}', w)
    if not m: print('reject (no fresh start)', vid, title[:50]); continue
    emb = bool(re.search(r'"playableInEmbed":true', w))
    if not emb: print('reject (embedding disabled)', vid, title[:50]); continue
    age = int(m.group(1)) * {'minute': 1, 'hour': 60, 'day': 1440}[m.group(2)]
    if age > 14 * 60: print('reject (too old)', vid, age, title[:50]); continue
    ok.append({'id': vid, 'title': title[:90], 'started_min_ago': age, 'prog': bool(PROG.search(title))}); print('LIVE', vid, age, 'min', title[:60])
pool = [c for c in ok if c['prog']] or ok
pick = sorted(pool, key=lambda c: c['started_min_ago'])[:1]
out = {'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'id': pick[0]['id'] if pick else '', 'title': pick[0]['title'] if pick else '', 'started_min_ago': pick[0]['started_min_ago'] if pick else None, 'candidates': ok}
print('picked', out['id'], out['title'])
json.dump(out, open(os.environ.get('OUT', 'data/zee.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
