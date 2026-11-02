# SkyMotion 搜索维护说明

搜索已随正式站发布，技术目录仍保留 `assistant/` 以兼容既有资源 URL。用户只看到“搜索 / Search”，无需手动选择知识或用法。详细接口与状态约定见 [SEARCH.md](../architecture/SEARCH.md)。

## 资料组成与原稿

| 来源 | 数量 | 当前原稿或规则 |
| --- | ---: | --- |
| 作者网站功能资料 | 355 | `sources/update142/website.txt` |
| 作者科学资料 | 144 | `sources/science.txt` |
| 学习、使用与开发章节 | 60 | ID来自作者快照，正文来自当前 `../document-content.json` |
| 原有源码描述条目 | 66 | 当前源码职责、函数声明与源码哈希 |
| 补充基础天文资料 | 8 | `science-basics.json`，附NASA、IAU或Stanford来源 |
| 合计 | 633 | 原有625个ID完整保留 |

`reviewed.json` 保存已按源码核对的操作步骤与28条英文答复；`topics.json` 保存功能主题同义表达。其余作者条目保留 `draft`，不能因为可以搜索就声称已完成全部交互核验。当前公共手册是章节全文的唯一发布依据；旧文档快照保留出处和稳定ID，不再覆盖现行说明。

## 运行方式

- 页面进入即加载资料、运行模块、索引、模型与WASM并预热；不等待用户打开搜索。
- 一个查询只分析一次。预计算词频、IDF、长度惩罚和倒排候选，不在每次输入时扫描全部正文重建词频。
- 先按文字来源回答；不够明确时再使用本地语义检索。直接答案与建议列表采用不同证据条件。
- 知识、用法、教学与开发自动判断；关键的导入、导出、删除、保存、关闭保留区别。
- 文字和语义建议按来源ID融合、去重、检查类别；弱语义结果不会清空已有文字候选。
- 取消旧问题仅取消该次等待，保留已经准备好的模型。失败的Worker可重试，旧事件不能污染新请求。
- “比较城市→怎么保存”支持有限的短追问，不是完整聊天记忆；搜索不读取或修改科学状态。

## 完整重建

从仓库根执行。先生成文档和双语词典，再编译知识，避免源码哈希落后于生成文件。

```sh
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci --prefix scripts/assistant
python3 scripts/assistant/download-model.py
python3 scripts/site_sources.py
python3 scripts/build-documents.py
python3 scripts/prerender-pages.py
python3 scripts/build-assistant-knowledge.py
node scripts/assistant/build.mjs
python3 scripts/assistant/resource-report.py
python3 scripts/prerender-pages.py
python3 scripts/build-assistant-knowledge.py --check
```

只修改Worker运行代码、知识没有变化时，可执行 `node scripts/assistant/build.mjs --runtime-only`。该模式仍核对既有知识版本和向量哈希；不匹配就要求完整构建，不伪造元数据绕过检查。不要手工修改生成的知识、向量或版本文件。

BGE-small-zh-v1.5 INT8 固定修订为 `75c43b069aac4d136ba6bc1122f995fedcfd2781`，512维CLS归一化向量，正文以320字符窗口、280字符步长分块。依赖固定为Transformers.js 3.8.1、ONNX Runtime Web 1.21.0，默认一个WASM线程，不需要WebGPU、跨源隔离、云端LLM或API密钥。

## 缓存和资源预算

资料JSON、索引元数据和索引文件用 `no-cache` 重新验证；模块与Worker携带同一UI资源版本。固定路径的模型与WASM继续使用浏览器缓存。Worker核对知识版本、索引SHA-256与字节长度，拒绝混合版本。

模型权重约23.9 MB，WASM约21.6 MB。全部搜索资源约49 MB未压缩，具体数值以 `site/assistant/resource-report.json` 为准；gzip数值是本地估计，不是实际生产传输测量。后台预热不保证页面刚出现就已准备完成，也不等于离线安装。

## 验证和故障处理

```sh
python3 scripts/check-sources.py
python3 scripts/build-assistant-knowledge.py --check
node tests/assistant-corpus.cjs
node tests/assistant-coverage.cjs
node .github/scripts/verify-site.cjs assistant-runtime.cjs assistant-prototype.cjs assistant-reported.cjs assistant-short-queries.cjs assistant-systematic.cjs assistant-welcome.cjs
```

浏览器检查需要按根README配置Playwright和Chromium。运行时契约检查使用可控Worker，覆盖共享准备、取消、迟到结果、失败、重试与释放；原型回归使用真实本地模型，覆盖实际推理、网络回退、DOM安全、双语、手机阅读空间和项目子路径。

| 现象 | 首先核对 |
| --- | --- |
| 正确条目被列出却未直接回答 | `SkyAssistantDebug.getLast()` 的选择原因、类别、来源、文字覆盖率和语义差值 |
| 正确文字候选被弱语义结果淹没 | 候选融合、ID去重和类别兼容规则 |
| 发布后资料与索引不一致 | 生成顺序、资源版本、JSON重新验证与索引哈希 |
| 用户连续提问时结果串位 | 请求ID、AbortSignal、旧Worker事件和定时器清理 |
| 基础概念根本没有资料 | 补充可靠资料与来源，再重建知识和向量，不盲目降低阈值 |
| 英文问法不稳定 | 英文词形、已有英文答案/别名、中文BGE的跨语言限制 |

## 隐私、范围和证据

问题仅保存在当前页内存；不上传、不记录到浏览器持久存储。调试接口主动调用才返回当前诊断，不额外显示在用户界面。引用中的资料审核状态与科学模型的适用边界保留。

633条来源改写覆盖检查不等于独立自然语言准确率。8条基础资料与28条操作答复有专门内容，不能据此声称所有原始条目已有完整英文版。测试在开发机Chromium运行，不等同于真实iPad/Safari性能或全部自然问法验证。

`UPDATE142.md`、`UPDATE143.md`、`REPORTED-FIXES.md` 及旧JSON报告保留历史证据；当前行为以本说明、SEARCH.md和实际源码为准。
