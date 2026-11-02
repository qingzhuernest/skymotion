# SkyMotion · Apparent Motion Lab

A browser laboratory for geography teaching and independent investigation. Change location, date and time, compare Sun, Moon, shadow, sundial, analemma and spatial diagrams, then record reproducible evidence.

[简体中文](README.md) · **English**

[Production](https://skymotion-5md.pages.dev/) · [GitHub Pages mirror](https://qingzhuernest.github.io/skymotion/) · [Documentation map](docs/README.md)

## Use

Choose Sun or Moon at the top. Views & layout selects diagrams; Observation controls changes place, date, time and model options. The sky viewpoints and related diagrams share one workspace. Customization enables reference objects and geometry while retaining the original observation controls.

Save layouts together with conditions, reference objects and constructed objects, or export a JSON backup. Browser storage does not synchronize across devices. 3D Sky separates physical vectors from display scales; close views use attributed observation-derived mosaics rather than live cloud imagery.

Search uses one input and automatically distinguishes knowledge from usage. It retrieves documented sources, adding local semantic retrieval when needed. It neither reads nor operates experiment state. Assets prepare automatically on page entry; questions are not sent to an external answer service.

## Run locally

```sh
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000/`; English pages include `lab.en.html` and `space/index.en.html`. The scientific application uses native HTML/CSS/JavaScript without a runtime build. 3D requires WebGL. Dedicated builds are needed only for dependencies, theme tooling and the search index.

## Documentation and ownership

| Entry | Purpose |
| --- | --- |
| [Feature manual](site/project-guide.en.md) | Controls, diagrams, customization, Search, saving and troubleshooting |
| [Learning guide](site/learning-guide.en.md) | Investigations, records and assessment |
| [Developer reference](site/development-guide.en.md) | Variables, equations, frames, state, storage and publication |
| [Repository code map](docs/architecture/CODE-MAP.md) | Ownership of code/data files, generated output and dependencies |
| [Tracked-file inventory](docs/file-inventory.md) | All media, licenses, source documents and code |
| [Search maintenance](docs/assistant/README.md) · [contracts](docs/architecture/SEARCH.md) | Retrieval, intent selection, cache, Worker, cancellation and builds |
| [Product](docs/architecture/PRODUCT.md) · [design](docs/architecture/DESIGN.md) | Material 3 Expressive, existing Songti/Charter fonts and responsive behavior |
| [Repository maintenance](docs/repository.md) | Directories, branches, packaging and recovery |

## Edit and generate

`site/` is the only publish root. Modify the owning module instead of introducing competing state or global overrides. Observation defaults and validation live in `site/lab-state.json`; pages and resource versions in `site/site-catalog.json`; theme colors in `site/ui-palette.css`.

The four bilingual manuals share `docs/document-content.json`. Generate pages and dictionaries before rebuilding knowledge and vectors:

```sh
python3 scripts/site_sources.py
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py
python3 scripts/build-assistant-knowledge.py
node scripts/assistant/build.mjs
python3 scripts/assistant/resource-report.py
python3 scripts/prerender-pages.py
```

See Search maintenance for pinned dependencies and model downloads. Do not hand-edit generated English pages, manuals, dictionaries, vectors or dependency bundles. Stage new/moved files, then run `python3 scripts/repository-index.py` to regenerate the inventory and code map.

## Verify

```sh
python3 scripts/check-sources.py
python3 scripts/site_sources.py --check
python3 scripts/build-documents.py --check
python3 scripts/prerender-pages.py --check
python3 scripts/build-assistant-knowledge.py --check
python3 scripts/repository-index.py --check
npm ci --prefix tests/browser
```

Use Node 22 or newer, Python 3, Playwright and Chromium for browser checks:

```sh
tests/browser/node_modules/.bin/playwright install --with-deps chromium
export SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright"
export SKY_MOTION_CHROMIUM="$(node -e "console.log(require('./tests/browser/node_modules/playwright').chromium.executablePath())")"
node .github/scripts/verify-site.cjs assistant-runtime.cjs assistant-prototype.cjs
```

The runner reserves an isolated port and cleans up processes. Pass relevant filenames; omitting them runs every regression. Source parsing, generated-output checks, model validation and browser interactions are distinct evidence. Chromium results do not establish real Safari/iPad performance.

## Publish and recover

`main` is the sole production branch. Shared validation precedes Cloudflare Pages and GitHub Pages deployments; GPT preview uses the same frozen package. Changes select related checks; `full_regression` explicitly opts into the complete suite.

`python3 .github/scripts/prepare_site.py --output dist` copies tracked `site/` files only, excluding development dependencies, tests and work directories. Recover with a new commit rather than force-rewriting main.

## Data, storage and licenses

Readings require explicit place, time and model conditions. Ideal experiments, the independent Earthrise model and real-date ephemerides have distinct assumptions. Search is neither a current-sky calculator nor a general encyclopedia. Restored sessions validate date, range, type and version; unavailable storage falls back to current-page memory.

Original application code uses [AGPLv3](LICENSE). Astronomy libraries, Material Web, fonts, models and planetary imagery retain their own terms; see [third-party notices](site/THIRD-PARTY-NOTICES.md).
