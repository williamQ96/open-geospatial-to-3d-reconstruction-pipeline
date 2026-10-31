[English](README.md) | **简体中文** · [画风库](../README.zh-CN.md)

# Architectural Toon Realism · 建筑卡通写实

视觉规范 v1.0 · **默认推荐美术方向** · 2026-10-31 归档

真实的地理结构与可辨识建筑，配合克制的漫画渲染，远看具有精致建筑沙盘观感。三个目标是**地理真实性、视觉一致性、多尺度可读性**。

依据[分享对话](https://chatgpt.com/share/6ae5adf2-4a74-83e8-b001-f9de17509c56)中用户认可的生成图与最终规范整理。该方向从早先的风格化 PBR／建筑沙盘提案发展而来。Hi-Fi RUSH 仅作为 Clean / Sharp 图形语言的讨论参考，没有复制其资产，也不要求复现其技术。

## 原始 mockup

![AI 生成的建筑卡通校园鸟瞰概念图](mockups/uo-campus-concept.png)

**这是画风概念图，不是准确 UO 重建，也不是当前网页运行截图。** 保留原始 1672 × 941 PNG 字节。图中的建筑、河流、运动场、道路细节和植被不能作为 GIS 依据；它是 UO 来源案例，不是通用校园布局。[来源与 SHA-256](provenance.json)。

## 视觉规范

| 维度 | 本画风目标 |
| --- | --- |
| 建筑几何 | 保留核验后的 footprint、位置、朝向、高度及标志性屋顶／入口；简化细节而不丢失身份，未知信息仍标记近似 |
| 明暗 | 柔和 2–3 阶赛璐璐明暗，保留深度，避免纯黑阴影和生硬色阶 |
| 描边 | 细、克制、有选择；俯瞰时减弱或关闭，避免逐窗逐叶描边 |
| 材质 | 砖、石、玻璃、金属、铺装等简化材质族，低纹理噪声与克制反射 |
| 植被 | 团块树冠，大小／明度／色相有变化，可复用；实际树种与位置另行核验 |
| 光照 | 暖日光、偏冷环境阴影、适度接触阴影；阴天可作后续变体 |
| 环境 | 车道、步行路径、草坪、广场明确区分，轻微色调变化，避免照片噪声 |
| 色彩 | 中等饱和度、较高明度、暖色建筑与多层自然绿；避免霓虹和全体黄楼 |

UO 案例采用西北地区针叶／阔叶树氛围；其他地图应适配自己的地域。以上规则定义本画风，不限制其他风格。

## 原始调色板

以下 8 色恢复自最终规范的互动组件，保留原值，采用 sRGB。它们是材质建议，不是 UO 官方品牌色、测量反射率或经过对比度测试的 UI 色组。同一材质族内可以变化。

| Material | sRGB HEX |
| --- | --- |
| Brick Red | `#B96F55` |
| Warm Stone | `#E4D6BB` |
| Roof Gray | `#A8ADB0` |
| Glass Blue | `#8FAEAE` |
| Grass Green | `#91B66F` |
| Foliage Green | `#658B54` |
| Deep Evergreen | `#385A45` |
| Path Sand | `#CDBB9F` |

下载 [palette.json](palette.json)，在目标渲染器中正确处理色彩空间。

## 一个世界，三种视角

| 内容 | Overview | Follow | First person |
| --- | --- | --- | --- |
| 建筑 | 轮廓、屋顶、主色区 | 入口、中距离辨识度 | 核验过的窗户、入口、材质分区 |
| 植被 | 清晰树冠体积 | 保持人物与路径可见 | 近处树干树冠细节，避免叶片噪声 |
| 线条与阴影 | 极少描边、柔和明暗 | 选择性描边与接触提示 | 重要轮廓、接触深度 |
| 标签与导航 | 地标层级、搜索、小地图 | 人物与所选目标可读 | 精简 HUD、所选标签优先 |

原文对比 Overview 和 First Person；Follow 列是对现有三模式的工程补充。三模式共用资产和稳定 ID，以距离决定细节，搜索高亮不依赖装饰性描边。

## 档案与实现状态

包含原始 PNG、英文规范／中文选项、精确调色板、[复用 prompt](style-prompt.txt)、[整理后的公开原文](source-guide.zh-CN.md)、[实现评估计划](implementation.zh-CN.md)与来源记录。

**[UO 首个原型](https://github.com/williamQ96/open-campus-uo/blob/main/docs/zh-CN/visual-pilot.md)已实现美术层、植被和 Toon／PBR 切换。** 模板仍默认合成白模，可选接入美术层；LOD、全屏装饰描边、硬件性能验证和跨引擎 shader 一致性仍待完成。

## 复用与署名

按地区调整 prompt 与色彩，不从概念图生成地理事实。地理数据、语义、Blender 源资产、标准 PBR 交换材质和渲染器样式应分层维护。

署名 **OpenCampus Architectural Toon Realism — Zhongyi “William” Qiu and contributors**，保留 [UO](https://github.com/williamQ96/open-campus-uo) 与[上游档案](https://github.com/williamQ96/open-geospatial-to-3d-reconstruction-pipeline/tree/main/style/architectural-toon-realism)来源，链接 [CC BY 4.0](../../LICENSES/CC-BY-4.0.txt)，标记修改。原创文档／设计贡献及项目拥有的可版权化 AI 概念图权利按此许可提供；不主张画风本身的排他权。对话中第三方搜索图片不随档案分发或重新许可；不授予商标权或暗示 UO／游戏方背书。见[许可政策](../../LICENSING.zh-CN.md)。
