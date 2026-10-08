# SkyMotion · 天体视运动实验室

面向课堂演示与自主探索的中文天文地理网页工具。通过地点、日期和时刻，联动太阳、月球、地球昼夜、日影与日晷，让图形、读数和观察任务一起呈现。采用 Material Design 风格，支持桌面、平板和手机，无需 Flash 或浏览器插件。

**[进入网站](https://skymotion-5md.pages.dev/)** · **[进入实验台](https://skymotion-5md.pages.dev/lab.html)**

## 可以观察什么

- **太阳视运动**：比较一天内的变化、全年同一时刻、季节与纬度；查看空间、地平和地面观察视角。
- **月相与月球**：月相变化、每日天空轨迹、不同日期同一时刻的位置，以及行星伴月。
- **地球昼夜**：球面与平面地图；拖动可选择仅旋转相机，或联动观察地点。
- **日影与日晷**：杆影、影尖轨迹，以及可以调节日期、时间和针长的水平日晷与赤道日晷。
- **日行迹**：比较全年固定钟表时或当地真太阳时的太阳位置，独立研究地轴倾角与轨道偏心率对“8”字的影响。

图形、时间条和参数区分别占位，避免操作时相互遮挡。浅色参数区和深色天空图采用各自的文字配色。三维太阳系模型仍处于暂停预览阶段，尚未加入正式网站。

## 三份文档

| 文档 | 主要用途 |
| --- | --- |
| [学习指南](https://skymotion-5md.pages.dev/guide.html) | 入口、调节步骤、观察任务和课堂操作 |
| [项目介绍与地理模型说明](https://skymotion-5md.pages.dev/project-guide.html) | 功能特点、数据来源、模型边界与验证依据 |
| [完整开发逻辑与维护说明](https://skymotion-5md.pages.dev/development-guide.html) | 页面结构、状态、计算、渲染、测试与发布 |

三份网页文档共用排版和互相跳转的入口。开发文档的 [Markdown 源文件](development-guide.md) 也保存在仓库中。

## 本地运行与发布

仓库根目录是正式网站的静态 HTML、CSS、JavaScript 和图片资源；入口为 `index.html`，部署无需构建。

```sh
python3 -m http.server 8000
```

打开 `http://localhost:8000/`。向 `main` 推送修改后，[GitHub Actions](https://github.com/qingzhuernest/skymotion/actions) 自动部署到现有 Cloudflare Pages 项目 `skymotion`，网站地址保持不变，也可手动触发部署。

部署配置位于 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。所需的 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` 已通过 GitHub Secrets 配置；凭据不应写入源码。工作流排除 README 和隐藏配置文件。

## 科学模型与限制

日期观测采用 **Astronomy Engine 2.1.19**；理想太阳实验使用独立几何模型。主时刻轴是当地真太阳时，固定钟表时实验采用明确的 UTC 偏移，不自动处理夏令时。

升落按天体中心穿越几何地平线计算，未计大气折射、天体视半径、地形与天气；球体大小、距离及部分装置结构为教学示意。不能把所有图形直接当作真实照片或精确观测预报。具体定义与验证范围见项目说明，资源归属见 [credits.txt](credits.txt)。已有检查以 Chromium 为主，不代表所有设备和浏览器的兼容性认证。

## 历史资料与反馈

[project-archive 分支](https://github.com/qingzhuernest/skymotion/tree/project-archive/archive) 保存截至归档时本地保留的 32 个历史部署 ZIP、文档、生成脚本、开发记录及暂停的预览，附逐文件清单与 SHA-256。归档分支不触发正式网站部署；旧资料未必反映当前版本。

欢迎老师、学生与天文爱好者提出知识疑问、操作问题和教学建议。请附模块、地点、日期、时刻、复现步骤及设备／浏览器信息。可提交 [GitHub Issue](https://github.com/qingzhuernest/skymotion/issues)，或通过 [联系作者](https://skymotion-5md.pages.dev/contact.html) 反馈。

世界上存在着，唯有不断前行才能传达的事物
