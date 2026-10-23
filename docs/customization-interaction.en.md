# Customization interaction

## Unified workbench: observe views together

Lab, related diagrams and analemma share one workspace. Existing URLs still select their corresponding views, and the top navigation stays stable. In the left sidebar choose Views & layout, expand Sky & shadows, Related diagrams or Annual changes, and select a named view. Observation controls retains location, date, time and the original experiment settings.

To show sky, Earth, altitude and analemma together, start with Space view, enter customization beside language, then use the add controls beside the view names in Views & layout. An included view offers removal; selecting its name still displays it or replaces the selected pane. Additional views extend below the fold after four panes.

Arrangement & saved layouts is an inline sidebar section rather than an overlay. Choose one through four views, adjust arrangement and save combinations there. Collapse menu and sidebar navigation remain available. Finishing customization retains the combination and keeps observation controls usable; phones reuse the existing parameter drawer.

Views share location, date and the common observation time. Analemma separately labels its fixed annual sampling clock, retaining civil-clock time by default to show equation-of-time motion. Linking to the common apparent solar clock removes that horizontal component. Editing its sampling clock or basis unlinks it without changing the shared observation time.

Drag solar and lunar rise/set compasses to rotate them, or scroll/pinch to zoom. Compass labels rotate with the view while true bearing readings stay unchanged. Select an event point to jump to its time, use arrow keys to rotate, Home to reset and Escape to cancel a drag. Poles and days without events do not produce invented markers.


Earthrise uses the same hierarchy: choose Views & layout → Related diagrams to open it or switch plots. Observation controls contains orbital position, height and playback; the view catalog remains available.

## Customization: add, compare and save

### Enter and finish customization

Choose Customize beside the language button. The main navigation and original location/time controls remain available. Observation controls adjusts the baseline experiment; Plot objects adds and edits references. Finish customizing closes the tools while keeping the session draft.

Collapse menu and the section tabs stay available while scrolling. Use the handle at the left of the canvas to reopen the sidebar. Under Views & layout, choose a category and a diagram. While customizing, use the control beside a diagram to add it to a combination; Arrangement & saved layouts contains view count, arrangement, proportions and saved layouts. On phones, close the original parameter drawer to return to the canvas.

Expand Arrangement & saved layouts to reveal settings inside the left menu without covering the diagrams. Phones use the same content inside the original parameter drawer. Choose a one-, two-, three- or four-view preset, or add more diagrams from the catalog. Switch to Observation controls to adjust the baseline experiment.

Date comparisons can be dragged too: start Same place · different dates, then use the selected reference’s annual slider or calendar. The range follows its year, including 366 days in leap years. This changes the comparison date, not the bottom timeline.

Dragging previews continuously and commits one change on release, so one undo restores the whole drag. Arrow keys fine-tune sliders; Escape cancels an active drag and Ctrl/Cmd+Z undoes. Visible keyboard focus identifies the active control.

Expand Add individual tools for reference lines, measurements, snapshots and text. The question-mark help explains the current plot’s time rules, projection or teaching scale and links to the guide. City list swatches match their comparison colors; overlapping comparison labels try alternative positions.

Observe in the lower-right corner of 3D Space opens camera and display settings. In immersive mode, Escape first closes an open Observe menu; press it again to leave immersive mode. When the phone parameter drawer returns to desktop width, keyboard focus moves to a visible menu control.

If a shared instant maps a comparison location outside the supported years 1900–2100, that location is unavailable and its solar point and daily path are omitted. Adjust the date or longitude to resume the comparison.

### Example 1: compare cities at one time

In the solar Lab, enter customization, choose Add object, select Same instant · different places and a comparison city, then Start this experiment. The comparison uses one shared UTC instant and selects the new city; the baseline location, date and bottom timeline stay unchanged.

Select another city or drag its latitude and longitude sliders; keep the inputs for precise values. Moving away from a city gives it an automatic Custom location name with coordinates; names you enter are preserved. One shared UTC instant and the same local apparent solar time compare different things.

Added cities appear in the linked sky, altitude, rise/set bearing and horizon diagrams. The same city remains editable from Related Diagrams. Identical locations can produce overlapping curves. Only Use as baseline location changes the original observer.

### Example 2: pin different times at one place

Choose Same place · different times under Add object, then Start this experiment to add 09:00 and 15:00 markers. Select either marker and drag its own time slider. One undo removes the newly created pair.

Time markers use local apparent solar time at the baseline location and accept 00:00–24:00. Adding a marker does not change the active time on the bottom timeline. Date comparison curves likewise leave the global date unchanged.

### Example 3: place a rod and observe its shadow

Start Place a rod · observe its shadow, then click the ground or Place at the center. Select the rod and drag its height, position or permitted tilt sliders. Upright, grounded and locked constraints still apply. The baseline location, date and time determine the light.

Drag an object base to move it, drag empty ground to orbit, and use the wheel to zoom. There is no Observe/Build mode switch. Circles, planes and dials are references; mutual object occlusion is not simulated.

Choose a view under Views & layout → Sky & shadows to return from the experiment ground to the sky. Ground objects remain available and are marked Experiment ground in the object list. Lunar mode supports ground objects, but omits solar-only city comparisons.

### Select, save and restore

Select an object name to view its properties. Movable objects have handles; drag a handle to adjust it. Empty space retains the original camera gestures. Locked objects can be selected but cannot be dragged. Escape cancels placement or a drag.

The row-end More menu contains Save plot objects, Duplicate and Delete. Drafts last for this session. Save plot objects stores the source plot references on this device; Save ground scene stores physical objects; Layout & saved views stores arrangements only. These saves do not overwrite one another or sync automatically to other devices.

Loading older saves normalizes duplicate object IDs and invalid properties, retaining up to 40 valid plot references. If a normalization notice appears, review the restored objects and save them. Invalid ground measurements are ignored while other valid objects remain usable.

Plans can save, export or import the current plot references. Imports offer merge or replace; clearing is undoable. Download JSON for backup: local saves do not automatically sync across browsers or devices. On phones, use Back to object list from properties; Add object stays available above.

Customization preserves the baseline location, date, time and view. Cities and times use the existing shared references, identified by source and object ID. Existing save formats remain valid; objects are not copied and astronomical formulae do not change.

New controls retain the site typography, colors and radii. Light sidebars and dark plot actions stay consistent with their regions. Adding, selecting, editing, saving and returning to the original plot are checked on desktop, tablet and phone sizes; Chromium checks do not replace Safari device testing.

Other tools: altitude plots support date comparisons, reference levels and two-point time/altitude differences. Phase diagrams can capture dated snapshots; planet–Moon diagrams support angular separations and trails. The ground also supports spheres, circles, planes, dials, stations, points and text. Select several objects for Arrange selected objects or Measure and record. Reference A freezes its creation conditions; B follows the current parameters.

After closing the editor, native observation controls remain available across phone-width and immersive transitions. Escape belongs to the current dialog; inside the editor it cancels placement or returns, while outside the editor it does not close the object menu.
