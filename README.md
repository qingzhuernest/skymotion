# SkyMotion · 天体视运动实验室

自定义支持跨图选中城市联动；“排列与收藏”可选择连同观测条件、参考对象与搭建物体保存完整实验。

面向地理课堂和自主观察的浏览器实验室。用地点、日期和时刻控制太阳、月球、日影、日晷与日行迹，通过关联图解和三维视图核对结果。原生 HTML、CSS 和 JavaScript，无需构建即可运行。

**简体中文** · [English](README.en.md)

[打开正式站](https://skymotion-5md.pages.dev/) · [GitHub Pages 镜像](https://qingzhuernest.github.io/skymotion/)

实验台、关联图解和日行迹现共用一个工作区。原网址仍可打开对应视图；顶部主菜单保持稳定。左侧先选“视图与布局”，展开“天空与日影”“关联图解”或“全年变化”，点击具体图名查看；切到“观测条件”继续调地点、日期、时刻与原来的实验参数。

要在实验台同屏显示天空、地球、高度曲线和日行迹：先打开空间视图，再从语言旁进入自定义，切到“视图与布局”，依次点击这些图名右侧的加入控件。已加入的控件表示移除；点击图名仍用于查看或替换当前画格。更多图可以继续加入，超过四图后向下滚动查看。

界面采用 Material Design 3 的共享颜色、形状、状态与控件尺寸。顶部左侧显示标题和地点；太阳／月球使用单个选择框。四个天空视角统一位于“视图与布局 → 天空与日影”，画布上方不再重复显示。

## 使用与文档

- [文档中心](docs.html)：顶部统一入口，按教学、功能使用和开发查阅。
- [学习指南](learning-guide.md)：课程设计、探究任务、观察记录和评价。
- [项目介绍与功能使用](project-guide.md)：全部模块、参数、对照、自定义、保存与操作方法。
- [开发说明](development-guide.md)：源码职责、状态、计算、渲染、检查与部署。
- [自定义操作](docs/customization-interaction.zh.md)：添加城市、时间标记、参考线和实验物体，编辑属性并保存方案。

自定义入口位于语言按钮旁。进入后，“观测条件”继续控制基准实验，“图中对象”负责添加和调整对照。城市与时刻在相关图中联动，杆、球和圆圈等在实验地面摆放。操作示例见[学习指南的自定义章节](guide.html#customization)。

“实验台 → 月球 → 视图与布局 → 地升地落”提供绕月轨道与宇航员视角的联动演示。该演示使用独立的示意轨道，保留左侧说明、参数栏和底部控制；它不是按真实日期求得的航天器轨道预报。

## 本地运行

```sh
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。英文使用独立页面，例如 `lab.en.html` 和 `space/index.en.html`。需要现代浏览器；三维视图需要 WebGL。

## 修改文档与双语页面

文档中心与三份手册的双语原稿统一保存在 `docs/document-content.json`。先生成 HTML 和 Markdown，再生成英文页面与共享字典：

页面和视图目录统一在 `site-catalog.json`，观测初值与校验规则统一在 `lab-state.json`。修改这些数据后先运行 `python3 scripts/site_sources.py`；生成区段由检查核对，不再手工维护多份目录或枚举。

```sh
python3 scripts/site_sources.py
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py --dist .
python3 scripts/prerender-pages.py --check
```

生成器同步英文 HTML、`language-data.js` 和资源预热清单，同时保留 DOM ID、表单值、数值属性与科学脚本。三份文档的中英文 Markdown 下载文件也须同步。内容按主题更新到原章节，不在文末叠加发布日志。

界面颜色统一在 `ui-palette.css` 定义，控件通过 `--design-*` 变量调用；不要在页面模块里另写色号。对象菜单将撤销、重做并入操作行，帮助按需展开，给列表和属性保留空间。

[界面集中审查记录](docs/ui-code-review.zh.md)列出已复现的问题、公共开关的职责与验证范围。

## 自动检查

使用 Node 22 或更新版本、Python 3 和 Chromium：

```sh
npm ci --prefix tests/browser
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" SKY_MOTION_CHROMIUM=/usr/bin/chromium node .github/scripts/verify-site.cjs
```

未安装 Chromium 时，可运行 `tests/browser/node_modules/.bin/playwright install --with-deps chromium`，并把 `SKY_MOTION_CHROMIUM` 指向安装后的浏览器。

检查使用独立临时端口，自动发现 `tests/` 根目录的 `.cjs` 测试，排除辅助模块；可在命令末尾指定文件名，如 `node .github/scripts/verify-site.cjs session-validation.cjs`。检查覆盖模型边界、常见交互、自定义、保存恢复、双语内容、字体加载和打包路径。浏览器工具不随网站发布。自动检查主要使用 Chromium，不能替代 Safari、Firefox 和实际触屏设备验证。

## 状态与资源加载

实验会话恢复前校验日期、数值范围、类型与选项；未知版本不应用。存储不可用时使用当前页面内的内存备份，不能保证关闭页面或换设备后保留。对象可保存到本机，也可导出 JSON 备份。

仅 `page-boot.js` 阻塞解析以选择语言，其他脚本按依赖顺序使用 `defer`。欢迎页星座等待点击后展开；文档开场按访问范围控制重播，并尊重减少动态效果。字体或语言资源失败时提供重试，重试保留实验设置。后台预加载不等于离线安装。

## 部署与恢复

推送 `main` 会触发 Cloudflare Pages 与 GitHub Pages 两个独立工作流。两者都先通过共享的 `validate.yml`，再打包同一份静态网站；其他分支不发布正式站。发布完成须分别核对两个工作流的部署结果。

恢复版本时，从确认可用的提交创建恢复提交，保留 `main` 的历史，不强制推送。根路径及 GitHub 项目子路径由 `tests/deployment-paths.cjs` 检查。

## 许可与反馈

原创应用代码采用 [GNU AGPLv3](LICENSE)（AGPL-3.0-only），第三方库、字体、图片与数据保留各自许可，见 [NOTICE](NOTICE) 和[第三方声明](THIRD-PARTY-NOTICES.md)。

问题反馈请附模块、地点、实验日期与时刻、复现步骤，以及设备和浏览器信息：[联系作者](https://skymotion-5md.pages.dev/contact.html) · [GitHub Issues](https://github.com/qingzhuernest/skymotion/issues)。


自定义可按实验目的建立城市、时刻和日期对照，所选对象支持滑条预览、精确输入、整段撤销与取消；用法见[学习指南](learning-guide.md)。
