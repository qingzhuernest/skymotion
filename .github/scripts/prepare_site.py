"""Package the same tracked website for Cloudflare and GitHub project Pages."""
from pathlib import Path
import argparse
import re
import shutil
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--output', default='dist')
parser.add_argument('--base-path', default='')
args = parser.parse_args()
base = args.base_path.rstrip('/')
if base and (not base.startswith('/') or '..' in base or '"' in base):
    raise SystemExit('Invalid deployment base path')
output = Path(args.output)
output.mkdir(parents=True, exist_ok=False)
tracked = subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0')
for name in tracked:
    source = Path(name)
    if not name or source.parts[0] != 'site':
        continue
    relative = source.relative_to('site')
    if any(part.startswith('.') for part in relative.parts) and relative.as_posix() != '.nojekyll':
        continue
    target = output / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
if not (output / 'index.html').is_file():
    raise SystemExit('Missing index.html')
# An unknown nested URL still needs the project's root assets and recovery links.
# Other pages already use relative links and remain byte-for-byte identical.
if base:
    for name in ('404.html', '404.en.html'):
        error_page = output / name
        if error_page.exists():
            error_page.write_text(re.sub(r'((?:href|src)=")/(?!/)', lambda match: match.group(1) + base + '/', error_page.read_text()))
(output / '.nojekyll').touch()
print(f'Prepared website in {output}; base path: {base or "/"}')
