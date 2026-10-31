[English](implementation.md) | **简体中文** · [画风规范](README.zh-CN.md)

# 实现与评估计划

状态：方法提案，尚未实现美术渲染器。没有实测成本节省、FPS、材质基准或跨引擎一致性结论。

## 四层分离

1. 地理证据：坐标、footprint、地形、日期、可信度、稳定 ID。换画风不能把估算变成测量。
2. 可编辑资产：Blender 几何、材质槽、建筑组件、后续细节层次；保留手工修改及来源。
3. 交换交付：标准 glTF／GLB 几何、PBR 材质和语义元数据，保留可用的标准材质回退与独立源资产。
4. 渲染主题：明暗 ramp、选择性描边、曝光、阴影、距离细节。独立版本、可关闭昂贵效果。

glTF 核心材质采用 metallic-roughness PBR，任意 Toon shader 不是可直接移植的核心材质。Three.js 提供 MeshToonMaterial 的 gradient map 和用于选定对象的 OutlinePass，应作为适配器验证，不保证替换材质即可复现概念图。依据：[glTF](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials)、[MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html)、[OutlinePass](https://threejs.org/docs/pages/OutlinePass.html)。

## 分阶段闭环

| 阶段 | 交付 | 验收 |
| --- | --- | --- |
| 基线 | 固定地理场景、相机、白模与 PBR 参照 | 记录版本、设备、视口、设置和指标 |
| 环境 | 有依据的地面分类、路径、小型复用植被库 | 不从概念图推断真实道路、树木或水体 |
| 材质 | 砖、石、屋顶、玻璃、铺装材质族 | 保留 PBR 定义，检查三模式辨识度 |
| 地标试点 | 小片完整区域的入口、屋顶与立面特征 | 核验参考与远中近可读性，再扩展全校 |
| Toon 适配 | 柔和色阶、冷暖光、可选选择性描边 | 同场景对比 PBR，搜索与标签仍可读 |
| 扩展发布 | 距离细节、复用／实例化、按分析结果压缩 | 发布实测与回退，核验署名与稳定 ID |

UO 地标在下游维护，不写死进模板。通用渲染改动经数据中立实现和测试后再进入上游。当前 `init-viewer`／`sync-viewer` 不会复制 `style/` 文档。

## 成本与维护

有限材质库、复用立面／树木组件、地标优先可望减少独立照片级资产的重复劳动，但测绘、建模和 QA 仍需投入。记录每个地标／复用资产的工时、资料采集投入、导出大小、主题专用代码和升级成本；保存来源许可与 hash。高精度 Blender 源资产可以与较轻的网页导出并存。材质／调色版本独立于地理版本，其他地区可以替换植被与色彩。

## 运行评估

Toon 不天然更快。密集植被、透明、阴影、描边和全屏后处理都可能增加成本。一次增加一种效果，在相同场景和视角测量。

Follow／第一人称／Overview 均记录帧耗时中位数及 p95、draw calls、三角数、纹理／渲染目标内存估计、传输字节、冷暖加载时间、浏览器／设备／GPU、视口与画质。加入搜索选中和高密度区域场景；采用发布预设前先定义目标设备与预算，本档案不声称通用预算。

建议后续分级：Low 简化光照、无装饰描边／AO；Balanced 有边界的阴影和选择性描边；High 可增加接触阴影与植被。它们尚不是现有设置。降级不移除搜索标签、不改地理数据，保留标准 PBR 回退。

未来实现需验证：地理版本与 ID 一致，近似标记保留；三模式／跳跃／移动／搜索／所选标签／小地图正常；远近建筑可辨识；有设备相关实测；Blender 可编辑、GLB 有标准材质；新增资产来源与署名完整。其他画风采用相同功能与地理契约，记录各自取舍即可。

## Pilot status / 原型状态

The original plan above is retained. A first [UO visual pilot](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-pilot.md) now implements authored GLB layering, three-tone/PBR switching, selected architectural features and illustrative landscaping. LOD/streaming, full-screen outlines/AO and hardware performance validation remain future work. See [the implemented layer contract](../../docs/presentation-layers.md).
