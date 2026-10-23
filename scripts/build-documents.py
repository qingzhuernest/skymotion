"""Build the documentation center and three bilingual manuals from structured source.
Run before prerender-pages.py; --check verifies outputs without modifying them.
"""
from pathlib import Path
import argparse, html, json, re
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/document-content.json'
VERSION='20261023-entrance92'
LINKS=[('docs','文档中心','Documentation'),('guide','学习指南','Learning guide'),('project-guide','项目介绍与功能使用','Project & feature manual'),('development-guide','开发者文档','Developer reference')]
def esc(value):return html.escape(str(value),quote=True)
def fields():
    source=(ROOT/'app.js').read_text()
    result={}
    for name in ('initialSun','initialMoon'):
        block=source.split('const '+name+' = {',1)[1].split('\n};',1)[0]
        for key,value in re.findall(r'^  (\w+): (.+?)(?:,)?$',block,re.M):
            result.setdefault(key,{})[name]=value.rstrip(',')
    return result

def generate(data):
    dictionary={}
    def pair(value,lang=0):
        if not isinstance(value,list) or len(value)!=2 or not all(isinstance(s,str) for s in value):raise ValueError('Expected bilingual text: '+str(value)[:150])
        if re.search('[\u3400-\u9fff]',value[0]):dictionary[value[0]]=value[1]
        return value[lang]
    def table(block,lang):
        headers=[pair(c,lang) for c in block['headers']]
        rows=[[pair(c,lang) for c in row] for row in block['rows']]
        return headers,rows
    def expanded(block):
        if block['kind']!='state-table':return block
        actual=fields(); described=data['state_dictionary']
        missing=set(actual)-set(described)
        if missing:raise ValueError('Undocumented state fields: '+','.join(sorted(missing)))
        rows=[]
        for key,initial in actual.items():
            default='; '.join(('Sun: ' if k=='initialSun' else 'Moon: ')+v for k,v in initial.items())
            meaning=described[key]
            rows.append([[key,key],meaning['meaning'],meaning['unit'],[default,default]])
        return {'kind':'table','headers':[['变量','Variable'],['含义与作用','Meaning and role'],['单位或取值','Unit or values'],['源码初值','Source initial value']],'rows':rows}
    def source_index(lang,markdown=False):
        out=[]
        for path in data['source_files']:
            body=(ROOT/path).read_text()
            matches=list(re.finditer(r'^[ \t]*(?:async )?function\s+(\w+)\s*\(',body,re.M))
            names=', '.join(m.group(1) for m in matches) or pair(['模块内部方法，参见源码','Module methods; see source'],lang)
            label=pair(data['source_files'][path],lang)
            url='https://github.com/qingzhuernest/skymotion/blob/main/'+path
            if markdown:out.append(f'| [{path}]({url}) | {label} | {names} |')
            else:out.append(f'<tr><td><a href="{esc(url)}"><code>{esc(path)}</code></a></td><td>{esc(label)}</td><td>{esc(names)}</td></tr>')
        if markdown:return '\n'.join([('| 源码文件 | 职责 | 声明的函数 |' if lang==0 else '| File | Responsibility | Declared functions |'),'| --- | --- | --- |',*out])
        return '<div class="document-table"><table class="document-source-table"><colgroup><col><col><col></colgroup><thead><tr><th>'+pair(['源码文件','Source file'],lang)+'</th><th>'+pair(['职责','Responsibility'],lang)+'</th><th>'+pair(['声明的函数','Declared functions'],lang)+'</th></tr></thead><tbody>'+''.join(out)+'</tbody></table></div>'
    def render(block,lang,markdown=False):
        block=expanded(block);kind=block['kind']
        if kind=='source-index':return source_index(lang,markdown)
        if kind=='code':return ('```'+block.get('language','')+'\n'+block['text']+'\n```') if markdown else '<pre><code>'+esc(block['text'])+'</code></pre>'
        if kind=='table':
            headers,rows=table(block,lang)
            if markdown:
                cell=lambda s:s.replace('|','&#124;').replace('\n',' ')
                return '\n'.join(['| '+' | '.join(map(cell,headers))+' |','| '+' | '.join('---' for _ in headers)+' |',*['| '+' | '.join(map(cell,row))+' |' for row in rows]])
            return '<div class="document-table"><table><thead><tr>'+''.join('<th>'+esc(v)+'</th>' for v in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+esc(v)+'</td>' for v in row)+'</tr>' for row in rows)+'</tbody></table></div>'
        if kind in ('list','steps'):
            values=[pair(v,lang) for v in block['items']]
            if markdown:return '\n'.join((str(i+1)+'. ' if kind=='steps' else '- ')+v for i,v in enumerate(values))
            tag='ol' if kind=='steps' else 'ul'
            return '<'+tag+'>'+''.join('<li>'+esc(v)+'</li>' for v in values)+'</'+tag+'>'
        if kind=='links':
            if markdown:return '\n'.join('- ['+pair(v['text'],lang)+']('+localized(v['href'],lang)+')' for v in block['items'])
            return '<ul>'+''.join('<li><a href="'+esc(v['href'])+'">'+esc(pair(v['text'],lang))+'</a></li>' for v in block['items'])+'</ul>'
        value=pair(block['text'],lang)
        if kind=='heading':return ('### '+value) if markdown else '<h3>'+esc(value)+'</h3>'
        if kind=='note':return ('> '+value) if markdown else '<p class="document-note">'+esc(value)+'</p>'
        return value if markdown else '<p>'+esc(value)+'</p>'
    def localized(href,lang):
        if not lang or '://' in href:return href
        return re.sub(r'(?<!\.en)\.(html|md)(?=$|#)',r'.en.\1',href)
    outputs={}
    for doc in data['documents']:
        page=doc['page']; md=doc['markdown']; title=pair(doc['title']);lead=pair(doc['lead'])
        sections=[]
        for section in doc['sections']:
            sid=section['id'];heading=pair(section['title'])
            aliases=''.join('<span id="'+esc(alias)+'" aria-hidden="true"></span>' for alias in section.get('aliases',[]))
            sections.append('<section id="'+esc(sid)+'">'+aliases+'<h2>'+esc(heading)+'</h2>'+''.join(render(b,0) for b in section['blocks'])+'</section>')
        nav='<nav class="page-nav" aria-label="页面导航"><a href="index.html">欢迎页</a><a href="lab.html">实验台</a><a href="docs.html" aria-current="page">文档中心</a><a href="space/">三维天空</a></nav>'
        siblings='<nav class="document-links" aria-label="文档分类">'+''.join('<a href="'+p+'.html"'+(' aria-current="page"' if p==page else '')+'>'+zh+'</a>' for p,zh,en in LINKS)+'</nav>'
        toc='<details class="document-toc"><summary>本页目录</summary><ol>'+''.join('<li><a href="#'+s['id']+'">'+esc(pair(s['title']))+'</a></li>' for s in doc['sections'])+'</ol></details>'
        styles=['ui-palette.css','style.css','pages.css','documents.css','interface-motion.css','design-system.css','language.css']
        scripts=['document-entrance.js','language-data.js','language.js','page-cache.js','date-picker.js']
        page_body='guide' if page=='guide' else page
        value='<!doctype html>\n<html lang="zh-CN" data-rendered-language="zh"><head><meta charset="utf-8"><script src="page-boot.js?v='+VERSION+'"></script><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="favicon.svg"><title>'+esc(title)+' · 天体视运动实验室</title><meta name="description" content="'+esc(lead)+'"><link rel="canonical" href="https://skymotion-5md.pages.dev/'+page+'">'+''.join('<link rel="stylesheet" href="'+f+'?v='+VERSION+'">' for f in styles)+''.join('<script src="'+f+'?v='+VERSION+'" defer></script>' for f in scripts)+'</head><body data-page="'+page_body+'">'+nav+'<main class="reading-page document-page"><header class="document-header"><h1>'+esc(title)+'</h1><p class="document-lead">'+esc(lead)+'</p>'+siblings+'<a class="document-download" download href="'+md+'">下载本文 Markdown</a></header>'+toc+'<div class="document-content">'+''.join(sections)+'</div><footer class="document-footer"><a href="lab.html">进入实验台</a> · <a href="docs.html">返回文档中心</a></footer></main></body></html>\n'
        outputs[page+'.html']=value
        for lang in (0,1):
            text=['# '+pair(doc['title'],lang),'',pair(doc['lead'],lang),'']
            text+=['- ['+pair(s['title'],lang)+']('+localized(page+'.html',lang)+'#'+s['id']+')' for s in doc['sections']]
            for section in doc['sections']:
                text+=['','## '+pair(section['title'],lang),'']
                text+=['\n\n'.join(render(b,lang,True) for b in section['blocks'])]
            outputs[md if lang==0 else md[:-3]+'.en.md']='\n'.join(text)+'\n'
    # Labels in the shared shell are not necessarily present in article text.
    for _,zh,en in LINKS:dictionary[zh]=en
    dictionary.update({'文档分类':'Document categories','本页目录':'Contents','下载本文 Markdown':'Download this document as Markdown','返回文档中心':'Back to documentation'})
    existing=json.loads((ROOT/'i18n-docs.json').read_text());existing.update(dictionary)
    outputs['i18n-docs.json']=json.dumps(existing,ensure_ascii=False,indent=2)+'\n'
    return outputs

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    data=json.loads(SOURCE.read_text());outputs=generate(data);stale=[]
    for name,value in outputs.items():
        target=ROOT/name
        if args.check:
            if not target.is_file() or target.read_text()!=value:stale.append(name)
        else:target.write_text(value)
    if stale:raise SystemExit('Stale documentation: '+', '.join(stale))
    print('Validated four bilingual documents and '+str(len(fields()))+' shared-state definitions')
if __name__=='__main__':main()
