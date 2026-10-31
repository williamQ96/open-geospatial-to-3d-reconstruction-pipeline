> 历史 README；公开状态、模板与许可证请参阅当前 [中文首页](../../README.zh-CN.md)。

# Open Geospatial-to-3D Reconstruction Pipeline

将经核验的地理数据转换为可编辑、可复用三维资产的通用重建流水线。以 Blender 为创作核心，以 GLB/glTF 和地理元数据连接浏览器及多种游戏引擎。

**状态：v0.3.0 增加贴合地形的基础道路／路径，保留多瓦片重建与独立语义注释。仓库为 private，作为长期维护的 upstream source。**

## v0.3 升级

- 可选 `corridors_file` 接收有来源记录的 WGS84 GeoJSON LineString，按 `road`／`path` 与估算宽度生成路面。
- 投影至场景米制坐标，裁剪 AOI；同类路口合并、道路与路径去重、剔除建筑覆盖区域。
- 路面逐一裁切原地形三角形后再三角化，保持相同高度与对角线，避免长路段悬空或穿入坡面。统一抬高 4 cm 防闪烁。
- Blender / GLB 保存独立道路、路径图层与来源；manifest 保留中心线、名称、宽度和 catalog SHA-256。
- 此功能不推断道路通行权、桥面、车道、路缘或实测铺装宽度。来源适配、具体街道与宽度配置留在 downstream。
- Shapely 最低版本升至 2.1，以使用约束三角化保留凹边界及孔洞。新增几何检查覆盖坡面、建筑避让、路口去重和无效来源。

## v0.2 升级

- 已在 2 × 2 km、9 个源瓦片的 downstream 实例上运行；局部点存储改为 float32，减少大区域处理峰值内存。
- 配置可提供 `annotations_file`，以独立名称/定位点注释资产。schema 验证后记录注释文件 SHA-256，保持几何与语义来源分离。
- 支持明确标记的近似 envelope，用于航测后建筑或未提取屋顶；不会把它们标成 LiDAR 实测几何。无法匹配的记录写入报告。
- Blender 对象保留 `asset_id`，并增加 `display_name`、`campus_id` 与 `name_match`。地面材质可由配置指定。
- 全部功能为通用机制，UO 名称、定位点和具体体块尺寸留在 downstream。

长期升级重点是重建方法、自动化、输入验证、地理精度、导出约定和可重复性。UO 下游也会长期维护，但主要升级具体校园的建筑几何、材质与场景内容。详见 [维护边界](../../MAINTENANCE.md)。

## v0.1 已实现

- 校验输入 LAZ 的 SHA-256、水平/垂直 CRS，按可配置 AOI 裁剪。
- 由 class-2 地面点生成米制局部地形，并做地面网格留出插值检查。
- 用高度、局部平面性与单回波比例提取保守的建筑白模候选。
- 使用真实 Blender 后台进程保存可编辑 `.blend` 并导出 GLB；输出 heightfield、来源、质量报告和 schema v1 场景清单。
- UO downstream 已验证 GLB 载入、坐标轴、地面高度、角色移动、碰撞和三种视角。

当前不支持自动立面重建、精确建筑语义、庭院、LOD 或任意 CRS 的自动重投影。输入必须已是相同的米制水平 CRS 与声明的垂直 CRS；不匹配会明确失败。

## 本地运行（Windows / Python 3.12）

```powershell
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.lock.txt
./.venv/Scripts/python.exe -m pip install --no-deps -e .
./.venv/Scripts/python.exe -m unittest discover -s tests -v
```

安装或解压 [Blender 4.5 LTS](https://www.blender.org/download/lts/)，然后：

```powershell
./.venv/Scripts/python.exe -m geospatial3d build `
  --config '../open campus 3D/configs/memorial-quad.json' `
  --workspace '../open campus 3D' `
  --output '../open campus 3D/exports/memorial-quad' `
  --blender 'C:/path/to/blender.exe' `
  --web-public '../open campus 3D/apps/web-preview/public/scene'
```

路径可调整；不依赖下游本地文件夹名称。初次运行会下载配置中固定校验和的源文件，之后复用已验证缓存。UO 源瓦片约 61 MB。生成的 `scene.blend`、`campus.glb`、`manifest.json`、`heightfield.json`、`sources.json` 和 `quality.json` 位于输出目录。

本次验证使用 Blender **4.5.15 LTS** 官方 Windows portable 包，SHA-256：`52dd02fd74877fa08e74b67d7854cf32468a232c02aaa19b6844c91285574f8d`。Python 精确依赖记录在 `requirements.lock.txt`；Blender 内部依赖由该 Blender 包提供。

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

当前使用 Python、laspy/lazrs、NumPy/SciPy、PyProj、Rasterio、Shapely 与 Blender Python API；依赖在 `pyproject.toml` 和锁文件中管理。PDAL、OpenCV 等为后续可选方法，不是当前运行要求。

## 设计原则

- 先完成一个小区域的可重复闭环，再逐步扩大覆盖和精度。
- 保留地理配准、输入来源、处理参数与输出版本；区分估算值和测量值。
- 使用 DTM 构建地面，DSM/点云辅助估算建筑与植被；不把 DSM 当作可行走地形。
- 每栋建筑独立、可替换；核心是可编辑 Mesh，3DGS 为可选视觉增强。
- Blender 源资产与下游运行时分离，避免绑定单一游戏引擎。
- 数据使用条件按具体输入核验；不因网页可下载就视为可自由再分发。

## 文档

- [架构与拟定交换约定](../architecture.md)
- [首个闭环路线](../roadmap.md)
- [讨论来源与有效决策](../source-discussion.md)
- [数据管理](../../data/README.md)

代码与资产许可证尚未选定。MIT、CC BY 和 CC0 曾在讨论中作为选项出现，目前不作授权选择，也不公开发布。
