# Customization interaction (current production release)

## Customization: add, compare and save

### Enter and finish customization

Choose Customize beside the language button. The main navigation and original location/time controls remain available. Observation controls adjusts the baseline experiment; Plot objects adds and edits references. Finish customizing closes the tools while keeping the session draft.

Collapse menu stays at the top of both Observation controls and Plot objects, including while scrolling. After collapsing, use the handle on the left of the canvas to reopen it. Diagram navigation and Layout & saved views share one row in comparison mode. Choose the number of views, undo or redo layout changes, and add diagrams inside Layout & saved views. On phones, close the parameter drawer to return to the canvas.

### Example 1: compare cities at one time

In the solar Lab, enter customization, choose Add object, select a comparison city such as London, then choose Observer / city. Its comparison appears in the original sky without changing the baseline location.

Select a city to edit its name and coordinates. One shared UTC instant compares the same real moment across places. The same local apparent solar time compares the same solar-clock reading at each place; these are different experiments.

Added cities appear in the linked sky, altitude, rise/set bearing and horizon diagrams. The same city remains editable from Related Diagrams. Identical locations can produce overlapping curves. Only Use as baseline location changes the original observer.

### Example 2: pin different times at one place

Keep the location and date fixed. Choose Add object, then Time marker. Tap the plot as prompted, or choose Place at the center, and enter 09:00 in its properties. Add another marker at 15:00 to compare the Sun at two times.

Time markers use local apparent solar time at the baseline location and accept 00:00–24:00. Adding a marker does not change the active time on the bottom timeline. Date comparison curves likewise leave the global date unchanged.

### Example 3: place a rod and observe its shadow

Under Add object, choose Rod in Experiment objects. This opens the experiment ground. Tap the ground or choose Place at the center. Select the rod to adjust its height, position or tilt; the original date and time controls continue to determine the light.

Drag an object base to move it, drag empty ground to orbit, and use the wheel to zoom. There is no Observe/Build mode switch. Circles, planes and dials are references; mutual object occlusion is not simulated.

In Lab, choose an original view button such as Spatial view to return to the sky. Ground objects remain available and are marked Experiment ground in the object list. Lunar mode also supports ground objects, but omits solar-only city comparisons.

### Select, save and restore

Select an object name to view its properties. Movable objects have handles; drag a handle to adjust it. Empty space retains the original camera gestures. Locked objects can be selected but cannot be dragged. Escape cancels placement or a drag.

The row-end More menu contains Save plot objects, Duplicate and Delete. Undo/redo acts on the source plot being edited. Property changes apply immediately. Saving persists that source plot on this device; Save scene on the experiment ground separately saves its physical objects.

Plans can save, export or import the current plot references. Imports offer merge or replace; clearing is undoable. Download JSON for backup: local saves do not automatically sync across browsers or devices. On phones, use Back to object list from properties; Add object stays available above.

Customization preserves the baseline location, date, time and view. Cities and times use the existing shared references, identified by source and object ID. Existing save formats remain valid; objects are not copied and astronomical formulae do not change.

New controls retain the site typography, colors and radii. Light sidebars and dark plot actions stay consistent with their regions. Adding, selecting, editing, saving and returning to the original plot are checked on desktop, tablet and phone sizes; Chromium checks do not replace Safari device testing.

Other tools: altitude plots support date comparisons, reference levels and two-point time/altitude differences. Phase diagrams can capture dated snapshots; planet–Moon diagrams support angular separations and trails. The ground also supports spheres, circles, planes, dials, stations, points and text. Select several objects for Arrange selected objects or Measure and record. Reference A freezes its creation conditions; B follows the current parameters.

After closing the editor, native observation controls remain available across phone-width and immersive transitions. Escape belongs to the current dialog; inside the editor it cancels placement or returns, while outside the editor it does not close the object menu.
