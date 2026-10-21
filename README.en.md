# SkyMotion — Astronomy and Geography Laboratory

2026-10-21: customization follows Add–Select–Adjust. Cities and times remain linked across plots, physical objects use the experiment ground, and native controls remain available. The [learning guide](guide.en.html#customization) includes three complete examples.

[简体中文](README.md) · **English**

## Release status

The October 20, 2026 release publishes reviewed preview 72 customization: fixed navigation, in-Lab place/time comparisons, plot references, construction tools, persistent 3D entry, empty Sun/Moon construction scenes and matching plot colors. Existing Earthrise and production font-loading optimizations are retained. The main branch contains 13 bilingual page pairs; release validation runs all root-level regression scripts.

[Customization interaction guide](docs/customization-interaction.en.md) · [Release notes](docs/RELEASE-2026-10-21.en.md)

The production release includes the reviewed bilingual Impeccable interface. [Cloudflare Pages](https://skymotion-5md.pages.dev/) is the primary site; [GitHub Pages](https://qingzhuernest.github.io/skymotion/) mirrors the same tracked content. Pushing `main` triggers both deployment workflows. Other branches do not deploy production, including manual runs.

The astronomy engine, ephemerides and scientific models retain the production implementation. The interface adds unified serif typography and color tokens, English Charter fonts, state-preserving language switching, generated English sibling pages and idle browser caching. See the release status above for the current page count.

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

- Learning guide: [English](learning-guide.en.md) · [简体中文](learning-guide.md)
- Project introduction: [English](project-guide.en.md) · [简体中文](project-guide.md)
- Development guide: [English](development-guide.en.md) · [简体中文](development-guide.md)
- Application: [AGPLv3](LICENSE). Font, image and library licenses: [third-party notices](THIRD-PARTY-NOTICES.md).

The repository does not include GPT Site hosting configuration, temporary credentials, review screenshots or local plugin installations.

## Review regressions

With a local server running and Playwright available, run `node tests/review-regressions.cjs`. Optional `SKY_MOTION_TEST_URL`, `SKY_MOTION_PLAYWRIGHT` and `SKY_MOTION_CHROMIUM` select the test server, module and browser executable. The suite covers stalled-font recovery and retry, explicit-language navigation, calendar month/year values, leap-day clamping, browser undo and keyboard focus at phone/tablet widths.

## Release and rollback — October 13, 2026

Core astronomy libraries and model data are unchanged from production baseline `4390ab1`. UI checks cover 36 control layouts, 44 first disclosures, interaction history, language navigation, font timeout recovery and calendar keyboard use. These are primarily Chromium checks; complete Safari/Firefox and GPU certification remains outside the verified scope.

Regenerate English pages after editing Chinese HTML or dictionaries. Keep all three Chinese and English Markdown downloads synchronized with the reading pages. Font readiness has an eight-second timeout and explicit retry. Cache warming starts after the foreground page is ready, using two low-priority requests; this is not an offline application or a guarantee that all pages are cached immediately.

The previous production commit is tagged `production-before-impeccable-20261013`. Restore it with a new commit if necessary; do not force-push main. Check both deployment workflows before calling the release successful. `tests/deployment-paths.cjs` validates root and GitHub project-path packaging.

## Session hardening and automated deployment gates — October 14, 2026

`experiment-storage.js` validates persisted dates, ranges, types and enumerated choices before restoring laboratory state. Valid legacy sessions remain readable; saves use `schemaVersion: 1`. Invalid fields use defaults, and unknown versions are ignored. Blocked or quota-limited storage falls back to a detached memory snapshot for the current page only. The 3D observer uses the same date and coordinate validation.

Both production workflows require `.github/workflows/validate.yml` to pass before deployment. It installs the locked CI-only Playwright/Chromium tools under `tests/browser`, starts a disposable local server and discovers and runs every root-level `.cjs` suite. No browser tools or test source are packaged into the static site.

To run the same gate locally with Node 22+, Python 3 and installed Chromium:

```sh
npm ci --prefix tests/browser
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" SKY_MOTION_CHROMIUM=/usr/bin/chromium node .github/scripts/verify-site.cjs
```

For systems without Chromium, install it with `tests/browser/node_modules/.bin/playwright install --with-deps chromium` and set `SKY_MOTION_CHROMIUM` to the executable path returned by Playwright. Browser regressions primarily verify Chromium; they are not a complete real-device compatibility certification.

## Review follow-up — October 14, 2026

Historical snapshots are validated before restoration; incompatible entries use a valid fallback, and a generation-aware finally releases the undo lock. Language-switch failures display a visible, localized notice with a retry for the target language. Bilingual CI now checks generated-output freshness, structure and complete English text (excluding intentional bilingual quotes); run `python3 scripts/prerender-pages.py --check` for a read-only check of English HTML, the dictionary bundle and preload manifest. `tests/review-followup.cjs` covers corruption, adapter failure, mobile retry and stale generation; production gates discover all regression scripts automatically.

## Welcome reflections — October 14, 2026

The Chinese welcome page keeps its original handwritten footer. English mode displays the supplied reflection, “Everyone here wants to understand something. What matters is whether you can stay curious when the answers don't come.”, at that same centered bottom position. Both use the existing warm night palette; English uses local Charter. These are locale-specific reflections rather than translations of each other. The sentence no longer appears below the entry action, and the welcome page requires only its selected locale's normal font preparation.

On the first welcome-page visit, stars and connecting lines form Ad Astra. The constellation waits for a click, Enter or Space before dispersing into the interactive sky and revealing the welcome page. It plays once per tab; reduced-motion mode exposes the welcome page directly.

Ad Astra follows the outlines of local Charter Italic, using approximately 400 warm-white stars and fine gold lines. Pre-generated lettering adds no font request to the opening. Dispersal remains explicitly activated by click, Enter or Space.

Each of the three documents opens with a complete original conversation in the selected language: learning geography, models and the world, or observing again when a model fails. Lines appear sequentially from the sides; readers can continue or skip by keyboard. Welcome-page entries transition from dark to paper, while entries from light pages retain paper. Each document plays once per visit, without replaying on internal navigation, return or refresh; a clean external or independent visit may replay it. Opening-star color and brightness blend continuously rather than switching at the end.

## Loading performance and order

Earlier loading measurements: Reading WOFF2 subsets totaled 711,888 bytes (26% smaller), with verified identical character coverage, outlines and advance widths. `scripts/optimize-reading-fonts.py` reproduces the optimization. At the time of that measurement, background warming prioritized the current language, kept all 24 pages, excluded obsolete font variants, and used the same versioned Reading URLs as the foreground. In one controlled Chromium cold-load comparison (80 ms latency, 500 KB/s), Chinese font readiness improved from 3.60 s to 3.10 s; actual device/network timings vary.

Ordered loading: only `page-boot.js` blocks parsing, to choose the correct locale before content. Other external scripts use `defer` and retain dependency order. The Welcome canvas and document conversations start before the shared translation dictionary finishes; their local copy remains bilingual. Deferred language initialization still waits for DOMContentLoaded so experiment globals exist. Cover failure recovery also waits for deferred startup, rather than skipping a healthy opening.

Controlled parser-order comparison (Chromium, 100 ms latency, 500 KB/s): English star-cover script readiness improved from 2.90 s to 1.31 s with identical shared assets. This measures cover startup, not whole-application interactivity or real-device Safari performance.

## Earthrise lesson — production

 Linked Diagrams → Moon → Earthrise and Earthset opens an independent circular lunar-orbit model. The original left explanation/parameter rail and bottom workbench remain in place; the right image area uses one WebGL context for an orbit diagram and physical astronaut view. Earthrise playback slows at the limb and pauses once Earth is fully visible; turning away gives an explicit return-to-Earth hint. Adjustable orbital height, geometry, field of view, surface-site comparison and limb-contact playback are presentation controls independent of the dated ephemeris workbench. The lesson prepares its first frame, texture, fonts and sidebar in the background before switching all regions together; cold loading keeps the current diagram visible. There is no new welcome-page entry; this lesson is included in the production release.

Earthrise interaction follow-up: dragging distinguishes the Moon from the orbiter in screen pixels and preserves the initial grab offset. Height changes pause and invalidate guided contacts; guided playback can pause/resume without becoming a normal orbit. The overview responds to height, its observer marker stays identifiable, and the Earth-tracking camera uses a continuous roll reference across zenith.
