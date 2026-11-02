"""Generate the complete tracked-file inventory; never scan caches or build output."""
import argparse
import ast
import json
import re
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
# The map covers code/data ownership; the inventory above also includes all media and licenses.
data = json.loads((ROOT / 'docs/document-content.json').read_text())
roles = {name: label[0] for name, label in data['source_files'].items()}
roles.update({
    'assistant/ui.js': '搜索界面、当前对话、焦点、语言与请求取消信号',
    'assistant/runtime.js': '资源版本、资料加载、Worker生命周期、取消、重试和超时',
    'assistant/search.js': '自动查询分析、倒排排名、来源答案、候选融合与短追问',
    'assistant/worker.js': '由构建器输出的本地推理Worker，含固定第三方依赖',
    'language-data.js': '由双语生成器输出的词典',
    'material-web.js': '由scripts/material-web输出的Google Material Web依赖包',
    'theme-colors.js': '由scripts/theme-colors输出的主题计算依赖包',
    'style.css': '基础页面布局与共享样式', 'pages.css': '欢迎页和文档页面布局',
    'documents.css': '阅读排版、目录、表格与文档开场',
    'design-system.css': 'Material 3共享组件与状态样式',
    'controls.css': '实验台控件与科学面板布局',
    'ui-palette.css': '全站主题颜色的唯一CSS原稿',
    'language.css': '中英文排版、导航与语言适配',
    'interface-motion.css': '共享界面动效与减少动态效果支持',
    'site-catalog.json': '页面、导航、图解与资源版本的唯一目录',
    'lab-state.json': '观测初值、范围与表单校验目录',
    '.github/scripts/verify-site.cjs': '隔离端口的浏览器与单元回归执行器，负责超时和进程清理',
    '.github/scripts/select-checks.cjs': '按语义模块路径选择相关发布检查',
    '.github/workflows/validate.yml': '共享源码、生成件与相关回归验证',
    '.github/workflows/deploy.yml': '验证后发布既有Cloudflare项目和Pages镜像',
    '.github/workflows/github-pages.yml': '同一发布包的GitHub Pages镜像部署',
})

def category(name):
    suffix = Path(name).suffix
    if name.endswith(('package.json','package-lock.json')):
        return '依赖锁与构建配置'
    if suffix == '.json':
        return '结构化资料、目录与生成元数据'
    if suffix == '.css':
        return '界面样式（手写）'
    if suffix == '.html' and ('.en.html' in name or Path(name).stem in {doc['page'] for doc in data['documents']}):
        return '生成页面（修改双语原稿）'
    if suffix == '.html' and name.startswith('site/'):
        return '页面原稿（含目录生成区段）'
    if name.startswith(('site/space/vendor/', 'site/assistant/runtime/')) or name == 'site/astronomy.js':
        return '第三方运行库（保留原许可）'
    if name in {'site/material-web.js','site/theme-colors.js','site/language-data.js','site/assistant/worker.js'} or '.en.html' in name:
        return '生成输出（修改原稿或构建入口）'
    if name.startswith('tests/'):
        return '验证与测试工具'
    if name.startswith(('scripts/','.github/')):
        return '生成、数据维护与发布工具'
    if name.startswith('site/assistant/'):
        return '本地搜索'
    if name.startswith('site/space/'):
        return '三维天空'
    if name.startswith('site/lunar/'):
        return '地升地落'
    if name.startswith('site/'):
        return '共享界面、实验模型与页面'
    return '仓库配置与原稿'

def purpose(name):
    local = name.removeprefix('site/')
    if local in roles:
        return roles[local]
    path = ROOT / name
    if path.suffix == '.py':
        return (ast.get_docstring(ast.parse(path.read_text())) or 'Python维护工具').split('\n')[0]
    if name.endswith('package-lock.json'):
        return '固定依赖版本与完整性；由包管理器维护'
    if name.endswith('package.json'):
        return '开发工具依赖与命令；不进入网站运行环境'
    if name.startswith('tests/'):
        comment = re.search(r'^/\*\*?\s*([^\n*]+)', path.read_text()) if path.suffix in {'.js','.cjs','.mjs'} else None
        return '回归验证：' + (comment[1].strip() if comment else path.stem)
    if name.endswith('.css'):
        return '对应模块的样式与多端布局；主题颜色引用共享变量'
    if path.suffix == '.html':
        return '文档生成页' if path.stem.removesuffix('.en') in {doc['page'] for doc in data['documents']} else '页面结构；共享目录区段由site_sources同步'
    if path.suffix == '.json':
        return '结构化资料、目录或生成元数据；按所在模块维护'
    return '所属模块实现；参见源码与开发文档'

code = defaultdict(list)
for name in files:
    if Path(name).suffix in {'.js','.cjs','.mjs','.py','.css','.json','.html','.yml','.yaml'}:
        code[category(name)].append(name)
map_lines = ['# 全仓库代码地图', '',
             '由 `scripts/repository-index.py` 生成。完整素材、许可与原稿见 [全部文件](../file-inventory.md)；运行约定见 [开发者文档](../../site/development-guide.md)。', '',
             '目录职责是整理依据，不要求把科学模型、状态存储与界面强行合成一个公共模块。公开路径和资料ID保持稳定。第三方包与生成件不按手写源码修改。', '',
             '| 分组 | 文件数 | UTF-8字节数 | 行数 |', '| --- | ---: | ---: | ---: |']
for group,names in sorted(code.items()):
    sizes = sum((ROOT/name).stat().st_size for name in names)
    lines_count = sum(len((ROOT/name).read_text().splitlines()) for name in names)
    map_lines.append(f'| {group} | {len(names)} | {sizes:,} | {lines_count:,} |')
listed = {name for names in code.values() for name in names}
media = defaultdict(list)
for name in files:
    if name in listed:
        continue
    suffix = Path(name).suffix.lower()
    group = '模型、WASM与向量二进制' if suffix in {'.onnx','.wasm','.bin'} else '影像、字体与媒体' if suffix in {'.jpg','.jpeg','.png','.webp','.svg','.woff','.woff2','.ttf'} else '文档、许可与其他说明'
    media[group].append(name)
for group,names in sorted(media.items()):
    map_lines.append(f'| {group} | {len(names)} | {sum((ROOT/name).stat().st_size for name in names if name not in {'docs/file-inventory.md', 'docs/architecture/CODE-MAP.md'}):,} | — |')
map_lines += ['', '素材、模型与说明单列，不计作手写实现。说明字节数不含本地图和文件清单自身，避免自引用统计。行数包含格式、注释与数据，不能用来推断计算复杂度、维护质量或测试覆盖。', '']
for group,names in sorted(code.items()):
    map_lines += [f'## {group}', '', '| 路径 | 职责 |', '| --- | --- |']
    for name in names:
        label = purpose(name).replace('|','&#124;').replace('\n',' ')
        map_lines.append(f'| [{name}](../../{name}) | {label} |')
    map_lines.append('')
outputs = {target:content, ROOT/'docs/architecture/CODE-MAP.md':'\n'.join(map_lines)}
if args.check:
    stale = [str(path.relative_to(ROOT)) for path,value in outputs.items() if not path.is_file() or path.read_text()!=value]
    if stale:
        raise SystemExit('Stale repository documentation: ' + ', '.join(stale) + '; stage new files and run scripts/repository-index.py')
    print(f'PASS inventory and code map cover all {len(files)} tracked files')
else:
    for path,value in outputs.items():
        path.write_text(value)
