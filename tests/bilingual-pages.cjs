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
    def check_scripts(node):
        if node.tag=='script' and node.attr('src'):
            keys={key for key,value in node.attrs}
            if 'page-boot.js' in node.attr('src'):
                assert 'defer' not in keys,'Locale boot must run before visible parsing'
            else:
                assert 'defer' in keys and 'async' not in keys,f'Parser-blocking or unordered script in {chinese}: {node.attr("src")}'
        for child in node.children: check_scripts(child)
    check_scripts(m.parse(chinese.read_text()))
    def check_english_text(node, skip=False):
        # Explicit bilingual quotes and code samples retain their source language.
        skip=skip or node.tag in ('script','style','pre','code') or (node.attr('lang') or '').startswith('zh') or any(k=='data-i18n-skip' for k,v in node.attrs)
        if not skip and node.kind=='text':
            assert not m.CHINESE.search(node.data),f'Untranslated English text in {english}: {node.data[:140]}'
        for child in node.children: check_english_text(child,skip)
    check_english_text(m.parse(english.read_text()))
    count+=1
assert count==14,f'Expected 14 bilingual pairs, got {count}'
print('PASS all 14 bilingual DOM, attribute, form-value and script pairs, with complete English text')
`],{stdio:'inherit'});

execFileSync('python3',['scripts/prerender-pages.py','--check'],{stdio:'inherit'});

execFileSync('python3',['scripts/build-documents.py','--check'],{stdio:'inherit'});
