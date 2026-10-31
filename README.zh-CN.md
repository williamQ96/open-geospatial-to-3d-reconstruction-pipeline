[English](README.md) | **简体中文**

# Open Geospatial-to-3D Reconstruction Pipeline

长期维护的通用上游，将核验后的地理数据转换为 Blender、GLB 与可交互的浏览器地图。**v0.7** 增加紧凑手机布局与Follow／第一人称上下半屏双指移动／转向，见[手机操作](docs/zh-CN/viewer-template.md#手机操作)。v0.6 增加[参数化立面与航拍植被线索](docs/zh-CN/progressive-modeling.md)，保留 v0.5 可选美术层和 v0.4 浏览器交互。上下游仓库均为 public。

## 浏览器模板

```powershell
python -m geospatial3d init-viewer --output ../my-explorer
cd ../my-explorer
npm ci
npm run dev
```

模板附合成示例，不携带 UO 地理数据、建筑、logo、部署身份或凭据。包含三种视角、移动碰撞、跳跃、缩放、搜索、45° 近景、标签、小地图和设置。

传入 `--scene-dir <导出目录>` 可创建自己的地图。修改 `public/viewer-profile.json`、场景与出生偏好完成项目定制。`sync-viewer --output <项目>` 按原有 hash 升级共享代码，保留资料并拒绝覆盖本地修改。见[模板文档](src/geospatial3d/templates/browser-explorer/README.zh-CN.md)。

## 推荐画风

首轮先做完整可辨识场景，允许明确记录的合理推测；精细和写实程度通过长期维护提高，不以完整测绘或照片级还原阻断发布。采用[地理骨架＋归档照片＋建筑模块＋开放航拍的混合方法](docs/zh-CN/progressive-modeling.md)，保留可编辑参数与独立地理证据。

[style 画风库](style/README.zh-CN.md)默认推荐 **Architectural Toon Realism（建筑卡通写实）**，综合考虑视觉可读性、制作成本、维护和运行。包含 UO 来源原始概念图、精确调色板、双语规范与评估计划，同时鼓励探索其他画风。模板仍默认合成白模，现支持可选美术 GLB／Toon；[UO 首个闭环](https://github.com/williamQ96/open-campus-uo/blob/main/docs/visual-pilot.md)已实现。

## 下游项目

| 项目 | 地图 | 源码 | 在线运行 |
| --- | --- | --- | --- |
| **Open Campus: UO** | UO 主 Eugene 校园 | [仓库](https://github.com/williamQ96/open-campus-uo) | [打开地图](https://williamq96.github.io/open-campus-uo/) |

这是[下游登记表](docs/zh-CN/downstream-projects.md)的第一条，后续可继续增加其他校园、街区和地图。

## 重建能力

核验 LAZ checksum 和水平／垂直 CRS，按 AOI 裁剪，多瓦片地面插值及内部留出检查，保守屋顶候选，独立语义定位点与明确近似体块，道路／步行路径贴合原地形三角面，Blender 独立对象与 GLB／heightfield／sources／quality／schema-v1 manifest 导出。

配置可给出资产署名，写入 Blender、GLB 版权字段和 manifest。实际地理精度、立面、桥面、测量路宽、任意 CRS 转换、LOD 与流式瓦片仍需后续实现或独立验证。

## 安装与测试

```powershell
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.lock.txt
./.venv/Scripts/python.exe -m pip install --no-deps -e .
./.venv/Scripts/python.exe -m unittest discover -s tests -v
```

重建使用 `python -m geospatial3d build --config <配置> --workspace <项目> --output <导出> --blender <可执行文件>`。浏览器模板另需 Node.js 与 npm；不运行重建时无需 Blender。包内附模板，可从 Python 安装创建独立项目。

## 维护与协议

通用方法、自动化和可复用交互回到上游；具体地区的数据、身份、模型与品牌留在下游。重建锁与模板锁独立，升级不伪造旧资产来源，也不覆盖人工精细模型。

建议每个具体地图维护 **`data/reference-images/`**，保存采用的照片／图片及作者、许可、日期、用途、来源链接与 hash，避免使用不能开放分发或导出资产的受限／授权不明素材。见[素材规范与自动核查](docs/zh-CN/reference-media.md)及 [UO 实例](https://github.com/williamQ96/open-campus-uo/tree/main/data/reference-images)。

代码与模板代码 **Apache-2.0**，原创文档和模型／设计贡献 **CC BY 4.0**。保留 NOTICE、署名和第三方条款，见[协议说明](LICENSING.zh-CN.md)。

[历史 README](docs/zh-CN/README-pre-template.md)保留早期实现记录；[架构](docs/zh-CN/architecture.md)与[方法说明](docs/zh-CN/viewer-template.md)提供更多背景。

[流量与统计](docs/zh-CN/analytics.md)：仓库流量私有归档与显式配置的 GoatCounter 网页／交互统计。
