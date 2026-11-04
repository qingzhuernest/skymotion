# SkyMotion · 天体视运动实验室

面向地理课堂与自主探究的浏览器实验室。调整地点、日期和时刻，通过太阳、月球、日影、日晷、日行迹与三维图解解释现象，并记录可复现的证据。

**简体中文** · [English](README.en.md)

[正式站](https://skymotion-5md.pages.dev/) · [GitHub Pages镜像](https://qingzhuernest.github.io/skymotion/) · [文档导航](docs/README.md)

## 使用

顶部选择太阳或月球。左侧“视图与布局”选择图解，“观测条件”调整地点、日期、时间与参数；四个天空视角和关联图解共用工作区。进入自定义后，“图中对象”负责城市、日期、时刻和几何对照，“观测条件”继续控制原有实验。

“排列与收藏”可连同观测条件、参考对象与搭建物体保存完整实验；也可导出JSON备份。浏览器内保存不自动跨设备同步。三维天空使用真实日期物理向量与单独的显示尺度，近景采用有来源的观测影像拼接贴图，不是实时云层。

“搜索”用同一个输入框自动判断知识与用法。先查明确来源，必要时补充本地语义检索；对话不读取或操作实验。资源在页面进入时自动准备，问题不上传到外部问答服务。

## 本地运行

```sh
python3 -m http.server 8000 --directory site
```

打开 `http://localhost:8000/`；英文页面如 `lab.en.html` 和 `space/index.en.html`。科学应用使用原生HTML/CSS/JavaScript，无需运行时构建；三维页面需要WebGL。仅修改模型、主题依赖或搜索索引时才使用对应构建工具。

## 文档和代码入口

| 入口 | 内容 |
| --- | --- |
| [功能手册](site/project-guide.md) | 控件、图解、自定义、搜索、保存与排错 |
| [学习指南](site/learning-guide.md) | 探究任务、记录和评价 |
| [开发者文档](site/development-guide.md) | 变量、公式、坐标、状态、存储和发布 |
| [全仓库代码地图](docs/architecture/CODE-MAP.md) | 每个代码/数据文件的职责、生成件和依赖分类 |
| [全部跟踪文件](docs/file-inventory.md) | 包含素材、许可和原稿的完整清单 |
| [搜索维护](docs/assistant/README.md) · [接口约定](docs/architecture/SEARCH.md) | 检索、自动分类、缓存、Worker、取消与构建 |
| [产品约定](docs/architecture/PRODUCT.md) · [设计约定](docs/architecture/DESIGN.md) | Material 3 Expressive、原有宋体/Charter及多端行为 |
| [仓库维护](docs/repository.md) | 目录、分支、打包和恢复 |

## 修改与生成

`site/` 是唯一发布根目录。修改所属模块，不用全局拦截或文件末尾覆盖制造第二套状态。观测初值和校验在 `site/lab-state.json`；页面目录和资源版本在 `site/site-catalog.json`；主题颜色在 `site/ui-palette.css`。

四份双语手册的原稿统一在 `docs/document-content.json`。先生成页面和词典，再生成搜索知识与索引：

```sh
python3 scripts/site_sources.py
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py
python3 scripts/build-assistant-knowledge.py
node scripts/assistant/build.mjs
python3 scripts/assistant/resource-report.py
python3 scripts/prerender-pages.py
```

搜索构建依赖安装与固定模型下载见[搜索维护说明](docs/assistant/README.md)。不要直接修改生成的英文页面、手册、字典、向量或依赖包。新增或移动文件后先 `git add`，再运行 `python3 scripts/repository-index.py` 更新清单与代码地图。

## 验证

```sh
python3 scripts/check-sources.py
python3 scripts/site_sources.py --check
python3 scripts/build-documents.py --check
python3 scripts/prerender-pages.py --check
python3 scripts/build-assistant-knowledge.py --check
python3 scripts/repository-index.py --check
npm ci --prefix tests/browser
```

浏览器回归使用Node 22或更新版本、Python 3、Playwright和Chromium。安装浏览器后配置路径：

```sh
tests/browser/node_modules/.bin/playwright install --with-deps chromium
export SKY_MOTION_PLAYWRIGHT="$PWD/tests/browser/node_modules/playwright"
export SKY_MOTION_CHROMIUM="$(node -e "console.log(require('./tests/browser/node_modules/playwright').chromium.executablePath())")"
node .github/scripts/verify-site.cjs assistant-runtime.cjs assistant-prototype.cjs
```

验证器使用独立临时端口并清理进程；可以指定受影响的测试文件。不加文件名会运行全部回归。源码解析、生成一致性、模型验证和浏览器交互是不同检查；Chromium结果不能代替真实Safari/iPad性能验证。

## 发布与恢复

`main` 是唯一正式发布分支。共享验证成功后分别部署Cloudflare Pages和GitHub Pages；GPT预览同步同一冻结发布包。路径变化按相关模块选择检查，完整回归由手动 `full_regression` 选择。

打包命令 `python3 .github/scripts/prepare_site.py --output dist` 只复制Git跟踪的 `site/` 文件，不发布开发依赖、测试或原始工作目录。回退使用新的恢复提交，不强制改写 `main` 历史。

## 资料、存储与许可

科学读数来自明确的地点、时刻和模型；理想实验、独立地升模型与真实日期星历各有适用范围。搜索不是当前天空数值计算器，也不是通用百科。会话恢复会校验日期、范围、类型与版本；存储不可用时使用当前页内存回退。

原创应用代码采用[AGPLv3](LICENSE)。天文库、Material Web、字体、模型与行星影像保留各自许可，详见[第三方声明](site/THIRD-PARTY-NOTICES.md)。

实验台支持在“排列、收藏与分享”中复制当前实验链接，跨设备恢复观测条件、图位及可保存的对象；[协议与边界](docs/architecture/SHARING.md)。
