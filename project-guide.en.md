# Project introduction and feature manual

From navigation to individual modules: what each feature does, how to use it, which conditions are linked, and how references, layouts and full experiments are saved.

- [Project purpose and entry points](project-guide.en.html#overview)
- [Interface and controls](project-guide.en.html#controls)
- [Set location, date and time](project-guide.en.html#conditions)
- [Choose, replace and combine views](project-guide.en.html#views)
- [Four Sun and shadow viewpoints](project-guide.en.html#sun)
- [Earth, daylight, maps and axis geometry](project-guide.en.html#earth)
- [Daily altitude curves](project-guide.en.html#altitude)
- [Solar and lunar rise/set bearings](project-guide.en.html#bearings)
- [Phases, illumination and Moon–planet comparisons](project-guide.en.html#moon)
- [Independent Earthrise controls](project-guide.en.html#earthrise)
- [Analemma and cause experiments](project-guide.en.html#analemma)
- [Sundials and solar shadows](project-guide.en.html#sundial)
- [Customization and object editing](project-guide.en.html#customization)
- [City, date and clock comparisons](project-guide.en.html#comparisons)
- [Construct rods, spheres, circles and measurements](project-guide.en.html#builder)
- [Layout, ordering and focused viewing](project-guide.en.html#layout)
- [Drafts, layouts and full experiments](project-guide.en.html#saving)
- [3D Sky and the Solar System](project-guide.en.html#space)
- [Undo, keyboard and touch](project-guide.en.html#keyboard)
- [Troubleshooting and model boundaries](project-guide.en.html#help)

## Project purpose and entry points

SkyMotion connects location, date and time with linked local-sky and spatial diagrams. Core calculations run in the browser without an account or live ephemeris service. The four main entries are Welcome, Lab, Documentation and 3D Sky.

1. Start with the default solar experiment in Lab; open the learning guide through Documentation for teaching activities.
2. Use this manual for controls, saving scope and modules; use Developer reference when changing code.
3. The top navigation switches major areas. Sidebar sections and pane viewpoints operate inside the workspace without rewriting the main menu.

| Entry | Purpose |
| --- | --- |
| Welcome | Welcome scene, star interactions and documentation access |
| Lab | Shared workspace for Sun, Moon, related diagrams, analemma, comparisons and construction |
| Documentation | Teaching guide, feature manual, developer reference and Markdown downloads |
| 3D Sky | Solar System, Sun–Earth–Moon, reference comparisons, local sky and exploration |

The original Lab, Diagrams and Analemma URLs still open their corresponding content. They are compatible entries into one workspace rather than three disconnected experiments.

Switch Sun and Moon directly with the top segmented buttons, or focus them and use the left/right arrow keys. The compact playback panel groups the exact clock with its slider; the flanking buttons step by five minutes. Moon puts date controls first. Observation settings begin with mode, place and date; calculation and scale notes expand on demand.

## Interface and controls

The page contains a stable main menu, experiment heading, left control rail, right plots and lower timeline. Desktop supports side-by-side operation; widths of 760 pixels or less use the parameter drawer.

1. Select Sun or Moon beside the heading and check coordinates and the timeline date.
2. Use Views & layout to choose views and Observation controls for original parameters. In customization, Plot objects edits added references and annotations.
3. Use Collapse menu to enlarge the plot and the edge control to restore it. On phones open Parameters, make changes and close the drawer.
4. The language button switches Chinese and English without resetting scientific conditions. Reduced motion follows the operating system.

> Mouse, slider and keyboard gestures can target different objects. Check the active pane and selected reference before acting; distinguish camera motion, baseline relocation and comparison-site movement.

The app bar starts with observation identity, followed by the main menu and direct Sun/Moon segmented buttons. Customization and language stay on the right, with a compact reflow on narrow screens. Find 3D comparison in Views & layout to observe the original scientific diagram alongside a scene sharing the same UTC.

## Set location, date and time

City presets are shortcuts for coordinates. The lower shared timeline controls the current observation; annual sampling and Earthrise have separate controls described below.

1. Choose a city or scrub latitude and longitude; use numeric fields for precision. Latitude is positive north and longitude positive east.
2. Use the date slider, day-step buttons, seasonal shortcuts or calendar. The calendar supports month and year navigation and applies only on confirmation.
3. Scrub the clock, type a precise value or step by five minutes. Pause before controlled comparisons.
4. Check what playback advances: stepping dates differs from advancing a daily clock. Looping controls behavior at boundaries.

| Quantity | Range and interpretation |
| --- | --- |
| Latitude | −90° to 90°; azimuth has special limitations at the poles |
| Longitude | −180° to 180°; note local-date rollover near the date line |
| Date | Real-date observation supports 1900–2100 and validates leap days |
| Daily clock | Local apparent solar time; 24:00 represents a day boundary, while some annual sampling controls stop at 23:59 |
| Ideal declination | Ideal solar mode adjusts declination independently and does not imply a unique real UTC instant |

## Choose, replace and combine views

The view catalog groups Sky & shadows, Related diagrams, Annual changes and Compare & build. Spatial view, shadow plan view, horizon view and look-up view are nested under Sky & shadows in the left sidebar; Moon mode uses its corresponding viewpoints. These controls are not duplicated above the canvas. In combinations, each pane’s Edit action lives in its header so data and gesture hints remain unobstructed. Combined views also work in normal mode; customization enables composition changes.

1. A view name opens a single view. In a combination, an included name selects its pane and an absent name replaces the active pane.
2. Click the intended pane and check its green outline and matching catalog item; replacements target this pane.
3. The control beside a name adds a pane; for an included view it removes it. At least one pane remains.
4. Sky has one catalog entry. Spatial, overhead-shadow, horizon and looking-up viewpoints are grouped in the sky pane header.

> Only entries offering an add control support composition. Earthrise and construction retain their independent scenes.

## Four Sun and shadow viewpoints

The four viewpoints share the baseline location, date and clock; switching viewpoints does not change them.

1. Spatial view: drag the camera, scroll or pinch to zoom and use Reset view. Inspect the daily path, rod and shadow.
2. Overhead shadow: compare length, direction and tip paths from above; display magnification changes the display scale only.
3. Horizon view: inspect rising, setting and altitude changes, noting dashed below-horizon extensions.
4. Looking up: turn toward the Sun, Moon or planets. Turning the view is different from relocating the observer.

Display aids offer tracks, angle references, shadows, tip traces and lunar overlays where supported. At night, during polar conditions or close to the horizon, shadow readings may be absent or extend beyond the canvas.

## Earth, daylight, maps and axis geometry

Earth & daylight connects sunlight, the subsolar point, observer and day–night pattern. Axis & horizon connects the rotation axis, equator and local horizon.

1. Choose globe or world map and check the drag rule before interacting; a globe gesture can rotate only the view.
2. Use the explicit observer-move mode or observer marker, choosing fixed UTC or fixed apparent solar time.
3. Use movement constraints to change only latitude or longitude. Align observer location changes the camera orientation.
4. Rotate the axis view and use its legend to distinguish axis, equator, horizon, zenith and sunlight.

## Daily altitude curves

The solar chart uses apparent solar time horizontally and altitude vertically. The lunar illumination chart has different axes.

1. Select a time on the curve and cross-check the lower clock and current sky position.
2. Add a date comparison curve in customization and change its reference date using the object’s own slider or calendar.
3. Add horizontal levels, time markers or two-point time/altitude differences and check endpoints and units.
4. Compare peaks, zero crossings and curves wholly above or below zero. Identical conditions may produce overlapping curves.

## Solar and lunar rise/set bearings

Events use the body center crossing the geometric horizon, without atmospheric refraction, terrain or solar-radius corrections. Cardinal directions stay fixed rather than rotating to fabricate readings.

1. Click a rise or set endpoint to jump to that event time.
2. Drag an endpoint toward another bearing. The site stays fixed while the date is searched, updating other views and the shared date.
3. Solar dates are searched within the current year, lunar dates within five weeks of the original date. Unreachable targets use the nearest achievable result with an explanation.
4. Left/Right changes date by a day; scroll or pinch zooms; Home resets zoom; Escape cancels a drag and restores its starting date.

> No endpoint is draggable if that event is absent. Use date or location controls first. At a pole the model does not assign a unique bearing.

## Phases, illumination and Moon–planet comparisons

Moon mode retains separate solar and lunar settings and offers lunar-specific views in the catalog.

1. Phase relationships: inspect Sun–Earth–Moon geometry, the Earth-based bright portion and orbital phase.
2. Daily illumination: compare illuminated fraction over dates and cross-check the current date with the phase diagram.
3. Moonrise/set: inspect the day’s events; a missing rise or set can be valid.
4. Moon & planets: select a planet, check separation and horizon position, and preserve the observer and time basis for range searches.

> A close approach is directional, not a collision or necessarily close physical spacing. Search results do not fully assess weather, terrain, sky brightness or visual detection limits.

## Independent Earthrise controls

Open Earthrise through Related diagrams in Moon mode. The orbital diagram and astronaut view share one orbital state; the module does not treat the Lab date as a real mission trajectory.

1. Choose orbit or fixed surface. Orbit mode adjusts position angle, altitude, animation duration and Sun–Earth–Moon configuration.
2. Use Watch Earthrise to find emergence at the lunar limb, then play or pause.
3. Use Look toward Earth or Home when Earth is off screen; dragging the astronaut view turns the head only.
4. On phones switch between orbital and astronaut views. Use Views & layout to leave the module and Observation controls for its parameters.

Fixed-surface mode disables inapplicable orbital angle, altitude and flight controls. The model uses synchronous rotation, a spherical Moon and a circular orbit without libration or terrain.

## Analemma and cause experiments

The analemma records solar direction through a year at a fixed sample clock for one site. Its header labels sampling time and basis; the lower timeline retains current observing conditions.

1. Choose an available projection such as the local 3D sky, sky coordinates or declination/hour angle.
2. Set the annual sample clock, fixed civil or apparent-solar basis and the fixed UTC offset for civil time.
3. Link to the shared apparent-solar clock when needed; changing sample time or basis unlinks it.
4. Overlay clocks, sites or reference tracks. Small panes reduce month labels and prioritize the current month.
5. In the cause experiment, vary tilt and eccentricity independently, then return to real-date mode before interpreting the ephemeris.

## Sundials and solar shadows

Sundial pages and Lab controls provide rod shadows and horizontal/equatorial apparatus. They share location and sunlight with teaching diagrams, while display scaling is distinct from physical dimensions.

1. Choose apparatus or shadow view, then set applicable latitude, date, clock and rod height.
2. Compare orbit, overhead, tip-path or apparatus viewpoints and reset the camera when needed.
3. Check solar-time and fixed-offset explanations rather than assuming civil local time.
4. When the Sun is below the horizon or no valid ray–plane intersection exists, use the status instead of expecting a reading.

## Customization and object editing

The common switch sits beside language. Entering preserves original observation controls and enables references, composition changes, layout editing and construction. No unexplained reference circle is automatically added.

1. Choose the relevant view, open Plot objects and Add objects, then use a goal-based recipe or advanced tools.
2. Placement tools provide a hint; click the plot or use the available center-placement action.
3. Select a row or plotted reference and use sliders or precise inputs. Visibility and locking are separate controls.
4. Each row’s More menu offers applicable save, duplicate and delete actions. Undo/redo handles reference edits; a continuous slider drag is grouped, and Escape cancels an active gesture.
5. Finishing retains the composition and hides editing handles. Re-enter to continue. Refresh starts in normal mode, with drafts restored according to session rules.

| View | Reference types |
| --- | --- |
| Earth & daylight | Observer sites, latitude/longitude guides, Sun directions, notes and emphasis |
| Altitude curve | Date curves, altitude levels, clock markers and time/altitude differences |
| Rise/set bearings | Bearing circles, obstruction/reference levels, dated event markers and measurements |
| Axis & horizon | Observers, circles, directions, plane/axis visibility and angles |
| Phase relationships | Observer positions, sight lines, rays, phase markers and snapshots |
| Moon & planets | Comparison objects, angular separation, dates and position trails |
| Analemma | Site/clock tracks, altitude/direction guides and date labels |
| 3D Solar System | Reference planes, camera markers, distance lines, angle arcs and notes |

Tools are filtered by view, body and mode; not every plot offers the same set. Tracks, snapshots and observer stations have view-specific meanings.

## City, date and clock comparisons

Comparison references are added to the baseline experiment. Adding a city does not relocate the baseline, and identical conditions can produce overlapping curves.

1. Different places at one instant: choose a city in the place recipe and start, using the shared UTC instant.
2. Scrub coordinates after selecting the city. Leaving preset coordinates updates an automatic name to a custom location; a manual name remains.
3. Choose fixed UTC or equal apparent solar time and check local dates across midnight.
4. Selecting a city emphasizes it across related views and dims others; Make baseline explicitly relocates the primary observer.
5. The same-place recipe adds earlier/later clock markers with their own slider. Date curves use their own dates without changing the shared date.

The dedicated place/time scene can show the current and surrounding clocks or the baseline and two comparison locations, with interval, sites and readings in its observation controls.

## Construct rods, spheres, circles and measurements

Construction starts with empty ground or an explicitly restored scene. Sun and Moon use separate object scenes; the ground is a teaching model rather than arbitrary terrain.

1. Choose a rod, sphere, circle, plane, dial, station, marker or note and click the ground; multiple items can be placed at once.
2. Adjust position, dimensions, elevation, direction and permitted tilt, checking upright, grounded, locked and grid-snap constraints.
3. Use applicable circular, equally spaced or aligned arrangements and check whether operations target one object or a group.
4. Choose the required objects for distance, angle or shadow measurements and check trail length and sampling when recording motion.
5. Keep a reference scene and change one condition for comparison, adding notes to record assumptions.

> Camera changes do not relocate objects. Constraints limit edits, and locked objects cannot be dragged. Interpret lunar lighting and shadow readings according to the current mode.

## Layout, ordering and focused viewing

The multi-view workspace reuses scientific canvases and one shared clock. Up to six composable views are supported; more than four scroll vertically, while phones switch through view tabs.

1. Enter customization and add views from the catalog; use count presets or quick combinations in Arrangement & saved layouts.
2. Two views can be side by side or stacked, and three can be balanced or featured. Reorder by handles or order controls.
3. Drag dividers to preview proportions and release to resize the canvases, or commit an exact proportion from 30% to 70%.
4. Focus a pane temporarily and press Escape to return. Layout undo/redo is separate from scientific-condition history.

> The catalog is the single add-view entry; saved-layout settings do not repeat those buttons. Finishing retains the composition while hiding editing handles and dividers.

## Drafts, layouts and full experiments

Storage covers session drafts, individual reference/scene saves, layout collections and full experiments. Choose the scope before relying on refresh or another device.

1. For layout only, leave Include conditions and objects off in Arrangement & saved layouts, enter a name and save.
2. For a full experiment, select the option and save a name; this includes observation state, layout, current-body references and construction objects.
3. Select a save marked Full experiment to restore it paused. Invalid full records are rejected without partially replacing the current experiment.
4. Up to five saves can be renamed, updated or removed; reusing a name updates it. Individual reference and ground-scene saves remain available.
5. For another device, provide written conditions and available object JSON exports rather than assuming cloud-account synchronization.

| Storage | Scope | Boundary |
| --- | --- | --- |
| Session draft | Reference edits and experiment state within the session | Subject to session lifetime, storage limits and page behavior |
| Layout save | Views, ordering, arrangement and proportions | Does not restore scientific conditions |
| Full experiment | Observation state, layout, current-body references and constructed scene | Device-local browser storage; restored paused |
| Individual references/scenes | Current plot references or constructed scene | Separate from collections and scoped by the specific control |

If storage is denied or full, the status explains visit-only availability. Check the result before closing the page rather than assuming persistence.

## 3D Sky and the Solar System

3D Sky uses an independent renderer, UTC dates, physical vectors and teaching display scales. Documentation and customization remain in the stable top navigation area.

1. Select a planet in the scene or list; approach and reset actions change the camera only.
2. Use Sun–Earth–Moon relationships for lighting, orientation and the lunar orbit, distinguishing physical and display distances.
3. Use Observe for camera/display options, drag to rotate and scroll or pinch to zoom; follow the pane’s keyboard hints.
4. Choose a reference plane or local observer for a diagram comparison at the same UTC instant.
5. Adjust date and playback rate, checking UTC, looping and boundaries; immersive mode retains the parameter drawer.

Available exploration controls cover stars, satellites, small bodies and nebulae. Different objects may use catalogs, approximate orbits or processed imagery; source and license labels are not measurement-accuracy guarantees.

Lab’s 3D comparison retains the local scientific view alongside a linked spatial scene. UTC is shared while cameras remain independent. If WebGL is unavailable, continue in the 2D Lab.

## Undo, keyboard and touch

Browser history, object undo, layout undo and camera reset have different scopes. Follow the named action and keyboard focus.

1. Use browser Back/Forward for observing parameters and major selections; playback is paused on restore.
2. Use local undo/redo for reference or layout edits; continuous scrubs are grouped, and Escape cancels an active drag or placement.
3. Use Tab for focus and arrow keys for native slider adjustment. Canvas arrow-key behavior follows that view’s hint.
4. Phones use the parameter drawer and view tabs; close the drawer before plotting gestures. In immersive mode, close an open tool before Escape exits immersion.

## Troubleshooting and model boundaries

First check body, active pane, time basis, customization mode and selected object before treating a result as a failure.

1. Cannot find Add: enter customization, choose the intended view and open Plot objects; tools differ by view.
2. Name does not change: automatic names track coordinates while manual names remain; verify whether the baseline was edited.
3. No apparent link: check composition membership, reference visibility and whether the comparison uses shared UTC or equal apparent solar time.
4. Empty events or curves: check polar conditions, tangency, date limits and below-horizon states before assuming a software error.
5. Earth is missing: use Look toward Earth in Earthrise or reset the 3D camera. Occlusion and being outside the frame are distinct.
6. Language/font failure: use the offered retry action while retaining the experiment. Include device, browser, URL and steps in reports.

This is not a weather, navigation, precision-survey or mission-guidance tool. Refraction, all terrain, device performance and every orbit error are not comprehensively modeled. Display scales, lunar-image treatment and ideal experiments have teaching purposes.

- [Read variables, formulas and data sources](development-guide.en.html#coordinates)
- [Read teaching investigations and worksheets](guide.en.html#record)
