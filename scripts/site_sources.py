"""Validated, canonical page/view catalogs and experiment state definitions."""
import argparse
import json
import math
import html
import posixpath
from pathlib import Path
import re

ROOT = (Path(__file__).resolve().parents[1] / "site")


def read_json(root, name):
    return json.loads((root / name).read_text(encoding="utf-8"))


def load_catalog(root=ROOT):
    catalog = read_json(root, "site-catalog.json")
    paths = [page["path"] for page in catalog["pages"]]
    if len(paths) != len(set(paths)) or any(
        not re.fullmatch(r"[a-z0-9/-]+\.html", path) or ".." in path for path in paths
    ):
        raise ValueError("Invalid or duplicate page path")
    ids = [view["id"] for view in catalog["views"]]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate view ID")
    group_ids = catalog["groupIds"]
    if len(group_ids) != len(catalog["groups"]) or len(group_ids) != len(set(group_ids)) or any(
        not re.fullmatch(r"[a-z][a-z-]*", identifier) for identifier in group_ids
    ):
        raise ValueError("Invalid or duplicate view group ID")
    for view in catalog["views"]:
        if view.get("sidebar") not in (None, "conditions", "references"):
            raise ValueError("Invalid view sidebar: " + view["id"])
        if not 0 <= view["group"] < len(catalog["groups"]):
            raise ValueError("Unknown view group: " + view["id"])
        for body, labels in view["labels"].items():
            if body not in ("sun", "moon") or len(labels) != 2 or not all(isinstance(x, str) for x in labels):
                raise ValueError("Invalid view labels: " + view["id"])
        if any(target not in ids for target in view.get("layout", {}).values()):
            raise ValueError("Unknown layout target: " + view["id"])
    return catalog


def load_state(root=ROOT):
    state = read_json(root, "lab-state.json")
    defaults = state["defaults"]
    if defaults["sun"].get("body") != "sun" or defaults["moon"].get("body") != "moon":
        raise ValueError("State defaults must identify their body")
    for name in ("ranges", "choices"):
        for field, values in state[name].items():
            if field not in defaults["sun"] and field not in defaults["moon"]:
                raise ValueError("Unknown state field: " + field)
            if name == "ranges" and (len(values) != 2 or values[0] > values[1]):
                raise ValueError("Invalid range: " + field)
            if name == "choices" and not values:
                raise ValueError("Empty choices: " + field)
    fields = {**defaults["sun"], **defaults["moon"]}
    if len(state["cameraFields"]) != len(set(state["cameraFields"])) or any(field not in fields for field in state["cameraFields"]):
        raise ValueError("Invalid camera field inventory")
    for mode in (defaults["sun"], fields):
        for field, value in mode.items():
            if field in state["ranges"]:
                low, high = state["ranges"][field]
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
                    raise ValueError("Default outside state range: " + field)
            if field in state["choices"] and value not in state["choices"][field]:
                raise ValueError("Default outside state choices: " + field)
    return state


def replace_region(source, name, content):
    start, end = f"// BEGIN GENERATED {name}", f"// END GENERATED {name}"
    pattern = r"(?m)^[ \t]*" + re.escape(start) + r"[\s\S]*?^[ \t]*" + re.escape(end)
    if len(re.findall(pattern, source)) != 1:
        raise ValueError("Missing or ambiguous generated region: " + name)
    indent = "  " if content.startswith("  ") else ""
    return re.sub(pattern, lambda _: indent + start + "\n" + content + "\n" + indent + end, source)


def declarations(values, indent=""):
    return "\n".join(
        indent + "// prettier-ignore\n" + indent + "const " + name + " = " + json.dumps(value, ensure_ascii=False, indent=2).replace("\n", "\n" + indent) + ";"
        for name, value in values.items()
    )


def navigation_html(catalog, page):
    directory = posixpath.dirname(page)
    links = []
    selected = next((entry.get('navigation', page) for entry in catalog['pages'] if entry['path'] == page), page)
    for target, labels in catalog['navigation']:
        path = target + 'index.html' if target.endswith('/') else target
        href = posixpath.relpath(path, directory or '.')
        if target.endswith('/'):
            href = href.removesuffix('index.html') or './'
        current = ' aria-current="page"' if selected == path else ''
        links.append('<a href="' + html.escape(href, quote=True) + '"' + current + '>' + html.escape(labels[0]) + '</a>')
    return '<nav class="page-nav" aria-label="页面导航">' + ''.join(links) + '</nav>'


def generated_sources(root=ROOT):
    catalog, state = load_catalog(root), load_state(root)
    boot = (root / "page-boot.js").read_text()
    boot = replace_region(boot, "CATALOG", declarations({"catalog": catalog}, "  "))
    app = (root / "app.js").read_text()
    sun = declarations({"initialSun": state["defaults"]["sun"]})
    moon = json.dumps(state["defaults"]["moon"], ensure_ascii=False, indent=2)
    defaults = sun + "\n// prettier-ignore\nconst initialMoon = {\n  ...initialSun," + moon[1:] + ";"
    app = replace_region(app, "STATE DEFAULTS", defaults)
    storage = (root / "experiment-storage.js").read_text()
    storage = replace_region(storage, "STATE SCHEMA", declarations({
        "ranges": state["ranges"], "choices": state["choices"], "cameraFields": state["cameraFields"],
    }, "  "))
    palette_css = (root / "ui-palette.css").read_text()
    palettes = {}
    for name, role in {"sage": "accent", "blue": "palette-blue", "gray": "palette-gray"}.items():
        value = re.findall(r"--design-" + role + r":\s*(#[0-9a-fA-F]{6})\s*;", palette_css)
        if len(value) != 1:
            raise ValueError("Palette seed must have one literal definition: " + role)
        palettes[name] = value[0]
    preferences = replace_region((root / "preferences.js").read_text(), "UI PALETTE", declarations({"palettes": palettes}, "  "))
    result = {"page-boot.js": boot, "app.js": app, "experiment-storage.js": storage, "preferences.js": preferences}
    for page in catalog['pages']:
        path = root / page['path']
        if path.is_file():
            source = path.read_text()
            source = re.sub(r'((?:src|href)="(?!https?://|//)[^"]+\.(?:js|css)\?v=)[^"]+', lambda match: match[1] + catalog['resourceVersion'], source)
            directory = posixpath.dirname(page['path']) or '.'
            prefix = posixpath.relpath('.', directory)
            prefix = '/' if page['path'] == '404.html' else ('' if prefix == '.' else prefix + '/')
            assets = '\n'.join([
                '<script src="' + prefix + 'theme-colors.js?v=' + catalog['resourceVersion'] + '"></script>',
                '<script src="' + prefix + 'preferences.js?v=' + catalog['resourceVersion'] + '"></script>',
                '<script src="' + prefix + 'material-web.js?v=' + catalog['resourceVersion'] + '" defer></script>',
                '<script src="' + prefix + 'material-controls.js?v=' + catalog['resourceVersion'] + '" defer></script>',
            ])
            source = re.sub(r'\n?[ \t]*(?:<script src="[^"\n]*(?:theme-colors|preferences|material-web|material-controls)\.js[^"\n]*"(?: defer)?></script>|<link rel="stylesheet" href="[^"\n]*preferences\.css[^"\n]*">)', '', source)
            source = re.sub(r'(<meta\s+charset=[^>]+>)', lambda match: match[1] + '\n' + assets, source, count=1, flags=re.I)
            if page['path'] == '404.html':
                source = source.replace('href="controls.css?', 'href="/controls.css?')
            extra = '' if 'controls.css?' in source else '<link rel="stylesheet" href="' + prefix + 'controls.css?v=' + catalog['resourceVersion'] + '">\n'
            source = source.replace('</head>', extra + '<link rel="stylesheet" href="' + prefix + 'preferences.css?v=' + catalog['resourceVersion'] + '">\n</head>', 1)
            for dependency in ('diagram-reference-store', 'diagram-reference-renderer'):
                if 'diagram-tools.js?' in source and dependency + '.js?' not in source:
                    source = re.sub(r'(<script src="([^"\n]*)diagram-tools\.js[^>]+></script>)',
                        lambda match: '<script src="' + match[2] + dependency + '.js?v=' + catalog['resourceVersion'] + '" defer></script>\n' + match[1], source)
            if page['path'] in ('lab.html','diagrams.html','analemma.html','sundial.html') and 'sky-perspectives.js?' not in source:
                source = re.sub(r'(<script src="custom-layout\.js[^>]+></script>)', '<script src="sky-perspectives.js?v=' + catalog['resourceVersion'] + '" defer></script>\n' + r'\1', source)
            result[page['path']] = re.sub(r'<nav\b[^>]*class="page-nav"[\s\S]*?</nav>', lambda _: navigation_html(catalog, page['path']), source)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    stale = []
    for name, content in generated_sources().items():
        path = ROOT / name
        if args.check:
            if path.read_text() != content:
                stale.append(name)
        else:
            path.write_text(content)
    if stale:
        raise SystemExit("Stale generated sources: " + ", ".join(stale))


if __name__ == "__main__":
    main()
