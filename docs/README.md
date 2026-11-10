# SkyMotion 文档导航

现行说明与历史记录分开维护。网页上的四份双语文档只从 `document-content.json` 生成；修改 Markdown 或 HTML 输出会在下一次生成时被覆盖。

| 要做的事 | 现行入口 | 内容 |
| --- | --- | --- |
| 了解项目、启动开发 | [根目录 README](../README.md) · [English](../README.en.md) | 使用场景、运行、生成、验证与发布 |
| 找功能入口和控件 | [功能手册](../site/project-guide.md) · [English](../site/project-guide.en.md) | 观测、图解、自定义、搜索、保存和排错 |
| 组织课堂、记录证据 | [学习指南](../site/learning-guide.md) · [English](../site/learning-guide.en.md) | 教学任务、控制变量、记录和评价 |
| 理解变量与公式 | [开发者文档](../site/development-guide.md) · [English](../site/development-guide.en.md) | 状态、坐标、科学模型、事件与存储 |
| 找到任意文件 | [全部文件](file-inventory.md) · [代码地图](architecture/CODE-MAP.md) | Git 跟踪范围、职责、生成件和依赖 |
| 维护本地搜索 | [搜索说明](assistant/README.md) · [接口与状态](architecture/SEARCH.md) | 数据源、自动意图判断、排序、缓存、Worker、取消和回退 |
| 保持界面一致 | [产品约定](architecture/PRODUCT.md) · [设计约定](architecture/DESIGN.md) | Material 3 Expressive、字体、菜单和多端约束 |
| 管理分支与部署 | [仓库维护](repository.md) | 唯一发布目录、分支、打包与恢复 |
| 核对素材和许可 | [第三方声明](../site/THIRD-PARTY-NOTICES.md) | 天文库、字体、模型、图片及各自许可 |

## 哪些内容可以直接修改

- 网站手写脚本和样式：在对应模块修改，保持原有公共 URL 与状态所有者。
- 文档：编辑 `document-content.json`，生成四份中英文 HTML、Markdown 与字典。
- 页面目录、观测初值、颜色：分别修改 `site/site-catalog.json`、`site/lab-state.json`、`site/ui-palette.css`，运行 `site_sources.py`。
- 搜索资料：作者原始资料保留在 `assistant/sources/`；经过核对的操作补丁、主题和基础科学资料分别在 `reviewed.json`、`topics.json`、`science-basics.json`。不要直接编辑发布的 `knowledge.json`。
- 向量、模型、第三方包：使用固定版本、原许可与构建工具；不能把下载素材重新声明为项目原创。

## 历史材料

`reviews/`、`branches.json` 和 `assistant/UPDATE*.md` 保存当时的审查与验证证据。它们不是当前功能或缺陷的完整清单。早期“助手”“仅预览”“按需下载”等表述属于历史状态；当前入口叫“搜索”，页面进入后自动准备，正式站与预览站同步发布。

## 文档的真实性边界

源文件解析通过、自动问法覆盖、实际浏览器操作与真实设备测量是不同证据。浏览器回归使用 Chromium；不能据此声称已验证所有 Safari/iPad 表现或所有自然问法。搜索条目的资料审核状态保留在引用中，不因可以检索就批量升级。

- [实验分享与深链接](architecture/SHARING.md)：链接范围、编码、事务回滚、隐私和教学任务入口。

- [2026-11-10 布局与代码更新检查](reviews/UI-CODE-AUDIT-2026-11-10.md)：三行组合、绘制可见性与重复DOM写入的修复证据。
