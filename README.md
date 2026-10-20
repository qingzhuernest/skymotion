# SkyMotion · 天体视运动实验室

**简体中文** · [English](README.en.md)

## 发布状态

2026 年 10 月 20 日正式版加入已审查的第 72 版自定义功能：固定菜单、实验台内地点与时间对照、图中参考对象、物体搭建、三维常驻入口，以及太阳／月球空白起点和统一配色。保留原有地升地落及字体加载优化。`main` 包含 13 对中英文页面，发布时运行全部根目录回归脚本。

[自定义交互说明](docs/customization-interaction.zh.md) · [本次发布说明](docs/RELEASE-2026-10-20.zh.md)

正式版已采用审查过的双语 Impeccable 界面。[Cloudflare Pages](https://skymotion-5md.pages.dev/) 为主站，[GitHub Pages](https://qingzhuernest.github.io/skymotion/) 镜像同一份受版本控制的内容。推送 `main` 会触发两个部署工作流；其他分支不会部署正式站，手动运行也受分支限制。

原有天文引擎、历表和科学模型保持正式版实现。界面统一使用衬线字体与颜色变量，英文采用 Charter，支持保留实验状态的语言切换、自动生成英文页面及空闲时后台预加载。当前页面数量见上方发布说明。

## 本地运行

```sh
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。英文页面使用同目录的独立文件，例如 `lab.en.html` 与 `space/index.en.html`。

## 重新生成英文页面

```sh
python3 scripts/prerender-pages.py --dist .
```

修改中文 HTML 与 `i18n-*.json` 翻译字典后，重新生成英文 HTML、`language-data.js` 和 `page-cache-manifest.json`。生成过程保留 DOM ID、表单值、数值属性及科学计算脚本。

## 文档与许可

- 学习指南：[简体中文](learning-guide.md) · [English](learning-guide.en.md)
- 项目介绍：[简体中文](project-guide.md) · [English](project-guide.en.md)
- 开发说明：[简体中文](development-guide.md) · [English](development-guide.en.md)
- 应用代码采用 [AGPLv3](LICENSE)。字体、图片及第三方库许可见[第三方声明](THIRD-PARTY-NOTICES.md)。

本仓库不包含 GPT Site 托管配置、临时凭据、审查截图或本地插件安装文件。

## 审查回归检查

启动本地服务器并准备好 Playwright 后，运行 `node tests/review-regressions.cjs`。可通过 `SKY_MOTION_TEST_URL`、`SKY_MOTION_PLAYWRIGHT` 和 `SKY_MOTION_CHROMIUM` 指定服务器、模块和浏览器可执行文件。

检查覆盖字体加载超时与重试、显式语言选择后的导航、日历月份与年份、闰日截断、浏览器撤销，以及手机和平板宽度下的键盘焦点。

## 发布与回滚：2026 年 10 月 13 日

核心天文库和模型数据相对于正式基线 `4390ab1` 保持不变。界面检查覆盖 36 组控件布局、44 次首次展开、交互历史、语言导航、字体超时恢复及日历键盘操作。检查主要基于 Chromium，不代表完整的 Safari、Firefox 或所有 GPU 实机认证。

修改中文 HTML 或字典后，应重新生成英文页面，并同步三份文档的中英文 Markdown 下载文件。字体准备有 8 秒超时与明确的重试入口。后台预加载在前台页面准备好后开始，以两个低优先级请求并行执行；它不是离线应用，也不保证所有页面立即进入缓存。

发布前的正式提交保留为 `production-before-impeccable-20261013` 标签。需要恢复时创建新的恢复提交，不要强制推送 `main`。确认发布完成前应检查两个部署工作流。`tests/deployment-paths.cjs` 验证根路径和 GitHub 项目子路径下的打包结果。

## 会话加固与部署检查：2026 年 10 月 14 日

`experiment-storage.js` 在恢复实验状态前校验日期、数值范围、类型和枚举值。有效的旧会话仍可读取，保存使用 `schemaVersion: 1`。非法字段使用默认值，未知版本不予恢复。存储被禁用或空间不足时，回退为当前页面内独立的内存快照。三维观测状态使用相同的日期与坐标校验。

两个正式部署工作流都必须先通过 `.github/workflows/validate.yml`。它在 `tests/browser` 中安装锁定版本的 CI 浏览器工具，启动临时本地服务器，并自动发现、运行 `tests/` 根目录的所有 `.cjs` 回归脚本。浏览器工具与测试源文件不随网站打包发布。

本地使用 Node 22 或更新版本、Python 3 和 Chromium 运行同一检查：

```sh
npm ci --prefix tests/browser
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" SKY_MOTION_CHROMIUM=/usr/bin/chromium node .github/scripts/verify-site.cjs
```

如果尚未安装 Chromium，运行 `tests/browser/node_modules/.bin/playwright install --with-deps chromium`，再将 `SKY_MOTION_CHROMIUM` 设为 Playwright 返回的可执行文件路径。浏览器回归主要验证 Chromium，不等于完整的实机兼容性认证。

## 审查后续修复：2026 年 10 月 14 日

恢复前会校验历史快照，不兼容记录回退到有效状态；带代次判断的 `finally` 确保释放撤销锁。语言切换失败会显示本地化提示，并允许重试目标语言。

双语 CI 会检查生成结果是否最新、结构是否一致，以及英文页面是否存在未翻译正文（有意保留的双语引文除外）。运行 `python3 scripts/prerender-pages.py --check` 可以只读检查英文 HTML、翻译集合和预加载清单。`tests/review-followup.cjs` 覆盖损坏历史、适配器失败、移动端重试及过期生成结果；正式发布检查会自动发现全部回归脚本。

## 欢迎页与文档开场：2026 年 10 月 14 日

中文欢迎页保留原来的手写风格底部文字。英文模式在相同的底部居中位置显示：

> Everyone here wants to understand something. What matters is whether you can stay curious when the answers don't come.

两种语言沿用温暖夜色，英文使用本地 Charter。它们是分别选择的寄语，不是互译。英文寄语不再放在主入口下方；欢迎页只准备当前语言需要的字体。

首次进入欢迎页时，星点与连线组成 Ad Astra，保持星座画面，用户点击后才散入互动星空并显露首页。每个标签页仅播放一次；Enter 或空格也可开始，减少动态效果时直接显示首页。

Ad Astra 采用本地 Charter 斜体的曲线轮廓，由约 400 颗暖白星点和淡金细线组成。字形预先生成，首次显示不增加字体请求；散开仍须点击、Enter 或空格触发。

三篇文档各有一段原创的完整中英文对话，分别讨论地理学习、模型与世界、模型失效后的再观察。语句逐句从两侧显现，可继续阅读或用键盘跳过。欢迎页入口由深色平缓转为浅色；浅色入口保持纸色。每篇文档在同次访问中只展示一次，内部跳转、返回与刷新不重播；新的独立或外部干净链接访问可再次播放。开场星点的色彩和亮度在散开过程中连续融合，不在结束时突变。

## 加载性能与顺序

早期字体优化测量中，Reading WOFF2 子集共 711,888 字节，缩小约 26%，并验证字符覆盖、轮廓和字宽不变。`scripts/optimize-reading-fonts.py` 可复现该优化。后台预加载优先当前语言，当时保留 24 个页面，排除过期字体，并与前台使用一致的 Reading 字体版本 URL。一次受控 Chromium 冷加载对比（80 毫秒延迟、500 KB/s）中，中文字体就绪由 3.60 秒改善至 3.10 秒；实际设备和网络表现会变化。

仅 `page-boot.js` 阻塞解析，以便在显示内容前选择正确语言。其他外部脚本采用 `defer`，保持依赖顺序。欢迎页 Canvas 和文档对话不等待共享翻译字典下载完成，使用自己的双语文本。语言初始化仍等待 DOMContentLoaded，以确保实验全局对象存在。封面失败恢复也会等待延迟脚本启动，避免跳过正常开场。

另一次受控解析顺序对比（Chromium、100 毫秒延迟、500 KB/s）中，在共享资源相同的情况下，英文星座开场脚本就绪由 2.90 秒改善至 1.31 秒。这衡量开场启动，不代表整个应用可交互时间或 Safari 实机表现。

## 地升地落演示：正式版

“关联图解 → 月球 → 地升地落”打开独立的圆形绕月轨道模型。保留原有左侧说明与参数栏、底部控制区；右侧图像使用一个 WebGL 上下文呈现轨道示意和宇航员视角。

地升播放在月缘附近放慢，地球完整露出后暂停；转出视野时提供朝向地球的提示。轨道高度、日地月构型、视场、月面固定对比和月缘接触演示均独立于按日期计算的原实验台。首帧、纹理、字体和边栏在后台准备好后一起切换，冷加载时保留当前图解。首页没有新增入口；该功能已纳入本次正式发布。

拖动以屏幕像素区分月球与观察者，并保留初始抓取偏移。调整高度会暂停并取消沿用旧接触位置的演示；地升暂停后可继续同一段演示。示意轨道随高度变化，观察者标记保持可辨认，跟踪地球的镜头在经过正上方时保持连续。
