# Concentrated UI code review

[简体中文](ui-code-review.zh.md)

## Reproduced and fixed

| Defect | Observed behavior | Correction |
| --- | --- | --- |
| Closed editors stopped synchronizing their sidebar | Close the desktop object editor and resize to phone width: the old Plot objects state still hides the native controls | Closed editors also synchronize responsive navigation and remove inapplicable sidebar state |
| Immersive mode retained a stale editor rail | Close the 3D editor, enter immersive mode, finish customizing, then return to normal: native parameter cards remain hidden | Immersive transitions clean the previous rail; normal mode restores the original controls |
| Editor Escape handling intercepted unrelated dialogs | Open the sky-trajectory explanation and press Escape: the dialog stays open while the editor behind it closes | Dialogs and popovers own their keyboard events; Escape outside the editor does not close it |
| Sidebar accessibility target referenced hidden legacy controls | Analemma’s Observation controls tab referenced the old hidden controls element | All pages reference the live parameter rail |
| Top actions changed position after immersive mode | The 3D customization and language actions moved to the start of the main navigation | Normal mode restores them to the end; immersive mode uses the existing header container |
| Deferred layout synchronization closed a newly opened phone drawer | Resize quickly to phone width and open parameters: the following presentation update closes the drawer again | Synchronize placement before opening; an already-correct destination does not reset the drawer |
| Global date selectors collided | Calendar cells and seasonal shortcuts shared data-date; rendering after opening the calendar passed missing seasonal parameters into calculations and produced NaN | Cache the seasonal buttons in their own container and use that collection for binding and selection |

The date picker already had its own keyboard protection, which remains intact. The trajectory explanation retains native dialog cancellation and focus recovery.

## Consolidated implementations

`customization-mode.js` shares the customization switch label, enabled state, exit validation and transition notification across Lab, Related Diagrams, Analemma and 3D. Page adapters retain only their own layout, route and embedded-lesson behavior. Invalid input blocks exit; repeated entry does not emit duplicate transitions.

`ui-palette.css` remains the color-definition source for shared controls. Normal and immersive modes retain the original green action accent. Scientific drawing colors and coordinate calculations remain separate from UI state.

Removed the permanently hidden Edit/Explore mode buttons and the menu-section cache that had no reader. Object drafts, save formats and linked city/time comparisons retain their existing rules.

## Source ownership and cleanup

| File | Responsibility |
| --- | --- |
| ui-palette.css | Shared interface color roles |
| customization-mode.js | Mode switches, exit-entry validation and state notifications across pages |
| diagram-tool-definitions.js | Tool kinds, fields, ranges and bilingual names, without DOM bindings |
| diagram-tools.js | Object state, history and editor; separate library/list/inspector rendering and one property commit path |
| custom-layout.js | Combined layouts, saved layouts and layout gestures |
| scene-builder.js | Physical experiment objects, ground view, measurements and saving |

Removed obsolete mode buttons, duplicate entry points, old locking variables and unread menu caches. Removed 260 selector/property definitions shadowed by later definitions in the same context, retaining themes, breakpoints and compatibility declarations. Expanded compressed source using the existing project formatting rules for readability and review. Formatting and CSS analysis tools are maintenance-only; they are neither shipped nor runtime dependencies.

Compared actual control styles before and after cleanup across four pages, two screen sizes and normal/custom modes: all 16 cases retained their colors, typography, borders, spacing and display states. Subsequent changes should go into their owning module rather than append another override layer.

## Validation and scope

`tests/interaction-audit.cjs` covers the reproduced failure sequences, modal keyboard ownership, exit validation and transition notifications on all four scientific pages. Existing checks continue to cover linked cities, object editing, layouts, bilingual pages, corrupt storage, packaging and deployment; `tests/ui-palette.cjs` checks shared color ownership and actual control propagation.

Validation uses Chromium automation and desktop, tablet and phone browser dimensions. It does not establish coverage of every physical Safari device, GPU or possible interaction sequence. New menus should reuse the shared mode switch and color roles, and regressions should reproduce real failures rather than introduce another independent state or palette.
