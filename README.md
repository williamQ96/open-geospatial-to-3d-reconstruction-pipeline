# Open Geospatial-to-3D Reconstruction Pipeline

将经核验的地理数据转换为可编辑、可复用三维资产的通用重建流水线。以 Blender 为创作核心，以 GLB/glTF 和地理元数据连接浏览器及多种游戏引擎。

**状态：项目规划与仓库初始化。尚未实现处理工具或下载数据。仓库为 private。**

## 与 Open Campus: UO 的关系

本仓库负责可迁移的重建算法、自动化工具、导出和验证约定。[Open Campus: UO](https://github.com/williamQ96/open-campus-uo)负责校园区域配置、来源台账、资产与 Three.js 预览，是第一个下游实例。

UO 的边界、建筑名称、具体坐标原点和校园资产不写死在通用算法中。下游使用固定 Pipeline 版本、区域配置和源数据记录重复生成结果。

## 计划流程

```text
LiDAR / DEM / 正射影像 / 自采照片
  → 来源核验与坐标归一化
  → 地形、建筑候选点、独立建筑轮廓与几何
  → Blender 场景与独立资产
  → GLB/glTF + 元数据 + 瓦片清单
  → 下游预览与引擎适配
```

候选工具包括 Python、PDAL、GDAL/Rasterio、Shapely、OpenCV 和 Blender Python API。它们是技术调查方向，依赖及版本尚未确定。

## 设计原则

- 先完成一个小区域的可重复闭环，再逐步扩大覆盖和精度。
- 保留地理配准、输入来源、处理参数与输出版本；区分估算值和测量值。
- 使用 DTM 构建地面，DSM/点云辅助估算建筑与植被；不把 DSM 当作可行走地形。
- 每栋建筑独立、可替换；核心是可编辑 Mesh，3DGS 为可选视觉增强。
- Blender 源资产与下游运行时分离，避免绑定单一游戏引擎。
- 数据使用条件按具体输入核验；不因网页可下载就视为可自由再分发。

## 文档

- [架构与拟定交换约定](docs/architecture.md)
- [首个闭环路线](docs/roadmap.md)
- [讨论来源与有效决策](docs/source-discussion.md)
- [数据管理](data/README.md)

代码与资产许可证尚未选定。MIT、CC BY 和 CC0 曾在讨论中作为选项出现，目前不作授权选择，也不公开发布。
