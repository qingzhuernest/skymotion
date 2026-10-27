"""Generate the complete tracked-file inventory; never scan caches or build output."""
import argparse
from collections import defaultdict
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
files = sorted(filter(None, subprocess.check_output(
    ['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')))
groups = defaultdict(list)
for name in files:
    group = name.split('/')[0] if '/' in name else '(root)'
    groups[group].append(name)
lines = ['# 完整文件清单', '',
         '由 `scripts/repository-index.py` 按 Git 跟踪文件生成；不包含依赖、构建产物或缓存。', '',
         f'共 {len(files)} 个文件。目录职责见 [repository.md](repository.md)。', '']
for group, names in sorted(groups.items()):
    lines += [f'## {group} ({len(names)})', '']
    lines += [f'- [{name}](../{name})' for name in names]
    lines += ['']
content = '\n'.join(lines)
target = ROOT / 'docs/file-inventory.md'
if args.check:
    if not target.is_file() or target.read_text() != content:
        raise SystemExit('Stale file inventory; stage file moves and run scripts/repository-index.py')
    print(f'PASS inventory covers all {len(files)} tracked files')
else:
    target.write_text(content)
