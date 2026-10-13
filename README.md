# SkyMotion — bilingual astronomy laboratory

The production release includes the reviewed bilingual Impeccable interface. [Cloudflare Pages](https://skymotion-5md.pages.dev/) is the primary site; [GitHub Pages](https://qingzhuernest.github.io/skymotion/) mirrors the same tracked content. Pushing `main` triggers both deployment workflows. Other branches do not deploy production, including manual runs.

The astronomy engine, ephemerides and scientific models retain the production implementation. The interface adds unified serif typography and color tokens, English Charter fonts, state-preserving language switching, twelve generated English pages, and idle browser caching of twenty-four HTML pages.

## Run locally

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. English pages use sibling filenames such as `lab.en.html` and `space/index.en.html`.

## Regenerate English pages

```sh
python3 scripts/prerender-pages.py --dist .
```

Edit the Chinese HTML and `i18n-*.json` dictionaries, then regenerate the English HTML, `language-data.js`, and `page-cache-manifest.json`. Generated pages preserve IDs, form values, numerical attributes and scientific scripts.

## Documentation and license

- [Learning guide](learning-guide.md) · [English](learning-guide.en.md)
- [Project introduction](project-guide.md) · [English](project-guide.en.md)
- [Development guide](development-guide.md) · [English](development-guide.en.md)
- Application: [AGPLv3](LICENSE). Font, image and library licenses: [third-party notices](THIRD-PARTY-NOTICES.md).

The repository does not include GPT Site hosting configuration, temporary credentials, review screenshots or local plugin installations.

## Review regressions

With a local server running and Playwright available, run `node tests/review-regressions.cjs`. Optional `SKY_MOTION_TEST_URL`, `SKY_MOTION_PLAYWRIGHT` and `SKY_MOTION_CHROMIUM` select the test server, module and browser executable. The suite covers stalled-font recovery and retry, explicit-language navigation, calendar month/year values, leap-day clamping, browser undo and keyboard focus at phone/tablet widths.

## Release and rollback — October 13, 2026

Core astronomy libraries and model data are unchanged from production baseline `4390ab1`. UI checks cover 36 control layouts, 44 first disclosures, interaction history, language navigation, font timeout recovery and calendar keyboard use. These are primarily Chromium checks; complete Safari/Firefox and GPU certification remains outside the verified scope.

Regenerate English pages after editing Chinese HTML or dictionaries. Keep all three Chinese and English Markdown downloads synchronized with the reading pages. Font readiness has an eight-second timeout and explicit retry. Cache warming starts after the foreground page is ready, using two low-priority requests; this is not an offline application or a guarantee that all pages are cached immediately.

The previous production commit is tagged `production-before-impeccable-20261013`. Restore it with a new commit if necessary; do not force-push main. Check both deployment workflows before calling the release successful. `tests/deployment-paths.cjs` validates root and GitHub project-path packaging.
