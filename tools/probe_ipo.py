"""One-off probe (2): what does a Chittorgarh IPO page carry for a runner? Prints title, links and the discount / reservation text. Writes nothing."""
import re, gzip, html, urllib.request, urllib.error
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def get(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Encoding': 'gzip', 'Accept-Language': 'en-IN,en;q=0.9'}), timeout=30); b = r.read()
        if r.headers.get('Content-Encoding') == 'gzip': b = gzip.decompress(b)
        return r.status, b.decode('utf-8', 'replace')
    except urllib.error.HTTPError as e: return e.code, ''
    except Exception as e: return 0, str(e)
def txt(t): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>', ' ', t, flags=re.S)))
s, t = get('https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/')
L = sorted(set(re.findall(r'/ipo/[a-z0-9-]+/\d+/', t)))
print('list status', s, 'ipo links in html', len(L), L[:8]); print('rsc/next data present:', '__NEXT_DATA__' in t, 'self.__next_f' in t)
for m in list(re.finditer(r'lic-ipo|Life Insurance', t))[:3]: print('  LIC ctx:', t[max(0, m.start() - 100):m.end() + 100].replace('\n', ' '))
s, t = get('https://www.chittorgarh.com/ipo/lic-ipo/492/')
print('\nguess page', s, len(t)); m = re.search(r'<title>(.*?)</title>', t, re.S); print('title:', m and html.unescape(m.group(1)).strip())
T = txt(t)
for k in ['Discount', 'Reservation', 'Lot Size', 'Price Band', 'Issue Price', 'Face Value']:
    for m in list(re.finditer(k, T))[:2]: print('  [%s] ...%s' % (k, T[max(0, m.start() - 60):m.end() + 140]))
print('tables:', t.count('<table'))
