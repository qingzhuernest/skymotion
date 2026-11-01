# Corpus-wide answer matching

This update changes the shared retrieval/answering flow for all 625 units. It is not
an additional allowlist of three screenshot questions. Curated task plans and short
feature aliases remain as useful supplements; they no longer determine the whole
answerable area.

## Shared rules

- Build question forms from every title and alias. Normalize common question wrappers
  and wording such as 查看/观察/显示 and 杆的高度/杆高. Preserve critical operations:
  delete, import, export, rename, restore, copy, save and disable are not interchangeable.
- Index term counts once, rather than repeatedly scanning every document's token list
  for each query. Full-title, alias and core-question matches are ranked separately.
- Apply scientific/teaching/developer intent when ranking. Developer material remains
  excluded from ordinary observation queries. A general solar-altitude calculation
  must not silently become the narrower solar-noon calculation.
- A clear, strong match can quote the author's original source even when its review
  status is draft, as exact source lookup already could. Review status is retained in
  the collapsed References; it is not promoted to verified. Every unit has a real
  handbook citation. Uncertain/ambiguous matches still ask a relevant clarification.
- A strong semantic source match still requires independent lexical support and a
  candidate margin. Opposite-operation candidates are excluded. No free generation,
  prediction of missing current measurements, or automatic page control is added.
- Action requests such as 帮我添加城市 produce instructions rather than an unnecessary
  refusal. Browser tests confirm the original experiment is unchanged.

## Other defects found in the wider pass

An empty `steps` override had removed the Chinese procedure for saving a complete
experiment. This is restored and names the real checkbox 连同观测与对象保存 and button
保存组合 (English: Include conditions and objects / Save layout).

The earlier topic fallback could give enable instructions for a disable request.
Explicit off variants now cover celestial tracks, ground shadows and the planet–Moon
demonstration. Variants are restricted to their actual controls, not arbitrary readouts.
The general rule also separates settings import/export and deletion/renaming.

## Coverage evidence

`tests/assistant-corpus.cjs` probes a source-derived rephrasing for every unit and
checks that its source remains retrievable and a sourced answer is available:

| Category | Probes |
|---|---:|
| Website operations and boundaries | 355 |
| Scientific knowledge | 144 |
| Teaching chapters | 18 |
| Functional manual chapters | 20 |
| Developer chapters and source descriptors | 88 |
| Total | 625 |

These are generated corpus-wiring checks, **not** an independent natural-language
accuracy benchmark or 625 manually clicked UI scenarios. `corpus143.json` retains
source ID, query, selected ID, answer reason and review status for inspection.

There are also 14 hand-written cross-feature questions, three opposite-action checks,
unknown-topic and dynamic-value boundaries, and the previous 35 regression questions.
`assistant-systematic.cjs` runs real UI questions across rod height, settings import
and export, Moon tracks, city comparisons, the general altitude formula and off
instructions. It checks that references remain collapsed and scientific state stays
unchanged. The previous six reported tasks, three screenshot queries, actual local
BGE inference, safe text, failure fallback, English and subpath tests still pass.

Coverage does not mean every source is independently reviewed, every possible
paraphrase is understood, or that the 200-query human acceptance benchmark is met.
The published documentation and original review labels remain traceable.
