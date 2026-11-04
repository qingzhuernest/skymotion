# 全仓库代码地图

由 `scripts/repository-index.py` 生成。完整素材、许可与原稿见 [全部文件](../file-inventory.md)；运行约定见 [开发者文档](../../site/development-guide.md)。

目录职责是整理依据，不要求把科学模型、状态存储与界面强行合成一个公共模块。公开路径和资料ID保持稳定。第三方包与生成件不按手写源码修改。

| 分组 | 文件数 | UTF-8字节数 | 行数 |
| --- | ---: | ---: | ---: |
| 三维天空 | 16 | 128,610 | 3,409 |
| 依赖锁与构建配置 | 8 | 87,266 | 2,673 |
| 共享界面、实验模型与页面 | 47 | 840,166 | 22,475 |
| 地升地落 | 2 | 31,583 | 818 |
| 本地搜索 | 3 | 40,123 | 1,061 |
| 生成、数据维护与发布工具 | 25 | 110,300 | 2,196 |
| 生成输出（修改原稿或构建入口） | 4 | 1,823,205 | 590 |
| 生成页面（修改双语原稿） | 18 | 1,106,244 | 4,490 |
| 界面样式（手写） | 27 | 407,557 | 16,084 |
| 第三方运行库（保留原许可） | 3 | 903,285 | 4,487 |
| 结构化资料、目录与生成元数据 | 28 | 4,669,009 | 39,849 |
| 页面原稿（含目录生成区段） | 11 | 343,111 | 6,620 |
| 验证与测试工具 | 93 | 577,693 | 8,867 |
| 影像、字体与媒体 | 27 | 7,102,080 | — |
| 文档、许可与其他说明 | 71 | 1,051,283 | — |
| 模型、WASM与向量二进制 | 3 | 47,201,301 | — |

素材、模型与说明单列，不计作手写实现。说明字节数不含本地图和文件清单自身，避免自引用统计。行数包含格式、注释与数据，不能用来推断计算复杂度、维护质量或测试覆盖。

## 三维天空

| 路径 | 职责 |
| --- | --- |
| [site/space/appearance.js](../../site/space/appearance.js) | 材质、影像和显示外观 |
| [site/space/compare.js](../../site/space/compare.js) | 空间参考平面对照 |
| [site/space/customization.js](../../site/space/customization.js) | 三维参考对象与独立相机标记 |
| [site/space/earth-frame.js](../../site/space/earth-frame.js) | 地球姿态与当地观察坐标 |
| [site/space/embed.js](../../site/space/embed.js) | 三维嵌入参数和父页联动 |
| [site/space/exploration.js](../../site/space/exploration.js) | 探索对象的选择与说明 |
| [site/space/history.js](../../site/space/history.js) | 三维科学选择历史与恢复 |
| [site/space/immersive.js](../../site/space/immersive.js) | 沉浸观察与退出顺序 |
| [site/space/lab-compare.js](../../site/space/lab-compare.js) | 实验台与三维场景的同UTC联动 |
| [site/space/model.js](../../site/space/model.js) | 物理向量、坐标旋转和教学距离压缩 |
| [site/space/nebulae.js](../../site/space/nebulae.js) | 星云目录、影像显示与资源管理 |
| [site/space/observer.js](../../site/space/observer.js) | 三维场景的当地天空对照 |
| [site/space/population.js](../../site/space/population.js) | 卫星和小天体数据与近似轨道 |
| [site/space/scene.js](../../site/space/scene.js) | 三维渲染、天体选择、相机、时钟与公开状态 |
| [site/space/stars.js](../../site/space/stars.js) | 恒星目录、选取与标注 |
| [site/space/ui.js](../../site/space/ui.js) | 三维参数侧栏与抽屉迁移 |

## 依赖锁与构建配置

| 路径 | 职责 |
| --- | --- |
| [scripts/assistant/package-lock.json](../../scripts/assistant/package-lock.json) | 固定依赖版本与完整性；由包管理器维护 |
| [scripts/assistant/package.json](../../scripts/assistant/package.json) | 开发工具依赖与命令；不进入网站运行环境 |
| [scripts/material-web/package-lock.json](../../scripts/material-web/package-lock.json) | 固定依赖版本与完整性；由包管理器维护 |
| [scripts/material-web/package.json](../../scripts/material-web/package.json) | 开发工具依赖与命令；不进入网站运行环境 |
| [scripts/theme-colors/package-lock.json](../../scripts/theme-colors/package-lock.json) | 固定依赖版本与完整性；由包管理器维护 |
| [scripts/theme-colors/package.json](../../scripts/theme-colors/package.json) | 开发工具依赖与命令；不进入网站运行环境 |
| [tests/browser/package-lock.json](../../tests/browser/package-lock.json) | 固定依赖版本与完整性；由包管理器维护 |
| [tests/browser/package.json](../../tests/browser/package.json) | 开发工具依赖与命令；不进入网站运行环境 |

## 共享界面、实验模型与页面

| 路径 | 职责 |
| --- | --- |
| [site/analemma.js](../../site/analemma.js) | 年度采样、投影、理想成因与月份标签 |
| [site/app.js](../../site/app.js) | 共享状态、太阳几何、Canvas绘图与呈现前状态准备 |
| [site/companion.js](../../site/companion.js) | 行星伴月、角距离与日期搜索 |
| [site/coverage.js](../../site/coverage.js) | 地球昼夜、地图、升落方位和地轴图 |
| [site/custom-layout.js](../../site/custom-layout.js) | 多图排列、拖放、比例、收藏和完整实验协调 |
| [site/customization-mode.js](../../site/customization-mode.js) | 顶部自定义开关的共用生命周期 |
| [site/customization-session.js](../../site/customization-session.js) | 一次性编辑意图与跨入口会话延续 |
| [site/date-picker.js](../../site/date-picker.js) | 原生风格日期弹层与确认取消 |
| [site/diagram-reference-renderer.js](../../site/diagram-reference-renderer.js) | 参考对象绘图、文字定位和命中几何；只读实验与对象状态 |
| [site/diagram-reference-store.js](../../site/diagram-reference-store.js) | 参考对象状态、草稿、存档、复制与历史；不依赖界面 |
| [site/diagram-sampling.js](../../site/diagram-sampling.js) | 有界缓存、几何过零和年度参考采样 |
| [site/diagram-tool-definitions.js](../../site/diagram-tool-definitions.js) | 对象类型、字段与纯数据校验，不绑定DOM |
| [site/diagram-tools.js](../../site/diagram-tools.js) | 对象编辑、属性、放置、选择与导入；协调共享状态和绘图 |
| [site/document-entrance.js](../../site/document-entrance.js) | 保留的三份文档入场对话 |
| [site/document-navigation.js](../../site/document-navigation.js) | 文档常显目录、章节定位与返回顶部；原生锚点作为无脚本后备 |
| [site/experiment-share.js](../../site/experiment-share.js) | 版本化分享链接、压缩、限长读取与启动恢复 |
| [site/experiment-storage.js](../../site/experiment-storage.js) | 版本化会话校验、存储回退与恢复事务协调 |
| [site/interaction-history.js](../../site/interaction-history.js) | 浏览器参数历史、手势分组与恢复锁 |
| [site/interface-motion.js](../../site/interface-motion.js) | 折叠与选中反馈，尊重减少动态设置 |
| [site/lab-comparison-controls.js](../../site/lab-comparison-controls.js) | 原实验台对照控制适配 |
| [site/lab-controls.js](../../site/lab-controls.js) | 观测输入事件、地点日期与表单展示 |
| [site/lab-customization.js](../../site/lab-customization.js) | 兼容的实验台自定义接入 |
| [site/lab-history.js](../../site/lab-history.js) | 观测快照、历史适配与完整实验数据协调 |
| [site/language.js](../../site/language.js) | 语言切换、字体加载、静态兄弟页与失败重试 |
| [site/material-controls.js](../../site/material-controls.js) | 官方选择组件与原生值、事件适配；科学滑条进度显示 |
| [site/menu.js](../../site/menu.js) | 原参数菜单分组与折叠行为 |
| [site/moon.js](../../site/moon.js) | 真实日期星历、真太阳时与UTC换算、升落采样 |
| [site/motion.js](../../site/motion.js) | 按需帧调度、播放累计与相机平滑 |
| [site/observer-comparison.js](../../site/observer-comparison.js) | 同源城市/时刻的跨图投影和选中突出 |
| [site/observer-explanation.js](../../site/observer-explanation.js) | 按当前图提供科学解释与说明 |
| [site/observer.js](../../site/observer.js) | 当地仰望天空的投影与交互 |
| [site/page-boot.js](../../site/page-boot.js) | 可见绘制前的语言与入口初始化 |
| [site/page-cache.js](../../site/page-cache.js) | 按资源清单预热同站资源 |
| [site/page-navigation.js](../../site/page-navigation.js) | 统一页面骨架、路由、画布挂载与参数抽屉 |
| [site/parameter-controls.js](../../site/parameter-controls.js) | 坐标、时间与日期的滑条和精确输入 |
| [site/preferences.js](../../site/preferences.js) | 全站偏好、主题、设置保存与恢复；与科学实验状态独立 |
| [site/scene-builder.js](../../site/scene-builder.js) | 地面物体、约束、测量、轨迹和场景参考 |
| [site/shadow.js](../../site/shadow.js) | 影长、影尖路径与显示缩放 |
| [site/sky-perspectives.js](../../site/sky-perspectives.js) | 所属模块实现；参见源码与开发文档 |
| [site/solar-date.js](../../site/solar-date.js) | 太阳逐日播放、日期联动与年度轨迹 |
| [site/solar-study.js](../../site/solar-study.js) | 同地不同时刻与同一瞬间异地的专门场景 |
| [site/sundial-device.js](../../site/sundial-device.js) | 日晷装置交互与相机 |
| [site/sundial.js](../../site/sundial.js) | 水平与赤道日晷几何和绘图 |
| [site/time-workbench.js](../../site/time-workbench.js) | 公共时间条、日期条与播放控制 |
| [site/welcome.js](../../site/welcome.js) | 欢迎页星空与入口互动 |
| [site/workbench-menu.js](../../site/workbench-menu.js) | 读取统一目录，呈现分层视图与布局入口 |
| [site/workspace.js](../../site/workspace.js) | 太阳/月球视图与原始模块的显隐协调 |

## 地升地落

| 路径 | 职责 |
| --- | --- |
| [site/lunar/lunar.js](../../site/lunar/lunar.js) | 双视图WebGL、飞行状态、朝向与嵌入消息 |
| [site/lunar/model.js](../../site/lunar/model.js) | 独立圆轨道地升模型，公里与秒 |

## 本地搜索

| 路径 | 职责 |
| --- | --- |
| [site/assistant/runtime.js](../../site/assistant/runtime.js) | 资源版本、资料加载、Worker生命周期、取消、重试和超时 |
| [site/assistant/search.js](../../site/assistant/search.js) | 自动查询分析、倒排排名、来源答案、候选融合与短追问 |
| [site/assistant/ui.js](../../site/assistant/ui.js) | 搜索界面、当前对话、焦点、语言与请求取消信号 |

## 生成、数据维护与发布工具

| 路径 | 职责 |
| --- | --- |
| [.github/scripts/prepare_site.py](../../.github/scripts/prepare_site.py) | Package the same tracked website for Cloudflare and GitHub project Pages. |
| [.github/scripts/select-checks.cjs](../../.github/scripts/select-checks.cjs) | 按语义模块路径选择相关发布检查 |
| [.github/scripts/verify-site.cjs](../../.github/scripts/verify-site.cjs) | 隔离端口的浏览器与单元回归执行器，负责超时和进程清理 |
| [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) | 验证后发布既有Cloudflare项目和Pages镜像 |
| [.github/workflows/github-pages.yml](../../.github/workflows/github-pages.yml) | 同一发布包的GitHub Pages镜像部署 |
| [.github/workflows/validate.yml](../../.github/workflows/validate.yml) | 共享源码、生成件与相关回归验证 |
| [scripts/assistant/build.mjs](../../scripts/assistant/build.mjs) | 所属模块实现；参见源码与开发文档 |
| [scripts/assistant/download-model.py](../../scripts/assistant/download-model.py) | Download the exact preview model; verify every pinned artifact. |
| [scripts/assistant/resource-report.py](../../scripts/assistant/resource-report.py) | Entity sizes and reproducible gzip estimates, not production transfer measurements. |
| [scripts/assistant/worker-source.js](../../scripts/assistant/worker-source.js) | 所属模块实现；参见源码与开发文档 |
| [scripts/build-assistant-knowledge.py](../../scripts/build-assistant-knowledge.py) | Compile stable author IDs with current bilingual manuals and source-checked supplements. |
| [scripts/build-documents.py](../../scripts/build-documents.py) | Render validated bilingual documents to HTML, Markdown and translation entries. |
| [scripts/build-population-data.py](../../scripts/build-population-data.py) | Download a local JPL reference snapshot with Python's standard library only. |
| [scripts/build-star-catalog.py](../../scripts/build-star-catalog.py) | Extract a small, attributed J2000 reference sky from HYG 4.1 (CC BY-SA 4.0). |
| [scripts/check-sources.py](../../scripts/check-sources.py) | Parse every tracked JS/Python/JSON file and validate local HTML assets without executing application code. |
| [scripts/document-page.html](../../scripts/document-page.html) | 页面结构；共享目录区段由site_sources同步 |
| [scripts/document_model.py](../../scripts/document_model.py) | Validate document content before any output is written. |
| [scripts/generate-welcome-lettering.py](../../scripts/generate-welcome-lettering.py) | Bake Charter italic outlines into the font-independent constellation. |
| [scripts/material-web/source.js](../../scripts/material-web/source.js) | 所属模块实现；参见源码与开发文档 |
| [scripts/optimize-reading-fonts.py](../../scripts/optimize-reading-fonts.py) | Losslessly simplify Reading CFF outlines and remove screen-unnecessary hints. |
| [scripts/prerender-pages.py](../../scripts/prerender-pages.py) | Build deterministic English sibling pages without evaluating application scripts. |
| [scripts/repository-index.py](../../scripts/repository-index.py) | Generate the complete tracked-file inventory; never scan caches or build output. |
| [scripts/site_sources.py](../../scripts/site_sources.py) | Validated, canonical page/view catalogs and experiment state definitions. |
| [scripts/supplement-reading-fonts.py](../../scripts/supplement-reading-fonts.py) | Supplement missing UI characters without changing existing Reading font glyphs. |
| [scripts/theme-colors/source.js](../../scripts/theme-colors/source.js) | 所属模块实现；参见源码与开发文档 |

## 生成输出（修改原稿或构建入口）

| 路径 | 职责 |
| --- | --- |
| [site/assistant/worker.js](../../site/assistant/worker.js) | 由构建器输出的本地推理Worker，含固定第三方依赖 |
| [site/language-data.js](../../site/language-data.js) | 由双语生成器输出的词典 |
| [site/material-web.js](../../site/material-web.js) | 由scripts/material-web输出的Google Material Web依赖包 |
| [site/theme-colors.js](../../site/theme-colors.js) | 由scripts/theme-colors输出的主题计算依赖包 |

## 生成页面（修改双语原稿）

| 路径 | 职责 |
| --- | --- |
| [site/404.en.html](../../site/404.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/analemma.en.html](../../site/analemma.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/contact.en.html](../../site/contact.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/development-guide.en.html](../../site/development-guide.en.html) | 文档生成页 |
| [site/development-guide.html](../../site/development-guide.html) | 文档生成页 |
| [site/diagrams.en.html](../../site/diagrams.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/docs.en.html](../../site/docs.en.html) | 文档生成页 |
| [site/docs.html](../../site/docs.html) | 文档生成页 |
| [site/geography-review.en.html](../../site/geography-review.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/guide.en.html](../../site/guide.en.html) | 文档生成页 |
| [site/guide.html](../../site/guide.html) | 文档生成页 |
| [site/index.en.html](../../site/index.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/lab.en.html](../../site/lab.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/lunar/index.en.html](../../site/lunar/index.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/project-guide.en.html](../../site/project-guide.en.html) | 文档生成页 |
| [site/project-guide.html](../../site/project-guide.html) | 文档生成页 |
| [site/space/index.en.html](../../site/space/index.en.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/sundial.en.html](../../site/sundial.en.html) | 页面结构；共享目录区段由site_sources同步 |

## 界面样式（手写）

| 路径 | 职责 |
| --- | --- |
| [site/assistant/assistant.css](../../site/assistant/assistant.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/controls.css](../../site/controls.css) | 实验台控件与科学面板布局 |
| [site/custom-layout.css](../../site/custom-layout.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/design-system.css](../../site/design-system.css) | Material 3共享组件与状态样式 |
| [site/diagram-tools.css](../../site/diagram-tools.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/documents.css](../../site/documents.css) | 阅读排版、目录、表格与文档开场 |
| [site/interface-motion.css](../../site/interface-motion.css) | 共享界面动效与减少动态效果支持 |
| [site/lab-comparison-controls.css](../../site/lab-comparison-controls.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/language.css](../../site/language.css) | 中英文排版、导航与语言适配 |
| [site/lunar/entry.css](../../site/lunar/entry.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/lunar/lunar.css](../../site/lunar/lunar.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/pages.css](../../site/pages.css) | 欢迎页和文档页面布局 |
| [site/parameter-controls.css](../../site/parameter-controls.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/preferences.css](../../site/preferences.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/scene-builder.css](../../site/scene-builder.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/solar-study.css](../../site/solar-study.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/space/compare.css](../../site/space/compare.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/space/embed.css](../../site/space/embed.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/space/exploration.css](../../site/space/exploration.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/space/immersive.css](../../site/space/immersive.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/space/lab-compare.css](../../site/space/lab-compare.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/space/population.css](../../site/space/population.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/space/space.css](../../site/space/space.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/style.css](../../site/style.css) | 基础页面布局与共享样式 |
| [site/time-workbench.css](../../site/time-workbench.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |
| [site/ui-palette.css](../../site/ui-palette.css) | 全站主题颜色的唯一CSS原稿 |
| [site/workbench-menu.css](../../site/workbench-menu.css) | 对应模块的样式与多端布局；主题颜色引用共享变量 |

## 第三方运行库（保留原许可）

| 路径 | 职责 |
| --- | --- |
| [site/assistant/runtime/ort-wasm-simd-threaded.jsep.mjs](../../site/assistant/runtime/ort-wasm-simd-threaded.jsep.mjs) | 所属模块实现；参见源码与开发文档 |
| [site/astronomy.js](../../site/astronomy.js) | 随站分发的Astronomy Engine第三方计算库 |
| [site/space/vendor/three.min.js](../../site/space/vendor/three.min.js) | 所属模块实现；参见源码与开发文档 |

## 结构化资料、目录与生成元数据

| 路径 | 职责 |
| --- | --- |
| [.prettierrc.json](../../.prettierrc.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/assistant/corpus143.json](../../docs/assistant/corpus143.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/assistant/coverage142.json](../../docs/assistant/coverage142.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/assistant/reported-after.json](../../docs/assistant/reported-after.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/assistant/reported-before.json](../../docs/assistant/reported-before.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/assistant/reviewed.json](../../docs/assistant/reviewed.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/assistant/science-basics.json](../../docs/assistant/science-basics.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/assistant/topics.json](../../docs/assistant/topics.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/branches.json](../../docs/branches.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [docs/document-content.json](../../docs/document-content.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/knowledge-version.json](../../site/assistant/knowledge-version.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/knowledge.json](../../site/assistant/knowledge.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/models/bge-small-zh-v1.5/config.json](../../site/assistant/models/bge-small-zh-v1.5/config.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/models/bge-small-zh-v1.5/special_tokens_map.json](../../site/assistant/models/bge-small-zh-v1.5/special_tokens_map.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/models/bge-small-zh-v1.5/tokenizer.json](../../site/assistant/models/bge-small-zh-v1.5/tokenizer.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/models/bge-small-zh-v1.5/tokenizer_config.json](../../site/assistant/models/bge-small-zh-v1.5/tokenizer_config.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/resource-report.json](../../site/assistant/resource-report.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/assistant/semantic-manifest.json](../../site/assistant/semantic-manifest.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/i18n-docs.json](../../site/i18n-docs.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/i18n-lab.json](../../site/i18n-lab.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/i18n-space.json](../../site/i18n-space.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/lab-state.json](../../site/lab-state.json) | 观测初值、范围与表单校验目录 |
| [site/page-cache-manifest.json](../../site/page-cache-manifest.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/site-catalog.json](../../site/site-catalog.json) | 页面、导航、图解与资源版本的唯一目录 |
| [site/space/assets/nebulae/catalog.json](../../site/space/assets/nebulae/catalog.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/space/assets/population.json](../../site/space/assets/population.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/space/assets/stars.json](../../site/space/assets/stars.json) | 结构化资料、目录或生成元数据；按所在模块维护 |
| [site/space/textures/sources.json](../../site/space/textures/sources.json) | 结构化资料、目录或生成元数据；按所在模块维护 |

## 页面原稿（含目录生成区段）

| 路径 | 职责 |
| --- | --- |
| [site/404.html](../../site/404.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/analemma.html](../../site/analemma.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/contact.html](../../site/contact.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/diagrams.html](../../site/diagrams.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/geography-review.html](../../site/geography-review.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/googled6825228ef48cc89.html](../../site/googled6825228ef48cc89.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/index.html](../../site/index.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/lab.html](../../site/lab.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/lunar/index.html](../../site/lunar/index.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/space/index.html](../../site/space/index.html) | 页面结构；共享目录区段由site_sources同步 |
| [site/sundial.html](../../site/sundial.html) | 页面结构；共享目录区段由site_sources同步 |

## 验证与测试工具

| 路径 | 职责 |
| --- | --- |
| [tests/analemma-references.cjs](../../tests/analemma-references.cjs) | 回归验证：analemma-references |
| [tests/assistant-corpus.cjs](../../tests/assistant-corpus.cjs) | 回归验证：Corpus-wide generated coverage probes, not an independent accuracy benchmark. |
| [tests/assistant-coverage.cjs](../../tests/assistant-coverage.cjs) | 回归验证：Regression fixtures from short, paraphrased and scoped user questions. |
| [tests/assistant-prototype.cjs](../../tests/assistant-prototype.cjs) | 回归验证：Focused preview checks: real local inference, fallback, state isolation and layout. |
| [tests/assistant-reported.cjs](../../tests/assistant-reported.cjs) | 回归验证：User-reported tasks, actual controls, compact mobile chat and shared app-bar styling. |
| [tests/assistant-runtime.cjs](../../tests/assistant-runtime.cjs) | 回归验证：Exercise asynchronous ownership and cache/retry contracts without downloading another model. |
| [tests/assistant-short-queries.cjs](../../tests/assistant-short-queries.cjs) | 回归验证：assistant-short-queries |
| [tests/assistant-systematic.cjs](../../tests/assistant-systematic.cjs) | 回归验证：assistant-systematic |
| [tests/assistant-welcome.cjs](../../tests/assistant-welcome.cjs) | 回归验证：assistant-welcome |
| [tests/bilingual-pages.cjs](../../tests/bilingual-pages.cjs) | 回归验证：Check committed Chinese/English pairs without regenerating files or changing the checkout. |
| [tests/city-comparison-math.cjs](../../tests/city-comparison-math.cjs) | 回归验证：city-comparison-math |
| [tests/code-quality.cjs](../../tests/code-quality.cjs) | 回归验证：Reproduce the actual quality defects: locale routes, idempotent helpers and failed restores. |
| [tests/compact-playback.cjs](../../tests/compact-playback.cjs) | 回归验证：Keep the shorter playback panel usable in both scientific contexts. |
| [tests/confirmed-review-fixes.cjs](../../tests/confirmed-review-fixes.cjs) | 回归验证：Focused regressions for confirmed review findings; no whole-site audit. |
| [tests/custom-layout.cjs](../../tests/custom-layout.cjs) | 回归验证：Workspace presentation, deferred resize, keyboard access and isolated preferences. |
| [tests/customization-clean-urls.cjs](../../tests/customization-clean-urls.cjs) | 回归验证：customization-clean-urls |
| [tests/customization-entry.cjs](../../tests/customization-entry.cjs) | 回归验证：Public entry points: 3D mode gate, explicit empty builder, and discoverable Lab comparisons. |
| [tests/customization-hardening.cjs](../../tests/customization-hardening.cjs) | 回归验证：customization-hardening |
| [tests/customization-mode.cjs](../../tests/customization-mode.cjs) | 回归验证：customization-mode |
| [tests/deployment-paths.cjs](../../tests/deployment-paths.cjs) | 回归验证：Verify recovery assets at root and GitHub project paths, including nested 404 URLs. |
| [tests/diagram-add-discovery.cjs](../../tests/diagram-add-discovery.cjs) | 回归验证：diagram-add-discovery |
| [tests/diagram-continuity.cjs](../../tests/diagram-continuity.cjs) | 回归验证：diagram-continuity |
| [tests/diagram-desktop.cjs](../../tests/diagram-desktop.cjs) | 回归验证：diagram-desktop |
| [tests/diagram-editing.cjs](../../tests/diagram-editing.cjs) | 回归验证：diagram-editing |
| [tests/diagram-flows.cjs](../../tests/diagram-flows.cjs) | 回归验证：diagram-flows |
| [tests/diagram-geography.cjs](../../tests/diagram-geography.cjs) | 回归验证：diagram-geography |
| [tests/diagram-modes.cjs](../../tests/diagram-modes.cjs) | 回归验证：diagram-modes |
| [tests/diagram-observer-link.cjs](../../tests/diagram-observer-link.cjs) | 回归验证：diagram-observer-link |
| [tests/diagram-overlay-gestures.cjs](../../tests/diagram-overlay-gestures.cjs) | 回归验证：diagram-overlay-gestures |
| [tests/diagram-reference-store.cjs](../../tests/diagram-reference-store.cjs) | 回归验证：Reference transactions and old saves work without a browser or a second state model. |
| [tests/diagram-release-candidate.cjs](../../tests/diagram-release-candidate.cjs) | 回归验证：diagram-release-candidate |
| [tests/diagram-test-helpers.cjs](../../tests/diagram-test-helpers.cjs) | 回归验证：Use the same tab navigation a person uses in the reference workbench. |
| [tests/diagram-tools.cjs](../../tests/diagram-tools.cjs) | 回归验证：diagram-tools |
| [tests/diagram-workbench.cjs](../../tests/diagram-workbench.cjs) | 回归验证：diagram-workbench |
| [tests/disclosure-motion.cjs](../../tests/disclosure-motion.cjs) | 回归验证：Regression for first-open height measurement, reversal and reduced motion. |
| [tests/document-action-links.cjs](../../tests/document-action-links.cjs) | 回归验证：Chapter footers open their corresponding feature, rather than adjacent document sections. |
| [tests/document-entrance.cjs](../../tests/document-entrance.cjs) | 回归验证：Reading conversations: themes, complete dialogue, visit scope, failure and storage denial. |
| [tests/document-generation.cjs](../../tests/document-generation.cjs) | 回归验证：Invalid authoring fails before generation; metadata comes from structured sources. |
| [tests/documentation.cjs](../../tests/documentation.cjs) | 回归验证：Documentation roles, local references, downloads and the shared entrance. |
| [tests/experiment-save.cjs](../../tests/experiment-save.cjs) | 回归验证：Restore the actual conditions, reference stores and ground scene through the saved-layout UI. |
| [tests/experiment-share.cjs](../../tests/experiment-share.cjs) | 回归验证：Share a real classroom comparison into a fresh phone; invalid links cannot mutate state. |
| [tests/expressive-controls.cjs](../../tests/expressive-controls.cjs) | 回归验证：Expressive range presentation stays in sync with real keyboard and state-owner updates. |
| [tests/guided-experiments.cjs](../../tests/guided-experiments.cjs) | 回归验证：Goal-driven experiments, independent scrubbing, leap years and gesture history. |
| [tests/interaction-audit.cjs](../../tests/interaction-audit.cjs) | 回归验证：Editor state must not trap native controls, modal dialogs, or responsive sidebars. |
| [tests/interaction-history.cjs](../../tests/interaction-history.cjs) | 回归验证：Browser integration regression. Run with a local static server, Playwright and Chromium. |
| [tests/lab-inline-comparisons.cjs](../../tests/lab-inline-comparisons.cjs) | 回归验证：Native controls and comparisons share one workbench; no second Lab form. |
| [tests/lab-shared-customization.cjs](../../tests/lab-shared-customization.cjs) | 回归验证：lab-shared-customization |
| [tests/layout-invariants.cjs](../../tests/layout-invariants.cjs) | 回归验证：Real control geometry and the user's original typography are product invariants. |
| [tests/lunar-orbit.cjs](../../tests/lunar-orbit.cjs) | 回归验证：Independent Earthrise geometry and lazy, pauseable diagram integration. |
| [tests/material-components.cjs](../../tests/material-components.cjs) | 回归验证：Verify the shared Material contract across application, reading and embedded routes. |
| [tests/material-test-helpers.cjs](../../tests/material-test-helpers.cjs) | 回归验证：Browser-side contrast of a control, including the shared inset state layer. |
| [tests/menu-simplicity.cjs](../../tests/menu-simplicity.cjs) | 回归验证：Menu collapse is structural; layout editing uses one progressively disclosed entry. |
| [tests/mobile-appbar.cjs](../../tests/mobile-appbar.cjs) | 回归验证：Mobile identity precedes every navigation destination and the customization row. |
| [tests/multiview-interaction.cjs](../../tests/multiview-interaction.cjs) | 回归验证：Visible focus exit and stable target selection during repeated view replacement. |
| [tests/narrow-workspace-controls.cjs](../../tests/narrow-workspace-controls.cjs) | 回归验证：Small multi-view cards keep the chooser readable and actions on their own row. |
| [tests/observer-heading.cjs](../../tests/observer-heading.cjs) | 回归验证：Ground bearings must follow the same visible world directions as the sky. |
| [tests/parameter-controls.cjs](../../tests/parameter-controls.cjs) | 回归验证：Browser regression: switch alignment, uniform related-link gaps and responsive visibility. |
| [tests/preferences-test-helpers.cjs](../../tests/preferences-test-helpers.cjs) | 回归验证：Shared, visible settings flow replacing the retired top-bar language shortcut. |
| [tests/release-selection.cjs](../../tests/release-selection.cjs) | 回归验证：Scope release checks without letting an empty/unknown diff run the full suite. |
| [tests/reported-layout.cjs](../../tests/reported-layout.cjs) | 回归验证：Current reported object editing and document navigation behavior. |
| [tests/reported-ui.cjs](../../tests/reported-ui.cjs) | 回归验证：Reproduce the reported nested border, tall Moon pane and exclusive-choice defects. |
| [tests/review-followup.cjs](../../tests/review-followup.cjs) | 回归验证：Corrupt history envelopes, restoration failure recovery, visible font retry and stale output. |
| [tests/review-regressions.cjs](../../tests/review-regressions.cjs) | 回归验证：Regressions for review 9913064: font deadlines, calendar drafts/focus and explicit locales. |
| [tests/scene-builder-expanded.cjs](../../tests/scene-builder-expanded.cjs) | 回归验证：scene-builder-expanded |
| [tests/scene-builder-pointer.cjs](../../tests/scene-builder-pointer.cjs) | 回归验证：scene-builder-pointer |
| [tests/scene-builder-recovery.cjs](../../tests/scene-builder-recovery.cjs) | 回归验证：Damaged measurement archives must not disable an otherwise valid ground scene. |
| [tests/scene-builder.cjs](../../tests/scene-builder.cjs) | 回归验证：scene-builder |
| [tests/session-validation.cjs](../../tests/session-validation.cjs) | 回归验证：Session corruption, legacy migration, valid observations and unavailable storage. |
| [tests/settings-center.cjs](../../tests/settings-center.cjs) | 回归验证：User-visible preferences: shared state, real controls, accessibility and safe recovery. |
| [tests/settings-expressive.cjs](../../tests/settings-expressive.cjs) | 回归验证：Real menu, pointer and touch interactions for shared settings controls. |
| [tests/settings-updates.cjs](../../tests/settings-updates.cjs) | 回归验证：Requested navigation, continuous reading, independent backgrounds and sky panes. |
| [tests/shared-choice-fields.cjs](../../tests/shared-choice-fields.cjs) | 回归验证：Selection fields share one renderer without changing their existing state owners. |
| [tests/shared-ui-lifecycle.cjs](../../tests/shared-ui-lifecycle.cjs) | 回归验证：Regression for focus across the responsive parameter drawer and a locale click during dictionary startup. |
| [tests/sidebar-surfaces.cjs](../../tests/sidebar-surfaces.cjs) | 回归验证：Shared filled surface geometry for results and disclosure menus. |
| [tests/solar-location-link.cjs](../../tests/solar-location-link.cjs) | 回归验证：solar-location-link |
| [tests/solar-study.cjs](../../tests/solar-study.cjs) | 回归验证：solar-study |
| [tests/space-appearance.cjs](../../tests/space-appearance.cjs) | 回归验证：Real surface assets, resilient rendering and unchanged ephemerides in desktop/mobile views. |
| [tests/space-earth-frame.cjs](../../tests/space-earth-frame.cjs) | 回归验证：Earth texture orientation and solar lighting use one geometric spatial frame. |
| [tests/space-exploration.cjs](../../tests/space-exploration.cjs) | 回归验证：Regression: history shares the existing coordinate model and never invents a closed orbit. |
| [tests/space-immersive-escape.cjs](../../tests/space-immersive-escape.cjs) | 回归验证：Escape closes the 3D observation disclosure before leaving immersive mode. |
| [tests/space-model.cjs](../../tests/space-model.cjs) | 回归验证：Node-only checks for coordinate handedness, ephemeris consistency and display-scale separation. |
| [tests/space-observer.cjs](../../tests/space-observer.cjs) | 回归验证：Coordinate parity across local sky and space views; this is an internal regression, not independent accuracy certification. |
| [tests/space-population.cjs](../../tests/space-population.cjs) | 回归验证：space-population |
| [tests/space-stars.cjs](../../tests/space-stars.cjs) | 回归验证：Verify reference catalog and frame/color mapping independently of WebGL. |
| [tests/stable-navigation.cjs](../../tests/stable-navigation.cjs) | 回归验证：stable-navigation |
| [tests/storage-recovery.cjs](../../tests/storage-recovery.cjs) | 回归验证：Corrupted and restricted storage must not prevent working scientific controls. |
| [tests/ui-palette.cjs](../../tests/ui-palette.cjs) | 回归验证：UI roles have one definition; real controls follow the shared green in every mode. |
| [tests/ui-shared-rendering.cjs](../../tests/ui-shared-rendering.cjs) | 回归验证：Reported UI regressions: inspect painted corners, shared states and actual navigation behavior. |
| [tests/unified-customization.cjs](../../tests/unified-customization.cjs) | 回归验证：unified-customization |
| [tests/unified-workbench.cjs](../../tests/unified-workbench.cjs) | 回归验证：Real menu gestures across the three historical entries, linked plots and both bodies. |
| [tests/welcome-opening.cjs](../../tests/welcome-opening.cjs) | 回归验证：Constellation opening: coherent reveal, locale return, activation and reduced motion. |
| [tests/workbench-header.cjs](../../tests/workbench-header.cjs) | 回归验证：Keep the workbench in one compact header and 3D comparison in its view menu. |
| [tests/workbench-menu-link.cjs](../../tests/workbench-menu-link.cjs) | 回归验证：workbench-menu-link |
