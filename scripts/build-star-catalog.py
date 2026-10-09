"""Extract a small, attributed J2000 reference sky from HYG 4.1 (CC BY-SA 4.0)."""
import csv, io, json, math, pathlib, urllib.request
SOURCE = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv'
DESTINATION = pathlib.Path(__file__).resolve().parents[1] / 'space/assets/stars.json'
rows = []
with urllib.request.urlopen(SOURCE, timeout=60) as response:
    for star in csv.DictReader(io.TextIOWrapper(response, encoding='utf-8')):
        if star['id'] == '0':
            continue  # The Sun is rendered by the existing solar-system model.
        try:
            ra, dec, magnitude = map(float, (star['ra'], star['dec'], star['mag']))
            bv = float(star['ci']) if star['ci'] else None
        except (ValueError, KeyError):
            continue
        if not all(math.isfinite(v) for v in (ra, dec, magnitude)) or not (0 <= ra < 24 and -90 <= dec <= 90 and magnitude <= 6.5):
            continue
        if bv is not None and not math.isfinite(bv):
            bv = None
        rows.append([round(ra, 6), round(dec, 6), round(magnitude, 3), round(bv, 3) if bv is not None else None])
rows.sort(key=lambda row: row[2])
result = {'source': 'HYG 4.1 / David Nash', 'license': 'CC BY-SA 4.0', 'epoch': 'J2000', 'fields': ['raHours', 'decDegrees', 'visualMagnitude', 'bvColorIndex'], 'limit': 6.5, 'stars': rows}
DESTINATION.write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'Extracted {len(rows)} stars; {DESTINATION.stat().st_size} bytes')
