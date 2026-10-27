# Developer reference: architecture, variables and models

A source-based reference for file responsibilities, every shared-state field, units and enums, astronomical calculations, workspace objects, recovery, localization, tests and deployment.

- [Architecture and reading order](development-guide.en.html#architecture)
- [Data flow from input to drawing](development-guide.en.html#dataflow)
- [Complete shared-state dictionary](development-guide.en.html#state)
- [Units, angles and missing values](development-guide.en.html#units)
- [Time pipeline and date conversion](development-guide.en.html#time)
- [Local coordinates, solar equations and axis geometry](development-guide.en.html#coordinates)
- [Rise/set, daylight and inverse date search](development-guide.en.html#events)
- [Shadows, plane intersections and sundials](development-guide.en.html#shadows)
- [Analemma data and the ideal cause model](development-guide.en.html#analemma)
- [Lunar astronomy, phases and independent Earthrise](development-guide.en.html#lunar)
- [3D physical vectors, display scales and cameras](development-guide.en.html#space)
- [Workspace, layout and menu state](development-guide.en.html#workspace)
- [Reference identity and linked selection](development-guide.en.html#references)
- [Ground-scene and object variables](development-guide.en.html#builder)
- [Storage formats and full-experiment restoration](development-guide.en.html#persistence)
- [History, gestures and asynchronous work](development-guide.en.html#history)
- [Design tokens, accessibility and responsive behavior](development-guide.en.html#design)
- [Documentation and localization generation](development-guide.en.html#documentation)
- [Local development, verification and commits](development-guide.en.html#development)
- [Production, mirror and packaging](development-guide.en.html#deployment)
- [Data, imagery, libraries and licenses](development-guide.en.html#sources)
- [Source responsibilities and function index](development-guide.en.html#source-index)

## Architecture and reading order

The project is a static site without a runtime build. HTML owns controls and semantics; ordered defer scripts initialize shared code. Canvas 2D draws local scientific plots and Three.js/WebGL renders spatial scenes. Astronomy Engine supplies real-date astronomy while explicit project geometry powers ideal experiments.

1. Start with app.js initial state and solar, then moon.js time conversion and skyRaw.
2. Read page-navigation.js, workbench-menu.js and custom-layout.js to understand how one set of canvases moves between single and combined views.
3. Read diagram-tools.js and its definitions for references, observer-comparison.js for linked sites and scene-builder.js for ground objects.
4. Finish with storage, history, localization, embedding and validation; do not infer architecture from a local style override.

The dictionaries cover every shared initial-state field and core subsystem structures. Equations explain calculation-local quantities. The source index lists file responsibilities and declared functions for following specific scopes; loop counters are not public interfaces.

site-catalog.json defines page paths, main navigation, view names, groups and availability. lab-state.json defines defaults, ranges, choices and camera fields. scripts/site_sources.py validates these sources and generates marked sections in boot and state modules; edit the canonical data rather than generated regions.

preferences.js is the single preference owner, exposing get, set, subscribe, reset, export and parseImport. Version 2 records use skymotion-preferences and accept version 1 records; language remains compatible with its existing storage key. Material Color Utilities 0.3.0 in theme-colors.js generates palettes mapped to the existing design color roles. The bundled library is Apache-2.0; see theme-colors.LICENSE. Scientific state is excluded from preference records.

## Data flow from input to drawing

1. A native input or slider validates and commits to state, stopping incompatible playback. Reference edits instead update the store identified by source and body.
2. schedule requests future work; motion.js retains animation frames only for playback, camera updates or explicit invalidation.
3. The coordinator updates UI, selection and visibleIds, computes active bodies and reference samples, then paints visible nonzero-size canvases.
4. Layout and ResizeObserver handle dimensions. Divider drags preview first and resize the real canvases on release.
5. History, drafts and saves record explicit snapshots. Restore validates fields, pauses playback and clears its lock without leaving a partial recovery state.

| Layer | Owns | Should not own |
| --- | --- | --- |
| Scientific state | Observer, date, solar clock and model options | Camera animation and CSS colors |
| Presentation state | Active pane, arrangement, proportions, cameras and disclosures | Inventing astronomical bearings through visual rotation |
| References | Identity, source, parameters, visibility and locks | Moving the baseline without an explicit action |
| Persistence | Versioned serialization, validation and fallback | Assigning invalid cached data wholesale to state |

prepareObservationState reconciles model bindings and derived values before presentation. workbench-menu.js presents the catalog, while lab-controls.js handles inputs and form presentation. diagram-tool-definitions.js owns reference normalization and validation, so storage and the editor share one interpretation of each object.

## Complete shared-state dictionary

initialSun defines solar defaults. initialMoon inherits them and overrides lunar fields. modeStates.sun and modeStates.moon retain separate mode state, and state points to the active object. Switching bodies should switch the reference rather than mixing playback settings.

> The initial date is an example scientific scene, not release metadata. Defaults are extracted from app.js; an added shared field without a definition fails documentation validation.

| Variable | Meaning and role | Unit or values | Source initial value |
| --- | --- | --- | --- |
| body | Active body; selects solar or lunar state and controls | sun or moon | Sun: "sun"; Moon: "moon" |
| lat | Baseline observer latitude, positive north | Degrees, −90 to 90 | Sun: 39.9 |
| lon | Baseline observer longitude, positive east | Degrees, −180 to 180 | Sun: 116.4 |
| dec | Solar declination, recomputed for real dates and directly controlled in ideal mode | Degrees, normally −23.44 to 23.44 | Sun: 23.44 |
| time | Current apparent solar time in minutes after midnight | Minutes, 0 to 1440 | Sun: 720; Moon: 1200 |
| date | Scientific observation date, not a publication date | Valid YYYY-MM-DD, 1900–2100 | Sun: "2026-06-21" |
| manual | Whether ideal solar declination is directly controlled | Boolean | Sun: false |
| view | Sky-canvas viewpoint/projection | orbit, top, horizon, observer | Sun: "orbit" |
| observerAz | Observer-facing azimuth in the looking-up view | Degrees clockwise from north | Sun: 180 |
| yaw | Sky camera yaw, not geographic longitude | Radians | Sun: -0.55 |
| pitch | Sky camera pitch, not geographic latitude | Radians | Sun: 0.38 |
| zoom | Sky-view display zoom | Dimensionless multiplier | Sun: 1 |
| playing | Shared playback state, disabled on restore | Boolean | Sun: false |
| track | Whether the daily track is shown | Boolean | Sun: true |
| shadow | Whether the rod shadow is shown | Boolean | Sun: true |
| shadowZoom | Shadow display magnification, without changing physical length | Multipliers 1, 2, 4, 8, 16 | Sun: 4 |
| shadowTrace | Whether to show the shadow-tip path | Boolean | Sun: false |
| sundialOffset | Fixed UTC offset used for sundial civil-time interpretation | Hours | Sun: 8 |
| solarDateMode | Whether solar playback advances dates | Boolean | Sun: false |
| solarDateRate | Solar date-playback rate | Simulated days per real second | Sun: 3 |
| solarDateLoop | Whether solar date playback loops | Boolean | Sun: true |
| solarDateTrail | Whether annual solar playback trails are shown | Boolean | Sun: true |
| solarDateLink | Whether solar date observation uses its linking rule | Boolean | Sun: true |
| solarDateLinkBackup | Backup of analemma settings before date-link switching | Object or null; temporary recovery data | Sun: null |
| compare | Whether to overlay ideal solstice/equinox models | Boolean | Sun: false |
| angles | Whether to show angle guides | Boolean | Sun: true |
| height | Baseline vertical rod height | Meters, control range 0.1 to 10 | Sun: 1 |
| speed | Daily playback time-advance rate | Simulated minutes per real second | Sun: 60 |
| loop | Whether daily playback loops | Boolean | Sun: true |
| daysRate | Lunar date-playback rate | Simulated days per real second | Sun: 1 |
| monthLoop | Whether lunar date playback loops in its monthly range | Boolean | Sun: true |
| place | City preset coordinate value or custom | String, must agree with latitude/longitude | Sun: "39.9,116.4" |
| earthView | Globe versus world-map presentation | globe or map | Sun: "globe" |
| globeDragMode | Whether globe dragging changes view or observer location | view or location | Sun: "view" |
| observerTimeBasis | Whether site comparisons use apparent solar time or shared UTC | solar or utc | Sun: "solar" |
| observerConstraint | Constraint when moving the observer | free, latitude, longitude | Sun: "free" |
| globeCameraLat | Latitude of the globe camera’s target | Degrees; camera state | Sun: 39.9 |
| globeCameraLon | Longitude of the globe camera’s target | Degrees; camera state | Sun: 116.4 |
| globeCameraReady | Whether the globe camera has been initialized | Boolean | Sun: false |
| moonOverlay | Whether the solar view overlays lunar motion | Boolean | Sun: false |
| analemma | Whether annual analemma samples are currently needed | Boolean | Sun: false |
| analemmaClock | Fixed daily annual sample clock, independent of time | Minutes after midnight | Sun: 720 |
| analemmaBasis | Civil or apparent-solar basis for annual sampling | clock or apparent | Sun: "clock" |
| analemmaOffset | Fixed UTC offset for civil-clock annual sampling | Hours, −12 to 14 | Sun: 8 |
| analemmaView | Analemma projection | dome, sky, equatorial | Sun: "dome" |
| analemmaCompare | Whether multiple fixed sample clocks are compared | Boolean | Sun: false |
| analemmaYaw | Analemma 3D camera yaw | Radians | Sun: -0.55 |
| analemmaPitch | Analemma 3D camera pitch | Radians | Sun: 0.38 |
| analemmaZoom | Analemma display zoom | Dimensionless multiplier | Sun: 1 |
| analemmaIdeal | Whether the ideal analemma cause model is used | Boolean | Sun: false |
| analemmaTilt | Axial tilt in the ideal cause model | Degrees, 0 to 45 | Sun: 23.44 |
| analemmaEccentricity | Orbital eccentricity in the ideal cause model | Dimensionless, 0 to 0.1 | Sun: 0.0167 |
| moonDayPlayback | Whether Moon playback advances the clock within one date | Boolean | Moon: false |
| companion | Whether Moon–planet comparisons are active | Boolean | Moon: false |
| planet | Planet identifier for lunar comparison | Mercury, Venus, Mars, Jupiter, Saturn | Moon: "Venus" |
| companionSearchResult | Lunar close-approach search result and its conditions | Object or null; includes dates, site, clock and angular separation | Moon: null |

## Units, angles and missing values

| Name | Unit/direction | Use |
| --- | --- | --- |
| rad | π/180, degrees to radians | Trigonometric inputs |
| deg | 180/π, radians to degrees | Public altitude/azimuth readings |
| alt | Degrees; horizon 0°, zenith 90° | Local sky and events |
| az | Degrees clockwise from north 0° | Horizontal projection |
| x,y,z | Local unit direction: east, up, north | solar and skyRaw results |
| yaw,pitch | Radians; camera only | Sky and analemma cameras |
| time,clock | Minutes after midnight, not Unix milliseconds | Shared clock and reference clocks |
| Date.getTime() | Unix milliseconds | Physical UTC instants |
| null events | Absent crossing; distinct from minute zero | rise, set and missing readings |
| AU, km, m | AU for spatial vectors, km for Earthrise, m for ground objects | Explicit conversion across modules |

Do not mix pixels, normalized ground coordinates, Three.js display units and physical lengths. Local w/h usually denote CSS pixels and dpr device-pixel ratio. Physical vectors must be retained separately from compressed display coordinates.

## Time pipeline and date conversion

Shared state.time is apparent solar time. sunHourAngle uses solar right ascension and sidereal time; solarNoonUTC starts from longitude and iterates to zero hour angle, and instantUTC iterates to the requested angle. skyRaw then uses Astronomy Engine for topocentric equatorial and unrefracted horizon coordinates.

```text
H_degrees = time_minutes / 4 - 180
UTC_target = instantUTC(time_minutes, date_YYYY_MM_DD, longitude_degrees)
position = skyRaw(body, time_minutes, date_YYYY_MM_DD, latitude, longitude)
```

A shared-UTC comparison computes one baseline instant and derives each site’s solar clock and local date. Equal apparent solar time computes a separate UTC instant for each longitude. Preserve rollover rather than merely reducing clock hours modulo 24.

The analemma clock basis uses a civil clock with a fixed UTC offset, whereas apparent uses instantUTC. observerTimeBasis solar/utc and analemmaBasis clock/apparent are different enums and must not be assigned interchangeably. The 3D Solar System runs on UTC dates; Earthrise uses independent orbital angle and animation seconds.

setDate validates the calendar and 1900–2100 range, disables manual when applying a real date and recomputes declination. A date string is not an arbitrary device-zone midnight; explicit UTC construction maintains consistency.

## Local coordinates, solar equations and axis geometry

solar uses latitude φ, declination δ and hour angle H. Degree inputs are multiplied by rad. Its ideal unit vector is east x, up y and north z.

```text
x = -cos(delta) * sin(H)
y = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(H)
z = cos(phi)*sin(delta) - sin(phi)*cos(delta)*cos(H)
alt = asin(clamp(y, -1, 1)) * deg
az = (atan2(x, z) * deg + 360) % 360
```

skyRaw exposes the same local interface but uses real-date topocentric astronomy. Do not force ideal and ephemeris outputs to match component by component: they serve different modes. Axis geometry uses surface normal, local north and east to map the Sun direction onto the Earth illustration.

Treat horizontal azimuth carefully near zenith, nadir and geographic poles. The geometric horizon omits terrain and refraction. Clamp rounding errors before inverse trigonometric functions and represent missing events with null rather than NaN or fabricated 0°.

## Rise/set, daylight and inverse date search

Ideal daylight uses a=sinφ·sinδ and b=cosφ·cosδ and checks whether −a/b lies in the arccos domain. Polar b≈0 requires a separate branch; a tangency is not a crossing.

```text
cos(H0) = -tan(phi) * tan(delta)
ordinary_daylight_minutes = 8 * acos(cos(H0)) * deg
rise = 720 - 4*H0_degrees
set  = 720 + 4*H0_degrees
```

Real-date ephemerisDay and SkyDiagramSampling.events sample and refine horizon crossings. Refine near local extrema to avoid missing short visibility intervals. Physical daylight uses UTC elapsed intervals; timeAxisLength is length on the solar-clock coordinate and is not always identical.

| Variable/function | Role |
| --- | --- |
| eventModel | Returns rise/set times and positions plus pole flag |
| eventCompassCamera.zoom | Display zoom only; no variable rotates scientific bearings |
| eventCompassLayout | Current center, radius, projection, model, body and date |
| eventBearingCandidates | Builds dates at a fixed site: current solar year or ±5 lunar weeks |
| eventBearingDate | Ranks a declination approximation then verifies actual geometric crossings |
| gesture / pending | Retains starting conditions and pending pointer; cancel/Escape restores the start |

Dragging changes date rather than assigning az. Unreachable targets use a verified event and show a nearest-result explanation. Pointer updates coalesce into frames and candidate events are reused within the gesture rather than recomputing a year for every pixel.

## Shadows, plane intersections and sundials

For horizontal ground and a vertical rod, the vertical solar component determines shadow length. Below the horizon, direct-sunlight ground shadows are absent. Near the horizon, length diverges; clip the display rather than changing the physical result.

```text
shadow_x = -rod_height * sun_x / sun_y
shadow_z = -rod_height * sun_z / sun_y
shadow_length = rod_height / tan(altitude)
```

Horizontal and equatorial dials use gnomon–plane–ray intersections. Do not substitute the full length of a tilted rod for vertical height H in the horizontal-shadow formula. Keep shadowZoom, camera zoom and physical height separate.

## Analemma data and the ideal cause model

analemmaSample returns UTC, hour angle, declination, equation of time, altitude and azimuth for a date. analemmaYear caches annual samples by place, clock, basis, offset and ideal parameters. Scientific changes must change the key; camera changes only affect projection.

| Local quantity | Meaning and unit |
| --- | --- |
| days / T | Days from J2000 and Julian centuries |
| L / M / E | Mean longitude, mean anomaly and eccentric anomaly in radians |
| e / tilt | Controlled eccentricity and tilt; dimensionless and internal radians |
| anomaly / longitude | True anomaly and solar longitude in radians |
| ra / dec / hour | This ideal function outputs right ascension, declination and hour angle in degrees; Astronomy Engine RA is in hours |
| eot | Equation of time in minutes |
| analemmaPlot / analemmaMarker | Hit/projection state and smoothed date marker, not a new physical orbit |

The ideal cause model solves E−e·sinE=M by Newton iteration, then uses tilt for RA/declination. Apparent-time sampling iterates to the solar clock. Real mode calls Astronomy Engine; the UI must distinguish them. Month-label density changes do not remove scientific samples.

## Lunar astronomy, phases and independent Earthrise

The ordinary lunar sky uses real-date topocentric position and illumination, with additional orientation geometry for the phase view. A fraction of a synodic month is not a substitute for actual position or bright-limb orientation.

| Earthrise quantity | Meaning | Unit/initial value |
| --- | --- | --- |
| R / E / D / MU | Moon radius, Earth radius, center separation, lunar gravitational parameter | 1737.4 km / 6371 km / 384400 km / 4902.800066 km³·s⁻² |
| s.mode | Orbital or fixed-surface mode | orbit / surface |
| s.angle / s.phase | Orbital position angle and illumination configuration angle | Degrees; initial 258 / 45 |
| s.altitude | Orbital altitude above the surface; surface mode uses zero | km; controls 100 / 300 / 1000 |
| s.seconds | Animation duration per orbit, not physical period | Seconds; controls 20 / 40 / 80 |
| s.playing / s.follow | Playback and Earth-follow orientation | Boolean |
| s.yaw / s.pitch / s.fov | Head yaw/pitch and field of view, without relocating the orbiter | Yaw/pitch radians; FOV degrees 24/45/70 |
| q.distance / q.altitude / q.horizon | Distance to Earth center, Earth-center altitude and depressed horizon | km / degrees / degrees |
| q.angularRadius / q.clearance | Earth angular radius and center clearance above the visible limb | Degrees |
| q.visibility | Disk-versus-limb visibility class | hidden / partial / visible |
| q.period | Physical circular-orbit period from 2π√((R+h)³/MU) | Seconds |

lunar/model.js is separate from the Lab ephemeris state. Same-origin parent messages manage activity and language. Leaving pauses work, and late loading must not steal a newly selected view. Snapshot/restore validates supported ranges and restores paused.

## 3D physical vectors, display scales and cameras

space/model.js retains physical AU vectors. EQJ equatorial coordinates rotate to ecliptic coordinates, then map to Three.js (x,z,−y), preserving handedness. compress uses a display radius of 6.8·r^0.45; this is not a physical-unit conversion.

| Variable | Meaning and unit |
| --- | --- |
| Model.bodies | Eight-planet metadata: id, name, type, radius km, au AU, period days, display size and color |
| physical / display | Physical positions versus compressed display positions, kept separate |
| MOON_DISPLAY_SCALE | Local lunar teaching scale shared by Moon, orbit and historical trail |
| year / day | UTC year and day offset from January 1 at 12:00 UTC |
| selected | Index into Model.bodies, not coordinates |
| view / inspectingMoon | Current spatial view and lunar-inspection state |
| observer.lat / observer.lon | Geographic observing conditions for local-sky comparison |
| comparing / reference | Comparison enabled and plane/observer reference type |
| azimuth / elevation | Camera azimuth/elevation in radians, not local solar az/alt |
| distance / targetDistance | Camera distance and smoothing target in display units |
| target / smoothTarget | Target and smoothed target positions |
| playing / handle / previous | Playback flag, frame handle and previous timestamp |
| trackedBody / satelliteFraming | Tracked-body identifier and satellite framing state |
| linkedView / embedded | Embedded view type and parent-embedding flag |

SolarSpaceView bridges parent selection and shared UTC without writing compressed coordinates back into local astronomy. WebGL failure offers a 2D fallback and disables unavailable controls; history restore pauses first.

## Workspace, layout and menu state

| Variable/field | Meaning |
| --- | --- |
| uiWorkspace.selected | Current content identifier, such as skyPanel, solarCompare, analemmaPanel or lunarOrbit |
| uiWorkspace.cards / nodes | Composable containers and original nodes to show/hide; do not duplicate the scientific pipeline |
| uiWorkspace.analemmaClockLinked | Explicit annual-sample link to the shared apparent-solar clock |
| uiWorkspace.lunarReady / pendingLunar | Earthrise readiness and pending request |
| data.version / data.enabled | Layout schema version and combination-enabled flag |
| data.views / data.active | Ordered view IDs and active index; at most six unique entries |
| data.axis / data.featured | columns/rows arrangement and featured three-pane flag |
| data.ratio / data.rowRatio | Column and row percentages from 30 to 70 |
| focused / gesture | Focused pane and active layout drag transaction |
| customizing / normalSelection | Editing mode and pre-edit selection, not scientific model choices |
| profiles / profileUndo | Up to five saves and saved-item edit history |
| railView / optionOpen | Sidebar category and layout-options openness |

SkyWorkbenchMenu selects content beneath stable top navigation; skyWorkspacePresentation manages composition. Object selection must not rewrite the main menu. Selecting a pane updates active/highlight state without remounting all canvases. Small screens reuse the native parameter drawer instead of another floating editor.

Capture-phase pointerdown and focusin activate panes even when plot gestures stop bubbling. placeCards moves containers only when order changes; apply restores selector focus to the replacement pane. focusView and leaveFocusedView share the focus-state transition. The return action stays in the visible pane header in ordinary mode; Escape and another title double-click use the same exit path.

design-system.css owns target sizes, state layers and focus colors. Wide screens with fine pointers use a 40px minimum target; coarse pointers or narrow screens use 48px; checkbox labels enlarge the hit area around the small visual square. Hover and pressed states overlay inset shadows at 8% and 12% of currentColor, preserving the container color. md-dark-surface supplies a contrasting focus role on scientific canvases. Compact calendar dates retain a 40px minimum; planetary annotations have equivalent full-size sidebar controls.

workbench-content-group and observation settings reuse menu-section instead of separate disclosure skins. Nested menu-subsection heading radii subtract the 1px border from the outer radius. md-connected-choice provides connected exclusive choices using aria-pressed or aria-selected, while global navigation stays at the top. Moon phase uses pane container queries rather than viewport width, stacking orbit and disk readouts in narrow panes. phaseOrbitLayout follows the resized canvas, and dragging still changes the same real observation instant.

## Reference identity and linked selection

| Structure | Field meaning |
| --- | --- |
| models | Map from model ID to projection, canvas, body and picking functions |
| states | Stores isolated by source:body, with objects, undo, redo, saved content and model descriptor |
| o.id / o.type | Stable identity and tool type; list index is not identity |
| o.label / customLabel | Label and manual-name flag; coordinate changes update automatic names only |
| o.visible / o.locked | Visibility and edit lock, which are distinct |
| o.source / o.body | Owning plot source and body context |
| observer.lat / observer.lon | Comparison coordinates, distinct from baseline state.lat/lon |
| time.time / curve.date | Reference clock minutes and curve date |
| selected / selectedSource | Selected identity and source, retained across panes |
| armed / drag / nudging | Armed placement tool, pointer transaction and keyboard-nudge transaction |
| selectedReference | Source+ID used for linked emphasis, not a copied reference |

Definitions select valid fields and ranges; clean normalizes references, with at most 40 per plot. Events, curves and sites retain their computation conditions. Linked emphasis matches both source and ID and dims other comparisons rather than matching ID alone.

Add/patch updates a reference without relocating the baseline. observeLocation or Make baseline explicitly applies the site. Names, sliders, inputs and cross-view colors must share one reference rather than disconnected city arrays.

## Ground-scene and object variables

| Field | Meaning/unit |
| --- | --- |
| data.version / labels / objects | Scene version, label visibility and up to 32 objects |
| id / number / kind | Stable identity, automatic number and object kind |
| x / z / elevation | Ground coordinates and elevation, meters |
| height / radius / width / depth | Height, radius and plane dimensions, meters |
| plane | ground, vertical or inclined reference plane |
| tilt / azimuth / heading | Tilt, object azimuth and station heading in degrees |
| upright / grounded / locked | Upright, grounded and locked constraints applied before edits |
| lat / lon | Station-associated geographic coordinates in degrees |
| name / autoName | Manual name and automatic-name flag |
| measurements | Measurement kind and participating IDs, up to 30 valid entries |
| recordMotion / trails | Motion-recording flag and bounded x/z trails |
| notes / reference | Personal notes; reference scene and condition without recursive nesting |
| selected / selectedMany / pending | Selected ID, multi-selection set and pending placement kind |
| buckets | Separate solar/lunar in-memory scenes, history and selection |

sanitize validates kinds, finite numbers, constraints and measurement IDs. A reference scene cannot contain another reference layer. prepareExperiment restores temporary counters such as seq so validation does not consume visible numbering; restoreExperiment clears active gestures and retains pause.

## Storage formats and full-experiment restoration

| Key/structure | Purpose |
| --- | --- |
| skyLabSession | schemaVersion=1 scientific session in sessionStorage, with memory fallback |
| sky-diagram-draft-v2:source:body | Session reference draft with version and objects |
| sky-diagram-tools-v1:source:body | Individually saved plot references |
| skymotion-workspace-v3-wide/narrow… | Current layout by viewport class and body, compatible with v2 |
| skymotion-saved-layouts-v1… | Up to five named saves with name, layout and optional experiment |
| skymotion-scene-builder-v1-body | Independently saved ground scene |
| experiment.version / body | Full-experiment schema version and body context |
| experiment.conditions | Mode and scientific state snapshot from SkyLabExperiment |
| experiment.references / ground | Current-body reference stores and ground scene |

1. Commit valid inputs before capture; each subsystem exports its own data rather than copying arbitrary localStorage keys.
2. Before restoring, validate schema, body, dates, coordinates, clocks, references and ground objects.
3. Apply only after every subsystem prepares successfully; invalid data must not replace half the experiment.
4. Restore full experiments paused; independent reference and scene saves are not permanently overwritten by applying a collection item.
5. Report storage denial, quota and old-version failures honestly; memory fallback must not claim persistence across reloads.

Full experiments are validated by SkyLabExperiment.prepareComplete and coordinated by SkyMotionSession.transaction. Each participant captures an owner-local checkpoint before any commit. Exceptions or explicit rejection roll back in reverse order, preserving object undo history. Layout, conditions, references and ground restore their own state; history completion runs in finally.

## History, gestures and asynchronous work

interaction-history.js uses adapters for scientific state, form values and routes. Pointer, slider and input commits are grouped; camera/menu actions are excluded or locally managed. restoreGeneration rejects superseded async work, and the restoring lock must be released on every exit.

| Variable | Role |
| --- | --- |
| adapter | Page read/restore and optional gesture classifier |
| gesture / pointerStart | Active pointer transaction and starting snapshot |
| restoring / restoreGeneration | Restoration lock and generation token rejecting stale results |
| timer / pendingInput | Commit-coalescing timer and pending field |
| loadGeneration / pendingLunar | Earthrise load generation and still-valid entry intent |
| importRequest | Valid generation for async reference import |

File imports limit size, count, type and context and recheck that the user is still in the same plot when reading finishes. Pause hidden-page animation without hiding and re-showing the scientific canvas during navigation.

## Design tokens, accessibility and responsive behavior

ui-palette.css owns Material 3 Expressive semantic colors: green actions, sage surface levels, secondary and tertiary containers. design-system.css owns color, shape, state and motion roles; route styles arrange components. Scientific body and orbit colors remain independent of interface selection.

md-sys-color-* defines primary and secondary actions, surface levels, foregrounds and outlines. md-sys-shape-corner-* defines the 4/8/12/16/20/28/32/48px and fully rounded shape scale. Small desktop targets are 40px; narrow screens and touch targets are 48px, independent of visual density. State and motion tokens own interaction layers, duration and easing. Standard connected buttons morph on selection and press without an independent moving backplate. Seasonal and planet choices share a compact grid with32px painted surfaces, rounded ends and lower, wider proportions. Sliders use 16px tracks and 4px upright handles. material-controls.js derives fill from native values and bounds; existing state owners call updateRange or updateRanges after assigning values. Native keyboard behavior, gestures, history and scientific calculations remain with their original modules. Preserve SkyMotion Reading for Chinese and SkyMotion Charter for English.

- Follow DESIGN.md for fonts, radii, control sizes and focus. Reuse existing menus instead of covering the scientific canvas.
- At 760 pixels or below, use the native dialog drawer and move the same control nodes rather than creating another state copy.
- Use aria-pressed, aria-selected and aria-expanded, with keyboard focus and readable canvas instructions.
- Respect prefers-reduced-motion and avoid rebuilding menus every frame; update text or attributes only when changed.
- Check actual touch targets and desktop mouse/keyboard behavior, zoomed layouts and common Windows viewport sizes.

## Documentation and localization generation

docs/document-content.json is the bilingual source for four documentation pages. scripts/build-documents.py generates Chinese HTML, both Markdown locales and translation entries. Shared defaults are read from lab-state.json and checked against state_dictionary. This is a maintenance step; production does not require Python.

scripts/prerender-pages.py then generates English siblings, language-data.js and page-cache-manifest.json. It compares structure, IDs, form values and script order so localization cannot change science. New documents require navigation, cache and bilingual-pair coverage.

```bash
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py
python3 scripts/build-documents.py --check
python3 scripts/prerender-pages.py --check
```

Keep release diaries out of the manuals. Feature usage, teaching tasks and variable meanings have separate homes. One content source generates pages and Markdown to prevent stale downloads.

scripts/document_model.py validates paths, unique section IDs and aliases, bilingual text, block types, table dimensions, link targets and state documentation coverage before output. scripts/build-documents.py handles rendering and writing, using scripts/document-page.html for the shell. State tables read lab-state.json rather than inferring JavaScript declarations from indentation.

## Local development, verification and commits

1. Clone the repository, read PRODUCT.md and DESIGN.md, then use a static server; no application framework is required for runtime.
2. Browser-test dependencies are pinned in tests/browser/package-lock.json; install there and keep tools out of production.
3. Run relevant checks first; release workflows run all root .cjs regressions except helper files.
4. For UI changes check desktop, tablet and phone; for models also check time basis, bounds, handedness and absent events.
5. Regenerate bilingual content and review git diff before committing, excluding screenshots, temporary servers and debug credentials.

```bash
python3 -m http.server 8000 --bind 127.0.0.1
# Browser tests, from a separate terminal:
npm ci --prefix tests/browser
tests/browser/node_modules/.bin/playwright install chromium
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" \
  node .github/scripts/verify-site.cjs
```

Checks cover model consistency, real clicks/drags, corrupt-cache recovery, localization/structure, restricted storage, packaging paths and WebGL fallback. Passing does not certify every GPU or real Safari/Firefox device or provide independent ephemeris accuracy certification.

Production publication keeps the latest main commit. A new commit cancels obsolete publication workflows for the same host; the latest commit still must pass the complete checks before deployment.

## Production, mirror and packaging

A push to main triggers separate Cloudflare Pages and GitHub Pages workflows using shared validate.yml first. A failed validation blocks that deployment. Verify both outcomes rather than treating one green status as success for both.

```bash
python3 .github/scripts/prepare_site.py --output /tmp/skymotion-site
python3 .github/scripts/prepare_site.py --output /tmp/skymotion-mirror --base-path /skymotion
```

prepare_site.py copies tracked static files while excluding tests, scripts, private configuration and maintenance metadata. The manifest controls warming and freshness; update versions for changed runtime assets and verify actual online content. Check relative links and 404 recovery under the GitHub project path.

- [Source and workflows on GitHub](https://github.com/qingzhuernest/skymotion)
- [Cloudflare production site](https://skymotion-5md.pages.dev/)
- [GitHub Pages mirror](https://qingzhuernest.github.io/skymotion/)

## Data, imagery, libraries and licenses

Project code uses AGPLv3 as specified by LICENSE. Astronomy Engine, Three.js, fonts, catalogs and imagery retain separate licenses; bundling does not unify them. Check original terms and source-availability obligations when redistributing or hosting modifications.

- [Project LICENSE](https://github.com/qingzhuernest/skymotion/blob/main/LICENSE)
- [3D imagery and resource credits](space/assets/credits.txt)
- [Additional population data sources](space/assets/population-credits.txt)
- [Star catalog license](space/assets/stars-license.txt)
- [Three.js license](space/vendor/THREE-LICENSE.txt)

Nebula images can be scientifically processed. Lunar/Earth textures and catalog samples are not live cameras or a complete sky database. Approximate orbits, ideal circular orbits and real-date ephemerides must remain labeled by module.

## Source responsibilities and function index

This index scans actual files. The right column lists explicit function declarations; follow each file for IIFEs, object methods and closures. Variable meaning is defined in the state and structure tables above.

| Source file | Responsibility | Declared functions |
| --- | --- | --- |
| [app.js](https://github.com/qingzhuernest/skymotion/blob/main/app.js) | Shared state, solar geometry, Canvas rendering and observation preparation | solar, daylight, hhmm, coord, heading, dateDec, selectedPlaceName, resize, poly, text, glow, skyTrackSegments, between, add, drawMoonDayEndpoints, drawSkyScene, drawTrack, drawSunAltitudeChart, line, createEarthGPU, shader, drawEarthGPU, globeCenter, globeGeometry, renderGlobeOptions, initGlobeOptions, labels, initEarthFallback, earthSurface, drawGlobe, proj, skyViewSelected, syncSkyViewControls, updateUI, drawSolarSky, drawLunarSky, renderSolarPipeline, renderLunarPipeline, prepareObservationState, render, schedule, monthPhaseSamples, drawLunarMonthChart, shiftDay, advanceLunarPlayback, paintLabReferences |
| [moon.js](https://github.com/qingzhuernest/skymotion/blob/main/moon.js) | Real-date ephemerides, solar-time/UTC conversion and event sampling | sunEquatorial, sunHourAngle, solarNoonUTC, instantUTC, skyRaw, moonRaw, refineExtremum, ephemerisDay, lunarDay, bodyPosition, bodyDay, sunContext, lunarPhase, seasonDate, lunarFaceTexture, drawMoon, drawPhasePanel, halfLit, initPhaseInteraction, pointerAngle, applyDrag, finish |
| [astronomy.js](https://github.com/qingzhuernest/skymotion/blob/main/astronomy.js) | Bundled third-party Astronomy Engine library | mb |
| [coverage.js](https://github.com/qingzhuernest/skymotion/blob/main/coverage.js) | Globe/daylight, map, rise/set bearings and axis geometry | yearLength, yearDay, dateAtYearDay, updateYearSlider, illuminationAt, mapGeometry, mapLocation, worldNightLatitude, worldNightPath, drawWorldMap, updateEarthView, eventPosition, eventModel, updateEvents, drawEventCompass, eventBearingCandidates, eventBearingDate, initEventCompassInteraction, restore, adjust, finish, cancel, geometryModel, resetGeometryCamera, initGeometryCamera, redraw, drawEarthGeometry, ring, renderSolarCoverage, renderLunarCoverage, useReferenceObserver, observerClockAt, chooseMapObserver, initCoverage |
| [workspace.js](https://github.com/qingzhuernest/skymotion/blob/main/workspace.js) | Visibility coordination for solar/lunar views and original modules | isMoonOverlayActive, moonOverlayPosition, initWorkspace, updateWorkspaceLayout, updateWorkspaceUI |
| [page-navigation.js](https://github.com/qingzhuernest/skymotion/blob/main/page-navigation.js) | Unified shell, routing, canvas mounting and parameter drawer | uiViewHidden, uiViewText, uiViewAttribute, renderUIWorkspace, save, link, addPlace, selectDial, sundialGroup, animateDrawer, finishDrawerClose, closeParameters, openParameters, endDrawerSwipe, updateParameterPresentation |
| [workbench-menu.js](https://github.com/qingzhuernest/skymotion/blob/main/workbench-menu.js) | Present hierarchical view and layout entries from the canonical catalog | select, sync |
| [custom-layout.js](https://github.com/qingzhuernest/skymotion/blob/main/custom-layout.js) | Composition, dragging, proportions, saves and full-experiment orchestration | sanitize, load, loadProfiles, button, travel, section, captureExperiment, applyProfile, persistProfiles, mutateProfiles, undoProfiles, leaveFocusedView, focusView, placeCards, markActive, activate, save, announce, change, move, labelButtons, labels, renderOrder, focusProfile, finishEditing, renderProfiles, apply, closeOptions, toggleOptions, start, cancel, targetAt, ratioAt |
| [customization-mode.js](https://github.com/qingzhuernest/skymotion/blob/main/customization-mode.js) | Shared lifecycle of the top customization switch | refresh, change |
| [customization-session.js](https://github.com/qingzhuernest/skymotion/blob/main/customization-session.js) | One-use edit intent and session continuity across entries | Module methods; see source |
| [diagram-tools.js](https://github.com/qingzhuernest/skymotion/blob/main/diagram-tools.js) | Reference stores, properties, placement, selection, imports and validation | updateFold, updateMode, setEditing, selectedOwner, selectedKey, entries, switchView, revealField, revealWithin, placementUI, contextualHelp, arm, placeAt, menuOpen, closeObjectMenu, reorder, updateFiles, readImport, cityLabel, makeObject, startExperiment, persist, stateFor, defs, clean, repaint, draftStatus, record, restoreBasis, updateLocation, actionState, validInputs, fieldError, clearFieldError, referenceName, updateSmall, mutate, travel, commitActive, save, create, showInspector, rememberContext, hide, open, parameterRail, persistentRailMode, visibleModels, chooseRail, ensureRailNavigation, syncRailNavigation, syncRailShell, unmountPanel, placePanel, renderToolLibrary, renderObjectList, referenceNameAtLocation, attachReferenceControl, commitReferenceField, renderInspector, update, selectedRow, focusSelectedRow, selectReference, textLayout, helper, drawObject, anchor, movementOrigin, hitAnchor, pointAt, beginDrag, moveDrag, finishDrag, cancelDrag, wireCanvas, paint, customizationOn, syncLaunchers, checkCurrentVisibility, syncVisibility, comparisonModel, comparisonList, comparisonChange, comparisonValid, syncInputs, finishNudge, nudge |
| [diagram-tool-definitions.js](https://github.com/qingzhuernest/skymotion/blob/main/diagram-tool-definitions.js) | Object types, fields and data normalization without DOM bindings | forModel, normalize |
| [diagram-sampling.js](https://github.com/qingzhuernest/skymotion/blob/main/diagram-sampling.js) | Bounded caches, geometric crossings and annual reference sampling | crossings |
| [observer-comparison.js](https://github.com/qingzhuernest/skymotion/blob/main/observer-comparison.js) | Linked city/time projections and source-aware selection emphasis | memo, at, basis, sample, color, name, enabled, sites, times, points, events, stroke, dot, label, geometryRay, paint |
| [parameter-controls.js](https://github.com/qingzhuernest/skymotion/blob/main/parameter-controls.js) | Coordinate, clock and date scrubbing and precise inputs | attach, sync, start, flush, finish, cancel |
| [solar-study.js](https://github.com/qingzhuernest/skymotion/blob/main/solar-study.js) | Dedicated same-place/time and shared-instant/place comparisons | el, svg, text, button, caption, project, path, paths, at, dayPath, clock, locationText, sites, comparison, sync |
| [scene-builder.js](https://github.com/qingzhuernest/skymotion/blob/main/scene-builder.js) | Ground objects, constraints, measurements, trails and scene references | check, example, measurementObjects, sanitize, cleanCondition, selectBody, message, updateStatus, record, change, travel, save, setMode, remove, duplicate, place, ringPosition, group, arrangeObjects, addMeasurement, recordShadow, recordEvent, shadowEnds, shadowLength, measurementValue, update, translate, ground, local, position, hit, draw, resize, cancelGesture |
| [analemma.js](https://github.com/qingzhuernest/skymotion/blob/main/analemma.js) | Annual sampling, projections, ideal causes and month labels | analemmaIdealPosition, analemmaSample, analemmaYear, analemmaTracks, analemmaVector, analemmaSegments, analemmaReferenceOptions, drawAnalemma, renderAnalemma, advanceAnalemma, resetAnalemmaView, initAnalemma |
| [solar-date.js](https://github.com/qingzhuernest/skymotion/blob/main/solar-date.js) | Solar date playback, date linking and annual trails | prepareSolarDateMode, enableSolarDateMode, annualSolarSamples, annualSolarKey, annualSolarPosition, drawAnnualSolarTrail, annualShadowSegments, drawAnnualShadowTrail, updateSolarDateMonths, renderSolarDateUI, advanceSolarDatePlayback, initSolarDate |
| [shadow.js](https://github.com/qingzhuernest/skymotion/blob/main/shadow.js) | Shadow length, tip paths and display scaling | shadowGroundRadius, shadowTip, clipShadowSegment, shadowTipSegments, drawShadowTrace, drawCurrentShadow, updateShadowUI, initShadow |
| [sundial.js](https://github.com/qingzhuernest/skymotion/blob/main/sundial.js) | Horizontal/equatorial sundial geometry and drawing | sundialModel, sundialHourRay, sundialPlanePoint, drawSundialSide, drawSundial, drawSundials, renderSundials, initSundials |
| [sundial-device.js](https://github.com/qingzhuernest/skymotion/blob/main/sundial-device.js) | Sundial apparatus interaction and camera | openSundialDialog, sundialDeviceFrame, drawSundialDevice, sundialSetTime, sundialDragTime, sundialPlateDragTime, initSundialDevice, redrawCamera, pinchDistance, renderSundialDeviceControls |
| [observer.js](https://github.com/qingzhuernest/skymotion/blob/main/observer.js) | Local looking-up projection and interactions | observerPosition, observerFrame, moonBrightLimbAngle, observerBodies, observerDayPosition, drawObserverCurve, drawObserverTrack, observerGroundFrame, drawObserverGround, drawObserverSky, arrangeObserverTime, renderObserverControls, initObserver |
| [companion.js](https://github.com/qingzhuernest/skymotion/blob/main/companion.js) | Moon–planet comparisons, angular separation and date searches | companionSnapshot, futureCompanionDates, closestCompanionDay, renderCompanion, drawCompanionSky, initCompanion |
| [motion.js](https://github.com/qingzhuernest/skymotion/blob/main/motion.js) | On-demand frames, playback accumulation and camera smoothing | elementVisible, canPaint, requestMotionFrame, snapshotMotion, syncMotionTarget, motionProgress, mixDirection, visualPosition, visualPhase, visualTrackPosition, visualChartDay, motionCamera, easeCompanionView, settleMotion, revealMotion, drawMotionCanvases, motionFrame, initMotion, focusAfterReveal |
| [menu.js](https://github.com/qingzhuernest/skymotion/blob/main/menu.js) | Original parameter grouping and disclosure behavior | updateMenu, closeMenu, initMenu |
| [time-workbench.js](https://github.com/qingzhuernest/skymotion/blob/main/time-workbench.js) | Shared clock/date timeline and playback controls | workbenchIsAnalemmaEntry, workbenchBasis, workbenchTimeMax, workbenchSetTime, workbenchShiftDate, workbenchSetBasis, workbenchPlay, workbenchIsPlaying, renderTimeWorkbench, initTimeWorkbench |
| [experiment-storage.js](https://github.com/qingzhuernest/skymotion/blob/main/experiment-storage.js) | Versioned session validation, storage fallback and restore transaction coordination | validDate, searchResult, sanitizeMode, read, write, transaction |
| [interaction-history.js](https://github.com/qingzhuernest/skymotion/blob/main/interaction-history.js) | Parameter history, gesture grouping and restoration lock | read, stateFor, replace, commit, begin, queue, restore |
| [lab-history.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-history.js) | Observation snapshots, history adapter and full-experiment data coordination | Module methods; see source |
| [lab-customization.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-customization.js) | Compatible Lab customization integration | Module methods; see source |
| [lab-comparison-controls.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-comparison-controls.js) | Original Lab comparison control adapter | Module methods; see source |
| [interface-motion.js](https://github.com/qingzhuernest/skymotion/blob/main/interface-motion.js) | Disclosure/selection feedback respecting reduced motion | springPanel, installDisclosures, revealOptions, installSegments, installRail, sync, setCollapsed, gesture, end |
| [language.js](https://github.com/qingzhuernest/skymotion/blob/main/language.js) | Locale switching, fonts, static siblings and retry | installDictionary, translate, text, element, walk, apply, prepareFonts, showLanguageFailure, change, reveal, observePresentation, init, failure |
| [language-data.js](https://github.com/qingzhuernest/skymotion/blob/main/language-data.js) | Generated bilingual dictionary | Module methods; see source |
| [page-boot.js](https://github.com/qingzhuernest/skymotion/blob/main/page-boot.js) | Locale and entrance initialization before visible paint | freezeCatalog, readingKey, saveReadingWindow, mergeReadingFallback, localeUrl, showFontFailure |
| [page-cache.js](https://github.com/qingzhuernest/skymotion/blob/main/page-cache.js) | Same-origin resource warming from the manifest | worker |
| [date-picker.js](https://github.com/qingzhuernest/skymotion/blob/main/date-picker.js) | Calendar selection with confirm/cancel semantics | dateValue, allowed, updateDraft, focusKey, close, render, open, install |
| [observer-explanation.js](https://github.com/qingzhuernest/skymotion/blob/main/observer-explanation.js) | Scientific context and explanations for the current view | close, sync |
| [document-entrance.js](https://github.com/qingzhuernest/skymotion/blob/main/document-entrance.js) | Existing entrance conversations for the three manuals | cleanup, track, exit, start |
| [welcome.js](https://github.com/qingzhuernest/skymotion/blob/main/welcome.js) | Welcome-page star field and entry interactions | setStatus, openingNode, finishOpening, activateOpening, random, makeGlow, point, request, resize, pulse, advance, collide, frame, edgeKey, interact, segmentDistance, hitTarget, clickAt, pointerPoint, clear, syncConnectButton, spawnMeteors |
| [lunar/model.js](https://github.com/qingzhuernest/skymotion/blob/main/lunar/model.js) | Independent circular-orbit Earthrise model in kilometers and seconds | sample, riseAngle |
| [lunar/lunar.js](https://github.com/qingzhuernest/skymotion/blob/main/lunar/lunar.js) | Two-view WebGL, flight state, orientation and embedding messages | text, refresh, invalidate, frame, pause, stars, ring, setup, resize, projectLabel, draw, mapPoint, mapAngle, moveMap |
| [space/model.js](https://github.com/qingzhuernest/skymotion/blob/main/space/model.js) | Physical vectors, coordinate rotation and teaching-distance compression | sceneVector, compress, snapshot, orbitalPath |
| [space/scene.js](https://github.com/qingzhuernest/skymotion/blob/main/space/scene.js) | 3D rendering, selection, camera, clock and exposed state | comparisonLayout, invalidate, utcDate, line, select, focus, focusMoon, syncViewPresentation, pause, updateScience, lunarPath, updateObjects, updateHistory, updateInspection, placeLabel, overviewDistance, planetDistance, earthMoonDistance, moonDistance, obliqueElevation, fittedDistance, minimumDistance, resize, frame |
| [space/earth-frame.js](https://github.com/qingzhuernest/skymotion/blob/main/space/earth-frame.js) | Earth orientation and local observer frame | dot, frame, toScene |
| [space/appearance.js](https://github.com/qingzhuernest/skymotion/blob/main/space/appearance.js) | Materials, imagery and visual appearance | clamp, noiseField, random, canvasPixels, texture, mix, craters, lunarMaria, makeSurface, ring, atmosphericEdge, create, moon, sun |
| [space/compare.js](https://github.com/qingzhuernest/skymotion/blob/main/space/compare.js) | Spatial reference-plane comparison | create, resize, disc, text, arrow, render, project, label, path |
| [space/observer.js](https://github.com/qingzhuernest/skymotion/blob/main/space/observer.js) | Local-sky comparison for the spatial scene | create, select, calculate, updateReadouts, draw, resize, render |
| [space/lab-compare.js](https://github.com/qingzhuernest/skymotion/blob/main/space/lab-compare.js) | Shared-UTC link between Lab and 3D scenes | blockReason, redrawAfterLayout, setEnabled, sync |
| [space/embed.js](https://github.com/qingzhuernest/skymotion/blob/main/space/embed.js) | 3D embedding parameters and parent coordination | Module methods; see source |
| [space/ui.js](https://github.com/qingzhuernest/skymotion/blob/main/space/ui.js) | 3D rail/drawer mounting | sync, closeDrawer |
| [space/history.js](https://github.com/qingzhuernest/skymotion/blob/main/space/history.js) | 3D scientific-selection history and restoration | Module methods; see source |
| [space/immersive.js](https://github.com/qingzhuernest/skymotion/blob/main/space/immersive.js) | Immersive observation and exit ordering | layout, enter, exit |
| [space/exploration.js](https://github.com/qingzhuernest/skymotion/blob/main/space/exploration.js) | Exploration-object selection and descriptions | validVector, trail, actualDistance |
| [space/customization.js](https://github.com/qingzhuernest/skymotion/blob/main/space/customization.js) | 3D references and separate camera markers | position |
| [space/population.js](https://github.com/qingzhuernest/skymotion/blob/main/space/population.js) | Satellite/small-body data and approximate orbits | solveKepler, epochDays, prepare, convert, position, displaySatellite, satelliteDistance, create, load, setPositions |
| [space/stars.js](https://github.com/qingzhuernest/skymotion/blob/main/space/stars.js) | Star catalog, picking and labels | temperature, color, direction, create |
| [space/nebulae.js](https://github.com/qingzhuernest/skymotion/blob/main/space/nebulae.js) | Nebula catalog, image display and resource management | create, choose, load |
| [lab-controls.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-controls.js) | Observation input events, location/date controls and form presentation | setDate, stop, globeLocationAt, globeObserverPoint, selectObservationBody, selectChartDateOrTime, monthDays, syncControls, updateSolarControls, updateLunarControls, selectMonth, installSkyTrackScrub |
| [document-navigation.js](https://github.com/qingzhuernest/skymotion/blob/main/document-navigation.js) | Always-visible contents, current chapter and Back to top; native anchors provide a no-script fallback | update |
| [material-controls.js](https://github.com/qingzhuernest/skymotion/blob/main/material-controls.js) | Material 3 Expressive range presentation; never writes experiment state | updateRange, updateRanges, updateChoices, queueChoice, syncChoices, enhanceChoices, positionPanel, closeChoice, caption, syncVisibility, sync, enhanceAll, install |
