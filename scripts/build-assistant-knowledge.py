"""Reproducible preview knowledge build from the author's two source snapshots."""
from pathlib import Path
import hashlib
import json
import re
import argparse
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/assistant'


def build(check=False):
    records = []
    for namespace, filename, expected in [('site', 'website', 355), ('science', 'science', 144)]:
        snapshot = f'update142/{filename}' if namespace == 'site' else filename
        source = (ROOT / f'docs/assistant/sources/{snapshot}.txt').read_text()
        parts = list(re.finditer(r'^([A-Z]+-\d+)\s*[｜| ]([^\n]+)', source, re.M))
        assert len(parts) == expected, (namespace, len(parts))
        for i, match in enumerate(parts):
            body = source[match.end():parts[i+1].start() if i+1 < len(parts) else len(source)].strip()
            fields = {}
            for line in body.splitlines():
                key, sep, value = line.partition('：')
                if sep:
                    fields[key] = value.strip()
            answer = fields.get('标准回答', fields.get('答复要点', fields.get('结果', '')))
            if not answer:
                raise ValueError('Missing answer: ' + match[1])
            steps = [x.strip() for x in fields.get('入口与操作', '').split('→') if x.strip()]
            warnings = [fields[k] for k in ['条件与常见误区', '适用条件／边界'] if fields.get(k)]
            records.append(dict(id=f'{namespace}:{match[1]}', title=match[2].strip(), answer=answer,
                steps=steps, warnings=warnings, aliases=[], language='zh', intent='science' if namespace == 'science' else 'howto',
                status='draft', target=None, sourceRefs=[fields.get('参考', fields.get('源码／文档', 'Author science knowledge snapshot'))]))
            if namespace=='site' and match[1].startswith('SCI-'):records[-1]['intent']='science'
    content = json.loads((ROOT / 'docs/document-content.json').read_text())
    documents = {d['page']+'.html':d for d in content['documents']}
    for name, expected in [('learning',18),('manual',20),('developer',88)]:
        source = (ROOT / f'docs/assistant/sources/update142/{name}.txt').read_text()
        parts = list(re.finditer(r'^(GUIDE:\d+|MANUAL:\d+|DEV:(?:FILE-)?\d+)｜([^\n]+)',source,re.M))
        assert len(parts)==expected,(name,len(parts))
        for i,match in enumerate(parts):
            body=source[match.end():parts[i+1].start() if i+1<len(parts) else len(source)].strip().strip('——').strip()
            fields={line.partition('：')[0]:line.partition('：')[2].strip() for line in body.splitlines() if '：' in line}
            aliases=[x.strip() for x in re.split('[；;]',fields.get('检索问法','')) if x.strip()]
            if ':FILE-' in match[1]:
                file=match[2].strip();assert (ROOT/'site'/file).is_file(),file
                role=content['source_files'][file]
                functions=re.findall(r'^[ \t]*(?:async )?function\s+(\w+)\s*\(', (ROOT/'site'/file).read_text(),re.M)
                records.append(dict(id=match[1],title=file,answer=role[0],steps=[],warnings=[],aliases=aliases+[file],
                    fullText=role[0]+' '+', '.join(functions),status='source-checked',intent='developer',language='zh',
                    target='development-guide.html#source-index',sourceRefs=['site/'+file],
                    en={'title':file,'answer':role[1],'steps':[],'warnings':[]},
                    sourceSha256=hashlib.sha256((ROOT/'site'/file).read_bytes()).hexdigest()))
                continue
            target=urlsplit(fields['网页出处']);path=target.path.lstrip('/');anchor=target.fragment
            section=next(s for s in documents[path]['sections'] if s['id']==anchor)
            localized=[]
            for lang in [0,1]:
                paragraphs=[b['text'][lang] for b in section['blocks'] if b['kind']=='paragraph']
                steps=[item[lang] for b in section['blocks'] if b['kind']=='steps' for item in b['items']]
                localized.append(dict(title=section['title'][lang],answer='\n\n'.join(paragraphs[:2]) or section['title'][lang],
                    steps=steps,warnings=[]))
            text=body.split('原章节正文（保留完整主要内容）：',1)[-1]
            records.append(dict(id=match[1],**localized[0],en=localized[1],aliases=aliases,
                fullText=text,language='zh',intent='developer' if name=='developer' else 'howto',
                status='published-document',target=path+'#'+anchor,sourceRefs=['site/'+documents[path]['markdown']],
                documentSha256=hashlib.sha256(json.dumps(section,ensure_ascii=False,sort_keys=True).encode()).hexdigest()))
    patches = json.loads((ROOT / 'docs/assistant/reviewed.json').read_text())
    by_id = {r['id']: r for r in records}
    assert len(by_id) == len(records) == 625
    for id, patch in patches.items():
        assert id in by_id, id
        by_id[id].update(patch)
        by_id[id]['status'] = 'source-checked'
    topics=json.loads((ROOT/'docs/assistant/topics.json').read_text())
    for id,terms in topics.items():
        assert id in by_id and by_id[id]['status']!='draft',id
        by_id[id]['taskTerms']=terms
    # Every source lookup has a real handbook destination. This is a citation,
    # not a blanket upgrade of the source's review status.
    for r in records:
        if r['target']:continue
        prefix=r['id'].split(':')[-1].split('-')[0]
        if r['intent']=='science':
            anchor={'GEO':'conditions','EARTH':'earth','SUN':'sun','DAY':'bearings','TIME':'conditions',
                'SHADOW':'sun','MOON':'moon','PLANET':'moon','ANA':'analemma','EARTHRISE':'earthrise'}.get(prefix,'help')
        else:
            anchor={'SITE':'overview','STATE':'conditions','VIEW':'views','EDIT':'customization','RULE':'help',
                'UI':'controls','LAB':'conditions','SUN':'sun','MOON':'moon','YEAR':'analemma','LAY':'layout',
                'REF':'customization','BUILD':'builder','SAVE':'saving','PREF':'controls','SPACE':'space'}.get(prefix,'help')
            if '日晷' in r['title']:anchor='sundial'
            if '地升' in r['title']:anchor='earthrise'
        r['target']='project-guide.html#'+anchor
    for r in records:
        assert all(id in by_id for id in r.get('sourceIds', [])), r['id']
        if r['target']:
            path, _, anchor = r['target'].partition('#')
            html = (ROOT / 'site' / path).read_text()
            assert not anchor or f'id="{anchor}"' in html, r['target']
    payload = json.dumps({'schema': 1, 'records': records}, ensure_ascii=False, separators=(',', ':')) + '\n'
    version = hashlib.sha256(payload.encode()).hexdigest()[:16]
    OUT.mkdir(exist_ok=True)
    outputs={'knowledge.json':json.dumps({'schema':1,'version':version,'records':records},ensure_ascii=False,separators=(',',':'))+'\n',
        'knowledge-version.json':json.dumps({'version':version,'records':len(records),'sourceChecked':len(patches),
            'publishedChapters':60,'sourceFiles':66},indent=2)+'\n'}
    for name,value in outputs.items():
        if check:assert (OUT/name).read_text()==value,'Knowledge source drift: rebuild '+name
        else:(OUT/name).write_text(value)
    print(f'Built {len(records)} cards; {len(patches)} source-checked; version {version}')


if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true')
    build(parser.parse_args().check)
