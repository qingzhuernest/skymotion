# SkyMotion — Material 3 Expressive

## Design authority
The interface follows Material 3 Expressive. The user authorizes replacement of the previous visual system, retaining the existing fonts. Scientific behavior, real content and accessible interaction remain intact. This document supersedes earlier appearance notes; no Impeccable aesthetic rules apply.

## Typography
Chinese: self-hosted SkyMotion Reading, Songti SC / SimSun fallback. English: self-hosted SkyMotion Charter, Charter / Georgia fallback. Use the same face for labels, controls, reading and headings. Tabular numerals for measurement and time. Preserve language switching and the complete scientific annotation set.

## Color roles
ui-palette.css owns literal colors. Primary #255c43, on-primary white; primary-container #c5efd0, on-container #103b25. Secondary #51634e, secondary-container #d7e8cd. Tertiary #73512c, tertiary-container #ffdfb4. Background #f5f8f0; surface #ffffff; containers #f0f5eb / #eaf0e4 / #e2e9dc / #dce4d6. Ink #19251c; supporting text #4d5d4d. Scientific canvases keep their independent dark palette and series meaning. Immersive mode remaps all surface levels and text roles together.

## Components and density
- Global top app bar: stable primary destinations, observation identity, direct Sun/Moon connected choice, customization and language. 64px desktop minimum, responsive two-row small-screen composition.
- Navigation: primary destination indicators use the primary container. Connected exclusive controls use a 2px gap, 12px inner corners and a fully rounded selected segment; press morphs to 16px. No second moving selection backplate.
- Sidebar: one shared menu-section implementation for content and settings. White 20px grouped surfaces on a tonal rail; nested groups use 16px corners. Inner heading radius subtracts the 1px structural stroke so background never covers the outline. List rows share alignment and state roles.
- Buttons: filled primary, filled tonal, outlined, text and icon roles. Small desktop targets at least40px; narrow or coarse-pointer targets48px. Visual density must not reduce target size. Explicit focus, disabled, hover and pressed states.
- Fields: Material outlined fields, visible labels, native editing and keyboard support. Switches use the shared52×32 track and selected thumb geometry; checkboxes remain distinct controls.
- Sliders: native range inputs;16px tonal track with active fill,4px upright handle and gap. material-controls.js owns progress presentation, never model values. State owners update presentation after programmatic changes, including playback, history and dynamic parameter editors. No polling loop or patched native value setter.
- Surfaces:28px outer containers,20px grouped sections,16px inner cards,48px reserved for expressive large surfaces. Elevation belongs to floating menus and sheets; persistent surfaces use tonal separation. Compact2×2 readouts and compact playback preserve observation space.
- Reading: grouped entry list, shared colors and shapes, stable table width and chapter hierarchy. A quiet reading surface with accessible contents and progress.
- Welcome: existing interactive star field and opening behavior, larger retained-font title and56px main action. No additional opening buttons.

## Motion and accessibility
Shared state layers and350ms expressive shape transitions; short150ms color feedback, shorter press response. Existing panel and disclosure springs remain bounded and reversible. Canvas coordinates never scale as UI feedback. Respect reduced motion, keyboard focus, screen-reader names and native input semantics. Responsive composition must work at320/390/960/1440px in both languages.

## Ownership
ui-palette.css defines color; design-system.css defines shared component tokens and skins; route CSS owns placement. material-controls.js owns slider fill only. interface-motion.js handles reversible presentation transitions and installs shared choice classes. No UI framework or astronomy rewrite is introduced.
