# SkyMotion · 天体视运动实验室

静态天文教学网站，源码来自 sky-motion-lab-cloudflare-map-antialias.zip。

线上网址：https://skymotion-5md.pages.dev/

## 修改与发布

网站的 39 个原始文件位于仓库根目录。入口为 index.html，无需构建。

向 main 分支推送修改时，GitHub Actions 会将网站文件部署到现有 Cloudflare Pages 项目 skymotion，保留 skymotion-5md.pages.dev 网址。也可在 Actions 页面手动运行部署。

## 首次配置

在 Settings → Secrets and variables → Actions 中设置两个 repository secrets：

- CLOUDFLARE_ACCOUNT_ID：包含现有项目的 Cloudflare Account ID。
- CLOUDFLARE_API_TOKEN：仅授予该账号 Account → Cloudflare Pages → Edit 权限的 API Token。

现有 Cloudflare 项目的生产分支已核实为 main。配置缺失时，工作流会停止并提示缺少授权，不会部署。

Token 只保存在 GitHub Secrets 中，不要提交到仓库。

部署配置：.github/workflows/deploy.yml。它仅发布受 Git 跟踪的网站文件，排除 README 与隐藏配置文件。
