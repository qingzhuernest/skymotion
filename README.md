# SkyMotion — Impeccable preview

This branch contains the bilingual Impeccable UI preview. It is independent of `main`; pushing this branch does not publish the Cloudflare or GitHub Pages production sites. Deployment jobs are restricted to `refs/heads/main`, including manual runs.

The astronomy engine, ephemerides and scientific models retain the production implementation. The preview adds unified serif typography and color tokens, English Charter fonts, state-preserving language switching, twelve generated English pages, and idle browser caching of twenty-four HTML pages.

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

This branch does not include GPT Site hosting configuration, temporary credentials, review screenshots or local plugin installations.
