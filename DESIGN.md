# SkyMotion — Material 3 Expressive

## Design authority
The interface follows Material 3 Expressive. The user authorizes replacement of the previous visual system, retaining the existing fonts. Scientific behavior, real content and accessible interaction remain intact. This document supersedes earlier appearance notes; no Impeccable aesthetic rules apply.

## Typography
Chinese: self-hosted SkyMotion Reading, Songti SC / SimSun fallback. English: self-hosted SkyMotion Charter, Charter / Georgia fallback. Use the same face for labels, controls, reading and headings. Tabular numerals for measurement and time. Preserve language switching and the complete scientific annotation set.

## Color roles
ui-palette.css owns literal colors. Primary #255c43, on-primary white; primary-container #c4d5c6, on-container #103b25. Secondary #51634e, secondary-container #ccd9c7. Tertiary #73512c, tertiary-container #ffdfb4. Background #e2e9de; surface #e9efe5; containers #dfe8da / #d6e1d0 / #cddbc6 / #c5d5bd. Ink #19251c; supporting text #4d5d4d. Large light surfaces use muted sage tones to reduce glare against observation canvases. on-primary white is a foreground role, never a panel background. Scientific canvases keep their independent dark palette and series meaning. Immersive mode remaps all surface levels and text roles together.

## Components and density
- Global top app bar: one shared identity/navigation layout for Lab,3D and documents, stable primary destinations, direct Sun/Moon connected choice where applicable, customization and language. The3D toolbar groups display choices separately from matching outlined auxiliary actions. 64px desktop minimum, responsive two-row small-screen composition.
- Navigation: primary destination indicators use a short primary underline. Connected exclusive controls use a 2px gap, 12px inner corners, outer corners capped at half the target height, and a fully rounded selected segment; press morphs to 16px. No second moving selection backplate or decorative checkmark; color, shape and accessible state identify selection.
- Sidebar: one shared menu-section implementation for content and settings. White 20px grouped surfaces on a tonal rail; nested groups use 16px corners. Inner heading radius subtracts the 1px structural stroke so background never covers the outline. List rows share alignment, primary selection and overlay state layers; remembered sky orientation is not selected while another diagram is current. Rails and their sticky collapse headers are owned by interface-motion.css for both Lab and3D. Seasonal and planet choices share a compact grid:32px painted surfaces with fully rounded ends inside40/48px targets. Lower height gives wide, flat proportions; selection changes fill.
- Buttons: filled primary, filled tonal, outlined, text and icon roles. Small desktop targets at least40px; narrow or coarse-pointer targets48px. Visual density must not reduce target size. Explicit focus, disabled, hover and pressed states.
- Fields: Material outlined fields, visible labels, native editing and keyboard support. Switches use the shared52×32 track and selected thumb geometry; checkboxes remain distinct controls.
- Sliders: native range inputs;16px tonal track with active fill,4px upright handle and gap. material-controls.js owns progress presentation, never model values. State owners update presentation after programmatic changes, including playback, history and dynamic parameter editors. No polling loop or patched native value setter.
- Surfaces:28px outer containers,20px grouped sections,16px inner cards,48px reserved for expressive large surfaces. Elevation belongs to floating menus and sheets; persistent surfaces use tonal separation. Compact2×2 readouts and compact playback preserve observation space.
- Reading: grouped entry list, shared colors and shapes, stable table width and chapter hierarchy. A quiet reading surface with always-visible contents, one header divider and a localized Back to top action. Document category links share the global underline navigation component; Markdown download uses the shared outlined action. Opening questions and answers share one left edge and keep their timed dialogue.
- Welcome: existing interactive star field and opening behavior, larger retained-font title and56px main action. No additional opening buttons.

## Motion and accessibility
Shared state layers and350ms expressive shape transitions; short150ms color feedback, shorter press response. Existing panel and disclosure springs remain bounded and reversible. Canvas coordinates never scale as UI feedback. Respect reduced motion, keyboard focus, screen-reader names and native input semantics. Responsive composition must work at320/390/960/1440px in both languages.

## Ownership
ui-palette.css defines color; design-system.css defines shared component tokens and skins; route CSS owns placement. material-controls.js owns slider fill only. interface-motion.css owns parameter rails, sticky headers and collapse/expand controls. workbench-menu.css owns the single navigation-row implementation. interface-motion.js handles reversible presentation transitions and installs shared choice classes. Route CSS does not override these component skins. No UI framework or astronomy rewrite is introduced.
