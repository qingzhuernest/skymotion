"""Reproducible preview knowledge build from the author's two source snapshots."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/assistant'


def build():
    records = []
    for namespace, filename, expected in [('site', 'website', 355), ('science', 'science', 144)]:
        source = (ROOT / f'docs/assistant/sources/{filename}.txt').read_text()
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
    patches = json.loads((ROOT / 'docs/assistant/reviewed.json').read_text())
    by_id = {r['id']: r for r in records}
    assert len(by_id) == 499
    for id, patch in patches.items():
        assert id in by_id, id
        by_id[id].update(patch)
        by_id[id]['status'] = 'source-checked'
    for r in records:
        assert all(id in by_id for id in r.get('sourceIds', [])), r['id']
        if r['target']:
            path, _, anchor = r['target'].partition('#')
            html = (ROOT / 'site' / path).read_text()
            assert not anchor or f'id="{anchor}"' in html, r['target']
    payload = json.dumps({'schema': 1, 'records': records}, ensure_ascii=False, separators=(',', ':')) + '\n'
    version = hashlib.sha256(payload.encode()).hexdigest()[:16]
    OUT.mkdir(exist_ok=True)
    (OUT / 'knowledge.json').write_text(json.dumps({'schema':1, 'version':version, 'records':records}, ensure_ascii=False, separators=(',', ':'))+'\n')
    (OUT / 'knowledge-version.json').write_text(json.dumps({'version':version, 'records':len(records), 'sourceChecked':len(patches)}, indent=2)+'\n')
    print(f'Built {len(records)} cards; {len(patches)} source-checked; version {version}')


if __name__ == '__main__':
    build()
