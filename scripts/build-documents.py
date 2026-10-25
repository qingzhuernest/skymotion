"""Render validated bilingual documents to HTML, Markdown and translation entries."""
import argparse
import html
import json
from pathlib import Path
import re
from string import Template
from urllib.parse import urlsplit, urlunsplit

from document_model import load, state_fields, validate
from site_sources import load_catalog, navigation_html

ROOT = Path(__file__).resolve().parents[1]
LINKS = [
    ("docs", "文档中心", "Documentation"),
    ("guide", "学习指南", "Learning guide"),
    ("project-guide", "项目介绍与功能使用", "Project & feature manual"),
    ("development-guide", "开发者文档", "Developer reference"),
]
STYLES = ["ui-palette.css", "style.css", "pages.css", "documents.css", "interface-motion.css", "design-system.css", "language.css"]
SCRIPTS = ["material-controls.js", "document-entrance.js", "document-navigation.js", "language-data.js", "language.js", "page-cache.js", "date-picker.js"]


def escape(value):
    return html.escape(str(value), quote=True)


def localized(href, language):
    url = urlsplit(href)
    if not language or url.scheme:
        return href
    path = re.sub(r"(?<!\.en)\.(html|md)$", r".en.\1", url.path)
    return urlunsplit((url.scheme, url.netloc, path, url.query, url.fragment))


class DocumentRenderer:
    def __init__(self, data, root):
        self.data = data
        self.root = root
        self.dictionary = {}
        self.fields = state_fields(root)
        self.version = load_catalog(root)["resourceVersion"]
        self.template = Template((root / "scripts/document-page.html").read_text())
        self.sources = []
        for path, description in data["source_files"].items():
            source = (root / path).read_text()
            names = re.findall(r"^[ \t]*(?:async )?function\s+(\w+)\s*\(", source, re.M)
            self.sources.append((path, description, names))

    def text(self, value, language=0):
        if re.search(r"[\u3400-\u9fff]", value[0]):
            previous = self.dictionary.get(value[0])
            if previous is not None and previous != value[1]:
                raise ValueError("Conflicting translation: " + value[0])
            self.dictionary[value[0]] = value[1]
        return value[language]

    def state_table(self):
        rows = []
        for key, values in self.fields.items():
            initial = "; ".join(("Sun: " if body == "initialSun" else "Moon: ") + value for body, value in values.items())
            entry = self.data["state_dictionary"][key]
            rows.append([[key, key], entry["meaning"], entry["unit"], [initial, initial]])
        return {"kind": "table", "headers": [["变量", "Variable"], ["含义与作用", "Meaning and role"], ["单位或取值", "Unit or values"], ["源码初值", "Source initial value"]], "rows": rows}

    def source_index(self, language, markdown):
        rows = []
        for path, description, names in self.sources:
            label = self.text(description, language)
            functions = ", ".join(names) or self.text(["模块内部方法，参见源码", "Module methods; see source"], language)
            url = "https://github.com/qingzhuernest/skymotion/blob/main/" + path
            if markdown:
                rows.append(f"| [{path}]({url}) | {label} | {functions} |")
            else:
                rows.append(f'<tr><td><a href="{escape(url)}"><code>{escape(path)}</code></a></td><td>{escape(label)}</td><td>{escape(functions)}</td></tr>')
        headers = [self.text(pair, language) for pair in [["源码文件", "Source file"], ["职责", "Responsibility"], ["声明的函数", "Declared functions"]]]
        if markdown:
            return "\n".join(["| " + " | ".join(headers) + " |", "| --- | --- | --- |", *rows])
        heading = "".join("<th>" + escape(value) + "</th>" for value in headers)
        return '<div class="document-table"><table class="document-source-table"><colgroup><col><col><col></colgroup><thead><tr>' + heading + "</tr></thead><tbody>" + "".join(rows) + "</tbody></table></div>"

    def table(self, block, language, markdown):
        headers = [self.text(cell, language) for cell in block["headers"]]
        rows = [[self.text(cell, language) for cell in row] for row in block["rows"]]
        if markdown:
            def row(cells):
                return "| " + " | ".join(cell.replace("|", "&#124;").replace("\n", " ") for cell in cells) + " |"
            return "\n".join([row(headers), row(["---"] * len(headers)), *map(row, rows)])
        heading = "".join("<th>" + escape(value) + "</th>" for value in headers)
        body = "".join("<tr>" + "".join("<td>" + escape(value) + "</td>" for value in row) + "</tr>" for row in rows)
        return '<div class="document-table"><table><thead><tr>' + heading + "</tr></thead><tbody>" + body + "</tbody></table></div>"

    def block(self, block, language=0, markdown=False):
        kind = block["kind"]
        if kind == "state-table":
            return self.table(self.state_table(), language, markdown)
        if kind == "source-index":
            return self.source_index(language, markdown)
        if kind == "table":
            return self.table(block, language, markdown)
        if kind == "code":
            if markdown:
                return "```" + block.get("language", "") + "\n" + block["text"] + "\n```"
            return "<pre><code>" + escape(block["text"]) + "</code></pre>"
        if kind in {"list", "steps"}:
            values = [self.text(item, language) for item in block["items"]]
            if markdown:
                return "\n".join((str(i + 1) + ". " if kind == "steps" else "- ") + value for i, value in enumerate(values))
            tag = "ol" if kind == "steps" else "ul"
            return "<" + tag + ">" + "".join("<li>" + escape(value) + "</li>" for value in values) + "</" + tag + ">"
        if kind == "document-list":
            rows = []
            for item in block["items"]:
                title, audience, description, action = [self.text(item[key], language) for key in ("title", "audience", "description", "text")]
                if markdown:
                    rows.append("### " + title + "\n\n" + audience + "\n\n" + description + "\n\n[" + action + "](" + localized(item["href"], language) + ")")
                else:
                    rows.append('<li><a href="' + escape(item["href"]) + '"><strong>' + escape(title) + '</strong><span class="document-audience">' + escape(audience) + '</span><span>' + escape(description) + '</span><span class="document-list-action">' + escape(action) + ' →</span></a></li>')
            return "\n\n".join(rows) if markdown else '<ul class="document-manual-list">' + "".join(rows) + '</ul>'
        if kind == "links":
            if markdown:
                return "\n".join("- [" + self.text(item["text"], language) + "](" + localized(item["href"], language) + ")" for item in block["items"])
            return "<ul>" + "".join('<li><a href="' + escape(item["href"]) + '">' + escape(self.text(item["text"], language)) + "</a></li>" for item in block["items"]) + "</ul>"
        text = self.text(block["text"], language)
        if markdown:
            return {"heading": "### ", "note": "> ", "paragraph": ""}[kind] + text
        tag = "h3" if kind == "heading" else "p"
        attribute = ' class="document-note"' if kind == "note" else ""
        return "<" + tag + attribute + ">" + escape(text) + "</" + tag + ">"

    def page(self, doc):
        sections = []
        for index, section in enumerate(doc["sections"]):
            aliases = "".join('<span id="' + escape(alias) + '" aria-hidden="true"></span>' for alias in section.get("aliases", []))
            adjacent = []
            if index:
                previous = doc["sections"][index - 1]
                adjacent.append('<a rel="prev" href="#' + previous["id"] + '">← ' + escape(self.text(previous["title"])) + '</a>')
            if index + 1 < len(doc["sections"]):
                following = doc["sections"][index + 1]
                adjacent.append('<a rel="next" href="#' + following["id"] + '">' + escape(self.text(following["title"])) + ' →</a>')
            chapter_links = '<nav class="document-chapter-links" aria-label="章节导航">' + "".join(adjacent) + '</nav>' if doc["page"] != "docs" else ""
            sections.append('<section id="' + escape(section["id"]) + '">' + aliases + "<h2>" + escape(self.text(section["title"])) + "</h2>" + "".join(self.block(block) for block in section["blocks"]) + chapter_links + "</section>")
        siblings = '<nav class="document-links" aria-label="文档分类">' + "".join('<a href="' + page + '.html"' + (' aria-current="page"' if page == doc["page"] else "") + ">" + label + "</a>" for page, label, _ in LINKS) + "</nav>"
        contents = '<details class="document-toc"><summary>本页目录</summary><ol>' + "".join('<li><a href="#' + section["id"] + '">' + escape(self.text(section["title"])) + "</a></li>" for section in doc["sections"]) + "</ol></details>"
        return self.template.substitute(
            version=self.version, title=escape(self.text(doc["title"])), lead=escape(self.text(doc["lead"])), page=doc["page"], markdown=doc["markdown"],
            styles="\n".join('<link rel="stylesheet" href="' + file + "?v=" + self.version + '">' for file in STYLES),
            scripts="\n".join('<script src="' + file + "?v=" + self.version + '" defer></script>' for file in SCRIPTS),
            navigation=navigation_html(load_catalog(self.root), doc["page"] + ".html"),
            siblings=siblings, contents=contents, sections="\n".join(sections),
        )

    def markdown(self, doc, language):
        lines = ["# " + self.text(doc["title"], language), "", self.text(doc["lead"], language), ""]
        lines += ["- [" + self.text(section["title"], language) + "](" + localized(doc["page"] + ".html", language) + "#" + section["id"] + ")" for section in doc["sections"]]
        for section in doc["sections"]:
            lines += ["", "## " + self.text(section["title"], language), "", "\n\n".join(self.block(block, language, True) for block in section["blocks"])]
        return "\n".join(lines) + "\n"

    def outputs(self):
        result = {}
        for doc in self.data["documents"]:
            result[doc["page"] + ".html"] = self.page(doc)
            for language in (0, 1):
                result[localized(doc["markdown"], language)] = self.markdown(doc, language)
        for _, zh, en in LINKS:
            self.dictionary[zh] = en
        self.dictionary.update({"章节导航": "Chapter navigation", "阅读进度": "Reading progress", "文档分类": "Document categories", "本页目录": "Contents", "下载本文 Markdown": "Download this document as Markdown", "返回文档中心": "Back to documentation"})
        existing = json.loads((self.root / "i18n-docs.json").read_text())
        existing.update(self.dictionary)
        result["i18n-docs.json"] = json.dumps(existing, ensure_ascii=False, indent=2) + "\n"
        return result


def generate(data, root=ROOT):
    validate(data, root)
    return DocumentRenderer(data, root).outputs()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    outputs = generate(load(ROOT))
    stale = []
    for name, content in outputs.items():
        path = ROOT / name
        if args.check:
            if not path.is_file() or path.read_text() != content:
                stale.append(name)
        else:
            path.write_text(content)
    if stale:
        raise SystemExit("Stale documentation: " + ", ".join(stale))
    print(f"Validated four bilingual documents and {len(state_fields(ROOT))} shared-state definitions")


if __name__ == "__main__":
    main()
