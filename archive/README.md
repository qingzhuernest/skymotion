# SkyMotion 全部本地历史资料归档

本分支从正式网站提交 `045680358c36053e6f293eafc89bcf9c01d7b66d` 建立。根目录是该时点的网站源码；`main` 仍是生产分支。归档分支不会触发现有 Cloudflare Pages 自动部署。

- [完整历史资料压缩包](sky-motion-lab-complete-history.tar.xz)：保留本地全部部署 ZIP、文档、源码、构建模板及暂停的太阳系预览原文件。
- [逐文件清单与 SHA-256](manifest.json)：可核对路径、大小和内容。
- [文档](docs/)：开发逻辑、学习指南、模型说明、核验报告、开源参考及搜索引擎提交说明。
- [生成脚本与模板](tools/)：历史开发工具；相对路径假设请参照压缩包中的 sunlab/tools 与 sunlab/dist 结构。
- [内部开发与验收记录](REVIEW.md)。

旧版本文档代表当时的状态，未必反映当前产品；正式行为以 main 和线上网站为准。太阳系预览未经完整验证，处于暂停状态，不属于正式功能。

压缩包没有包含 Git 内部目录、环境配置、Python 缓存或账户凭据。并不包含无法从本地访问的聊天记录、用户设备文件或已经丢失的版本。

下载压缩包后，可用 7-Zip、支持 XZ 的解压工具，或命令 `tar -xJf sky-motion-lab-complete-history.tar.xz` 解开。各历史 ZIP 保留原名及原始字节。
