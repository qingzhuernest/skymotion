# Sky assistant — GPT Site preview prototype

This branch is a preview implementation, not an official-site release. The existing
production deployment stays on main. The assistant is shared across site pages and
does not read or mutate scientific state, records or preferences. It keeps questions
only in page memory; all retrieval and inference runs on the same origin/device.

## Implemented

- 625 namespaced units: 355 updated website cards, 144 science cards, 60 public
  manual chapters and 66 current source-file descriptors. The update snapshots are
  in `sources/update142/`; the original science snapshot remains in `sources/`.
  27 common cards have curated instructions and English answers. The remaining
  original cards keep their draft status; published chapters are sourced directly
  from the current structured bilingual manuals, not blanket-certified as UI-tested.
  All 13 revisions in the updated website document are imported.
- BM25-style weighted local text retrieval and aliases; a limited save-after-city-
  comparison follow-up. Arbitrary conversational memory is not implemented.
- A real BGE-small-zh-v1.5 INT8 ONNX model, fixed revision, 512-dimensional CLS unit
  vectors. All document vectors are generated offline. Long documents are chunked with overlapping windows before embedding. One lazy WASM Worker computes
  queries. No cloud LLM, API key, GPU or third-party CDN is required.
- Uncalibrated semantic results are **candidate entries**, not automatic answers.
  Direct answers require a sufficiently strong text match; dynamic-value and
  automatic-action requests receive explicit limitations instead of fabricated data.
- Model/worker failure falls back to text retrieval; dialog keyboard/focus handling,
  safe text rendering, bilingual shell, copy action and same-origin guide links.
- `assistant/` is excluded from the site's automatic prewarming manifest. Only the
  ~16 KB UI and CSS are requested at page load; knowledge is loaded after a question,
  and the model/runtime/index only when semantic retrieval is needed.

## Rebuild

```sh
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci --prefix scripts/assistant
python3 scripts/assistant/download-model.py
python3 scripts/site_sources.py
python3 scripts/build-documents.py
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
The prototype conservatively uses one WASM thread without requiring cross-origin
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
remain work before a production release. The source-checked cards have not all
been independently click-tested from scratch. Source draft labels are intentional.

The current English path relies mostly on authored English aliases; a Chinese BGE
model is not evidence of high-quality multilingual retrieval. Cached/offline use
depends on browser storage availability; there is no offline-install guarantee.
Memory, frame-rate impact and Safari/iPad performance are not yet measured. Browser
tests run in Chromium on the development host, not on the user's iPad.

The reported-query follow-up, task routing, compact chat layout and local-only
diagnostics are documented in [REPORTED-FIXES.md](REPORTED-FIXES.md).

The 625-unit update and short-question coverage are documented in [UPDATE142.md](UPDATE142.md).
