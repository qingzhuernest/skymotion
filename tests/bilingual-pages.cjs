/** Check committed Chinese/English pairs without regenerating files or changing the checkout. */
const {execFileSync}=require('node:child_process');
execFileSync('python3',['-c',`
from pathlib import Path
from importlib.machinery import SourceFileLoader
m=SourceFileLoader('prerender','scripts/prerender-pages.py').load_module()
count=0
for english in Path('.').resolve().rglob('*.en.html'):
    if not m.is_site_file(english,Path('.').resolve()): continue
    chinese=english.with_name(english.name.replace('.en.html','.html'))
    assert chinese.is_file(),f'Missing source: {chinese}'
    m.assert_unchanged(m.parse(chinese.read_text()),m.parse(english.read_text()),str(chinese))
    count+=1
assert count==12,f'Expected 12 bilingual pairs, got {count}'
print('PASS all 12 committed bilingual DOM, attribute, form-value and script pairs')
`],{stdio:'inherit'});

execFileSync('python3',['scripts/prerender-pages.py','--check'],{stdio:'inherit'});
