# 仓库维护说明

## 目录与职责

| 路径 | 内容 | 修改方式 |
| --- | --- | --- |
| `site/` | 唯一的网站根目录；HTML、共享 JS/CSS、双语字典、下载手册 | 浏览器访问此目录；打包时移除 `site/` 前缀 |
| `site/space/` | 三维天空、数据、素材、Three.js 依赖 | 保留第三方许可 |
| `site/lunar/` | 地升地落模块 | 与实验台共用主题和控制 |
| `site/fonts/` | 本地字体及许可 | 不改变已有字形与字体选择 |
| `site/docs/` | 已有公开操作说明、发布说明与审查记录 | 保留既有公开 URL |
| `docs/document-content.json` | 四份双语文档的唯一原稿 | 运行文档生成器；不直接编辑生成的手册 |
| `docs/architecture/` | 产品/设计约束、全代码地图和搜索接口 | CODE-MAP由清单工具生成；其余直接维护 |
| `site/assistant/` | 本地搜索的界面、运行时、检索、模型与向量 | 模块职责见SEARCH；第三方与生成件分开 |
| `docs/assistant/` | 搜索原稿、维护说明与历史验证 | 公共资料不包含私人Drive链接 |
| `docs/reviews/` | 历史审查报告 | 历史记录，不作为当前缺陷清单 |
| `scripts/` | 生成器、模板、字体与数据维护工具 | 从仓库根运行 |
| `scripts/theme-colors/` | 主题颜色依赖和构建入口 | 输出 `site/theme-colors.js` |
| `tests/` | 单元与浏览器验证、公共辅助工具 | 验证器服务 `site/`；测试进程仍在仓库根运行 |
| `tests/browser/` | 固定版本的测试依赖清单 | 不随网站发布 |
| `.github/scripts/` | 打包与验证入口 | 两个部署目标共用；一次验证后分别部署 |
| `.github/workflows/` | 发布和可复用验证工作流 | 只有 `main` 发布正式站 |
| 根目录 README、许可、配置 | 仓库入口、版权和开发配置 | 保持精简 |

完整的逐文件清单见 [file-inventory.md](file-inventory.md)。它与[代码地图](architecture/CODE-MAP.md)由 `python3 scripts/repository-index.py` 一起生成；文件新增或移动后先暂存，再更新两份输出。所有文档入口见[文档导航](README.md)。

## 日常命令

从仓库根运行：

```sh
python3 -m http.server 8000 --directory site
python3 scripts/check-sources.py
python3 scripts/site_sources.py --check
python3 scripts/build-documents.py --check
python3 scripts/prerender-pages.py --check
python3 scripts/repository-index.py --check
node .github/scripts/verify-site.cjs deployment-paths.cjs
python3 .github/scripts/prepare_site.py --output dist
```

生成时移除 `--check`。文档模板始终从 `scripts/` 读取，原稿从 `docs/` 读取，所有网页输出到 `site/`。根目录许可证和 `site/LICENSE`、`site/NOTICE` 保持一致；公开第三方声明在 `site/THIRD-PARTY-NOTICES.md`，仓库根入口链接到该文件。

`dist/`、浏览器产物、依赖目录和 Python 缓存均不提交。打包脚本仅复制 Git 已跟踪的 `site/` 文件，因此文档原稿、测试、开发工具不会进入发布包。原有页面相对路径不变，正式站与 GitHub 项目子路径共用同一份文件。

## 分支规则和本次整理

- `main`：唯一持续维护与正式发布分支。
- `feat/<topic>`、`fix/<topic>`、`chore/<topic>`：短期工作分支，合入后删除。
- `archive/2026-10/<topic>`：保留尚未合并的旧工作，不触发正式部署。
- `project-archive`：已有的完整项目历史与部署资料归档，单独保留，不混入正式站。

2026-10-27 整理前的远端 SHA、与 main 的提交差异、删除或归档去向完整记录在 [branches.json](branches.json)。这是一份当时的快照，不表示分支会永远停在同一个提交。

三个完全合并的远端分支已清理：`impeccable-preview`、`preview/custom-workspace-2026-10-15`、`preview/unified-customization-20261021`。五个旧分支先推送同一 SHA 到归档名称，核对成功后才删除旧名称；没有丢弃独立提交。`companion-layout` 的独立提交与 main 补丁等价，仍保留归档以保全历史。

其他工作树中正在检出的本地分支保持原状，避免打断已有工作；这些工作树不属于当前网站发布目录。未被工作树占用且已合并的本地旧分支可安全删除。远端默认分支和本地 `origin/HEAD` 均指向 `main`。

发布验证由 `.github/scripts/select-checks.cjs` 按路径选择；不确定影响范围时保留短检查集，完整回归仍由手动选择。纯说明文件不安装浏览器。

代码精简与职责复核见 [2026-10-28 报告](reviews/CODE-SIMPLICITY-2026-10-28.md)。主题预设启动数据由 `scripts/site_sources.py` 从 `site/ui-palette.css` 生成，编辑颜色后应运行该生成器。

“搜索”源码与本地模型资源统一保存在 `site/assistant/`，构建依赖在 `scripts/assistant/`，资料原稿和说明在 `docs/assistant/`。搜索随 `main` 正式发布；`preview/local-assistant-v1` 保留为预览开发分支，早期报告中的“仅预览”和按需下载描述属于历史状态。当前进入网页即自动下载并准备搜索资源。

## 代码整理与验证范围

共享逻辑保留一个所有者：函数声明提取和章节纯文本提取在document_model中维护，文档生成与搜索编译复用；搜索UI不再拥有Worker生命周期。倒排索引和资料字典预计算，查询对象在文字选择与语义建议中复用。科学模型、对象身份、存档格式和公开路径按各自模块维护，不通过全局拦截重复实现。

check-sources解析全部Git跟踪JS、Python、JSON并核对HTML本地素材引用；不会运行网站科学脚本。完整文件清单包含素材、许可、原稿，代码地图另外统计手写代码、生成件、第三方、测试和工具。行数、静态语法通过与浏览器/模型验证分别报告，不把一种证据冒充另一种。
