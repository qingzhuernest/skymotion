/** Invalid authoring fails before generation; metadata comes from structured sources. */
const { execFileSync } = require('node:child_process');
execFileSync(
  'python3',
  [
    '-c',
    String.raw`
from pathlib import Path
import copy, json, sys, tempfile, shutil
sys.path.insert(0,'scripts')
from document_model import load, validate, state_fields
from site_sources import generated_sources, load_catalog
root=Path.cwd()/'site'
data=load(root)
def rejected(change):
    draft=copy.deepcopy(data)
    change(draft)
    try:validate(draft,root)
    except ValueError:return
    raise AssertionError('Invalid content was accepted')
rejected(lambda d:d['documents'][0]['sections'][1].update(id=d['documents'][0]['sections'][0]['id']))
rejected(lambda d:d['documents'][0]['sections'][0]['blocks'].append({'kind':'typo','text':['文字','Text']}))
rejected(lambda d:d['documents'][0].update(markdown='../outside.md'))
rejected(lambda d:d['documents'][0]['sections'][0]['blocks'].append({'kind':'table','headers':[['列','Column']],'rows':[]} ) or d['documents'][0]['sections'][0]['blocks'][-1]['rows'].append([['一','One'],['二','Two']]))
rejected(lambda d:d['documents'][0]['sections'][0]['blocks'].append({'kind':'links','items':[{'text':['链接','Link'],'href':'guide.html#missing-anchor'}]}))
rejected(lambda d:d['state_dictionary'].pop('lat'))
with tempfile.TemporaryDirectory() as directory:
    target=Path(directory)
    shutil.copy(root/'lab-state.json',target/'lab-state.json')
    # Source indentation cannot change the field inventory.
    (target/'app.js').write_text('const initialSun = {\n    ignoredByOldRegex: 42\n};')
    assert state_fields(target)==state_fields(root)
    state=json.loads((target/'lab-state.json').read_text())
    state['defaults']['sun']['newFlag']=False
    (target/'lab-state.json').write_text(json.dumps(state))
    assert 'newFlag' in state_fields(target)
    try:validate(data,target)
    except ValueError as error:assert 'newFlag' in str(error)
    else:raise AssertionError('New undocumented state was accepted')
from importlib.machinery import SourceFileLoader
import re
builder=SourceFileLoader('document_builder',str(root.parent/'scripts/build-documents.py')).load_module()
renderer=builder.DocumentRenderer(data,root)
renderer.version='next-release-test'
page=renderer.page(data['documents'][0])
versions=re.findall(r'(?:src|href)="[^"]+\.(?:js|css)\?v=([^"]+)',page)
assert versions and set(versions)=={'next-release-test'},versions
assert {p['path'] for p in load_catalog(root)['pages']}==set(json.loads((root/'page-cache-manifest.json').read_text())['pages'])-set(p for p in json.loads((root/'page-cache-manifest.json').read_text())['pages'] if '.en.html' in p)
for name,content in generated_sources(root).items():assert (root/name).read_text()==content,name
print('PASS duplicate IDs, unknown blocks, escaping paths, table dimensions, missing anchors and state coverage are rejected; canonical state inventory ignores JS whitespace; runtime metadata is current')
`,
  ],
  { stdio: 'inherit' },
);
