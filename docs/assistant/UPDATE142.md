# Updated documents, broader feature questions and welcome actions

The five current knowledge sources contain 625 unique units: 355 updated website
cards, 144 scientific cards, 18 learning chapters, 20 manual chapters, 22 developer
chapters and 66 source-file descriptors. All 13 corrected original IDs are imported:
LAB-014/019/021, SUN-007, MOON-011/013, YEAR-015/016/018, BUILD-016/022,
SPACE-012 and EXTRA-007. Source snapshots are in `sources/update142/`; the unchanged
science source remains in `sources/science.txt`.

The three supplemental documents supply IDs, search aliases and complete chapter
text. The 60 chapter answers are derived from the current bilingual structured site
manuals, using validated chapter anchors. The 66 source descriptors use current
responsibilities and declared function names. The builder verifies exact counts,
unique namespaces, nonempty answers, real paths/anchors and resolvable references.
`build-assistant-knowledge.py --check` detects drift in document sections or source
files. Run page/document generation before rebuilding knowledge, because page-boot
contains generated resource-version metadata.

Full chapter text participates in lexical retrieval and overlapping semantic chunks.
625 units currently produce 784 embedding rows, deduplicated by maximum score per
knowledge ID. The vector manifest and knowledge version must match. There are no
private Google Docs links in the visitor's knowledge JSON.

## Answer selection

Short feature names now select documented tasks via the data-driven `topics.json`,
rather than requiring a full question or a verb from a handful of examples. Exact
reviewed matches retain priority over broad topics, so saving a two-city comparison
still selects full-experiment saving rather than the comparison tutorial. Scientific
“what/why/formula/difference” questions remain distinct from operating instructions.
Developer entries are not lexical candidates for ordinary observation questions.
Guidance about observing today's Sun is allowed; requests for an unavailable exact
current value remain guarded.

The reported inputs now return source-checked step-by-step answers directly:

| Input | Answer |
|---|---|
| 太阳轨迹 | site:SUN-007: open a Sun view, set date/location, enable 天体轨迹, adjust time |
| 如何观察杆影长度 | site:VIEW-003: top-down view, ground shadow, rod height and metre reading |
| 如何观察日出方位 | site:SUN-025: rise/set view, location/date, event direction and time |

Ambiguous retrieval offers a specific choice instead of the generic “没有足够可靠的
信息” disclaimer. A semantic hit can directly answer only when it is documented,
strongly separated and independently supported by the lexical query. Draft cards
are not blanket-approved. This is a prototype, not a calibrated 200-query release
benchmark, and 625 units are not 625 independently browser-verified behaviors.

## Evidence

- `assistant-coverage.cjs`: 35 short, paraphrased and bilingual questions; four
  refusal boundaries; 625 unique units and current source versions.
- `assistant-short-queries.cjs`: all three screenshot questions answer directly
  without loading the model; the actual shadow controls, metre reading and rise/set
  canvas exist; asking does not mutate scientific state.
- `assistant-reported.cjs`: previous six reported tasks and actual companion/Mars
  controls remain working.
- `assistant-prototype.cjs`: real local BGE inference, failure fallback, safe text,
  scientific state isolation, English and project-subpath links remain working.
- `assistant-welcome.cjs`: Assistant and Settings join the original three document
  links, sharing their size, font and colors; desktop/phone and Chinese/English;
  both dialogs open. Existing star interaction buttons stay in the same outer group.

Fixture results are recorded in `coverage142.json`. Visual artifacts were inspected
at 390px and 960px. Browser evidence is Chromium on the development host; no new
Safari/iPad performance or general accuracy claim is made.
