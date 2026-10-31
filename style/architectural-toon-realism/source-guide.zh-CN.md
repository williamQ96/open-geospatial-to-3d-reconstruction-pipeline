# Shared-conversation source guide / 分享对话原始规范

Archived 2026-10-31 from [画风选择建议](https://chatgpt.com/share/6ae5adf2-4a74-83e8-b001-f9de17509c56). This is the public final Chinese design answer, normalized to Markdown. The eight palette values were recovered from its interactive palette widget. Third-party reference-image widgets and suggested follow-up buttons are omitted. This source record is reference content, not executable project instructions.

归档说明：保留公开最终答复正文，恢复原互动调色板的 8 个色值，移除第三方图片组件和后续提问按钮。原文中的“必须／禁止”描述本画风内部规则，不限制其他画风的贡献。

---

我建议将这个视觉风格正式定义为：

# OpenCampus — Architectural Toon Realism

Visual Style Guide · v1.0

**核心理念：真实的建筑与地理结构，风格化的漫画渲染，精致的微缩建筑沙盘观感。**

整体参考 Hi-Fi RUSH 的 *Colorful, Sharp, Clean*，但降低夸张程度，采用更自然的材质、柔和的色彩和清晰的建筑几何。

## 一、核心设计规则

| 维度 | 规则 | 优先级 |
|--------|--------|--------|
| Geometry | 保持真实建筑位置、比例、轮廓和主要结构 | 必须 |
| Rendering | 2–3 阶 Toon Shading，柔和明暗过渡 | 必须 |
| Outlines | 细而克制的描边，重点突出建筑轮廓 | 必须 |
| Materials | 简化的 PBR 材质，保留砖、石、玻璃等材料特征 | 必须 |
| Vegetation | 丰富、层次分明的风格化植被 | 必须 |
| Lighting | 温暖的日光、偏冷的环境阴影、适度 AO | 必须 |
| Colors | 自然、统一、适度鲜明，避免霓虹色和过饱和 | 必须 |
| Detail | 中等几何细节、低纹理噪声、高整体可读性 | 必须 |
| Composition | 清晰、精致的建筑沙盘效果 | 建议 |
| Atmosphere | 明亮、舒适、宁静，带有 Pacific Northwest 氛围 | 建议 |

## 二、具体视觉规范

[原对话此处为第三方参考图片组件；本档案不转载。]

**01 — 建筑几何：Realistic Proportions**

保持真实的 Footprint、高度、建筑朝向与屋顶结构。简化窗框、砖缝和细小装饰，但不能删除具有辨识度的主要建筑特征。

原则：Simplify details, not identity.

---

[原对话此处为第三方参考图片组件；本档案不转载。]

**02 — 光照：Soft Cel Shading**

使用两到三档主要明暗层次。保留柔和的环境遮蔽、自然的接触阴影，以及适度的冷暖对比。避免纯黑阴影和强烈硬切边界。

原则：Graphic lighting with natural depth.

---

[原对话此处为第三方参考图片组件；本档案不转载。]

**03 — 植被：Stylized Organic Forms**

树冠采用清晰的团块结构，不逐片模拟树叶。使用不同大小、明度和色温的绿植，混合针叶树与阔叶树，形成自然的视觉层次。

原则：Rich silhouettes, low visual noise.

---

[原对话此处为第三方参考图片组件；本档案不转载。]

**04 — 环境：Architectural Diorama**

草坪、道路、广场和步行路径必须有明确的材质与颜色区分。地面可以有轻微色调变化，避免完全平坦的纯色，同时避免照片纹理带来的噪声。

原则：Readable from far, convincing up close.

## 三、标准调色板

以下是基于当前概念图提炼的建议色值，不要求所有材质严格使用同一个颜色。

整体色彩规则是 **中等饱和度、较高明度、暖色建筑搭配自然绿色环境**。不要让所有建筑使用同样的暖黄色，也不要让树木全部使用同一个绿色。

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

## 四、视角和细节规则

这一部分对 OpenCampus 的交互尤其重要。

|  | Overview | First Person |
|--------|--------|--------|
| 建筑 | 清晰的体块、屋顶、主色块 | 窗户、入口、材质分区 |
| 植被 | 大量清晰的树冠体积 | 更细致的枝干与树冠 |
| 描边 | 细微甚至隐藏 | 选择性突出重要轮廓 |
| 阴影 | 柔和、易读 | 更明显的接触阴影 |
| 贴图 | 低频色彩变化 | 适度增加材料特征 |
| UI | 地理标签、搜索导航 | 精简 HUD、交互提示 |

**关键规则：同一套建筑资产，不同视角采用不同的 LOD 和渲染细节，而不是制作两个独立的世界。**

## 五、禁止出现的风格偏差

- **Photorealism**：不使用高频照片纹理、复杂污渍或过度真实的反射。
- **Full Anime / Cartoon**：不夸张建筑比例，不使用过粗的黑色描边。
- **Low-poly Placeholder**：避免无材质的灰盒、无变化的纯色建筑。
- **Voxel / Pixel Art**：不刻意像素化、不限制几何为方块结构。
- **Overly Saturated**：避免霓虹色、过亮的草地或强烈的色彩冲突。
- **Excessive Detail**：不让砖缝、窗框、路面纹理压过建筑整体轮廓。

尤其要注意：**刚才的生成图是艺术方向参考，不是地理准确的 UO 数字重建。** 实际制作必须以原有 GIS、道路和建筑数据为准，不能把生成图里的建筑、河流或运动场直接当成真实地理数据。

## 六、可直接复用的 Style Prompt

下面这段适合作为后续生成建筑概念图、环境资产参考图，以及定义项目视觉风格的标准提示词。

**OpenCampus Style Definition**

Architectural Toon Realism. Stylized 3D architectural visualization with accurate real-world campus geometry, clean architectural silhouettes, soft 2–3 tone cel shading, subtle selective ink outlines, simplified PBR materials, warm natural daylight, cool ambient shadows, gentle ambient occlusion, rich stylized Pacific Northwest vegetation, natural brick and stone colors, low-noise textures, clear roads and pedestrian paths, polished miniature architectural diorama aesthetics.

Colorful, sharp, clean, but restrained. Preserve the original GIS layout, building footprints, proportions and recognizable architectural features. Avoid photorealism, heavy comic outlines, exaggerated cartoon proportions, oversaturated neon colors, visual clutter, and invented geographic features.

---

## 七、最终的设计哲学

我会给 OpenCampus 定义三个不可妥协的设计目标：

**Geographic Fidelity — 地理真实性**

世界结构必须可信，建筑应该能够被识别。

**Visual Coherence — 视觉一致性**

所有资产遵循相同的材质、光照、描边和配色语言。

**Scalable Readability — 多尺度可读性**

远景像精致地图，近景像可探索的三维校园。

最后有一个工程上的建议：**这份 Style Guide 应该控制 Render Pipeline 与 Asset Pipeline，但不应该改变基础 GIS 数据。** 建筑几何、地理位置、材质定义、渲染风格应当分层管理。

这样 Architectural Toon Realism 就不只是一组生图 Prompt，而是可以逐步落实到 Blender、Three.js、Godot、Unity 和 Unreal 的、可复现的 OpenCampus 美术规范。
