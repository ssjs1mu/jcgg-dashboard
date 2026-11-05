"""Market news + TV-channel trading calls, from public RSS feeds (fetched on the GitHub runner, no keys).
Writes $OUT (default data/news.json): {ts, news:[{t,title,src,link}], calls:[{t,ch,analyst,act,tg,sl,title,src,link}]}.
Channel calls are the headlines published about each channel's stock picks; analyst names are only taken from the headline text itself."""
import os, re, json, time, html, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from email.utils import parsedate_to_datetime
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept': 'application/rss+xml, text/xml, */*'}
def fetch(u):
    for a in range(2):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15).read()
        except Exception: time.sleep(1)
def parse(raw, default_src):
    out = []
    if not raw: return out
    try: root = ET.fromstring(raw)
    except Exception: return out
    for it in root.iter('item'):
        try:
            title = html.unescape((it.findtext('title') or '').strip()); link = (it.findtext('link') or '').strip(); pd = it.findtext('pubDate')
            src = default_src; se = it.find('source')
            if se is not None and (se.text or '').strip(): src = se.text.strip()
            if default_src.startswith('Google') and ' - ' in title:
                t0, s0 = title.rsplit(' - ', 1)
                if len(s0) < 40: title, src = t0.strip(), s0.strip()
            ts = int(parsedate_to_datetime(pd).timestamp()) if pd else 0
            if title and ts: out.append({'t': ts, 'title': title, 'src': src, 'link': link})
        except Exception: pass
    return out
def gnews(q): return 'https://news.google.com/rss/search?q=%s&hl=en-IN&gl=IN&ceid=IN:en' % urllib.parse.quote(q)
NEWS = [('Economic Times', 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms'), ('Moneycontrol', 'https://www.moneycontrol.com/rss/marketreports.xml'),
        ('Moneycontrol', 'https://www.moneycontrol.com/rss/latestnews.xml'), ('Mint', 'https://www.livemint.com/rss/markets'), ('Business Standard', 'https://www.business-standard.com/rss/markets-106.rss'),
        ('Google News', gnews('(Sensex OR Nifty OR "Bank Nifty") when:1d'))]
CH = {'Zee Business': ['"Zee Business" (buy OR sell OR target OR "stocks to buy") when:2d', 'zeebiz stocks to buy sell when:2d'],
      'CNBC Awaaz': ['"CNBC Awaaz" (buy OR sell OR target OR "stock picks") when:2d', 'CNBC Awaaz stocks to buy when:2d'],
      'NDTV Profit': ['"NDTV Profit" (buy OR sell OR target OR "stocks to buy") when:2d'],
      'CNBC-TV18': ['"CNBC-TV18" (buy OR sell OR target OR "stocks to buy") when:2d', 'cnbctv18 stocks to buy sell when:2d'],
      'ET Now': ['"ET Now" (buy OR sell OR target OR "stocks to buy") when:2d']}
KEY = {'Zee Business': r'zee ?business|zeebiz', 'CNBC Awaaz': r'cnbc[- ]?awaaz', 'NDTV Profit': r'ndtv ?profit', 'CNBC-TV18': r'cnbc[- ]?tv ?18|cnbctv18', 'ET Now': r'et ?now|etnow'}
SEED = ['Anil Singhvi','Sumeet Bagadia','Sudip Bandyopadhyay','Mitessh Thakkar','Prakash Gaba','Rajesh Palviya','Ashwani Gujral','Shrikant Chouhan','Kunal Shah','Jay Thakkar','Sandeep Jain','Vaishali Parekh','Chandan Taparia','Nooresh Merani','Ruchit Jain','Rohit Srivastava','Hrishikesh Yedve','Ajit Mishra','Vinay Rajani','Dharmesh Shah','Gaurav Ratnaparkhi','Aditya Agarwala','Shiju Koothupalackal','Vikas Jain','Jigar Patel','Amit Trivedi','Tejas Khoday','Siddharth Sedani','Dr VK Vijayakumar','Santosh Meena','Mustafa Nadeem','Anuj Gupta','Kranthi Bathini','Sachin Gupta','Sameet Chavan','Rahul Shah']
VERB = r'(?:recommends?|suggests?|picks?|bets?|advises?|says?|expects?|sees?|backs?|likes?|favou?rs?|prefers?|names?|tips?|eyes?|identifies|shares?|bullish on|bearish on)'
NAME = r"((?:Dr\.? )?[A-Z][a-zA-Z'\.]+(?: [A-Z][a-zA-Z'\.]+){1,2})"
BAD = re.compile(r'^(Stocks?|Buy|Sell|Top|Nifty|Sensex|Bank|Market|Markets|Trade|Trading|Share|Shares|Intraday|Today|Tomorrow|Zee|CNBC|NDTV|ET|India|Indian|Why|How|What|Here|These|This|The|Mid|Small|Large|Expert|Experts|Analyst|Analysts|Brokerage|Tata|HDFC|ICICI|Reliance|Adani|Bajaj|Axis|State|Kotak|Maruti|Mahindra|Infosys|Wipro)\b')
def analyst(title):
    for n in SEED:
        if n.lower() in title.lower(): return n
    for pat in (NAME + r'\s+' + VERB + r'\b', r'(?:\bby|[:|\-–]\s*)' + NAME + r'\s*(?:\||$|on (?:CNBC|ET Now|Zee|NDTV))', r'\bsays?\s+' + NAME, r'\b(?:on|from|with)\s+(?:CNBC[- ]?(?:TV ?18|Awaaz)|ET Now|Zee Business|NDTV Profit)[,:]?\s*' + NAME):
        m = re.search(pat, title)
        if m and not BAD.match(m.group(1)): return m.group(1).strip()
    return ''
def action(title):
    t = title.lower()
    if re.search(r'\bsell\b|short|bearish|exit|avoid|book profit', t): return 'SELL' if not re.search(r'\bbuy\b', t) else 'BUY/SELL'
    if re.search(r'\bbuy\b|accumulate|bullish|long|add\b|positive', t): return 'BUY'
    if re.search(r'\bhold\b|wait|neutral', t): return 'HOLD'
    return ''
def levels(title):
    m1 = re.search(r'target(?:s)?(?: price)?(?: of| at|:)?\s*(?:Rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)', title, re.I); m2 = re.search(r'(?:stop[- ]?loss|SL)(?: of| at|:)?\s*(?:Rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)', title, re.I)
    return (m1.group(1) if m1 else ''), (m2.group(1) if m2 else '')
jobs = [('news', s, u) for s, u in NEWS] + [('call', ch, gnews(q)) for ch, qs in CH.items() for q in qs]
with ThreadPoolExecutor(8) as ex: res = list(ex.map(lambda j: (j, fetch(j[2])), jobs))
now = time.time(); news = {}; calls = {}
for (kind, name, u), raw in res:
    items = parse(raw, name if kind == 'news' else 'Google News')
    for it in items:
        if now - it['t'] > 3 * 86400 or it['t'] > now + 3600: continue
        k = re.sub(r'\W+', '', it['title'].lower())[:80]
        if kind == 'news':
            if not re.search(r'nifty|sensex|stock|share|market|rupee|fii|rbi|ipo|earnings|results|crude|gold|dow|nasdaq|fed', it['title'], re.I): continue
            news.setdefault(k, it)
        else:
            blob = it['title'] + ' ' + it['link'] + ' ' + it['src']
            if not (re.search(KEY[name], blob, re.I) or re.search(KEY[name], it['src'], re.I)): continue
            a = action(it['title'])
            if not (a or re.search(r'pick|view|idea|recommend|target', it['title'], re.I)): continue
            tg, sl = levels(it['title'])
            calls.setdefault(k, dict(it, ch=name, analyst=analyst(it['title']), act=a, tg=tg, sl=sl))
news = sorted(news.values(), key=lambda x: -x['t'])[:80]; calls = sorted(calls.values(), key=lambda x: -x['t'])[:60]
print('feeds', len(jobs), 'news', len(news), 'calls', len(calls), 'with analyst', sum(1 for c in calls if c['analyst']))
if not news and not calls: raise SystemExit('nothing fetched - keeping the previous file')
json.dump({'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'news': news, 'calls': calls}, open(os.environ.get('OUT', 'data/news.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
