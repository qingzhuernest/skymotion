# SkyMotion customization interaction rules

Scope: GPT Site preview 71. The official website is unchanged.

## Entry and exit

Lab and Related Diagrams place Customize / Finish customizing beside language. Normal mode retains native controls, diagrams and the shared timeline. Entry preserves the current plot, observer, date, time and camera. Reference and construction tools require explicit customization. Layout controls appear only in the related four-plot workspace.

Finishing hides editors and reference layers while retaining drafts. Refresh and direct entry start in normal mode. Clicking an internal link between Lab and Related Diagrams transfers editing intent once. Customization uses the existing scientific conditions.

## Native controls and object editing

- Desktop switches the original left rail between Observation conditions and Plot objects, retaining both tasks. The original bottom date, time and playback controls stay available.
- Lab retains its four native Space, Top, Horizon and Look up viewpoints. Switching views keeps references. Moon retains its native phase / sky controls.
- Move plot markers edits references; Use original controls restores native camera gestures.
- Creation opens properties. List arrows and Home/End select; Enter edits. Escape in a property restores unapplied field input and returns to the list. Text composition remains native.
- Each row places an ellipsis after its name and visibility checkbox, containing Save, Duplicate and Delete. The footer only reports status. Menus support arrow keys and Escape.
- Invalid fields block saving, finishing and task switching and receive focus. Changes support undo/redo; cancelling a drag restores its data.
- Phones retain the native parameter drawer and use a bottom reference workbench with touch controls.

## Compare cities and times in the original diagrams

Add Observer / city in Earth daylight or Lab sky, then edit its coordinates and name. Visible cities participate in Lab sky, altitude, rise/set bearings and axis/horizon comparisons. Consistent city colors connect the plots; editing, hiding or deleting updates comparisons.

The original time rule distinguishes:

- **Fixed apparent solar time:** each site uses the same local apparent solar clock time.
- **Fixed UTC instant:** all sites use one physical timestamp, converted to each site's apparent solar date and time.

Comparison cities leave the baseline observer unchanged. Use as baseline location explicitly changes it. Ideal declination models support solar-clock comparisons only.

Add multiple Time markers in Lab sky or the altitude plot to compare different times at the same place within the original diagrams. Markers appear in sky, altitude, bearing and horizon geometry; Earth daylight shows their subsolar points, using the baseline site's apparent solar time on the current date. They do not change playback time. Date comparison curves remain attached to their own plot and do not replace the global date. Below-horizon sky paths are dashed; azimuth seams split; Look up clips to its visible hemisphere.

Session storage retains drafts across pages in the same tab. Explicit Save writes the device archive. Files supports JSON export/import, merge/replace and undoable clearing.

## Construct an experiment

Choose Place experiment objects in Lab sky's Add tools, or Build experiment in Related Diagrams. Rods, spheres, circles, planes, dials, stations, points and notes support position, dimensions, tilt and placement constraints. Multiple selection, arrangement, distance/angle measurement, shadow-tip records and frozen-condition comparisons remain available. A native Lab viewpoint button returns to sky without losing the scene. Original place and time controls remain available.

Rods and spheres use geometric projection. Reference objects do not block light; mutual occlusion is not modeled. Follow each diagram's stated illustrative scales.

## Visual consistency and verification

Controls reuse the original design tokens, borders, radii and bilingual serif fonts. No separate blue-purple or green UI theme is introduced. Scientific data colors remain distinct.

Regression checks cover native controls, row menus, field recovery, session drafts, navigation intent, city clock semantics, synchronized plots, construction, and English/Chinese desktop and phone layouts. Browser automation uses Chromium; Safari hardware verification remains outstanding.


Clean deployment URLs: editing intent recognizes both `.html` and extensionless routes; refresh still starts in normal mode.


## Inline Lab controls (preview 70)

After entering customization, open Compare places and times inside the original Date and location menu. Pin current time adds a marker directly to the original sky; edit HH:MM, including 24:00. Choose Add place from the native city list, then expand its name to edit the name and coordinates. Cities and markers created in Related Diagrams appear here too and can be edited without navigation. The original UTC / apparent-solar-time selector is reused. Row visibility and ellipsis Save / Duplicate / Delete remain available; Undo / Redo use the last edited source plot. Adding comparisons preserves the baseline location, date, time and camera. Phones use the existing settings drawer.


## Stable navigation hierarchy (preview 71)

Primary navigation keeps the same destinations and order across Sun/Moon changes, including Analemma. Current-page highlighting supports both languages. During desktop customization, Observation controls / Plot objects belongs to the page and stays present when the plot editor closes. Closing replaces only the content with a continuation action. Changing plots updates the editing target and tools, while retaining the chosen Add / Objects / Files section regardless of object count. Empty plots show empty content. Explicit object creation still reveals its properties for editing. Phones retain their native bottom workbench and selected section. Finishing customization restores normal mode.


## Preview 72: visible entry and an empty starting point

- Standalone 3D Solar system has the same Customize switch beside the language action. Immersive mode moves that same action group into its top controls. Embedded views keep the parent's mode without a duplicate switch.
- In Lab customization, Compare places and times is at the top of the original observation menu. One place / different times and one time / different places are explicit; the latter explains shared UTC versus equal local apparent solar time using the existing time-basis control. Comparisons use the shared references without changing baseline conditions.
- Place rods, spheres and circles opens the builder directly. New scenes start empty; two-rod and circular examples require an explicit choice. Previously saved scenes are preserved.
- The center ring in the original sky marks the original observer. It is not a circle automatically added by customization. Restored user references remain editable and removable in Plot objects.

Solar and lunar construction both start without an automatic circle. The canvas takes its background from the original `.ui-plot`; ground, grid and labels follow the existing plot palette rather than a separate green gradient. Restoring an existing saved scene is explained beside the introduction, with Empty ground and object deletion available.

The lunar Lab keeps Experiment objects in the same menu position, with direct construction access; solar-only city and time comparisons stay hidden.

### Adding objects and touch placement

Use Add object beside the object list to add another reference without closing properties. In the solar sky, choose a city before adding an observer. The baseline stays unchanged; identical locations have overlapping curves. Position-based tools display placement instructions: tap the plot, or choose Place at the center. Creation opens the new object’s properties. Save, duplicate and delete remain in the row’s More menu.
