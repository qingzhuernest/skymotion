"""Package the same tracked website for Cloudflare and GitHub project Pages."""
from pathlib import Path
import argparse
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
    if not name:
        continue
    source = Path(name)
    if (
        any(part.startswith('.') for part in source.parts)
        or source.parts[0] in ('tests', 'scripts', 'archive')
        or name == 'README.md'
        or name.startswith('BUG-AUDIT-')
    ):
        continue
    target = output / source
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
if not (output / 'index.html').is_file():
    raise SystemExit('Missing index.html')
# An unknown nested URL still needs the project's root assets and recovery links.
# Other pages already use relative links and remain byte-for-byte identical.
if base:
    error_page = output / '404.html'
    error_page.write_text(error_page.read_text().replace('href="/', f'href="{base}/'))
(output / '.nojekyll').touch()
print(f'Prepared website in {output}; base path: {base or "/"}')
