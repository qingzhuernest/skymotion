"""Render the project's controlled Markdown subset without runtime dependencies."""
from pathlib import Path
import html,re
base=Path(__file__).resolve().parents[1]
source=(base/'tools/development-guide.md').read_text()
lines=source.splitlines();out=[];toc=[];i=0;section=0

def inline(text):
 text=html.escape(text)
 text=re.sub(r'`([^`]+)`',r'<code>\1</code>',text)
 return re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',text)

while i<len(lines):
 line=lines[i]
 if not line.strip():i+=1;continue
 if line.startswith('```'):
  lang=line[3:];i+=1;code=[]
  while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
  i+=1
  if lang=='mermaid':
   steps=['用户操作','更新对应实验状态','校验输入与时间换算','科学计算','同步读数和界面','确定可见画布','统一绘图']
   out.append('<figure class="development-flow"><figcaption>数据与绘图流程</figcaption><ol>'+''.join('<li>'+s+'</li>' for s in steps)+'</ol><p>动画调度只对画面做视觉插值和相机缓动，不改写科学输入与精确读数。</p></figure>')
  else:out.append('<pre><code>'+html.escape('\n'.join(code))+'</code></pre>')
  continue
 if line.startswith('# '):out.append('<h1>'+inline(line[2:])+'</h1>');i+=1;continue
 if line.startswith('## '):
  section+=1;title=line[3:];anchor='section-'+str(section);toc.append((anchor,title));out.append('<h2 id="'+anchor+'">'+inline(title)+'</h2>');i+=1;continue
 if line.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].startswith('|'):
   row=[cell.strip() for cell in lines[i].strip().strip('|').split('|')]
   if not all(re.fullmatch(r':?-+:?',cell) for cell in row):rows.append(row)
   i+=1
  out.append('<div class="document-table"><table><thead><tr>'+''.join('<th scope="col">'+inline(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>' for row in rows[1:])+'</tbody></table></div>');continue
 if line.startswith('- ') or re.match(r'^\d+\. ',line):
  ordered=bool(re.match(r'^\d+\. ',line));tag='ol' if ordered else 'ul';items=[]
  while i<len(lines) and (bool(re.match(r'^\d+\. ',lines[i])) if ordered else lines[i].startswith('- ')):
   items.append(re.sub(r'^\d+\. |^- ','',lines[i]));i+=1
  out.append('<'+tag+'>'+''.join('<li>'+inline(t)+'</li>' for t in items)+'</'+tag+'>');continue
 para=[line];i+=1
 while i<len(lines) and lines[i].strip() and not re.match(r'^(#|```|\||- |\d+\. )',lines[i]):para.append(lines[i]);i+=1
 out.append('<p>'+inline(' '.join(para))+'</p>')
nav='<nav class="page-nav" aria-label="页面导航"><a href="index.html">欢迎页</a><a href="lab.html">实验台</a><a href="guide.html">学习指南</a><a href="project-guide.html">项目介绍</a></nav>'
intro='<div class="development-tools"><a href="project-guide.html">返回项目介绍</a><a href="development-guide.md" download>下载Markdown文档</a></div>'
toc_html='<details class="document-toc"><summary>目录 · '+str(section)+'个章节</summary><ol>'+''.join('<li><a href="#'+anchor+'">'+html.escape(title)+'</a></li>' for anchor,title in toc)+'</ol></details>'
style='''.development-doc{max-width:1040px;overflow-wrap:anywhere}.development-doc h1{font-size:28px;line-height:1.5}.development-doc h2{font-size:21px;line-height:1.5;margin-top:32px;scroll-margin-top:20px}.development-doc p{margin:14px 0}.development-doc a{color:#315da8}.development-tools{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}.development-tools a{padding:8px 12px;border-radius:18px;background:#eaf0fb;text-decoration:none}.document-toc{padding:14px 18px;background:#f0f4fc;border-radius:16px;margin:20px 0}.document-toc summary{cursor:pointer;color:#315da8}.document-toc ol{columns:2;column-gap:28px;padding-left:22px}.document-toc li{break-inside:avoid}.document-table{max-width:100%;overflow:auto;margin:18px 0}table{border-collapse:collapse;width:100%;font-size:13px;min-width:440px}th,td{text-align:left;padding:10px;vertical-align:top;border:1px solid #dce5f2}th{background:#eaf0fb}code{font-size:.9em;background:#edf2fa;border-radius:4px;padding:2px 4px}pre{overflow:auto;max-width:100%;padding:16px;background:#142438;color:#e5edf7;border-radius:14px;line-height:1.7}pre code{background:none;color:inherit;padding:0;white-space:pre}.development-flow{margin:20px 0;padding:18px;background:#eaf0fb;border-radius:16px}.development-flow figcaption{font-weight:600}.development-flow ol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:0;list-style:none;counter-reset:flow}.development-flow li{counter-increment:flow;background:white;border:1px solid #c5d6ef;border-radius:12px;padding:10px;margin:0}.development-flow li:before{content:counter(flow) '. ';color:#315da8}.development-flow p{font-size:13px}a:focus-visible,summary:focus-visible{outline:2px solid #315da8;outline-offset:3px}@media(max-width:760px){.development-doc{padding:18px;margin:12px}.development-doc h1{font-size:22px}.development-doc h2{font-size:18px}.document-toc ol{columns:1}.development-flow ol{grid-template-columns:repeat(2,minmax(0,1fr))}.development-flow{padding:12px;margin:18px 0}.development-tools{font-size:12px}}@media print{.page-nav,.development-tools{display:none}.development-doc{margin:0;max-width:none}pre{white-space:pre-wrap}.document-table{overflow:visible}table{min-width:0}}'''
body=''.join(out);end=body.index('</h1>')+5;body=body[:end]+toc_html+body[end:]
page='<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>完整开发逻辑与维护说明 · 天体视运动实验室</title><link rel="icon" href="favicon.svg"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="pages.css"><style>'+style+'</style></head><body data-page="development">'+nav+'<main class="reading-page development-doc">'+intro+body+'</main></body></html>'
(base/'dist/development-guide.html').write_text(page)
(base/'dist/development-guide.md').write_text(source)

# Preserve search metadata whenever pages are rebuilt.
from search_assets import generate
generate()
