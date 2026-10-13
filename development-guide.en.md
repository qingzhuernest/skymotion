SKY MOTION LAB · DEVELOPMENT AND MAINTENANCE

# Development Guide: Complete Implementation Logic and Maintenance

For developers and maintainers: source-code responsibilities, state and time conventions, astronomical models, rendering and control animations, regression testing, AGPLv3, and publishing to both sites.

1. [1. Project Goals and Planning Order](development-guide.en.html?lang=en#section-1)
2. [2. Technical Approach and Runtime Limitations](development-guide.en.html?lang=en#section-2)
3. [3. Pages and Information Architecture](development-guide.en.html?lang=en#section-3)
4. [4. Current File Responsibilities](development-guide.en.html?lang=en#section-4)
5. [5. How Data, the Interface, and Drawing Relate](development-guide.en.html?lang=en#section-5)
6. [6. Sun and Moon State Logic](development-guide.en.html?lang=en#section-6)
7. [7. Time Standards and Date Handling](development-guide.en.html?lang=en#section-7)
8. [8. Coordinates and Solar Calculations](development-guide.en.html?lang=en#section-8)
9. [9. Rise, Set, and Duration Calculations](development-guide.en.html?lang=en#section-9)
10. [10. Lunar Phase and Lunar Disk Orientation](development-guide.en.html?lang=en#section-10)
11. [11. Path Continuity and View Projections](development-guide.en.html?lang=en#section-11)
12. [12. Shadows, Shadow-Tip Paths, and Annual Observations](development-guide.en.html?lang=en#section-12)
13. [13. Two Interactive Sundial Types](development-guide.en.html?lang=en#section-13)
14. [14. The Analemma and the Causes of Its Figure Eight](development-guide.en.html?lang=en#section-14)
15. [15. Planet–Moon Comparisons and Looking Up](development-guide.en.html?lang=en#section-15)
16. [16. Implementation and Verification of the 3D Solar System Module](development-guide.en.html?lang=en#section-24)
17. [17. Complete Updates and Animation Scheduling](development-guide.en.html?lang=en#section-16)
18. [18. Routing, Links, and Browser History](development-guide.en.html?lang=en#section-17)
19. [19. Layout and Interaction Principles Across Devices](development-guide.en.html?lang=en#section-18)
20. [20. Shared Controls and First-Opening Animations](development-guide.en.html?lang=en#shared-controls)
21. [21. Current Initialization and Generation Methods](development-guide.en.html?lang=en#section-19)
22. [22. Testing and Acceptance Logic](development-guide.en.html?lang=en#section-20)
23. [23. Packaging and Publishing to Both Sites](development-guide.en.html?lang=en#section-21)
24. [24. Resolved Issues and Ongoing Maintenance Boundaries](development-guide.en.html?lang=en#section-22)
25. [25. Standard Workflow for Adding Features](development-guide.en.html?lang=en#section-23)

Updated October 13, 2026. The production release uses the reviewed bilingual interface. Comparison with original main commit 4390ab1 confirms that the astronomy engine and core model data are unchanged. Historical checks retain their original dates; new release checks appear at the end of this guide.

This document supports continued development and maintenance. Start with the files and data flow, then consult the relevant model, state, and rendering sections. Implementation details are organized by responsibility. For student instructions, see [Learning Guide](guide.en.html?lang=en); for the development purpose and strengths, see [Project Overview](project-guide.en.html?lang=en)。

## 1. Project Goals and Planning Order

The project expands a solar apparent-motion demonstration that traditionally depended on Flash into a celestial-motion laboratory accessible directly in a browser. Students should be able to change location, date, or time and immediately see the response in sky positions, paths, and readouts, without installing a plugin.

Development first establishes the teaching concepts and time standards, then builds the calculation models, and finally designs the interaction and visual presentation. The interface must not obscure a model’s meaning through animation or present illustrative proportions as real proportions.

Development follows this order:

1. Define the observation tasks: motion within a day, comparisons across dates at the same time, latitude and season comparisons, lunar phases, shadows, sundials, the analemma, and planet–Moon comparisons.
2. For each task, specify the variables to change, variables to hold fixed, output results, and special cases.
3. Define the time controls and state boundaries for the Sun and Moon.
4. Establish consistent time conversion, sky coordinates, and scientific calculation methods.
5. Make different views consume the same results, avoiding contradictions caused by separate estimates in each diagram.
6. Establish three stable areas: the scene, frequently used time controls, and the parameter menu.
7. Add animations, themes, the welcome page, and separate explanatory pages.
8. Verify edge cases, touch interactions, page navigation, responsive layouts, and packaged outputs.

Existing features cover common teaching tasks for the Sun’s apparent motion and add demonstrations of the Moon, planets, and everyday devices. However, the complete source code and item-by-item acceptance criteria of the original ‘Little Yellow Duck’ program are unavailable, so this expansion cannot be equated with proven 100% equivalence to the original program.

## 2. Technical Approach and Runtime Limitations

The project is a static multipage website using HTML, CSS, vanilla JavaScript, Canvas 2D, and a locally distributed copy of Astronomy Engine 2.1.19. The separate 3D module uses local Three.js. Python is used for static previews and catalog-data generation; the production pages require no generation or build step.

There is no required backend service, database, login system, or live ephemeris API. Celestial positions are calculated directly in the browser. The 3D celestial sphere and devices mainly project three-dimensional coordinates onto Canvas 2D. The spherical Earth view prefers WebGL shaders and falls back to Canvas 2D when WebGL is unavailable. The separate space/ Solar System page uses local Three.js 0.186.1 without replacing the original workbench’s rendering pipeline.

design-system.css unifies colors, typography, borders and control hierarchy while preserving native forms and existing interactions. Light control areas support classroom reading and dark canvases support astronomical observation. Supporting actions use white surfaces and fine borders; playback and selected states retain an accent. No complete UI component framework is introduced.

Resources use relative paths suitable for Cloudflare Pages static hosting. Core scripts, styles, and textures are included in the delivery package and do not depend on externally loaded fonts. There is currently no Service Worker, so opening the site offline for the first time or installing it as an offline application cannot be promised.

## 3. Pages and Information Architecture

The mobile parameter menu is managed centrally by page-navigation.js, using a native dialog for focus containment and the backdrop. The same parameter nodes move between the mobile drawer and desktop sidebar; input controls are not duplicated. Only narrow screens at 760 pixels or below use the drawer. Wide screens retain a sidebar by default, which users can collapse. Hidden controls use inert to prevent keyboard focus from entering them, and the selection is retained for the current browser session. Shared interface-motion.js and CSS control the sliding selection background, sidebar layout transitions, and gestures on the separate handle, without changing astronomical calculations or fading out the canvas. Close, Esc, backdrop clicks, and swipes at the top all use the same closing procedure. Reduced-motion preferences skip the sliding animation. When the device rotates or switches to desktop width, the drawer is closed before the parameter nodes return to the sidebar, preserving their values and disclosure states.

| Page | Responsibility | Main Entry Point |
| --- | --- | --- |
| `index.html` | Welcome page, interactive star-field toy, entry to the workbench, and three explanatory links | Website homepage |
| `lab.html` | The main workbench for the Sun’s apparent motion and lunar phases / the Moon’s sky motion | Welcome page and global navigation |
| `diagrams.html` | Diagrams linked to the current Sun or Moon state | Global navigation and experiment menu |
| `sundial.html` | Interactive horizontal and equatorial sundial experiments | The Sun workbench’s ‘Related Diagrams’ menu |
| `analemma.html` | Analemma and figure-eight formation experiments | The Analemma link at the top of the Sun page and the linked-diagram menu |
| `guide.html` | Student workflows and observation tasks | Global navigation and welcome page |
| `project-guide.html` | Project introduction, geographical models, and limitations of the results | The explanatory links on the welcome page |
| `development-guide.html` | Complete development logic, project structure, and maintenance instructions | The development-documentation link in the project introduction |
| `space/index.html` | Standalone 3D Solar System, Sun–Earth–Moon relationships, reference guides, and immersive observation | 3D Sky in the top navigation, the spatial-model menu, or /space/ |
| `404.html` | Error page for an unknown address | The hosting server’s 404 response |
| `contact.html` | Contact the author, send feedback, and copy the email address | Welcome |
| `geography-review.html` | Compatibility redirects for old documentation addresses | Old links |

Global navigation provides Welcome, Lab, Learning Guide, Linked Diagrams, and 3D Sky. Sun pages also have a small Analemma link; the Lab and Linked Diagrams hide this Sun-specific link when switched to the Moon. The sundial is reached through the Sun lab’s linked-diagram menu. Each page organizes its parameter menu around its tasks; the menus are not required to contain identical items.

Sun diagrams include the subsolar point and day/night, the daily altitude curve, sunrise/sunset, and Earth’s axis and the horizon plane. Moon diagrams include phases and spatial relationships, daily illumination fraction, moonrise/moonset, and planetary encounters with the Moon. After switching bodies, a diagram that does not apply to the new body falls back to a valid default diagram.

## 4. Current File Responsibilities

| File | Primary responsibilities |
| --- | --- |
| `app.js` | Default state values, idealized Sun model, shared drawing utilities, main-interface readouts, event initialization, and the complete update entry point |
| `moon.js` | Ephemerides and time conversion, Sun and Moon positions, daily sampling, rise/set solving, lunar phases, and phase rendering |
| `coverage.js` | Dates throughout the year, the world day/night map, rise/set azimuth diagrams, and Earth’s axis and the horizon plane |
| `workspace.js` | Sun/Moon workspace state and a Moon overlay at the same instant |
| `menu.js` | Menu summaries, availability, and related events; retains some compatibility logic for older menus |
| `page-navigation.js` | Current multipage workspace layout, DOM reorganization, session restoration, page navigation, and diagram routing |
| `time-workbench.js` | Controls and shortcut events for commonly used times, dates, directions, playback, and looping |
| `motion.js` | The single primary animation scheduler, visual interpolation, camera easing, visible-canvas checks, and coordinated rendering |
| `solar-date.js` | Daily Sun observations at a fixed time, annual Sun/shadow-tip paths, and their synchronization |
| `shadow.js` | Vertical-rod shadows, shadow-tip paths, metric display scale, and clipping |
| `observer.js`、`observer-explanation.js` | Ground-observer view, Sun/Moon/five planets, changes in viewing direction, and the orientation of the Moon’s illuminated limb |
| `sundial.js` | Sundial models, readouts, dial-face views, and installation views |
| `sundial-device.js` | Projection of the 3D sundial apparatus, dragging to adjust time, and apparatus controls |
| `analemma.js` | Annual paths at a fixed observation time, three views, idealized causal models, and playback |
| `companion.js` | Moon–planet angular separation, visibility conditions, and searches over future dates |
| `welcome.js` | Interactive welcome-page starfield kept separate from scientific experiment state |
| `style.css` | Base styles and legacy layout styles |
| `pages.css` | Current multipage layout, Material surface hierarchy, responsive adaptation, and corrective overrides |
| `interface-motion.js`、`interface-motion.css` | Shared animations for segmented selection and revealing related options, elastic opening/closing of disclosures and drawers, manual menu collapse on large screens, edge handles, and reduced-motion support; separate from the scientific clock |
| `documents.css` | Consistent headings, contents, tables, and link typography for the three reading documents |
| `tests/`、`scripts/` | Repeatable 3D-model regression checks and tools for generating star and orbital data |
| `.github/workflows/deploy.yml`、`.github/workflows/github-pages.yml` | Separate deployment of the Cloudflare production site and the GitHub Pages mirror from the same source |
| `.github/scripts/prepare_site.py` | A static packaging script shared by both sites, including 404 links under the project subpath |
| `astronomy.js` | The local Astronomy Engine library |
| `earth.jpg`、`credits.txt` | Earth texture and resource-source notices |
| `controls.css` | Alignment of parameter rows, switches, and fields; evenly spaced diagram links; shared geometry styles independent of scientific state |
| `interaction-history.js、lab-history.js、space/history.js` | Browser undo/redo transactions and adapters for standard experiments and 3D views |

Existing scripts use a traditional global scope and ordered script loading, rather than ES Modules. Many features connect through DOM IDs and shared functions, so renaming items, removing nodes, or changing load order requires checking every reference.

The current main branch does not contain the old tools/ generator or REVIEW.md; those materials remain only in the historical archive. Root-level webpages are the currently maintained source and must not be overwritten with the old generator.

## 5. How Data, the Interface, and Drawing Relate

1. User action
2. Update the relevant experiment state
3. Validate inputs and convert time
4. Scientific calculation
5. Synchronize readouts and interface
6. Identify visible canvases
7. Coordinated rendering

Scientific playback, camera easing, and control animation operate at different levels: scientific playback advances the date or time; visual interpolation does not overwrite precise readouts; interface-motion.js changes only the presentation of menus and selection indicators, without modifying ephemeris state.

Scientific state determines precise readouts, while visual interpolation improves transitions. Interpolation does not overwrite the selected date, time, or location. The scientific parameters students read must not change arbitrarily with easing. Adjacent dates in daily Moon playback use a linear visual transition across the full step, avoiding a brief movement followed by a pause each day; whole-day readouts still correspond to the selected date, and restarting at the beginning of a month does not fabricate continuity from the end of the month. The lunar-phase orbit supports dragging with pointer capture. Astronomy.SearchMoonPhase finds the actual instant corresponding to the dragged angle, which is then converted to a local apparent solar date and minute to synchronize all readouts; this does more than move a Moon icon. Sunlight is shown with parallel arrows pointing in the same direction, and the glow has enough margin to remain fully visible.

## 6. Sun and Moon State Logic

`modeStates.sun` and `modeStates.moon` store their own state, while `state` points to the current body’s state. The two share coordinate and ephemeris utilities but have independent demonstration-update functions and parameters.

Shared fields include latitude, longitude, date, observation time, view, camera, and trajectory switches. The Sun uses declination, ideal/date mode, rod height, shadow display scale, daily mode, and analemma-related fields; the Moon uses daily/time playback, planetary encounters, planet selection, and related fields.

Switching to the Moon does not force the Sun’s daily-playback settings onto the Moon’s within-day playback settings. Switching back to the Sun must likewise not write the Moon’s location and time into the Sun state.

There is one deliberate exception: when the Moon is overlaid in the Sun interface, its position uses the current Sun experiment’s location, date, and time so that both can be compared at the same physical instant. This does not overwrite the independent Moon experiment’s state.

The standalone sundial and analemma pages use copies of the Sun state and write the relevant fields back to it when saving. The analemma’s daily observation time is stored by `analemmaClock` to avoid confusion with the main lab’s within-day time.

The session uses `sessionStorage` in `skyLabSession` for storage. It is not a server account or permanent synchronization. State is saved when following page links and leaving a page. Restoring a session does not automatically resume playback.

## 7. Time Standards and Date Handling

The main lab uses local apparent solar time: minute 720 is 12:00 and minute 1440 is 24:00. This is neither Beijing time nor the phone’s time-zone time.

The target solar hour angle is:

```
H = (t − 720) / 4，单位为度
```

`solarNoonUTC()`Use longitude and the Sun’s right ascension to find the UTC instant of local solar transit;`instantUTC()`then iterate on hour angle to convert the selected local apparent solar time into a physical UTC instant. The Sun, Moon, and planets must use the same conversion result.

Dates are constructed explicitly in UTC to prevent the host time zone from changing the date. The main interface permits dates from 1900 to 2100; this is only an interface range and does not imply that accuracy has been verified for every day in that range.

Within-day playback changes the time; daily playback at a fixed time changes the date while preserving the time. The Moon’s default teaching focus is comparing phases by date, but users can also switch to changes in sky position over one day.

When Sun daily mode reaches 24:00, it first advances the date and resets the time to zero, then refreshes declination. Year-end, leap years, month-end, and date limits are handled separately. Dates do not participate in the idealized Sun model; the interface must clearly disable date controls or explain this.

The analemma also offers a fixed civil-clock time: a specified UTC offset converts each day’s observation time. The current offset is fixed and does not automatically handle daylight-saving time.

## 8. Coordinates and Solar Calculations

Local sky directions use unit vectors:`x` points east,`y` points up, and `z` points north. Altitude is `asin(y)`and azimuth is converted from `atan2(x,z)`to 0°–360°: north is 0°, east 90°, south 180°, and west 270°.

The Sun has two calculation paths.

**Real-date observation:**Astronomy Engine, the location, and UTC provide topocentric equatorial coordinates, which are converted to horizon coordinates without refraction. Interface declination and Earth’s day/night map use the corresponding solar equatorial information.

**Idealized experiment:**Fix declination δ and use latitude φ and hour angle H to analyze the geometry of rotation, latitude, and seasons:

```
sin(高度角) = sinφ sinδ + cosφ cosδ cosH
```

The idealized experiment supports comparisons at declinations such as 0° and ±23.44°, but a fixed-declination result must not be presented as a complete real ephemeris for a particular date.

The subsolar point is determined from solar declination and Earth’s sidereal-time relationship. The day/night boundary uses the dot product of the surface normal and solar direction. The world map uses an equidistant latitude–longitude projection, which distorts area and shape.

Equinox and solstice buttons find the local date by searching for solar-ecliptic-longitude events in the current year. Button and comparison-line names follow Northern Hemisphere usage; seasons are reversed in the Southern Hemisphere.

## 9. Rise, Set, and Duration Calculations

For a real date, the day is initially sampled every five minutes. Candidate intervals are then refined to find maxima/minima and crossings of altitude 0°.

Sunrise, sunset, moonrise, and moonset consistently use the body’s geometric center crossing an ideal horizon. Remaining above the horizon all day, remaining below it all day, the absence of a particular rise/set event, tangency in the idealized model, and limiting conditions at the poles each require an appropriate message; ordinary rise/set times must not be fabricated.

Actual duration is measured from UTC differences for these intervals, rather than treating differences on the apparent-solar-time scale as exact elapsed time.

The expandable explanation beside the duration label states that atmospheric refraction, the body’s apparent radius, and terrain obstruction are omitted; lunar horizontal parallax is included in sky position. Actual observation times will differ, and a universal five-minute advance/delay cannot correct every location and date.

Azimuth at the poles and near the zenith should be flagged as non-unique or unsuitable for interpretation, rather than returning a seemingly precise number as the sole answer.

## 10. Lunar Phase and Lunar Disk Orientation

Moon position and lunar phase are calculated separately: sky position is topocentric, while illumination fraction uses an approximate geocentric apparent lunar phase. Phase names derive from phase angle and intervals near the principal phases; ‘near’ does not identify the exact phase event.

The phase diagram shows the illuminated fraction of the disk seen from Earth, not the illuminated fraction of the Moon’s entire surface. Lunar phases are not caused by Earth’s shadow.

There are currently two ways of displaying the lunar disk:

- The lunar-phase principle diagram and ordinary spatial-trajectory view use a fixed orientation and are explicitly labeled as schematic.
- The Sky view rotates the illuminated limb according to local sky geometry, rather than simply flipping left and right in the Southern Hemisphere.

The latter method takes the Moon-direction unit vector m and Sun direction s, then calculates the tangential component pointing toward the Sun:

```
tangent = s − (s · m)m
```

This tangential direction is passed through the current sky projection to obtain its on-screen angle and rotate the phase diagram. Location, time, and viewing direction all affect the result through vectors and projection. The disk remains an enlarged illustration. Its surface uses a cached original appearance texture rather than a registered measured lunar map; libration and eclipse occultation are not simulated, and the illuminated-limb orientation is difficult to identify near new or full Moon.

## 11. Path Continuity and View Projections

Sun and Moon paths ultimately use the same directional coordinate system, with samples calculated separately. Spatial, top-down, azimuth–altitude, and Sky views display them through different projections.

Rendering inserts boundary vertices at the actual geometric horizon, uses solid lines above it, and dashed lines below. An azimuth plot splits segments at the northward 0°/360° wrap, ending and restarting correctly at the two edges rather than drawing across the entire chart.

The Moon’s daily path covers 00:00–24:00. Since the Moon moves along its orbit during the day, its beginning and ending positions usually differ. The ends are therefore not forcibly joined, and endpoints are labeled wherever they can be displayed. This real opening must not be ‘repaired’ as a rendering break.

A Sun/Moon overlay shares time, location, and projection. Unit celestial-sphere paths and metric ground-shadow lengths use different, explicitly labeled scales and must not be treated as the same physical distance.

## 12. Shadows, Shadow-Tip Paths, and Annual Observations

For a vertical rod of height h on level ground, with solar direction`(sx, sy, sz)`:

```
影尖 x = −h × sx / sy
影尖 z = −h × sz / sy
影长 = sqrt(x² + z²) = h / tan(太阳高度角)
```

A finite direct-sunlight shadow exists only when the Sun is above the horizon. Shadow length is zero at the zenith, tends toward infinity near the horizon, and is not drawn below the horizon.

Shadow display scale changes only the displayed ground extent, not the scientific shadow length. The current factors 1, 2, 4, 8, and 16 correspond to ground-circle radii of `6.25 / 倍率`meters. An arrow indicates a current shadow tip outside the range. Shadow-path segments are genuinely clipped to the circle; forcing every out-of-bounds point onto its circumference would fabricate a path.

The daily shadow-tip path samples one day and records the same rod’s shadow tip at different times. Daily mode at a fixed time records the Sun position and shadow tip on different dates at the same local apparent solar time. These represent ‘one day’ and ‘one year’ respectively and must not be confused in the interface.

## 13. Two Interactive Sundial Types

Unlike the vertical rod above, a sundial’s gnomon is parallel to Earth’s axis.

A horizontal sundial has a level dial face. Its gnomon points toward the celestial pole of the local hemisphere, with elevation equal to the absolute latitude. Its hour lines are generally not equally spaced. At the equator, the classic horizontal sundial degenerates and requires an explanation that it cannot give a usable time reading.

An equatorial sundial’s dial face is parallel to the equatorial plane and its gnomon is perpendicular to the face. Adjacent hourly lines differ by 15°. Changing solar declination switches the illuminated face, and the graduations on the two faces must be mirrored. Rays parallel or nearly parallel to the face impose special limits on time readings and the shadow tip.

The model intersects sunlight with the dial plane to calculate the actual shadow; the 3D apparatus and dial-installation views use the same model. Users can adjust gnomon length, click graduations or drag the shadow to adjust time, and play through a day.

The current type’s ‘Time on the dial’ readout appears at the top of the parameter area. Switching type also switches the readout, canvas, and explanation. Nighttime, a degenerate horizontal dial, and rays parallel to an equatorial dial each display their corresponding state instead of continuing to output an apparently observable time.

A sundial reads local apparent solar time; the comparison clock uses a fixed UTC offset. Longitude and the equation of time cause the two readings to differ.

## 14. The Analemma and the Causes of Its Figure Eight

An analemma is a collection of Sun positions at the same location on different dates under the same definition of observation time. Determine the time basis first, then generate samples for the year; a single day’s path cannot simply be reused.

A fixed civil-clock time usually produces the classic figure eight: axial tilt changes declination over the year, while tilt and orbital eccentricity together affect the equation of time and hour angle. At a fixed local apparent solar time, solar hour angle is essentially fixed, so the same classic figure eight does not form.

The project offers a 3D celestial-sphere orthographic projection, an azimuth–altitude plot, and an hour-angle–declination principle diagram, with comparisons at 09:00, 12:00, and 15:00. Changing time preserves the camera; automatic camera changes must not conceal shifts in the trajectory. Automatic scaling in the hour-angle–declination diagram still needs an explanatory hint; not every view can be expected to look like a camera photograph of the sky.

The advanced idealized model allows axial tilt and orbital eccentricity to be changed separately. Orbital positions are constructed by solving Kepler’s equation, and changing one parameter at a time supports causal analysis. This does not replace the ephemerides of other real bodies.

The dome view captures touch gestures in both directions within the canvas, while the parameter area scrolls independently. Dragging changes the camera; clicking a path or the date slider changes the observation date; changing civil-clock time changes only the analemma’s own observation time.

## 15. Planet–Moon Comparisons and Looking Up

Moon–planet encounters support Mercury, Venus, Mars, Jupiter, and Saturn. The Moon and planet are calculated at the same physical instant, with spherical angular separation given by:

```
角距 = acos(clamp(月球单位方向 · 行星单位方向, −1, 1))
```

Future search checks up to the next 30 days at the same observation time each day, then chooses the day with the smallest angular separation. It is neither a continuous full-day optimization nor an exact conjunction time.

The interface also reports altitude and horizon conditions. Daylight, twilight, lunar phase, weather, and terrain all affect actual visibility; a small angular separation must not be labeled as guaranteeing naked-eye visibility.

The Sky view uses an orthographic projection of the observer’s forward hemisphere, with the ground plane below. Only bodies above the horizon and in front of the observer are drawn in the sky; bodies behind the observer or below the horizon are explained in the list. Turning changes the viewing direction, while the time slider changes celestial positions; both controls must be directly operable.

The ground azimuth disk in observer.js rotates the local east and north basis vectors by observerAz, then compresses them into a horizontal-plane ellipse. It is only a ground-direction guide and does not participate in sky unit vectors, horizon altitude, or rise/set solving. The blue standing-position dot is fixed, and the forward arrow always points toward the top of the screen; direction labels and the grid move with camera orientation. A reference-azimuth convention is used at the poles. observer-explanation.js provides a Trajectory explanation dialog only in the lab’s Sky view. It listens to selected-view state and plot type to control entry visibility. The explanation distinguishes the forward-hemisphere boundary, the day’s 00:00–24:00 endpoints, and crossings of altitude 0°, without changing path sampling, clipping, ephemerides, or projection. The dialog opens/closes elastically, supports Escape and backdrop dismissal, scrolls internally on narrow screens, and respects reduced-motion preferences.

## 16. Implementation and Verification of the 3D Solar System Module

`space/index.html` is the standalone entry point;`space/model.js` handles model results only;`space/scene.js` handles the Three.js scene and interaction;`space/ui.js` manages the sliding parameter menu; and `space/space.css` scopes the page styles. The third-party library is pinned to version 0.186.1, with its MIT license retained locally. The root Astronomy Engine library and Earth texture are reused to avoid duplicate library and image downloads.

The model takes HelioVector, GeoMoon, and Illumination, transforms them into the fixed J2000 ecliptic frame using Rotation_EQJ_ECL, and maps (x,z,-y) into Three.js right-handed coordinates. Physical vectors remain in AU. Overview display distances use a compressed 6.8×r^0.45 scale, with sphere radii chosen independently; the Sun–Earth–Moon view uses a separate distance scale. Orbits sample one mean period without forcibly joining sampled endpoints. During standalone playback, historical paths are rebuilt at most 10 times per second, while their bright current ends still update every frame from real ephemeris positions. Pausing or manual adjustment restores precise complete sampling. The initial camera is fitted directly; tiny residual convergence errors snap exactly into place and rendering stops, avoiding continued work when the scene looks stationary. The Sun direction in the Earth–Moon view comes from Earth’s actual heliocentric vector; DirectionalLight and parallel lines share this direction. Eclipse occultation is not added. earth-frame.js uses GAST and the EQD→EQJ→J2000 ecliptic transformations to construct Earth’s right-handed basis: Greenwich is local +X, the north pole +Y, and 90° west longitude +Z. It sets Earth’s quaternion. The red axis and blue equator are attached to Earth. Earth/Moon and the other objects are rendered in two passes with a shared depth buffer, isolating their parallel and point lights. Ray picking includes both layers.

This page reads only a valid date from skyLabSession as its initial calendar value and does not write back to Sun or Moon state. Its independent date range is 1900–2100. Calendar selections resolve to 12:00 UTC, while the date axis retains fractional days and the readout shows the actual UTC time. Leap years update the date-axis maximum. Playback speed is expressed in days per second; non-looping playback stops at the end of the current year’s axis. Camera operations do not change scientific time.

Rendering uses on-demand requestAnimationFrame. Scientific snapshots are reused while the date is unchanged, and orbits are cached by year. Camera targets and distance are eased, or updated directly under reduced-motion preferences. Frame requests stop when the scene is stationary and no resource callback is pending. Pointer Events and pointer capture support live rotation before release, pinch zoom, and click selection; the touch canvas captures only its own gestures. Moving the page into the background pauses subsequent frames, and resuming resets frame timing. WebGL context loss stops playback; when WebGL is unavailable, navigation and a return link remain available.

Desktop parameters scroll independently. At widths of 760 pixels or less, and in immersive mode, a native dialog receives the same aside node as a sliding drawer, avoiding duplicate controls with unsynchronized events. It supports a close button, Escape, outside clicks, and a left swipe on the heading. Leaving the narrow-screen or immersive layout returns the original node. Normal wide-screen mode retains only the collapse handle at the top of the sidebar and uses an edge arrow to reopen it, without a duplicate heading button; phones and immersive mode retain the heading’s Parameters button. Visibility preference is preserved during the current session. The graphic and UTC date controls occupy separate layout areas; short landscape screens condense supporting text but retain the calendar. The top-navigation 3D Sky link points directly to space/, and the standalone 3D page marks it with aria-current. page-navigation.js also provides an entry under Spatial model in the Lab and Linked Diagrams.

Run reproducible model checks with `node tests/space-model.cjs`: checks cover right-handed coordinates, vector lengths and directions, 40 planet samples, five lunar-illumination samples, finite orbits, and invalid dates. This is an internal consistency regression using the same library, not independent ephemeris-accuracy certification. Browser checks use Chromium WebGL software rendering and cover 1440×900, 390×844, and 844×390 layouts, rotation and pinch zoom with real touch events, the sliding menu, leap years, non-looping stopping, actual UTC readouts, and the return link when WebGL is unavailable. Real Safari and low-end GPU performance still need device testing.

### Appearance and scientific data are separate

`space/appearance.js` Materials, sphere geometry, and Saturn’s rings are created by planet type. Original 1024×512 textures, fine-detail texture fields, and crater fields are generated and cached during initialization; spheres use 72×48 segments, and map colors are processed as sRGB. Mercury and Mars surface noise is sampled in spherical Cartesian coordinates to avoid gas-planet-like latitudinal bands. Lunar maria use locally smoothed regions to reduce periodic noise stripes. The 2D phase illustration uses an original gray maria/crater schematic generated and cached once; its texture is clipped only to the existing illuminated path without changing illuminated area or orientation. Neither set of lunar details is a registered real lunar map. Earth continues to load the root earth.jpg. Appearance materials do not change model.js vectors, sphere radii, the solar-light vector, or geocentric illumination fraction. Earth’s rotation axis is calculated separately by earth-frame.js; other bodies’ textures and ring tilts do not constitute real spin-axis, terrain, or weather models.

### 3D observation tools and historical sampling

`space/exploration.js` uses the existing Astronomy Engine and SolarSpaceModel. trail samples from the current UTC minus the lookback period through the current instant; its final point directly uses current UTC. Planets use HelioVector with the original heliocentric compression, and the Moon uses GeoMoon with the original Earth–Moon enlargement factor, without fabricating closed lines. actualDistance reads physical vectors from snapshot, returning heliocentric AU for planets and geocentric km for the Moon. Instantaneous values do not overwrite average reference values.

scene.js creates just one historical line with a color gradient for the current body: its dark end is the past, and its bright end the present. It recalculates only when enabled and UTC, body, span, or sample count changes; camera operations reuse the geometry. Replacing a line disposes of the old BufferGeometry. Planet playback uses at least 48 segments, and a paused view at least 96. Spans covering multiple periods increase sampling up to 512 segments. The Moon is limited to 7/30/90-day spans, with more samples for longer spans to avoid sparse angular lines. Complete orbits and historical paths have independent switches. All frames remain under the original on-demand RAF scheduler.

Moon close-up uses a separate inspectingMoon flag while retaining the earthmoon scientific view. The camera target follows the current Moon.position. Movement of the same body is compensated immediately in physical position; easing occurs only when entering a new close-up, preventing tracking lag from pushing a playing Moon out of frame. Parallel sunlight, geocentric illumination, and UTC do not change with the camera. Close-up cards show average Earth distance, sidereal period, and actual current Earth distance separately. Returning to a planet restores heliocentric units and the original parameters. An embedded reset returns to the overall view selected by the parent page, while UTC synchronization within the same mode preserves the user’s close-up. Camera presets change only azimuth, elevation, and a suitable framing distance; the top-down view retains a tiny offset to stabilize the camera’s up vector.

exploration.css confines readouts and the scrollable Observation menu to the 3D canvas, using the same 14px corner radius for both. Container dimensions constrain small-view text and menu width. Extremely short canvases hide the readout but retain the scrollable Observation menu; navigation, original-diagram time controls, and the mobile parameter drawer remain separate. Outside clicks and Escape dismiss the menu without taking over date gestures. Names move outside sphere edges to keep close-up buttons from obscuring textures. The fixed J2000 ecliptic grid is a spatial reference and is not used for local-horizon calculations.

Earth’s thin limb in appearance.js uses a low-detail outer shell whose lit side is controlled by the existing solar light, excluding ambient light. It does not participate in raycast or scientific data. It adds one draw call and 2,976 triangles, with no new animation loop or per-frame texture generation. It is not a measured atmospheric-scattering model. Run regression checks with `node tests/space-exploration.cjs` to check 24 planet and three lunar path-endpoint cases, units, year boundaries and leap days, sampling consistency, and defensive parameter handling. Browser checks cover historical caching, close-up readouts, camera operations not changing UTC, reset of embedded original diagrams, and the mobile menu. Performance observations are limited to the current environment and cannot replace acceptance testing on real devices.

### Star catalog and static point rendering

`scripts/build-star-catalog.py` Extracts 61,816 stars with apparent magnitude ≤8.5 from HYG 4.1, excluding the Sun and retaining J2000 right ascension/declination, apparent magnitude, and B−V. Exports `space/assets/stars.json` is a 2,009,993-byte local data file with no third-party requests at runtime. The subset is distributed under CC BY-SA 4.0; see the source, modifications, and license in `space/assets/stars-license.txt`。

`space/stars.js` Catalog directions are converted to the model’s fixed J2000 coordinates. A single Points object draws the stars, with the catalog sorted by magnitude. Normal mode submits only the 8,920 stars of magnitude 6.5 or brighter; immersive mode expands this to 61,816 stars of magnitude 8.5 or brighter, without increasing draw calls. Initialization yields the main thread every 2,048 stars so dense catalog processing does not block the first menu click. Immersive mode uses higher exposure while preserving brightness differences among faint stars; what is displayed does not represent naked-eye visibility. B−V approximates blackbody color, and a compressed magnitude mapping controls display brightness. The shader uses smooth circular star cores and a small amount of glow to eliminate square edges. The background follows camera translation, while its directions do not rotate with the camera, preventing nearby-looking star parallax during zooming or focusing. DPR remains capped at 2; depth testing is enabled and depth writing disabled. No twinkling RAF loop or per-frame ephemeris computation is added. If catalog loading fails, only the background is omitted; the scientific model and time controls continue to work. Stellar proper motion, annual parallax, refraction, and obstruction by the local horizon are outside this background model.

### Display layer for satellites, small bodies, and observational imagery

`scripts/build-population-data.py` Python’s standard library downloads the JPL mean satellite orbital elements tables and SBDB query results to generate local `space/assets/population.json`. The snapshot covers 455 usable satellite orbits around the eight planets. Mercury and Venus have none; Pluto is outside the existing eight-planet page. The selection filters main-belt asteroids by H < 12 and takes 1,200 in ascending H order, plus 12 periodic comets with e < 1. Satellite discovery lists and mean-element tables are updated separately, so the rendered count must not be presented as the current IAU total.

`space/population.js` Orbital bases are precomputed and transformed from JPL’s ecliptic, Laplace-plane, or planetary-equator reference frames into the existing fixed J2000 coordinates. The elliptical Kepler equation is solved, and mean anomaly is advanced using TT corresponding to UTC, preserving retrograde inclinations. Fixed mean elements do not include perturbations, resonances, or nodal/periapsis precession; errors increase farther from the source epoch. The Moon and the four Galilean satellites use the existing GeoMoon and JupiterMoons vectors, respectively. Satellite display distances use a more compact logarithmic mapping that preserves directions and distance order; Saturn’s satellites are arranged outward from the visible rings to avoid being embedded in the ring plane. The Moon, its orbit, and its historical path share the same teaching scale. Display distances are not physical proportions; actual distance readouts retain the original ephemeris values. Point diameters in world coordinates are set relative to the host planet’s displayed radius and change with perspective zoom; they do not represent physical radii. No names are added, and the original model is unchanged. Satellites, asteroids, and comets each use one Points object, reusing BufferAttribute data. No recalculation occurs when UTC and the view are unchanged.

`space/nebulae.js` Three local original NASA images and their complete source metadata are loaded lazily. Enlarged background images appear in the objects’ approximate J2000 directions and are explicitly identified as not representing a real field of view. Only GPU feathering and low-brightness overlays are applied; no fabricated observational material is generated. The original-image viewer uses the same unmodified JPEG and identifies multiband/processed coloring, authors, and NASA sources. Nebulae do not participate in the Sun–Moon illumination or geographical models. The added catalogs and images load only on entering immersive mode; embedded comparisons and normal pages retain the original scientific workflow. Image and parameter dialogs take priority when Esc is pressed. Leaving the immersive layout closes any open dialog and returns to visible controls.

`node tests/space-population.cjs` Validation checks every catalog orbit for finite elliptical elements, epochs, closure after one period, high-eccentricity solving, Triton’s retrograde orbit, and Jupiter-satellite state units. Browser checks cover the absence of added names across the full catalog, individual planet groups, unchanged original UTC, authentic imagery, mobile layouts, and the absence of added data requests in normal mode.

### Immersive layout and fullscreen fallback

space/immersive.js only changes the viewport-filling page layout. It does not call the Fullscreen API or create another renderer, RAF loop or scientific state. space/immersive.css preserves the canvas, the single UTC timeline and the exit control; ?immersive=1 opens this layout directly. Parameters reuse the existing dialog and input nodes. Escape closes an open parameter menu first, then exits immersive view. Exiting leaves dates, camera and playback unchanged. Embedded 3D comparison pages disable this layout.

Earlier layout regression covered 1440×900, 390×844, 320×568, 844×390, and 844×270, checking date/play/exit controls, restoration of the side drawer, the then-current fullscreen-refusal fallback, unchanged UTC, and embedded isolation. This mode does not change astronomical formulas.

### Synchronization bridge between the original diagrams and 3D

`space/lab-compare.js` Runs only on the related-diagrams page, preserving the original uiWorkspace.plot and canvas nodes and adding a “3D comparison” layout switch. The space/?embed=1 iframe is created only when enabled; disabling removes its browsing context. embed.css hides the 3D page’s own navigation, menu, and timeline, leaving the original diagram’s single time workbench. Wide screens use two columns, sufficiently tall portrait phones stack the views vertically, and short screens use two columns. Very short landscape screens place the calendar and sliders in one row to retain graphic height. Both views and the timeline occupy their own layout regions.

At the end of the original app.js render, the optional SolarSpaceLabCompare.sync is called. The parent page converts the original local apparent solar time to actual UTC with instantUTC(state.time,state.date,state.lon), then sends the date and Solar System/Sun–Earth–Moon mode, deduplicating identical messages. Both sides validate the message sender and same-origin address, and synchronize after the child page is ready. A loading notice appears before the first synchronized render to avoid briefly showing another date. SolarSpaceView.sync pauses child-page playback and applies UTC directly. The overall view resets only on first synchronization or a body-mode change; subsequent date changes preserve the user’s camera. The 3D view cannot write back to the original experiment state. Adjacent UTC dates resulting from conversions at the 1900/2100 date boundaries still preserve the actual instant.

Comparison is allowed only for observations using real dates. Ideal solar conditions and four-diagram comparison close the embedded view and explain why. Browser validation at 1440×900, 390×844, 320×568, and 844×390 checks the original canvas identity, a single timeline, leap-day UTC synchronization, matching lunar illumination fractions, camera isolation, and disabling conditions. The embed retains the standalone 3D model’s display-scale limitations, with Earth’s orientation set by the shared UTC. Enabling comparison turns off day-to-day transitions of scientific positions in the original diagram, preventing different instantaneous conditions between views. The 3D view does not replace the original diagram’s geographical readouts.

### Auxiliary references in the standalone 3D page

`space/compare.js` Consumes the same physical snapshot, orbital sample arrays, and enlarged Earth–Moon path, projecting scene (x,z) coordinates into a fixed overhead view from ecliptic north.`space/observer.js` Calls Observer, Equator(true,true), and Horizon with the same UTC and an independent location, without supplying refraction, matching moon.js’s geometric horizon-position convention. Only the Sun, Moon, and selected non-Earth planet are calculated. Lunar illumination is taken directly from snapshot.moonIllumination. Camera changes reuse the local-coordinate cache; only date or location changes trigger recalculation. Below-horizon readouts remain available, with separate notices for azimuth boundaries at the poles or zenith.

On the standalone 3D page, scene.js centrally schedules the 3D, overhead, and sky views. Auxiliary references create no iframe or independent playback loop. The 2D view is drawn only when “Reference” is selected. “Overhead space view” and “Local sky” select reference types separately from the “Solar System/Sun–Earth–Moon” object selection. compare.css uses two columns on wide screens, vertical stacking on sufficiently tall portrait phones, and two columns on short screens to retain view height. The date bar occupies its own region, and the 3D camera adapts framing to the changed aspect ratio. Both views use the same dark background. Small views omit names that do not fit while retaining key readouts and the overall scale explanation.

The added regression runs `node tests/space-observer.cjs`, covering 805 altitude and azimuth values, below-horizon readouts, 35 lunar illumination cases, 1900/2100 boundaries, both poles, leap days, and invalid input. It checks consistency between interface conventions and is not an independent certification of ephemeris accuracy. Further browser checks cover both views and the date bar fitting on screen at various sizes, mode switching, synchronized scientific state, camera changes not altering local readouts, stopping drawing, and preservation of the original page state. Hardware performance and actual Safari performance still require real-device verification. Visual asset information is in space/assets/credits.txt.

## 17. Complete Updates and Animation Scheduling

User actions generally follow this sequence: stop relevant playback, update fields, call `schedule()`。`schedule()`to set update flags, and request the main `requestAnimationFrame` scheduler. Several adjacent operations may be combined into the next frame.

The current sequence of a complete `render()`is:

```
准备太阳跨日与联动状态
→ 同步视觉过渡目标
→ 更新工作区布局
→ 太阳或月球读数与控件
→ 菜单、日影、叠加、伴月、观察者、逐日、日行迹、日晷
→ 时间工作台
→ 最终页面可见性
→ drawMotionCanvases()
```

UI functions in a full update no longer start a second drawing pass. The final drawing entry point renders the sky, charts, Earth, lunar phases, rise/set azimuths, analemma, and sundial according to the selected body and visibility.

During normal continuous playback, most animation frames can update only the graphics, with the necessary full UI updated at intervals of about 100 milliseconds. Advancing by days or receiving new user input triggers a full update. Camera and adjacent-date positions use easing, with exact scientific state kept separate from transitional graphics.

`IntersectionObserver` tracks canvas visibility, while `ResizeObserver` tracks container dimensions. Hidden canvases do not perform pointless actual drawing. The experiment canvases’ pixel ratio is capped at 2, as is the welcome page’s, limiting the load on high-resolution devices.

The spherical Earth preferentially uses a WebGL shader to draw an orthographically projected globe. The original 2048×1024 texture is uploaded only once; the rendered size follows display dimensions with a pixel ratio capped at 2 and a maximum of 2048 pixels per side, avoiding enlargement of a fixed 160×160 raster. Direction transforms, texture sampling, and day/night shading run on the GPU, retaining the mathematical direction conventions. The globe uses Pointer Events and pointer capture for mouse and touch dragging. The default “Rotate view only” mode updates independent globeCameraLat/globeCameraLon values while preserving observing latitude/longitude, date, local apparent solar time, and corresponding UTC, so the subsolar point’s geographical coordinates remain unchanged. The on-screen Sun marker and day/night outline change with camera projection. “Link observing location” updates observing coordinates while holding local apparent solar time fixed; corresponding UTC and subsolar longitude change with observing longitude. Both modes queue the next drawing frame during movement, and releasing does not also repeat a click-to-select operation. The observing marker is projected from the actual observing location and is not drawn on the far side; “Center on observing location” resets the camera. A single click still selects a location using inverse globe projection, and touch cancellation clears drag state. Linear filtering and mipmaps reduce shimmer when shrinking the texture, and identical parameters reuse the rendered result. If WebGL is unavailable or the context is lost, a 320×320 CPU fallback raster is used; its buffer is allocated only when needed. GPU resources are rebuilt after context restoration. The globe relationship diagram no longer computes undisplayed all-day rise/set data; opening the rise/set diagram or quick times computes it for the current state. Hardware and browser implementations still affect smoothness. This revision was checked using Chromium and software WebGL; real-device Safari performance validation has not been completed.

The global map’s day/night boundary uses a vector contour obtained from the geometric condition `illuminationAt(lat, lon) = 0`, antialiased by Canvas according to pixel density rather than enlarging a 360×180 binary light/dark mask. A low-resolution mask is used only for the continuous daylight brightness gradient. The night hemisphere is overlaid with an independent vector fill, preserving the original shading. Zero declination uses longitude segments for vertical boundaries; other declinations use latitude boundaries, including longitude seams and critical-meridian vertices. Antialiasing does not represent atmospheric refraction or twilight shading.

When the page enters the background, animation-frame requests pause. On returning, frame time resets so background time is not treated as an enormous playback step. Reduced-motion preferences are respected by reducing or removing nonessential transitions.

## 18. Routing, Links, and Browser History

Normal pages use real HTML links. The related-diagrams page additionally identifies the current diagram with a hash, for example:

```
diagrams.html#riseSetPanel
diagrams.html#chartPanel
```

The hash is read on initial load. When a same-page menu item is clicked,`hashchange` synchronizes the address with the selected diagram; when a top tab is clicked,`pushState` creates a history entry and updates the selection; back/forward navigation uses `popstate` to restore the view.

After changing the current body, the allowed diagrams for that body are validated again. Moon-related diagrams enable their corresponding content in Moon mode. Links, tabs, visible canvases, and details must remain consistent within a single full update.

Acceptance checks must go beyond an address change: verify that the correct canvas is visible, the correct tab is selected, time and date remain adjustable, and browser back/forward and refresh work.

`interaction-history.js` Centrally organizes intentional user switches, selections, and parameter adjustments;`lab-history.js` reads and writes the existing state of normal experiments, while `space/history.js` connects the internal adapter on the 3D page. Snapshots are stored in history.state.skyMotionInteraction and include version, page path, scientific state, and form values. The current history entry is frozen before a click, and pushState is called after the operation. Slider adjustments enter history when finished; rapid consecutive typing is grouped into one entry. The first input creates an entry immediately, and subsequent input in the same field within 650 milliseconds updates it with replaceState, preventing a just-entered change from being missed on immediate back navigation. Menu expansion, collapse, scrolling, and camera dragging create no history entries. Canvas gestures exceeding 8 px that change time, date, or observing location still count as parameter adjustments; gestures changing only the view update the current entry. Light taps on the canvas may still record a selection. Restoration first ends any unfinished finite control animation, then writes state and calls the existing renderer, pausing playback. Restoration creates no new entries. Diagram tabs give their hash to the same history transaction, preventing a single switch from creating two entries. Cross-page navigation continues using native links. Returning to or refreshing a page with a snapshot restores that entry rather than adding a false back step. Branching after browser back/forward follows native behavior. Embedded 3D frames create no independent history; body and camera-preset selections are delegated to the parent page, which also owns the comparison switch and scientific clock. Per-frame playback, menus, and camera dragging are not recorded. After 3D restoration, object titles and active tabs synchronize so the interface does not show an old view while the graphic is correct.

## 19. Layout and Interaction Principles Across Devices

Layout is determined by actual available width: above 760 pixels, the left parameter rail is shown by default; at 760 pixels or below, a native dialog drawer is used. Touch capability alone does not hide the rail. The graphic and timeline occupy separate grid areas, with internal scrolling in the parameter region so floating controls do not cover the canvas. Standalone 3D follows the same partitioning; immersive layout uses a drawer.

page-navigation.js and space/ui.js move the same parameter nodes without duplicating controls or listeners. Remounting occurs only when the desktop, narrow-screen, or immersive container changes; leaving the drawer returns the original nodes. The overlay, close action, Esc, and a leftward swipe on the heading use the same closing procedure. Hidden regions use inert to restrict focus, and the reopening control remains visible.

On wide screens, the collapse control for normal experiments and the 3D page sits at the top of the rail. Phones and immersive mode use the heading’s “Parameters” button. Dialogs support keyboard and outside-click dismissal. The trajectory explanation omits a close cross while retaining Esc and overlay dismissal. Short screens compress supplementary text while preserving essential date, time, and exit controls.

CSS controls display geometry and colors; JavaScript controls scientific state, availability, and events. Changing menu hierarchy should move original nodes while preserving IDs, label/input associations, disabled and hidden states, and existing listeners. Duplicating HTML must not create a second set of state.

## 20. Shared Controls and First-Opening Animations

This production release uses Impeccable to unify the UI: design-system.css loads after the original page styles, sharing light control areas, deep teal-blue selected states, 12 px control corners, and 16 px surface corners. Local regular and bold SkyMotion Reading fonts are used consistently for headings, body text, parameters, buttons, numbers, and graphic annotations; the welcome page’s footer retains its original handwritten font. Fonts are subsetted to page text and published locally under SIL OFL 1.1. Shared control and animation styles use the same color variables; immersive mode separately maps dark surfaces and text. Playback and selected items retain the deep teal-blue accent. Date-direction, reset, body-jump, menu, and auxiliary 3D actions use white backgrounds, teal-blue text, and fine borders; hover adds only a light background, while tools on dark canvases remain neutral dark. Narrow workbenches arrange time, date, and bearing into compact complete rows according to their own width, while landscape screens retain the original compact layout. Sky-view annotations adjust text contrast for light and dark backgrounds and avoid lunar endpoint markers without changing body positions. Ideal-experiment notices, declination readouts, and restore actions share theme colors. The playback loop switch matches other parameter switches in size and is right-aligned; immersive tools use unified dark surfaces. This release preserves astronomical calculations, ephemeris data and scientific state. Rise/set readout cards and document actions share white surfaces and fine borders instead of yellow or blue blocks.

### Bilingual Presentation and Local Fonts

Font requests have an eight-second deadline. Normal loading waits for the selected fonts before displaying the page. A failure or timeout releases the hidden page and offers Retry fonts, using fallback fonts temporarily so the application remains accessible. Explicit language parameters persist through site navigation. Calendar month and year changes update the draft date and handle month ends and leap years; rerenders retain keyboard focus. Only confirmation updates the experiment and browser history.

language.js manages the shared language state and stores the preference in localStorage under skymotion-language. Switching updates presentation only, preserving scientific state, input values and astronomical calculations. Translation dictionaries cover DOM text and attributes such as aria-label and title. Canvas measureText, fillText and strokeText use the same translations and English font so measurement and drawing agree; code examples retain their original text. Complete translated documents are exported as .en.md files, and download links select the file for the current language.

Chinese uses locally hosted SkyMotion Reading; English uses locally hosted SkyMotion Charter. The initial page preloads regular and bold faces for the current language. Charter italic and bold italic files are also distributed, although current styles may use browser-synthesized italics. Charter use and redistribution follow the original Bitstream notice in fonts/LICENSE-Charter.txt; Reading retains its OFL notice. Language switching, fonts and document downloads are included on both production sites.

Static English entries are generated by scripts/prerender-pages.py from source HTML and translation dictionaries, producing twelve English siblings while preserving IDs, numerical and form values and scientific scripts. The 24 Chinese/English HTML pages total about 1.5 MB, depending on content; styles, scripts, fonts and images are shared. language-data.js supplies dynamic translations, and data-i18n-cn metadata restores Chinese in place while preserving experiment state. page-boot.js selects the static language entry and immediately loads the regular and bold fonts for that language; the page can display once those fonts are ready, without waiting for experiment initialization. After first-screen fonts and the current page finish loading, page-cache.js warms all HTML, scripts, styles, fonts, images, data and document downloads through two concurrent requests using the normal HTTP cache. No hidden experiments, WebGL scenes or service worker are started, and hosting access checks remain intact. These changes are included in production. Warming requires network access and time; the first visit does not guarantee that all resources are cached, and offline availability is not guaranteed.

### Unified parameter rows and menu order

controls.css loads after existing page styles and is scoped to normal parameter areas, the 3D rail, and the observation overlay. Switch rows use a minmax(0,1fr) text column and a 44-pixel control column. input and span have explicit row and column placement, supporting both original HTML orders with the input before or after the text. Switches are 44×26 pixels, circular thumbs 18 pixels, and rows at least 44 pixels tall. Native label-click, Tab, and Space behavior is retained, with role="switch" expressing binary settings.

Long text wraps without shrinking the control. Light parameter areas and dark overlays specify separate text colors. Related-diagram lists share an 8-pixel gap; the sundial’s outer margin is removed, and normal links and disclosure controls are at least 44 pixels tall. page-navigation.js places peer switches and links first, followed by available nested disclosure settings. Irrelevant controls remain hidden on the diagrams page. Numeric rows have separate text and value columns; observation-overlay selectors resize within their own columns.

### One controller per disclosure animation

interface-motion.js adds motion-disclosure to managed details elements. Control geometry styles do not handle disclosure animation. interface-motion.css disables the native ::details-content height transition on these nodes, leaving the outer Web Animations elastic height animation as the sole controller. Previously, JavaScript measured an incorrect endpoint while the native transition was still closing the height, causing a jump at the end of the first expansion. Measurements now directly obtain the natural expanded height.

“Playback and quick times,” whose contents must update before first opening, listens for motion-disclosure-opening: quick readouts synchronize before the expanded height is measured. toggle still updates content after programmatic opening. Collapsed height is derived from the summary, border, and padding, avoiding repeated closing and reopening for measurement. The 420-millisecond animation supports reversal mid-flight; generation markers prevent stale callbacks from overwriting new state. Fixed height and overflow are cleared at completion. Reduced-motion mode switches directly.

### Separating the rail, segmented selection, and rendering

The rail allocates its final grid width once, then uses a cancellable translation animation rather than changing grid width or scaling the scientific canvas every frame. The segmented background uses offset layout coordinates with a small spring response; hidden related options expand independently when they appear. ResizeObserver skips unchanged dimensions and DPR to avoid repeatedly resetting WebGL buffers.

Menu opening/closing, control feedback, and ephemeris playback are independent. Opening a normal drawer only synchronizes the time button after pausing. Pure parameter disclosures do not recalculate astronomical graphics; only expanded items containing canvases request their corresponding refresh. Drawers do not blur the whole 3D canvas, using an overlay and layout/paint containment instead. Star-catalog initialization yields the main thread every 2,048 stars. These measures do not replace real-device performance measurements.

## 21. Current Initialization and Generation Methods

Experiment pages load basic styles and shared HTML, then define scientific, interaction, and animation functions through ordered scripts.`app.js` establishes default state and initializes the old shared nodes; afterward,`page-navigation.js` restores the session, selects the page-specific solar state, reorganizes nodes into the current workspace, and calls synchronization and a full update.

Experiment pages already exclude the welcome page and author-contact dialog during generation. The welcome page retains only star-field interaction and native navigation; contact content belongs to a standalone contact page. The complete developer documentation opens as a separate reading page through the project overview and is also available as a Markdown download. Other old experiment structures still have shared initialization dependencies; references must be checked before cleanup.

The current GitHub main branch directly maintains static HTML, CSS, JavaScript, and assets at the repository root, deployable without a build. Older `sunlab/tools/build-pages.py` and similar generation scripts are kept in the historical archive branch and are not runtime prerequisites of the current formal branch. Do not run old paths and overwrite newer pages. Page and style changes should directly maintain root files while updating the three web documents and their Markdown counterparts. If template generation is reintroduced later, existing page behavior must first be incorporated into templates and acceptance checks.

## 22. Testing and Acceptance Logic

Validation has three layers: numerical models and input boundaries, browser state and interaction, and real-device performance. Each conclusion should identify inputs, assertions, and execution environment; one screenshot cannot establish correctness in every browser.

| Regression script | Main coverage |
| --- | --- |
| tests/space-model.cjs | 40 sets of planetary vectors, lunar illumination, right-handed coordinates, sampling, and invalid dates |
| tests/space-earth-frame.cjs | Earth’s right-handed orientation, Greenwich sidereal time, equinoxes/solstices, and rotation |
| tests/space-stars.cjs | 61,816 catalog stars, directions, magnitudes, and B−V colors |
| tests/space-population.cjs | 455 satellite and 1,212 small-body orbits, retrograde motion, solving, and display scales |
| tests/space-observer.cjs | 805 sets of horizon coordinates, 35 illumination cases, poles, and date boundaries |
| tests/space-exploration.cjs | 24 planetary and 3 lunar historical paths, actual distances, year crossings, and immutable snapshots |
| tests/interaction-history.cjs | Switching, selection, parameter adjustment, grouped sliders, and history restoration across diagrams |
| tests/disclosure-motion.cjs | Initial natural height, collapse, mid-animation reversal, and reduced motion |
| tests/parameter-controls.cjs | Nine pages at four widths: switch size/alignment, entry spacing, visibility, and overflow |

### How to run

The six space-model scripts can run directly with Node. Browser scripts require a preview server serving published files, Playwright, and Chromium. The application itself does not depend on testing tools. Example commands:

```
node tests/space-model.cjs
node tests/space-earth-frame.cjs
node tests/space-stars.cjs
node tests/space-population.cjs
node tests/space-observer.cjs
node tests/space-exploration.cjs

SKY_MOTION_TEST_URL=http://127.0.0.1:8000/ node tests/disclosure-motion.cjs
SKY_MOTION_TEST_URL=http://127.0.0.1:8000/ node tests/parameter-controls.cjs
SKY_MOTION_TEST_URL=http://127.0.0.1:8000/ node tests/interaction-history.cjs
```

The browser executable can be specified with SKY_MOTION_CHROMIUM, and the Playwright module path with SKY_MOTION_PLAYWRIGHT. Defaults are the playwright module and /usr/bin/chromium. Adjust these for different execution environments.

### Current findings and evidence limits

When documentation was checked on October 11, 2026, all six space regression suites were rerun and passed. Earlier that day, layout checks for control fixes covered nine pages at widths of 1280, 960, 390, and 320 pixels, totaling 36 cases. Disclosure animation checks covered 44 first-expansion scenarios across the workbench, analemma, and related diagrams at widths of 1280 and 390 pixels. Text-label clicks, the Space key, hiding solar settings in Moon mode, and immersive controls were also checked.

These checks use Chromium and software WebGL to validate state, geometry, and internal consistency. They do not establish actual frame rates on M5, iPad, or Safari. Further performance validation should record initial/repeated operations, long tasks, and layout/paint times, comparing real devices rather than substituting device specifications for diagnosis.

Historical comparisons of Meeus/NOAA solar approximations and USNO lunar phases, trajectory clipping, and old-page checks are evidence from the samples tested at the time. Some scripts exist only in historical records and have not all been archived as reproducible tests. Their maximum differences are not reasserted as accuracy across the current full date range. See historical records in [October 10, 2026 audit record](https://github.com/qingzhuernest/skymotion/blob/main/BUG-AUDIT-2026-10-10.md)。

## 23. Packaging and Publishing to Both Sites

### Preview published files locally

The main branch’s root contains the current static source; do not run the old template generator. The shared packager copies only Git-tracked website files. Add new website assets to version control first, or they will be absent from the publication package. Choose an output directory that does not yet exist:

```
python3 .github/scripts/prepare_site.py --output /tmp/skymotion-preview
python3 -m http.server 8000 --bind 127.0.0.1 --directory /tmp/skymotion-preview
```

Visit http://127.0.0.1:8000/. The output directory must not already exist; use another directory or remove your own previous preview before rebuilding. This method serves only published files, preventing repository configuration from being exposed as a website.

### Pushing main automatically publishes both sites

[Cloudflare production site](https://skymotion-5md.pages.dev/) is published to the existing skymotion project by .github/workflows/deploy.yml;[GitHub Pages mirror](https://qingzhuernest.github.io/skymotion/) is published by .github/workflows/github-pages.yml; both are enabled. The repository source is [qingzhuernest/skymotion](https://github.com/qingzhuernest/skymotion). Maintainer commits to main trigger publication automatically; workflows can also be rerun manually in Actions.

Cloudflare credentials come from GitHub Secrets and are not written into source code or documentation. Both workflows reuse prepare_site.py, excluding README, hidden configuration, tests, scripts, archive, and internal audit records while retaining web pages, the three Markdown documents, model data, LICENSE, NOTICE, and third-party notices. The GitHub mirror supplies the /skymotion base path, changing only 404 recovery links; all other published files come from the same source.

### Assets, search, and publication acceptance

The root 404.html provides a separate error page for unknown paths. Missing JavaScript assets must not fall back to homepage HTML. Relative paths support the mirror’s subdirectory; canonical URLs and the sitemap continue to use Cloudflare as the primary address. sitemap.xml, robots.txt, and search-verification files are published with the site. Submission and indexing are handled by search platforms; successful deployment does not mean indexing has occurred.

After publication, inspect both workflow results and verify that key live assets match the current commit, topic links and deep links work, unknown .js URLs return the appropriate HTTP status, and mobile interactions function. If a 403 blocks access in the tool environment, explicitly state that the site could not be directly verified. Workflow success must not be described as validation of real-device behavior. For manual ZIP uploads, index.html must sit at the archive root, without an extra top-level directory.

The project-archive branch retains historical ZIP files, generators, and audit records without triggering production deployment. Historical material describes its corresponding version only; old generators must not overwrite main.

## 24. Resolved Issues and Ongoing Maintenance Boundaries

### Maintain the existing boundaries

Existing fixes include sundial readouts and type explanations, synchronized diagram hashes and visible views, analemma touch interaction, duplicate workbench drawing, recovery from invalid locations, protection for zero-sized welcome canvases, and consistent keyboard pitch controls. On October 11, 2026, further fixes addressed conflicting disclosure-height animations, quick content updating after measurement, and alignment, spacing, and hierarchy of switches and diagram entries. Detailed mechanisms are documented in the shared-controls, scheduling, and routing sections.

Performance and interaction checks are still needed on real Safari, Firefox, and different GPUs. Some legacy DOM dependencies and temporary scientific comparisons also need further organization. Unfinished scope must not be described as “the entire site has no bugs” or “all scientific calculations are completely correct.”

### Observational models not implemented

The current application has no complete refraction and angular-radius rise/set model, elevation/terrain obstruction, weather model, actual eclipse occultation, registered lunar-surface orientation and libration, automatic daylight-saving time, precise continuous conjunction search, database organized by standard constellation boundaries, or Service Worker offline installation. Original surface textures and real ephemerides should continue to be maintained independently.

### Licensing and asset responsibilities

The original application code is licensed under [GNU AGPLv3](LICENSE)(AGPL-3.0-only), permitting commercial use. Distribution and modified versions providing network services must comply with source-code and notice obligations. Modified network versions must explicitly offer remote users the opportunity to obtain corresponding source code. See the scope in [NOTICE](NOTICE) and third-party exceptions in [Third-Party Notices](THIRD-PARTY-NOTICES.md)。

Astronomy Engine and local Three.js retain their MIT licenses. The HYG subset is distributed under CC BY-SA 4.0, and fonts under their original licenses such as OFL. NASA-sourced imagery retains item-specific authorship, processing/color information, and sources. “NASA-sourced” must not be treated as unconditional authorization for every use. The Earth texture also retains its original source information. Relevant credits and license files are included in the publication package, and the project overview retains access to source code.

## 25. Standard Workflow for Adding Features

1. **Write teaching and model conventions first:**Identify the variable to change, conditions to hold fixed, time basis, output units, and boundaries, then choose the corresponding topic entry.
2. **Implement independently callable calculations:**Readouts and multiple diagrams consume the same results. Keep real models separate from ideal demonstrations, and prevent visual scaling from rewriting scientific vectors.
3. **Connect state and interaction:**Update session persistence, history restoration, availability, and pause logic. Retain a single control node, native input semantics, and reversible parameter gestures.
4. **Validate before refining visuals:**Start with model-boundary and state assertions, then check first interactions, rapid reversals, different widths, reduced motion, and real touch input. Control animation must not delay scientific readouts.
5. **Synchronize documentation and publication by role:**Update task steps in the learning guide, purpose and capabilities in the project overview, and files, calculations, and validation in the developer notes. Synchronize Markdown and README, check documentation anchors, copyright, and the publication package, then inspect deployment and assets on both sites after committing to main.

## Production release notes — October 13, 2026

This release unifies light control surfaces, serif typography and supporting actions, and provides 24 static Chinese and English pages. Language switching preserves experiment state. Spring menu transitions respect reduced-motion preferences. The calendar supports month/year selection, leap years, confirm and cancel. Original astronomy calculations, ephemerides, model data and scientific limitations remain unchanged.

Release checks cover six model suites, 36 control-layout cases, 44 first-disclosure cases, interaction history, font timeout recovery, language navigation, calendar and keyboard operations, and packaging at root and GitHub project paths. Checks primarily use Chromium automation and do not certify every Safari, Firefox or GPU configuration.

Cloudflare Pages is the production site, with the same content mirrored on GitHub Pages. A push to main triggers two separate workflows; maintainers should check both outcomes. The previous production version is retained under the production-before-impeccable-20261013 tag. To roll back, create a restoration commit from that tag rather than rewriting main history.
