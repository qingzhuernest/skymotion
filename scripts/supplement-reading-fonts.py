"""Supplement missing UI characters without changing existing Reading font glyphs.
Requires fonttools[woff] and the SIL-OFL Noto Serif CJK SC sources installed on Linux.
"""
from pathlib import Path
import argparse,re
from fontTools.ttLib import TTFont
from fontTools import subset
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--font-directory',default='/usr/share/fonts/opentype/noto')
args=parser.parse_args()
existing=set(TTFont(root/'fonts/reading-regular.woff2').getBestCmap())
sources=['preferences.js','site-catalog.json','page-navigation.js','workbench-menu.js','custom-layout.js','diagram-tools.js','docs/document-content.json']
characters={ord(c) for name in sources for c in (root/name).read_text() if '\u3400'<=c<='\u9fff'}-existing
rules=[]
for style in ['regular','bold']:
    font=TTFont(Path(args.font_directory)/('NotoSerifCJK-'+style.title()+'.ttc'),fontNumber=2)
    codes=characters & set(font.getBestCmap())
    options=subset.Options();options.desubroutinize=True;options.hinting=False
    worker=subset.Subsetter(options=options);worker.populate(unicodes=codes);worker.subset(font)
    for entry in font['name'].names:
        if entry.nameID in [1,3,4,6,16]:entry.string=('SkyMotionReadingSupplement'+style.title()).encode(entry.getEncoding())
    font.flavor='woff2';name='reading-extra-'+style+'.woff2';font.save(root/'fonts'/name)
    assert set(TTFont(root/'fonts'/name).getBestCmap())==codes
    rules.append("@font-face {font-family:'SkyMotion Reading';src:url('fonts/"+name+"') format('woff2');font-weight:"+('400 500' if style=='regular' else '600 900')+";font-display:block;unicode-range:"+','.join('U+%04X'%c for c in sorted(codes))+";}")
    print(name,len(codes),'supplemental characters')
p=root/'design-system.css';source=p.read_text()
source=re.sub(r"^@font-face \{font-family:'SkyMotion Reading';src:url\('fonts/reading-extra-[^\n]+\n",'',source,flags=re.M)
source=source.replace(':root {','\n'.join(rules)+'\n:root {',1);p.write_text(source)
