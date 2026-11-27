"""One-off probe (4): do Chittorgarh sitemaps list the IPO pages? Writes nothing."""
import re, gzip, urllib.request, urllib.error
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip'}), timeout=40); b = r.read()
        if r.headers.get('Content-Encoding') == 'gzip' or b[:2] == b'\x1f\x8b': b = gzip.decompress(b)
        return r.status, b.decode('utf-8', 'replace')
    except urllib.error.HTTPError as e: return e.code, ''
    except Exception as e: return 0, str(e)
s, t = get('https://www.chittorgarh.com/sitemap.xml'); S = re.findall(r'<loc>(.*?)</loc>', t); print('sitemaps', len(S))
for u in S:
    s, x = get(u); U = re.findall(r'<loc>(.*?)</loc>', x); ipo = [v for v in U if re.search(r'/ipo/[^/]+/\d+/?$', v)]
    print(u, s, 'urls', len(U), 'ipo pages', len(ipo), ipo[:2], [v for v in ipo if 'lic-ipo' in v or 'life-insurance' in v][:2])
