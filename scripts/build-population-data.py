"""Download a local JPL reference snapshot with Python's standard library only."""
import datetime
import json
import pathlib
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = (pathlib.Path(__file__).resolve().parents[1] / "site")
SATELLITES = 'https://ssd.jpl.nasa.gov/sats/elem/'
FIELDS = 'full_name,epoch,a,e,i,om,w,ma,n'

class SatelliteTable(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.cell = None
        self.row = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        if tag == 'table' and dict(attrs).get('id') == 'sat_elem':
            self.active = True
        if self.active and tag == 'tr':
            self.row = []
        if self.active and tag == 'td':
            self.cell = []

    def handle_data(self, text):
        if self.cell is not None:
            self.cell.append(text)

    def handle_endtag(self, tag):
        if self.active and tag == 'td' and self.cell is not None:
            self.row.append(''.join(self.cell).strip())
            self.cell = None
        if self.active and tag == 'tr' and self.row:
            self.rows.append(self.row)
        if self.active and tag == 'table':
            self.active = False


def download(url):
    with urllib.request.urlopen(url, timeout=60) as response:
        return response.read().decode()


def build():
    parser = SatelliteTable()
    parser.feed(download(SATELLITES))
    satellites = []
    for c in parser.rows:
        if c[1] == 'Pluto':
            continue  # This workspace currently models the eight planets.
        def number(index):
            return float(c[index]) if c[index] and c[index] != '-' else None
        satellites.append(dict(host=c[1], name=c[2], code=c[3], frame=c[5], epoch=c[6],
                               a=number(7), e=number(8), w=number(9), M=number(10),
                               i=number(11), node=number(12), period=number(13),
                               poleRa=number(16), poleDec=number(17)))
    small = []
    for kind in ['a', 'c']:
        args = dict(**{'sb-kind': kind, 'fields': FIELDS})
        if kind == 'a':
            args.update({'sb-class': 'MBA', 'limit': '1200', 'sort': 'H', 'full-prec': 'true',
                         'sb-cdata': json.dumps({'AND': ['H|LT|12']})})
        else:
            args.update({'limit': '12', 'sb-cdata': json.dumps({'AND': ['e|LT|1', 'a|GT|0']})})
        url = 'https://ssd-api.jpl.nasa.gov/sbdb_query.api?' + urllib.parse.urlencode(args)
        payload = json.loads(download(url))
        for row in payload['data']:
            item = dict(zip(payload['fields'], row))
            try:
                body = {key: float(item[key]) for key in ['epoch', 'a', 'e', 'i', 'om', 'w', 'ma', 'n']}
            except (ValueError, TypeError):
                continue
            if not (0 <= body['e'] < 1 and body['a'] > 0 and body['n'] > 0):
                continue
            body.update(kind=kind, name=item['full_name'].strip())
            small.append(body)
    result = dict(retrieved=datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
                  satelliteSource=SATELLITES, smallBodySource='https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html',
                  satellites=satellites, smallBodies=small)
    path = ROOT / 'space/assets/population.json'
    path.write_text(json.dumps(result, separators=(',', ':')) + '\n')
    print(f'{len(satellites)} satellite rows; {len(small)} small bodies; {path.stat().st_size} bytes')

if __name__ == '__main__':
    build()
