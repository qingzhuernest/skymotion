#!/usr/bin/env python3
"""Losslessly simplify Reading CFF outlines and remove screen-unnecessary hints.

Requires fonttools[woff] (including Brotli). Operates on existing subsets; never
reduces character coverage. Compare decomposed outlines and advance widths before
replacing each file. Run when regenerating the Chinese font subsets.
"""
from io import BytesIO
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

root = Path(__file__).resolve().parents[1]
for name in ('reading-regular.woff2', 'reading-bold.woff2'):
    path = root / 'fonts' / name
    original = TTFont(path)
    candidate = TTFont(path)
    options = subset.Options()
    options.desubroutinize = True
    options.hinting = False
    options.name_IDs = ['*']
    options.name_legacy = True
    options.name_languages = ['*']
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=original.getBestCmap())
    worker.subset(candidate)
    result = BytesIO()
    candidate.save(result)
    optimized = TTFont(BytesIO(result.getvalue()))
    assert original.getBestCmap() == optimized.getBestCmap(), 'Character coverage changed'
    before, after = original.getGlyphSet(), optimized.getGlyphSet()
    for glyph in original.getBestCmap().values():
        a, b = DecomposingRecordingPen(before), DecomposingRecordingPen(after)
        before[glyph].draw(a)
        after[glyph].draw(b)
        assert a.value == b.value and before[glyph].width == after[glyph].width, glyph
    old_size, new_size = path.stat().st_size, len(result.getvalue())
    if new_size < old_size:
        path.write_bytes(result.getvalue())
    print(f'{name}: {old_size:,} -> {min(old_size, new_size):,} bytes; glyphs verified')
