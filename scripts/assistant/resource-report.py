"""Entity sizes and reproducible gzip estimates, not production transfer measurements."""
from pathlib import Path
import gzip
import hashlib
import json

root = Path(__file__).resolve().parents[2] / 'site/assistant'
files = {str(p.relative_to(root)): {'bytes': p.stat().st_size,
    'gzipBytes': len(gzip.compress(p.read_bytes(), mtime=0)),
    'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    for p in sorted(root.rglob('*')) if p.is_file() and p.name != 'resource-report.json'}
report = {'scope': 'Assistant additions only; excludes existing site fonts, images and scientific assets',
    'compression': 'gzip estimate computed locally; not a measured production transfer',
    'rawBytes': sum(r['bytes'] for r in files.values()),
    'gzipBytes': sum(r['gzipBytes'] for r in files.values()), 'files': files}
assert report['rawBytes'] < 100_000_000
(root / 'resource-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(report['rawBytes'], 'entity bytes;', report['gzipBytes'], 'gzip bytes')
