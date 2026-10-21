# SkyMotion · 天体视运动实验室

面向地理课堂和自主观察的浏览器实验室。用地点、日期和时刻控制太阳、月球、日影、日晷与日行迹，通过关联图解和三维视图核对结果。原生 HTML、CSS 和 ES Modules，无需构建即可运行。

**简体中文** · [English](README.en.md)

[打开正式站](https://skymotion-5md.pages.dev/) · [GitHub Pages 镜像](https://qingzhuernest.github.io/skymotion/)

## 使用与文档

- [学习指南](learning-guide.md)：从哪里进入、怎样调节、怎样对照和记录。
- [项目介绍](project-guide.md)：教学用途、功能、数据依据和模型范围。
- [开发说明](development-guide.md)：源码职责、状态、计算、渲染、检查与部署。
- [自定义操作](docs/customization-interaction.zh.md)：添加城市、时间标记、参考线和实验物体，编辑属性并保存方案。

自定义入口位于语言按钮旁。进入后，“观测条件”继续控制基准实验，“图中对象”负责添加和调整对照。城市与时刻在相关图中联动，杆、球和圆圈等在实验地面摆放。操作示例见[学习指南的自定义章节](guide.html#customization)。

“关联图解 → 月球 → 地升地落”提供绕月轨道与宇航员视角的联动演示。该演示使用独立的示意轨道，保留左侧说明、参数栏和底部控制；它不是按真实日期求得的航天器轨道预报。

## 本地运行

```sh
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。英文使用独立页面，例如 `lab.en.html` 和 `space/index.en.html`。需要现代浏览器；三维视图需要 WebGL。

## 修改文档与双语页面

中文 HTML 是页面原稿；英文页面通过字典生成。修改原稿或 `i18n-*.json` 后运行：

```sh
python3 scripts/prerender-pages.py --dist .
python3 scripts/prerender-pages.py --check
```

生成器同步英文 HTML、`language-data.js` 和资源预热清单，同时保留 DOM ID、表单值、数值属性与科学脚本。三份文档的中英文 Markdown 下载文件也须同步。内容按主题更新到原章节，不在文末叠加发布日志。

界面颜色统一在 `ui-palette.css` 定义，控件通过 `--design-*` 变量调用；不要在页面模块里另写色号。对象菜单将撤销、重做并入操作行，帮助按需展开，给列表和属性保留空间。

## 自动检查

使用 Node 22 或更新版本、Python 3 和 Chromium：

```sh
npm ci --prefix tests/browser
SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright" SKY_MOTION_CHROMIUM=/usr/bin/chromium node .github/scripts/verify-site.cjs
```

未安装 Chromium 时，可运行 `tests/browser/node_modules/.bin/playwright install --with-deps chromium`，并把 `SKY_MOTION_CHROMIUM` 指向安装后的浏览器。

检查自动发现 `tests/` 根目录全部 `.cjs` 脚本，覆盖模型边界、常见交互、自定义、保存恢复、双语内容、字体加载和打包路径。浏览器工具不随网站发布。自动检查主要使用 Chromium，不能替代 Safari、Firefox 和实际触屏设备验证。

## 状态与资源加载

实验会话恢复前校验日期、数值范围、类型与选项；未知版本不应用。存储不可用时使用当前页面内的内存备份，不能保证关闭页面或换设备后保留。对象可保存到本机，也可导出 JSON 备份。

仅 `page-boot.js` 阻塞解析以选择语言，其他脚本按依赖顺序使用 `defer`。欢迎页星座等待点击后展开；文档开场按访问范围控制重播，并尊重减少动态效果。字体或语言资源失败时提供重试，重试保留实验设置。后台预加载不等于离线安装。

## 部署与恢复

推送 `main` 会触发 Cloudflare Pages 与 GitHub Pages 两个独立工作流。两者都先通过共享的 `validate.yml`，再打包同一份静态网站；其他分支不发布正式站。发布完成须分别核对两个工作流的部署结果。

恢复版本时，从确认可用的提交创建恢复提交，保留 `main` 的历史，不强制推送。根路径及 GitHub 项目子路径由 `tests/deployment-paths.cjs` 检查。

## 许可与反馈

原创应用代码采用 [GNU AGPLv3](LICENSE)（AGPL-3.0-only），第三方库、字体、图片与数据保留各自许可，见 [NOTICE](NOTICE) 和[第三方声明](THIRD-PARTY-NOTICES.md)。

问题反馈请附模块、地点、实验日期与时刻、复现步骤，以及设备和浏览器信息：[联系作者](https://skymotion-5md.pages.dev/contact.html) · [GitHub Issues](https://github.com/qingzhuernest/skymotion/issues)。
