---
name: SkyMotion
description: Clear classroom reading around a dark observation canvas.
colors:
  primary: '#24576b'
  primary-hover: '#174558'
  cool-paper: '#f4f7f8'
  surface: '#ffffff'
  inset: '#ecf2f4'
  line: '#cdd9de'
  ink: '#20323e'
  muted: '#536975'
  selected: '#dcebf0'
  on-selected: '#183e50'
  sun: '#f2d7a3'
  night: '#101e2c'
  night-surface: '#142b3c'
  night-inset: '#203b4c'
  night-line: '#3d5b6d'
  night-ink: '#e4eef3'
  night-muted: '#b7ceda'
  night-primary: '#a9d5e6'
  night-hover: '#bce0ec'
  night-selected: '#284c61'
  scrollbar: '#9eb1bb'
  open-border: '#8caebc'
  open-summary-muted: '#42616f'
  switch-border: '#8297a3'
  switch-idle: '#c7d4db'
  switch-thumb: '#506b79'
  disabled-ink: '#637985'
  disabled-surface: '#e8eef1'
  night-tool-muted: '#c7dde8'
  night-tool-selected: '#39748c'
  night-label-surface: '#142b3ce6'
  range-track: '#c3d8e0'
  canvas-action-line: '#73919f'
  canvas-action-surface: '#163245'
  print-ink: '#000'
  action: '#24576b'
  action-hover: '#174558'
  daylight-label-ink: '#082331'
  night-plot-label: '#d0e5f2'
  night-plot-axis: '#dcebf5'
typography:
  display:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: clamp(42px, 4.3vw, 64px)
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: '0'
  headline:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: '0'
  lab-title:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: '0'
  reading-section:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: '0'
  body:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
  reading-body:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.9
  field:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
  quote:
    fontFamily: '"Welcome Hand", "Kaiti SC", KaiTi, cursive'
    fontSize: clamp(15px, 1.35vw, 19px)
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 1px
  caption:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.6
  compact-section:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.6
  title:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.6
  numeric-output:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 20px
    fontWeight: 500
  compact-lab-title:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.35
  compact-reading-body:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.9
  canvas-compact-label:
    fontFamily: '"SkyMotion Reading", "Songti SC", "SimSun", serif'
    fontSize: 10px
    fontWeight: 400
rounded:
  control: 12px
  surface: 16px
  navigation: 10px
  switch: 999px
  inner: 11px
spacing:
  tight: 8px
  group: 16px
components:
  button-primary:
    backgroundColor: '{colors.action}'
    textColor: '{colors.surface}'
    rounded: '{rounded.control}'
    typography: '{typography.label}'
  button-primary-hover:
    backgroundColor: '{colors.action-hover}'
    textColor: '{colors.surface}'
  button-secondary:
    backgroundColor: '{colors.inset}'
    textColor: '{colors.primary}'
    rounded: '{rounded.control}'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    typography: '{typography.field}'
  card:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.surface}'
    padding: 16px
  disclosure-summary:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    padding: 12px 38px 12px 14px
    rounded: '{rounded.inner}'
  disclosure-summary-open:
    backgroundColor: '{colors.selected}'
    textColor: '{colors.on-selected}'
  nav-link:
    textColor: '{colors.muted}'
    rounded: '{rounded.navigation}'
    height: 36px
  nav-link-current:
    backgroundColor: '{colors.selected}'
    textColor: '{colors.primary}'
  welcome-entry:
    backgroundColor: '{colors.sun}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: 10px 18px
    width: 184px
    height: 48px
  canvas-readout:
    backgroundColor: '{colors.night-surface}'
    textColor: '{colors.night-ink}'
    rounded: '{rounded.control}'
---

# Design System: SkyMotion

## Overview

**Creative North Star: "The Classroom Observatory"**

SkyMotion frames scientific observation with cool paper, clear ink and restrained blue controls. Light operation and document surfaces surround a dark astronomical canvas; the canvas remains a distinct scientific space with its existing data colors.

The Chinese locale uses one Song-style serif family across headings, text, controls and annotations; the English locale uses locally hosted Bitstream Charter in the same roles. Tabular numbers support repeated changes to location and time, while the welcome page retains its interactive stars and handwritten sentence. The design records the shipped preview rather than making claims about astronomical accuracy or device performance.

**Key Characteristics:**

- Light reading and operation surfaces; dark scientific drawing.
- One self-hosted serif family across interface, native fields and Canvas labels; tabular numbers.
- Consistent rounded controls, flat panels and reversible state motion.

## Colors

The primary palette combines cool paper, navy ink and muted teal blue. Token values in frontmatter are normative; `dist/design-system.css`, loaded after the incumbent styles, is the implementation authority.

### Primary

- **Ink Blue:** selected controls, links and keyboard focus; the hover shade deepens this same role.
- **Action Blue:** a separate shared action token with the same light-mode color. Actions use it consistently across light and dark contexts; its hover token supplies the common darker action shade.
- **Selected Wash:** lighter selected navigation and open disclosure surfaces, with the dedicated on-selected foreground.

### Secondary

- **Sun Amber:** the welcome entry and established solar/data identity. It is not the generic laboratory selection color.

### Neutral

- **Cool Paper / Surface / Inset:** page ground, white reading or control surfaces, and recessed parameter ground.
- **Ink / Muted / Line:** primary text, supporting labels and structural dividers.
- **Auxiliary states:** scrollbar, disclosure border/supporting text, idle switches, disabled controls and range tracks retain the dedicated documented colors. Night tool supporting text, selected toggles, translucent labels and canvas action borders/surfaces belong to dark-canvas legibility. Observer labels retain dedicated daylight ink and night plot label/axis colors rather than inheriting light-panel colors. Print ink is black on white and is not an interface accent.
- **Night family:** observation ground, tool surface, inset field, border, text and muted text. Immersive space remaps paper, surface, inset, line, ink, muted, primary, hover and selected to their corresponding night tokens. Its filled active buttons and moving selection marker retain light-mode Ink Blue with white text.

**The Scientific Color Rule.** Use ink blue for interface selection; retain the existing Sun, Moon, planet and plotted-data colors inside scientific drawings.

## Typography

**Interface Font:** SkyMotion Reading, with Songti SC and SimSun serif fallbacks, across headings, body text, navigation, controls, native fields, outputs and Canvas text.

**Handwritten Font:** Welcome Hand, with Kaiti SC and KaiTi cursive fallbacks, for the established welcome sentence. Code examples may retain their existing monospace typography.

SkyMotion Reading is the actual self-hosted subset family, supplied as regular and bold WOFF2 files. Regular is registered at weight 400 and bold at 600–800; the interface also requests weight 500 for medium labels and numerical outputs. Fallbacks remain necessary for characters outside the subsets. The former Interface assets do not define the current interface typography.

### Hierarchy

The frontmatter records real desktop and compact roles. Desktop welcome display grows only at widths of at least 1024px and heights above 500px. Primary laboratory titles and document h1/h2 use regular Reading; section labels and supporting headings use the same family at their existing weights. Document body has a generous reading rhythm; lead paragraphs are limited to 68ch.

Supporting controls use 12–13px; workbench captions use the documented 11px step. Document h3 and drawer headings use 18px; compact document h3 uses 17px. Numeric outputs use 20px on desktop and 18px in narrow workbenches, with 13px bearing and date outputs in the compact stack. Small canvas labels use 10–11px. Numeric inputs, dates, times, outputs and space facts retain tabular numerals without changing font family.

**The One Interface Voice Rule.** Use SkyMotion Reading across interface text, controls, numeric fields and Canvas annotations. Keep Welcome Hand confined to the established welcome sentence and monospace confined to code examples.

## Layout

Preserve the incumbent workspace grid: laboratory parameter rail, independent visual area and separate time workbench. The conventional shell is capped at 1600px, with a 300px parameter column in the main grid; space uses its own 260px rail. Reuse the tight and group spacing tokens for local control and panel relationships rather than forcing all scientific layouts into one grid.

At 760px and below, parameter access uses the established drawer and the main workspace becomes a narrow-screen layout. Above that threshold, rails begin expanded and remember explicit collapse within the session. Collapsing releases grid space without scaling the scientific canvas. Existing compact-height adaptations remain relevant to landscape devices.

Documents are capped at 960px and use 40px 48px internal padding; at 760px and below this becomes 24px 20px, body type becomes 15px, and document h1 becomes 24px. At 420px and below, laboratory titles become 17px. Reading margins and content wrapping remain owned by the document stylesheet.


The time workbench declares an inline-size container named time-controls. At an actual pane width of 700px or below and viewport height of at least 501px, its parameter rows span the full available width, with a label/value header above a slider and adjacent actions. The portrait viewport rule at 600px and below and heights of at least 501px also applies this compact arrangement. The final compact header override uses a 26px minimum and takes precedence over the wide header rule. Checked 320px, 390px and 600px previews measured approximately 62–63px parameter rows; these measured bounds are not fixed-height tokens. Wide multi-column workbenches align headers and action groups to a common 36px minimum, with reviewed wide parameter rows measuring approximately 112px. Short-height landscape is excluded from the pane-width stack. Four main view tabs fit one row in the reviewed portrait preview using flexible 64px bases and compact gaps. At 360px and below, including the 320px case, the laboratory header becomes two rows. Short-height landscape keeps its separate layout rather than inheriting the portrait stack.

The explanation control is a 36px SVG button. On canvases at widths of 600px or below it moves to the upper-right free corner; wider canvases keep the lower-left position. The redundant compact view hint is hidden, leaving header and view-selection rows clearer. Navigation and view strips hide scrollbar chrome while retaining horizontal swipe where overflow occurs; hidden scrollbars do not mean disabled scrolling.

The welcome page retains its greeting, stars and quote. Its five secondary actions form the compact bottom-right group: two star interactions and three existing document/contact links. Their compact and short-height behavior belongs to the welcome surface rather than to a global button-density rule.

## Elevation & Depth

Permanent parameter panels, time workbench, space cards and canvas tools are flat: tonal ground and subtle borders communicate depth. The existing drawer and modal shadows remain local overlay devices. Do not infer a completely shadow-free application from the flat workspace panels.

### Shadow Vocabulary

- **Parameter drawer:** `8px 0 32px #10284335`, retained by the conventional drawer.
- **Contact overlay:** `0 16px 48px #122c4930`, retained by the existing contact dialog.

**The Quiet Surface Rule.** Use tonal surfaces and borders for permanent workspace panels. Preserve overlay-specific shadows rather than adding shadows to every control.

## Shapes

Controls use the control radius; surfaces use the larger surface radius. Navigation and planet-picker items retain their smaller navigation radius. Disclosure summaries use 11px inner corners and become square along the open content edge. Switches remain capsules, with a circular thumb; the control-radius rule does not replace switch geometry. Welcome buttons share the control radius. Disclosure inner corners use the inner radius (outer control radius minus its 1px border). Existing canvas clipping and modal geometry stay intact.

## Components

### Buttons

Primary playback and selected segments retain the fixed Action Blue fill and white text. Supporting actions—date directions, clock and orientation shortcuts, body jumps, main reset, menu expansion, comparison and planet focus—use a white surface, Action Blue text and the shared structural border. Their hover uses the light selected wash and deeper teal text. Active comparison uses the same wash. Canvas reset and observation tools retain a quiet navy surface with pale text for dark-canvas legibility. Segmented controls keep their semantic active/inactive distinction and moving selection marker. Preserve each control’s geometry and keyboard focus; do not add a universal button padding.

Keyboard focus is a visible 2px primary outline with a 3px offset in the shared interface. Welcome focus uses amber and a 4px offset. Shared disabled controls use the incumbent muted disabled treatment and cannot receive interaction.

### Inputs / Fields

White fields, structural borders and control corners keep parameters legible. Selects in the shared operating scope have a minimum height of 38px. Numeric/date/time fields use tabular numerals. Dark canvas-tool fields use the night inset, night ink and night line, and immersive date inputs declare a dark color scheme.

### Cards / Containers

Space cards use the surface radius and group padding. Space parameter rails use the shared inset background. Metric cards remain uniformly white with the surface radius; the first metric has no special blue container. Night inspection readouts retain the night surface, night ink and night line with control corners. Time workbench and reading surfaces share that radius without acquiring decorative shadows. Parameter sections use the smaller control corners to keep nesting readable.

### Navigation

Navigation uses compact Reading links, muted idle text and a selected wash with primary text for the current page. Existing aria-current, selected and pressed semantics remain authoritative; visual state must follow application state.

### Disclosures and Parameter Rail

Native summary interactions retain keyboard activation and one reversible measured fold. The explanation dialog keeps a neutral structural frame rather than adding a blue focus container; its interactive controls retain keyboard focus treatment. The globe tooltip is removed while its accessible label remains. Disclosures and rail panels use the existing spring controller with 320ms animation, selected markers use 360ms, and contextual reveals use 380ms. Reduced-motion preference skips these animated paths. Keep presentation motion independent of physical time and astronomy state.

### Switches

Toggle rows align a wrapping label with a fixed 44px switch column, minimum 44px row height and 12px gap. The switch is 44px by 26px, its circular thumb 18px; the selected thumb moves 18px. State colors follow the shared primary except for existing dark tools, which retain their local legibility treatment.

### Welcome Actions

The amber entry remains distinct from the five small secondary actions. Those five retain their existing dark translucent surfaces and light labels. The handwritten quote remains a separate balanced line, not another action or display heading.

## Do's and Don'ts

### Do:

- **Do** preserve dark scientific canvases and their original data encodings.
- **Do** use the same ink-blue selected state, cool-paper surface and control shapes across labs, space and documents.
- **Do** use SkyMotion Reading for controls and tabular numbers, retaining legibility when variables change.
- **Do** retain reversible spring feedback and honor prefers-reduced-motion.
- **Do** preserve the five compact welcome actions in the bottom-right group and the handwritten sentence.

### Don't:

- **Don't** recolor scientific data to match interface accents.
- **Don't** introduce a separate type family for control labels, native fields or numerical values.
- **Don't** add perpetual interface animation or animate physical celestial positions through UI motion.
- **Don't** add decorative eyebrow labels or substitute text glyphs for new icon controls.

Manual-mode hints, restoration actions, parameter outputs and analemma results consume the same light interface tokens. The relocated playback loop uses the shared 44×26 switch aligned at the row end; its label remains first. Immersive header actions and the original-comparison link use the same dark surface, pale teal text and structural border. Check these expanded and conditional states as well as the initial page.

Language switching is a persistent display preference, not an experiment reset. The language action remains visible beside the scrolling navigation; the welcome action sits with the brand. Use Charter regular/bold/italic/bold italic for English. DOM labels and accessible descriptions, Canvas drawing and text measurement share one translation dictionary layer. Preserve numeric input values and scientific identifiers. Document downloads follow the selected locale. A failed language resource keeps a coherent Chinese interface and offers retry.

Initial display resolves the saved locale in the document head before painting. The selected local font weights/styles and dictionary finish loading before visible content is revealed. Locale changes prepare the destination fonts before replacing visible text. The first-paint visibility gate includes descendants with explicit visibility and is removed on coherent fallback after a loading failure.

Static Chinese and English sibling pages display directly. The first-paint whole-page visibility gate is removed; preloaded fonts use optional display to avoid a late fallback-to-webfont jump. Shared scripts, styles and font files stay single-copy. Other HTML pages warm the ordinary browser HTTP cache at idle, without starting hidden scenes.

### Bilingual layout refinement — 2026-10-13

Keep the scientific canvas dominant and the existing cool-paper/teal palette. English Charter sidebar prose uses 14px/1.7, supporting descriptions 13px/1.7, navigation 13px, and workbench labels 12px. Chinese typography retains its established reading family and sizes. View tabs share centered, balanced labels and a 36px minimum height (40px for compact English views). Numerical outputs stay on one line; label/value pairs have 12px separation and desktop workbench columns 24px separation. English documents use an 880px outer measure with 18px/1.75 body text (16px on narrow screens), a 72ch prose maximum, and distinct 38/26/18px heading/body hierarchy. Section spacing remains 40px above h2, 16px below; h3 has 12px below. No scientific inputs, calculation logic, translations, navigation state or history behavior changed.
English seasonal presets use a two-column grid with 48px minimum targets, preserving whole words in the narrow tablet rail; Chinese retains the familiar four-season row.
