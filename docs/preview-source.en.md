# SkyMotion — bilingual astronomy laboratory

The production release includes the reviewed bilingual Impeccable interface. [Cloudflare Pages](https://skymotion-5md.pages.dev/) is the primary site; [GitHub Pages](https://qingzhuernest.github.io/skymotion/) mirrors the same tracked content. Pushing `main` triggers both deployment workflows. Other branches do not deploy production, including manual runs.

The astronomy engine, ephemerides and scientific models retain the production implementation. The interface adds unified serif typography and color tokens, English Charter fonts, state-preserving language switching, twelve generated English pages, and idle browser caching of twenty-four HTML pages.

## Run locally

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000/`. English pages use sibling filenames such as `lab.en.html` and `space/index.en.html`.

## Regenerate English pages

```sh
python3 scripts/prerender-pages.py
```

Edit the Chinese HTML and `i18n-*.json` dictionaries, then regenerate the English HTML, `language-data.js`, and `page-cache-manifest.json`. Generated pages preserve IDs, form values, numerical attributes and scientific scripts.

## Documentation and license

- [Learning guide](learning-guide.md) · [English](learning-guide.en.md)
- [Project introduction](project-guide.md) · [English](project-guide.en.md)
- [Development guide](development-guide.md) · [English](development-guide.en.md)
- Application: [AGPLv3](LICENSE). Font, image and library licenses: [third-party notices](THIRD-PARTY-NOTICES.md).

The repository does not include GPT Site hosting configuration, temporary credentials, review screenshots or local plugin installations.

## Review regressions

With a local server running and Playwright available, run `node tests/review-regressions.cjs`. Optional `SKY_MOTION_TEST_URL`, `SKY_MOTION_PLAYWRIGHT` and `SKY_MOTION_CHROMIUM` select the test server, module and browser executable. The suite covers stalled-font recovery and retry, explicit-language navigation, calendar month/year values, leap-day clamping, browser undo and keyboard focus at phone/tablet widths.

## Release and rollback — October 13, 2026

Core astronomy libraries and model data are unchanged from production baseline `4390ab1`. UI checks cover 36 control layouts, 44 first disclosures, interaction history, language navigation, font timeout recovery and calendar keyboard use. These are primarily Chromium checks; complete Safari/Firefox and GPU certification remains outside the verified scope.

Regenerate English pages after editing Chinese HTML or dictionaries. Keep all three Chinese and English Markdown downloads synchronized with the reading pages. Font readiness has an eight-second timeout and explicit retry. Cache warming starts after the foreground page is ready, using two low-priority requests; this is not an offline application or a guarantee that all pages are cached immediately.

The previous production commit is tagged `production-before-impeccable-20261013`. Restore it with a new commit if necessary; do not force-push main. Check both deployment workflows before calling the release successful. `tests/deployment-paths.cjs` validates root and GitHub project-path packaging.

## Session hardening and automated deployment gates — October 14, 2026

`experiment-storage.js` validates persisted dates, ranges, types and enumerated choices before restoring laboratory state. Valid legacy sessions remain readable; saves use `schemaVersion: 1`. Invalid fields use defaults, and unknown versions are ignored. Blocked or quota-limited storage falls back to a detached memory snapshot for the current page only. The 3D observer uses the same date and coordinate validation.

Both production workflows require `.github/workflows/validate.yml` to pass before deployment. It installs the locked CI-only Playwright/Chromium tools under `tests/browser`, starts a disposable local server and runs all 15 root-level `.cjs` suites. No browser tools or test source are packaged into the static site.

To run the same gate locally with Node 22+, Python 3 and installed Chromium:

```sh
npm ci --prefix tests/browser
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" SKY_MOTION_CHROMIUM=/usr/bin/chromium node .github/scripts/verify-site.cjs
```

For systems without Chromium, install it with `tests/browser/node_modules/.bin/playwright install --with-deps chromium` and set `SKY_MOTION_CHROMIUM` to the executable path returned by Playwright. Browser regressions primarily verify Chromium; they are not a complete real-device compatibility certification.

## Review follow-up — October 14, 2026

Historical snapshots are validated before restoration; incompatible entries use a valid fallback, and a generation-aware finally releases the undo lock. Language-switch failures display a visible, localized notice with a retry for the target language. Bilingual CI now checks generated-output freshness as well as structure; run `python3 scripts/prerender-pages.py --check` for a read-only check of English HTML, the dictionary bundle and preload manifest. `tests/review-followup.cjs` covers corruption, adapter failure, mobile retry and stale generation; production gates run all 15 suites.

## Welcome reflections — October 14, 2026

The Chinese welcome page keeps its original handwritten footer. English mode displays the supplied reflection, “Everyone here wants to understand something. What matters is whether you can stay curious when the answers don't come.”, at that same centered bottom position. Both use the existing warm night palette; English uses local Charter. These are locale-specific reflections rather than translations of each other. The sentence no longer appears below the entry action, and the welcome page requires only its selected locale's normal font preparation.

## GPT Site 预览：图内自定义与实验搭建（2026-10-17）

原有图解右下角有“图内自定义”。地球图可放观察点、经纬线和光线；曲线图可加日期对照、参考线及差值测量；升落图可比较日期与遮挡角；地轴图可添加观察者、参考圈、方向及夹角，开关原图参考面。月相关系可保存相位快照、视线和光线；行星伴月可记录日期位置、轨迹及角距离；地升地落可放固定月面站和绕月参考点；日行迹可比较地点与时刻；三维太阳系可添加平面、AU 距离、日心夹角及保存观察相机。每张图的参考对象可撤销、复制、删除、隐藏、保存到本设备或导出 JSON。

“搭建实验”支持杆、球、圈、平面、刻度盘、观察站、标记和文字。可以多选并沿圆周、等距或对齐排列，设置倾斜、离地高度、保持竖直及贴地约束，记录影尖和移动轨迹，测量距离、角度、方位、影长，冻结 A 场景及其条件后与当前 B 场景比较。手机通过 A/B 切换查看。

太阳和月球均有“我的工作区”，分别保存图解组合。相机移动与真实观察位置分开；参考图形采用原图投影，三维显示尺寸仍为示意，行星距离使用真实 AU。参考对象不模拟相互遮光；这些是教学工具，不是仪器精度认证。本轮仅更新 GPT Site，正式网站不变。

English: Existing plots now expose **Customize plot** for scientific reference objects, dated curves/snapshots, observations, trails, physical measurements, notes, and saved cameras. Tools use each plot's own projection and retain its experiment conditions. Sun and Moon have independent **My workspace** compositions. References support undo/redo, duplication, visibility, local saving and JSON export.

**Build experiment** supports rods, spheres, circles, planes, angular dials, observer stations, markers and notes; multi-selection; circular/even/aligned placement; tilt/elevation and upright/ground constraints; distance/angle/bearing/shadow measurements; daily shadow and movement trails; and a frozen A scene with its conditions alongside the current B scene. Mobile uses an A/B switch. Mutual object occlusion is not modeled. The GPT Site preview is updated separately from production hosting.

## GPT Site preview hardening — 2026-10-17

第 52 版针对上一轮审查修复：冻结对照恢复时完整验证日期、时刻、经纬度与理想赤纬，无效对照不会丢失有效物体；原图工具支持 Enter 放置、Esc 取消和“放在图中”按钮；重选对象立即刷新读数。默认复制名称在语言切换及恢复时保持双语，个人说明保留原文。参考日期统一使用共享的 1900–2100 真实日期校验。手机关键工具按钮和可见性标签的触摸区域至少为 44px。

Version 52 validates frozen reference conditions without discarding valid objects, restores selected-object readouts, keeps copied default names localized (including legacy copies), and uses the shared 1900–2100 date validator. Plot placement supports Enter, Escape and an explicit placement action. Mobile tool buttons and visibility-label targets are at least 44px. These changes remain isolated to the GPT Site preview; production hosting is unchanged. `tests/customization-hardening.cjs` covers these regressions, including invalid conditions, leap days, bilingual migration, preserved personal text, 3D placement and mobile targets.

## Direct editing preview — 2026-10-17

第 53 版：打开图内自定义后，可直接拖动文字说明、重点圈、地球昼夜图的观察点/光线点和高度曲线的时间标记；其余对象继续使用属性编辑。拖动手柄随所选对象显示，每次拖动作为一次撤销记录，Esc、失去指针捕获、窗口失焦或切换图解会取消未完成拖动。参考对象移动不改变真实实验地点，关闭编辑器后原图手势继续可用。

属性面板支持收起，收起时保留选中读数和保存状态。编辑字段后不会重建整个表单，Tab 可以连续进入下一项；重新打开面板会恢复本次页面会话中的选择，并显示真实的未保存状态。支持在画布/编辑器内使用 Ctrl/Cmd+Z 与 Shift+Ctrl/Cmd+Z 撤销/重做，文本输入保留浏览器自己的编辑快捷键。

Version 53 adds direct dragging for notes, highlight circles, Earth daylight observer/ray points and altitude-chart time markers. Each gesture is one undo transaction; Escape, lost capture, window blur or diagram switching cancels an unfinished drag. Other references remain editable through their properties. Scientific observer inputs and native gestures outside reference editing are preserved.

The collapsible editor retains the selected result and save status. Field edits preserve DOM focus and Tab order; reopening restores the session selection and draft status. Scoped Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z undo/redo leave text-field shortcuts native. `tests/diagram-editing.cjs` covers mouse/touch dragging, rollback, independent observer inputs, native selection, focus order, compact controls and saved/draft feedback. Production hosting remains unchanged.

## Reference interaction checks — 2026-10-17

第 54 版修复图内工具的操作反馈：键盘切换显隐不丢焦点；非法日期和空数值阻止保存、导出与复制，保留最后有效数据并聚焦错误字段；空列表与满 40 个对象都有说明，无选择时禁用复制/删除，满额时禁用添加，删除后恢复。自动副本编号不重复，复制文字和重点圈优先放在附近空位。

参考拖动中加入第二根手指会回滚本次编辑，并接管该次手势的剩余指针，结束后可继续正常拖动。收起面板时，如果仍处于放置状态，放置说明与按钮依然可见。新增 `tests/diagram-flows.cjs` 覆盖键盘焦点、非法保存/导出、数值空值、复制编号/位置、满额恢复、真实多指中断、后续拖动和紧凑放置。

Version 54 preserves keyboard focus during visibility changes; blocks save/export/copy on invalid fields; retains valid data and focuses the error; and provides explicit empty/limit/disabled states. Default copies receive unique numbers, while notes and highlight circles use nearby free positions. A second finger during reference dragging cancels that transaction and safely finishes the owned gesture. Compact placement keeps its instructions and action visible. The new interaction-flow regression covers these cases. This remains a GPT Site preview update, separate from production hosting.

三维图中的参考文字即使覆盖行星标签，也能在编辑模式直接拖动；关闭编辑器后原行星标签恢复正常选择。参考文字按画布宽度放置，超长文字在图中省略显示，完整内容仍保留在属性中。复制文字按实际字宽检查附近空间。`tests/diagram-overlay-gestures.cjs` 专项验证真实行星按钮上的触摸拖动、相机/选择不变以及关闭编辑后的原生行为。

In 3D, reference notes remain draggable over native planet labels without changing camera or selection; closing the editor restores native planet actions. Annotation text stays within the canvas, with long display text ellipsized while full personal text is retained in properties. Copy placement accounts for measured text width. The overlay-gesture suite verifies these interactions with real touch events.

## Reference editing modes — 2026-10-17

第 55 版增加“编辑参考 / 观察图解”切换，收起面板时仍能操作。编辑模式可拖动或聚焦画布用方向键微调可移动参考；Shift 加速，连续按键作为一次撤销，Esc 可回滚尚未结束的按键调整。观察模式把图面手势交给原图，参考对象保持不动。添加新参考会回到编辑模式。

可移动参考新增位置锁定，禁止位置输入、拖动和方向键移动，但仍可改名、调整非位置属性或删除；锁定状态随本地存档/导出恢复，副本默认解锁。编辑器内 Ctrl/Cmd+S 可保存当前内容，包括尚未失焦的输入，并继续使用错误校验；画布上的 Delete/Backspace 删除所选参考，可撤销。快捷键仅作用于当前编辑器/画布，文本字段保留原生编辑行为。

Version 55 adds Edit references / Explore plot modes, available even in the compact panel. Arrows precisely move supported references; Shift increases the step. Held keys form one undo transaction, and Escape rolls back an unfinished nudge. Explore restores the plot's own gestures without moving references; adding a reference returns to Edit.

Position locks prevent dragging, nudging and position-field edits while retaining rename/non-position controls and deletion. Locks persist with saved references; copies are unlocked. Scoped Ctrl/Cmd+S validates and commits the active input before saving. Delete/Backspace removes a selected canvas reference with undo support; text fields keep native shortcuts. `tests/diagram-modes.cjs` covers mode isolation, grouped nudges, cancellation, locks, unblurred saves, deletion/undo, persistence and compact mobile access. Production hosting remains unchanged.

## 自定义工作台重设计 / Reference workbench — preview 56

本版重新组织图内自定义：桌面停靠在参数区，手机使用底部工作台；“添加 / 对象 / 文件”分开工具发现、属性调整与备份管理。添加后直接显示属性，保存按钮固定。编辑/观察、直接拖动、位置锁定、键盘微调和撤销/重做继续可用。常用参考组合按一条历史记录添加，同类对象自动编号，并可调整叠放顺序。

“保存”仅写入当前设备；“导出”生成 JSON。“导入 JSON”先读取，再选择合并或替换，匹配图解和天体，最多 40 个对象、文件不超过 200 KB。导入重新分配对象 ID，校验数值/日期/相机字段；不支持的对象略过并明确提示。清空需再次确认，仍可撤销。观测地点、日期、真实模型和既有实验搭建区不随参考编辑改变。

The redesigned reference workbench docks over the desktop parameter rail and becomes a mobile bottom sheet. Add / Objects / Files separate discovery, editing and backup. New references reveal their inspector immediately; Save stays accessible. Existing direct manipulation, locks, keyboard nudges, Edit/Explore modes and history remain. Useful reference sets undo in one step; repeated types receive numbered names, with front/back ordering controls.

Save is device-local. Export downloads JSON. Import stages a matching diagram/body file for explicit merge or replacement (40 references, 200 KB maximum), assigns fresh IDs and sanitizes fields. Unsupported objects are reported. Clear asks for confirmation and is undoable. Reference editing preserves scientific observation conditions and the existing physical-object builder. Only GPT Site preview is updated; production hosting is unchanged.

`tests/diagram-workbench.cjs` checks canvas clearance, recipes/history, distinct names, layer order, JSON round-trip/merge/replace/rejection, confirmed clearing, placement cancellation, independent observations and mobile inspector access. Existing interaction suites follow the real Add-tab navigation through `tests/diagram-test-helpers.cjs`, retaining scientific and gesture assertions. Validation uses Chromium automation, without claiming Safari real-device certification.

## 连续编辑与错误恢复 / Editing continuity — preview 57

修复手机上校验错误字段被遮在工作台滚动区外、撤销删除后未恢复属性选择的问题。错误就地显示且会露出对应输入；修正后解除错误标记。Enter 可应用单行输入，输入法组合期间的取消不会关闭工作台。

撤销/重做恢复对象及选中状态；删除选择邻近对象。标签页、重新打开面板及太阳/月球切换保留各自的编辑位置。表单重建不把内容滚动回顶部。`tests/diagram-continuity.cjs` 覆盖错误可见性、页面不跳动、Enter/焦点、历史选择、滚动恢复、输入法及天体上下文隔离。原图手势、数值读数、文件与触屏回归继续保留。

Fixes hidden validation fields on mobile and missing inspector selection after undoing deletion. Inline errors reveal the relevant field within the workbench; corrections remove stale error state. Enter applies single-line inputs without losing focus, while IME composition keeps native key handling. Undo/redo restores selection; deletion selects an adjacent reference. Tabs, reopening and Sun/Moon switching retain their own editing position. The continuity suite covers these paths alongside existing scientific, gesture, file and mobile regressions. GPT Site preview only; production hosting is unchanged.

## 桌面对象导航 / Desktop reference navigation — preview 58

桌面端对象列表保持可见，属性独立滚动，选择项自动露出；固定底栏提供保存、复制和删除，操作提示可按需展开。手机和较短窗口保留原有滚动方式。列表支持 ↑↓、Home/End、Enter；Esc 从属性返回列表，再从列表返回图面。Ctrl/Cmd+D 复制，列表的 Delete/Backspace 删除；复制/删除/撤销后保持有效焦点，文字输入不接管这些快捷键。

Desktop keeps the object navigator in view while properties scroll independently. The footer always offers Save, Duplicate and Delete; Help expands the full instructions. Phones and short windows retain their continuous layout. Arrows/Home/End navigate the list, Enter edits, and Escape returns through list to plot. Scoped duplicate/delete shortcuts preserve keyboard continuity after rebuilding rows. `tests/diagram-desktop.cjs` checks 1440×1000 and 1366×768 layouts, canvas clearance, visibility, keyboard/focus, history, contextual help and error recovery. GPT Site preview only; official production hosting is unchanged.

## 待验收预览 / Review candidate — preview 59

本版仅发布到 GPT Site，正式站等待用户看过后明确批准。工作台不再扩展新功能，重点修复长说明贴近画布边缘时拖动/微调无响应的问题，保留撤销与取消的精确恢复；新建对象与存档恢复的默认字段保持一致。`tests/diagram-release-candidate.cjs` 验证贴边移动、中英文切换时个人文字保留、窗口尺寸切换后的焦点、保存重载，以及存储被拒绝时仍能导出。

This candidate is published only to GPT Site. Official production release awaits explicit approval after review. The workbench feature scope is held stable while correcting edge-clamped text movement and aligning newly created defaults with restored references. The release-candidate suite covers drag/nudge and rollback at edges, language-preserved personal text, responsive focus, persistence, and export recovery when device storage is denied. Existing suites retain scientific and native-gesture checks. Chromium automation does not certify Safari hardware.

工作台打开时，当前图角的重复入口会隐藏，避免压住贴边说明；关闭后恢复入口与焦点。The redundant plot launcher hides while editing and restores with keyboard focus on close.

## 地理与数值边界 / Scientific reference boundaries — preview 60

本轮修复参考时间点高度角的插值偏差、短升落窗口漏检、时间取整产生 60 分钟，以及方位展开接缝上的参考轨迹伪连线。增加极昼/极夜、赤道接近天顶、地平相切、日界附近短窗口、闰年及年度轨迹缓存验证。`tests/diagram-geography.cjs` 包含可独立求解的数值边界、原天文计算一致性及绘图分段检查；不等于外部历书或 Safari 真机精度认证。

Reference instants use native altitude calculations. Event sampling refines extrema to detect short visibility intervals and excludes tangencies; rounded clock values carry into the next hour. Azimuth trails split at the projection seam. Annual-reference caching ignores playback/current-day changes while retaining all scientific dependencies. The geography suite covers equator/poles, polar day/night, tangencies, day-boundary windows, leap years, native-calculation agreement and rendering seams. No external-almanac accuracy or Safari hardware certification is claimed. Official release remains pending explicit user approval; GPT Site only is updated.

同时修复参考标签在天顶附近被绘图区边界截断的问题；个人说明保留全画布定位。Scientific-reference labels now remain inside plot clipping bounds, while personal notes keep full-canvas placement.

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

实验台在语言旁提供统一自定义开关，保留四个原视角、地点参数与共享时间栏。城市自动参与天空和关联图解对照；天空／高度图的时间标记跨原图显示，同地不同时间不必另开页面。内部导航一次延续编辑状态，会话草稿跨页保留，刷新默认正常模式。实验台添加工具可进入摆放实验物体，点击原视角返回。对象行“···”提供保存、复制、删除。仅发布 GPT Site 预览，正式网站未更新。

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
