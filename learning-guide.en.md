SKY MOTION LAB · OPERATIONS AND OBSERVATION

# Learning Guide: Operations and Observation Tasks

## Unified workbench: observe views together

Lab, related diagrams and analemma share one workspace. Existing URLs still select their corresponding views, and the top navigation stays stable. In the left sidebar choose Views & layout, expand Sky & shadows, Related diagrams or Annual changes, and select a named view. Observation controls retains location, date, time and the original experiment settings.

To show sky, Earth, altitude and analemma together, start with Space view, enter customization beside language, then use the add controls beside the view names in Views & layout. An included view offers removal; selecting its name still displays it or replaces the selected pane. Additional views extend below the fold after four panes.

Arrangement & saved layouts is an inline sidebar section rather than an overlay. Choose one through four views, adjust arrangement and save combinations there. Collapse menu and sidebar navigation remain available. Finishing customization retains the combination and keeps observation controls usable; phones reuse the existing parameter drawer.

Views share location, date and the common observation time. Analemma separately labels its fixed annual sampling clock, retaining civil-clock time by default to show equation-of-time motion. Linking to the common apparent solar clock removes that horizontal component. Editing its sampling clock or basis unlinks it without changing the shared observation time.

Drag a solar or lunar rise/set point to adjust the shared date while keeping the location fixed. The actual bearing approaches the target and other views update with the date. Solar dates are searched within the current year; lunar dates within five weeks of the original date. Unreachable bearings stop at the nearest achievable position with an explanation, without inventing astronomical readings. Click a point to jump to its time; left/right arrows change the date, scroll or pinch to zoom, Home resets zoom, and Escape cancels a drag and restores its original date. Poles and days without events do not produce invented markers.

Combined views opens a multi-view comparison even outside customization; adding, removing and arranging views still require customization. The sidebar has one sky entry, with its four viewpoints in the sky pane header. While customizing, click a pane to mark it with a green outline and the matching sidebar entry. Selecting an absent view name replaces this pane; its add control adds another pane instead.

Selecting a comparison city highlights its matching curves, positions and legends across the related views while dimming other comparisons. Switch cities to compare. In smaller analemma panes, month labels adapt to the available space, retain the current month and avoid collisions.

In Arrangement & saved layouts, select Include conditions and objects, enter a name and save. This saves the current body’s location, date, time, layout, references and constructed objects. Select a saved item marked Full experiment to restore it paused; damaged records do not partially replace the current experiment. Leave the option off to save only the layout. Existing individual object and scene saves remain available. Saved items stay on this device and do not automatically synchronize across devices.


Follow the entry points, operating steps, controlled variables and recording methods to observe the Sun, Moon, shadows, sundials, analemmas and 3D Solar System. Start with the five-minute task, then choose a topic.

1. [Complete your first observation](guide.en.html?lang=en#start)
2. [Controls, menus and undo](guide.en.html?lang=en#controls)
3. [Customization: add, compare and save](guide.en.html#customization)
4. [Classroom and independent-learning routes](guide.en.html?lang=en#lesson)
5. [Sun tasks: a day, seasons and latitude](guide.en.html?lang=en#sun)
6. [Shadow tasks: make shadows and shadow-tip paths clearer](guide.en.html?lang=en#shadow)
7. [Moon tasks: follow phases by date and the sky by time](guide.en.html?lang=en#moon)
8. [Looking Up tasks: adjust direction and time together](guide.en.html?lang=en#sky)
9. [Sundial tasks: compare two instruments](guide.en.html?lang=en#sundial)
10. [Analemma tasks: the annual path and the origin of the figure eight](guide.en.html?lang=en#analemma)
11. [3D Solar System tasks: distinguish spatial motion from apparent motion in the sky](guide.en.html?lang=en#space)
12. [When an operation does not work as expected](guide.en.html?lang=en#help)

This guide follows observation tasks: set the conditions, add comparisons, read the results and save the experiment. The project introduction explains model sources; the development guide explains implementation and verification.

The production version supports Chinese and English. The top navigation language button switches menus, reading explanations, diagram annotations and documents without changing location, date, time or experiment settings. This browser remembers your language preference; English mode provides complete English Markdown downloads. The calendar applies a date only when confirmed; cancelling leaves the experiment unchanged.

Earthrise uses the same hierarchy: choose Views & layout → Related diagrams to open it or switch plots. Observation controls contains orbital position, height and playback; the view catalog remains available.

## Complete your first observation

Before an experiment, write a question and decide what to hold constant, what single variable to change and which reading will determine the result. This guide provides operating routes, worksheets and recording tables. Project Overview explains the purpose, data sources and scope; Development Guide describes the code and validation for maintainers.

1. Open the [Lab](lab.en.html?lang=en) and choose “Sun” or “Moon Phases” beside the title. Confirm the title, location, date and time.
2. Choose a location under “Parameters → Date and Location.” For exact coordinates, expand “Fine-tune Latitude and Longitude.” Latitude is positive north and negative south; longitude is positive east and negative west.
3. Pause playback. Choose a full date in the calendar below the diagram, then set the time using the slider, input field or ±5-minute buttons. The main experiment uses local apparent solar time.
4. Record the initial readings and change only one condition. Check the result in another diagram, then state the location, date and time basis for which your conclusion holds.

### Five-minute introduction: a day in Beijing

1. Open the lab, choose “Sun → Spatial View,” select Beijing and choose this year's spring equinox. Keep “Date-based Observation” selected.
2. Pause playback and enter 06:00, 09:00, 12:00, 15:00 and 18:00 in the time field below the diagram. Read the Sun's altitude and azimuth at each time.
3. Compare the Sun with the horizon: a positive altitude is above it; a negative altitude is below it. Do not assume 06:00 or 18:00 must be the exact rise or set time. Use the ephemeris and rise/set indicators for the selected date.
4. Switch to “Horizon View” or “Daily Altitude Curve” and check the same time. Return to 12:00, then change only the date to the summer and winter solstices.
5. Write a conclusion with explicit conditions, such as “In Beijing, at the same apparent solar time, the Sun is higher at the summer solstice than at the winter solstice.” Then choose a southern latitude and check where that conclusion applies.

Make a prediction before testing it. If the result differs, check the location, date, time basis and mode first. Avoid changing several parameters together just to obtain the diagram you expected.

## Controls, menus and undo

### Find the diagram, time bar and parameters first

Common date and time controls are below the diagram. The parameter menu contains location, calculation mode, display aids and observation settings; it does not contain a second identical calendar. Above 760 pixels, the left sidebar is visible by default. Select “Collapse Menu” at its top to enlarge the diagram, restore it with the left-edge arrow, or drag the handle to open or close it.

At widths of 760 pixels or less, select “Parameters” beside the title to open the side drawer. Scroll its content vertically to read it; swipe left on the header to close it. You can also use the close button, click the backdrop or press Esc. Close the menu after making changes and continue with the time bar below. Immersive 3D also uses a parameter drawer. If the top navigation does not fit, swipe horizontally to find an entry.

### Understand buttons, switches and expandable sections

- A row of buttons chooses a mode or view; green marks the current selection. Ordinary links open another page.
- Switch labels sit on the left, controls on the right. Click either to toggle; green means on and gray means off. Long labels may wrap. A faded, inoperable control is disabled until its prerequisites are met.
- Arrow headings expand subordinate settings in the same panel, after peer buttons and switches. In the Sun experiment, “Display Aids” lists paths, guides and the Moon overlay first, followed by “Shadows and Gnomon-tip Paths.” In Related Diagrams, “Spatial Models” is last in the entry list.
- Related Diagrams supplies menus appropriate to the current body and tab, hiding irrelevant Sun-path and shadow controls. Sundials and analemmas are Sun tasks.

### Play through a day or through dates

1. Expand “Playback and Quick Times” and choose what to advance: “Time within a Day” for one day, or “Date (Fixed Time)” for comparing dates.
2. Set the speed and looping, then select Play on the time bar. Manually changing a date or time pauses playback so you can read the values.
3. The Sun date slider covers the year; the Moon slider covers the month. Use the calendar or playback month settings to cross months. Analemma shares the bottom date control with the other plots; its fixed annual sampling clock is set in Observation controls and shown above its plot.
4. Quick buttons for sunrise, culmination and sunset jump to events calculated for the current conditions. “None Today” means there is no corresponding geometric event that day.

### Back to undo, Forward to redo

Mode, diagram, body selection and parameter changes enter browser history; a continuous slider adjustment becomes one step. Dragging a curve can also be undone if it changes the date or time. Opening, closing or scrolling menus and pure camera rotation or zoom do not add steps. Restoring settings pauses playback. A new change after undo replaces the forward branch according to browser rules. Going back beyond this page's earliest record leaves the page.

### Keyboard controls and feedback

Use Tab to move focus, Space to toggle a focused switch, and Enter or Space to expand a section heading. Keyboard-enabled canvases use arrow keys; see the view's hint for zoom controls. Menus and selectors have slight spring feedback, but readings update without waiting for it to finish. Enable your system's reduced-motion setting for immediate transitions. If a section pauses on first opening, record the exact menu and browser and report it using the troubleshooting guidance.

### Distinguish these three operations first

| Operation | Where to adjust it | What changes | What to check first |
| --- | --- | --- | --- |
| Observation time | Time slider, time input and ±5-minute controls below the diagram | Body positions and shadows within the same date | Keep the date and location unchanged |
| Observation date | Date slider or calendar below the diagram | Sun or Moon conditions on different dates | Hold the observation time fixed when comparing dates |
| Observation location | Parameters → Date and Location | Latitude, longitude and the local sky | Check whether the previous date and time remain selected |
| Rotate the view | Drag a rotatable view or use arrow keys | Usually changes only the camera | Check whether “Link Observation Location” is enabled on the globe |

The main time bar uses local apparent solar time. Sundials and analemmas also provide clock-time comparisons with a fixed UTC offset; record your chosen time basis. A noon reading on the diagram is not automatically 12:00 on a phone in that city. Pause before changing the date; use the calendar to confirm a full date when crossing a month or year.

### How to interpret readings

| Reading | Meaning | Recording considerations |
| --- | --- | --- |
| Sun/Moon altitude | The angle of a body above the local horizon: 0° at the horizon, 90° at the zenith | A negative value means below the horizon, not a calculation error |
| Azimuth | Measured clockwise from north: east 90°, south 180°, west 270° | Azimuth can be sensitive or non-unique near the zenith or a geographic pole |
| Solar declination / subsolar latitude | The Sun's position relative to the equator, positive north and negative south | Record it separately from your observation latitude; a high Sun does not mean it is directly overhead locally |
| Time above the horizon | Time for which the body's geometric center is above the 0° horizon | Atmospheric refraction and the Sun's apparent radius are excluded, so this is not the same convention as naked-eye sunrise and sunset |
| Lunar illuminated fraction | The fraction of the Moon's visible disk illuminated by the Sun as viewed from Earth's center | Discuss it separately from local visibility times, bright-limb orientation and naked-eye visibility |
| Shadow length / distance | Check the units: m, cm, km or AU. One AU is approximately 149.6 million kilometers | Readings are calculated physical quantities. The drawing is scaled, so pixels are not physical lengths |

### Do not mix the three time bases

**Local apparent solar time:**Follows the local solar hour angle and is useful for comparing solar positions during a day.**Clock time with a fixed UTC offset:**Used for sundial and analemma comparisons. Enter the offset; the project does not automatically apply regional daylight-saving time.**UTC：**The common instant used by the independent 3D page; it does not change with the observation location.

Setting 12:00 apparent solar time at two different longitudes compares their respective local noons, usually not the same physical instant. For 3D comparisons, use the UTC synchronized by the system rather than manually giving both displays the same numbers.

### If language switching fails

If language switching fails, use Retry in the page notice. Retrying preserves the location, date, time and experiment settings. If it still fails, report your browser and the steps you followed.

## Customization: add, compare and save

The object menu keeps the plot name at the top; the question-mark button expands help on demand. Add object, Plans, Undo and Redo share one row, leaving more room for the object list and properties below.


### Enter and finish customization

Choose Customize beside the language button. The main navigation and original location/time controls remain available. Observation controls adjusts the baseline experiment; Plot objects adds and edits references. Finish customizing closes the tools while keeping the session draft.

Collapse menu and the section tabs stay available while scrolling. Use the handle at the left of the canvas to reopen the sidebar. Under Views & layout, choose a category and a diagram. While customizing, use the control beside a diagram to add it to a combination; Arrangement & saved layouts contains view count, arrangement, proportions and saved layouts. On phones, close the original parameter drawer to return to the canvas.

Expand Arrangement & saved layouts to reveal settings inside the left menu without covering the diagrams. Phones use the same content inside the original parameter drawer. Choose a one-, two-, three- or four-view preset, or add more diagrams from the catalog. Switch to Observation controls to adjust the baseline experiment.

Date comparisons can be dragged too: start Same place · different dates, then use the selected reference’s annual slider or calendar. The range follows its year, including 366 days in leap years. This changes the comparison date, not the bottom timeline.

Dragging previews continuously and commits one change on release, so one undo restores the whole drag. Arrow keys fine-tune sliders; Escape cancels an active drag and Ctrl/Cmd+Z undoes. Visible keyboard focus identifies the active control.

Expand Add individual tools for reference lines, measurements, snapshots and text. The question-mark help explains the current plot’s time rules, projection or teaching scale and links to the guide. City list swatches match their comparison colors; overlapping comparison labels try alternative positions.

Observe in the lower-right corner of 3D Space opens camera and display settings. In immersive mode, Escape first closes an open Observe menu; press it again to leave immersive mode. When the phone parameter drawer returns to desktop width, keyboard focus moves to a visible menu control.

If a shared instant maps a comparison location outside the supported years 1900–2100, that location is unavailable and its solar point and daily path are omitted. Adjust the date or longitude to resume the comparison.

In Place & time, choose Compare times or Compare places. For times, drag the bottom timeline to move the current, earlier and later markers together; Before / after the current time sets the interval. Desktop readings sit beside the diagram and show each time, altitude and azimuth. For places, select cities A and B, then refine their coordinates with the sliders. These changes affect only comparison sites; the baseline stays unchanged. Press Escape during a drag to cancel.

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

Other tools: altitude plots support date comparisons, reference levels and two-point time/altitude differences. Phase diagrams can capture dated snapshots; planet–Moon diagrams support angular separations and trails. The ground also supports spheres, circles, planes, dials, stations, points and text. Select several objects for Arrange selected objects or Measure and record. Reference A freezes its creation conditions; B follows the current parameters.

## Classroom and independent-learning routes

| Duration | Sequence | What to submit |
| --- | --- | --- |
| 10-minute introduction | A Day in Beijing → Change seasons at a fixed time → Check the altitude curve | Altitude readings at five times and one conclusion with explicit conditions |
| 20-minute Sun topic | Compare seasons → Compare latitudes → Shadows → Sundials | Two controlled-variable records; explain display magnification versus actual shadow length |
| 20-minute Moon topic | Phase principles → Compare dates at a fixed time → Moon sky → 3D comparison at the same UTC | A date/illumination table for a month; distinguish phase changes from daily rising and setting |
| 30-minute integrated investigation | Clock-time analemma → Apparent-solar-time comparison → Idealized cause experiment → Check spatial relationships | Diagrams labeled with their time basis; explain which variable caused each change |

Teachers can demonstrate once on a shared screen before students reproduce the same conditions. Assign one variable to each group first; distinguish observed data from explanations during discussion. If results differ, compare settings before discussing the model. Do not ask students to measure real distances from rescaled 3D spheres.

## Sun tasks: a day, seasons and latitude

1. Choose “Sun → Spatial View.” Fix the location and date, move the time from morning to afternoon, and record the Sun's position and altitude at its highest point. Select the ⓘ beside “Daylight Duration” to see the calculation convention.
2. Expand “Playback and Quick Times” and select sunrise, daily culmination or sunset to compare their diagrams.
3. Keep the location fixed and select the summer and winter solstices. Use the same observation time each time and record altitude and daylight duration. To compare the full year continuously, select “Date (Fixed Time)” and drag the date or play by day.
4. Return to one date and time, then change only latitude. Compare the equator, Beijing and a high-latitude location. Do not change the date during this step.
5. Open Related Diagrams and choose “Daily Altitude Curve,” “Sunrise and Sunset,” “Subsolar Point and Day/Night” or “Earth's Axis and Horizon.” Click the altitude curve or rise/set result to inspect the corresponding time.
6. Under “Subsolar Point and Day/Night → Globe View,” choose a drag mode. The default “Rotate View Only” changes the viewing direction while keeping location, physical instant and subsolar point fixed. “Link Observation Location” changes latitude and longitude while holding local apparent solar time fixed, so the corresponding UTC and subsolar point may change. Select “Center on Observation Location” to reset the view; a single click on the globe still selects a new location.

### Example: compare seasons in Beijing

1. Choose Beijing and Date-based Observation; use the solstice/equinox buttons to select this year's summer solstice.
2. Set 12:00 local apparent solar time. Record solar altitude, the daily highest position and daylight duration.
3. Change only the date to the winter solstice and record the same values. In Beijing the summer-solstice Sun should be higher and daylight longer. Do not transfer Northern Hemisphere seasonal conclusions unchanged to the Southern Hemisphere.
4. Read both dates' rise/set azimuths in “Sunrise and Sunset,” then compare intervals above the horizon in “Daily Altitude Curve.” Polar regions may have no ordinary sunrise or sunset; read the polar-day or polar-night indicator.
5. To investigate latitude, restore one of those dates and 12:00, then change latitude alone. Record the Sun's position relative to the zenith; do not move the date slider simultaneously.

Ideal Experiment lets you adjust solar declination separately; Date-based Observation uses real ephemerides. Return to Date-based Observation afterward to avoid comparing real dates under idealized conditions. “Four-diagram Comparison” shows altitude, rise/set, day/night and horizon relationships under shared conditions; return to a single diagram when small text needs to be read.

### Compare four related diagrams together

1. Choose a location, real date and local apparent solar time, pause playback and enter [Related Diagrams](diagrams.en.html?lang=en) in Sun mode.
2. Choose “Four-diagram Comparison” to view the subsolar point and day/night, daily altitude curve, rise/set azimuths and Earth's axis/horizon together under the same conditions.
3. Change only time and record which diagrams vary with it and which quantities depend mainly on date and latitude. Then fix time and change only the date.
4. When small diagrams omit text, switch to the corresponding single diagram. The globe and axis diagram rotate independently; confirm that globe dragging is set to “Rotate View Only” to avoid accidentally changing the observation location.
5. For an original-diagram/3D comparison, exit the four-diagram layout first and enable “3D Comparison.” Only real-date conditions synchronize with 3D; idealized solar conditions are not mixed with real ephemerides.

Record both the original diagram's tab and the 3D mode. Both sides share one physical instant; do not force the local apparent solar time and UTC numbers to match.

## Shadow tasks: make shadows and shadow-tip paths clearer

1. Choose “Sun → Overhead Shadow View,” then expand “Display Aids → Shadows and Gnomon-tip Paths.”
2. Enable ground shadows and set the vertical gnomon's height. Increase “Shadow Ground Magnification” if the shadow is too short to see; decrease it if the tip lies outside the drawing.
3. Enable “Daily Gnomon-tip Path,” drag the time or click the path, and record the tip's positions in the morning, near noon and in the afternoon.
4. When comparing gnomon heights, keep location, date, time and display magnification fixed and record shadow length separately. Do not compare only the drawn segment lengths.

### Identify the source of a change

Record solar direction, solar altitude, shadow direction and shadow length in the morning, at local noon and in the afternoon. A shadow points opposite the Sun's horizontal direction. For one vertical gnomon, a higher Sun gives a shorter shadow. Changing “Ground Magnification” changes only display scale, not physical shadow length. Use the same display magnification when comparing two gnomons and rely on the numerical values.

There is no direct solar shadow while the Sun is below the horizon. Near the horizon, a shadow may extend far beyond the drawing. If clipping arrows appear, reduce magnification or choose a higher solar position; an off-screen shadow is not an absent shadow.

### Worksheet: compare direction, shadow length and seasons separately

1. Fix Beijing, one date and one gnomon height. Use 09:00, 12:00 and 15:00 and record altitude, solar azimuth, shadow direction and length. Check that the shadow points away from the Sun.
2. Return to 12:00 and change only the date to the summer and winter solstices. A higher Sun usually gives a shorter shadow for the same vertical gnomon; confirm this from readings before applying it at another latitude.
3. Fix a time with a visible shadow and double the gnomon height. Physical shadow length should change in proportion. Then change only ground magnification: the actual shadow-length reading should stay the same.
4. Enable the shadow-tip path and select morning, noon and afternoon points. Check that the current tip lies on the path. A Sun below the horizon produces no direct solar gnomon shadow; near the horizon the shadow can be very long and extend off-screen.

A nearly zero shadow near the zenith is a geometric result. Magnify the display to inspect a short shadow rather than changing the observation time just to obtain a longer one.

## Moon tasks: follow phases by date and the sky by time

1. Choose “Moon Phases,” set a location and month, and fix the observation time. Move the monthly date slider and record the phase name and illuminated fraction of the visible lunar disk.
2. To see motion during a day, select “Moon Sky,” then choose spatial, overhead-azimuth, horizon or Looking Up view. Set playback to “Time within a Day.”
3. Enter Related Diagrams from Moon mode and choose “Phases and Relationships,” “Daily Illuminated Fraction” or “Moonrise and Moonset.” Confirm the title says “Moon · Related Diagrams,” then adjust date and time directly on that page.
4. Select “Moon–Planet Pairing” and choose a planet. Fix location and time and compare angular separation by date. You can also use “Find Closest Day in the Next 30 Days,” then read the altitude and visibility guidance.

### Using the phase-principle diagram and daily observations

1. Open the phase diagram and inspect Earth, the Moon on its orbit, parallel sunlight and the adjacent lunar-disk illustration. Body sizes and distances are not to scale.
2. Drag the Moon near its orbit with a mouse or finger to follow phase changes continuously. This also changes the real date and time. To compare different dates strictly at the same time, use the date slider below while keeping time fixed.
3. Every few days, record date, phase name and illuminated fraction. The phase cycle is about 29.53 days, not one calendar month. Continue across months using the calendar; do not expect every month's first day to be a new moon.
4. Switch to Moon Sky to observe the Moon's altitude and rise/set during one day, then change the date to compare at the same time. A daily lunar path covers only 00:00–24:00 and usually does not close at its ends.

The large lunar disk in the principle diagram has a fixed illustrative orientation; it cannot directly tell you whether the bright side is on the left or right in your local sky. Use Looking Up for the actual sky orientation. Hemisphere and viewing direction change the disk's orientation on-screen. A small Moon–planet angular separation does not guarantee naked-eye visibility; check altitude, daylight and the page's guidance.

### Worksheet: observe a month at one fixed time

1. Choose a location and month, set 20:00 local apparent solar time and pause. Change the date by roughly three days at a time; record phase, illuminated fraction, lunar altitude and indicators such as “Below the Horizon.”
2. Find the dates nearest new moon, first quarter, full moon and last quarter, then inspect adjacent dates more closely. Do not assume those phases occur on a particular lunar-calendar or Gregorian-calendar day; use the ephemeris readings.
3. Choose a date when the Moon is above the horizon and keep it fixed while moving the time through the day. Compare illuminated fraction with sky position: rising and setting are daily motion; the main phase period is about 29.53 days, although illumination also changes slowly during a single day.
4. Check the illuminated fraction at the same instant in the phase-principle diagram or 3D Sun–Earth–Moon view. The bright side seen by an external camera, a fixed-orientation phase diagram and the lunar disk's rotation in the local sky represent different viewing arrangements.

Do not explain full moon as the Moon producing its own light, or ordinary phases as Earth's shadow covering it. These diagrams show sunlight and viewing direction; eclipses require additional occultation conditions and are not simulated by this model.

## Looking Up tasks: adjust direction and time together

1. In the Sun interface, select Looking Up directly. In Moon Phases, first select Moon Sky, then Looking Up.
2. Use the azimuth slider or cardinal-direction buttons to turn, and the time slider to change observation time. These operations change direction and time separately.
3. Click a body's name in the parameter area to face it. The Moon's bright limb rotates with the local sky orientation; the phase-principle diagram keeps a fixed orientation. If a body is not visible, first read indicators such as “Behind You” or “Below the Horizon.”
4. To compare the Moon in the Sun interface, expand Display Aids, enable “Overlay the Moon's Apparent Motion,” then compare at fixed location, date and time.

Record viewing direction separately from time. First fix time and turn to find each body; then fix direction and change time to see bodies rise, fall or leave the view. Planets drawn in daylight indicate position, not guaranteed naked-eye visibility. A body below the horizon cannot be seen directly from that location.

The ground-direction disk marks north, east, south and west. A blue dot marks the observer and a gold arrow points straight ahead. When you drag to turn, both the grid and direction labels change projection: facing south puts east on the left and west on the right; facing east puts north on the left. This is a directional aid, not an orbit, and it does not change body altitude. Direction at the poles follows a reference convention.

### Why does the path not meet the horizon?

Select “Path Explanation” above Looking Up. The horizon is altitude 0°, not a physical surface on which bodies land. Orthographic projection gives curved left and right boundaries to the forward hemisphere. A path is clipped when it passes behind you, which need not happen at altitude 0°. The Moon's 00:00 and 24:00 endpoints may also remain above the horizon; they are not necessarily rise/set times.

Fix a date near the June solstice in Beijing and face south, then east, north and west. Northeastern sunrise and northwestern sunset are behind you when facing south, so the visible solar path's ends can lie above the horizon. In this project, geometric rising or setting occurs only when a body's center crosses altitude 0°.

### Worksheet: observe the Moon and planets together

1. Fix location, date and time. Use the four direction buttons to find the Sun, Moon and planets, then click a body's name to face it. Read its altitude to check whether it is above the horizon.
2. Keep direction fixed and move only the time. Record when bodies enter or leave the forward hemisphere. Distinguish “Behind You” from “Below the Horizon”: you can turn to see the former; the latter cannot be seen directly there at that time.
3. In Moon mode, enable Moon–Planet Pairing and record the angular separation from the selected planet. Check both altitudes and daylight conditions. A small separation means similar directions, not small physical distance or guaranteed naked-eye visibility.

## Sundial tasks: compare two instruments

Choose the sundial type and “3D Instrument / Dial and Installation” above the drawing. The dial reading stays beside the diagram; use only the controls below for time and date. By default, drag the 3D instrument to rotate it and pinch or use the wheel to zoom. Dragging the shadow changes time only after you select “Drag Shadow to Set Time.” Reset View leaves location and observation time unchanged. Parameters are grouped by observation location, instrument settings, clock-time comparison and construction principles.

1. Select Sundial Lab from the Sun lab's Related Diagrams menu to open the independent experiment page. Then choose Horizontal Sundial or Equatorial Sundial using the buttons at the top.
2. Choose Horizontal Sundial, set location and date, and move the time slider below the drawing. The current “Dial Reading” appears above it; switching types updates the reading and explanation together. At night, it reports no direct solar shadow. Select “Drag Shadow to Set Time” to drag the shadow or click the scale; you can also play through a day.
3. Fix date and time and change only gnomon length. Record the shadow-line changes and dial reading. Then switch to Equatorial Sundial and repeat the comparison.
4. Switch to Dial and Installation for the installation drawing. Expand “Construction, Installation and Principles” to make a physical sundial. For a clock comparison, expand Clock-time Comparison, enter the UTC offset and read the result.

### A sequence for hands-on comparison

Fix location and date, then select morning, near noon and afternoon. Record the dial reading, shadow direction and instrument type. Dragging to rotate changes only the viewing angle; time changes only in “Drag Shadow to Set Time” mode. Changing gnomon length changes shadow length, which must not be mistaken for a change in time.

A horizontal sundial has a horizontal dial and a gnomon parallel to Earth's axis. An equatorial sundial has a dial parallel to the equatorial plane and a gnomon perpendicular to it. Install it according to local latitude and hemisphere, not merely the apparent tilt on-screen. Enter the correct UTC offset for clock comparison; daylight-saving time is not applied automatically. If the reading says “No Direct Solar Shadow” or is unreadable, first choose a time when the Sun is above the horizon, then check installation conditions.

### Worksheet: instrument, shadow and clock readings

1. Choose Beijing and a time with the Sun above the horizon. In 3D Instrument, rotate to inspect the dial and gnomon. The horizontal type has a horizontal dial and an axis-parallel gnomon; the equatorial type has an equator-parallel dial and a perpendicular gnomon.
2. Record shadow lines and dial readings at 09:00, 12:00 and 15:00 apparent solar time. Scales depend on the instrument type; do not apply a horizontal sundial's scale pattern to an equatorial dial.
3. Select “Drag Shadow to Set Time,” drag the shadow and check that the time below updates. Switch back to instrument rotation and verify that rotating does not change date or time.
4. Enter the UTC offset for clock comparison and record both dial and clock times. Explain the difference using longitude and the equation of time rather than assuming the sundial is broken. Across seasons, check the illuminated side of the equatorial dial and any unreadable indication.
5. Keep all other conditions fixed when comparing gnomon lengths. Length changes the shadow-line length; it should not change the time indicated by the shadow's direction.

## Analemma tasks: the annual path and the origin of the figure eight

1. Select Analemma in the small top navigation on the Sun page to open its independent experiment. The original menu entry remains available.
2. In Parameters, set “Basis of Fixed Time” to Clock Time and enter the UTC offset. Set the daily fixed observation time below the diagram. Drag dates or play day by day and follow the marker around the annual path.
3. Keep location and time basis fixed and try 09:00, 12:00 and 15:00. You may also overlay all three times. Drag the 3D diagram to inspect another direction, or use Reset Sky View.
4. Switch the basis to Local Apparent Solar Time and record how the path changes. State the time basis in every record.
5. Expand “Advanced Experiment · Causes of the Figure Eight” and enable the idealized cause experiment. Set only obliquity to 0, then restore reference values; set only eccentricity to 0 and restore them again. Finally, compare with both set to 0.
6. Scroll only within the parameter panel while changing settings; the annual diagram stays above or alongside it. Turn off the idealized experiment when finished, then resume real-date observation.

### How to record the comparison of causes

First observe a complete year at one clock time in real-date mode, then enable the idealized cause experiment. For each run, record location, time basis, fixed time, obliquity, eccentricity and path features. Change one parameter at a time and restore reference values afterward. Setting obliquity or eccentricity to 0 isolates an influence in an idealized model; it does not alter the real year's ephemeris.

When changing observation time, first inspect the Sun's local sky position and projection direction, then compare the entire path. A 3D projection may overlap lines; rotate it or switch coordinate views. Dashed sections are below the horizon. Today's solar marker does not mean the Sun is visible on every date of the year. Fixed apparent solar time and fixed clock time are different bases and must be recorded separately.

### Worksheet: why a figure eight appears

1. Turn off the idealized experiment and fix location, Clock Time, UTC offset and 12:00. Scan the full year, noting points near solstices and equinoxes and their positions on the curve. Dashed parts lie below the horizon.
2. Change time to 09:00, then 15:00. Compare the path's sky position before rotating the 3D view to inspect its shape. Overlapping projections do not mean the time change failed.
3. Restore one fixed time and switch to Local Apparent Solar Time. Solar hour angle is now fixed, eliminating the annual east–west variation caused by the equation of time. Do not expect the same figure eight as under clock time.
4. In the idealized cause experiment, record the reference state, then set only obliquity to 0. Restore it, then set only eccentricity to 0; finally set both to 0. Use the same location, time and projection at every step and describe which parts of the curve change.

“The large loop is below and the small loop above” is not meaningful without coordinates and viewing direction. Camera rotation, time and projection change their screen positions. Check the axis labels, months and selected coordinate system first.

## 3D Solar System tasks: distinguish spatial motion from apparent motion in the sky

Enter through “Lab → Related Diagrams → Spatial Models,” the Spatial Models menu on Related Diagrams, or the 3D Sky top link. Choose 3D Solar System for the eight planets or Sun–Earth–Moon Relationships for Earth and Moon directly. This page uses independent UTC time and does not change the original lab's location, date or time.

1. Choose Solar system, pause and select a planet in Parameters. Read its mean solar distance, orbital period and radius. Use the green Observe up close button to inspect its sphere; choose Solar system to return to the overview.
2. Drag to rotate the camera and use the wheel or pinch to zoom. Rotation changes only the viewing angle, not the date or physical coordinates. The upper-right reset button restores the current view. On a computer, arrow keys rotate and plus/minus keys zoom.
3. Drag the date axis below the drawing or use the calendar. The calendar selects 12:00 UTC on the chosen date; continuous dragging and playback retain fractional-day time. Read the UTC time beside the date rather than interpreting it as local apparent solar time.
4. Fix the camera, set days advanced per second and select Play to compare inner and outer planets over the same interval. With “Loop Current Year” off, playback stops at the year's date-axis endpoint. Use the calendar to select another year before a cross-year observation.
5. Switch to Sun–Earth–Moon and enable Parallel Sunlight. Compare the arrow toward the Sun with the light rays: the arrow points to the Sun, while rays travel in the opposite direction toward Earth and Moon. Change dates to observe the Moon's spatial position and geocentric illuminated fraction. The illuminated side seen by an external camera is not automatically the phase seen from Earth.
6. On a phone, select Parameters beside the title, adjust the drawer and close it to continue observing. Touch dragging rotates in real time; pinching does not change the date.

### Immersive full-window observation: keep controls while prioritizing the view

[Enter the immersive Solar System](space/index.en.html?immersive=1&lang=en)

1. The link opens a viewport-filling layout. Immersive view on the 3D page uses the page layout and does not request browser fullscreen, so it does not trigger a system fullscreen banner. Exiting immersive view restores the layout.
2. Solar System / Sun–Earth–Moon selectors remain at the top; UTC, playback, date and slider remain at the bottom. Open detailed settings with Parameters at the upper right, then close them to rotate and zoom again. There is no second set of time controls.
3. Pause first and rotate the camera to find your object, then select its name or use “Observe → Body Close-ups.” For a gentler demonstration of position changes, choose 2 days/second in Parameters. This is accelerated time, not real-time celestial motion.
4. Enable orbits to identify orbital paths; turn off orbits or names for a clearer view. In Sun–Earth–Moon, enable Axis and Equator to distinguish the red axis, blue equator ring and ecliptic reference plane.
5. Select Exit Immersive to restore the normal layout. Esc closes an open parameter drawer first, then exits immersion. Exiting changes only layout: it does not reset bodies, camera or UTC, and does not automatically start playback.

The background catalog contains 61,816 HYG stars with J2000 directions. Normal mode shows the 8,920 stars with apparent magnitude ≤6.5; immersive mode extends to ≤8.5. Magnitude controls brightness, and color index approximates blue-white versus warm colors. No atmospheric twinkling is added in this spatial view. Glow, point size and exposure are display treatments, not stellar diameters or precision astrometry. This mode shares the original ephemeris and renderer and does not enable an automatic orbiting camera. Fix the camera before playing to distinguish physical position changes from changes in viewpoint.

### Moons, asteroids and real nebula images

1. In immersive mode, open “Observe → Solar System and Deep-sky Details” at the lower right. Satellite groups, main-belt asteroids, periodic comets and nebula backgrounds have separate switches. New objects appear as unnamed points by default to avoid covering the diagram.
2. In the Solar System overview, compare satellite groups near each planet. Mercury and Venus have no known natural moons. After selecting a planet, choose Observe Selected Planet's Moons to frame the planet and its available orbital-data points more clearly. Select Solar System to return to the overview.
3. The current snapshot contains 455 moons of the eight planets from JPL orbital tables. This is coverage of available orbital data, not a continuously updated worldwide discovery count. Apart from the Moon and Jupiter's four Galilean moons, motion is approximated from fixed mean orbital elements. Use it to observe prograde/retrograde motion and spatial distribution, not predict occultations or precise encounter times.
4. The main-belt layer contains 1,200 asteroids selected by JPL absolute magnitude, not the entire asteroid belt. The comet layer has 12 elliptical-orbit periodic comets. Both appear only in the Solar System overview and share the existing UTC controls. Point size, brightness and compressed distance are not physical observing quantities.
5. Nebula backgrounds are off by default. Optional Nebula Image Backgrounds use real public telescope images, enlarged in approximately their source directions; their screen extent is not their true angular diameter. Select View Real Nebula Images to browse Orion, the Ring Nebula and Mystic Mountain in the Carina Nebula, with original public images and sources.
6. Nebulae are distant interstellar gas and dust structures, not planetary moons or objects inside the Solar System. These multi-band and processed-color images are not naked-eye views. Turn off the background to continue using catalog stars as directional references. Esc closes the image window before exiting immersion.

Pause and fix the camera before comparing satellites, then change only the UTC date. The new point groups are independent display layers; they do not replace the original lab's geographic readings, phases or planetary positions. Return to the original lab for local rise/set observations.

### Viewing moons before and after zooming

1. Pause date playback, select Earth or Jupiter and enter a close-up. Enable planetary moons in Observe and use Observe Selected Planet's Moons when needed.
2. Fix UTC and change only zoom. Watch the planet and satellite points enlarge or shrink together with perspective; do not treat point diameter as physical satellite diameter.
3. Fix the camera again and advance dates to distinguish satellite motion from camera changes. Points have no names, so their sizes alone cannot identify individual objects.
4. Choose the Moon close-up to inspect its illustrative surface. To judge the phase seen from Earth, combine the geocentric illumination reading with the original phase diagram; the external camera's bright side is a different viewpoint.

### Camera, historical paths and Moon close-ups

1. Select Observe at the lower right of the 3D view. Perspective supports general observation; Top View looks from the fixed J2000 ecliptic north; Side View is near the reference plane. These are camera presets only and do not change the ephemeris or date. You can still rotate manually; Reset returns to the current object's default framing.
2. Choose a planet or Moon under Body Close-ups. A Moon close-up remains an external camera in Sun–Earth–Moon; its on-screen light/dark pattern is not directly Earth's lunar phase. The reading card gives actual geocentric distance and ephemeris-derived geocentric illumination. The Moon's approximately 27.32-day sidereal month differs from its approximately 29.53-day phase cycle.
3. Enable Historical Path and choose the past 7, 30, 90 or 365 days. Only the selected planet's previous path is drawn. Sun–Earth–Moon instead draws the Moon's geocentric path over 7, 30 or 90 days. The blue-gray end is older; the bright end is current UTC. Moving the date moves the lookback interval. The separate full-orbit switch is an overall reference, not the historical interval.
4. Fix the camera and lookback span, change the date, and record the interval, current UTC and selected body. Switch planets to compare orbit shapes and the portions traveled during the same span. Compare directions and relative changes in the teaching model only: distance is compressed, so screen arc length cannot measure actual speed.
5. Enable the Ecliptic Reference Plane to identify out-of-plane motion. It is the fixed J2000 ecliptic, translated to an Earth-centered origin in Sun–Earth–Moon. It is neither the local horizon nor each planet's or the Moon's individual orbital plane.
6. Show Physical Readings controls the information cards. A planet's current solar distance comes from physical vectors and differs from the sidebar's mean solar distance; the Moon uses geocentric kilometers. Hide cards for a cleaner view. Small comparison panes prioritize diagrams, and very short panes hide reading cards but retain the scrollable Observe menu. Drag rotation remains available; use the independent 3D page for the complete interface.

### Compare existing diagrams with 3D

1. Open Related Diagrams, choose Sun or Moon Phases and an existing diagram, then select 3D Comparison beside the title. You may also enter with Original-diagram Comparison from the 3D page. The original remains on one side and spatial relationships appear on the other.
2. Location, date and time remain controlled by the original diagram's menu and lower bar. The main display uses local apparent solar time; the system converts it using longitude and the equation of time to the same UTC for 3D. Both sides represent one physical instant. Do not read apparent-solar-time numbers directly as UTC.
3. Sun diagrams pair with the 3D Solar System; Moon diagrams pair with Sun–Earth–Moon. Dragging 3D changes only its camera. Select a planet name for a close-up and Reset for the overview. This does not alter the original diagram's location, time or geographic readings.
4. Fix location and date and change time. Read solar altitude, rise/set or phase in the original, then inspect 3D position and lighting direction. Fix time and move dates to record shared changes. 3D sizes, distances and textures are illustrative. Earth's rotation and axis use the same UTC; use the original diagram's readings for local day/night, seasons and lunar orientation.
5. Desktop uses side-by-side panes; sufficiently tall phone portrait screens stack them. The original time workbench remains the only one below. Select 3D Comparison again to close it. Idealized Sun experiments and Four-diagram Comparison do not overlay 3D; return to Date-based Observation and one diagram first.

### Auxiliary 2D references on the independent 3D page

1. Choose Solar System or Sun–Earth–Moon above the view, then Reference. These are different levels: the first chooses objects and the second layout. Select 3D to return to one pane without changing the date.
2. Choose Spatial Top View on the 2D side for the ecliptic-plane projection at the same ephemeris instant. 3D rotates; 2D always looks from ecliptic north, helping identify projection changes caused by viewpoint. The overview is Sun-centered and Sun–Earth–Moon is Earth-centered. Lunar out-of-plane height is projected away, not evidence that the orbit coincides with the ecliptic.
3. Choose Local Sky on the 2D side for the Sun's, Moon's and selected planet's altitude and azimuth. Earth is not drawn as a planet visible in the sky. Adjust latitude and longitude in Local Sky Observation Location while keeping UTC below fixed to compare hemispheres or longitudes. It uses the original site's coordinate conventions but is not another independently running lab.
4. Move the single date axis to update both panes. Camera rotation changes neither sky altitude nor illuminated fraction. Record UTC, location, the selected 3D body, altitude and azimuth separately. Do not interpret UTC as the original lab's local apparent solar time.
5. Geocentric lunar illumination in Sun–Earth–Moon comes from the same ephemeris snapshot, not from the bright side seen by the external camera. Azimuth may be non-unique or sensitive near poles or the zenith; altitude readings remain useful for comparison.
6. Desktop is side by side, tall phone portrait screens are stacked, and short screens remain side by side. The date bar stays independent below. When names do not fit the 2D diagram, readings take priority. Return to 3D and focus a planet for close-ups.

Planets have illustrative craters, cloud bands, Jovian vortices, banded Saturn rings and Martian polar caps. Earth retains its local texture with a restrained illuminated atmospheric rim. These aid identification; they do not report real terrain, weather, seasonal polar caps or current surface imagery. They do not change ephemeris positions, lighting directions or size scaling.

### Distinguish reference plane, solar direction and display scale

- The ecliptic reference plane is a fixed J2000 spatial reference, not the equatorial plane or your local horizon. The arrow points toward the Sun and parallel rays arrive from that direction. An arrow drawn near the plane does not mean the Sun is directly over the equator.
- To determine subsolar latitude, read the Sun diagram's subsolar-point latitude and compare it with the axis and equator ring. It is near the equator at the equinoxes, the Tropic of Cancer near the June solstice and the Tropic of Capricorn near the December solstice. Do not infer it from a camera screenshot alone.
- Satellite positions and planetary distances use teaching-scale mappings; point size is not physical radius. Focus a planet before zooming and points scale with perspective. Use readings, not pixels, to compare physical distances.
- Normal wide screens show the parameter sidebar by default. Collapse Menu at its top enlarges the view. Immersive mode always puts parameters in a drawer. Exiting immersion resets neither UTC nor camera.

### What to record and what not to misread

Record UTC date and time, view, selected body, days advanced and position changes observed with a fixed camera. Orbital distances are compressed nonlinearly and body sizes enlarged separately; screen lengths cannot determine physical distances or volumes. Solar-distance and period cards give mean references, not instantaneous distance. Sun–Earth–Moon has a separate scale that cannot be compared directly with overview pixels.

The main 3D view illustrates spatial relationships; Local Sky supplies altitude and azimuth. This page has no complete local rise/set search and does not simulate eclipse occultation. Earth's rotation, texture longitude and axis are calibrated through sidereal time and coordinate transforms; other bodies' surface orientations remain illustrative. Return to the original lab and diagrams for sunrise, local phase orientation or geographic day/night. If WebGL cannot initialize, this page provides a return link and the original lab remains usable.

## When an operation does not work as expected

1. Cannot find a slider: scroll inside the parameter panel and expand its section. Common time and date sliders are below the diagram.
2. Cannot change the date: check whether the Sun is in Ideal Experiment. Return to Date-based Observation in Demonstration Mode, or Solar Calculation Mode on Related Diagrams.
3. No shadow or body is drawn: check time and position indicators, then adjust time or direction. Open Project Overview and Geographic Model Notes to understand geometric conditions.
4. Unsure of settings after changing pages: check Sun/Moon in the title, location, date and time. Each body keeps its own state; page visits reuse current-session settings.
5. Still seeing a problem: use Contact the Author · Feedback Welcome and include module, location, date, time, steps, device and browser.

### Troubleshoot by symptom

| Symptom | Check first | Next step |
| --- | --- | --- |
| Date keeps advancing, preventing a precise comparison | Does the playback button show Pause? | Pause, then enter the target date or time. Comparison panes share their parent page's clock |
| Body disappears after rotation | Are you in a close-up, too close, or facing the wrong direction? | Reset the view or return to the Solar System / Sun–Earth–Moon overview; do not change ephemeris time just to recover the view |
| The lunar path's ends do not join | Is it a daily path or a historical path? | The Moon's 00:00 and 24:00 positions usually differ. Historical paths are not forced to close either |
| Earth's illuminated side appears equatorial in 3D | Check date, projection and whether axis/equator display is enabled | Read the subsolar latitude, then inspect different camera angles. Screen up/down alone does not determine north/south |
| Fullscreen did not activate | Check browser support and whether it was requested by clicking a button | Continue in full-window mode; immersive layout does not depend on successful system fullscreen |
| 3D fails to start or runs slowly | Check WebGL support, browser and other open 3D tabs | Return to the original lab if WebGL is unavailable. For persistent stutter, report browser, operation and reproduction steps; device specifications alone do not establish a cause. |
| Menu pauses on first opening, or buttons are misaligned or clipped | Record the exact menu, window width and whether the page just loaded or the screen rotated | Refresh and retry, recording reproduction steps. Repeated issues should be reported as interface problems, not assumed normal because of device performance |

### Suggested observation record

| Object and view | Fixed conditions | Single changed variable | Readings and diagram changes | What to test next |
| --- | --- | --- | --- | --- |
| Sun / Moon / Shadow / Sundial / Analemma | Location, date, time and time basis | Choose only one each time | Record values, directions, curves or shadow lines | Check another view or repeat with the next conditions |

Use the same record when reporting a problem, adding device, browser, click/drag sequence and screenshots. Describe model questions separately from interaction failures so they can be reproduced and checked.

[Enter the Lab](lab.en.html?lang=en) · [Contact the Author](contact.en.html?lang=en)
