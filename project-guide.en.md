SKY MOTION LAB · PROJECT AND MODELS

# Project Introduction: Purpose, Features, and Geographic Models

Developed for geography lessons and independent exploration: controlled-variable observations, comparisons across diagrams, support for different devices, spatial exploration of the Solar System, data sources, and model scope.

1. [Why This Project Was Developed](project-guide.en.html?lang=en#section-0)
2. [The Project’s Main Strengths](project-guide.en.html?lang=en#section-1)
3. [Across Devices: Both Diagrams and Controls Must Remain Usable](project-guide.en.html?lang=en#section-2)
4. [The Sun: Compare a Day, a Year, and Different Latitudes](project-guide.en.html?lang=en#section-3)
5. [The Moon: Distinguish Phase, Position, and Visibility](project-guide.en.html?lang=en#section-4)
6. [Looking Up: Build an Observer’s Sense of Direction](project-guide.en.html?lang=en#section-5)
7. [Shadows and Sundials: Direction, Length, and Timekeeping](project-guide.en.html?lang=en#section-6)
8. [The Analemma: Treat the Definition of Time as a Condition](project-guide.en.html?lang=en#section-7)
9. [The 3D Solar System: Add Spatial Context While Preserving Geographic Readouts](project-guide.en.html?lang=en#section-12)
10. [Geographic Data and Calculation Sources](project-guide.en.html?lang=en#section-8)
11. [Model Scope and Verification Findings](project-guide.en.html?lang=en#section-9)
12. [What Each of the Three Documents Addresses](project-guide.en.html?lang=en#section-10)
13. [Open Source, Resources, and Feedback](project-guide.en.html?lang=en#section-11)

Updated October 13, 2026. Checked against the production bilingual interface, current features and local model data. The original astronomical engine and model data remain unchanged.

## Why This Project Was Developed

Why does the Sun’s position change with the seasons? How are lunar phases related to moonrise and moonset? Why can a sundial not directly show the clock time on a phone? Static textbook diagrams can explain a phenomenon under particular conditions, but make it harder for learners to test what happens when those conditions change. Sky Motion Lab makes location, date, and time controllable variables, and brings the sky, day and night on Earth, shadows, and spatial relationships into diagrams that can be checked against one another.

The project is intended for geography classroom demonstrations, students’ independent investigations, and sky enthusiasts. Each observation should have a clear question, fixed conditions, a variable to change, and results to record: predict first, adjust the conditions, then check another diagram or readout, rather than simply watching an animation.

This introduction explains why the project is useful and what it can help you understand.[Learning Guide](guide.en.html?lang=en) provides complete observation steps;[Development Guide](development-guide.en.html?lang=en) records the current technical implementation, maintenance, and publishing process. Updated October 11, 2026.

## The Project’s Main Strengths

- **Make controlled-variable investigations practical:**Adjust date, time, latitude, and longitude separately. The Sun and Moon retain their own settings, and comparisons within a day are kept separate from comparisons across dates. The analemma’s idealized cause experiment is independent of the actual ephemeris.
- **Cross-check the same conditions across several diagrams:**The altitude curve, rise and set azimuths, Earth’s day and night, and Earth-axis relationships share observation conditions. The four-diagram comparison helps place an individual geographic question within the larger set of relationships.
- **Connect ground-level and spatial perspectives:**The existing Sun and Moon diagrams can be displayed alongside a synchronized 3D Sun–Earth–Moon scene. This preserves local altitude and azimuth readouts while allowing discussion of illumination and motion in space.
- **Connect the concepts to understandable timekeeping devices:**A vertical stick’s shadow, its tip’s path throughout the day, and horizontal and equatorial sundials make the relationships between the Sun’s direction, shadow length, and definitions of time observable.
- **Continue observing on different screens:**The diagram, timeline, and parameter area each have their own space. Wide screens allow adjustments alongside the diagram; narrow screens provide a sliding side menu for parameter changes before returning to the diagram and timeline.
- **Return easily to earlier conditions:**Use the browser’s Back button to undo mode changes, selections, and parameter adjustments, and Forward to redo them. Continuous slider adjustments are grouped into one step, and playback pauses when a previous state is restored.
- **Publish the data sources and limitations:**The time basis, geometric horizon, ephemeris sources, and illustrative scales are stated explicitly, so display proportions, processed images, and internal regression checks are not mistaken for measurements.

The website calculates locally in the browser. Its core libraries and resources are distributed with the static pages, with no required account, database, or live ephemeris service. It can be opened in a modern browser or previewed through a local static server; offline installation is not currently available.

## Across Devices: Both Diagrams and Controls Must Remain Usable

At widths above 760 pixels, the parameter sidebar is visible by default, with the diagram and time controls alongside it. Tablets are not forced into a drawer layout simply because they have a touchscreen. The sidebar scrolls independently and can be collapsed to enlarge the scene. At 760 pixels or below, a sliding side menu holds the parameters, while the diagram and timeline remain in the main view. Immersive 3D mode also places detailed parameters in a drawer.

Similar controls share alignment, corner radii, spacing, and selection feedback. Parameter rows place text on the left and switches on the right; long text may wrap without shrinking the control. Related-diagram links have equal spacing, with no extra gap before the sundial link. Nested disclosure controls sit after their sibling buttons and switches within the same section. Light parameter panels use dark text, while dark sky diagrams use light legends.

The timeline supports dragging, direct input, and small adjustments. Mouse, touch, and supported keyboard operations each have an entry point. Menus and selection controls use restrained spring-like feedback; when the operating system’s reduced-motion preference is enabled, they switch directly. Animation communicates interaction feedback only, while scientific readouts update immediately.

These are layout and interaction goals, not a guarantee of smooth performance on every device. Current layout checks primarily use Chromium automation; Safari, Firefox, and different GPUs still require testing on actual devices.

## The Sun: Compare a Day, a Year, and Different Latitudes

The Sun experiment separates apparent motion within a day from changes at the same time throughout the year, linking altitude, azimuth, declination, daylight duration, and shadows. Changing latitude and season lets you compare noon solar altitude, rise and set azimuths, polar day, and polar night. Actual-date observation and idealized declination experiments serve different purposes: observing real conditions and isolating a single factor.

Four diagrams—subsolar point and day/night, the daily altitude curve, sunrise and sunset azimuths, and Earth’s axis with the local horizontal plane—explain the same observation conditions. In the spherical Earth view, ‘Rotate view only’ preserves the location and physical instant. ‘Link observation location’ changes latitude and longitude while keeping local apparent solar time fixed, so the corresponding UTC and subsolar longitude may also change. Camera rotation is clearly distinguished from changes to geographic conditions.

## The Moon: Distinguish Phase, Position, and Visibility

Lunar phase is the shape of the Moon’s illuminated surface as seen from Earth; it is not Earth’s shadow covering the Moon. The Moon experiment separately presents phase geometry, illumination from day to day, sky position, and rise and set conditions. Observing successive dates at a fixed time and observing a single date throughout the day answer different questions.

The Moon’s daily path covers only local 00:00–24:00. Because the Moon is also moving along its orbit, the two endpoints are usually different. Planet–Moon comparisons use angular separation on the celestial sphere: apparent closeness does not imply closeness in physical space, nor does it guarantee visibility to the unaided eye.

The lunar-phase diagram explicitly shows parallel sunlight. The fixed-orientation geometric illustration is handled separately from the bright limb’s orientation in the local ‘Looking Up’ view. The latter is projected according to location, time, and viewing direction, rather than using a simplified rule that directly flips left and right in the Southern Hemisphere.

## Looking Up: Build an Observer’s Sense of Direction

The ground-level view places the 0° altitude horizon, zenith, viewing direction, and celestial positions in one scene. The directional reference disk and ground grid change as you turn, helping learners distinguish turning around from a celestial body moving.

The scene is an orthographic projection of the forward hemisphere. A path may end above the horizon because it reaches the field-of-view boundary or an endpoint of the day’s time interval. This does not mean a body falls onto the ground, and does not necessarily indicate an omitted segment. A geometric rise or set occurs when the body’s center crosses 0° altitude. Disk sizes aid identification, and plotting a planet’s direction during daylight does not mean it must be visible to the unaided eye.

## Shadows and Sundials: Direction, Length, and Timekeeping

Shadow calculations assume horizontal ground and a vertical stick. Shadow length changes with solar altitude, and its direction is opposite to the Sun’s horizontal component. Display magnification changes only the extent of the ground scene; readings in meters remain the lengths in the model. The stick-tip path throughout a day and the shadow-tip path at a fixed time throughout a year describe daily and annual changes respectively.

A sundial’s gnomon is parallel to Earth’s axis and must not be confused with the vertical stick used for shadow experiments. A horizontal sundial has a horizontal dial plate, with the gnomon elevated at an angle equal to the absolute value of the local latitude. An equatorial sundial’s plate is parallel to the equatorial plane, and its gnomon is perpendicular to the plate. The separate workbench provides device, dial-face, and installation views, with readouts and explanations synchronized to the current sundial type.

Conditions under which the sundial can be read are explained separately from nighttime, degeneration at the equator, or sunlight parallel to the dial plate. Sundials show local apparent solar time. A clock comparison with a specified UTC offset helps explain differences caused by longitude and the equation of time.

## The Analemma: Treat the Definition of Time as a Condition

An analemma shows the Sun’s position at the same location each day under the same definition of time. A fixed clock time usually produces the classic figure eight, with Earth’s axial tilt and orbital eccentricity both contributing. Fixing local apparent solar time removes the hour-angle oscillation caused by the equation of time, so the same curve should not be expected.

Actual-date mode provides annual positions and different projections. A separate idealized cause experiment lets you change tilt and eccentricity independently to investigate their contributions. These idealized parameters affect only this experiment and do not overwrite the main workbench’s actual ephemeris. Changing observation time preserves the camera view, so automatic recentering does not obscure positional differences.

## The 3D Solar System: Add Spatial Context While Preserving Geographic Readouts

The separate 3D sky module displays the eight planets and Sun–Earth–Moon relationships. You can rotate, zoom, select bodies, inspect close-up views, and explore historical paths. Original diagrams and their 3D comparisons share the parent page’s time controls: local apparent solar time is converted to the same UTC instant to drive the 3D scene, while camera changes leave observation conditions unchanged. The separate 3D page has its own UTC clock and can be paired with a top-down spatial view or local-sky reference.

Immersive view fills the viewport while keeping the date axis, playback, exit and parameter controls. It uses a page layout without requesting browser fullscreen. The background uses stellar directions, magnitudes and approximate colors from the HYG catalog. Planet surfaces, craters, cloud bands and Saturn’s rings aid recognition; apart from the retained Earth texture, added appearances are locally generated illustrations rather than measured terrain or current cloud imagery.

Immersive mode can show satellite populations, main-belt asteroids, periodic comets, and actual nebula imagery. Points of light avoid dense labels and change with their parent planet and perspective scaling. More compact satellite layouts aid observation but still use a teaching scale. Actual distance readouts, enlarged disks, and screen pixels must be distinguished. Nebulae retain their original imagery and sources; their processed multiband colors and enlarged background scale do not represent the unaided-eye view.

The Sun’s direction comes from the scientific model. The Sun–Earth–Moon scene uses the parallel-light approximation. Earth’s axis, equator, and a fixed ecliptic reference plane help identify illumination geometry; the subsolar point cannot be inferred to lie on the equator simply from its vertical position on screen. This page does not simulate eclipse occlusion.

[Enter the 3D Sky](space/index.en.html?lang=en) · [3D Observation Tasks](guide.en.html?lang=en#space) · [3D Technical Implementation](development-guide.en.html?lang=en#section-24)

## Geographic Data and Calculation Sources

| Data / Concept | Current Basis | How to Interpret It |
| --- | --- | --- |
| Actual-date ephemeris | Local Astronomy Engine 2.1.19; date range 1900–2100 | Calculates positions, illumination, and coordinates; it is not an observation forecast incorporating weather and terrain |
| Location and sky coordinates | Observation latitude and longitude; altitude and azimuth include horizon parallax | Altitude is 0° at the horizon and 90° at the zenith; azimuth is measured clockwise from true north |
| Main experiment time | Local apparent solar time, converted to UTC using longitude and the equation of time | Not the device’s time zone or a city’s legal clock time |
| Clock-time experiment | An explicitly specified fixed UTC offset | Does not automatically handle regional daylight-saving time |
| Stellar background | HYG 4.1; 8,920 stars in the standard background and 61,816 in the immersive background, using J2000 directions | Retains magnitude and approximate B−V colors; does not add proper motion, annual parallax, or local horizon occlusion |
| Satellites and small bodies | The current local snapshot contains 455 satellite orbits, 1,200 main-belt asteroids, and 12 periodic comets | Catalog coverage is not the current total number of discoveries; most orbits use fixed mean-element approximations |
| Nebula imagery | Local NASA-sourced images with complete source metadata | Processed colors and enlarged angular scales are documented; the images do not participate in Solar System ephemeris calculations |

Noon solar altitude, day and night, and shadow length must be understood together with location, date, and the time basis. Equinox and solstice labels follow Northern Hemisphere conventions; seasons are reversed in the Southern Hemisphere. Azimuth can be sensitive or non-unique near the poles and zenith.

## Model Scope and Verification Findings

Rise and set are calculated when the geometric center of a body crosses the 0° horizon. Time above the horizon is measured using the actual UTC interval. Atmospheric refraction, apparent angular radius, elevation, terrain, and weather are not currently included. Results must therefore not be treated as precise forecasts of visually observed sunrise or moonrise, and no universal ‘five minutes earlier or later’ correction is applied.

Distances between planets in 3D are compressed, while sphere and satellite-point sizes are scaled separately for display. Ground-level shadow paths and the unit celestial sphere also use different scales. The Moon’s texture is an appearance illustration, without actual lunar surface orientation, libration, or solar and lunar eclipse occlusion. Nebulae and faint-star backgrounds do not represent real observational limits.

On October 11, 2026, six sets of repository model regressions were rerun, covering planetary and lunar vectors, Earth’s orientation, the stellar catalog, satellite and small-body orbits, local sky positions, and historical paths. All passed internal-consistency and input-boundary assertions. Control checks on the same day covered nine pages at four widths and verified first-opening height, click behavior, and keyboard behavior. These checks are not certification of independently measured accuracy or compatibility with every device.

Earlier comparisons with the Meeus/NOAA approximate solar formulas and USNO lunar-phase data are historical sample records; not all have been converted into reproducible scripts. Their differences are not extended into an accuracy guarantee for every date. Reproducible commands, historical evidence, and remaining checks are collected in [the verification section of the Development Guide](development-guide.en.html?lang=en#section-20)。

## What Each of the Three Documents Addresses

| Document | The Reader’s Question | Scope |
| --- | --- | --- |
| [Learning Guide](guide.en.html?lang=en) | Where to enter, how to adjust, what to hold fixed, and what to observe | Detailed instructions, task sheets, observation records, and common questions |
| [Project Overview](project-guide.en.html?lang=en) | Why it was developed, what its strengths are, and how its results should be used | Purpose, capabilities, support for different devices, data sources, and model scope |
| [Development Guide](development-guide.en.html?lang=en) | How it is implemented, verified, maintained, and published | Source-code responsibilities, state, time, calculation, rendering, interaction, tests, and deployment |

Development details and bug fixes are organized by implementation topic. This introduction does not repeat the complete operating instructions or present the homepage’s interactive star field as a principal teaching capability.

## Open Source, Resources, and Feedback

The original application code is licensed under [GNU AGPLv3](LICENSE)(AGPL-3.0-only), which permits commercial use. Distribution and modified versions offering interactive network services must provide the corresponding source code and applicable notices as required by the license. Section 13 requires modified network services to clearly offer remote users an opportunity to obtain the corresponding source code.[View the Source on GitHub](https://github.com/qingzhuernest/skymotion). For the scope of licensing, see [NOTICE](NOTICE); third-party libraries, data, fonts, and imagery retain their original licenses. See [Third-Party Notices](THIRD-PARTY-NOTICES.md)。

- [NASA：Moon Phases](https://science.nasa.gov/moon/moon-phases/)
- [NOAA: Solar Calculation Algorithm Details](https://gml.noaa.gov/grad/solcalc/calcdetails.html)
- [USNO: Primary Lunar Phases for 2026](https://aa.usno.navy.mil/api/moon/phases/year?year=2026)
- [Astronomy Engine: Models and Documentation](https://github.com/cosinekitty/astronomy)

Interaction references include [Helios](https://github.com/joaopedroalbq/helios)、[Analemma](https://github.com/benlansdell/analemma) and [RotatingSky](https://github.com/OpenLyceum/RotatingSky); citing an interaction reference does not mean adopting all of its calculation models. The NOAA link here points to its publicly available algorithm description.

The production site is [Cloudflare Pages](https://skymotion-5md.pages.dev/), with an identical-content mirror at [GitHub Pages](https://qingzhuernest.github.io/skymotion/); pushes to main trigger publication to both. Teaching questions, feature suggestions, and bugs can be reported through [Contact the Author](contact.en.html?lang=en) or [GitHub Issue](https://github.com/qingzhuernest/skymotion/issues). Please include the module, location, date, time, reproduction steps, and browser information.

## Review follow-up: history recovery, generated-page freshness and language retry

Browser-history snapshots use the same date, range and choice validation as session data. Failed or incompatible snapshots fall back to the current valid state. A generation-aware finally releases the restoration lock so one failure cannot block subsequent undo. Camera state retains the original history boundaries.

Bilingual tests check both structure and generated-output freshness. python3 scripts/prerender-pages.py --check compares English HTML, language-data.js and the preload manifest without writing files. Forgetting to regenerate after source, dictionary or asset changes fails CI. Run the normal generator and synchronize document downloads before checking again.

If the target font or language resources fail during a language switch, a visible white status notice offers a retry for the requested language. Successful retry preserves dates, location and experiment parameters and removes the notice. Failure does not silently change fonts or reset the experiment. The current deployment gate includes all root-level regression scripts.

## October 14, 2026: Session Recovery and Release Gates

Invalid dates, out-of-range numbers, wrong field types and unknown choices in a cached session fall back to their respective defaults. Valid observation settings remain unchanged. Unversioned legacy sessions remain readable and subsequent saves use schemaVersion 1. If browser storage is blocked or its quota is exceeded, a memory snapshot supports the current page; it cannot guarantee persistence after closing the page or navigating elsewhere.

Laboratory and 3D pages read experiment sessions through experiment-storage.js. Each laboratory field is validated, including coordinates, time, date, view, scale and idealized parameters. Restored experiments remain paused, and solar declination is recomputed from the date in ephemeris mode. Unknown session versions are not applied. This change does not alter astronomical formulas, scientific readings or colors.

Both production deployment workflows depend on the shared validate.yml workflow. It installs a pinned Playwright version and Chromium and runs all root-level .cjs scripts at the tests root, covering models, history, controls, fonts, bilingual structure, corrupted-session recovery and packaging. Any failed test blocks that workflow’s deployment. Test tools are used only for maintenance and CI; they are not shipped with the website and do not change its buildless runtime.

## Production release notes — October 13, 2026

This release unifies light control surfaces, serif typography and supporting actions, and provides 24 static Chinese and English pages. Language switching preserves experiment state. Spring menu transitions respect reduced-motion preferences. The calendar supports month/year selection, leap years, confirm and cancel. Original astronomy calculations, ephemerides, model data and scientific limitations remain unchanged.

Release checks cover six model suites, 36 control-layout cases, 44 first-disclosure cases, interaction history, font timeout recovery, language navigation, calendar and keyboard operations, and packaging at root and GitHub project paths. Checks primarily use Chromium automation and do not certify every Safari, Firefox or GPU configuration.

Cloudflare Pages is the production site, with the same content mirrored on GitHub Pages. A push to main triggers two separate workflows; maintainers should check both outcomes. The previous production version is retained under the production-before-impeccable-20261013 tag. To roll back, create a restoration commit from that tag rather than rewriting main history.

## Custom layout

My workspace in the Sun’s Linked Diagrams supports one to four views, side-by-side or stacked arrangements, and a three-view layout with one main diagram. Choosing a diagram already on screen swaps positions. Drag a grip to reorder or a divider to resize after release. Focus a diagram for a closer look and press Esc to return. Undo and redo layout changes, and save up to five named combinations. Phones use tabs; reorder them in Layout & saved views. Saved combinations contain only the layout, preserving dates, location and scientific parameters. Standard view restores the original arrangement.

In Layout & saved views, choose a diagram to add, make a diagram the main view, or equalize proportions. All these changes can be undone.

Saved layouts support renaming, updating from the current workspace, and undoing changes. A Current layout marker identifies matching arrangements. On desktop, enter column or row proportions from 30% to 70%; the canvas updates only after committing the value.


## Unified object workbench and compatibility

Customization preserves the baseline location, date, time and view. Cities and times use the existing shared references, identified by source and object ID. Existing save formats remain valid; objects are not copied and astronomical formulae do not change.

New controls retain the site typography, colors and radii. Light sidebars and dark plot actions stay consistent with their regions. Adding, selecting, editing, saving and returning to the original plot are checked on desktop, tablet and phone sizes; Chromium checks do not replace Safari device testing.
