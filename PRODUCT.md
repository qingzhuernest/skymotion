# SkyMotion

<!-- impeccable:product-schema 1 -->

## Platform
web

## Product Purpose
中文天体视运动实验室。用地点、日期与时刻联动科学图解，让使用者控制变量、读取结果并进行多图对照。

## Users
已有项目介绍面向地理课堂、学生自主观察和天空爱好者。当前任务是统一整个网站 UI。

## Operating Context
桌面、平板与手机浏览器；独立专题页和三份文档。已有侧栏、大屏收起、窄屏抽屉与沉浸模式。

## Capabilities and Constraints
保留太阳、月球、关联图解、日晷、日行迹、三维太阳系、浏览器历史、播放与星空互动。
2026年10月13日用户授权正式发布：main 推送部署 Cloudflare 与 GitHub Pages；GPT Site 保留同版预览。
天文模型、星历数据、计算语义与物理时刻不改变。
原应用是原生 HTML/CSS/JavaScript、Canvas 与 WebGL，不引入 UI 框架。

## Brand Commitments
保留项目名称、中文文案、深色科学画布、欢迎页星空与手写句子。五个欢迎页小按钮位于右下角；文档职责不混淆。
用户要求全站字体、排版、颜色、控件一致，使用 Impeccable。

## Evidence on Hand
源版本 4390ab1，既有实际页面、三份文档、六组模型与浏览器回归。没有新的科学精度或真实设备性能认证。

## Product Principles
- 数值与交互状态必须可读。
- 同一种控件在不同页面具有相同形状和反馈。
- 画布、时间条、参数区保留独立空间。
- 减少动态效果、键盘操作与禁用状态不得退化。


## 预览 68：实验台共用自定义 / Preview 68: Lab customization

实验台在语言旁提供统一自定义开关，保留四个原视角、地点参数与共享时间栏。城市自动参与天空和关联图解对照；天空／高度图的时间标记跨原图显示，同地不同时间不必另开页面。内部导航一次延续编辑状态，会话草稿跨页保留，刷新默认正常模式。实验台添加工具可进入摆放实验物体，点击原视角返回。对象行“···”提供保存、复制、删除。仅发布 GPT Site 预览，正式网站未更新。

Lab shares the customization switch beside language while retaining native viewpoints, observation controls and timeline. Cities appear in sky and related comparisons; pinned times compare within the original diagrams. Internal navigation transfers edit intent once and retains session drafts; refresh starts normally. Lab can open construction from its Add tools and return through a native viewpoint. Row ellipsis contains Save, Duplicate and Delete. GPT Site preview only; official hosting is unchanged.

当前交互约定 / Current interaction rules: [中文](docs/customization-interaction.zh.md) · [English](docs/customization-interaction.en.md).


预览 69 / Preview 69：修复 GPT Site 将 `.html` 跳转为简洁地址时，跨页自定义状态无法延续的问题；中英文两套路由均有重定向回归检查。 Clean-URL redirects now retain one-use customization intent in both languages; refresh still starts normally.
