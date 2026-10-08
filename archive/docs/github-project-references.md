# 天体视运动实验室：GitHub 参考项目

检索与源码阅读日期：2026-10-05。本次阅读公开仓库 README 和下列源文件；没有对这些项目做完整科学正确性审计，也未将其代码引入实验室。

## 最相关项目

1. **joaopedroalbq/helios** — https://github.com/joaopedroalbq/helios
   - 3D 太阳日轨迹、日行迹、场景遮阴。
   - `src/threejs/subjects/Analemma.js` 为每天 0—23 时分别生成全年方向点，将高度/方位转为三维球面坐标；不同时间的日行迹共存于一个场景。这比独立自动居中的小图更利于观察时刻差异。
   - 注意：源码固定采样 2018 年，并有针对浏览器时区偏移的特殊处理；不能照搬日期和时区逻辑。仓库未见明确许可证。
   - 源码：https://github.com/joaopedroalbq/helios/blob/master/src/threejs/subjects/Analemma.js

2. **benlansdell/analemma** — https://github.com/benlansdell/analemma
   - Three.js 均时差与日行迹成因演示，允许调整轨道偏心率和地轴倾角，并切换视点。
   - 适合借鉴“倾角贡献 / 偏心率贡献 / 两者共同作用”的理想实验，不应把自定义轨道参数混入真实日期星历。
   - 在线演示：https://benlansdell.github.io/analemma/
   - 源码：https://github.com/benlansdell/analemma/blob/master/src/analemma.js

3. **OpenLyceum/RotatingSky** — https://github.com/OpenLyceum/RotatingSky
   - NAAP 天空旋转实验的现代网页迁移：地平坐标、天球、综合探索三个屏幕。
   - 模型说明与源码展示了共享三维投影、坐标系转换、独立屏幕状态；也提供投影仪配色、键盘操作和引导探索。
   - 注意：其核心时间是恒星时，模型说明明确不建模民用太阳时与日期，不能直接代替本实验室太阳/月球星历。
   - 模型说明：https://github.com/OpenLyceum/RotatingSky/blob/main/doc/model.md
   - 在线演示：https://openlyceum.github.io/RotatingSky
   - README 声明 AGPL-3.0，代码复用需遵守其许可证。

4. **guspatagonico/moon-simulator** — https://github.com/guspatagonico/moon-simulator
   - 月相、轨道俯视、地球观察者视角与食的独立教学模式，月内时间轴支持半天步进。
   - 适合借鉴“空间关系 + 地球所见月面”的对应展示，以及把普通月相和食的遮挡分开讲解。
   - 注意：`src/simulation/MoonPhase.ts` 使用固定 29.53059 天及余弦亮面公式，是理想周期模型；README 的食模式还含教学阈值，不宜用来预报真实月相或食。
   - 源码：https://github.com/guspatagonico/moon-simulator/blob/main/src/simulation/MoonPhase.ts

5. **cosinekitty/astronomy** — https://github.com/cosinekitty/astronomy
   - 当前实验室已使用的 Astronomy Engine 星历库，具有太阳、月球、行星、升落、月相和食计算，提供浏览器例子和验证说明。
   - 继续作为真实日期计算基础；参考其他项目的交互与投影，无需为了界面更换星历。
   - 浏览器例子：https://github.com/cosinekitty/astronomy/tree/master/demo/browser

## 对当前日行迹的建议

- 以共享当地天空坐标的日行迹作为直观入口；显示地平线、方位、当前固定观测时刻。
- 在同一视图叠加早晨、中午、下午等时刻，比较时固定相机和缩放；允许手动旋转，但不在每次时间改变后重新居中。
- 将“时角—赤纬”保留为原理图，明确其形状通常主要反映均时差和赤纬；自动居中会隐藏改变观测时刻造成的整体时角位移。
- 每日观测时间与单日日内时间轴分开命名，提示二者独立。
- 将改变偏心率或倾角的成因实验放在高级理想模型中，恢复日期观测时回到真实星历。

这些是基于仓库文档与源码的设计建议，不代表上述项目的全部数值或边界行为已被验证。
