# 开发者文档：架构、变量与模型

根据当前源码解释文件职责、所有共享状态字段、单位与枚举、天文计算、工作区对象、存储恢复、双语生成、测试和部署。

- [整体实现与阅读顺序](development-guide.html#architecture)
- [从输入到图形的数据流](development-guide.html#dataflow)
- [共享科学状态的完整变量表](development-guide.html#state)
- [单位、角度与空值约定](development-guide.html#units)
- [时间管线与日期换算](development-guide.html#time)
- [当地坐标、太阳公式与地轴关系](development-guide.html#coordinates)
- [升落、昼长与反求日期](development-guide.html#events)
- [日影、平面相交与日晷](development-guide.html#shadows)
- [日行迹数据结构与理想模型](development-guide.html#analemma)
- [月球星历、月相与独立地升模型](development-guide.html#lunar)
- [三维物理向量、显示尺度与相机](development-guide.html#space)
- [工作区、布局与菜单状态](development-guide.html#workspace)
- [参考对象、身份与跨图选中](development-guide.html#references)
- [地面场景与物体变量](development-guide.html#builder)
- [存储格式、完整实验与恢复](development-guide.html#persistence)
- [历史、手势与异步任务](development-guide.html#history)
- [设计变量、可访问性与多端](development-guide.html#design)
- [文档与语言生成管线](development-guide.html#documentation)
- [本地开发、验证与提交](development-guide.html#development)
- [正式站、镜像与打包](development-guide.html#deployment)
- [数据、影像、库与许可](development-guide.html#sources)
- [源码职责与函数索引](development-guide.html#source-index)

## 整体实现与阅读顺序

项目是无运行时构建的静态站：HTML提供控件与语义结构，普通defer脚本按顺序加载，Canvas 2D绘制当地科学图，Three.js/WebGL绘制独立三维场景。Astronomy Engine提供真实日期天体计算，理想实验使用本项目的明确几何公式。

1. 先读app.js的初值和solar函数，再读moon.js的时间换算和skyRaw。
2. 再读page-navigation.js、workbench-menu.js与custom-layout.js，理解单套画布怎样在单图与组合间移动。
3. 对象编辑读diagram-tools.js及其定义；跨图城市读observer-comparison.js；地面物体读scene-builder.js。
4. 最后读持久化、历史、语言生成、三维嵌入及验证脚本。

下方变量表覆盖全部共享初始状态字段和各子系统的核心数据结构；公式解释计算局部变量的含义。源码索引列出文件职责和声明函数，供继续追到具体作用域。它不是把每个循环计数器都当成公共接口。

页面路径、主导航、视图名称、分组和可用条件统一定义在site-catalog.json；lab-state.json统一定义状态初值、范围、枚举和相机字段。scripts/site_sources.py校验这些数据并生成启动脚本和状态模块的标记区段，禁止直接修改生成区段。

## 从输入到图形的数据流

1. 原生输入或滑条先验证数值、提交到state，停止不适用的播放；自定义对象则写入对应source与body的对象存储。
2. schedule只请求后续绘制；motion.js按播放、相机变化或明确失效条件决定是否保留requestAnimationFrame。
3. 渲染协调器更新UI、选择当前图和visibleIds，计算当前天体与参考样本，再绘制可见且有尺寸的画布。
4. 尺寸变化由布局与ResizeObserver处理；布局拖动先预览，松手后更新实际画布尺寸。
5. 历史、草稿与收藏记录明确的快照；恢复必须验证字段，暂停播放并解除恢复锁，不能留下半恢复状态。

| 层 | 拥有的状态 | 不应负责 |
| --- | --- | --- |
| 科学状态 | 地点、日期、真太阳时、模型选项 | 相机动画与CSS颜色 |
| 展示状态 | 当前图位、排列、比例、相机与展开项 | 凭画面操作伪造天文方位 |
| 参考对象 | 对象身份、所属源、参数、显隐与锁定 | 未经明确操作就移动基准地点 |
| 持久化 | 版本化序列化、验证与失败回退 | 把无效缓存直接赋给全部state |

prepareObservationState负责每帧呈现前的模型联动和派生值更新。workbench-menu.js只组织与显示菜单；lab-controls.js集中处理输入和表单展示。对象字段的整理与校验由diagram-tool-definitions.js提供，编辑器调用该接口，避免保存与显示各自解释对象。

## 共享科学状态的完整变量表

initialSun是太阳默认状态；initialMoon继承它并覆盖月球字段。modeStates.sun与modeStates.moon分别保留模式状态，state指向当前活动对象。切换天体应切换该引用，而不是把两种天体的播放设置混写。

> 表中的默认日期是科学场景示例，不是发布说明。初值读取lab-state.json的统一状态定义；添加新共享字段而未补充释义，会使文档生成检查失败。

| 变量 | 含义与作用 | 单位或取值 | 源码初值 |
| --- | --- | --- | --- |
| body | 当前天体模式，决定采用太阳还是月球状态与控件 | sun 或 moon | Sun: "sun"; Moon: "moon" |
| lat | 基准观察者纬度，北正南负 | 角度，−90至90 | Sun: 39.9 |
| lon | 基准观察者经度，东正西负 | 角度，−180至180 | Sun: 116.4 |
| dec | 太阳赤纬；真实日期模式重算，理想模式直接控制 | 角度，通常−23.44至23.44 | Sun: 23.44 |
| time | 当前当地真太阳时，按午夜后分钟计 | 分钟，0至1440 | Sun: 720; Moon: 1200 |
| date | 当前科学观测日期，不是发布日期 | 有效YYYY-MM-DD，1900—2100年 | Sun: "2026-06-21" |
| manual | 是否直接使用理想太阳赤纬 | 布尔值 | Sun: false |
| view | 天空画布的观察投影 | orbit、top、horizon、observer | Sun: "orbit" |
| observerAz | 仰望观察者面朝的方位 | 角度，北起顺时针 | Sun: 180 |
| yaw | 天空相机水平转角，不是地理经度 | 弧度 | Sun: -0.55 |
| pitch | 天空相机俯仰，不是地理纬度 | 弧度 | Sun: 0.38 |
| zoom | 天空视图的显示缩放 | 无量纲倍率 | Sun: 1 |
| playing | 公共实验播放是否进行；恢复时关闭 | 布尔值 | Sun: false |
| track | 是否显示日轨迹 | 布尔值 | Sun: true |
| shadow | 是否显示杆影 | 布尔值 | Sun: true |
| shadowZoom | 日影显示倍率，不改变真实影长 | 倍率1、2、4、8、16 | Sun: 4 |
| shadowTrace | 是否显示影尖轨迹 | 布尔值 | Sun: false |
| sundialOffset | 日晷钟表时解释使用的固定UTC偏移 | 小时 | Sun: 8 |
| solarDateMode | 太阳播放是否以跨日期为主 | 布尔值 | Sun: false |
| solarDateRate | 太阳逐日播放速率 | 模拟日/真实秒 | Sun: 3 |
| solarDateLoop | 太阳日期播放是否循环 | 布尔值 | Sun: true |
| solarDateTrail | 是否保留太阳年度播放轨迹 | 布尔值 | Sun: true |
| solarDateLink | 太阳逐日观察是否使用其联动规则 | 布尔值 | Sun: true |
| solarDateLinkBackup | 切换日期联动前的日行迹设置备份 | 对象或null，临时恢复数据 | Sun: null |
| compare | 是否叠加理想两至/分日模型 | 布尔值 | Sun: false |
| angles | 是否显示角度辅助线 | 布尔值 | Sun: true |
| height | 基准竖杆高度 | 米，控件范围0.1至10 | Sun: 1 |
| speed | 日内播放的时间推进速度 | 模拟分钟/真实秒 | Sun: 60 |
| loop | 日内播放是否循环 | 布尔值 | Sun: true |
| daysRate | 月球按日期播放的速度 | 模拟日/真实秒 | Sun: 1 |
| monthLoop | 月球日期播放是否在其月范围内循环 | 布尔值 | Sun: true |
| place | 城市预设的坐标值或custom | 字符串，必须与经纬度一致 | Sun: "39.9,116.4" |
| earthView | 地球采用球面还是平面地图 | globe 或 map | Sun: "globe" |
| globeDragMode | 拖动地球只转视角还是移动地点 | view 或 location | Sun: "view" |
| observerTimeBasis | 异地对照固定真太阳时还是同一UTC瞬间 | solar 或 utc | Sun: "solar" |
| observerConstraint | 移动观察地点的坐标约束 | free、latitude、longitude | Sun: "free" |
| globeCameraLat | 地球相机对准位置的纬度 | 角度；相机量 | Sun: 39.9 |
| globeCameraLon | 地球相机对准位置的经度 | 角度；相机量 | Sun: 116.4 |
| globeCameraReady | 地球相机是否已初始化 | 布尔值 | Sun: false |
| moonOverlay | 太阳视图是否叠加月球轨迹 | 布尔值 | Sun: false |
| analemma | 当前渲染是否需要日行迹年度样本 | 布尔值 | Sun: false |
| analemmaClock | 全年每一天的固定采样时刻，独立于time | 午夜后分钟 | Sun: 720 |
| analemmaBasis | 年度采样采用固定钟表时或真太阳时 | clock 或 apparent | Sun: "clock" |
| analemmaOffset | 年度钟表时采样使用的固定UTC偏移 | 小时，−12至14 | Sun: 8 |
| analemmaView | 日行迹的投影类型 | dome、sky、equatorial | Sun: "dome" |
| analemmaCompare | 是否叠加多个固定采样时刻 | 布尔值 | Sun: false |
| analemmaYaw | 日行迹三维相机水平转角 | 弧度 | Sun: -0.55 |
| analemmaPitch | 日行迹三维相机俯仰 | 弧度 | Sun: 0.38 |
| analemmaZoom | 日行迹三维显示缩放 | 无量纲倍率 | Sun: 1 |
| analemmaIdeal | 是否使用理想日行迹成因模型 | 布尔值 | Sun: false |
| analemmaTilt | 理想成因模型的地轴倾角 | 角度，0至45 | Sun: 23.44 |
| analemmaEccentricity | 理想成因模型的轨道偏心率 | 无量纲，0至0.1 | Sun: 0.0167 |
| moonDayPlayback | 月球是否在当前日期内播放时刻 | 布尔值 | Moon: false |
| companion | 是否计算或显示行星伴月 | 布尔值 | Moon: false |
| planet | 伴月对照的行星标识 | Mercury、Venus、Mars、Jupiter、Saturn | Moon: "Venus" |
| companionSearchResult | 伴月搜索结果及其条件范围 | 对象或null；含日期、地点、时刻、角距离 | Moon: null |

## 单位、角度与空值约定

| 名称 | 单位/方向 | 使用位置 |
| --- | --- | --- |
| rad | π/180，度转弧度 | 三角函数入口 |
| deg | 180/π，弧度转度 | 公开高度、方位和读数 |
| alt | 角度，地平线0°，天顶90° | 当地天空与事件 |
| az | 角度，北0°起顺时针 | 当地水平投影 |
| x,y,z | 当地单位方向：东、上、北 | solar与skyRaw返回值 |
| yaw,pitch | 弧度；只改变相机 | 天空和日行迹相机 |
| time,clock | 午夜后分钟；不得猜测为Unix毫秒 | 公共钟与参考时刻 |
| Date.getTime() | Unix毫秒 | 真实UTC瞬间 |
| null事件 | 没有该次升落；不同于0分钟 | rise、set与缺失读数 |
| AU、km、m | 物理向量AU；地升模型km；地面物体m | 跨模块传参前显式换算 |

不要把屏幕像素、归一化地面坐标、Three.js显示单位与物理长度混用。局部函数中的w、h通常是CSS像素尺寸，dpr是像素密度；物理向量必须另存，不能被压缩显示坐标覆盖。

## 时间管线与日期换算

公共state.time采用当地真太阳时。sunHourAngle从太阳赤经与恒星时求时角；solarNoonUTC从经度近似出发迭代求太阳时角为0的UTC；instantUTC再迭代匹配目标时角。skyRaw把这个UTC交给Astronomy Engine求站心赤道坐标与无折射地平坐标。

```text
H_degrees = time_minutes / 4 - 180
UTC_target = instantUTC(time_minutes, date_YYYY_MM_DD, longitude_degrees)
position = skyRaw(body, time_minutes, date_YYYY_MM_DD, latitude, longitude)
```

固定UTC异地比较先从基准条件求一个真实瞬间，再分别换算各地太阳钟和当地日期。固定真太阳时则对每个经度分别求UTC，因此不是同一个真实瞬间。时间偏移与跨日期换算必须保留，不允许只把小时取模后丢掉日期。

日行迹的clock依据使用固定UTC偏移的钟表时；apparent依据走instantUTC。observerTimeBasis的solar/utc与analemmaBasis的clock/apparent是不同枚举，不能因为都表示太阳时就互相赋值。三维太阳系按UTC日期运行，地升地落采用独立的绕月角和演示秒数。

setDate验证公历日期和1900—2100范围，应用真实日期时关闭manual并重算太阳赤纬。日期字符串不能当作设备时区中的随意午夜；源码以明确的UTC构造保持一致。

## 当地坐标、太阳公式与地轴关系

solar使用纬度φ、赤纬δ和时角H。输入角度先乘rad；输出方向向量为东x、上y、北z，向量在理想模型中为单位长度。

```text
x = -cos(delta) * sin(H)
y = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(H)
z = cos(phi)*sin(delta) - sin(phi)*cos(delta)*cos(H)
alt = asin(clamp(y, -1, 1)) * deg
az = (atan2(x, z) * deg + 360) % 360
```

skyRaw返回相同当地接口，但数值来自真实日期站心星历。不要把理想公式与真实星历输出逐项强制设成一样；它们用于不同模式。coverage.js中的地轴图使用地表法向、当地北向和东向基向量，将当地太阳方向映射到地球示意。

horizontal方位在天顶、天底和极点附近需要额外谨慎；几何地平线不包含地形或折射。逆三角函数前必须限制舍入误差范围，缺失事件使用null，不用NaN或伪造0°。

## 升落、昼长与反求日期

理想daylight令a=sinφ·sinδ、b=cosφ·cosδ，检验−a/b是否在反余弦定义域内，区分普通昼夜、极昼、极夜和相切。极点的b接近0需要独立分支；相切不是穿越事件。

```text
cos(H0) = -tan(phi) * tan(delta)
ordinary_daylight_minutes = 8 * acos(cos(H0)) * deg
rise = 720 - 4*H0_degrees
set  = 720 + 4*H0_degrees
```

真实日期ephemerisDay和SkyDiagramSampling.events取样高度并细化穿越。局部极值附近要追加细化，避免漏掉短暂可见区间。真实昼长使用UTC时间间隔；timeAxisLength是太阳钟坐标上的长度，不能始终视为同一个量。

| 变量或函数 | 作用 |
| --- | --- |
| eventModel | 返回rise/set的时间、位置及极点标志 |
| eventCompassCamera.zoom | 仅调整显示大小，没有旋转科学方位的变量 |
| eventCompassLayout | 当前画幅中心、半径、投影、模型、天体和日期 |
| eventBearingCandidates | 固定地点构造候选日期，太阳按当年、月球按前后五周 |
| eventBearingDate | 先按赤纬近似排序，再用原生几何穿越核对目标方位 |
| gesture / pending | 保存拖动起始条件与待处理指针位置；Esc和取消恢复起始状态 |

拖点修改真实日期而非直接写入az。不可达目标取有实际事件的最近候选并提示。指针移动合并到动画帧，候选事件按手势复用，不能每个像素都重建全年星历。

## 日影、平面相交与日晷

对水平地面和竖杆，太阳方向的竖直分量决定影长；太阳低于地平线时不绘制直射阳光的地面影子。接近地平线时影长发散，需要裁剪显示而不是改物理结果。

```text
shadow_x = -rod_height * sun_x / sun_y
shadow_z = -rod_height * sun_z / sun_y
shadow_length = rod_height / tan(altitude)
```

水平和赤道日晷通过晷针、晷面与光线的几何求交。H表示竖直高度时不能直接拿倾斜杆总长代入水平影长公式。shadowZoom、相机zoom和真实height必须分开。

## 日行迹数据结构与理想模型

analemmaSample为一个日期返回UTC、时角hour、赤纬dec、均时差eot、高度alt和方位az。analemmaYear按年采样，缓存键包含地点、采样钟、依据、偏移和理想参数；改变任何科学条件应使键变化。相机变化只影响投影，不必重算星历。

| 局部量 | 含义与单位 |
| --- | --- |
| days / T | 距J2000的日数与儒略世纪 |
| L / M / E | 平黄经、平近点角与偏近点角；内部弧度 |
| e / tilt | 可控偏心率与地轴倾角；无量纲与内部弧度 |
| anomaly / longitude | 真近点角与太阳黄经；内部弧度 |
| ra / dec / hour | 该理想函数内的赤经、赤纬、时角输出均为角度；不要与Astronomy Engine的赤经小时混用 |
| eot | 均时差，分钟 |
| analemmaPlot / analemmaMarker | 当前投影命中信息与平滑日期点；不是新的物理轨道 |

理想成因模型用牛顿迭代解开普勒方程E−e·sinE=M，再由倾角求赤经赤纬。apparent采样用迭代匹配真太阳钟。真实模式直接调用Astronomy Engine；两套模式必须有明确UI标记。月份标签只改显示密度，不删去科学采样点。

## 月球星历、月相与独立地升模型

普通月球天空使用真实日期站心位置和照明信息；月相图还需要亮面朝向与观察几何。不能仅用日期在朔望月中的比例替代真实位置或月面方向。

| 地升模型量 | 含义 | 单位/初值 |
| --- | --- | --- |
| R / E / D / MU | 月球半径、地球半径、中心间距、月球引力参数 | 1737.4 km / 6371 km / 384400 km / 4902.800066 km³·s⁻² |
| s.mode | 绕月或固定月面 | orbit / surface |
| s.angle / s.phase | 绕月位置角与日地月光照构型角 | 角度；初值258 / 45 |
| s.altitude | 月面以上轨道高度；固定月面使用0 | km；控件100 / 300 / 1000 |
| s.seconds | 一圈演示播放时长，不是物理周期 | 秒；控件20 / 40 / 80 |
| s.playing / s.follow | 是否演示播放、是否朝向地球 | 布尔值 |
| s.yaw / s.pitch / s.fov | 转头角与相机视场；不移动轨道观察者 | yaw/pitch弧度；fov角度24/45/70 |
| q.distance / q.altitude / q.horizon | 地心距离、地球中心高度与地平线下俯 | km / 度 / 度 |
| q.angularRadius / q.clearance | 地球角半径与中心距可见月缘的角净空 | 角度 |
| q.visibility | 按地球圆面与月缘关系分类 | hidden / partial / visible |
| q.period | 2π√((R+h)³/MU)给出的物理圆轨道周期 | 秒 |

lunar/model.js与实验台星历state分离。父页通过同源消息管理可见/活动状态和语言；退出该模块要暂停绘制或播放，晚到的加载结果不能抢回用户已切换的视图。snapshot/restore验证允许范围并恢复为暂停。

## 三维物理向量、显示尺度与相机

space/model.js保留AU物理向量。先把EQJ赤道坐标旋转到黄道坐标，再映射为Three.js的(x,z,−y)，保持右手系。compress按半径r采用6.8·r^0.45显示缩放；这不是物理单位转换。

| 变量 | 含义与单位 |
| --- | --- |
| Model.bodies | 八行星元数据：id、name、type、radius(km)、au(AU)、period(日)、size(显示)、color |
| physical / display | 原始物理位置与经过压缩的显示位置，必须分开 |
| MOON_DISPLAY_SCALE | 月地局部教学放大系数；月球、轨道和历史轨迹保持一致 |
| year / day | UTC年份与从当年1月1日12:00 UTC开始的日偏移 |
| selected | Model.bodies中的选择索引，不是天体坐标 |
| view / inspectingMoon | 当前空间视图与月球近观状态 |
| observer.lat / observer.lon | 当地天空对照的真实地理观察条件 |
| comparing / reference | 是否对照，以及plane或observer参考类型 |
| azimuth / elevation | 三维相机的方位与仰角，弧度，不是当地太阳的az/alt |
| distance / targetDistance | 当前相机距离与平滑目标距离；Three.js显示单位 |
| target / smoothTarget | 当前目标点和平滑后的目标点 |
| playing / handle / previous | 播放状态、帧句柄、上一帧时间戳 |
| trackedBody / satelliteFraming | 跟踪天体标识与卫星构图状态 |
| linkedView / embedded | 嵌入视图类型与是否由父页嵌入 |

SolarSpaceView是父页桥接接口，公开选择和接收联动UTC，不直接把压缩显示坐标写回当地星历。WebGL初始化失败时提供二维回退并禁用不适用控件；历史恢复必须先暂停。

## 工作区、布局与菜单状态

| 变量/字段 | 意义 |
| --- | --- |
| uiWorkspace.selected | 当前主内容标识，如skyPanel、solarCompare、analemmaPanel、lunarOrbit |
| uiWorkspace.cards / nodes | 可组合画布容器与需要显隐的原节点；不得复制一套科学管线 |
| uiWorkspace.analemmaClockLinked | 是否把全年采样钟显式联到公共真太阳时 |
| uiWorkspace.lunarReady / pendingLunar | 嵌入地升模块是否就绪及是否仍等待它 |
| data.version / data.enabled | 布局模式版本和是否已启用组合 |
| data.views / data.active | 有序图名数组与当前图位索引；最多六个且不得重复 |
| data.axis / data.featured | columns或rows排列；三图是否主辅 |
| data.ratio / data.rowRatio | 左右与上下比例百分数，30至70 |
| focused / gesture | 专注图位和当前布局拖动事务 |
| customizing / normalSelection | 编辑模式与进入前正常内容；不是科学模型开关 |
| profiles / profileUndo | 最多五项收藏及收藏修改历史 |
| railView / optionOpen | 当前侧栏类别与布局折叠区是否打开 |

SkyWorkbenchMenu选择内容并保留固定的顶层导航；skyWorkspacePresentation管理组合，不应该因为选择对象就把主菜单改成另一层。点击画布只更新active图位和高亮；不能为选中图位重新挂载所有Canvas。小屏使用原参数抽屉，不另建浮动编辑器。

## 参考对象、身份与跨图选中

| 结构 | 字段含义 |
| --- | --- |
| models | 当前可绘图模型Map，id映射到投影、canvas、body及拾取函数 |
| states | 按source:body隔离的对象存储，包含objects、undo、redo、saved及model描述 |
| o.id / o.type | 对象稳定身份与工具类型；不能用列表行号替代身份 |
| o.label / customLabel | 显示名称与手动命名标志；自动坐标命名只更新自动名称 |
| o.visible / o.locked | 对象显隐和编辑锁；两者不能互相替代 |
| o.source / o.body | 来自哪张原图和哪种天体上下文 |
| observer.lat / observer.lon | 附加城市的经纬度，不等于基准state.lat/lon |
| time.time / curve.date | 附加时刻分钟与曲线参考日期 |
| selected / selectedSource | 选中对象身份及其所属源；组合图间保持同一身份 |
| armed / drag / nudging | 待放置工具、指针事务和键盘微调事务 |
| selectedReference | 可跨图强调的source+id，不是复制对象 |

定义表决定每类图可用字段及其范围；clean按该模式整理对象，单图最多40项。事件、曲线和城市都必须带足计算条件。跨图强调按source和id同时匹配，其他对照降低透明度；不要只比较id而混淆不同来源。

add或patch修改参考，不改基准；observeLocation或设为基准才明确应用地点。城市名称、坐标滑条、输入框和各图颜色都应来自同一个对象；不得各维护一份不相通的城市数组。

## 地面场景与物体变量

| 字段 | 含义/单位 |
| --- | --- |
| data.version / labels / objects | 场景版本、名称显隐及物体数组；最多32个物体 |
| id / number / kind | 稳定身份、自动编号和物体类别 |
| x / z / elevation | 地面坐标和离地高度；米 |
| height / radius / width / depth | 物体高度、半径、平面宽深；米 |
| plane | ground、vertical或inclined参考平面 |
| tilt / azimuth / heading | 倾角、物体方向与观察站朝向；度 |
| upright / grounded / locked | 竖直、贴地与锁定约束，先约束再应用位置或倾角 |
| lat / lon | 观察站关联地理位置；度 |
| name / autoName | 手动名称与自动命名标志 |
| measurements | 测量类型和参与对象ID；最多30项有效测量 |
| recordMotion / trails | 是否记录移动与有限长度轨迹；点使用地面x/z |
| notes / reference | 个人记录；参考场景及其condition，不得无限递归嵌套 |
| selected / selectedMany / pending | 单选、多选集合和待放置类型 |
| buckets | 太阳/月球分别保存的内存场景、历史与选择 |

sanitize验证物体类型、有限数值、约束和测量引用。参考场景不允许再包含下一层reference。prepareExperiment必须在验证后恢复seq等临时计数器，验证不能消耗用户可见编号；restoreExperiment清理进行中的手势并保留暂停状态。

## 存储格式、完整实验与恢复

| 键或结构 | 用途 |
| --- | --- |
| skyLabSession | sessionStorage中的schemaVersion=1科学会话；不可用时内存回退 |
| sky-diagram-draft-v2:source:body | 会话参考草稿；值含version和objects |
| sky-diagram-tools-v1:source:body | 独立保存的本图对象 |
| skymotion-workspace-v3-wide/narrow… | 按宽窄屏与天体分开的当前布局；兼容v2 |
| skymotion-saved-layouts-v1… | 最多五项命名收藏，item含name、layout及可选experiment |
| skymotion-scene-builder-v1-body | 独立保存的地面场景 |
| experiment.version / body | 完整实验格式版本和天体上下文 |
| experiment.conditions | SkyLabExperiment提供的模式与科学状态快照 |
| experiment.references / ground | 当前天体各源参考与地面场景 |

1. 捕获前提交有效输入；每个子系统只导出自己的数据，不抓取任意localStorage键。
2. 恢复前先验证完整包的版本、body、日期、经纬度、时刻、参考对象和地面物体。
3. 只有所有子系统都准备成功才应用；无效记录保留当前实验，不能先覆盖一半再报错。
4. 完整实验恢复暂停播放；独立对象存档和独立场景存档不被收藏恢复当作永久覆盖目标。
5. 存储拒绝、配额不足或旧版本异常时报告真实保存范围，内存回退不得伪称跨刷新持久化。

完整实验先由SkyLabExperiment.prepareComplete校验，再交给SkyMotionSession.transaction协调。每个参与模块先创建私有检查点，随后逐项提交；异常或明确拒绝会按相反顺序回滚，并保留原对象的撤销记录。布局、观测、参考对象和地面场景各自负责还原自己的状态，历史收尾位于finally中。

## 历史、手势与异步任务

interaction-history.js使用适配器读取科学状态、表单字段与路由。指针、原生滑条和输入提交采用分组；相机和菜单动作被排除或由各自编辑器管理。restoreGeneration避免旧异步恢复覆盖新动作，restoring锁必须在finally路径释放。

| 变量 | 作用 |
| --- | --- |
| adapter | 页面提供read、restore和可选手势判定 |
| gesture / pointerStart | 是否处于连续指针操作及其起始快照 |
| restoring / restoreGeneration | 恢复锁与防止晚到结果覆盖的新旧序号 |
| timer / pendingInput | 合并提交计时器与待提交字段 |
| loadGeneration / pendingLunar | 地升懒加载请求代际与仍有效的进入意图 |
| importRequest | 对象文件异步导入的有效请求号 |

文件导入必须限定大小、数量、类型与当前上下文；读取完成时确认用户仍在原图。动画可在页面隐藏时暂停，画布本身不能通过先隐藏再显现制造导航空白。

## 设计变量、可访问性与多端

ui-palette.css拥有语义色变量；design-system.css将其映射到Material Design 3的md-sys-color、形状、字体与状态角色，其他UI样式消费共享角色。科学图的太阳、轨道和天体数据颜色不等同于UI选中色，不能全局替换所有蓝色像素。

md-sys-color-*定义主操作、选中容器、表面、文字和边界；md-sys-shape-corner-*定义共享圆角；md-sys-size-target定义桌面40px、触屏48px操作目标；md-sys-state-hover与pressed定义状态层；md-sys-motion-*定义短过渡与缓动。组件只消费这些角色，不再各自定义颜色或尺寸。普通文字字段排除range、checkbox和radio，避免把字段边框套到滑动条和开关上。中文保留SkyMotion Reading宋体，英文保留SkyMotion Charter；Material组件规范不替换既定字体。

- 字体、圆角、控件高度和焦点样式遵循DESIGN.md；新增入口复用现有菜单，不覆盖科学画布。
- 760像素及以下使用原生dialog参数抽屉；同一套控件节点迁移，不复制第二套状态。
- 用aria-pressed、aria-selected、aria-expanded说明状态；交互图形提供键盘焦点和可读操作提示。
- 尊重prefers-reduced-motion；避免每帧重建菜单DOM，只有文字或属性真正改变时更新。
- 触屏检查实际点击目标，桌面重点核对鼠标、键盘、缩放后的布局与Windows常见画幅。

## 文档与语言生成管线

docs/document-content.json是四个文档页面的双语内容源；scripts/build-documents.py输出中文HTML、中英文Markdown及对应翻译条目。共享状态初值读取lab-state.json，与state_dictionary逐项核对。此生成过程只用于维护，线上不依赖Python。

scripts/prerender-pages.py再输出英文兄弟HTML、language-data.js与page-cache-manifest.json。它比较结构、ID、表单值与脚本顺序，文字翻译不允许改变科学值。新增文档时同时维护主菜单、缓存清单和双语配对检查。

```bash
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py
python3 scripts/build-documents.py --check
python3 scripts/prerender-pages.py --check
```

正文不记录零散发布日记；功能使用、教学任务和变量说明各归其位。Markdown与网页由同一内容源生成，避免网页改了、下载文件仍旧的分叉。

文档输入由scripts/document_model.py先验证路径、章节与别名唯一性、双语文本、内容类型、表格列数、链接目标和状态说明覆盖率。scripts/build-documents.py只负责渲染与输出，页面外壳在scripts/document-page.html；变量表读取lab-state.json，不再靠正则猜测JavaScript源码的缩进。

## 本地开发、验证与提交

1. 克隆仓库，先看PRODUCT.md与DESIGN.md，再用静态服务器打开页面；无需为浏览器运行安装应用框架。
2. 浏览器测试依赖固定在tests/browser/package-lock.json，使用该目录安装，不把测试工具发布到网站。
3. 根据改动先运行相关测试；发布工作流运行tests根目录全部.cjs回归，辅助文件除外。
4. 界面改动核对桌面、平板和手机，模型改动同时检查时间标准、边界、坐标手性和无事件情形。
5. 提交前重新生成双语内容，核对git diff，不把截图、临时服务器或调试凭据加入发布。

```bash
python3 -m http.server 8000 --bind 127.0.0.1
# Browser tests, from a separate terminal:
npm ci --prefix tests/browser
tests/browser/node_modules/.bin/playwright install chromium
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" \
  node .github/scripts/verify-site.cjs
```

当前测试包括模型内部一致性、真实点击和拖动、坏缓存恢复、语言与结构、存储受限、打包路径和WebGL回退。测试通过不等于所有GPU或真实Safari/Firefox设备都已认证，也不等于独立星历精度认证。

正式发布只保留最新 main 提交的流程。更新提交到达时会取消同一站点旧提交的发布流程；最新提交仍须完整通过检查，再部署网站。

## 正式站、镜像与打包

main推送触发Cloudflare Pages与GitHub Pages两个工作流，两边都先调用共享validate.yml。任一工作流的检查失败会阻止其部署；主站与镜像的部署结论分别核对，不能只看到一个绿色状态就声称两边都成功。

```bash
python3 .github/scripts/prepare_site.py --output /tmp/skymotion-site
python3 .github/scripts/prepare_site.py --output /tmp/skymotion-mirror --base-path /skymotion
```

prepare_site.py复制已跟踪的静态站文件，排除测试、脚本、私有配置和维护元数据。版本清单用于资源预热和新鲜度；运行时资源有变动时更新版本并验证线上内容，而不是仅修改页面上的版本文字。GitHub项目路径下检查相对链接和404恢复路径。

- [GitHub源码与工作流](https://github.com/qingzhuernest/skymotion)
- [Cloudflare正式网站](https://skymotion-5md.pages.dev/)
- [GitHub Pages镜像](https://qingzhuernest.github.io/skymotion/)

## 数据、影像、库与许可

自有源码采用仓库LICENSE所列AGPLv3。Astronomy Engine、Three.js、字体、恒星目录和天体影像具有各自许可，不因打包到同一站点而变成同一许可。继续分发和托管修改版时应查原许可与源码提供义务。

- [项目LICENSE](https://github.com/qingzhuernest/skymotion/blob/main/LICENSE)
- [三维影像与资源说明](space/assets/credits.txt)
- [附加天体数据来源](space/assets/population-credits.txt)
- [恒星目录许可](space/assets/stars-license.txt)
- [Three.js许可](space/vendor/THREE-LICENSE.txt)

星云图片可能经过科学可视化处理；月球纹理、地球纹理和目录样本的展示不能被描述成实时摄像或全部天空对象的完整数据库。近似轨道、理想圆轨道和真实日期星历应在各自模块标明。

## 源码职责与函数索引

此表由实际文件扫描生成。显式function声明列在右栏；IIFE、对象方法和模块内闭包请从该文件继续追踪。变量解释以上方状态与结构表为准。

| 源码文件 | 职责 | 声明的函数 |
| --- | --- | --- |
| [app.js](https://github.com/qingzhuernest/skymotion/blob/main/app.js) | 共享状态、太阳几何、Canvas绘图与呈现前状态准备 | solar, daylight, hhmm, coord, heading, dateDec, selectedPlaceName, resize, poly, text, glow, skyTrackSegments, between, add, drawMoonDayEndpoints, drawSkyScene, drawTrack, drawSunAltitudeChart, line, createEarthGPU, shader, drawEarthGPU, globeCenter, globeGeometry, renderGlobeOptions, initGlobeOptions, labels, initEarthFallback, earthSurface, drawGlobe, proj, updateUI, drawSolarSky, drawLunarSky, renderSolarPipeline, renderLunarPipeline, prepareObservationState, render, schedule, monthPhaseSamples, drawLunarMonthChart, shiftDay, advanceLunarPlayback, paintLabReferences |
| [moon.js](https://github.com/qingzhuernest/skymotion/blob/main/moon.js) | 真实日期星历、真太阳时与UTC换算、升落采样 | sunEquatorial, sunHourAngle, solarNoonUTC, instantUTC, skyRaw, moonRaw, refineExtremum, ephemerisDay, lunarDay, bodyPosition, bodyDay, sunContext, lunarPhase, seasonDate, lunarFaceTexture, drawMoon, drawPhasePanel, halfLit, initPhaseInteraction, pointerAngle, applyDrag, finish |
| [astronomy.js](https://github.com/qingzhuernest/skymotion/blob/main/astronomy.js) | 随站分发的Astronomy Engine第三方计算库 | mb |
| [coverage.js](https://github.com/qingzhuernest/skymotion/blob/main/coverage.js) | 地球昼夜、地图、升落方位和地轴图 | yearLength, yearDay, dateAtYearDay, updateYearSlider, illuminationAt, mapGeometry, mapLocation, worldNightLatitude, worldNightPath, drawWorldMap, updateEarthView, eventPosition, eventModel, updateEvents, drawEventCompass, eventBearingCandidates, eventBearingDate, initEventCompassInteraction, restore, adjust, finish, cancel, geometryModel, resetGeometryCamera, initGeometryCamera, redraw, drawEarthGeometry, ring, renderSolarCoverage, renderLunarCoverage, useReferenceObserver, observerClockAt, chooseMapObserver, initCoverage |
| [workspace.js](https://github.com/qingzhuernest/skymotion/blob/main/workspace.js) | 太阳/月球视图与原始模块的显隐协调 | isMoonOverlayActive, moonOverlayPosition, initWorkspace, updateWorkspaceLayout, updateWorkspaceUI |
| [page-navigation.js](https://github.com/qingzhuernest/skymotion/blob/main/page-navigation.js) | 统一页面骨架、路由、画布挂载与参数抽屉 | uiViewHidden, uiViewText, uiViewAttribute, renderUIWorkspace, save, link, addPlace, selectDial, sundialGroup, animateDrawer, finishDrawerClose, closeParameters, openParameters, endDrawerSwipe, updateParameterPresentation |
| [workbench-menu.js](https://github.com/qingzhuernest/skymotion/blob/main/workbench-menu.js) | 读取统一目录，呈现分层视图与布局入口 | select, sync |
| [custom-layout.js](https://github.com/qingzhuernest/skymotion/blob/main/custom-layout.js) | 多图排列、拖放、比例、收藏和完整实验协调 | sanitize, load, loadProfiles, button, travel, section, captureExperiment, applyProfile, persistProfiles, mutateProfiles, undoProfiles, markActive, activate, save, announce, change, move, labelButtons, labels, renderOrder, focusProfile, finishEditing, renderProfiles, apply, closeOptions, toggleOptions, start, cancel, targetAt, ratioAt |
| [customization-mode.js](https://github.com/qingzhuernest/skymotion/blob/main/customization-mode.js) | 顶部自定义开关的共用生命周期 | refresh, change |
| [customization-session.js](https://github.com/qingzhuernest/skymotion/blob/main/customization-session.js) | 一次性编辑意图与跨入口会话延续 | 模块内部方法，参见源码 |
| [diagram-tools.js](https://github.com/qingzhuernest/skymotion/blob/main/diagram-tools.js) | 对象存储、属性、放置、选择、导入与验证 | updateFold, updateMode, setEditing, selectedOwner, selectedKey, entries, switchView, revealField, revealWithin, placementUI, contextualHelp, arm, placeAt, menuOpen, closeObjectMenu, reorder, updateFiles, readImport, cityLabel, makeObject, startExperiment, persist, stateFor, defs, clean, repaint, draftStatus, record, restoreBasis, updateLocation, actionState, validInputs, fieldError, clearFieldError, updateSmall, mutate, travel, commitActive, save, create, showInspector, rememberContext, hide, open, parameterRail, persistentRailMode, visibleModels, chooseRail, ensureRailNavigation, syncRailNavigation, syncRailShell, unmountPanel, placePanel, renderToolLibrary, renderObjectList, referenceNameAtLocation, attachReferenceControl, commitReferenceField, renderInspector, update, selectedRow, focusSelectedRow, selectReference, textLayout, helper, drawObject, anchor, movementOrigin, hitAnchor, pointAt, beginDrag, moveDrag, finishDrag, cancelDrag, wireCanvas, paint, customizationOn, syncLaunchers, checkCurrentVisibility, syncVisibility, comparisonModel, comparisonList, comparisonChange, comparisonValid, syncInputs, finishNudge, nudge |
| [diagram-tool-definitions.js](https://github.com/qingzhuernest/skymotion/blob/main/diagram-tool-definitions.js) | 对象类型、字段与纯数据校验，不绑定DOM | forModel, normalize |
| [diagram-sampling.js](https://github.com/qingzhuernest/skymotion/blob/main/diagram-sampling.js) | 有界缓存、几何过零和年度参考采样 | crossings |
| [observer-comparison.js](https://github.com/qingzhuernest/skymotion/blob/main/observer-comparison.js) | 同源城市/时刻的跨图投影和选中突出 | memo, at, basis, sample, color, name, enabled, sites, times, points, events, stroke, dot, label, geometryRay, paint |
| [parameter-controls.js](https://github.com/qingzhuernest/skymotion/blob/main/parameter-controls.js) | 坐标、时间与日期的滑条和精确输入 | attach, sync, start, flush, finish, cancel |
| [solar-study.js](https://github.com/qingzhuernest/skymotion/blob/main/solar-study.js) | 同地不同时刻与同一瞬间异地的专门场景 | el, svg, text, button, caption, project, path, paths, at, dayPath, clock, locationText, sites, comparison, sync |
| [scene-builder.js](https://github.com/qingzhuernest/skymotion/blob/main/scene-builder.js) | 地面物体、约束、测量、轨迹和场景参考 | check, example, measurementObjects, sanitize, cleanCondition, selectBody, message, updateStatus, record, change, travel, save, setMode, remove, duplicate, place, ringPosition, group, arrangeObjects, addMeasurement, recordShadow, recordEvent, shadowEnds, shadowLength, measurementValue, update, translate, ground, local, position, hit, draw, resize, cancelGesture |
| [analemma.js](https://github.com/qingzhuernest/skymotion/blob/main/analemma.js) | 年度采样、投影、理想成因与月份标签 | analemmaIdealPosition, analemmaSample, analemmaYear, analemmaTracks, analemmaVector, analemmaSegments, analemmaReferenceOptions, drawAnalemma, renderAnalemma, advanceAnalemma, resetAnalemmaView, initAnalemma |
| [solar-date.js](https://github.com/qingzhuernest/skymotion/blob/main/solar-date.js) | 太阳逐日播放、日期联动与年度轨迹 | prepareSolarDateMode, enableSolarDateMode, annualSolarSamples, annualSolarKey, annualSolarPosition, drawAnnualSolarTrail, annualShadowSegments, drawAnnualShadowTrail, updateSolarDateMonths, renderSolarDateUI, advanceSolarDatePlayback, initSolarDate |
| [shadow.js](https://github.com/qingzhuernest/skymotion/blob/main/shadow.js) | 影长、影尖路径与显示缩放 | shadowGroundRadius, shadowTip, clipShadowSegment, shadowTipSegments, drawShadowTrace, drawCurrentShadow, updateShadowUI, initShadow |
| [sundial.js](https://github.com/qingzhuernest/skymotion/blob/main/sundial.js) | 水平与赤道日晷几何和绘图 | sundialModel, sundialHourRay, sundialPlanePoint, drawSundialSide, drawSundial, drawSundials, renderSundials, initSundials |
| [sundial-device.js](https://github.com/qingzhuernest/skymotion/blob/main/sundial-device.js) | 日晷装置交互与相机 | openSundialDialog, sundialDeviceFrame, drawSundialDevice, sundialSetTime, sundialDragTime, sundialPlateDragTime, initSundialDevice, redrawCamera, pinchDistance, renderSundialDeviceControls |
| [observer.js](https://github.com/qingzhuernest/skymotion/blob/main/observer.js) | 当地仰望天空的投影与交互 | observerPosition, observerFrame, moonBrightLimbAngle, observerBodies, observerDayPosition, drawObserverCurve, drawObserverTrack, observerGroundFrame, drawObserverGround, drawObserverSky, arrangeObserverTime, renderObserverControls, initObserver |
| [companion.js](https://github.com/qingzhuernest/skymotion/blob/main/companion.js) | 行星伴月、角距离与日期搜索 | companionSnapshot, futureCompanionDates, closestCompanionDay, renderCompanion, drawCompanionSky, initCompanion |
| [motion.js](https://github.com/qingzhuernest/skymotion/blob/main/motion.js) | 按需帧调度、播放累计与相机平滑 | elementVisible, canPaint, requestMotionFrame, snapshotMotion, syncMotionTarget, motionProgress, mixDirection, visualPosition, visualPhase, visualTrackPosition, visualChartDay, motionCamera, easeCompanionView, settleMotion, revealMotion, drawMotionCanvases, motionFrame, initMotion, focusAfterReveal |
| [menu.js](https://github.com/qingzhuernest/skymotion/blob/main/menu.js) | 原参数菜单分组与折叠行为 | updateMenu, closeMenu, initMenu |
| [time-workbench.js](https://github.com/qingzhuernest/skymotion/blob/main/time-workbench.js) | 公共时间条、日期条与播放控制 | workbenchBasis, workbenchTimeMax, workbenchSetTime, workbenchShiftDate, workbenchSetBasis, workbenchPlay, workbenchIsPlaying, renderTimeWorkbench, initTimeWorkbench |
| [experiment-storage.js](https://github.com/qingzhuernest/skymotion/blob/main/experiment-storage.js) | 版本化会话校验、存储回退与恢复事务协调 | validDate, searchResult, sanitizeMode, read, write, transaction |
| [interaction-history.js](https://github.com/qingzhuernest/skymotion/blob/main/interaction-history.js) | 浏览器参数历史、手势分组与恢复锁 | read, stateFor, replace, commit, begin, queue, restore |
| [lab-history.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-history.js) | 观测快照、历史适配与完整实验数据协调 | 模块内部方法，参见源码 |
| [lab-customization.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-customization.js) | 兼容的实验台自定义接入 | 模块内部方法，参见源码 |
| [lab-comparison-controls.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-comparison-controls.js) | 原实验台对照控制适配 | 模块内部方法，参见源码 |
| [interface-motion.js](https://github.com/qingzhuernest/skymotion/blob/main/interface-motion.js) | 折叠与选中反馈，尊重减少动态设置 | springFrames, springPanel, installDisclosures, revealOptions, installSegments, update, installRail, sync, setCollapsed, gesture, end |
| [language.js](https://github.com/qingzhuernest/skymotion/blob/main/language.js) | 语言切换、字体加载、静态兄弟页与失败重试 | installDictionary, translate, text, element, walk, apply, prepareFonts, showLanguageFailure, change, reveal, observePresentation, init, failure |
| [language-data.js](https://github.com/qingzhuernest/skymotion/blob/main/language-data.js) | 由生成器输出的双语词典 | 模块内部方法，参见源码 |
| [page-boot.js](https://github.com/qingzhuernest/skymotion/blob/main/page-boot.js) | 可见绘制前的语言与入口初始化 | freezeCatalog, readingKey, saveReadingWindow, mergeReadingFallback, localeUrl, showFontFailure |
| [page-cache.js](https://github.com/qingzhuernest/skymotion/blob/main/page-cache.js) | 按资源清单预热同站资源 | worker |
| [date-picker.js](https://github.com/qingzhuernest/skymotion/blob/main/date-picker.js) | 原生风格日期弹层与确认取消 | dateValue, allowed, updateDraft, focusKey, close, render, open, install |
| [observer-explanation.js](https://github.com/qingzhuernest/skymotion/blob/main/observer-explanation.js) | 按当前图提供科学解释与说明 | close, sync |
| [document-entrance.js](https://github.com/qingzhuernest/skymotion/blob/main/document-entrance.js) | 保留的三份文档入场对话 | cleanup, track, exit, start |
| [welcome.js](https://github.com/qingzhuernest/skymotion/blob/main/welcome.js) | 欢迎页星空与入口互动 | setStatus, openingNode, finishOpening, activateOpening, random, makeGlow, point, request, resize, pulse, advance, collide, frame, edgeKey, interact, segmentDistance, hitTarget, clickAt, pointerPoint, clear, syncConnectButton, spawnMeteors |
| [lunar/model.js](https://github.com/qingzhuernest/skymotion/blob/main/lunar/model.js) | 独立圆轨道地升模型，公里与秒 | sample, riseAngle |
| [lunar/lunar.js](https://github.com/qingzhuernest/skymotion/blob/main/lunar/lunar.js) | 双视图WebGL、飞行状态、朝向与嵌入消息 | text, refresh, invalidate, frame, pause, stars, ring, setup, resize, projectLabel, draw, mapPoint, mapAngle, moveMap |
| [space/model.js](https://github.com/qingzhuernest/skymotion/blob/main/space/model.js) | 物理向量、坐标旋转和教学距离压缩 | sceneVector, compress, snapshot, orbitalPath |
| [space/scene.js](https://github.com/qingzhuernest/skymotion/blob/main/space/scene.js) | 三维渲染、天体选择、相机、时钟与公开状态 | comparisonLayout, invalidate, utcDate, line, select, focus, focusMoon, syncViewPresentation, pause, updateScience, lunarPath, updateObjects, updateHistory, updateInspection, placeLabel, overviewDistance, planetDistance, earthMoonDistance, moonDistance, obliqueElevation, fittedDistance, minimumDistance, resize, frame |
| [space/earth-frame.js](https://github.com/qingzhuernest/skymotion/blob/main/space/earth-frame.js) | 地球姿态与当地观察坐标 | dot, frame, toScene |
| [space/appearance.js](https://github.com/qingzhuernest/skymotion/blob/main/space/appearance.js) | 材质、影像和显示外观 | clamp, noiseField, random, canvasPixels, texture, mix, craters, lunarMaria, makeSurface, ring, atmosphericEdge, create, moon, sun |
| [space/compare.js](https://github.com/qingzhuernest/skymotion/blob/main/space/compare.js) | 空间参考平面对照 | create, resize, disc, text, arrow, render, project, label, path |
| [space/observer.js](https://github.com/qingzhuernest/skymotion/blob/main/space/observer.js) | 三维场景的当地天空对照 | create, select, calculate, updateReadouts, draw, resize, render |
| [space/lab-compare.js](https://github.com/qingzhuernest/skymotion/blob/main/space/lab-compare.js) | 实验台与三维场景的同UTC联动 | blockReason, redrawAfterLayout, setEnabled, sync |
| [space/embed.js](https://github.com/qingzhuernest/skymotion/blob/main/space/embed.js) | 三维嵌入参数和父页联动 | 模块内部方法，参见源码 |
| [space/ui.js](https://github.com/qingzhuernest/skymotion/blob/main/space/ui.js) | 三维参数侧栏与抽屉迁移 | sync, closeDrawer |
| [space/history.js](https://github.com/qingzhuernest/skymotion/blob/main/space/history.js) | 三维科学选择历史与恢复 | 模块内部方法，参见源码 |
| [space/immersive.js](https://github.com/qingzhuernest/skymotion/blob/main/space/immersive.js) | 沉浸观察与退出顺序 | layout, enter, exit |
| [space/exploration.js](https://github.com/qingzhuernest/skymotion/blob/main/space/exploration.js) | 探索对象的选择与说明 | validVector, trail, actualDistance |
| [space/customization.js](https://github.com/qingzhuernest/skymotion/blob/main/space/customization.js) | 三维参考对象与独立相机标记 | position |
| [space/population.js](https://github.com/qingzhuernest/skymotion/blob/main/space/population.js) | 卫星和小天体数据与近似轨道 | solveKepler, epochDays, prepare, convert, position, displaySatellite, satelliteDistance, create, load, setPositions |
| [space/stars.js](https://github.com/qingzhuernest/skymotion/blob/main/space/stars.js) | 恒星目录、选取与标注 | temperature, color, direction, create |
| [space/nebulae.js](https://github.com/qingzhuernest/skymotion/blob/main/space/nebulae.js) | 星云目录、影像显示与资源管理 | create, choose, load |
| [lab-controls.js](https://github.com/qingzhuernest/skymotion/blob/main/lab-controls.js) | 观测输入事件、地点日期与表单展示 | setDate, stop, globeLocationAt, globeObserverPoint, selectObservationBody, selectChartDateOrTime, monthDays, syncControls, updateSolarControls, updateLunarControls, selectMonth |
| [document-navigation.js](https://github.com/qingzhuernest/skymotion/blob/main/document-navigation.js) | 文档目录、章节定位与阅读进度；原生锚点作为无脚本后备 | update |
