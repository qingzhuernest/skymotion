"""Generate crawl metadata and sitemap; run after generating HTML pages."""
from pathlib import Path
import html, json, re
from xml.etree import ElementTree as ET
BASE = Path(__file__).resolve().parents[1]
PAGES = {
    'index': ('', '天体视运动实验室 · 太阳、月相与日影互动学习', '在线观察太阳和月球的视运动，探索月相、日影、互动日晷与8字日行迹。支持电脑、平板和手机，提供学习指南与模型说明。'),
    'lab': ('lab', '太阳与月相实验台 · 天体视运动实验室', '调节地点、日期和时刻，比较太阳高度、方位、日影与月相；切换空间、俯视、地平和仰望天空视角。'),
    'diagrams': ('diagrams', '太阳与月球关联图解 · 天体视运动实验室', '通过联动图解理解太阳直射点、昼夜、升落方位、月相与行星伴月，配合日期和时间观察变化。'),
    'sundial': ('sundial', '互动日晷 · 天体视运动实验室', '互动操作地平式与赤道式日晷，改变观测时刻和晷针长度，观察投影并理解当地真太阳时与钟表时间。'),
    'analemma': ('analemma', '8字日行迹与成因 · 天体视运动实验室', '比较一年中固定时刻的太阳位置，探索均时差、黄赤交角与地球公转偏心率如何形成8字日行迹。'),
    'guide': ('guide', '学习指南与观察任务 · 天体视运动实验室', '面向学生和教师的操作指南：选择观测条件、调节时间，开展太阳、月相、日影、日晷和日行迹观察任务。'),
    'project-guide': ('project-guide', '项目介绍与地理模型说明 · 天体视运动实验室', '了解项目的互动功能、多端适配、天文数据、地理模型、验证依据和计算边界，以及参考资料和反馈方式。'),
    'development-guide': ('development-guide', '完整开发逻辑与维护说明 · 天体视运动实验室', '介绍静态网站的工程结构、状态管理、天文计算、独立渲染管线、交互流程、检查方法和Cloudflare Pages发布方式。'),
    'contact': ('contact', '联系作者与反馈 · 天体视运动实验室', '欢迎反馈天体视运动实验室的知识疑问、操作问题与教学建议。请提供模块、地点、日期、时刻、操作步骤和设备信息。'),
}
def generate():
    config = json.loads((BASE/'tools/search-config.json').read_text())
    origin = config['site_url'].rstrip('/')
    verification_file = config.get('google_verification_file')
    if verification_file:
        if Path(verification_file).name != verification_file:
            raise ValueError('Verification file must be a root filename')
        (BASE/'dist'/verification_file).write_bytes((BASE/'tools'/verification_file).read_bytes())
    ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', ns)
    sitemap = ET.Element('{'+ns+'}urlset')
    for name, (route, title, description) in PAGES.items():
        path = BASE/'dist'/f'{name}.html'
        if not path.exists():
            continue
        url = origin+'/'+route
        text = path.read_text()
        head = re.search(r'<head\b[^>]*>(.*?)</head>', text, re.S|re.I)
        if not head:
            raise ValueError(f'No head in {path}')
        cleaned = re.sub(r'<!-- search-metadata:start -->.*?<!-- search-metadata:end -->', '', head.group(1), flags=re.S)
        cleaned = re.sub(r'<title\b[^>]*>.*?</title>', '', cleaned, flags=re.S|re.I)
        cleaned = re.sub(r'<meta\b[^>]*\bname=["\'](?:description|google-site-verification|msvalidate\.01)["\'][^>]*>', '', cleaned, flags=re.I)
        cleaned = re.sub(r'<link\b[^>]*\brel=["\']canonical["\'][^>]*>', '', cleaned, flags=re.I)
        esc = lambda s: html.escape(s, quote=True)
        metadata = ['<!-- search-metadata:start -->', f'<title>{esc(title)}</title>', f'<meta name="description" content="{esc(description)}">', f'<link rel="canonical" href="{esc(url)}">', f'<meta property="og:title" content="{esc(title)}">', f'<meta property="og:description" content="{esc(description)}">', f'<meta property="og:url" content="{esc(url)}">', '<meta property="og:type" content="website">', '<meta property="og:locale" content="zh_CN">']
        if name == 'index':
            for key, attr in [('google_verification', 'google-site-verification'), ('bing_verification', 'msvalidate.01')]:
                if config.get(key):
                    metadata.append(f'<meta name="{attr}" content="{esc(config[key])}">')
        metadata.append('<!-- search-metadata:end -->')
        text = text[:head.start(1)]+cleaned.rstrip()+'\n'+'\n'.join(metadata)+'\n'+text[head.end(1):]
        path.write_text(text)
        entry = ET.SubElement(sitemap, '{'+ns+'}url')
        ET.SubElement(entry, '{'+ns+'}loc').text = url
    ET.indent(sitemap)
    ET.ElementTree(sitemap).write(BASE/'dist/sitemap.xml', encoding='utf-8', xml_declaration=True)
    (BASE/'dist/robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+origin+'/sitemap.xml\n')
if __name__ == '__main__':
    generate()
