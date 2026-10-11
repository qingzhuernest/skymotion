# SkyMotion · 天体视运动实验室

面向课堂演示与自主探索的中文天文地理网页工具。文档核对日期：**2026年10月11日**。通过地点、日期和时刻，联动太阳、月球、地球昼夜、日影与日晷，让图形、读数和观察任务一起呈现。采用 Material Design 风格，支持桌面、平板和手机，无需 Flash 或浏览器插件。

**[进入网站](https://skymotion-5md.pages.dev/)** · **[进入实验台](https://skymotion-5md.pages.dev/lab.html)**

## 开源许可

原创应用代码采用 **[GNU AGPLv3](LICENSE)**（`AGPL-3.0-only`），允许商业使用。分发时须遵守对应源码和声明要求；修改后通过网络向用户提供交互服务时，须按第13条向这些用户明确提供修改版的对应源码。软件不提供许可条款以外的保证。

版权与适用范围见 [NOTICE](NOTICE)。第三方库、数据、字体和影像保留原许可及来源条件，见 [第三方声明](THIRD-PARTY-NOTICES.md)，不能统一重新授权为 AGPL。网页中的说明位于 [项目介绍](https://skymotion-5md.pages.dev/project-guide.html#license)。

## 可以观察什么

- **太阳视运动**：比较一天内的变化、全年同一时刻、季节与纬度；查看空间、地平和地面观察视角。
- **月相与月球**：月相变化、每日天空轨迹、不同日期同一时刻的位置，以及行星伴月。
- **地球昼夜**：球面与平面地图；拖动可选择仅旋转相机，或联动观察地点。
- **日影与日晷**：杆影、影尖轨迹，以及可以调节日期、时间和针长的水平日晷与赤道日晷。
- **太阳系三维模型**：[八大行星与日地月空间关系](https://skymotion-5md.pages.dev/space/)，可旋转、缩放、聚焦和按UTC日期连续播放；细化行星外观，背景采用HYG目录的61,816颗恒星（J2000方向、星等与近似恒星颜色），支持相机预设、月球近景、历史轨迹、真实距离读数、黄道参考面与地轴/赤道；地球自转和光照按同一UTC定向；[原图解与三维对照](https://skymotion-5md.pages.dev/diagrams.html?compare=1)共用原时间工作台，独立三维页另有黄道俯视与本地天空参照，以及[沉浸式满窗口观察](https://skymotion-5md.pages.dev/space/?immersive=1)，保留时间条和侧拉参数菜单，并提供无标签卫星群、主带小行星、周期彗星和真实星云影像；新增轨道近似与影像放大范围有明确说明。
- **日行迹**：比较全年固定钟表时或当地真太阳时的太阳位置，独立研究地轴倾角与轨道偏心率对“8”字的影响。

模式切换、选项选择和参数调整支持浏览器返回撤回、前进重做；连续滑条调整合并为一步，菜单开合与旋转或缩放画面不记录，恢复设置暂停播放。图形、时间条和参数区分别占位，避免操作时相互遮挡。宽度大于760像素时默认显示参数侧栏，可通过侧栏顶部“收起菜单”手柄主动收起，点击/向右拖动边缘箭头恢复；窄屏及沉浸三维模式使用侧拉抽屉。菜单显隐选择保存在当前浏览器会话中，控件切换采用共享弹性滑动底色，关联选项、菜单、折叠项与按钮反馈使用一致的小幅回弹，并遵循减少动态效果偏好。浅色参数区和深色天空图采用各自的文字配色。三维太阳系通过顶栏“三维天空”直接进入，也保留“关联图解 → 空间模型”入口，保持原实验台状态与渲染管线；关联图解可以开启三维对照，两边代表同一实际时刻。

## 三份文档

| 文档 | 主要用途 |
| --- | --- |
| [学习指南](https://skymotion-5md.pages.dev/guide.html) | 详细操作步骤、控制变量、观察任务与问题处理 |
| [项目介绍与地理模型说明](https://skymotion-5md.pages.dev/project-guide.html) | 开发目的、教学和使用优点、数据依据与适用范围 |
| [完整开发逻辑与维护说明](https://skymotion-5md.pages.dev/development-guide.html) | 已实现的页面结构、状态、计算、渲染、交互、验证与发布细节 |

三份网页文档共用排版和互相跳转的入口。对应的 Markdown 版本也保存在仓库中：[学习指南](learning-guide.md)、[项目介绍](project-guide.md)、[开发维护](development-guide.md)。

## 本地运行与发布

仓库根目录是正式网站的静态 HTML、CSS、JavaScript 和图片资源；入口为 `index.html`，部署无需构建。

```sh
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。向 `main` 推送修改后，[GitHub Actions](https://github.com/qingzhuernest/skymotion/actions) 自动部署到现有 Cloudflare Pages 项目 `skymotion`，网站地址保持不变，也可手动触发部署。

部署配置位于 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。所需的 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` 已通过 GitHub Secrets 配置；凭据不应写入源码。两个站点共用 `.github/scripts/prepare_site.py`，排除 README、隐藏配置、测试、数据生成脚本和历史归档；保留网页文档、模型数据及 LICENSE、NOTICE 和第三方许可文件。

## 源码格式与维护

应用的 HTML、CSS 和 JavaScript 以两空格缩进、100字符目标行宽为维护规范；部分近期修改尚未全量重新格式化，不应将规范描述理解为所有文件已经通过格式检查。函数、条件分支和样式规则展开书写，专题脚本顶部标明职责。格式配置保存在 `.prettierrc.json`，由 Prettier 3.6.2 统一处理。

```sh
npx prettier@3.6.2 --check "*.js" "*.css" "*.html" "space/**/*.js" "space/**/*.css" "space/**/*.html"
npx prettier@3.6.2 --write "*.js" "*.css" "*.html" "space/**/*.js" "space/**/*.css" "space/**/*.html"
```

`.prettierignore` 排除第三方 `astronomy.js` 与 `space/vendor/`，保留其上游代码与许可。功能改动按影响范围检查交互、边界和响应式布局，并同步三份网页说明与Markdown版本。main直接维护根目录网页；旧模板和生成器在project-archive分支，不能覆盖当前页面。控件动画在interface-motion.js/CSS中维护，科学时钟仍由motion.js及各模块负责。

以下六组回归在本次文档核对时重新运行通过，检查坐标、照明、目录数据与显示尺度的内部一致性；它们不是独立观测精度认证：

```sh
node tests/space-model.cjs
node tests/space-earth-frame.cjs
node tests/space-stars.cjs
node tests/space-population.cjs
node tests/space-observer.cjs
node tests/space-exploration.cjs
```

## 科学模型与限制

日期观测采用 **Astronomy Engine 2.1.19**；理想太阳实验使用独立几何模型。主时刻轴是当地真太阳时，固定钟表时实验采用明确的 UTC 偏移，不自动处理夏令时。

升落按天体中心穿越几何地平线计算，未计大气折射、天体视半径、地形与天气；球体大小、距离及部分装置结构为教学示意。不能把所有图形直接当作真实照片或精确观测预报。具体定义与验证范围见项目说明，资源归属见 [credits.txt](credits.txt)。已有检查以 Chromium 为主，不代表所有设备和浏览器的兼容性认证。

## 历史资料与反馈

[project-archive 分支](https://github.com/qingzhuernest/skymotion/tree/project-archive/archive) 保存截至归档时本地保留的 32 个历史部署 ZIP、文档、生成脚本、开发记录及暂停的预览，附逐文件清单与 SHA-256。归档分支不触发正式网站部署；旧资料未必反映当前版本。

欢迎老师、学生与天文爱好者提出知识疑问、操作问题和教学建议。请附模块、地点、日期、时刻、复现步骤及设备／浏览器信息。可提交 [GitHub Issue](https://github.com/qingzhuernest/skymotion/issues)，或通过 [联系作者](https://skymotion-5md.pages.dev/contact.html) 反馈。

世界上存在着，唯有不断前行才能传达的事物

浏览器返回/前进的集成回归见 `tests/interaction-history.cjs`，检查模式切换、滑条调整合并、图解路由、三维行星与日期撤回，曲线拖动调整、三维标题与标签恢复、嵌入相机选项撤回，以及菜单开合和相机拖动不产生步骤。需启动静态服务器并在测试环境安装Playwright及Chromium；应用部署本身不依赖它们。可通过 `SKY_MOTION_TEST_URL` 指定预览网址，`SKY_MOTION_CHROMIUM` 指定浏览器路径，`SKY_MOTION_PLAYWRIGHT` 指定已安装模块路径。

本次功能总结与核验范围见[网页检查记录（2026-10-10）](BUG-AUDIT-2026-10-10.md)。

## 双站点自动发布

Cloudflare 正式站点：<https://skymotion-5md.pages.dev/>。GitHub Pages 镜像：<https://qingzhuernest.github.io/skymotion/>，Pages 已启用，main 推送自动更新；若重新配置，在[仓库 Pages 设置](https://github.com/qingzhuernest/skymotion/settings/pages)把 Source 选择为 GitHub Actions，再运行 `Sync SkyMotion to GitHub Pages`。私有仓库需要支持 Pages 的 GitHub 套餐；工作流不会改变仓库可见性。未启用时仅报告等待配置，不影响 Cloudflare 发布。

两个工作流都从 main 的同一次提交调用 `.github/scripts/prepare_site.py` 打包。发布包排除测试、数据生成脚本、内部检查记录、历史归档和隐藏配置；这些维护文件保留在仓库。仅保留一份 GitHub Pages 发布工作流，避免与自动生成的 static.yml 重复部署。除 GitHub 项目子路径下的404恢复链接外，网页与资源使用同一份文件；图形、参数、文档、三维功能一致。镜像保留 Cloudflare 的 canonical 链接与站点地图，搜索引擎的主要网址继续指向正式站点。首次启用后，每次推送 main 自动部署两边；必要时可分别在 Actions 中重新运行发布。
