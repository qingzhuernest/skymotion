#!/usr/bin/env python3
"""Build deterministic English sibling pages without evaluating application scripts.

Usage: python3 scripts/prerender-pages.py [--dist PATH]
Presentation metadata preserves Chinese strings for in-place language switching.
Scientific state, script sources, form values, and identifiers are never translated.
"""
from __future__ import annotations

import argparse
import html
import json
import posixpath
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

VOID = frozenset('area base br col embed hr img input link meta param source track wbr'.split())
SKIP = frozenset(('script', 'style', 'code', 'pre'))
ATTRIBUTES = frozenset(('title', 'aria-label', 'alt', 'placeholder'))
CHINESE = re.compile(r'[\u3400-\u9fff]')


def normalize(value: str) -> str:
    return re.sub(r'\s+', ' ', value).strip()


@dataclass
class Node:
    kind: str
    tag: str = ''
    data: str = ''
    attrs: list[tuple[str, str | None]] = field(default_factory=list)
    children: list['Node'] = field(default_factory=list)
    self_closing: bool = False

    def attr(self, key: str) -> str | None:
        return next((value for name, value in self.attrs if name == key), None)

    def set_attr(self, key: str, value: str) -> None:
        for index, (name, _) in enumerate(self.attrs):
            if name == key:
                self.attrs[index] = (key, value)
                return
        self.attrs.append((key, value))


class TreeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node('root')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node('element', tag=tag, attrs=list(attrs))
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node('element', tag=tag, attrs=list(attrs), self_closing=True))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return
        raise ValueError(f'Unmatched closing HTML tag: {tag}')

    def handle_data(self, data):
        # Coalesce parser-delivered adjacent text so restoration metadata represents DOM nodes.
        siblings = self.stack[-1].children
        if siblings and siblings[-1].kind == 'text':
            siblings[-1].data += data
        else:
            siblings.append(Node('text', data=data))

    def handle_comment(self, data):
        self.stack[-1].children.append(Node('raw', data='<!--' + data + '-->'))

    def handle_decl(self, decl):
        self.stack[-1].children.append(Node('raw', data='<!' + decl + '>'))

    def handle_pi(self, data):
        self.stack[-1].children.append(Node('raw', data='<?' + data + '>'))


def parse(source: str) -> Node:
    parser = TreeParser()
    parser.feed(source)
    parser.close()
    return parser.root


def elements(node: Node):
    if node.kind == 'element':
        yield node
    for child in node.children:
        yield from elements(child)


def content(node: Node) -> str:
    if node.kind == 'text':
        return node.data
    return ''.join(content(child) for child in node.children)


def serialize(node: Node, raw_text: bool = False) -> str:
    if node.kind == 'text':
        return node.data if raw_text else html.escape(node.data, quote=False)
    if node.kind == 'raw':
        return node.data
    if node.kind == 'root':
        return ''.join(serialize(child) for child in node.children)
    attrs = ''.join(' ' + key if value is None else ' ' + key + '="' + html.escape(value, quote=True) + '"'
                    for key, value in node.attrs)
    start = '<' + node.tag + attrs + (' />' if node.self_closing else '>')
    if node.tag in VOID or node.self_closing:
        return start
    body = ''.join(serialize(child, node.tag in ('script', 'style')) for child in node.children)
    return start + body + '</' + node.tag + '>'


def load_dictionary(dist: Path) -> dict[str, str]:
    merged: dict[str, str] = {}
    for name in ('i18n-lab.json', 'i18n-space.json', 'i18n-docs.json'):
        source = json.loads((dist / name).read_text(encoding='utf-8'))
        # A supplied canonical key wins over whitespace aliases within its resource.
        canonical = {key: value for key, value in source.items() if key == normalize(key)}
        for key, value in source.items():
            merged[normalize(key)] = canonical.get(normalize(key), value)
    merged['☾ 月相'] = '☾ Moon'
    return merged


class Translator:
    def __init__(self, dictionary: dict[str, str]):
        self.dictionary = dictionary
        terms = sorted((key for key in dictionary if CHINESE.search(key) and len(key) <= 120),
                       key=lambda key: (-len(key), key))
        self.fragments = re.compile('|'.join(re.escape(key) for key in terms)) if terms else None

    def __call__(self, source: str) -> str:
        if not CHINESE.search(source):
            return source
        key = normalize(source)
        if key in self.dictionary:
            return self.dictionary[key]
        result = re.sub(r'(\d{4})年(\d{1,2})月(\d{1,2})日',
                        lambda match: f'{match[1]}-{int(match[2]):02d}-{int(match[3]):02d}', key)
        result = re.sub(r'(\d{1,2})月(\d{1,2})日',
                        lambda match: f'{int(match[1]):02d}/{int(match[2]):02d}', result)
        if self.fragments:
            result = self.fragments.sub(lambda match: self.dictionary[match[0]], result)
        return result


def english_link(href: str, source: str, page_paths: set[str], dist: Path) -> str:
    url = urlsplit(href)
    if url.scheme or url.netloc or not url.path:
        return href
    path = url.path
    resolved = posixpath.normpath(posixpath.join(posixpath.dirname(source), path)) if not path.startswith('/') else path.lstrip('/')
    target = resolved
    if path.endswith('/') or path in ('.', '..'):
        target = posixpath.join(resolved, 'index.html')
    elif target not in page_paths and not posixpath.splitext(target)[1]:
        target += '.html'
    if target in page_paths:
        if path.endswith('/'):
            updated = path + 'index.en.html'
        elif path in ('.', '..'):
            updated = path + '/index.en.html'
        elif path.endswith('.html'):
            updated = path[:-5] + '.en.html'
        else:
            updated = path + '.en.html'
        return urlunsplit(('', '', updated, url.query, url.fragment))
    if path.endswith('.md') and (dist / (resolved[:-3] + '.en.md')).is_file():
        return urlunsplit(('', '', path[:-3] + '.en.md', url.query, url.fragment))
    return href


def transform(node: Node, translator: Translator, source: str, page_paths: set[str], dist: Path,
              skipped: bool = False) -> tuple[int, int]:
    if node.kind not in ('root', 'element'):
        return 0, 0
    skip = skipped or node.tag in SKIP or any(key == 'data-i18n-skip' for key, _ in node.attrs)
    if node.tag == 'html':
        node.set_attr('lang', 'en')
        node.set_attr('data-rendered-language', 'en')
    text_count = attr_count = 0
    original_attributes = {}
    if node.kind == 'element' and not skip:
        for key, value in list(node.attrs):
            if key in ATTRIBUTES and value is not None and CHINESE.search(value):
                translated = translator(value)
                if translated != value:
                    original_attributes[key] = value
                    node.set_attr(key, translated)
                    attr_count += 1
        if original_attributes:
            node.set_attr('data-i18n-cn-attrs', json.dumps(original_attributes, ensure_ascii=False, separators=(',', ':')))
    # Redirect stubs are native navigations too; preserve their numeric delay.
    if node.tag == 'meta' and (node.attr('http-equiv') or '').lower() == 'refresh':
        refresh = node.attr('content')
        if refresh:
            match = re.fullmatch(r'(\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*)(.*?)(\s*)', refresh, re.IGNORECASE)
            if match:
                raw_target = match[2]
                quote = raw_target[0] if raw_target[:1] in ('\"', "'") and raw_target[-1:] == raw_target[:1] else ''
                target = raw_target[1:-1] if quote else raw_target
                updated = english_link(target, source, page_paths, dist)
                if updated != target:
                    originals = json.loads(node.attr('data-i18n-cn-attrs') or '{}')
                    originals['content'] = refresh
                    node.set_attr('data-i18n-cn-attrs', json.dumps(originals, ensure_ascii=False, separators=(',', ':')))
                    node.set_attr('content', match[1] + quote + updated + quote + match[3])
                    attr_count += 1
    href = node.attr('href')
    if node.tag == 'a' and href is not None:
        updated = english_link(href, source, page_paths, dist)
        if updated != href:
            node.set_attr('data-cn-href', href)
            node.set_attr('href', updated)
    for child in node.children:
        added_text, added_attrs = transform(child, translator, source, page_paths, dist, skip)
        text_count += added_text
        attr_count += added_attrs
    direct_originals = {}
    if not skip:
        for index, child in enumerate(node.children):
            if child.kind != 'text' or not CHINESE.search(child.data):
                continue
            original = child.data
            translated = translator(original)
            # Inline emphasis and links must not run into neighboring English words.
            if index > 0 and node.children[index - 1].kind == 'element' and re.search(r'[A-Za-z0-9]$', content(node.children[index - 1])) and re.match(r'[A-Za-z0-9]', translated):
                translated = ' ' + translated
            if index + 1 < len(node.children) and node.children[index + 1].kind == 'element' and re.search(r'[A-Za-z0-9]$', translated) and re.match(r'[A-Za-z0-9]', content(node.children[index + 1])):
                translated += ' '
            if translated != original:
                if translated in direct_originals and direct_originals[translated] != original:
                    raise ValueError(f'{source}: ambiguous Chinese restoration on <{node.tag}>: {translated!r}')
                direct_originals[translated] = original
                child.data = translated
                text_count += 1
        if direct_originals and node.kind == 'element':
            node.set_attr('data-i18n-cn', json.dumps(direct_originals, ensure_ascii=False, separators=(',', ':')))
    return text_count, attr_count


def assert_unchanged(original: Node, generated: Node, source: str) -> None:
    before, after = list(elements(original)), list(elements(generated))
    if [node.tag for node in before] != [node.tag for node in after]:
        raise ValueError(f'{source}: generated HTML changed element structure')
    allowed = ATTRIBUTES | {'href', 'lang', 'data-rendered-language', 'data-cn-href', 'data-i18n-cn', 'data-i18n-cn-attrs'}
    for old, new in zip(before, after):
        permitted = allowed
        if old.tag == 'meta' and (old.attr('http-equiv') or '').lower() == 'refresh':
            permitted = allowed | {'content'}
            old_refresh = old.attr('content') or ''
            new_refresh = new.attr('content') or ''
            if old_refresh.split(';', 1)[0] != new_refresh.split(';', 1)[0]:
                raise ValueError(f'{source}: changed meta-refresh delay')
        old_attrs = {key: value for key, value in old.attrs if key not in permitted}
        new_attrs = {key: value for key, value in new.attrs if key not in permitted}
        if old_attrs != new_attrs:
            raise ValueError(f'{source}: changed a protected attribute on <{old.tag}>')
        if old.tag in ('script', 'style', 'code', 'pre') and content(old) != content(new):
            raise ValueError(f'{source}: changed skipped <{old.tag}> content')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    dist = args.dist.resolve()
    pages = sorted(path for path in dist.rglob('*.html')
                   if not path.name.endswith('.en.html') and not re.fullmatch(r'google[^/]*\.html', path.name))
    paths = {path.relative_to(dist).as_posix() for path in pages}
    dictionary = load_dictionary(dist)
    # External script: escape HTML-significant characters for safe reuse in other hosts too.
    bundle = json.dumps(dictionary, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    bundle = bundle.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    (dist / 'language-data.js').write_text('// Generated by scripts/prerender-pages.py.\nwindow.skyEnglishDictionary=' + bundle + ';\n', encoding='utf-8')
    translator = Translator(dictionary)
    generated_paths = []
    for path in pages:
        relative = path.relative_to(dist).as_posix()
        source = path.read_text(encoding='utf-8')
        original, tree = parse(source), parse(source)
        text_count, attr_count = transform(tree, translator, relative, paths, dist)
        rendered = serialize(tree)
        assert_unchanged(original, parse(rendered), relative)
        target = path.with_name(path.stem + '.en.html')
        target.write_text(rendered, encoding='utf-8')
        generated_paths.append(target.relative_to(dist).as_posix())
        print(f'{relative} -> {generated_paths[-1]} ({text_count} text nodes, {attr_count} attributes)')
    all_paths = sorted(paths | set(generated_paths))
    sizes = {path: (dist / path).stat().st_size for path in all_paths}
    assets = sorted(p.relative_to(dist).as_posix() for p in dist.rglob('*') if p.is_file() and p.suffix in {'.js', '.css', '.json', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.woff', '.woff2', '.md'} and p.name != 'page-cache-manifest.json')
    manifest = {'version': 2, 'resourceVersion': '20261013-font2', 'pages': all_paths, 'assets': assets, 'sizes': sizes, 'totalBytes': sum(sizes.values()), 'assetBytes': sum((dist / p).stat().st_size for p in assets)}
    (dist / 'page-cache-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Validated structure, IDs, input/option values, scripts, and numerical attributes for {len(pages)} page pairs.')
    print(f'Cached HTML estimate: {manifest["totalBytes"]:,} bytes; dictionary: {len(dictionary):,} entries.')


if __name__ == '__main__':
    main()
