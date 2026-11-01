# Reported-query fixes (preview)

The baseline in `reported-before.json` was captured against the first prototype's
actual lexical code/data, before editing aliases or review status. It is not a model
training set or an independent accuracy benchmark.

| Query | Original result and reason | Changed behavior |
|---|---|---|
| 如何观察太阳视运动？ | Top lexical entry SITE-001 was a draft; no complete task plan | Source-checked LAB-001 plan combines mode, view, location, date, time and track controls |
| 如何观察月球和火星的相对位置？ | Top lexical entry MODEL-002 was an unrelated draft; no entity-aware task routing | MOON-012 plan selects the Moon mode, companion view and Mars; explains angular separation |
| 如何使用行星伴月？ | MOON-011 was found but non-exact/draft gating prevented a direct answer | Source-checked companion tutorial |
| 打开行星伴月 | MOON-011 was found but not an exact title match | Open-view instructions; explains that entering currently enables the demonstration |
| 开启行星伴月 | Exact title match exposed the draft card, unlike 打开 | Switch instructions, distinguishing an already enabled demonstration from a disabled switch |
| 开启行星半月 | Missing feature-specific typo normalization | Corrects 行星半月 to 行星伴月, then uses the same enable instructions |

No global lowering of confidence thresholds, blanket draft approval, or model
retraining was used. Three existing cards were source-checked and expanded. Routing
only dispatches explicit tasks to reviewed plans; scientific “what/why” questions
stay on the knowledge retrieval path. Dynamic-value and out-of-scope boundaries
still take priority. All remaining unreviewed entries keep their draft labels.

A source discrepancy matters: the actual demonstration switch and planet selector live in Observation controls, rather than on the canvas. `page-navigation.js` sets `state.companion=true` when
entering the companion view. “Open” and “enable” are therefore not two wholly separate
required actions. The tutorial says entering enables it, and directs the user to the
Demonstration switch only if they previously turned it off. Also, LAB-004 opens
Observation controls; LAB-005 selects a city. The composite solar plan reflects that.

`tests/assistant-reported.cjs` runs all six queries through the real UI, checks
expected steps, verifies that asking leaves scientific state unchanged, and then
independently exercises the actual Moon-mode/companion route, auto-enable, manual
switch, Mars selector, nonempty separation readout, Sun mode and track switch.
`reported-after.json` records the observed results after a passing run. These six
passes do not establish accuracy on unseen queries or complete knowledge coverage.

## Local debugging

`SkyAssistantDebug.getLast()` in developer tools returns the last raw and normalized
query, lexical top five IDs/scores/statuses, selected route/intent, decision/reason,
and semantic top five or failure when applicable. It stays in this page's memory;
there is no console logging, persistence, network upload, or debug-text UI.

## Interface changes

The entry now lives in the existing navigation beside Settings and uses the same
font, color, shape and layout rules. Floating coordinates and their resize/scroll
observers were removed. On phones, a compact title and one-line composer leave the
conversation most of the screen. Starting a conversation hides the introductory
examples. Successful answers have no persistent implementation-status footer;
source IDs live in collapsed References. Loading and error messages remain visible
only when they help the user.
