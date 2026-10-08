# Google 与 Bing 收录操作

## 1. 先更新网站
将 sky-motion-lab-cloudflare-search-ready.zip 上传到现有 Cloudflare Pages 项目，建立新的生产部署。上传后打开 https://skymotion-5md.pages.dev/sitemap.xml ，应显示含9个页面的XML，不能是404。

部署包首页已加入 Google 验证标签，验证码为 EdFINZfHLRO0taJLoVbQlW0wmR0FtU-fIbFisGK1Mw4。它是公开的站点验证标识，不是账户密码。

## 2. 验证 Google

已加入你上传的HTML验证文件。部署后打开 https://skymotion-5md.pages.dev/googled6825228ef48cc89.html ，应显示 google-site-verification: googled6825228ef48cc89.html。返回Google后台，在“HTML文件”方式下点击验证即可。无需修改文件内容。下面的HTML标记方式是另一种验证选择，任选一种。
打开 https://search.google.com/search-console ，添加“网址前缀”资源：https://skymotion-5md.pages.dev/ 。选择“HTML标记”验证，确认后台提供的 content 值与上面的验证码一致，再点击“验证”。如果不同，请提供该资源新生成的验证码。

如果原来选择的是“网域”资源，Google要求将完整 google-site-verification=… 添加为DNS的TXT记录；首页HTML标记无法完成网域验证。pages.dev由Cloudflare管理，使用网址前缀资源更合适。

验证通过后，在“站点地图”中提交 https://skymotion-5md.pages.dev/sitemap.xml 。使用“网址检查”检查首页、/project-guide 和 /guide，点击“请求编入索引”。提交不等于已经收录，处理时间和是否收录由搜索引擎决定。

## 3. 验证 Bing
打开 https://www.bing.com/webmasters/ 。优先选择从 Google Search Console 导入已经验证的站点，并确认站点地图已导入；没有导入时，手动提交同一个 sitemap.xml 地址。

也可以手动添加站点，选择HTML元标签验证，将 Bing 提供的 msvalidate.01 验证标签交给维护者加入首页，再重新部署和点击验证。本包尚未包含Bing验证码，因为未提供。

## 4. 维护
页面元信息、规范网址与站点地图由 sunlab/tools/search_assets.py 生成；域名及验证标识位于 sunlab/tools/search-config.json。两份HTML页面生成脚本均自动调用它，避免重建页面时丢失标签。更换域名时更新配置并重新生成，随后验证新站点。

robots.txt允许抓取，并标注站点地图；Cloudflare可能在其前面添加自己的机器人策略。若验证失败，检查首页源代码中的验证标记、部署是否完成，以及Cloudflare是否对Googlebot/Bingbot启用了挑战或拦截。

此包只完成网站端准备，尚未操作Google/Bing账户，也未提交站点地图或确认收录。
