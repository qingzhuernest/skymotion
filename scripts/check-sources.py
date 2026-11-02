"""Parse every tracked JS/Python/JSON file and validate local HTML assets without executing application code."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import ast
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FILES = [ROOT / name for name in subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0') if name]
errors, counts = [], {'JavaScript': 0, 'Python': 0, 'JSON': 0, 'HTML': 0}


class Assets(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path
        self.feed(path.read_text())

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        # Navigation targets/anchors are validated by document_model and route tests.
        key = 'src' if tag in {'script', 'img', 'source'} else 'href' if tag == 'link' else None
        value = attrs.get(key) if key else None
        if not value:
            return
        url = urlsplit(value)
        if url.scheme or url.netloc or not url.path:
            return
        target = ROOT / 'site' / unquote(url.path).lstrip('/') if url.path.startswith('/') else self.path.parent / unquote(url.path)
        if not target.is_file():
            errors.append(f'{self.path.relative_to(ROOT)}: missing {value}')


for path in FILES:
    try:
        if path.suffix in {'.js', '.cjs', '.mjs'}:
            result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
            if result.returncode:
                errors.append(f'{path.relative_to(ROOT)}: {result.stderr.strip()}')
            counts['JavaScript'] += 1
        elif path.suffix == '.py':
            ast.parse(path.read_text(), filename=str(path))
            counts['Python'] += 1
        elif path.suffix == '.json':
            json.loads(path.read_text())
            counts['JSON'] += 1
        elif path.suffix == '.html' and path.is_relative_to(ROOT / 'site'):
            Assets(path)
            counts['HTML'] += 1
    except (SyntaxError, ValueError, OSError) as error:
        errors.append(f'{path.relative_to(ROOT)}: {error}')
if errors:
    raise SystemExit('\n'.join(errors))
print('PASS tracked source parsing and HTML asset references:', ', '.join(f'{kind}={number}' for kind, number in counts.items()))
