"""One-off probe (3): how to list Chittorgarh IPO page addresses (slug/id) for past years. Writes nothing."""
import re, gzip, html, urllib.request, urllib.error
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip', 'Accept-Language': 'en-IN,en;q=0.9'}), timeout=30); b = r.read()
        if r.headers.get('Content-Encoding') == 'gzip': b = gzip.decompress(b)
        return r.status, b.decode('utf-8', 'replace')
    except urllib.error.HTTPError as e: return e.code, ''
    except Exception as e: return 0, str(e)
def links(t): return sorted(set(re.findall(r'/ipo/[a-z0-9-]+/\d+/', t.replace('\\/', '/'))))
for u in ['https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/?year=2022',
          'https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/2022/',
          'https://www.chittorgarh.com/report/mainboard-ipo-list-in-india-bse-nse/83/?year=2022',
          'https://www.chittorgarh.com/report/ipo-list-in-india-main-board-sme/82/2022/',
          'https://www.chittorgarh.com/sitemap.xml', 'https://www.chittorgarh.com/sitemap_ipo.xml', 'https://www.chittorgarh.com/robots.txt',
          'https://www.chittorgarh.com/ipo/lic-ipo/1236/']:
    s, t = get(u); L = links(t); print('\n', u, '->', s, len(t), 'ipo links', len(L), L[:3], '| LIC' if re.search(r'lic-ipo|Life Insurance Corporation', t) else '')
    if 'robots' in u or 'sitemap' in u: print('   ', re.sub(r'\s+', ' ', t[:500]))
    m = re.search(r'<title>(.*?)</title>', t, re.S); print('   title:', m and html.unescape(m.group(1)).strip()[:100])
s, t = get('https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/')
F = ''.join(re.findall(r'self\.__next_f\.push\(\[\d+,"(.*?)"\]\)', t, re.S)).replace('\\"', '"').replace('\\/', '/')
print('\nflight len', len(F), 'ipo links in flight', len(links(F)), 'has year option', bool(re.search(r'2022', F)))
for m in list(re.finditer(r'"(?:year|financialYear|fy|api|url|endpoint)[A-Za-z]*":"[^"]{0,120}"', F))[:12]: print('  ', m.group(0))
print('urls with api:', sorted(set(re.findall(r'https?://[^"\\ ]*(?:api|json|data)[^"\\ ]*', F)))[:8])
