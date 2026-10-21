---
name: SkyMotion
description: Clear classroom reading around a dark observation canvas.
colors:
  primary: '#414744'
  primary-hover: '#303632'
  cool-paper: '#f6f6f5'
  surface: '#ffffff'
  inset: '#efefec'
  line: '#d7d7d2'
  ink: '#292d2b'
  muted: '#616560'
  selected: '#ebeeeb'
  on-selected: '#183e50'
  sun: '#f2d7a3'
  night: '#101e2c'
  night-surface: '#202523'
  night-inset: '#2e3430'
  night-line: '#56605a'
  night-ink: '#edf0ed'
  night-muted: '#c1c7c2'
  night-primary: '#e1e7e1'
  night-hover: '#ffffff'
  night-selected: '#39423b'
  scrollbar: '#9eb1bb'
  open-border: '#8caebc'
  open-summary-muted: '#42616f'
  switch-border: '#8297a3'
  switch-idle: '#d1d5d1'
  switch-thumb: '#506b79'
  disabled-ink: '#637985'
  disabled-surface: '#eceeec'
  night-tool-muted: '#d5dad5'
  night-tool-selected: '#39748c'
  night-label-surface: '#202523e6'
  range-track: '#d1d7d1'
  canvas-action-line: '#73919f'
  canvas-action-surface: '#163245'
  print-ink: '#000'
  action: '#414744'
  action-hover: '#303632'
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

The Chinese locale uses one Song-style serif family across headings, text, controls and annotations; the English locale uses locally hosted Bitstream Charter in the same roles. Tabular numbers support repeated changes to location and time, while the welcome page retains its interactive stars and handwritten sentence. The design records the production interface rather than making claims about astronomical accuracy or device performance.

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

### Language, whole-site preload and menu feedback — 2026-10-13
Explicit lang query takes priority, then the saved language, then the static page's language. Loading failure keeps that language rather than silently restoring Chinese. Preload starts immediately, downloads all 24 HTML siblings and the complete manifest of static scripts, styles, fonts, images, data and document downloads with four concurrent requests; completion is observable through skyPageCacheReady. Browser HTTP cache policy still governs retention. Downloaded resources do not create hidden WebGL scenes. Disclosure and rail springs use 420ms with 8.5% overshoot and 2.5% rebound, per-segment easing and a linear overall timeline, avoiding compression of the rebound by an overall ease-out. Reduced motion and reversal remain supported.

Initial typography now waits for the selected local fonts before exposing page content; a small neutral loading indicator occupies the cold-load interval. Font faces use block display, and all script/style references carry an explicit resource version shared by the preload manifest, so saved old scripts cannot mix with new language logic. Font readiness, language round-trip switching and delayed-font visibility were checked together. This supersedes the earlier optional-font direct-display policy.

Development-flow steps use one ordered column with small outlined counters and fine separators, replacing the uneven three-column card grid. Document code/formula blocks use cool paper, dark ink and a fine structural border, preserving monospace, whitespace and horizontal scrolling. Chinese and English share these rules.
Welcome language selection is aligned to the right edge of the brand header. Playback uses monochrome SVG masks keyed to aria-pressed, rather than system emoji; translated button labels remain independent of the icon. Moon phase names, principal phases, ecliptic-pole explanation, parallel sunlight and drag guidance have complete English dictionary entries, preventing fragment-level mixed labels.

### Complete auxiliary palette sweep — 2026-10-13
Contact mail/copy actions now share white surfaces, teal text, fine borders and tinted hover feedback. Month ticks, shadow/date auxiliary actions, sundial questions and hints consume shared tokens. Switch OFF colors are fixed in controls.css itself because it may load after the design layer. Space language controls, camera presets and body-jump labels follow the corresponding light/dark tokens. Audited computed colors on nine routes with disclosures expanded, and checked both contact locales' default and hover states; removed remaining legacy royal-blue controls without changing astronomical encodings.

### First-screen font performance — 2026-10-13
The head starts regular/bold FontFace downloads immediately and registers loaded faces. The font-ready promise alone releases the static page's visibility guard; experiment and control initialization no longer blocks its display. Language switching reuses the same per-locale font promise. Avoid duplicated CSS FontFace registrations and do not wait for italic variants on first display. Whole-site warming still covers all resources, but begins after critical fonts and the current page load, using two low-priority requests. In a controlled Chromium comparison with experiment startup delayed 1200ms, display moved from 1714ms to 460ms; this is a dependency-isolation check, not a Safari/network benchmark. Local Chinese font already contains about 1132 characters, close to the 1047 Chinese characters present in project text, so it is already subsetted.

### Site-owned date controls and viewport immersion — 2026-10-13
All date/month inputs are enhanced in place to readonly ISO text fields with their original IDs, values, min/max attributes and input/change handlers. This prevents Safari's unthemeable native calendar from appearing. The shared site dialog provides date/month/year grids, both locales, min/max checks, leap days, confirm/cancel, outside dismissal and Escape. Confirm flushes the existing history adapter so browser Back restores the prior date; draft choices do not mutate the experiment. Year selection also uses buttons, avoiding a native picker or keyboard toolbar. Dialog closure retains the existing brief exit transition. Date direction controls use authored stroke SVG masks. Space drawer close uses a transparent SVG button. Immersion fills the application viewport without invoking requestFullscreen, so Safari's fullscreen notification is not triggered; renderer, camera and physical clock remain independent of this presentation change.

### Review 9913064 fixes — 2026-10-13
Critical font requests have an eight-second deadline. A failure releases the visibility guard and exposes a quiet, dismiss-free status with an explicit font retry; timed-out attempts cannot register fonts late, and initialization recovery does not wait for the failed font again. Successful loads retain the existing first-screen font policy. Explicit valid lang query choices are saved, and this tab's navigation carries the explicit locale, including when persistent preference storage is unavailable. Date/month drafts now follow year/month navigation, preserving and clamping the day for month ends and leap years; application values and history still change only on confirmation. Calendar rerenders restore the active control or an appropriate selected-date fallback. tests/review-regressions.cjs reproduces each reviewed failure and verifies recovery, retry, both viewport sizes, date undo and cancellation.

## Quiet result cards and reading actions

升落读数卡片使用相同白底、细边框、深青蓝数值和柔和辅助文字；不以黄蓝色块区分事件。文档入口链接沿用白底细边框操作，悬停为纸色底。实心强调仅保留播放和选中状态。

## Production release — 2026-10-13

正式站与镜像采用当前统一设计。语言、字体就绪／超时恢复、日期选择器和资源预热随正式版本发布；辅助文档入口和升落读数使用白底细边框。部署由 main 工作流执行，旧版通过生产回滚标签保留。

## Welcome reflections — 2026-10-14

The Chinese handwritten sentence and the user-supplied English reflection occupy the same centered footer position, selected by locale. Both use the established warm night text (#c8b99f). English uses regular Charter, restrained sizing, balanced lines and no extra letter spacing; Chinese keeps the original handwriting. Locale-specific text is presentation copy, not a claim that the sentences translate one another. The entry action has no supplementary quote below it. Short landscape keeps clear space between controls and the footer.

### Linked-diagram construction preview — 2026-10-16

Preserve the left parameter rail, right scientific canvas and bottom clock. A Build experiment tab contains an orthographic local-ground model: upright rods in meters, reference circles and markers. Observe rotates the scene; Build selects or moves objects. Controls use white/paper surfaces, fine borders, ink text and a quiet sage selection. Existing scientific colors and fonts remain. Labels avoid overlap; small-screen placement closes the parameter drawer and selected objects expose a return-to-properties action. Object changes have separate undo/redo and explicit device-local saving. No production deployment is part of this preview.

## Plot customization — 2026-10-17

图内参考使用原科学画布的投影及观测条件，入口固定在图角；仅放置状态接管一次指针，平时保留旋转、缩放和点选。属性编辑器采用白底细线、深墨色文字，显式保存与未保存提示。不同图解和天体的参考分开存储，切换不修改实验地点与日期。实验搭建区的排列、测量和冻结对照收在可展开工具组里，选中对象后显示属性；移动端保留图面，通过参数抽屉及 A/B 切换操作。

Plot references share native scientific projections. Pointer capture is armed only for placement; ordinary camera gestures remain available. White property panels, ink text and restrained sage selections follow the existing design. References are isolated per diagram/body, and frozen comparisons retain their own objects and scientific conditions.

## Customization hardening — 2026-10-17

原图工具的放置状态同时支持指针与键盘：进入放置后聚焦画布，Enter 在图中放置，Esc 取消，并保留明确的放置按钮。属性列表重选维持焦点并刷新读数；默认名称与用户文本分开处理。触屏按钮使用至少 44px 的有效区域，可见性复选框由可点击标签扩大热区，视觉尺寸保持克制。异常冻结对照显示恢复说明，保留有效实验物体。

Placement exposes equivalent pointer, keyboard and button paths. Selection retains focus and refreshes numerical results. Default names remain locale-aware; personal text is preserved. Touch targets expand without enlarging the checkbox artwork. Invalid frozen conditions degrade to the usable scene with a localized explanation.

## Direct reference editing — 2026-10-17

支持直接拖动的参考对象显示小圆手柄。编辑面板打开时，只有命中参考对象的指针操作被接管；其他手势沿用原图行为。拖动采用单次事务，取消可回到原位置。属性面板可收起为标题、展开入口、当前结果与保存提示，手机上为图面留出更多空间。数值位数适合操作尺度，画布焦点使用鼠尾草色边线；面板、输入和科学画布沿用既有字体、布局和配色。

A small circular handle identifies directly movable references. A gesture is intercepted only when it hits a supported reference while the editor is open. Gestures form atomic undo transactions. Compact properties keep the active result and draft status visible; native form focus survives edits. Existing layout, fonts and scientific colors remain intact.

## Reference interaction feedback — 2026-10-17

显隐切换保留原控件，适合连续键盘操作。输入错误以暖色细边框和明确文案表示；保存、导出和复制不能把无效输入伪装成成功。空列表、无选择和满额状态说明下一步操作。副本名称和位置帮助识别新对象；多指中断回滚当前编辑，不把残余事件交给科学相机。面板收起仍保留当前放置的操作入口。既有布局、字体及科学颜色保持。

Visibility changes keep focus. Invalid inputs retain valid model data and expose a localized correction path. Empty, selection and limit states explain available actions. Copies remain distinguishable by name and nearby position. Interrupted reference gestures roll back atomically; compact placement remains actionable.

## Explicit reference modes — 2026-10-17

编辑器以同一纸色、细线与鼠尾草选中态提供“编辑参考 / 观察图解”。模式切换在紧凑面板中保留，观察模式隐藏移动手柄并恢复原图手势；编辑模式显示手柄。位置锁定使用有文字标签的复选框，禁用对应位置字段；锁定手柄采用方形标记。键盘操作只在聚焦图面时移动参考，输入焦点与原生文本操作保留。

The existing palette carries an explicit Edit/Explore control. Compact mode retains it. Explore restores native gestures and hides editing handles; locked positions have a labeled control and disabled coordinate fields. Keyboard nudging is scoped to the focused canvas; native text editing remains intact.

## Reference workbench redesign — 2026-10-17 / preview 56

用户授权重新设计自定义界面。本节替代此前图内参考编辑器的长浮层布局：桌面在原参数栏位置停靠，留出原科学画布；窄屏采用底部工作台。标题栏收起/关闭、编辑/观察、撤销/重做、添加/对象/文件导航及保存状态各有固定职责。滚动仅发生在内容区，新建对象后直接定位到属性。收起时保留模式与保存状态；放置时仍显示说明和确认入口。

工具库按当前图解提供有效参考，常用组合按一次事务添加；同类默认名称自动编号。对象使用可滚动列表、显隐控件、属性和叠放顺序。文件页区分设备保存、JSON 导出及导入，导入只接受匹配图解/天体、最多 40 个对象的文件；读取后由用户选择合并/替换，不自动覆盖。清空需要再次点击确认且可撤销。导入异步任务随关闭/切换失效，旧任务不污染新视图。

The workbench replaces the long floating reference form. Desktop docking reuses the parameter rail and leaves the plot clear; mobile uses a bottom sheet with independently scrolling content. Add / Objects / Files organize the task. Creation reveals properties immediately. Persistent modes, history and device-save feedback remain available; compact placement is still actionable. White and warm paper surfaces, ink text and quiet sage selections use existing serif fonts without introducing blue accents.

Useful reference sets are atomic undo steps. Numbered default names distinguish repeated types, while personal labels stay intact. Layer ordering changes reference drawing order only. JSON imports are staged for explicit merge/replace, isolated by diagram and body, size-limited and sanitized; stale asynchronous reads are discarded. Clear requires confirmation and remains undoable. Scientific models, observer/time inputs and the separate physical-object builder retain their existing behavior. This is a GPT Site preview only.

## Continuous reference editing — 2026-10-18 / preview 57

校验错误在字段旁显示，并只滚动工作台内容以露出错误字段，不移动周围网页或科学画布。修正后移除对应错误与 ARIA 关联。单行输入支持 Enter 应用，保留输入焦点；输入法组合期间不接管 Enter/Escape。

撤销记录同时保留对象和选中状态，删除后选择邻近对象，撤销删除回到原对象属性。内容区及对象列表在重建时保留滚动位置；添加/对象/文件分别记住位置，重新打开及太阳/月球上下文切换恢复相应编辑位置和选择。保持第 56 版工作台的布局、字体、纸色与鼠尾草配色。

Validation errors appear beside their field and reveal it by scrolling only the workbench content. Corrections remove stale error associations. Enter applies a single-line value without rebuilding or blurring the input; IME composition retains native Enter/Escape behavior. History snapshots restore both objects and selection; deletion selects an adjacent object, and undo restores the original inspector. Tabs, reopening and Sun/Moon contexts retain their respective scroll/selection state. Existing scientific conditions, layout and palette remain unchanged.

## Desktop object navigation — 2026-10-18 / preview 58

较宽且高度足够的桌面窗口将对象列表和属性改为独立滚动，选择和新建后露出对应列表项，原科学画布仍不被遮挡。短窗口与手机保留连续滚动。保存、复制和删除收在固定底栏；叠放顺序留在属性区。完整操作说明按需展开，减少常驻文字占用。

列表支持 ↑↓、Home/End 选择，Enter 进入属性；属性里的 Esc 放弃尚未应用的输入并返回列表，再按 Esc 回到图面。输入法组合保持原生行为。Ctrl/Cmd+D 复制，列表中的 Delete/Backspace 删除；复制、删除及撤销重建列表后恢复有效焦点，支持连续操作。快捷键只在当前工作台/画布且不编辑文字时接管。独立属性与列表的滚动位置随重新打开和太阳/月球上下文恢复。

Wide desktop windows keep the object navigator visible above an independently scrolling inspector. New and selected rows are revealed without moving the scientific plot. Shorter windows and phones retain the continuous flow. Save / Duplicate / Delete stay in the footer; stacking controls remain in properties. Full instructions expand on request.

List arrows and Home/End select; Enter opens editing. Escape in a property restores an unapplied draft and returns to the list; another Escape returns to the plot. Scoped Ctrl/Cmd+D duplicates, and list Delete/Backspace deletes with undo. Rebuilt rows retain a valid keyboard destination for repeated actions. Text fields and IME keep native key behavior. No new palette, font or scientific model changes.

## Release-candidate edge handling — 2026-10-18 / preview 59

本轮冻结工作台的布局与功能范围，集中修复贴边说明文字的移动坐标：指针拖动和首次键盘微调从实际绘制位置开始，避免文字边界收纳后出现移动死区。取消及撤销仍恢复原始数据，不改变实验地点、日期或时间。新建对象显式初始化显隐、锁定和默认名称状态，与存档恢复一致。列表里的显式删除在观察模式仍可使用，与可见删除按钮一致；画布 Delete 仍只用于编辑模式。

The review candidate retains the established layout and feature scope. Edge-clamped annotation movement starts at its actual rendered anchor, eliminating a dead zone for pointer and keyboard movement. Cancellation/undo restores original data and leaves scientific observation conditions untouched. New references initialize the same boolean defaults used by storage restoration. Explicit list deletion remains consistent with the visible action in Explore; canvas deletion still requires Edit mode.

工作台打开时隐藏当前图角上重复的“图内自定义”入口，避免遮住贴边标注或重复打开面板；关闭后立即恢复入口及键盘焦点。入口的 aria-expanded / aria-controls 与面板状态同步。

The current plot's redundant launch button hides while its workbench is open, keeping edge annotations unobstructed. Closing restores the button and keyboard focus, with expanded/control relationships synchronized.

## Scientific reference boundaries — preview 60

时间标记和两点高度差在实际参考时刻调用原天文计算，不再对十分钟样本作数值插值；曲线的绘制样本仍缓存。升落参考通过局部极值细分识别短可见/遮挡窗口，零高度相切不当成穿越；角度容差为 1e-9°，根定位采用有界二分。时间先对总分钟取整再格式化，避免出现“19:60”。行星伴月参考轨迹在方位展开图的接缝处分段，避免跨图伪连线；地球昼夜的反正弦输入作浮点截断。

日行迹参考缓存只包含影响年度轨迹的科学参数，不因播放状态、当前日或当前时刻变化重新求整年样本。以上不替换星历或改变主模型公式；原布局、颜色与字体不变。

Time-marker and altitude-difference references now evaluate native astronomy at the requested instant rather than interpolating ten-minute samples. Bounded extrema refinement finds short visibility windows; zero-height tangencies are excluded, with a 1e-9° numerical tolerance. Minute carry is applied before clock formatting. Companion trails split at the azimuth projection seam, and inverse-sine inputs clamp floating-point noise. Annual-reference cache keys contain only the scientific inputs that affect the track. Ephemerides and primary model formulas are retained.

科学参考标签按实际绘图区边界收纳，靠近天顶或图边时不再被绘图裁切；个人说明仍可放在整个画布范围，不改变其拖动坐标。

Scientific-reference labels stay within the plot's clipping bounds; personal notes retain canvas-wide positioning and their existing movement coordinates.

## 月份参考的语义 / Month reference semantics — preview 61

逐日照明图中的日期标记仅在所属月份显示。跨月测量仍给出两日数值与差值，属性区说明未显示标记的原因；切换到对应月份后自动显示。月份对照曲线在图内标注年月，避免把另一月份的同日号误读为当前日期。原星历与观测状态不受参考对象编辑影响。仅更新 GPT Site 预览，正式发布仍待用户批准。

Dated illumination markers appear only in their own month. Cross-month measurements retain both dated values and their difference; the inspector explains absent markers and updates when the displayed month changes. Comparison curves identify their year and month. Editing references leaves native ephemerides and observation conditions independent. GPT Site preview only; official publication awaits user approval.

## 参考点与联动观测 / References and observation locations — preview 62

工作台以白底、墨色与中性灰区分层级，统一原界面的边框与字号，移除独立的绿色配色。自动生成及编辑后的经纬度显示最多四位小数，存储与计算仍保留输入精度。地球/地图与地轴图的观察点属性明确说明当前计算地点；“按此地点更新各图”把参考点设为当前天体的观测地点，统一更新该天体的关联图解，不改变日期或当地真太阳时。浏览器后退恢复观测地点；工作台撤销仍只撤销参考对象编辑。继续移动参考点不会暗中更改观测地点，需再次应用。

The workbench uses the existing white, ink and neutral-gray interface palette. Coordinate fields display up to four decimal places without rounding stored or calculated values. Observer references explicitly identify the current observation location. “Update all diagrams from here” applies the reference to the active body's observation conditions, keeping the date and local apparent solar clock. Native browser Back restores observation conditions; workbench Undo remains scoped to reference edits. Further reference movement remains independent until applied again. The new observer-link suite checks four-plot consistency, native history, validation, precision, bilingual context and phone operation. GPT Site preview only; official hosting remains unchanged.

## 侧栏内编辑 / Editing within the parameter rail — preview 63

桌面与宽屏平板的图内自定义直接挂载到原参数侧栏，以原侧栏边框和背景承载；不再使用覆盖在其上方的独立浮窗。关闭恢复原参数和侧栏滚动位置。跨窗口尺寸保留编辑焦点，手机继续采用紧凑面板，去除浮层阴影。自定义控件复用原界面的颜色、圆角及字体变量，不新增独立配色。

On desktop and wide tablets, customization is mounted inside the original parameter rail rather than overlaid on it. Closing restores the original controls and rail scroll position. Responsive remounting retains editor focus; phones retain a compact panel with no floating shadow. Controls reuse existing theme, radius and typography variables. Only the GPT Site preview is updated.

## 统一自定义开关 / One customization switch — preview 64

关联图解默认以正常模式打开，顶部“进入自定义”是编辑模式的统一入口。进入后显示布局工具、图内参考编辑及实验搭建入口；图解标签保留，可在单图与自定义组合之间切换。顶部“完成自定义”统一退出，关闭编辑与布局设置、恢复进入前的正常图解。参考对象、布局和编辑草稿保留在本次访问中；本机保存仍需明确点击保存。正常模式不绘制自定义参考、不应用参考显隐设置，也不显示编辑手柄和入口。日期、地点、观测时刻仍使用原共享科学状态；这不是另一套物理计算。刷新不会自动进入编辑模式。无效输入会阻止退出并定位到字段，避免丢失未修正的编辑。

Related Diagrams opens in normal mode. The header Customize / Finish customizing switch controls layout editing, plot-reference tools and the experiment-builder entry. Native diagram tabs remain usable within editing mode. Finishing closes editing surfaces and restores the prior normal diagram while retaining session drafts and layout choices. Device persistence still requires Save. Normal mode hides custom annotations and editing affordances and ignores reference visibility overrides. Dates, location and observation time remain the original shared scientific state, not a second simulation. Refresh starts in normal mode. Invalid reference fields block exit and receive focus. GPT Site preview only; official hosting is unchanged.

## 地点联动与日行迹对照 / Location linkage and analemma comparisons — preview 65

主观察点可直接拖动，球面其他位置保留旋转视角；四图共用原观测状态。移动地点可固定当地真太阳时，或保持同一 UTC 瞬间并换算当地日期和时刻，含跨日、日期变更线和闰年边界。自由移动、沿纬线及沿经线约束用于图上移动；明确选择城市、输入坐标或应用参考点时不套用拖动约束。Escape、失焦或调整窗口可取消主观察点拖动。理想模型仅使用固定当地真太阳时。

日行迹对照继承主图的时间规则，每条轨迹可独立指定钟表时/真太阳时和时区。赤纬—时角视图禁用无效的纬度编辑并说明原因；高度参考仅用于天空/天穹视图。坐标范围包含所有可见对照轨迹，不裁掉异地时刻曲线。轨迹使用不同的浅色、选中线宽和列表色标；完全相同条件提示重合，图上不再堆叠长标签。读数使用简明经纬度、时刻、时间规则和时区。

Drag the primary observer dot to update the shared solar diagrams; dragging elsewhere retains camera rotation. Location changes can preserve local apparent solar time or the same UTC instant, including local-date rollover. Parallel/meridian constraints apply to plot movement; explicit cities, coordinate entry and reference application bypass these movement constraints. Escape, blur or resize cancels a point drag. Ideal models use apparent-solar-time comparison only.

Analemma references inherit the primary time basis and expose independent time-basis/UTC-offset fields. Declination–hour-angle views explain latitude invariance; altitude references require sky/dome coordinates. Bounds include visible comparison tracks. Distinct light curve colors, selected line width and list swatches identify references, matching conditions report overlap, and long canvas labels are removed. Numeric readouts are compact. GPT Site preview only; official hosting unchanged.

## 地点与时间对照 / Place & time comparisons — preview 66

关联图解在自定义模式内新增“地点与时间”，保留左侧说明与控制、右侧图解及下方共享时间栏。“同一地点 · 不同时刻”比较当前真太阳时前后的太阳位置，间隔可选 1、3、6 小时；跨午夜使用相邻日期。“同一瞬间 · 不同地点”以同一 UTC 时间戳计算三个观察点，提供纬度/经度对照示例及两个独立经纬度输入，显示各地真太阳日期、时刻、高度和方位。对照条件不改变主观测地点。天空半球包含方向、天顶、日轨迹及地平线下方虚线；读数表可辅助阅读。理想赤纬模型不提供 UTC 异地对照，边界日期和非法坐标有明确处理。轨迹使用有界缓存，时间更新不重复生成整日采样。

Related Diagrams adds a customization-mode Place & time lesson, keeping explanations and controls in the original left rail and diagrams on the right. One-place comparisons use apparent solar times one, three or six hours either side of the shared timeline, with adjacent dates at midnight. One-instant comparisons compute three locations at exactly the same UTC timestamp, with latitude/longitude examples and two editable sites. Readings show each local apparent solar date/time, altitude and azimuth without modifying the primary observation location. Sky hemispheres show cardinal directions, zenith and day paths; below-horizon portions are dashed. Ideal declination models explicitly exclude UTC comparisons. Invalid coordinates and date limits have explicit states; bounded day-path caching avoids resampling on each clock update. GPT Site preview only; official hosting unchanged.

自定义总开关现位于语言切换旁边；新增功能仅在开启后出现，原观测参数始终可用。交互约定：[中文](docs/customization-interaction.zh.md) · [English](docs/customization-interaction.en.md)。

The customization switch sits beside language. New tools require explicit entry; original observation controls remain available. See the bilingual interaction specifications linked above.

## 预览 67：图内编辑与城市对照 / Preview 67: reference editing and city comparisons

进入自定义保留当前图解；布局工具仅在四图对照中出现。原工具名称保留，按钮统一完整边框与尺寸；模式名称改为“移动图中标记／按原图操作”。桌面左栏通过“观测条件／图中对象”原位切换，保留科学条件和草稿。保存、复制、删除收进每行对象名称及显示勾选后面的“···”，底部仅显示状态。新增可见城市自动参与高度曲线、升落方位及地平面图对照，使用同一组颜色；全局时间规则区分同一 UTC 与同一当地真太阳时。原地点保留为基准，明确应用城市时才更换基准。城市的隐藏、删除及位置变化会刷新对照。仅 GPT Site 预览；正式网站未改动。

Customization retains the selected diagram; layout controls appear only in four-view comparison. Existing tool labels remain, outlined controls have consistent dimensions, and modes explicitly say Move plot markers / Use original controls. The desktop rail switches in place between observation controls and plot objects without losing drafts. Save, Duplicate and Delete live in the ellipsis beside each object's name and visibility checkbox; the footer shows status only. Visible city references automatically contribute corresponding altitude curves, event bearings and horizon planes, using shared colors and an explicit UTC/apparent-solar-time rule. The original observation location remains the baseline unless a reference is explicitly applied. GPT Site preview only.


## 预览 68：实验台共用自定义 / Preview 68: Lab customization

实验台在语言旁提供统一自定义开关，保留四个原视角、地点参数与共享时间栏。城市自动参与天空和关联图解对照；天空／高度图的时间标记跨原图显示，同地不同时间不必另开页面。内部导航一次延续编辑状态，会话草稿跨页保留，刷新默认正常模式。实验台添加工具可进入摆放实验物体，点击原视角返回。对象行“···”提供保存、复制、删除。此功能现已纳入正式版；当前工作台规则见最新统一自定义说明。

Lab shares the customization switch beside language while retaining native viewpoints, observation controls and timeline. Cities appear in sky and related comparisons; pinned times compare within the original diagrams. Internal navigation transfers edit intent once and retains session drafts; refresh starts normally. Lab can open construction from its Add tools and return through a native viewpoint. Row ellipsis contains Save, Duplicate and Delete. GPT Site preview only; official hosting is unchanged.

当前交互约定 / Current interaction rules: [中文](docs/customization-interaction.zh.md) · [English](docs/customization-interaction.en.md).


预览 69 / Preview 69：修复 GPT Site 将 `.html` 跳转为简洁地址时，跨页自定义状态无法延续的问题；中英文两套路由均有重定向回归检查。 Clean-URL redirects now retain one-use customization intent in both languages; refresh still starts normally.


## 实验台就地对照 / Inline Lab comparisons — preview 70

常用城市和时刻对照移入实验台原“日期与地点”菜单，保留原参数、视角与时间栏。可直接编辑本页及关联图解创建的城市／时刻，复用原时间规则、图中参考数据和历史；不再需要跨页设置。手机沿用原设置抽屉。仅更新 GPT Site 预览。

Common city and time comparisons now live in the Lab’s original Date and location menu. Edit references from either page in place, using existing time semantics, reference stores and history. Native controls and the phone drawer remain. GPT Site preview only.


## 固定菜单层级 / Stable navigation — preview 71

主导航不随太阳／月球改变入口。桌面自定义的观测条件／图中对象常驻，关闭编辑器只替换下层内容。添加／对象／文件保留用户选择，不按有无对象自动跳转；图名只作为当前上下文。手机保留栏目选择。仅 GPT Site 预览更新。

Primary destinations remain stable across Sun/Moon changes. Desktop customization retains its sidebar navigation after closing editors; plot context updates only the content. Add / Objects / Files follows user selection rather than object count. Phones retain the chosen section. GPT Site preview only.


Preview 72 (2026-10-19): persistent 3D Customize entry beside language, including immersive mode; Lab comparisons moved to the original menu top with direct builder access; new construction scenes start empty and examples require a choice. Existing saved scenes are preserved. See bilingual interaction documentation in docs/.

## 2026-10-21 unified customization

Keep the native main navigation, observation controls and scientific plot. The object workbench has a persistent Add object command, a temporary Plans view, an object list and selection properties. No Observe/Edit switch or Add/Objects/Files tab strip. Empty states contain no disabled inspector. Shared cities/times keep their source identity; physical objects use the existing ground renderer. Match native paper controls and dark plot actions across desktop, tablet and phone.
