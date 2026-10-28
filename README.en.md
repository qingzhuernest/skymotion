# SkyMotion · Sky Motion Lab

Customization highlights selected cities across views. Saved layouts can optionally include observation conditions, reference objects and constructed scenes as a full experiment.

A browser laboratory for geography teaching and independent observation. Control location, date and time to explore the Sun, Moon, shadows, sundials and analemmas, then compare related diagrams and 3D views. Native HTML, CSS and JavaScript run without a build step.

[简体中文](README.md) · **English**

[Open the production site](https://skymotion-5md.pages.dev/index.en.html) · [GitHub Pages mirror](https://qingzhuernest.github.io/skymotion/index.en.html)

Lab, related diagrams and analemma share one workspace. Existing URLs still select their corresponding views, and the top navigation stays stable. In the left sidebar choose Views & layout, expand Sky & shadows, Related diagrams or Compare & build, and select a named view. Observation controls retains location, date, time and the original experiment settings.

To show sky, Earth, altitude and analemma together, start with Space view, enter customization beside language, then use the add controls beside the view names in Views & layout. An included view offers removal; selecting its name still displays it or replaces the selected pane. Additional views extend below the fold after four panes.

The interface uses shared Material Design 3 color, shape, state and target-size roles while preserving the requested Chinese Song and English Charter fonts. Edit actions in combined views live in their pane headers instead of covering the scientific content. Observation identity starts the app bar; direct segmented buttons switch Sun/Moon. All four sky viewpoints live under Views & layout → Sky & shadows, without duplicate controls above the canvas.

The compact playback panel groups the exact clock and slider; Moon puts dates first. Calculation notes expand on demand. The opening retains direct sky and Enter activation, and manuals offer chapter navigation and reading progress.

## Using the lab and its documentation

- [Documentation center](site/docs.en.html): one top-menu entry for teaching, feature usage and development.
- [Learning guide](site/learning-guide.en.md): lesson design, investigations, recording and assessment.
- [Project & feature manual](site/project-guide.en.md): all modules, controls, comparisons, customization, saving and interaction.
- [Development guide](site/development-guide.en.md): code responsibilities, state, calculations, rendering, checks and deployment.
- [Customization instructions](site/docs/customization-interaction.en.md): add cities, time markers, reference lines and physical objects, edit their properties and save plans.

Customize is beside the language button. Observation controls continues to set the baseline experiment; Plot objects adds and adjusts comparisons. Cities and times remain linked across relevant diagrams. Rods, spheres and circles are placed on the experiment ground. See the [customization examples](site/guide.en.html#customization).

Related Diagrams → Moon → Earthrise and Earthset links a lunar-orbit overview with an astronaut view. This independent illustrative orbit retains the left explanation, parameters and bottom controls. It is not a spacecraft trajectory prediction for a real date.

## Run locally

```sh
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000/`. English has separate pages, such as `lab.en.html` and `space/index.en.html`. A modern browser is required; 3D views require WebGL.

## Edit documents and bilingual pages

The bilingual source for the documentation center and three manuals is `docs/document-content.json`. Generate HTML and Markdown first, then English pages and the shared dictionary:

Pages and views share `site/site-catalog.json`; observation defaults and validation rules share `site/lab-state.json`. After editing these sources, run `python3 scripts/site_sources.py`. Generated regions are checked, so routes and enums are no longer maintained by hand in multiple modules.

```sh
python3 scripts/site_sources.py
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py --dist site
python3 scripts/prerender-pages.py --check
```

The generator synchronizes English HTML, `language-data.js` and the preload manifest while preserving DOM IDs, form values, numerical attributes and scientific scripts. Keep the Chinese and English Markdown downloads of all three documents aligned. Update the relevant topic rather than appending release logs to the document.

Interface colors are defined in `site/ui-palette.css`; controls consume `--design-*` variables instead of defining page-specific colors. The compact object menu keeps history in the action row and expands help on demand, leaving more room for objects and properties.

The [concentrated UI review](site/docs/ui-code-review.en.md) records reproduced defects, shared mode-switch ownership and validation scope.

## Automated checks

Use Node 22 or later, Python 3 and Chromium:

```sh
npm ci --prefix tests/browser
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" SKY_MOTION_CHROMIUM=/usr/bin/chromium node .github/scripts/verify-site.cjs
```

If Chromium is not installed, run `tests/browser/node_modules/.bin/playwright install --with-deps chromium` and point `SKY_MOTION_CHROMIUM` to the installed executable.

The verifier uses an isolated temporary port and discovers `.cjs` tests at the `tests/` root, excluding helper modules. Append filenames for a focused run, such as `node .github/scripts/verify-site.cjs session-validation.cjs`. Checks cover model boundaries, common interactions, customization, save/restore behavior, bilingual content, font loading and deployment paths. Browser tools are not published with the website. Automation primarily uses Chromium and does not replace Safari, Firefox or real touch-device testing.

## State and resource loading

Session restoration validates dates, numerical ranges, types and choices; unknown versions are ignored. When storage is unavailable, an in-memory backup supports only the current page and cannot guarantee persistence after closing the page or switching devices. Save objects locally or export JSON for backup.

Only `page-boot.js` blocks parsing to choose the language; other scripts use `defer` in dependency order. The welcome constellation waits for activation. Document introductions respect visit scope and reduced-motion preferences. Font or language-resource failures offer a retry that preserves the experiment settings. Background preloading is not offline installation.

## Deploy and restore

Pushing `main` runs shared `validate.yml` once, then deploys the same static site to Cloudflare Pages and GitHub Pages independently. The mirror reuses the successful validation instead of repeating browser setup and checks. The default is the release suite; full regression is a manual `full_regression` option. Other branches do not publish production. Verify both deployment results.

Restore a known good version through a restoration commit that preserves `main` history; do not force-push. `tests/deployment-paths.cjs` checks root and GitHub project-path packaging.

## License and feedback

Original application code uses [GNU AGPLv3](LICENSE) (AGPL-3.0-only). Third-party libraries, fonts, imagery and data retain their own licenses; see [NOTICE](NOTICE) and [Third-Party Notices](THIRD-PARTY-NOTICES.md).

For an issue, include the module, location, experiment date and time, reproduction steps, device and browser: [Contact the author](https://skymotion-5md.pages.dev/contact.en.html) · [GitHub Issues](https://github.com/qingzhuernest/skymotion/issues).


Customization starts from experiment goals for cities, times and dates. Selected references support slider previews, precise inputs, grouped undo and cancellation. See the [learning guide](site/learning-guide.en.md).

## Repository layout

`site/` contains the public website; `docs/` holds authoring and maintenance records; `scripts/` contains generators; `tests/` contains verification. See the [repository guide](docs/repository.md) for file ownership and branch policy. Only `main` publishes production.
