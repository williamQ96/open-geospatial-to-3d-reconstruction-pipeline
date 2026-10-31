[English](../presentation-layers.md) | **简体中文**

# 可编辑美术展示层

v0.5 将历史／测量重建与可选美术层分离。首个消费者是 [UO 视觉闭环](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-pilot.md)。模板仍默认合成白模，不包含 UO 模型、照片、坐标。

`viewer-settings.json` 可通过 `presentation_url` 引用场景目录内的 version-1 JSON。其 `asset_url` 指向标准 PBR GLB；`replaces_building_ids` 明确原 manifest 中的被替换 ID，每个 ID 必须在新模型中有几何。可选 `landmark_building_ids` 区分照片参考地标与通用包络；`overview` 使用 glTF 东／上／南坐标；`lighting` 定义环境光、日光、颜色与目标；hash／status／credit 记录来源。

GLB 建筑节点保留 `asset_kind: building`、`asset_id`；景观使用 `landscape-surface`／`landscape-detail`。多 primitive 子节点继承父节点语义。加载器核验 ID、缺失几何和目录边界，多材质选中高亮彼此独立。只隐藏指定的原渲染节点，不改原 manifest、地形、标签、搜索、碰撞 footprint 或历史来源；相机使用显示几何。装饰楼梯／设施不自动成为导航碰撞体。

浏览器使用三采样 gradient 的 Toon 适配器，Settings 可切回 GLB 原 PBR 材质，保留线框和选中。不是跨引擎 shader 等价承诺。原型以几何饰线替代全屏装饰描边，地表用 polygon offset 解决远距离深度冲突；步行标签限附近一般建筑，选中目标优先。三视角、移动、搜索、小地图仍共享。

`init-viewer --scene-dir` 会在路径核验后复制美术 JSON／GLB；`sync-viewer` 只升级受管代码，保留下游资料。生成和运行时锁独立，不因 UI 升级伪造重建版本。执行程序化重建前须保存手工细化版本。

测试覆盖路径、多 primitive 元数据、独立高亮、材质切换、缺失几何、脚手架复制与越界；默认合成场景和下游真实美术 GLB 分别经过浏览器回归。首个 UO 记录约 7.9 MB 新增资源、43–124 draw calls，非通用预算或硬件 FPS 结论。完整地形仍整体绘制，分块／LOD、实例化植被、压缩和更多设备测试仍需进行。Toon 不天然更省性能。

[style 库](../../style/README.zh-CN.md)默认推荐建筑卡通写实，也欢迎其他画风使用同一分层契约。
