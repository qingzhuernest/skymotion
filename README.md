# SkyMotion · 天体视运动实验室

面向地理课堂、学生自主探究和天空爱好者的中文网页实验室。通过地点、日期与时刻，联动太阳、月球、地球昼夜、日影、日晷和太阳系空间关系，让学习者能控制变量、读取结果，并用另一张图核对。

**[进入正式网站](https://skymotion-5md.pages.dev/)** · **[进入实验台](https://skymotion-5md.pages.dev/lab.html)** · **[GitHub Pages 镜像](https://qingzhuernest.github.io/skymotion/)**

文档更新：**2026年10月11日**。维护源为本仓库 `main`；历史归档不代表当前版本。

## 为什么开发

静态地理图能展示某一条件下的现象，但不容易让学生验证“只改变纬度、季节或时间会怎样”。SkyMotion 把这些条件变成可调参数，将地面所见与空间关系联系起来。每次观察可以记录固定条件、改变变量和读数，而不只观看动画。

项目的主要优点是：太阳与月球各自保存设置；一天内与跨日期比较分开；多图共用观察条件；原图解可以与三维同步对照；图形和时间条分别占位；模式、选择和参数调整可以用浏览器返回撤回、前进重做。真实星历、理想成因模型和视觉示意比例有明确边界。

## 可以观察什么

| 模块 | 主要观察内容 |
| --- | --- |
| 太阳视运动 | 一天、全年固定时刻、季节与纬度；高度、方位、赤纬、昼长和日影 |
| 月相与月球天空 | 日地月关系、逐日照明、月球当天轨迹、升落和行星伴月 |
| 关联图解 | 直射点与昼夜、全天高度、升落方位、地轴与地平面；四图共用条件对照 |
| 日影与日晷 | 竖直杆影、杆尖影迹；水平与赤道日晷的装置、读数与安装关系 |
| 日行迹 | 全年固定钟表时或真太阳时；独立分析倾角与轨道偏心率的贡献 |
| [三维天空](https://skymotion-5md.pages.dev/space/) | 八大行星、日地月、近景、历史轨迹、二维参照及沉浸观察 |

原有图解与三维对照使用同一物理时刻；独立三维页采用自己的 UTC 时钟。沉浸模式提供目录恒星、卫星群、小行星、周期彗星和带来源的真实星云影像。放大与距离压缩属于教学显示，真实距离看读数，不能用屏幕像素测量太阳系。

## 多端操作

宽度大于 760 像素时默认显示可滚动参数侧栏，可以主动收起扩大图形；窄屏与沉浸三维使用侧拉菜单。图形、时间条与参数区各自占位，平板不会仅因触屏而强制隐藏菜单。

参数文字与开关分列对齐，长文字可以换行，控制器保持尺寸；关联入口统一间距，同栏子级折叠设置放在平级按钮和开关之后。原生输入、标签点击、键盘焦点和禁用状态保持可用。弹性反馈由共享控件层负责，不改写科学时间，并遵循系统的减少动态效果偏好。

## 三份文档

| 文档 | 主要用途 | 仓库版本 |
| --- | --- | --- |
| [学习指南](https://skymotion-5md.pages.dev/guide.html) | 详细操作路径、控制变量、任务单、记录表与常见问题 | [learning-guide.md](learning-guide.md) |
| [项目介绍](https://skymotion-5md.pages.dev/project-guide.html) | 开发目的、项目优点、多端体验、数据依据和模型范围 | [project-guide.md](project-guide.md) |
| [开发说明](https://skymotion-5md.pages.dev/development-guide.html) | 文件职责、状态与时间、计算和渲染、交互、回归及发布 | [development-guide.md](development-guide.md) |

网页文档共用阅读排版与互相跳转入口。新增内容归入对应章节，Markdown 与网页同步；学习指南不承担源码说明，项目介绍不重复完整操作步骤。

## 科学模型与数据

日期观测使用本地 **Astronomy Engine 2.1.19**，支持 1900—2100 年；太阳理想实验与日行迹成因实验采用独立模型。主实验时刻是当地真太阳时；钟表对照使用指定的固定 UTC 偏移，不自动处理夏令时。

升落以天体几何中心穿越 0° 地平线为准，未加入大气折射、视半径、海拔、地形或天气。月相与当地月面朝向分别处理；月球一天轨迹不强制闭合。不模拟日食、月食遮挡，也不提供精确连续合相预报。

三维恒星背景来自 HYG 4.1：普通模式 8,920 颗，沉浸模式 61,816 颗，保留 J2000 方向、星等与 B−V 近似颜色。当前轨道快照包含 455 条卫星轨道、1,200 颗主带小行星和 12 颗周期彗星；多数采用固定平均要素近似，不是实时发现总数或精密摄动星历。星云处理配色与放大范围另有说明。数据与素材来源见 [第三方声明](THIRD-PARTY-NOTICES.md)。

## 源码与本地预览

本项目为静态多页面网站：HTML、CSS、原生 JavaScript、Canvas 2D 和 WebGL；独立三维页使用本地 Three.js 0.186.1。没有必需后端、账号、数据库或在线星历请求，也没有 Service Worker 离线安装。

- `app.js`、`moon.js`、各专题脚本：科学状态、时间换算、模型与绘制。
- `page-navigation.js`、`time-workbench.js`：工作区布局、控件重组和时间操作。
- `motion.js`：原实验画布的统一调度；`interface-motion.js/CSS`：独立控件动画。
- `controls.css`：参数行、开关、字段和关联入口的共享对齐与间距。
- `interaction-history.js` 及页面适配器：参数操作的撤回和重做。
- `space/`：三维模型、场景、观察工具、参照、沉浸及本地数据。
- `documents.css`：三份文档的统一阅读排版。

预览发布文件，避免把仓库配置作为网站公开。输出目录必须尚不存在；新增资源需要先被 Git 跟踪：

```sh
python3 .github/scripts/prepare_site.py --output /tmp/skymotion-preview
python3 -m http.server 8000 --bind 127.0.0.1 --directory /tmp/skymotion-preview
```

打开 `http://127.0.0.1:8000/`。再次打包时更换输出目录或清理自己的旧预览。

## 检查与维护

2026年10月11日文档核对时重新运行以下六组模型回归，全部通过。它们检查坐标、轨道、照明、目录和输入边界的内部一致性，不是独立观测精度认证。

```sh
node tests/space-model.cjs
node tests/space-earth-frame.cjs
node tests/space-stars.cjs
node tests/space-population.cjs
node tests/space-observer.cjs
node tests/space-exploration.cjs
```

浏览器回归需要预览服务器、Playwright 和 Chromium；部署应用不依赖这些测试工具：

```sh
SKY_MOTION_TEST_URL=http://127.0.0.1:8000/ node tests/interaction-history.cjs
SKY_MOTION_TEST_URL=http://127.0.0.1:8000/ node tests/disclosure-motion.cjs
SKY_MOTION_TEST_URL=http://127.0.0.1:8000/ node tests/parameter-controls.cjs
```

可通过 `SKY_MOTION_CHROMIUM` 指定浏览器路径，`SKY_MOTION_PLAYWRIGHT` 指定模块路径。同日控件核验覆盖九个页面、四种宽度的 36 组布局，以及 44 个首次展开场景；还检查标签点击、空格键、反向折叠和模式可用性。Chromium 软件 WebGL 的状态检查不能替代实际 Safari、Firefox 或不同 GPU 的流畅度验收。历史证据见 [2026-10-10 检查记录](BUG-AUDIT-2026-10-10.md)。

源文件使用两空格缩进、100 字符目标行宽，Prettier 配置位于 `.prettierrc.json`；尚未全量格式复核。第三方库由 `.prettierignore` 排除，保留上游代码与许可。只格式化改动文件，功能改动按影响范围验证并同步文档；不要用归档分支的旧生成器覆盖 main。

## 双站点自动发布

`main` 推送自动触发两份工作流：

| 目标 | 工作流 | 地址 |
| --- | --- | --- |
| Cloudflare Pages 正式站 | [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | https://skymotion-5md.pages.dev/ |
| GitHub Pages 镜像 | [.github/workflows/github-pages.yml](.github/workflows/github-pages.yml) | https://qingzhuernest.github.io/skymotion/ |

两边复用 [.github/scripts/prepare_site.py](.github/scripts/prepare_site.py)，排除 README、隐藏配置、测试、生成脚本、内部记录与归档；保留网站资源、三份 Markdown 和许可文件。GitHub 项目子路径只需改写 404 恢复链接，其余内容来自同一份文件。镜像保留正式站 canonical 与站点地图。

Cloudflare 凭据由 GitHub Secrets 提供，不能放进源码或文档。发布后检查工作流结论、线上资源、专题链接、404 和手机交互；部署成功不等于搜索引擎已经收录，也不等于真实设备性能验证。

## 开源许可与反馈

原创应用代码采用 **[GNU AGPLv3](LICENSE)**（`AGPL-3.0-only`），允许商业使用。分发须遵守对应源码和声明要求；修改后通过网络提供交互服务时，须按第 13 条向远程使用者明确提供获取修改版对应源码的机会。范围见 [NOTICE](NOTICE)。第三方库、数据、字体和影像保留原许可，不能统一重新授权为 AGPL，见 [第三方声明](THIRD-PARTY-NOTICES.md)。

欢迎老师、学生与天空爱好者反馈。请附模块、地点、日期、时刻、操作顺序、设备与浏览器，可提交 [GitHub Issue](https://github.com/qingzhuernest/skymotion/issues) 或通过 [联系作者](https://skymotion-5md.pages.dev/contact.html) 联系。

[project-archive](https://github.com/qingzhuernest/skymotion/tree/project-archive/archive) 保存历史快照与生成资料；旧文档按其记录日期阅读，不作为当前功能说明。
