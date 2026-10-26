# 第三方代码、数据与素材

SkyMotion 原创应用代码采用 [AGPLv3](LICENSE)。这项许可不替换下列第三方内容的许可或来源条件；分发时应保留各项原有声明。

| 内容 | 原许可或来源声明 | 仓库中的说明 |
| --- | --- | --- |
| Astronomy Engine | MIT，Don Cross；原版权与全文保留在库文件开头 | [astronomy.js](astronomy.js) |
| Three.js | MIT | [THREE-LICENSE.txt](space/vendor/THREE-LICENSE.txt) |
| HYG 4.1 恒星目录及本项目导出数据 | CC BY-SA 4.0，David Nash / Astronomy Nexus 与贡献者 | [stars-license.txt](space/assets/stars-license.txt) |
| 马善政字体子集 | SIL Open Font License 1.1 | [OFL-MaShanZheng.txt](fonts/OFL-MaShanZheng.txt) |
| 地球纹理 | 沿用 three.js 示例资源，保留原来源；不将该素材重新声明为 AGPL | [credits.txt](credits.txt)、[三维素材说明](space/credits.txt) |
| 卫星、小行星与彗星数据 | JPL SSD / SBDB 数据快照，保留数据来源与近似范围说明 | [population-credits.txt](space/assets/population-credits.txt) |
| 星云观测影像 | NASA 影像资料库；各图保留其机构、摄影作者与原始来源，不统一声明为 AGPL 或公有领域 | [影像目录](space/assets/nebulae/catalog.json)、[三维素材说明](space/credits.txt) |

新加入依赖或素材时，应核验其许可条件和兼容性，并更新此表及对应资源的说明。素材来自公开网站，不等于可以任意重新授权。

## Welcome typography

`fonts/welcome-sans.woff` is a renamed glyph-subset derivative of Noto Sans CJK SC (Adobe / Noto CJK), licensed under SIL OFL 1.1. See `fonts/OFL-Noto-CJK.txt` and https://github.com/notofonts/noto-cjk. The original hand-lettered footer font is preserved.

## Interface font subsets

`fonts/interface-regular.woff` and `fonts/interface-bold.woff` are renamed glyph-subset derivatives of Noto Sans CJK SC (Adobe / Noto CJK), SIL OFL 1.1. See `fonts/OFL-Noto-CJK.txt`. All fonts are served locally.

`fonts/reading-regular.woff` is a renamed glyph-subset derivative of Noto Serif CJK SC (Adobe / Noto CJK), also SIL OFL 1.1; see `fonts/OFL-Noto-CJK.txt`.

`fonts/reading-regular.woff2` and `fonts/reading-bold.woff2` are renamed, text-subset Noto Serif CJK SC derivatives (Adobe / Noto CJK), SIL OFL 1.1. They provide the unified interface and Canvas annotation typography; existing Ma Shan Zheng quote remains separate.

## Bitstream Charter

The English interface uses locally hosted Bitstream Charter regular, bold, italic and bold italic WOFF2 files, distributed via https://practicaltypography.com/charter.html. Copyright 1989–1992 Bitstream Inc., Cambridge, MA. BITSTREAM CHARTER is a registered trademark of Bitstream Inc. Its unrestricted redistribution notice is preserved in `fonts/LICENSE-Charter.txt`; the font license is separate from the application’s AGPLv3 license.

## 2026-10-13 production distribution

The bilingual production release distributes the same original astronomy libraries, catalogs and license notices. Reading and Charter fonts are hosted locally with their bundled license files; interface refinement does not change third-party attribution or data licensing.

## Material Color Utilities

Theme generation bundles `@material/material-color-utilities` 0.3.0 under Apache-2.0. The license is retained in `theme-colors.LICENSE`. Rebuild with `npm ci --prefix scripts/theme-colors` and `npm run build --prefix scripts/theme-colors`. Build tools are excluded from the published static package.
