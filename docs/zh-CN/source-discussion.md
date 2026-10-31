[English](../source-discussion.md) | **简体中文**

> 此中文记录保留相应版本的历史背景；最新公开访问、模板和维护状态请参阅默认英文文档。

# 讨论来源与有效决策

来源：[UO校园三维建模技术 — 完整五轮讨论](https://chatgpt.com/share/6ae54fb0-e6cc-83e8-8958-51a084c6b7cb?ogimg=plain)，读取日期 2026-10-30。

## 对通用流水线有效的结论

- 用户从 Unreal 单引擎目标调整为 Blender 为核心的通用资产库，支持 Godot、Unity、Three.js 等下游。
- 用户希望先完成一个可重复的端到端闭环，再按区域和建筑持续迭代。
- 用户拒绝依赖可能限研究教学用途的 UO GIS，要求使用替代资源。
- 因而优先调查 USGS 3DEP、DOGAMI OLC、USDA NAIP 与自采照片，从具体已核验输入中独立恢复建筑轮廓与几何。
- 最后一轮讨论要求浏览器预览，Three.js 消费 Blender 导出的 GLB 与清单。
- 本次请求明确拆分通用 Pipeline 与 Open Campus: UO，并将两个 GitHub 仓库设为 private。

UO 首版不使用 UO 内部 GIS、OSM、Microsoft/Oregon 汇编建筑轮廓、Eugene GIS 或 Google Maps/Earth 3D 作为核心资产来源。通用工具本身不把某个数据提供者写死为依赖。

## 调查入口

- [USGS 3DEP](https://www.usgs.gov/3d-elevation-program/about-3dep-products-services)
- [DOGAMI LiDAR](https://www.oregon.gov/dogami/lidar/pages/help.aspx)
- [USGS 数据下载](https://www.usgs.gov/the-national-map-data-delivery/gis-data-download)
- [EarthExplorer](https://earthexplorer.usgs.gov/)

这些入口来自原讨论。v0.1 已在 UO downstream 下载并核验具体点云，来源与排除记录由 downstream 的 `data/metadata/source-audit.json` 维护。对话中的工具价格、性能目标等不自动成为已验证结果，实际采用时另行核验。

原讨论中的 MIT、CC BY 4.0、CC0 均为候选；本次未选定代码或资产许可证，未设置公开发布，也未发送原讨论中的申请邮件。
