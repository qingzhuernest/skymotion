from pathlib import Path
import re
base=Path(__file__).resolve().parents[1];r=base/'dist';source=(base/'tools/app-template.html').read_text()
head=source[:source.index('<body')].replace('</head>','<link rel="stylesheet" href="pages.css"></head>')
def nav():return '<nav class="page-nav" aria-label="页面导航"><a href="index.html">欢迎页</a><a href="lab.html">实验台</a><a href="guide.html">学习指南</a><a href="diagrams.html">关联图解</a></nav>'
for page in ['lab','sundial','analemma','diagrams']:
 experiment=source[:source.index('<section id="welcome"')]+source[source.index('<div id="labShell"'):]
 s=experiment.replace('<body class="welcome-open">',f'<body data-page="{page}">').replace('</head>','<link rel="stylesheet" href="pages.css"></head>')
 s=s.replace('<script src="welcome.js"></script>','<script src="page-navigation.js"></script>')
 s=s.replace('<header><a class="brand"',nav()+'<header><a class="brand"')
 if page=='sundial':s=s.replace('<dialog class="sundial-panel sundial-dialog"','<section class="sundial-panel sundial-page"').replace('</div></dialog>\n<dialog id="settingsDialog"','</div></section>\n<dialog id="settingsDialog"')
 s=s.replace('<title>天体视运动实验室</title>',f'<title>'+{'lab':'实验台','sundial':'日晷实验台','analemma':'日行迹实验','diagrams':'关联图解'}[page]+' · 天体视运动实验室</title>')
 (r/(page+'.html')).write_text(s)
welcome=source[source.index('<section id="welcome"'):source.index('<dialog id="authorContact"')]
welcome=welcome.replace('<button id="enterLab" class="welcome-enter">','<a id="enterLab" class="welcome-enter" href="lab.html">').replace('进入实验台 <span aria-hidden="true">✦</span></button>','进入实验台 <span aria-hidden="true">✦</span></a>')
welcome=welcome.replace('<button id="contactAuthor" class="welcome-contact" type="button" aria-haspopup="dialog" aria-controls="authorContact">联系作者</button>','<a id="contactAuthor" class="welcome-contact" href="contact.html">联系作者 · 欢迎反馈</a>')
welcome=welcome.replace('<div class="welcome-corner-links">','<div class="welcome-corner-links"><a href="guide.html">学习指南</a>')
(r/'index.html').write_text(head+'<body data-page="welcome" class="welcome-open">'+welcome+'<script>const $=id=>document.getElementById(id),reducedMotion=matchMedia("(prefers-reduced-motion:reduce)");</script><script src="welcome.js"></script></body></html>')
help=re.search(r'<dialog id="help">(.*?)</dialog>',source,re.S).group(1)
help=re.sub(r'<button id="closeHelp".*?</button>','',help);help=help.replace('<button id="startExplore" class="play-button">开始探索</button>','<a href="lab.html" class="page-action">进入实验台</a>')
help=help.replace('在月相界面开启演示，选择行星','在月相模式下进入“关联图解”，开启行星伴月演示并选择行星')
help=help.replace('打开互动弹窗','进入独立互动页面').replace('联动下方日行迹','进入日行迹页面比较').replace('在太阳的关联图解中开启日行迹','进入日行迹页面')
(r/'guide.html').write_text((base/'tools/learning-guide.html').read_text())
contact=re.search(r'<dialog id="authorContact"[^>]*>(.*?)</dialog>',source,re.S).group(1)
contact=re.sub(r'<button id="closeAuthorContact".*?</button>','',contact)
(r/'contact.html').write_text(head.replace('<title>天体视运动实验室</title>','<title>联系作者 · 欢迎反馈</title>')+'<body data-page="contact">'+nav()+'<main class="reading-page">'+contact+'</main><script>document.getElementById("copyAuthorEmail").onclick=async()=>{try{await navigator.clipboard.writeText("70.noted.rebuild@icloud.com");document.getElementById("authorCopyStatus").textContent="邮箱已复制";}catch{document.getElementById("authorCopyStatus").textContent="请长按邮箱地址复制";}};</script></body></html>')
# A root 404 opts this multi-page site out of Cloudflare Pages' implicit SPA fallback.
(r/'404.html').write_text((base/'tools/not-found.html').read_text())
# Project article is authored by section; preserve its structure during page regeneration.
(r/'project-guide.html').write_text((base/'tools/project-guide.html').read_text())

# Preserve search metadata whenever pages are rebuilt.
from search_assets import generate
generate()
