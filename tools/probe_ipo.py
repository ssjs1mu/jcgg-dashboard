"""One-off probe: can the GitHub runner read IPO details from Chittorgarh / BSE? Prints status, size and where 'discount' appears. Writes nothing."""
import re, sys, gzip, urllib.request, urllib.error
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
def get(url, ref=None):
    h = {'User-Agent': UA, 'Accept': 'text/html,application/json,*/*', 'Accept-Language': 'en-IN,en;q=0.9', 'Accept-Encoding': 'gzip'}
    if ref: h['Referer'] = ref
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=30); b = r.read()
        if r.headers.get('Content-Encoding') == 'gzip': b = gzip.decompress(b)
        return r.status, b.decode('utf-8', 'replace')
    except urllib.error.HTTPError as e: return e.code, (e.read() or b'').decode('utf-8', 'replace')[:300]
    except Exception as e: return 0, str(e)[:200]
def show(tag, url, ref=None, pat=r'discount'):
    s, t = get(url, ref); print('\n==', tag, url, '-> status', s, 'len', len(t))
    for m in list(re.finditer(pat, t, re.I))[:6]: print('   ..', re.sub(r'\s+', ' ', t[max(0, m.start() - 120):m.end() + 160]))
    if s != 200 or not re.search(pat, t, re.I): print('   head:', re.sub(r'\s+', ' ', t[:300]))
    return t
t = show('chittorgarh list', 'https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/', pat=r'LIC|Life Insurance')
lk = re.findall(r'href="(https://www\.chittorgarh\.com/ipo/[^"]*lic[^"]*)"', t, re.I) or re.findall(r'href="(/ipo/[^"]*lic[^"]*)"', t, re.I)
print('LIC links', lk[:5])
for u in lk[:1]:
    u = u if u.startswith('http') else 'https://www.chittorgarh.com' + u
    show('chittorgarh LIC page', u, pat=r'discount|reserv|lot size|price band')
show('chittorgarh guess', 'https://www.chittorgarh.com/ipo/lic-ipo/492/', pat=r'discount')
for u in ['https://api.bseindia.com/BseIndiaAPI/api/GetIPOIssuePrice/w?Type=P',
          'https://api.bseindia.com/BseIndiaAPI/api/IPOIssuesAPI/w?ipoStatus=C&Category=MB',
          'https://api.bseindia.com/BseIndiaAPI/api/GetIpoIssueList/w?fromDate=20220501&toDate=20220531&Type=P',
          'https://www.bseindia.com/markets/publicIssues/IPOIssues_new.aspx?id=1&Type=p']:
    show('bse', u, ref='https://www.bseindia.com/', pat=r'LIC|Life Insurance|discount')
