# SkyMotion Search

Search is released with the main site. The search component is shared across site pages and
does not read or mutate scientific state, records or preferences. It keeps questions
only in page memory; all retrieval and inference runs on the same origin/device.

## Implemented

- 633 namespaced units: 355 updated website cards, 152 science cards, 60 public
  manual chapters and 66 current source-file descriptors. The update snapshots are
  in `sources/update142/`; the original science snapshot remains in `sources/`.
  Eight foundational science entries in `science-basics.json` have bilingual
  explanations and linked NASA, IAU and Stanford references, checked on 2026-11-01.
  The original 625 units are preserved.
  28 common cards have curated instructions and English answers. The remaining
  original cards keep their draft status; published chapters are sourced directly
  from the current structured bilingual manuals, not blanket-certified as UI-tested.
  All 13 revisions in the updated website document are imported.
- BM25-style weighted local text retrieval and aliases; a limited save-after-city-
  comparison follow-up. Arbitrary conversational memory is not implemented.
- A real BGE-small-zh-v1.5 INT8 ONNX model, fixed revision, 512-dimensional CLS unit
  vectors. All document vectors are generated offline. Long documents are chunked with overlapping windows before embedding. One WASM Worker computes queries and starts preparing on page entry. No cloud LLM, API key, GPU or third-party CDN is required.
- Semantic matches require a documented source, lexical support and a clear margin; otherwise they remain candidate entries.
  Direct answers require a sufficiently strong text match; dynamic-value and
  automatic-action requests return instructions rather than executing page controls.
- Model/worker failure falls back to text retrieval; dialog keyboard/focus handling,
  safe text rendering, bilingual shell, copy action and same-origin guide links.
- Page entry immediately downloads the knowledge, search module, index, tokenizer,
  model and WASM runtime, then initializes the model and runs a warm-up inference.
  No dialog opening or question is required. A single shared preparation promise
  prevents duplicate initialization; early text searches remain available while it
  runs. Background failures stay silent and a later semantic search retries.
  The general page warmer excludes `assistant/` because the search loader owns these
  requests, avoiding an extra independently versioned download of the same assets.
  Downloads total approximately 49 MB before compression; completion depends on
  the network and device. Page visibility does not mean model readiness.


## Rebuild

```sh
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci --prefix scripts/assistant
python3 scripts/assistant/download-model.py
python3 scripts/site_sources.py
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py
python3 scripts/build-assistant-knowledge.py
node scripts/assistant/build.mjs
python3 scripts/assistant/resource-report.py
python3 scripts/prerender-pages.py
python3 scripts/build-assistant-knowledge.py --check
```

The download script checks pinned SHA-256 values; never use a mutable model revision
to rebuild an old index. Knowledge changes require rebuilding the index. The worker
verifies the index hash, length and knowledge version before use. WASM is bundled
from ONNX Runtime 1.21.0 via pinned Transformers.js 3.8.1; dependencies are locked.
The runtime conservatively uses one WASM thread without requiring cross-origin
isolation or WebGPU. Model weights (~23.9 MB) and WASM (~21.6 MB) each fit the current
static hosting per-file size limit.

## Evidence and limitations

`tests/assistant-prototype.cjs` covers known questions, follow-up, numeric refusal,
safe DOM insertion, real browser BGE inference, scientific state isolation, failed
Worker fallback, English answers and guide links, mobile, and `/skymotion/` paths.
`resource-report.json` reports raw sizes and local gzip estimates, excluding the
existing website's assets. Worker resource timing is collected separately because
page-only PerformanceResourceTiming misses Worker downloads.

This is not a calibrated 200-query/95% release evaluation. Do not advertise a measured
accuracy percentage. In particular, the phrase “地球绕太阳走动的时候怎么会让冷暖交替出现”
retrieved poor candidates in the initial BGE test. The explicit-seasons paraphrase
“一年四季为什么会轮流变换呢” retrieved the relevant seasons entries. More semantic
coverage, disambiguation, independent human evaluation and complete English content
remain known limitations of this release. The source-checked cards have not all
been independently click-tested from scratch. Source draft labels are intentional.

The current English path relies mostly on authored English aliases; a Chinese BGE
model is not evidence of high-quality multilingual retrieval. Cached/offline use
depends on browser storage availability; there is no offline-install guarantee.
Memory, frame-rate impact and Safari/iPad performance are not yet measured. Browser
tests run in Chromium on the development host, not on the user's iPad.

The reported-query follow-up, task routing, compact chat layout and local-only
diagnostics are documented in [REPORTED-FIXES.md](REPORTED-FIXES.md).

The 625-unit update and short-question coverage are documented in [UPDATE142.md](UPDATE142.md).

Corpus-wide matching, source-status handling and full coverage evidence are described
in [UPDATE143.md](UPDATE143.md).

## Release 145

The visible name is 搜索 / Search. Automatic preparation replaces the old on-demand
policy described in historical UPDATE142/143 reports. The browser regression now
requires model downloads and a ready Worker before opening the dialog, and still
checks same-origin requests, failure fallback and unchanged scientific state.

## Science coverage

Release 146 adds eight sourced basics: the Sun, its color and energy, the Solar
System, its eight planets, the Moon, planets and stars. Factual questions no longer
enter the feature-topic shortcut; exact scientific concepts can match a science
entry even when several related manuals are also relevant. “Solar System planets”
returns science, while “how to open the Solar System” still returns site guidance.
External references stay collapsed with the existing sources, without extra
implementation notes. These eight additions do not constitute an encyclopedia.
