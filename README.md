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

## Session hardening and automated deployment gates — October 14, 2026

`experiment-storage.js` validates persisted dates, ranges, types and enumerated choices before restoring laboratory state. Valid legacy sessions remain readable; saves use `schemaVersion: 1`. Invalid fields use defaults, and unknown versions are ignored. Blocked or quota-limited storage falls back to a detached memory snapshot for the current page only. The 3D observer uses the same date and coordinate validation.

Both production workflows require `.github/workflows/validate.yml` to pass before deployment. It installs the locked CI-only Playwright/Chromium tools under `tests/browser`, starts a disposable local server and runs all 15 root-level `.cjs` suites. No browser tools or test source are packaged into the static site.

To run the same gate locally with Node 22+, Python 3 and installed Chromium:

```sh
npm ci --prefix tests/browser
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" SKY_MOTION_CHROMIUM=/usr/bin/chromium node .github/scripts/verify-site.cjs
```

For systems without Chromium, install it with `tests/browser/node_modules/.bin/playwright install --with-deps chromium` and set `SKY_MOTION_CHROMIUM` to the executable path returned by Playwright. Browser regressions primarily verify Chromium; they are not a complete real-device compatibility certification.

## Review follow-up — October 14, 2026

Historical snapshots are validated before restoration; incompatible entries use a valid fallback, and a generation-aware finally releases the undo lock. Language-switch failures display a visible, localized notice with a retry for the target language. Bilingual CI now checks generated-output freshness as well as structure; run `python3 scripts/prerender-pages.py --check` for a read-only check of English HTML, the dictionary bundle and preload manifest. `tests/review-followup.cjs` covers corruption, adapter failure, mobile retry and stale generation; production gates run all 17 suites.

## Welcome reflections — October 14, 2026

The Chinese welcome page keeps its original handwritten footer. English mode displays the supplied reflection, “Everyone here wants to understand something. What matters is whether you can stay curious when the answers don't come.”, at that same centered bottom position. Both use the existing warm night palette; English uses local Charter. These are locale-specific reflections rather than translations of each other. The sentence no longer appears below the entry action, and the welcome page requires only its selected locale's normal font preparation.

欢迎页首次进入时以星点与连线组成 Ad Astra，保持星座画面，用户点击后才散入互动星空并显露首页。每个标签页仅播放一次；Enter 或空格也可开始，减少动态效果时直接显示首页。

封面 Ad Astra 使用本地 Charter 斜体的曲线轮廓，由约400颗暖白星点及淡金细线组成。字形预先生成，首次显示不增加字体请求；仍由点击、Enter 或空格启动散开。

三篇文档各有一段原创的完整中英文对话，分别讨论地理学习、模型与世界、模型失效后的再观察。语句逐句从两侧显现，可继续阅读或用键盘跳过。欢迎页入口由深色平缓转为浅色；浅色入口保持纸色。每篇文档在同次访问中只展示一次，内部跳转、返回和刷新不重播；新的独立／外部干净链接访问可再次播放。开场星点的色彩与亮度在散开过程中连续融合，不在结束时切换。

Loading performance: Reading WOFF2 subsets total 711,888 bytes (26% smaller), with verified identical character coverage, outlines and advance widths. `scripts/optimize-reading-fonts.py` reproduces the optimization. Background warming prioritizes the current language, keeps all 24 pages, excludes obsolete font variants, and uses the same versioned Reading URLs as the foreground. In one controlled Chromium cold-load comparison (80 ms latency, 500 KB/s), Chinese font readiness improved from 3.60 s to 3.10 s; actual device/network timings vary.

Ordered loading: only `page-boot.js` blocks parsing, to choose the correct locale before content. Other external scripts use `defer` and retain dependency order. The Welcome canvas and document conversations start before the shared translation dictionary finishes; their local copy remains bilingual. Deferred language initialization still waits for DOMContentLoaded so experiment globals exist. Cover failure recovery also waits for deferred startup, rather than skipping a healthy opening.

Controlled parser-order comparison (Chromium, 100 ms latency, 500 KB/s): English star-cover script readiness improved from 2.90 s to 1.31 s with identical shared assets. This measures cover startup, not whole-application interactivity or real-device Safari performance.
