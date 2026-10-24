"""Validate document content before any output is written."""
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit
from html.parser import HTMLParser
from site_sources import load_state

KINDS = {"paragraph", "heading", "note", "code", "list", "steps", "table", "links", "source-index", "state-table"}


def bilingual(value):
    if not isinstance(value, list) or len(value) != 2 or not all(isinstance(s, str) and s.strip() for s in value):
        raise ValueError("Expected nonempty Chinese/English text: " + repr(value)[:100])
    return value


def state_fields(root):
    result = {}
    for name, values in load_state(root)["defaults"].items():
        for key, value in values.items():
            result.setdefault(key, {})["initialSun" if name == "sun" else "initialMoon"] = json.dumps(value, ensure_ascii=False)
    return result


class AnchorParser(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = set()
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        identifier = dict(attributes).get("id")
        if identifier:
            self.ids.add(identifier)


def validate(data, root):
    root = root.resolve()
    actual, described = set(state_fields(root)), set(data["state_dictionary"])
    if actual != described:
        raise ValueError(f"State dictionary mismatch; missing={sorted(actual-described)}, obsolete={sorted(described-actual)}")
    for entry in data["state_dictionary"].values():
        bilingual(entry["meaning"])
        bilingual(entry["unit"])
    pages, outputs, anchors, links = set(), set(), {}, []
    for doc in data["documents"]:
        page, markdown = doc["page"], doc["markdown"]
        if not re.fullmatch(r"[a-z][a-z-]*", page) or page in pages:
            raise ValueError("Invalid or duplicate document page: " + page)
        if not re.fullmatch(r"[a-z][a-z-]*\.md", markdown) or markdown in outputs:
            raise ValueError("Invalid or duplicate Markdown path: " + markdown)
        pages.add(page)
        outputs.add(markdown)
        bilingual(doc["title"])
        bilingual(doc["lead"])
        ids = set()
        for section in doc["sections"]:
            bilingual(section["title"])
            for identifier in [section["id"], *section.get("aliases", [])]:
                if not re.fullmatch(r"[A-Za-z][\w.-]*", identifier) or identifier in ids:
                    raise ValueError("Invalid or duplicate anchor: " + page + "#" + identifier)
                ids.add(identifier)
            for block in section["blocks"]:
                kind = block.get("kind")
                if kind not in KINDS:
                    raise ValueError("Unknown document block: " + repr(kind))
                if kind in {"paragraph", "heading", "note"}:
                    bilingual(block["text"])
                elif kind in {"list", "steps"}:
                    for item in block["items"]:
                        bilingual(item)
                elif kind == "table":
                    headers = block["headers"]
                    if not headers:
                        raise ValueError("Table must have headers")
                    for cell in headers:
                        bilingual(cell)
                    for row in block["rows"]:
                        if len(row) != len(headers):
                            raise ValueError("Mismatched table columns: " + page)
                        for cell in row:
                            bilingual(cell)
                elif kind == "links":
                    for item in block["items"]:
                        bilingual(item["text"])
                        links.append((page, item["href"]))
                elif kind == "code" and not isinstance(block["text"], str):
                    raise ValueError("Code must be text")
        anchors[page + ".html"] = ids
    for page, href in links:
        url = urlsplit(href)
        if url.scheme:
            if url.scheme not in ("http", "https"):
                raise ValueError("Unsupported link scheme: " + href)
            continue
        if url.netloc:
            raise ValueError("Link must be explicitly local or HTTPS: " + href)
        relative = unquote(url.path) or page + ".html"
        target = (root / relative).resolve()
        if not target.is_relative_to(root):
            raise ValueError("Link leaves site: " + href)
        if target.is_dir():
            target /= "index.html"
            relative = target.relative_to(root).as_posix()
        if relative not in anchors and not target.is_file():
            raise ValueError("Missing local link: " + href)
        if url.fragment:
            ids = anchors.get(relative)
            if ids is None:
                ids = AnchorParser(target.read_text()).ids
            if unquote(url.fragment) not in ids:
                raise ValueError("Missing linked anchor: " + href)
    for path, description in data["source_files"].items():
        target = (root / path).resolve()
        if not target.is_relative_to(root) or not target.is_file() or target.suffix != ".js":
            raise ValueError("Invalid source file: " + path)
        bilingual(description)
    return data


def load(root):
    data = json.loads((root / "docs/document-content.json").read_text())
    return validate(data, root)
